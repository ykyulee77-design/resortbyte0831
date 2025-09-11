import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, getDoc, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Star, MessageCircle, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ResortReviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [resorts, setResorts] = useState<{ id: string; name: string }[]>([]);
  const [selectedResort, setSelectedResort] = useState('');
  const [companyMap, setCompanyMap] = useState<{ [id: string]: string }>({});
  const [userCompanyInfo, setUserCompanyInfo] = useState<{ id: string; name: string } | null>(null);
  const { user } = useAuth();
  
  // 댓글 관련 상태
  const [commentInputs, setCommentInputs] = useState<{ [reviewId: string]: string }>({});
  const [commentModal, setCommentModal] = useState<{
    isOpen: boolean;
    reviewId: string;
    review: any;
  }>({
    isOpen: false,
    reviewId: '',
    review: null
  });
  const [showCommentForm, setShowCommentForm] = useState(false);

  // 리조트 목록 가져오기
  useEffect(() => {
    const fetchResorts = async () => {
      const snapshot = await getDocs(collection(db, 'companyInfo'));
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      })).filter(r => r.name);
      setResorts(list);
    };
    fetchResorts();
  }, []);

  // 회사 정보 매핑
  useEffect(() => {
    const fetchCompanies = async () => {
      const snap = await getDocs(collection(db, 'companyInfo'));
      const map: { [id: string]: string } = {};
      snap.docs.forEach(doc => {
        map[doc.id] = doc.data().name;
      });
      setCompanyMap(map);
    };
    fetchCompanies();
  }, []);

  // 사용자가 리조트 담당자인지 확인
  useEffect(() => {
    const checkUserCompany = async () => {
      if (!user) {
        setUserCompanyInfo(null);
        return;
      }

      try {
        const companyQuery = query(
          collection(db, 'companyInfo'),
          where('employerId', '==', user.uid)
        );
        const companySnapshot = await getDocs(companyQuery);
        
        if (!companySnapshot.empty) {
          const companyDoc = companySnapshot.docs[0];
          setUserCompanyInfo({
            id: companyDoc.id,
            name: companyDoc.data().name
          });
        } else {
          setUserCompanyInfo(null);
        }
      } catch (error) {
        console.error('사용자 회사 정보 확인 실패:', error);
        setUserCompanyInfo(null);
      }
    };

    checkUserCompany();
  }, [user]);

  // 리뷰 데이터 가져오기
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviewsQuery = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(reviewsQuery);
        let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (!data || data.length === 0) {
          const snapAll = await getDocs(collection(db, 'reviews'));
          const all = snapAll.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const sortedAll = all.sort((a: any, b: any) => {
            const dateA: any = (a as any).createdAt || (a as any).date;
            const dateB: any = (b as any).createdAt || (b as any).date;
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            const timeA = dateA.toDate ? dateA.toDate().getTime() : new Date(dateA).getTime();
            const timeB = dateB.toDate ? dateB.toDate().getTime() : new Date(dateB).getTime();
            return timeB - timeA;
          });
          setReviews(sortedAll);
          return;
        }
        setReviews(data);
      } catch (error) {
        const snap = await getDocs(collection(db, 'reviews'));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sortedData = data.sort((a: any, b: any) => {
          const dateA: any = (a as any).createdAt || (a as any).date;
          const dateB: any = (b as any).createdAt || (b as any).date;
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          const timeA = dateA.toDate ? dateA.toDate().getTime() : new Date(dateA).getTime();
          const timeB = dateB.toDate ? dateB.toDate().getTime() : new Date(dateB).getTime();
          return timeB - timeA;
        });
        setReviews(sortedData);
      }
    };
    fetchReviews();
  }, []);

  const filteredReviews = selectedResort
    ? reviews.filter(r => r.resort === selectedResort)
    : reviews;

  // 평균 별점 계산
  const avgOverallRating = filteredReviews.length > 0
    ? (filteredReviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / filteredReviews.length).toFixed(1)
    : null;
    
  const avgAccommodationRating = filteredReviews.length > 0
    ? (filteredReviews.reduce((sum, r) => sum + (r.accommodationRating || 0), 0) / filteredReviews.length).toFixed(1)
    : null;

  // 댓글 추가 함수
  const handleAddComment = async (reviewId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const isEmployer = userCompanyInfo !== null;
      
      if (isEmployer) {
        const review = reviews.find(r => r.id === reviewId);
        if (!review || review.resort !== userCompanyInfo.id) {
          alert('자신의 리조트 리뷰에만 댓글을 달 수 있습니다.');
          return;
        }
      }

      const commentData = {
        content: content.trim(),
        userName: isEmployer ? userCompanyInfo.name : (user.displayName || user.email || '익명'),
        userId: user.uid,
        isEmployer: isEmployer,
        companyId: isEmployer ? userCompanyInfo.id : null,
        createdAt: new Date(),
        reviewId: reviewId
      };

      const reviewRef = doc(db, 'reviews', reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (reviewDoc.exists()) {
        const currentComments = reviewDoc.data().comments || [];
        const updatedComments = [...currentComments, commentData];
        
        await updateDoc(reviewRef, {
          comments: updatedComments,
          updatedAt: new Date()
        });

        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, comments: updatedComments }
            : review
        ));

        setCommentInputs(prev => ({ ...prev, [reviewId]: '' }));
        alert('댓글이 추가되었습니다.');
      }
    } catch (error) {
      console.error('댓글 추가 실패:', error);
      alert('댓글 추가에 실패했습니다.');
    }
  };

  // 댓글 삭제 함수
  const handleDeleteComment = async (reviewId: string, commentIndex: number) => {
    if (!user) return;

    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (reviewDoc.exists()) {
        const currentComments = reviewDoc.data().comments || [];
        const commentToDelete = currentComments[commentIndex];
        
        const canDelete = user.uid === commentToDelete.userId || 
                         (userCompanyInfo && commentToDelete.companyId === userCompanyInfo.id);
        
        if (!canDelete) {
          alert('댓글을 삭제할 권한이 없습니다.');
          return;
        }

        const updatedComments = currentComments.filter((_: any, index: number) => index !== commentIndex);
        
        await updateDoc(reviewRef, {
          comments: updatedComments,
          updatedAt: new Date()
        });

        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, comments: updatedComments }
            : review
        ));

        alert('댓글이 삭제되었습니다.');
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
        {/* 페이지 제목 */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">리조트바이트 후기</h1>
          <p className="text-gray-600">실제 경험자들의 솔직한 후기와 리조트별 평가</p>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {/* 상단 액션 바 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                후기 ({filteredReviews.length}개)
              </h2>
              
              {/* 리조트 필터 */}
              <select 
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-resort-500" 
                value={selectedResort} 
                onChange={e => setSelectedResort(e.target.value)}
              >
                <option value="">전체 리조트</option>
                {resorts.length === 0 && <option disabled>등록된 리조트가 없습니다</option>}
                {resorts.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            
            {/* 후기 작성 버튼 */}
            {user ? (
              <Link 
                to="/reviews/new" 
                className="bg-resort-600 text-white px-4 py-2 rounded-lg hover:bg-resort-700 font-semibold transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                후기 작성
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-semibold transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                로그인 후 후기 작성
              </Link>
            )}
          </div>

          {/* 평균 별점 표시 */}
          {(avgOverallRating || avgAccommodationRating) && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">평균 별점</h3>
              <div className="flex flex-wrap gap-6">
                {avgOverallRating && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="text-lg font-bold text-yellow-600">{avgOverallRating}</span>
                    </div>
                    <span className="text-gray-600">전체 평균</span>
                  </div>
                )}
                {avgAccommodationRating && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-green-400 fill-current" />
                      <span className="text-lg font-bold text-green-600">{avgAccommodationRating}</span>
                    </div>
                    <span className="text-gray-600">기숙사 평균</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 리뷰 목록 */}
          {filteredReviews.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg shadow-sm border">
              <Star className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">
                아직 등록된 후기가 없습니다
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                리조트에서의 경험을 후기로 남기고, 다른 크루들에게 도움이 되는 정보를 공유해보세요.
              </p>
              {user ? (
                <Link 
                  to="/reviews/new" 
                  className="bg-resort-600 text-white px-8 py-4 rounded-lg hover:bg-resort-700 font-semibold transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  첫 번째 후기 작성하기
                </Link>
              ) : (
                <Link 
                  to="/login" 
                  className="bg-gray-500 text-white px-8 py-4 rounded-lg hover:bg-gray-600 font-semibold transition-colors inline-flex items-center gap-2"
                >
                  로그인하기
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReviews.map(r => (
                <div 
                  key={r.id} 
                  className="bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => {
                    setCommentModal({
                      isOpen: true,
                      reviewId: r.id,
                      review: r
                    });
                    setShowCommentForm(false);
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-resort-600 truncate">
                        {companyMap[r.resort] || r.resort}
                      </h3>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{r.user}</span>
                      <span className="text-xs text-gray-400">
                        {r.date && r.date.toDate ? r.date.toDate().toLocaleDateString('ko-KR') : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs font-medium text-yellow-600">{r.overallRating || 0}</span>
                      </div>
                      {r.accommodationRating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-green-400 fill-current" />
                          <span className="text-xs font-medium text-green-600">{r.accommodationRating}</span>
                        </div>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MessageCircle className="w-3 h-3" />
                        {r.comments ? r.comments.length : 0}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">{r.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* 하단 CTA */}
          <div className="mt-16 bg-resort-600 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              당신의 리조트 경험을 공유해보세요
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              리조트에서의 실제 경험을 후기로 남기고, 
              다른 크루들이 더 나은 선택을 할 수 있도록 도와주세요.
            </p>
            {user ? (
              <Link 
                to="/reviews/new" 
                className="bg-white text-resort-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                후기 작성하기
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-resort-600 transition-colors"
              >
                로그인하기
              </Link>
            )}
          </div>
        </div>

        {/* 댓글 모달 */}
        {commentModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">댓글</h3>
                <button
                  onClick={() => setCommentModal({ isOpen: false, reviewId: '', review: null })}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 리뷰 정보 */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-resort-600">{commentModal.review?.user}</span>
                  <span className="text-sm text-gray-500">
                    {commentModal.review?.date?.toDate?.()?.toLocaleDateString() || ''}
                  </span>
                  <span className="text-sm text-gray-500">
                    {companyMap[commentModal.review?.resort] || commentModal.review?.resort}
                  </span>
                </div>
                <p className="text-gray-800">{commentModal.review?.content}</p>
              </div>

              {/* 댓글 목록 */}
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                  댓글 ({commentModal.review?.comments ? commentModal.review.comments.length : 0})
                </h4>
                
                {commentModal.review?.comments && commentModal.review.comments.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {commentModal.review.comments.map((comment: any, commentIndex: number) => (
                      <div key={commentIndex} className={`flex items-start gap-3 rounded-lg p-4 ${
                        comment.isEmployer ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          comment.isEmployer ? 'bg-orange-100' : 'bg-blue-100'
                        }`}>
                          <span className={`text-sm font-medium ${
                            comment.isEmployer ? 'text-orange-600' : 'text-blue-600'
                          }`}>
                            {comment.isEmployer ? '리' : '크'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {comment.userName || '익명'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {comment.createdAt?.toDate?.()?.toLocaleDateString?.('ko-KR') || ''}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{comment.content}</p>
                          
                          {/* 댓글 삭제 버튼 */}
                          {user && (user.uid === comment.userId || 
                            (userCompanyInfo && comment.companyId === userCompanyInfo.id)) && (
                            <button
                              onClick={() => {
                                handleDeleteComment(commentModal.reviewId, commentIndex);
                                setCommentModal({ isOpen: false, reviewId: '', review: null });
                              }}
                              className="text-xs text-red-600 hover:text-red-800 transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              삭제
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg mb-6">
                    아직 댓글이 없습니다.
                  </p>
                )}

                {/* 댓글 작성 섹션 */}
                {!showCommentForm ? (
                  <div className="text-center py-6">
                    {user ? (
                      <button
                        onClick={() => setShowCommentForm(true)}
                        className={`px-6 py-3 text-sm font-medium text-white rounded-lg transition-colors ${
                          userCompanyInfo && commentModal.review?.resort === userCompanyInfo.id 
                            ? 'bg-orange-600 hover:bg-orange-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {userCompanyInfo && commentModal.review?.resort === userCompanyInfo.id 
                          ? `💬 ${userCompanyInfo.name} 답글 작성하기` 
                          : '💬 댓글 작성하기'
                        }
                      </button>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-600 mb-3">댓글을 작성하려면 로그인이 필요합니다</p>
                        <Link
                          to="/login"
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                        >
                          로그인하기
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`border rounded-lg p-4 ${
                    userCompanyInfo && commentModal.review?.resort === userCompanyInfo.id 
                      ? 'bg-orange-50 border-orange-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className={`text-sm font-medium flex items-center gap-2 ${
                        userCompanyInfo && commentModal.review?.resort === userCompanyInfo.id 
                          ? 'text-orange-800' 
                          : 'text-blue-800'
                      }`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          userCompanyInfo && commentModal.review?.resort === userCompanyInfo.id 
                            ? 'bg-orange-100' 
                            : 'bg-blue-100'
                        }`}>
                          <span className={`text-xs ${
                            userCompanyInfo && commentModal.review?.resort === userCompanyInfo.id 
                              ? 'text-orange-600' 
                              : 'text-blue-600'
                          }`}>
                            {userCompanyInfo && commentModal.review?.resort === userCompanyInfo.id ? '🏢' : '💬'}
                          </span>
                        </span>
                        {userCompanyInfo && commentModal.review?.resort === userCompanyInfo.id 
                          ? `${userCompanyInfo.name} 답글 작성` 
                          : '댓글 작성'
                        }
                      </h5>
                      
                      <button
                        onClick={() => setShowCommentForm(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {user ? (
                      <div className="space-y-3">
                        {userCompanyInfo && commentModal.review?.resort === userCompanyInfo.id ? (
                          <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
                            <strong>리조트 담당자 권한:</strong> {userCompanyInfo.name}으로 답글을 작성합니다.
                          </div>
                        ) : null}
                        
                        <textarea
                          placeholder={userCompanyInfo && commentModal.review?.resort === userCompanyInfo.id 
                            ? "리조트 담당자로서 답글을 작성해주세요..." 
                            : "댓글을 작성해주세요..."
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={3}
                          value={commentInputs[commentModal.reviewId] || ''}
                          onChange={(e) => {
                            setCommentInputs(prev => ({
                              ...prev,
                              [commentModal.reviewId]: e.target.value
                            }));
                          }}
                        />
                        
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium ${
                            userCompanyInfo && commentModal.review?.resort === userCompanyInfo.id 
                              ? 'text-orange-600' 
                              : 'text-blue-600'
                          }`}>
                            {userCompanyInfo && commentModal.review?.resort === userCompanyInfo.id 
                              ? `${userCompanyInfo.name} 담당자` 
                              : '크루'
                            }로 댓글 작성
                          </span>
                          <span className="text-xs text-gray-500">
                            ({commentInputs[commentModal.reviewId]?.length || 0}자)
                          </span>
                          <button
                            onClick={() => {
                              handleAddComment(commentModal.reviewId, commentInputs[commentModal.reviewId] || '');
                              setCommentModal({ isOpen: false, reviewId: '', review: null });
                              setShowCommentForm(false);
                            }}
                            disabled={!commentInputs[commentModal.reviewId] || commentInputs[commentModal.reviewId].trim().length === 0}
                            className={`px-4 py-2 text-sm text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium ${
                              userCompanyInfo && commentModal.review?.resort === userCompanyInfo.id 
                                ? 'bg-orange-600 hover:bg-orange-700' 
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {userCompanyInfo && commentModal.review?.resort === userCompanyInfo.id ? '답글 작성' : '댓글 작성'}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ResortReviews;

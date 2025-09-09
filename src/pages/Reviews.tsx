import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, deleteDoc, doc, getDoc, updateDoc, where } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, deleteObject } from 'firebase/storage';
import HomeLayout from '../components/HomeLayout';
import VideoPreviewModal from '../components/VideoPreviewModal';
import ShareModal from '../components/ShareModal';
import { Share2, Heart, MessageCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [resorts, setResorts] = useState<{ id: string; name: string }[]>([]);
  const [selectedResort, setSelectedResort] = useState('');
  const [companyMap, setCompanyMap] = useState<{ [id: string]: string }>({});
  const [userCompanyInfo, setUserCompanyInfo] = useState<{ id: string; name: string } | null>(null);
  const { user } = useAuth();
  const [videoModal, setVideoModal] = useState<{
    isOpen: boolean;
    videoUrl: string;
    videoName: string;
  }>({
    isOpen: false,
    videoUrl: '',
    videoName: '',
  });

  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    title: string;
    description: string;
    resortName: string;
  }>({
    isOpen: false,
    mediaUrl: '',
    mediaType: 'image',
    title: '',
    description: '',
    resortName: '',
  });

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
        // 사용자가 리조트 담당자인지 확인
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

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // createdAt 필드로 정렬 시도
        console.log('Firebase에서 reviews 데이터를 가져오는 중...');
        const reviewsQuery = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(reviewsQuery);
        let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Firebase에서 가져온 reviews 데이터:', data);
        console.log('reviews 개수:', data.length);

        // 서버 정렬 결과가 비어있으면 전체 조회 후 클라이언트 정렬
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
        // createdAt 필드가 없는 경우 전체 데이터를 가져와서 클라이언트에서 정렬
        console.log('createdAt 필드로 정렬 실패, 클라이언트에서 정렬합니다. 오류:', error);
        const snap = await getDocs(collection(db, 'reviews'));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('클라이언트에서 가져온 reviews 데이터:', data);
        console.log('reviews 개수:', data.length);
        
        // 날짜 필드 기준으로 정렬 (createdAt 또는 date)
        const sortedData = data.sort((a: any, b: any) => {
          const dateA: any = (a as any).createdAt || (a as any).date;
          const dateB: any = (b as any).createdAt || (b as any).date;
          
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          
          const timeA = dateA.toDate ? dateA.toDate().getTime() : new Date(dateA).getTime();
          const timeB = dateB.toDate ? dateB.toDate().getTime() : new Date(dateB).getTime();
          
          return timeB - timeA; // 최신순 정렬
        });
        
        console.log('정렬된 reviews 데이터:', sortedData);
        setReviews(sortedData);
      }
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    const fetchMedia = async () => {
      const mediaQuery = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(mediaQuery);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedia(data);
    };
    fetchMedia();
  }, []);

  const filteredReviews = selectedResort
    ? reviews.filter(r => r.resort === selectedResort)
    : reviews;

  const filteredMedia = selectedResort
    ? media.filter(m => m.resort === selectedResort)
    : media;

  // 평균 별점 계산
  const avgOverallRating = filteredReviews.length > 0
    ? (filteredReviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / filteredReviews.length).toFixed(1)
    : null;
    
  const avgAccommodationRating = filteredReviews.length > 0
    ? (filteredReviews.reduce((sum, r) => sum + (r.accommodationRating || 0), 0) / filteredReviews.length).toFixed(1)
    : null;

  // 동영상 모달 열기
  const handleVideoPreview = (videoUrl: string, videoName: string) => {
    setVideoModal({
      isOpen: true,
      videoUrl,
      videoName,
    });
  };

  // 동영상 모달 닫기
  const handleVideoModalClose = () => {
    setVideoModal({
      isOpen: false,
      videoUrl: '',
      videoName: '',
    });
  };

  // 공유 모달 열기
  const handleShareModalOpen = (item: any) => {
    setShareModal({
      isOpen: true,
      mediaUrl: item.fileUrl,
      mediaType: item.fileType?.startsWith('image') ? 'image' : 'video',
      title: item.description,
      description: item.description,
      resortName: companyMap[item.resort] || '알 수 없는 리조트',
    });
  };

  // 게시자가 직접 삭제
  const handleDeleteMedia = async (item: any) => {
    if (!user?.uid) {
      alert('로그인 후 삭제할 수 있습니다.');
      return;
    }
    if (item.userId && item.userId !== user.uid) {
      alert('게시자만 삭제할 수 있습니다.');
      return;
    }
    if (!confirm('이 미디어를 삭제하시겠습니까?')) return;
    try {
      // Storage 삭제 (URL로 참조)
      const fileRef = ref(storage, item.fileUrl);
      await deleteObject(fileRef).catch(() => {});
      // Firestore 문서 삭제
      await deleteDoc(doc(db, 'media', item.id));
      // 로컬 목록 갱신
      setMedia(prev => prev.filter(m => m.id !== item.id));
      alert('삭제되었습니다.');
    } catch (e) {
      console.error('미디어 삭제 실패:', e);
      alert('삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  // 공유 모달 닫기
  const handleShareModalClose = () => {
    setShareModal({
      isOpen: false,
      mediaUrl: '',
      mediaType: 'image',
      title: '',
      description: '',
      resortName: '',
    });
  };

  // 댓글 추가 함수
  const handleAddComment = async (reviewId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      // 리조트 담당자인지 확인
      const isEmployer = userCompanyInfo !== null;
      
      // 리조트 담당자인 경우, 해당 리조트의 리뷰에만 댓글 가능
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

      // Firestore에 댓글 추가
      const reviewRef = doc(db, 'reviews', reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (reviewDoc.exists()) {
        const currentComments = reviewDoc.data().comments || [];
        const updatedComments = [...currentComments, commentData];
        
        await updateDoc(reviewRef, {
          comments: updatedComments,
          updatedAt: new Date()
        });

        // 로컬 상태 업데이트
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, comments: updatedComments }
            : review
        ));

        // 댓글 입력 필드 초기화
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
        
        // 권한 확인 (작성자 또는 해당 리조트 담당자만 삭제 가능)
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

        // 로컬 상태 업데이트
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
    <HomeLayout>
      <div className="max-w-3xl mx-auto py-12 px-4">
        {/* 사진/쇼츠 게시 섹션 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-resort-600 flex items-center gap-2">
              <span role="img" aria-label="camera">📸</span> 리조트바이트 사진 & 쇼츠
            </h2>
            {user ? (
              <Link to="/reviews/media/new" className="bg-resort-500 text-white px-3 py-1 rounded hover:bg-resort-700 text-sm font-semibold">사진/쇼츠 올리기</Link>
            ) : (
              <Link to="/login" className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-sm font-semibold">로그인 후 업로드</Link>
            )}
          </div>
          {/* 실제 업로드된 미디어 표시 */}
          {filteredMedia.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <span className="text-4xl">📸</span>
              <p className="text-gray-500 mt-2">아직 업로드된 사진/쇼츠가 없습니다</p>
              {user ? (
                <Link to="/reviews/media/new" className="text-resort-600 hover:underline text-sm">
                  첫 번째 사진/쇼츠를 업로드해보세요
                </Link>
              ) : (
                <Link to="/login" className="text-gray-600 hover:underline text-sm">
                  로그인 후 업로드할 수 있습니다
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredMedia.slice(0, 8).map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="relative">
                    {item.fileType && item.fileType.startsWith('image') ? (
                      <img 
                        src={item.fileUrl} 
                        alt={item.description}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div 
                        className="relative w-full h-32 bg-gray-900 cursor-pointer"
                        onClick={() => handleVideoPreview(item.fileUrl, item.description)}
                      >
                        <video 
                          src={item.fileUrl} 
                          className="w-full h-full object-cover"
                          preload="metadata"
                          onError={(e) => {
                            console.error('동영상 로드 실패:', item.fileUrl);
                            (e as any).currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 transition-all">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* 공유 버튼 */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareModalOpen(item);
                        }}
                        className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 hover:text-blue-600 rounded-full p-2 shadow-md transition-colors"
                        title="공유하기"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <p className="text-xs text-gray-600 mb-1">
                      {companyMap[item.resort] || '알 수 없는 리조트'}
                    </p>
                    <p className="text-sm text-gray-900 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">
                        {item.createdAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareModalOpen(item);
                          }}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="공유하기"
                        >
                          <Share2 className="w-3 h-3" />
                        </button>
                        {user && item.userId === user.uid && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMedia(item);
                            }}
                            className="text-gray-400 hover:text-red-600 transition-colors text-xs"
                            title="삭제"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold text-resort-600 mb-2">리조트바이트 이용자 후기</h1>
        <p className="text-gray-600 mb-4">실제 경험자들의 솔직한 후기와 리조트별 평가를 확인해보세요.</p>
        <div className="mb-4 flex gap-6">
          {avgOverallRating && (
            <div className="text-yellow-600 font-bold">
              전체 평균 별점: {avgOverallRating} / 5
            </div>
          )}
          {avgAccommodationRating && (
            <div className="text-green-600 font-bold">
              기숙사 평균 별점: {avgAccommodationRating} / 5
            </div>
          )}
        </div>
        <div className="flex justify-between items-center mb-6">
          <select className="border rounded px-3 py-2 text-sm" value={selectedResort} onChange={e => setSelectedResort(e.target.value)}>
            <option value="">전체 리조트</option>
            {resorts.length === 0 && <option disabled>등록된 리조트가 없습니다</option>}
            {resorts.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          {user ? (
            <Link to="/reviews/new" className="bg-resort-600 text-white px-4 py-2 rounded hover:bg-resort-700 text-sm font-semibold">후기 작성</Link>
          ) : (
            <Link to="/login" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm font-semibold">로그인 후 후기 작성</Link>
          )}
        </div>
        <div className="space-y-6">
          {filteredReviews.length === 0 ? (
            <div className="text-gray-500 text-center">등록된 후기가 없습니다.</div>
          ) : filteredReviews.map(r => (
            <div key={r.id} className="bg-white rounded-lg shadow p-4">
              {/* 리조트 정보 - 상단에 강조 */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-resort-600">
                    {companyMap[r.resort] || r.resort}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 text-lg">{'★'.repeat(r.overallRating || 0)}{'☆'.repeat(5 - (r.overallRating || 0))}</span>
                    {r.accommodationRating && (
                      <span className="text-green-400 text-sm">{'★'.repeat(r.accommodationRating)}{'☆'.repeat(5 - r.accommodationRating)} (기숙사)</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 작성자 정보와 날짜 */}
              <div className="flex items-center gap-3 mb-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-medium">크</span>
                  </span>
                  <span className="font-medium text-gray-900">{r.user}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span>{r.date && r.date.toDate ? r.date.toDate().toLocaleDateString('ko-KR') : ''}</span>
              </div>
              
              {/* 후기 내용 */}
              <div className="text-gray-800 text-sm mb-4 leading-relaxed">{r.content}</div>
              
              {/* 댓글 섹션 */}
              <div className="border-t border-gray-100 pt-4">
                <button
                  onClick={() => {
                    setCommentModal({
                      isOpen: true,
                      reviewId: r.id,
                      review: r
                    });
                    setShowCommentForm(false); // 모달 열 때 폼 숨기기
                  }}
                  className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors group p-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                    댓글 ({r.comments ? r.comments.length : 0})
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600">보기</span>
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
                

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 비디오 미리보기 모달 */}
      {videoModal.isOpen && (
        <VideoPreviewModal
          isOpen={videoModal.isOpen}
          onClose={handleVideoModalClose}
          videoUrl={videoModal.videoUrl}
          videoName={videoModal.videoName}
        />
      )}

      {/* 공유 모달 */}
      {shareModal.isOpen && (
        <ShareModal
          isOpen={shareModal.isOpen}
          onClose={handleShareModalClose}
          mediaUrl={shareModal.mediaUrl}
          mediaType={shareModal.mediaType}
          title={shareModal.title}
          description={shareModal.description}
          resortName={shareModal.resortName}
        />
      )}

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
                              // 모달 닫기
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
                // 댓글 작성 버튼
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
                // 댓글 작성 폼
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
                    
                    {/* 폼 닫기 버튼 */}
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
                      {/* 리조트 담당자인 경우 권한 안내 */}
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
                            // 모달과 폼 닫기
                            setCommentModal({ isOpen: false, reviewId: '', review: null });
                            setShowCommentForm(false);
                          }}
                          disabled={!commentInputs[commentModal.reviewId] || commentInputs[commentModal.reviewId].trim().length === 0}
                          className={`px-4 py-2 text-sm text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium ${
                            userCompanyInfo && commentModal.review?.resort === userCompanyInfo.id 
                              ? 'bg-orange-600 hover:bg-blue-700' 
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
    </HomeLayout>
  );
};

export default Reviews; 
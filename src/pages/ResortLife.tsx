import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import UsefulLinksPreviewWithFilter from '../components/UsefulLinksPreviewWithFilter';
import VideoPreviewModal from '../components/VideoPreviewModal';
import ShareModal from '../components/ShareModal';
import { Share2, Star, MessageCircle, Plus, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ResortLife: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [companyMap, setCompanyMap] = useState<{ [id: string]: string }>({});
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

  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    review: any;
  }>({
    isOpen: false,
    review: null,
  });

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

  // 리뷰 데이터 가져오기 (최대 10개)
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
          setReviews(sortedAll.slice(0, 10));
          return;
        }
        setReviews(data.slice(0, 10));
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
        setReviews(sortedData.slice(0, 10));
      }
    };
    fetchReviews();
  }, []);

  // 미디어 데이터 가져오기 (최대 5개)
  useEffect(() => {
    const fetchMedia = async () => {
      const mediaQuery = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(mediaQuery);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedia(data.slice(0, 5));
    };
    fetchMedia();
  }, []);

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

  // 후기 모달 열기
  const handleReviewClick = (review: any) => {
    setReviewModal({
      isOpen: true,
      review: review,
    });
  };

  // 후기 모달 닫기
  const handleReviewModalClose = () => {
    setReviewModal({
      isOpen: false,
      review: null,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 콘텐츠 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">리조트바이트 생활</h1>
          <p className="text-gray-600">리조트에서의 모든 정보를 한 곳에서</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 숏츠 섹션 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <span>📸</span> 숏츠
                    </h2>
                    <div className="flex items-center gap-2">
                      {user ? (
                        <Link 
                          to="/reviews/media/new" 
                          className="text-xs bg-resort-600 text-white px-2 py-1 rounded hover:bg-resort-700 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          숏츠 올리기
                        </Link>
                      ) : (
                        <Link 
                          to="/login" 
                          className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                        >
                          숏츠 올리기
                        </Link>
                      )}
                      <Link 
                        to="/resort-shorts" 
                        className="text-sm text-resort-600 hover:text-resort-700 flex items-center gap-1"
                      >
                        더보기
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  {media.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="text-4xl">📸</span>
                      <p className="text-gray-500 text-sm mt-2">아직 숏츠가 없습니다</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {media.map((item) => (
                        <div key={item.id} className="relative group cursor-pointer" onClick={() => {
                          if (item.fileType && !item.fileType.startsWith('image')) {
                            handleVideoPreview(item.fileUrl, item.description);
                          }
                        }}>
                          {item.fileType && item.fileType.startsWith('image') ? (
                            <img 
                              src={item.fileUrl} 
                              alt={item.description}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="relative w-full h-24 bg-gray-900 rounded-lg overflow-hidden">
                              <video 
                                src={item.fileUrl} 
                                className="w-full h-full object-cover"
                                preload="metadata"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-black bg-opacity-50 text-white rounded-full p-2">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 후기 섹션 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <span>⭐</span> 후기
                    </h2>
                    <div className="flex items-center gap-2">
                      {user ? (
                        <Link 
                          to="/reviews/new" 
                          className="text-xs bg-resort-600 text-white px-2 py-1 rounded hover:bg-resort-700 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          후기 작성
                        </Link>
                      ) : (
                        <Link 
                          to="/login" 
                          className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                        >
                          후기 작성
                        </Link>
                      )}
                      <Link 
                        to="/resort-reviews" 
                        className="text-sm text-resort-600 hover:text-resort-700 flex items-center gap-1"
                      >
                        더보기
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  {reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="text-4xl">⭐</span>
                      <p className="text-gray-500 text-sm mt-2">아직 후기가 없습니다</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {reviews.map((r) => (
                        <div 
                          key={r.id} 
                          className="border-b border-gray-100 pb-2 last:border-b-0 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                          onClick={() => handleReviewClick(r)}
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
                </div>
              </div>
            </div>
          </div>

          {/* 생활 가이드 섹션 */}
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span>📚</span> 생활 가이드
                  </h2>
                  <div className="flex items-center gap-2">
                    {user ? (
                      <Link 
                        to="/resort-life-guide" 
                        className="text-xs bg-resort-600 text-white px-2 py-1 rounded hover:bg-resort-700 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        링크 추가하기
                      </Link>
                    ) : (
                      <Link 
                        to="/login" 
                        className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                      >
                        링크 추가하기
                      </Link>
                    )}
                    <Link 
                      to="/resort-life-guide" 
                      className="text-sm text-resort-600 hover:text-resort-700 flex items-center gap-1"
                    >
                      더보기
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <UsefulLinksPreviewWithFilter />
              </div>
            </div>
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

      {/* 후기 상세 모달 */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">후기 상세</h3>
              <button
                onClick={handleReviewModalClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 후기 내용 */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-resort-600">
                  {companyMap[reviewModal.review?.resort] || reviewModal.review?.resort}
                </h4>
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-lg font-bold text-yellow-600">{reviewModal.review?.overallRating || 0}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">크</span>
                  </span>
                  <span className="font-medium text-gray-900">{reviewModal.review?.user}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span>{reviewModal.review?.date && reviewModal.review.date.toDate ? reviewModal.review.date.toDate().toLocaleDateString('ko-KR') : ''}</span>
              </div>
              
              <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap mb-6">
                {reviewModal.review?.content}
              </div>

              {/* 댓글 섹션 */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    댓글 ({reviewModal.review?.comments ? reviewModal.review.comments.length : 0})
                  </span>
                </div>
                
                {reviewModal.review?.comments && reviewModal.review.comments.length > 0 ? (
                  <div className="space-y-3">
                    {reviewModal.review.comments.map((comment: any, index: number) => (
                      <div key={index} className={`flex items-start gap-3 rounded-lg p-3 ${
                        comment.isEmployer ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          comment.isEmployer ? 'bg-orange-100' : 'bg-blue-100'
                        }`}>
                          <span className={`text-xs font-medium ${
                            comment.isEmployer ? 'text-orange-600' : 'text-blue-600'
                          }`}>
                            {comment.isEmployer ? '리' : '크'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {comment.userName || '익명'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {comment.createdAt?.toDate?.()?.toLocaleDateString?.('ko-KR') || ''}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                    아직 댓글이 없습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResortLife;

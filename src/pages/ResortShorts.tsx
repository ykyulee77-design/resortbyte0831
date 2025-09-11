import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import VideoPreviewModal from '../components/VideoPreviewModal';
import ShareModal from '../components/ShareModal';
import { Share2, Camera, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ResortShorts: React.FC = () => {
  const [media, setMedia] = useState<any[]>([]);
  const [resorts, setResorts] = useState<{ id: string; name: string }[]>([]);
  const [selectedResort, setSelectedResort] = useState('');
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

  // 미디어 데이터 가져오기
  useEffect(() => {
    const fetchMedia = async () => {
      const mediaQuery = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(mediaQuery);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedia(data);
    };
    fetchMedia();
  }, []);

  const filteredMedia = selectedResort
    ? media.filter(m => m.resort === selectedResort)
    : media;

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

  return (
    <div className="min-h-screen bg-gray-50">
        {/* 페이지 제목 */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">리조트바이트 숏츠</h1>
          <p className="text-gray-600">리조트에서의 특별한 순간들을 공유해보세요</p>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {/* 상단 액션 바 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                숏츠 ({filteredMedia.length}개)
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
            
            {/* 업로드 버튼 */}
            {user ? (
              <Link 
                to="/reviews/media/new" 
                className="bg-resort-600 text-white px-4 py-2 rounded-lg hover:bg-resort-700 font-semibold transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                숏츠 올리기
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-semibold transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                로그인 후 업로드
              </Link>
            )}
          </div>

          {/* 미디어 그리드 */}
          {filteredMedia.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg shadow-sm border">
              <Camera className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">
                아직 업로드된 숏츠가 없습니다
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                리조트에서의 특별한 순간들을 사진이나 동영상으로 기록하고 공유해보세요.
              </p>
              {user ? (
                <Link 
                  to="/reviews/media/new" 
                  className="bg-resort-600 text-white px-8 py-4 rounded-lg hover:bg-resort-700 font-semibold transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  첫 번째 숏츠 올리기
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
            <div className="space-y-3">
              {filteredMedia.map((item) => (
                <div key={item.id} className="bg-white rounded-lg border p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => item.fileType && item.fileType.startsWith('video') ? handleVideoPreview(item.fileUrl, item.description) : null}>
                  <div className="flex items-center gap-4">
                    {/* 썸네일 */}
                    <div className="flex-shrink-0">
                      {item.fileType && item.fileType.startsWith('image') ? (
                        <img 
                          src={item.fileUrl} 
                          alt={item.description}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center relative">
                          <video 
                            src={item.fileUrl} 
                            className="w-full h-full object-cover rounded-lg"
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black bg-opacity-50 text-white rounded-full p-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 콘텐츠 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-resort-600 truncate">
                            {companyMap[item.resort] || '알 수 없는 리조트'}
                          </h3>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">
                            {item.fileType && item.fileType.startsWith('video') ? '🎥 동영상' : '📸 사진'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {item.createdAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareModalOpen(item);
                          }}
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

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
    </div>
  );
};

export default ResortShorts;

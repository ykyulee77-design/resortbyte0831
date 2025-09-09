import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import HomeLayout from '../components/HomeLayout';
import VideoPreviewModal from '../components/VideoPreviewModal';
import ShareModal from '../components/ShareModal';
import { Share2, Upload, Camera, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ReviewsMediaForm: React.FC = () => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [resort, setResort] = useState('');
  const [resorts, setResorts] = useState<{ id: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
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

  const [uploadedMedia, setUploadedMedia] = useState<any>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchResorts = async () => {
      const companySnap = await getDocs(collection(db, 'companyInfo'));
      const companyList = companySnap.docs
        .map(doc => ({ id: doc.id, name: doc.data().name }))
        .filter(r => r.name);
      setResorts(companyList);
    };
    fetchResorts();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 검증 (50MB 제한)
      if (file.size > 50 * 1024 * 1024) {
        alert('파일 크기는 50MB 이하여야 합니다.');
        return;
      }

      // 파일 형식 검증
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      
      if (!allowedImageTypes.includes(file.type) && !allowedVideoTypes.includes(file.type)) {
        alert('지원하지 않는 파일 형식입니다. 이미지(JPG, PNG, GIF, WebP) 또는 동영상(MP4, WebM, OGG, MOV) 파일을 선택해주세요.');
        return;
      }

      setMediaFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFile || !description || !resort) {
      alert('사진/쇼츠, 설명, 리조트 선택을 모두 입력해 주세요.');
      return;
    }
    setUploading(true);
    try {
      // 1. Storage에 파일 업로드
      const storageRef = ref(storage, `media/${Date.now()}_${mediaFile.name}`);
      await uploadBytes(storageRef, mediaFile);
      const downloadURL = await getDownloadURL(storageRef);
      
      // 2. Firestore에 정보 저장
      const docRef = await addDoc(collection(db, 'media'), {
        description,
        resort,
        userId: user?.uid, // 사용자 ID 추가
        createdAt: serverTimestamp(),
        fileName: mediaFile.name,
        fileUrl: downloadURL,
        fileType: mediaFile.type,
      });

      // 3. 업로드된 미디어 정보 저장
      const uploadedMediaData = {
        id: docRef.id,
        description,
        resort,
        fileUrl: downloadURL,
        fileType: mediaFile.type,
        fileName: mediaFile.name,
      };
      setUploadedMedia(uploadedMediaData);

      alert('사진/쇼츠가 등록되었습니다! 공유하시겠습니까?');
    } catch (err) {
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 공유 모달 열기
  const handleShareModalOpen = () => {
    if (!uploadedMedia) return;
    
    const selectedResort = resorts.find(r => r.id === uploadedMedia.resort);
    setShareModal({
      isOpen: true,
      mediaUrl: uploadedMedia.fileUrl,
      mediaType: uploadedMedia.fileType?.startsWith('image') ? 'image' : 'video',
      title: uploadedMedia.description,
      description: uploadedMedia.description,
      resortName: selectedResort?.name || '알 수 없는 리조트',
    });
  };

  // 게시자 삭제
  const handleDelete = async () => {
    if (!uploadedMedia) return;
    if (!user?.uid) {
      alert('로그인 후 삭제할 수 있습니다.');
      return;
    }
    if (uploadedMedia.userId && uploadedMedia.userId !== user.uid) {
      alert('게시자만 삭제할 수 있습니다.');
      return;
    }
    if (!confirm('정말 이 미디어를 삭제하시겠습니까?')) return;
    try {
      // 1) Storage에서 파일 삭제
      const fileRef = ref(storage, uploadedMedia.fileUrl);
      await deleteObject(fileRef).catch(() => {});
      // 2) Firestore 문서 삭제
      await deleteDoc(doc(db, 'media', uploadedMedia.id));
      setUploadedMedia(null);
      alert('삭제되었습니다.');
    } catch (e) {
      console.error('삭제 실패:', e);
      alert('삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  // 간편 공유: 링크만 공유 (업로드/연동 없음)
  const handleQuickShare = async (platform: 'youtube' | 'tiktok' | 'instagram') => {
    if (!uploadedMedia) return;
    const shareTitle = uploadedMedia.description || '리조트바이트 생활';
    const shareUrl = uploadedMedia.fileUrl;
    const text = `${shareTitle}\n${shareUrl}`;

    // 1) Web Share API 우선 사용
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareTitle, url: shareUrl });
        return;
      } catch {}
    }

    // 2) 지원 안 되면 클립보드 복사 + 플랫폼 열기
    try {
      await navigator.clipboard.writeText(text);
      alert('링크가 클립보드에 복사되었습니다. 열리는 페이지에서 붙여넣기 해주세요.');
    } catch {}

    const targets: Record<typeof platform, string> = {
      youtube: 'https://www.youtube.com/',
      tiktok: 'https://www.tiktok.com/upload?lang=ko-KR',
      instagram: 'https://www.instagram.com/',
    } as const;
    window.open(targets[platform], '_blank');
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
    // 공유 모달이 닫히면 리뷰 페이지로 이동
    navigate('/reviews');
  };

  return (
    <HomeLayout>
      <div className="max-w-md mx-auto py-12 px-4">
        <button
          type="button"
          className="mb-4 text-resort-600 hover:underline flex items-center"
          onClick={() => navigate('/reviews')}
        >
          ← 리조트바이트 생활로 돌아가기
        </button>
        <h1 className="text-xl font-bold text-resort-600 mb-4">사진/쇼츠 올리기</h1>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium mb-1">리조트 선택</label>
            <select value={resort} onChange={e => setResort(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">리조트 선택</option>
              {resorts.length === 0 && <option disabled>등록된 리조트가 없습니다</option>}
              {resorts.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">사진/쇼츠 업로드</label>
            <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="w-full" />
            {previewUrl && (
              <div className="mt-2">
                {mediaFile && mediaFile.type.startsWith('image') ? (
                  <img src={previewUrl} alt="미리보기" className="w-full h-48 object-cover rounded" />
                ) : (
                  <div 
                    className="relative w-full h-48 bg-gray-900 rounded cursor-pointer"
                    onClick={() => handleVideoPreview(previewUrl, mediaFile?.name || '동영상 미리보기')}
                  >
                    <video 
                      src={previewUrl} 
                      className="w-full h-full object-cover rounded"
                      preload="metadata"
                      onError={(e) => {
                        console.error('동영상 미리보기 로드 실패:', previewUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black bg-opacity-50 text-white rounded-full p-4 hover:bg-opacity-70 transition-all">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">설명</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border rounded px-3 py-2" placeholder="사진/쇼츠에 대한 설명을 입력해 주세요" />
          </div>
          <button type="submit" className="w-full bg-resort-600 text-white py-2 rounded hover:bg-resort-700 font-semibold" disabled={uploading}>
            {uploading ? '업로드 중...' : '등록하기'}
          </button>

          {/* 업로드 성공 후 공유 버튼 */}
          {uploadedMedia && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    {uploadedMedia.fileType?.startsWith('image') ? (
                      <Camera className="w-4 h-4 text-green-600" />
                    ) : (
                      <Video className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">업로드 완료!</p>
                    <p className="text-xs text-green-600">이제 친구들과 공유해보세요</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShareModalOpen}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <Share2 className="w-4 h-4" />
                    공유하기
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    삭제
                  </button>
                </div>
              </div>

              {/* 간편 공유 버튼 그룹 */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickShare('youtube')}
                  className="px-3 py-1.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100"
                >
                  YouTube로 공유 (링크)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickShare('tiktok')}
                  className="px-3 py-1.5 text-xs bg-black text-white border border-gray-800 rounded hover:opacity-90"
                >
                  TikTok로 공유 (링크)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickShare('instagram')}
                  className="px-3 py-1.5 text-xs bg-pink-50 text-pink-700 border border-pink-200 rounded hover:bg-pink-100"
                >
                  Instagram으로 공유 (링크)
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* 동영상 모달 */}
      <VideoPreviewModal
        isOpen={videoModal.isOpen}
        onClose={handleVideoModalClose}
        videoUrl={videoModal.videoUrl}
        videoName={videoModal.videoName}
      />

      {/* 공유 모달 */}
      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={handleShareModalClose}
        mediaUrl={shareModal.mediaUrl}
        mediaType={shareModal.mediaType}
        title={shareModal.title}
        description={shareModal.description}
        resortName={shareModal.resortName}
      />
    </HomeLayout>
  );
};

export default ReviewsMediaForm; 
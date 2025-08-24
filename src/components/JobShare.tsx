import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { JobPost, JobShare as JobShareType } from '../types';
import { Share2, MessageCircle, Link as LinkIcon, Facebook, MessageSquare, Star } from 'lucide-react';

// Kakao 타입 선언 추가
declare global {
  interface Window {
    Kakao?: {
      Link: {
        sendDefault: (options: any) => void;
      };
    };
  }
}

interface JobShareProps {
  jobPost: JobPost;
  userId: string;
  onShare?: (shareData: JobShareType) => void;
}

const JobShare: React.FC<JobShareProps> = ({ jobPost, userId, onShare }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMethod, setShareMethod] = useState<'kakao' | 'facebook' | 'link' | 'message'>('link');
  const [sharedWith, setSharedWith] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const shareUrl = `${window.location.origin}/job/${jobPost.id}`;
  const shareText = `${jobPost.title} - ${jobPost.employerName}\n${jobPost.location}\n${jobPost.salary?.min?.toLocaleString()}원 ~ ${jobPost.salary?.max?.toLocaleString()}원\n\n${shareUrl}`;

  const handleShare = async (method: 'kakao' | 'facebook' | 'link' | 'message') => {
    setIsSharing(true);
    
    try {
      // Firestore에 공유 기록 저장
      const shareData: any = {
        jobseekerId: userId,
        jobPostId: jobPost.id,
        jobTitle: jobPost.title || '제목 없음',
        employerName: jobPost.employerName || jobPost.employerId || '회사명 없음',
        shareMethod: method,
        sharedAt: serverTimestamp(),
      };

      // sharedWith가 있을 때만 추가
      if (sharedWith && sharedWith.trim()) {
        shareData.sharedWith = sharedWith.trim();
      }

      const docRef = await addDoc(collection(db, 'jobShares'), shareData);

      // 실제 공유 실행
      switch (method) {
      case 'kakao':
        shareToKakao();
        break;
      case 'facebook':
        shareToFacebook();
        break;
      case 'link':
        copyToClipboard();
        break;
      case 'message':
        shareToMessage();
        break;
      }

      // 콜백 호출
      if (onShare) {
        // 실제 저장된 데이터를 가져와서 콜백에 전달
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
          const savedData = docSnapshot.data();
          const shareDataWithId = {
            id: docRef.id,
            ...savedData,
          };
          onShare(shareDataWithId as JobShareType);
        }
      }

      setShowShareModal(false);
      setSharedWith('');
    } catch (error) {
      console.error('공유 실패:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const shareToKakao = () => {
    // 카카오톡 공유 (실제 구현 시 카카오 SDK 필요)
    if (window.Kakao) {
      window.Kakao.Link.sendDefault({
        objectType: 'feed',
        content: {
          title: jobPost.title,
          description: `${jobPost.employerName} - ${jobPost.location}`,
          imageUrl: 'https://via.placeholder.com/300x200',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            title: '자세히 보기',
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
        ],
      });
    } else {
      // 카카오 SDK가 없는 경우 기본 공유
      window.open(`https://story.kakao.com/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`);
    }
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      alert('링크가 클립보드에 복사되었습니다!');
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      // 폴백: 텍스트 영역 생성
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('링크가 클립보드에 복사되었습니다!');
    }
  };

  const shareToMessage = () => {
    // SMS 공유 (모바일에서만 작동)
    if (navigator.share) {
      navigator.share({
        title: jobPost.title,
        text: shareText,
        url: shareUrl,
      });
    } else {
      // 폴백: 메일 공유
      window.open(`mailto:?subject=${encodeURIComponent(jobPost.title)}&body=${encodeURIComponent(shareText)}`);
    }
  };

  const ShareButton = ({ method, icon: Icon, label, color }: {
    method: 'kakao' | 'facebook' | 'link' | 'message';
    icon: any;
    label: string;
    color: string;
  }) => (
    <button
      onClick={() => handleShare(method)}
      disabled={isSharing}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${color} ${
        isSharing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <>
      {/* 공유 버튼 */}
      <button
        onClick={() => setShowShareModal(true)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        title="공고 공유하기"
      >
        <Share2 className="w-4 h-4" />
        공유하기
      </button>

      {/* 공유 모달 */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">공고 공유하기</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">{jobPost.title}</p>
            </div>

            {/* 공유 대상 입력 */}
            <div className="px-6 py-4 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                공유 대상 (선택사항)
              </label>
              <input
                type="text"
                value={sharedWith}
                onChange={(e) => setSharedWith(e.target.value)}
                placeholder="예: 친구 이름, 카카오톡 그룹명 등"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 공유 방법 선택 */}
            <div className="px-6 py-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">공유 방법 선택</h4>
              <div className="grid grid-cols-2 gap-3">
                <ShareButton
                  method="kakao"
                  icon={MessageCircle}
                  label="카카오톡"
                  color="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
                />
                <ShareButton
                  method="facebook"
                  icon={Facebook}
                  label="페이스북"
                  color="bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                />
                <ShareButton
                  method="link"
                  icon={LinkIcon}
                  label="링크 복사"
                  color="bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100"
                />
                <ShareButton
                  method="message"
                  icon={MessageSquare}
                  label="메시지"
                  color="bg-green-50 border-green-200 text-green-800 hover:bg-green-100"
                />
              </div>
            </div>

            {/* 공유 미리보기 */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">공유 내용 미리보기</h4>
              <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                <p className="font-medium">{jobPost.title}</p>
                <p>{jobPost.employerName} - {jobPost.location}</p>
                <p>{jobPost.salary?.min?.toLocaleString()}원 ~ {jobPost.salary?.max?.toLocaleString()}원</p>
                <p className="text-blue-600 mt-2">{shareUrl}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JobShare;

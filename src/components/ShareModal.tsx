import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Facebook, 
  Twitter, 
  Instagram, 
  MessageCircle,
  Check,
  Download
} from 'lucide-react';

// 카카오톡 SDK 타입 선언
declare global {
  interface Window {
    Kakao?: {
      Link: {
        sendDefault: (options: any) => void;
      };
    };
  }
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  title: string;
  description: string;
  resortName: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  title,
  description,
  resortName
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/reviews`;
  const shareText = `🏖️ ${resortName}에서 찍은 ${mediaType === 'image' ? '사진' : '쇼츠'}을(를) 리조트바이트에서 확인해보세요! 📸\n\n${description}\n\n${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('링크 복사 실패:', error);
    }
  };

  const handleShare = async (platform: string) => {
    const shareData = {
      title: `${resortName} ${mediaType === 'image' ? '사진' : '쇼츠'}`,
      text: description,
      url: shareUrl,
    };

    try {
      switch (platform) {
        case 'native':
          if (navigator.share) {
            await navigator.share(shareData);
          } else {
            await handleCopyLink();
          }
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
          break;
        case 'instagram':
          // Instagram은 웹에서 직접 공유가 제한적이므로 링크 복사
          await handleCopyLink();
          alert('Instagram에 공유하려면 링크를 복사하여 사용하세요.');
          break;
        case 'kakao':
          if (window.Kakao) {
            window.Kakao.Link.sendDefault({
              objectType: 'feed',
              content: {
                title: `${resortName} ${mediaType === 'image' ? '사진' : '쇼츠'}`,
                description: description,
                imageUrl: mediaType === 'image' ? mediaUrl : undefined,
                link: {
                  mobileWebUrl: shareUrl,
                  webUrl: shareUrl,
                },
              },
            });
          } else {
            await handleCopyLink();
          }
          break;
      }
    } catch (error) {
      console.error('공유 실패:', error);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resortName}_${mediaType}_${Date.now()}.${mediaType === 'image' ? 'jpg' : 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('다운로드 실패:', error);
      alert('다운로드에 실패했습니다.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">공유하기</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 미디어 미리보기 */}
        <div className="p-4">
          <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
            {mediaType === 'image' ? (
              <img 
                src={mediaUrl} 
                alt={title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <video 
                src={mediaUrl}
                className="w-full h-48 object-cover"
                controls
                preload="metadata"
              />
            )}
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
            <p className="text-sm text-gray-600">{description}</p>
            <p className="text-xs text-gray-500 mt-1">{resortName}</p>
          </div>
        </div>

        {/* 공유 옵션 */}
        <div className="p-4 border-t">
          <div className="grid grid-cols-4 gap-3 mb-4">
            <button
              onClick={() => handleShare('native')}
              className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-6 h-6 text-blue-600 mb-1" />
              <span className="text-xs text-gray-600">공유</span>
            </button>
            
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <Check className="w-6 h-6 text-green-600 mb-1" />
              ) : (
                <Copy className="w-6 h-6 text-gray-600 mb-1" />
              )}
              <span className="text-xs text-gray-600">
                {copied ? '복사됨' : '링크 복사'}
              </span>
            </button>
            
            <button
              onClick={() => handleShare('kakao')}
              className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-6 h-6 bg-yellow-400 rounded mb-1 flex items-center justify-center">
                <span className="text-xs font-bold text-black">K</span>
              </div>
              <span className="text-xs text-gray-600">카카오톡</span>
            </button>
            
            <button
              onClick={handleDownload}
              className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={downloading}
            >
              <Download className="w-6 h-6 text-green-600 mb-1" />
              <span className="text-xs text-gray-600">
                {downloading ? '다운로드 중...' : '저장'}
              </span>
            </button>
          </div>

          {/* 소셜 미디어 공유 */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleShare('facebook')}
              className="flex items-center justify-center p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Facebook className="w-4 h-4 mr-2" />
              <span className="text-sm">Facebook</span>
            </button>
            
            <button
              onClick={() => handleShare('twitter')}
              className="flex items-center justify-center p-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              <Twitter className="w-4 h-4 mr-2" />
              <span className="text-sm">Twitter</span>
            </button>
            
            <button
              onClick={() => handleShare('instagram')}
              className="flex items-center justify-center p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
            >
              <Instagram className="w-4 h-4 mr-2" />
              <span className="text-sm">Instagram</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;

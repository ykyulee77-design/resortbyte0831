import React from 'react';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName?: string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageName
}) => {
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setImageError(false);
      setImageLoaded(false);
    }
  }, [isOpen]);

  // ESC 키 이벤트 리스너
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      document.body.style.pointerEvents = 'auto';
    };
  }, [isOpen, onClose]);

  // 마우스 휠 이벤트
  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    if (event.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.warn('이미지 로드 실패:', imageUrl);
    setImageError(true);
    setImageLoaded(false);
  };

  // HEIC 파일인지 확인
  const isHeicFile = imageUrl.toLowerCase().includes('.heic') || imageUrl.toLowerCase().includes('.heif');

  // 더 엄격한 렌더링 조건
  if (!isOpen || !imageUrl || imageUrl.trim() === '') {
    return null;
  }

  console.log('ImagePreviewModal 실제 렌더링:', { isOpen, imageUrl: imageUrl.substring(0, 50) + '...', imageName });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative bg-white rounded-lg shadow-2xl max-w-5xl max-h-[95vh] w-full flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between p-2 bg-gray-800 text-white rounded-t-lg">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">
              {imageName || '이미지 미리보기'}
            </h3>
            <span className="text-sm text-gray-300">
              {Math.round(scale * 100)}% | {rotation}°
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 컨트롤 버튼들 */}
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="축소"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="확대"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={handleRotate}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="회전"
            >
              <RotateCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
              title="초기화"
            >
              초기화
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="닫기"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 이미지 영역 */}
        <div className="flex-1 flex items-center justify-center overflow-hidden p-2 bg-gray-100" onWheel={handleWheel}>
          {imageError ? (
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">📷</div>
              <p className="text-lg font-medium mb-2">
                {isHeicFile ? 'HEIC 파일을 표시할 수 없습니다' : '이미지를 불러올 수 없습니다'}
              </p>
              <p className="text-sm">
                {isHeicFile 
                  ? 'HEIC 파일은 일부 브라우저에서 지원되지 않습니다. JPEG 또는 PNG 형식으로 변환 후 다시 시도해주세요.'
                  : '이미지 URL을 확인하거나 다시 시도해주세요.'
                }
              </p>
              <button
                onClick={() => {
                  setImageError(false);
                  setImageLoaded(false);
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <div
              className="relative cursor-move select-none"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-out'
              }}
            >
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
              <img
                src={imageUrl}
                alt={imageName || '이미지'}
                className="max-w-none max-h-none object-contain"
                style={{
                  maxWidth: '80vw',
                  maxHeight: '80vh',
                  opacity: imageLoaded ? 1 : 0
                }}
                draggable={false}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="p-2 bg-gray-100 text-gray-600 text-center rounded-b-lg">
          <p className="text-xs">
            마우스 휠로 확대/축소 | ESC 키로 닫기
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;

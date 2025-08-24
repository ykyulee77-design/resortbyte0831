import React from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw } from 'lucide-react';

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  videoName?: string;
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  videoName,
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [videoError, setVideoError] = React.useState(false);
  const [videoLoaded, setVideoLoaded] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      setIsMuted(false);
      setVolume(1);
      setIsFullscreen(false);
      setVideoError(false);
      setVideoLoaded(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error('동영상 재생 실패:', err);
          setVideoError(true);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleReset = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => {
        console.error('동영상 재생 실패:', err);
      });
      setIsPlaying(true);
    }
  };

  const handleVideoLoad = () => {
    setVideoLoaded(true);
    setVideoError(false);
  };

  const handleVideoError = () => {
    console.error('동영상 로드 실패:', videoUrl);
    setVideoError(true);
    setVideoLoaded(false);
  };

  if (!isOpen || !videoUrl || videoUrl.trim() === '') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative max-w-4xl max-h-[85vh] w-full mx-4">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 동영상 컨테이너 */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          {videoError ? (
            <div className="flex items-center justify-center h-96 text-white">
              <div className="text-center">
                <div className="text-4xl mb-4">🎬</div>
                <p className="text-lg font-medium mb-2">동영상을 불러올 수 없습니다</p>
                <p className="text-sm text-gray-400">
                  동영상 URL을 확인하거나 다시 시도해주세요.
                </p>
                <button
                  onClick={() => {
                    setVideoError(false);
                    setVideoLoaded(false);
                    if (videoRef.current) {
                      videoRef.current.load();
                    }
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 로딩 스피너 */}
              {!videoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              )}

              {/* 동영상 플레이어 */}
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-auto max-h-[70vh] object-contain"
                onLoadStart={() => setVideoLoaded(false)}
                onLoadedData={handleVideoLoad}
                onError={handleVideoError}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onVolumeChange={(e) => {
                  const target = e.target as HTMLVideoElement;
                  setVolume(target.volume);
                  setIsMuted(target.muted);
                }}
              />

              {/* 컨트롤 바 */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <div className="flex items-center justify-between text-white">
                  {/* 재생/일시정지 버튼 */}
                  <button
                    onClick={handlePlayPause}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>

                  {/* 볼륨 컨트롤 */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleMuteToggle}
                      className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* 컨트롤 버튼들 */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleReset}
                      className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                      title="처음으로"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleFullscreen}
                      className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                      title="전체화면"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 동영상 제목 */}
        {videoName && (
          <div className="mt-4 text-center">
            <h3 className="text-white text-lg font-medium">
              {videoName}
            </h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPreviewModal;

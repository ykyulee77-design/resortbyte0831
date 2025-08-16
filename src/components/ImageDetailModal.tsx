import React from 'react';

interface ImageDetailModalProps {
  image: File | null;
  isOpen: boolean;
  onClose: () => void;
}

const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  image,
  isOpen,
  onClose
}) => {
  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="max-w-4xl max-h-[90vh] w-full mx-4 relative">
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">이미지 상세보기</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>
          
          <div className="p-4">
            <img
              src={URL.createObjectURL(image)}
              alt="상세 이미지"
              className="w-full h-auto max-h-[70vh] object-contain"
            />
            
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>파일명:</strong> {image.name}</p>
              <p><strong>크기:</strong> {(image.size / 1024 / 1024).toFixed(2)} MB</p>
              <p><strong>타입:</strong> {image.type}</p>
            </div>
          </div>
          
          <div className="flex justify-end p-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageDetailModal;


// 이미지 최적화 유틸리티

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * 이미지 파일을 최적화하여 크기를 줄입니다.
 */
export const optimizeImage = async (
  file: File,
  options: ImageOptimizationOptions = {},
): Promise<File> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    maxSizeMB = 1,
    format = 'webp',
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 원본 크기
      let { width, height } = img;

      // 비율 유지하면서 크기 조정
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // Canvas 크기 설정
      canvas.width = width;
      canvas.height = height;

      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, width, height);

      // Canvas를 Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // 파일 크기가 여전히 큰 경우 품질을 더 낮춤
            if (blob.size > maxSizeMB * 1024 * 1024) {
              canvas.toBlob(
                (finalBlob) => {
                  if (finalBlob) {
                    const optimizedFile = new File([finalBlob], file.name, {
                      type: file.type,
                      lastModified: Date.now(),
                    });
                    resolve(optimizedFile);
                  } else {
                    reject(new Error('이미지 최적화 실패'));
                  }
                },
                file.type,
                0.6, // 더 낮은 품질
              );
            } else {
              const optimizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            }
          } else {
            reject(new Error('이미지 최적화 실패'));
          }
        },
        file.type,
        quality,
      );
    };

    img.onerror = () => {
      reject(new Error('이미지 로드 실패'));
    };

    // File을 Data URL로 변환
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * 파일 크기를 MB 단위로 반환합니다.
 */
export const getFileSizeMB = (file: File): number => {
  return file.size / 1024 / 1024;
};

/**
 * 파일 크기가 권장 크기보다 큰지 확인합니다.
 */
export const isFileTooLarge = (file: File, maxSizeMB = 1): boolean => {
  return getFileSizeMB(file) > maxSizeMB;
};

/**
 * 이미지 파일인지 확인합니다.
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * 안전한 파일명 생성 함수
 * @param userId 사용자 ID
 * @param originalFileName 원본 파일명
 * @param index 파일 순서
 * @returns 안전한 파일명
 */
export const generateSafeFileName = (
  userId: string, 
  originalFileName: string, 
  index = 0,
): string => {
  const timestamp = Date.now();
  const fileExtension = originalFileName.split('.').pop()?.toLowerCase() || 'jpg';
  
  // 특수문자 제거 및 안전한 파일명 생성
  const safeFileName = `accommodation_${userId}_${timestamp}_${index}.${fileExtension}`;
  
  return safeFileName;
};

/**
 * Firebase Storage 경로 생성 함수
 * @param userId 사용자 ID
 * @param fileName 파일명
 * @returns Storage 경로
 */
export const generateStoragePath = (userId: string, fileName: string): string => {
  return `accommodation-images/${userId}/${fileName}`;
};

/**
 * 파일명에서 메타데이터 추출 함수
 * @param fileName 파일명
 * @returns 메타데이터 객체
 */
export const extractFileMetadata = (fileName: string) => {
  const parts = fileName.split('_');
  if (parts.length >= 4) {
    return {
      type: parts[0], // accommodation
      userId: parts[1],
      timestamp: parseInt(parts[2]),
      index: parseInt(parts[3].split('.')[0]),
      extension: parts[3].split('.')[1] || 'jpg',
    };
  }
  return null;
}; 
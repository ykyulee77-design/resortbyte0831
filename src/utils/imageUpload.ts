import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

export interface ImageUploadOptions {
  folder: string;
  fileName?: string;
  metadata?: any;
}

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 이미지 업로드 함수
 * @param file 업로드할 파일
 * @param options 업로드 옵션
 * @returns 업로드 결과
 */
export const uploadImage = async (
  file: File, 
  options: ImageUploadOptions
): Promise<ImageUploadResult> => {
  try {
    console.log(`이미지 업로드 시작: ${file.name} -> ${options.folder}`);
    
    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const fileName = options.fileName || `${timestamp}_${file.name}`;
    const storagePath = `${options.folder}/${fileName}`;
    
    // Storage 참조 생성
    const storageRef = ref(storage, storagePath);
    
    // 메타데이터 설정
    const metadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        ...options.metadata
      }
    };
    
    // 파일 업로드
    const snapshot = await uploadBytes(storageRef, file, metadata);
    console.log('업로드 완료:', snapshot.metadata.name);
    
    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('다운로드 URL 생성:', downloadURL);
    
    return {
      success: true,
      url: downloadURL
    };
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
};

/**
 * 다중 이미지 업로드 함수
 * @param files 업로드할 파일 배열
 * @param options 업로드 옵션
 * @returns 업로드 결과 배열
 */
export const uploadMultipleImages = async (
  files: File[], 
  options: ImageUploadOptions
): Promise<ImageUploadResult[]> => {
  console.log(`다중 이미지 업로드 시작: ${files.length}개 파일`);
  
  const uploadPromises = files.map(file => uploadImage(file, options));
  const results = await Promise.all(uploadPromises);
  
  const successCount = results.filter(result => result.success).length;
  console.log(`업로드 완료: ${successCount}/${files.length}개 성공`);
  
  return results;
};

/**
 * 이미지 삭제 함수
 * @param imageUrl 삭제할 이미지 URL
 * @returns 삭제 결과
 */
export const deleteImage = async (imageUrl: string): Promise<ImageUploadResult> => {
  try {
    console.log('이미지 삭제 시작:', imageUrl);
    
    // URL에서 Storage 경로 추출
    const storageRef = ref(storage, imageUrl);
    
    // 파일 삭제
    await deleteObject(storageRef);
    console.log('이미지 삭제 완료');
    
    return {
      success: true
    };
  } catch (error) {
    console.error('이미지 삭제 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
};

/**
 * 이미지 업로드 상태 확인 함수
 * @returns 업로드 가능 여부
 */
export const checkImageUploadStatus = (): boolean => {
  // CORS 설정이 완료되었는지 확인하는 로직
  // 현재는 항상 true를 반환하지만, 필요시 추가 검증 로직 구현
  return true;
};

/**
 * 이미지 파일 검증 함수
 * @param file 검증할 파일
 * @returns 검증 결과
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // 파일 크기 검증 (10MB 제한)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: '파일 크기가 10MB를 초과합니다.'
    };
  }
  
  // 파일 타입 검증
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '지원하지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WebP만 지원)'
    };
  }
  
  return { valid: true };
};

/**
 * 이미지 압축 함수
 * @param file 압축할 파일
 * @param maxWidth 최대 너비
 * @returns 압축된 파일
 */
export const compressImage = (file: File, maxWidth: number = 1200): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 이미지 크기 계산
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, width, height);

      // Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('이미지 압축 실패'));
          }
        },
        'image/jpeg',
        0.8 // 품질 설정
      );
    };

    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = URL.createObjectURL(file);
  });
};

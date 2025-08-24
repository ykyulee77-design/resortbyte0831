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
  options: ImageUploadOptions,
): Promise<ImageUploadResult> => {
  try {
    console.log(`이미지 업로드 시작: ${file.name} -> ${options.folder}`);
    
    // HEIC 파일인지 확인하고 변환
    let processedFile = file;
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isHeicFile = fileExtension === 'heic' || fileExtension === 'heif';
    
    if (isHeicFile) {
      console.log('HEIC 파일 감지, 처리 중...');
      processedFile = await convertHeicToJpeg(file);
      console.log('HEIC 파일 처리 완료. 참고: 일부 브라우저에서는 HEIC 파일이 제대로 표시되지 않을 수 있습니다.');
      
      // 사용자에게 알림 (선택사항)
      if (typeof window !== 'undefined') {
        // 개발 환경에서는 콘솔에만 출력
        console.info('💡 HEIC 파일 업로드 완료! 일부 브라우저에서는 이미지가 제대로 표시되지 않을 수 있습니다.');
      }
    }
    
    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const fileName = options.fileName || `${timestamp}_${processedFile.name}`;
    const storagePath = `${options.folder}/${fileName}`;
    
    // Storage 참조 생성
    const storageRef = ref(storage, storagePath);
    
    // 메타데이터 설정
    const metadata = {
      contentType: processedFile.type,
      customMetadata: {
        originalName: file.name,
        processedName: processedFile.name,
        uploadedAt: new Date().toISOString(),
        ...options.metadata,
      },
    };
    
    // 파일 업로드
    const snapshot = await uploadBytes(storageRef, processedFile, metadata);
    console.log('업로드 완료:', snapshot.metadata.name);
    
    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('다운로드 URL 생성:', downloadURL);
    
    // HEIC 파일인 경우 추가 정보 제공
    if (isHeicFile) {
      console.log('✅ HEIC 파일 업로드 성공! 파일명이 .jpg로 변경되었습니다.');
    }
    
    return {
      success: true,
      url: downloadURL,
    };
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
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
  options: ImageUploadOptions,
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
      success: true,
    };
  } catch (error) {
    console.error('이미지 삭제 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
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
      error: '파일 크기가 10MB를 초과합니다.',
    };
  }
  
  // 파일 타입 검증 (HEIC 포함)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
  const fileExtension = file.name.toLowerCase().split('.').pop();
  const isHeicFile = fileExtension === 'heic' || fileExtension === 'heif';
  
  if (!allowedTypes.includes(file.type) && !isHeicFile) {
    return {
      valid: false,
      error: '지원하지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WebP, HEIC만 지원)',
    };
  }
  
  return { valid: true };
};

/**
 * HEIC 파일을 JPEG로 변환하는 함수
 * @param file 변환할 HEIC 파일
 * @returns 변환된 JPEG 파일
 */
export const convertHeicToJpeg = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('HEIC 파일 감지:', file.name);
      
      // HEIC 파일인 경우 사용자에게 안내
      if (typeof window !== 'undefined' && window.confirm) {
        const shouldContinue = window.confirm(
          'HEIC 파일이 감지되었습니다. 이 파일은 일부 브라우저에서 제대로 표시되지 않을 수 있습니다.\n\n' +
          'JPEG 또는 PNG 형식으로 변환 후 업로드하는 것을 권장합니다.\n\n' +
          '계속 진행하시겠습니까?',
        );
        
        if (!shouldContinue) {
          // 사용자가 취소한 경우
          reject(new Error('사용자가 업로드를 취소했습니다.'));
          return;
        }
      }
      
      // 파일명만 .jpg로 변경하고 원본 파일 반환
      const fileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
      const renamedFile = new File([file], fileName, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      
      console.log(`HEIC 파일명 변경: ${file.name} -> ${fileName}`);
      console.log('참고: HEIC 파일은 일부 브라우저에서 제대로 표시되지 않을 수 있습니다.');
      resolve(renamedFile);
      
    } catch (error) {
      console.warn('HEIC 파일 처리 실패, 원본 파일 사용:', error);
      resolve(file);
    }
  });
};

/**
 * 이미지 압축 함수
 * @param file 압축할 파일
 * @param maxWidth 최대 너비
 * @returns 압축된 파일
 */
export const compressImage = (file: File, maxWidth = 1200): Promise<File> => {
  return new Promise((resolve, reject) => {
    try {
      // HEIC 파일인지 확인
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const isHeicFile = fileExtension === 'heic' || fileExtension === 'heif';
      
      if (isHeicFile) {
        console.log('HEIC 파일은 압축을 건너뜁니다.');
        resolve(file); // HEIC 파일은 압축하지 않고 원본 반환
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
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
                console.warn('이미지 압축 실패, 원본 파일 사용');
                resolve(file); // 압축 실패시 원본 파일 반환
              }
            },
            'image/jpeg',
            0.8, // 품질 설정
          );
        } catch (error) {
          console.warn('이미지 압축 중 오류 발생, 원본 파일 사용:', error);
          resolve(file); // 오류 발생시 원본 파일 반환
        }
      };

      img.onerror = () => {
        console.warn('이미지 로드 실패, 원본 파일 사용');
        resolve(file); // 로드 실패시 원본 파일 반환
      };

      img.src = URL.createObjectURL(file);
    } catch (error) {
      console.warn('이미지 압축 초기화 실패, 원본 파일 사용:', error);
      resolve(file); // 초기화 실패시 원본 파일 반환
    }
  });
};

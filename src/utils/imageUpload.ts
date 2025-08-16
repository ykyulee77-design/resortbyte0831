import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

export interface UploadResult {
  url: string;
  path: string;
}

export const uploadImage = async (
  file: File, 
  folder: string, 
  userId: string
): Promise<UploadResult> => {
  try {
    // 파일 확장자 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP만 가능)');
    }

    // 파일 크기 검증 (5MB 제한)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('파일 크기가 너무 큽니다. (최대 5MB)');
    }

    // 고유한 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    
    // Storage 경로 설정
    const storagePath = `${folder}/${userId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // 파일 업로드
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      url: downloadURL,
      path: storagePath
    };
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    throw error;
  }
};

export const deleteImage = async (imagePath: string): Promise<void> => {
  try {
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('이미지 삭제 실패:', error);
    throw error;
  }
};

export const uploadMultipleImages = async (
  files: File[], 
  folder: string, 
  userId: string
): Promise<UploadResult[]> => {
  const uploadPromises = files.map(file => uploadImage(file, folder, userId));
  return Promise.all(uploadPromises);
};

// 이미지 최적화를 위한 유틸리티
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

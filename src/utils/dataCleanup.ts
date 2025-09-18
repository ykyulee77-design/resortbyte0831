import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';

// Firebase 데이터 초기화 유틸리티
export const cleanupAllData = async (preserveAdminUsers = true) => {
  try {
    console.log('데이터 초기화 시작...');
    
    const collections = [
      'jobPosts',
      'applications', 
      'companyInfo',
      'accommodationInfo',
      'reports',
      'evaluations'
    ];

    // 일반 데이터 컬렉션 삭제
    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(db, collectionName));
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log(`${collectionName} 컬렉션 삭제 완료`);
    }

    // 사용자 데이터 처리
    if (preserveAdminUsers) {
      // 관리자 계정만 보존하고 나머지 삭제
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const deletePromises = usersSnapshot.docs
        .filter(doc => doc.data().role !== 'admin')
        .map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log('일반 사용자 계정 삭제 완료 (관리자 계정 보존)');
    } else {
      // 모든 사용자 삭제
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const deletePromises = usersSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log('모든 사용자 계정 삭제 완료');
    }

    console.log('데이터 초기화 완료!');
    return { success: true, message: '데이터 초기화가 완료되었습니다.' };
    
  } catch (error) {
    console.error('데이터 초기화 실패:', error);
    return { success: false, message: '데이터 초기화에 실패했습니다.' };
  }
};

// 특정 컬렉션만 삭제
export const cleanupCollection = async (collectionName: string) => {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log(`${collectionName} 컬렉션 삭제 완료`);
    return { success: true, message: `${collectionName} 컬렉션이 삭제되었습니다.` };
  } catch (error) {
    console.error(`${collectionName} 삭제 실패:`, error);
    return { success: false, message: `${collectionName} 삭제에 실패했습니다.` };
  }
};

// 조건부 삭제 함수들
export const cleanupJobPostsByStatus = async (status: string) => {
  try {
    const q = query(collection(db, 'jobPosts'), where('status', '==', status));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log(`상태가 '${status}'인 공고 ${snapshot.size}개 삭제 완료`);
    return { success: true, message: `상태가 '${status}'인 공고 ${snapshot.size}개가 삭제되었습니다.` };
  } catch (error) {
    console.error(`상태별 공고 삭제 실패:`, error);
    return { success: false, message: `상태별 공고 삭제에 실패했습니다.` };
  }
};

export const cleanupOldApplications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const q = query(
      collection(db, 'applications'),
      where('createdAt', '<', cutoffDate)
    );
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log(`${daysOld}일 이전 지원서 ${snapshot.size}개 삭제 완료`);
    return { success: true, message: `${daysOld}일 이전 지원서 ${snapshot.size}개가 삭제되었습니다.` };
  } catch (error) {
    console.error(`오래된 지원서 삭제 실패:`, error);
    return { success: false, message: `오래된 지원서 삭제에 실패했습니다.` };
  }
};

export const cleanupInactiveUsers = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '!=', 'admin')
    );
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log(`비관리자 사용자 ${snapshot.size}명 삭제 완료`);
    return { success: true, message: `비관리자 사용자 ${snapshot.size}명이 삭제되었습니다.` };
  } catch (error) {
    console.error(`비활성 사용자 삭제 실패:`, error);
    return { success: false, message: `비활성 사용자 삭제에 실패했습니다.` };
  }
};

export const cleanupResolvedReports = async () => {
  try {
    const q = query(collection(db, 'reports'), where('status', '==', 'resolved'));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log(`처리된 신고 ${snapshot.size}개 삭제 완료`);
    return { success: true, message: `처리된 신고 ${snapshot.size}개가 삭제되었습니다.` };
  } catch (error) {
    console.error(`처리된 신고 삭제 실패:`, error);
    return { success: false, message: `처리된 신고 삭제에 실패했습니다.` };
  }
};

// 샘플 데이터 식별 및 삭제
export const cleanupSampleData = async () => {
  try {
    let totalDeleted = 0;
    
    // 샘플 공고 삭제 (employerId가 sample-로 시작하는 것들)
    const sampleJobPostsQuery = query(
      collection(db, 'jobPosts'),
      where('employerId', '>=', 'sample-'),
      where('employerId', '<', 'sample-~')
    );
    const jobPostsSnapshot = await getDocs(sampleJobPostsQuery);
    const jobPostsDeletePromises = jobPostsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(jobPostsDeletePromises);
    totalDeleted += jobPostsSnapshot.size;
    
    // 샘플 회사 정보 삭제
    const sampleCompanyQuery = query(
      collection(db, 'companyInfo'),
      where('employerId', '>=', 'sample-'),
      where('employerId', '<', 'sample-~')
    );
    const companySnapshot = await getDocs(sampleCompanyQuery);
    const companyDeletePromises = companySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(companyDeletePromises);
    totalDeleted += companySnapshot.size;
    
    console.log(`샘플 데이터 ${totalDeleted}개 삭제 완료`);
    return { success: true, message: `샘플 데이터 ${totalDeleted}개가 삭제되었습니다.` };
  } catch (error) {
    console.error(`샘플 데이터 삭제 실패:`, error);
    return { success: false, message: `샘플 데이터 삭제에 실패했습니다.` };
  }
};

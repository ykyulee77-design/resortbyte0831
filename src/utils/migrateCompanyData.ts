import { collection, getDocs, doc, setDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * 기존 users 컬렉션의 회사 정보를 companies 컬렉션으로 마이그레이션
 */
export const migrateCompanyDataFromUsers = async () => {
  try {
    console.log('🚀 회사 데이터 마이그레이션 시작...');
    
    // 1. users 컬렉션에서 employer 역할인 사용자들 조회
    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'employer')
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    console.log(`📊 총 ${usersSnapshot.size}명의 employer 사용자 발견`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // 2. 이미 companyId가 있거나 회사 정보가 없는 경우 스킵
      if (userData.companyId || !userData.companyName) {
        console.log(`⏭️ 스킵: ${userId} - 이미 companyId 있음 또는 회사 정보 없음`);
        skippedCount++;
        continue;
      }
      
      // 3. 회사 정보 추출
      const companyData = {
        name: userData.companyName || '',
        address: userData.companyAddress || '',
        detailAddress: userData.companyDetailAddress || '',
        phone: userData.companyPhone || '',
        website: userData.companyWebsite || '',
        businessNumber: userData.businessNumber || '',
        industry: userData.industry || '',
        companySize: userData.companySize || '',
        description: userData.description || '',
        culture: userData.culture || '',
        benefits: userData.benefits || [],
        images: userData.images || [],
        employerIds: [userId],
        createdAt: userData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // 4. companies 컬렉션에 저장
      const companyDocRef = doc(collection(db, 'companies'));
      await setDoc(companyDocRef, companyData);
      const companyId = companyDocRef.id;
      
      // 5. users 컬렉션에서 회사 정보 제거하고 companyId 추가
      const userUpdateData = {
        companyId: companyId,
        updatedAt: serverTimestamp(),
      };
      
      // 회사 정보 필드들 제거
      const companyFields = [
        'companyName', 'companyAddress', 'companyDetailAddress', 'companyPhone',
        'companyWebsite', 'businessNumber', 'industry', 'companySize',
        'description', 'culture', 'benefits', 'images'
      ];
      
      // 기존 회사 정보 필드들을 undefined로 설정하여 제거
      companyFields.forEach(field => {
        (userUpdateData as any)[field] = undefined;
      });
      
      await setDoc(doc(db, 'users', userId), userUpdateData, { merge: true });
      
      console.log(`✅ 마이그레이션 완료: ${userId} → ${companyId} (${companyData.name})`);
      migratedCount++;
    }
    
    console.log(`🎉 마이그레이션 완료!`);
    console.log(`   - 마이그레이션된 사용자: ${migratedCount}명`);
    console.log(`   - 스킵된 사용자: ${skippedCount}명`);
    
    return {
      success: true,
      migrated: migratedCount,
      skipped: skippedCount,
    };
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  }
};

/**
 * companyInfo 컬렉션의 데이터를 companies 컬렉션으로 마이그레이션
 */
export const migrateCompanyDataFromCompanyInfo = async () => {
  try {
    console.log('🚀 companyInfo 컬렉션 마이그레이션 시작...');
    
    // 1. companyInfo 컬렉션의 모든 문서 조회
    const companyInfoSnapshot = await getDocs(collection(db, 'companyInfo'));
    console.log(`📊 총 ${companyInfoSnapshot.size}개의 companyInfo 문서 발견`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const companyInfoDoc of companyInfoSnapshot.docs) {
      const companyInfoData = companyInfoDoc.data();
      const employerId = companyInfoData.employerId;
      
      if (!employerId) {
        console.log(`⏭️ 스킵: ${companyInfoDoc.id} - employerId 없음`);
        skippedCount++;
        continue;
      }
      
      // 2. 해당 사용자의 companyId가 이미 있는지 확인
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('uid', '==', employerId)
      ));
      
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        if (userData.companyId) {
          console.log(`⏭️ 스킵: ${employerId} - 이미 companyId 있음`);
          skippedCount++;
          continue;
        }
      }
      
      // 3. companies 컬렉션에 저장
      const companyData = {
        name: companyInfoData.name || '',
        address: companyInfoData.address || '',
        detailAddress: companyInfoData.detailAddress || '',
        phone: companyInfoData.phone || '',
        website: companyInfoData.website || '',
        businessNumber: companyInfoData.businessNumber || '',
        industry: companyInfoData.industry || '',
        companySize: companyInfoData.companySize || '',
        description: companyInfoData.description || '',
        culture: companyInfoData.culture || '',
        benefits: companyInfoData.benefits || [],
        images: companyInfoData.images || [],
        employerIds: [employerId],
        createdAt: companyInfoData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const companyDocRef = doc(collection(db, 'companies'));
      await setDoc(companyDocRef, companyData);
      const companyId = companyDocRef.id;
      
      // 4. users 컬렉션에 companyId 추가
      if (!userDoc.empty) {
        await setDoc(doc(db, 'users', employerId), {
          companyId: companyId,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      
      console.log(`✅ companyInfo 마이그레이션 완료: ${employerId} → ${companyId} (${companyData.name})`);
      migratedCount++;
    }
    
    console.log(`🎉 companyInfo 마이그레이션 완료!`);
    console.log(`   - 마이그레이션된 문서: ${migratedCount}개`);
    console.log(`   - 스킵된 문서: ${skippedCount}개`);
    
    return {
      success: true,
      migrated: migratedCount,
      skipped: skippedCount,
    };
    
  } catch (error) {
    console.error('❌ companyInfo 마이그레이션 실패:', error);
    throw error;
  }
};

/**
 * 전체 마이그레이션 실행
 */
export const runFullMigration = async () => {
  try {
    console.log('🚀 전체 데이터 마이그레이션 시작...');
    
    // 1. users 컬렉션에서 회사 정보 마이그레이션
    const usersResult = await migrateCompanyDataFromUsers();
    
    // 2. companyInfo 컬렉션에서 회사 정보 마이그레이션
    const companyInfoResult = await migrateCompanyDataFromCompanyInfo();
    
    console.log('🎉 전체 마이그레이션 완료!');
    console.log(`   - users 컬렉션: ${usersResult.migrated}명 마이그레이션`);
    console.log(`   - companyInfo 컬렉션: ${companyInfoResult.migrated}개 마이그레이션`);
    
    return {
      success: true,
      users: usersResult,
      companyInfo: companyInfoResult,
    };
    
  } catch (error) {
    console.error('❌ 전체 마이그레이션 실패:', error);
    throw error;
  }
};

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Resume } from '../types';
import { withErrorHandling, createUserFriendlyError } from '../utils/errorHandler';

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  workplaceName?: string;
  workplaceLocation?: string;
  contactPerson?: string;
  resume?: Resume;
  // 구인자 추가 정보
  companyName?: string;
  companyAddress?: string;
  companyDetailAddress?: string; // 상세주소 필드 추가
  companyPhone?: string;
  companyWebsite?: string;
  businessNumber?: string;
  industry?: string;
  companySize?: string;
  contactPhone?: string;
}

interface EmployerInfo {
  workplaceName: string;
  workplaceLocation: string;
  contactPerson: string;
  // 구인자 추가 정보
  companyName: string;
  companyAddress: string;
  companyDetailAddress?: string; // 상세주소 필드 추가
  companyPhone: string;
  companyWebsite?: string;
  businessNumber?: string;
  industry?: string;
  companySize?: string;
  contactPhone?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, role: string, employerInfo?: EmployerInfo, resume?: Resume) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  updateUserData: () => Promise<void>; // 사용자 데이터 새로고침 함수 추가
  // 다중 역할 관련 메서드들
  selectRole: (role: string) => Promise<void>; // 역할 선택
  addRole: (role: string, roleData?: any) => Promise<void>; // 역할 추가
  // 간편 로그인 메서드들
  signInWithNaver: (naverUser: any, role?: string) => Promise<void>;
  signInWithKakao: (kakaoUser: any, accessToken: string, role?: string) => Promise<void>;
  signInWithGoogle: (googleUser: any, role?: string) => Promise<void>;
  signInWithApple: (appleUser: any, role?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

// localStorage에서 초기 사용자 정보 읽기
const getInitialUser = (): User | null => {
  console.log('🔍 getInitialUser 호출');
  try {
    const savedUser = localStorage.getItem('user');
    console.log('📦 localStorage 내용:', savedUser ? '있음' : '없음');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      console.log('💾 사용자 복원:', parsedUser.displayName);
      return parsedUser;
    }
  } catch (error) {
    console.error('localStorage 파싱 실패:', error);
    localStorage.removeItem('user');
  }
  console.log('❌ getInitialUser: null 반환');
  return null;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    console.log('🚀 AuthProvider 초기화');
    const initialUser = getInitialUser();
    return initialUser;
  });
  const [loading, setLoading] = useState(false); // 간단하게 false로 시작

  // user 상태가 변경될 때 localStorage 동기화
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      console.log('💾 localStorage 저장:', user.displayName);
    } else {
      localStorage.removeItem('user');
      console.log('🗑️ localStorage 제거');
    }
  }, [user]);

  // 소셜 로그인 사용자는 Firebase Auth 완전히 무시
  useEffect(() => {
    // 소셜 로그인 사용자면 Firebase Auth 무시
    if (user && user.uid && (
      user.uid.startsWith('naver_') ||
      user.uid.startsWith('kakao_') ||
      user.uid.startsWith('google_') ||
      user.uid.startsWith('apple_')
    )) {
      console.log('🔐 소셜 로그인 사용자 - Firebase Auth 무시');
      setLoading(false);
      return;
    }

    // 일반 Firebase Auth 사용자만 처리 (현재는 사용하지 않음)
    setLoading(false);
  }, [user]);

  const signUp = async (email: string, password: string, displayName: string, role: string, employerInfo?: EmployerInfo, resume?: Resume) => {
    try {
      console.log('🔥 회원가입 시작:', { email, role });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase Auth 성공:', firebaseUser.uid);

      // Firebase Auth 프로필 업데이트
      await updateProfile(firebaseUser, {
        displayName: displayName,
      });

      // Firestore에 사용자 정보 저장
      
      const userData: any = {
        email: email,
        displayName: displayName,
        role: role,
        currentRole: role, // Firebase 규칙에서 확인하는 필드
        roles: [role], // Firebase 규칙에서 확인하는 배열
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      

      // 구인자인 경우 직장 정보 추가
      if (role === 'employer' && employerInfo) {
        userData.workplaceName = employerInfo.workplaceName || '';
        userData.workplaceLocation = employerInfo.workplaceLocation || '';
        userData.contactPerson = employerInfo.contactPerson || '';
        // 구인자 추가 정보
        userData.companyName = employerInfo.companyName || '';
        userData.companyAddress = employerInfo.companyAddress || '';
        userData.companyDetailAddress = employerInfo.companyDetailAddress || '';
        userData.companyPhone = employerInfo.companyPhone || '';
        userData.companyWebsite = employerInfo.companyWebsite || '';
        userData.businessNumber = employerInfo.businessNumber || '';
        userData.industry = employerInfo.industry || '';
        userData.companySize = employerInfo.companySize || '';
        userData.contactPhone = employerInfo.contactPhone || '';
        
        // 회사 정보 companyInfo 컬렉션에도 저장
        await setDoc(doc(db, 'companyInfo', firebaseUser.uid), {
          employerId: firebaseUser.uid, // employerId 필드 추가
          name: employerInfo.companyName || '',
          address: employerInfo.companyAddress || '',
          detailAddress: employerInfo.companyDetailAddress || '', // 상세주소 추가 (기본값 설정)
          phone: employerInfo.companyPhone || '',
          website: employerInfo.companyWebsite || '',
          businessNumber: employerInfo.businessNumber || '',
          industry: employerInfo.industry || '',
          companySize: employerInfo.companySize || '',
          contactPerson: employerInfo.contactPerson || '',
          contactPhone: employerInfo.contactPhone || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // 구직자인 경우 이력서 정보 추가 (빈 이력서로 초기화)
      if (role === 'jobseeker') {
        userData.resume = resume || {};
      }

      console.log('🔥 Firestore 저장 시도:', firebaseUser.uid);
      console.log('🔍 Firebase Auth 토큰:', await firebaseUser.getIdToken());
      console.log('🔍 Firestore 연결 상태:', db.app.options);
      console.log('🔍 저장할 경로:', `users/${firebaseUser.uid}`);
      console.log('🔍 저장할 데이터:', JSON.stringify(userData, null, 2));
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('✅ Firestore 저장 성공!');

      // 회원가입 후 즉시 로그인 상태로 설정
      const userInfo = {
        uid: firebaseUser.uid,
        email: email,
        displayName: displayName,
        role: role,
        workplaceName: employerInfo?.workplaceName || '',
        workplaceLocation: employerInfo?.workplaceLocation || '',
        contactPerson: employerInfo?.contactPerson || '',
        resume: resume,
        // 구인자 추가 정보
        companyName: employerInfo?.companyName || '',
        companyAddress: employerInfo?.companyAddress || '',
        companyPhone: employerInfo?.companyPhone || '',
        companyWebsite: employerInfo?.companyWebsite || '',
        businessNumber: employerInfo?.businessNumber || '',
        industry: employerInfo?.industry || '',
        companySize: employerInfo?.companySize || '',
        contactPhone: employerInfo?.contactPhone || '',
      };
      
      // 디버깅: 회원가입 완료 로그
      console.log('🎉 회원가입 완료:', {
        uid: firebaseUser.uid,
        email: email,
        role: role,
        userInfo: userInfo
      });
      
      setUser(userInfo);
      localStorage.setItem('user', JSON.stringify(userInfo));
         } catch (error: unknown) {
       throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Firestore에서 사용자 정보 가져오기
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userInfo = {
          uid: firebaseUser.uid,
          email: userData.email || firebaseUser.email || '',
          displayName: userData.displayName || firebaseUser.displayName || '',
          role: userData.role || 'jobseeker',
          workplaceName: userData.workplaceName || '',
          workplaceLocation: userData.workplaceLocation || '',
          contactPerson: userData.contactPerson || '',
          resume: userData.resume || {},
          // 구인자 추가 정보
          companyName: userData.companyName || '',
          companyAddress: userData.companyAddress || '',
          companyDetailAddress: userData.companyDetailAddress || '',
          companyPhone: userData.companyPhone || '',
          companyWebsite: userData.companyWebsite || '',
          businessNumber: userData.businessNumber || '',
          industry: userData.industry || '',
          companySize: userData.companySize || '',
          contactPhone: userData.contactPhone || '',
        };
        
        // 사용자 상태 업데이트
        setUser(userInfo);
        localStorage.setItem('user', JSON.stringify(userInfo));
        
        console.log('🔐 로그인 성공:', userInfo);
      }
    } catch (error: unknown) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      // localStorage에서 사용자 정보 제거
      localStorage.removeItem('user');
      // 로그아웃 후 소개페이지로 리다이렉트
      window.location.href = '/';
         } catch (error: unknown) {
       throw error;
    }
  };

  const updateUserData = async () => {
    if (!user?.uid) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({
          uid: user.uid,
          email: userData.email || user.email,
          displayName: userData.displayName || user.displayName,
          role: userData.role || user.role,
          workplaceName: userData.workplaceName || '',
          workplaceLocation: userData.workplaceLocation || '',
          contactPerson: userData.contactPerson || '',
          resume: userData.resume || user.resume,
          // 구인자 추가 정보
          companyName: userData.companyName || '',
          companyAddress: userData.companyAddress || '',
          companyPhone: userData.companyPhone || '',
          companyWebsite: userData.companyWebsite || '',
          businessNumber: userData.businessNumber || '',
          industry: userData.industry || '',
          companySize: userData.companySize || '',
          contactPhone: userData.contactPhone || '',
        });
      }
    } catch (error) {
      console.error('사용자 데이터 업데이트 실패:', error);
    }
  };

  // 네이버 로그인 함수
  const signInWithNaver = async (naverUser: any, role = 'jobseeker') => {
    try {
      const phoneNumber = naverUser.mobile || naverUser.phone || '';
      console.log('🔐 네이버 로그인:', naverUser.name, '전화번호:', phoneNumber);
      
      // 네이버 사용자 정보를 기반으로 사용자 정보 구성
      const userInfo: User = {
        uid: `naver_${naverUser.id}`,
        email: naverUser.email || '',
        displayName: naverUser.name || '',
        role: role,
        // 기본값들
        workplaceName: '',
        workplaceLocation: '',
        contactPerson: '',
        resume: role === 'jobseeker' ? {
          phone: phoneNumber, // 이력서에도 전화번호 저장
        } : undefined,
        // 구인자 추가 정보 기본값
        companyName: '',
        companyAddress: '',
        companyDetailAddress: '',
        companyPhone: phoneNumber, // 회사 전화번호로도 사용
        companyWebsite: '',
        businessNumber: '',
        industry: '',
        companySize: '',
        contactPhone: phoneNumber, // 개인 연락처로 사용
      };

      // localStorage에 사용자 정보 저장
      localStorage.setItem('user', JSON.stringify(userInfo));
      setUser(userInfo);
      setLoading(false);
      
      console.log('💾 localStorage에 사용자 정보 저장 완료:', userInfo.displayName);
      console.log('✅ 네이버 로그인 완료:', userInfo.displayName);
      
    } catch (error) {
      console.error('❌ 네이버 로그인 실패:', error);
      throw error;
    }
  };

  const signInWithKakao = async (kakaoUser: any, role = 'jobseeker') => {
    console.log('🟡 카카오 로그인 처리 시작:', { kakaoUser, role });
    
    try {
      const userData = {
        uid: kakaoUser.uid || `kakao_${kakaoUser.id}`,
        email: kakaoUser.email,
        displayName: kakaoUser.name || kakaoUser.displayName,
        role: role,
        provider: 'kakao',
        providerId: kakaoUser.id || kakaoUser.uid,
        profile_image: kakaoUser.profile_image || kakaoUser.photoURL || '',
        mobile: kakaoUser.mobile || '', // 카카오 전화번호
        emailVerified: true, // 카카오는 이메일 검증됨
        workplaceName: '',
        workplaceLocation: '',
        contactPerson: '',
        resume: {
          name: kakaoUser.name || kakaoUser.displayName || '',
          email: kakaoUser.email,
          phone: kakaoUser.mobile || '',
          address: '',
          experience: '',
          skills: '',
          education: '',
          certifications: '',
          languages: [],
          introduction: '',
          workPreference: {
            workType: [],
            location: '',
            salary: { min: 0, max: 0 },
            schedule: '',
            startDate: '',
          },
        },
      };

      // localStorage에 사용자 정보 저장
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      console.log('💾 localStorage에 사용자 정보 저장 완료:', userData.displayName);
      console.log('✅ 카카오 로그인 완료:', userData);
      
    } catch (error) {
      console.error('카카오 로그인 처리 실패:', error);
      throw error;
    }
  };

  const signInWithGoogle = async (googleUser: any, role = 'jobseeker') => {
    console.log('🔵 구글 로그인 처리 시작:', { googleUser, role });
    
    try {
      const userData = {
        uid: googleUser.id, // Firebase에서 제공하는 uid 사용
        email: googleUser.email,
        displayName: googleUser.name,
        role: role,
        provider: 'google',
        providerId: googleUser.id || googleUser.uid,
        profile_image: googleUser.profile_image || googleUser.photoURL || '',
        mobile: '', // 구글은 전화번호 제공하지 않음
        emailVerified: googleUser.email_verified || googleUser.emailVerified || false,
        workplaceName: '',
        workplaceLocation: '',
        contactPerson: '',
        resume: {
          name: googleUser.name || googleUser.displayName || '',
          email: googleUser.email,
          phone: '', // 구글은 전화번호 제공하지 않음
          address: '',
          experience: '',
          skills: '',
          education: '',
          certifications: '',
          languages: [],
          introduction: '',
          workPreference: {
            workType: [],
            location: '',
            salary: { min: 0, max: 0 },
            schedule: '',
            startDate: '',
          },
        },
      };

      // Firestore에 사용자 정보 저장
      try {
        console.log('🔍 Firestore에 구글 사용자 정보 저장 시작:', userData.uid);
        await setDoc(doc(db, 'users', userData.uid), {
          ...userData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ Firestore에 구글 사용자 정보 저장 완료');
      } catch (firestoreError) {
        console.error('❌ Firestore 저장 실패:', firestoreError);
        // Firestore 저장 실패해도 로그인은 계속 진행
      }

      // localStorage에 사용자 정보 저장
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      console.log('💾 localStorage에 사용자 정보 저장 완료:', userData.displayName);
      console.log('✅ 구글 로그인 완료:', userData);
      
    } catch (error) {
      console.error('구글 로그인 처리 실패:', error);
      throw error;
    }
  };

  const signInWithApple = async (appleUser: any, role = 'jobseeker') => {
    console.log('🍎 애플 로그인 처리 시작:', { appleUser, role });
    
    try {
      const userData = {
        uid: appleUser.id, // Firebase에서 제공하는 uid 사용
        email: appleUser.email,
        displayName: appleUser.name,
        role: role,
        provider: 'apple',
        providerId: appleUser.id,
        profile_image: appleUser.profile_image || '',
        mobile: '', // 애플은 전화번호 제공하지 않음
        emailVerified: appleUser.email_verified || appleUser.emailVerified || false,
        workplaceName: '',
        workplaceLocation: '',
        contactPerson: '',
        resume: {
          name: appleUser.name || '',
          email: appleUser.email,
          phone: '', // 애플은 전화번호 제공하지 않음
          address: '',
          experience: '',
          skills: '',
          education: '',
          certifications: '',
          languages: [],
          introduction: '',
          workPreference: {
            workType: [],
            location: '',
            salary: { min: 0, max: 0 },
            schedule: '',
            startDate: '',
          },
        },
      };

      // Firestore에 사용자 정보 저장
      try {
        console.log('🔍 Firestore에 애플 사용자 정보 저장 시작:', userData.uid);
        await setDoc(doc(db, 'users', userData.uid), {
          ...userData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ Firestore에 애플 사용자 정보 저장 완료');
      } catch (firestoreError) {
        console.error('❌ Firestore 저장 실패:', firestoreError);
        // Firestore 저장 실패해도 로그인은 계속 진행
      }

      // localStorage에 사용자 정보 저장
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      console.log('💾 localStorage에 사용자 정보 저장 완료:', userData.displayName);
      console.log('✅ 애플 로그인 완료:', userData);
      
    } catch (error) {
      console.error('애플 로그인 처리 실패:', error);
      throw error;
    }
  };

  const selectRole = async (role: string) => {
    console.log('역할 선택:', role);
    // 실제 구현 필요
  };

  const addRole = async (role: string, roleData?: any) => {
    console.log('역할 추가:', role, roleData);
    // 실제 구현 필요
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    logout,
    setUser,
    updateUserData,
    selectRole,
    addRole,
    signInWithNaver,
    signInWithKakao,
    signInWithGoogle,
    signInWithApple,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Firestore에서 사용자 정보 가져오기
        try {
          const userDoc = await import('firebase/firestore').then(({ getDoc }) => 
            getDoc(doc(db, 'users', firebaseUser.uid)),
          );
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userRole = userData.role || 'jobseeker';
            
            // 디버깅: 사용자 역할 로그
            console.log('🔍 사용자 역할 확인:', {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: userRole,
              userData: userData
            });
            
            const userInfo = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: userData.displayName || firebaseUser.displayName || '',
              role: userRole,
              workplaceName: userData.workplaceName,
              workplaceLocation: userData.workplaceLocation,
              contactPerson: userData.contactPerson,
              resume: userData.resume || undefined,
              // 구인자 추가 정보
              companyName: userData.companyName,
              companyAddress: userData.companyAddress,
              companyDetailAddress: userData.companyDetailAddress,
              companyPhone: userData.companyPhone,
              companyWebsite: userData.companyWebsite,
              businessNumber: userData.businessNumber,
              industry: userData.industry,
              companySize: userData.companySize,
              contactPhone: userData.contactPhone,
            };
            
            setUser(userInfo);
            
            // localStorage에 사용자 정보 저장 (로그인 후 리다이렉트를 위해)
            localStorage.setItem('user', JSON.stringify(userInfo));
          } else {
            // Firestore에 사용자 정보가 없으면 기본값으로 설정
            const defaultUserInfo = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              role: 'jobseeker', // 기본값은 구직자로 유지
              resume: undefined,
            };
            
            setUser(defaultUserInfo);
            localStorage.setItem('user', JSON.stringify(defaultUserInfo));
          }
        } catch (error) {
          console.error('사용자 정보 가져오기 실패:', error);
          const errorUserInfo = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            role: 'jobseeker', // 에러 시에도 기본값은 구직자로 유지
          };
          
          setUser(errorUserInfo);
          localStorage.setItem('user', JSON.stringify(errorUserInfo));
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, displayName: string, role: string, employerInfo?: EmployerInfo, resume?: Resume) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Firebase Auth 프로필 업데이트
      await updateProfile(firebaseUser, {
        displayName: displayName,
      });

      // Firestore에 사용자 정보 저장
      const userData: {
        email: string;
        displayName: string;
        role: string;
        createdAt: any;
        updatedAt: any;
        workplaceName?: string;
        workplaceLocation?: string;
        contactPerson?: string;
        companyName?: string;
        companyAddress?: string;
        companyDetailAddress?: string;
        companyPhone?: string;
        companyWebsite?: string;
        businessNumber?: string;
        industry?: string;
        companySize?: string;
        contactPhone?: string;
        resume?: Resume;
      } = {
        email: email,
        displayName: displayName,
        role: role,
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

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

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
      await signInWithEmailAndPassword(auth, email, password);
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

  const value = {
    user,
    loading,
    signUp,
    signIn,
    logout,
    setUser,
    updateUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
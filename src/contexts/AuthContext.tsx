import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Resume } from '../types';

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
  setUser: React.Dispatch<React.SetStateAction<User | null>>; // 추가
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
            getDoc(doc(db, 'users', firebaseUser.uid))
          );
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: userData.displayName || firebaseUser.displayName || '',
              role: userData.role || 'jobseeker',
              workplaceName: userData.workplaceName,
              workplaceLocation: userData.workplaceLocation,
              contactPerson: userData.contactPerson,
              resume: userData.resume || undefined,
              // 구인자 추가 정보
              companyName: userData.companyName,
              companyAddress: userData.companyAddress,
              companyPhone: userData.companyPhone,
              companyWebsite: userData.companyWebsite,
              businessNumber: userData.businessNumber,
              industry: userData.industry,
              companySize: userData.companySize,
              contactPhone: userData.contactPhone
            });
          } else {
            // Firestore에 사용자 정보가 없으면 기본값으로 설정
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              role: 'jobseeker',
              resume: undefined
            });
          }
        } catch (error) {
          console.error('사용자 정보 가져오기 실패:', error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            role: 'jobseeker'
          });
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
        displayName: displayName
      });

      // Firestore에 사용자 정보 저장
      const userData: any = {
        email: email,
        displayName: displayName,
        role: role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // 구인자인 경우 직장 정보 추가
      if (role === 'employer' && employerInfo) {
        userData.workplaceName = employerInfo.workplaceName;
        userData.workplaceLocation = employerInfo.workplaceLocation;
        userData.contactPerson = employerInfo.contactPerson;
        // 구인자 추가 정보
        userData.companyName = employerInfo.companyName;
        userData.companyAddress = employerInfo.companyAddress;
        userData.companyPhone = employerInfo.companyPhone;
        userData.companyWebsite = employerInfo.companyWebsite;
        userData.businessNumber = employerInfo.businessNumber;
        userData.industry = employerInfo.industry;
        userData.companySize = employerInfo.companySize;
        userData.contactPhone = employerInfo.contactPhone;
        
        // 회사 정보 companyInfo 컬렉션에도 저장
        await setDoc(doc(db, 'companyInfo', firebaseUser.uid), {
          name: employerInfo.companyName,
          address: employerInfo.companyAddress,
          phone: employerInfo.companyPhone,
          website: employerInfo.companyWebsite,
          businessNumber: employerInfo.businessNumber,
          industry: employerInfo.industry,
          companySize: employerInfo.companySize,
          contactPerson: employerInfo.contactPerson,
          contactPhone: employerInfo.contactPhone,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // 구직자인 경우 이력서 정보 추가
      if (role === 'jobseeker' && resume) {
        userData.resume = resume;
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      // 로컬 상태 업데이트
      setUser({
        uid: firebaseUser.uid,
        email: email,
        displayName: displayName,
        role: role,
        workplaceName: employerInfo?.workplaceName,
        workplaceLocation: employerInfo?.workplaceLocation,
        contactPerson: employerInfo?.contactPerson,
        resume: resume,
        // 구인자 추가 정보
        companyName: employerInfo?.companyName,
        companyAddress: employerInfo?.companyAddress,
        companyPhone: employerInfo?.companyPhone,
        companyWebsite: employerInfo?.companyWebsite,
        businessNumber: employerInfo?.businessNumber,
        industry: employerInfo?.industry,
        companySize: employerInfo?.companySize,
        contactPhone: employerInfo?.contactPhone
      });
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('로그인 실패:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      console.error('로그아웃 실패:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    logout,
    setUser // 추가
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
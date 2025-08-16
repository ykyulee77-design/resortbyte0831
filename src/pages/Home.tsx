import React, { useEffect, useState } from 'react';
import JobList from './JobList';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyId = async () => {
      if (user && user.role === 'employer') {
        // 회사 문서ID는 user.uid와 동일하게 가정
        const docRef = doc(db, 'companyInfo', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCompanyId(user.uid);
        } else {
          setCompanyId(null);
        }
      } else {
        setCompanyId(null);
      }
    };
    fetchCompanyId();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-resort-600 py-12 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white text-center">리조트 일자리 찾기</h1>
        <p className="text-lg text-blue-100 text-center mt-2">지역 리조트에서 일할 수 있는 최고의 기회를 찾아보세요</p>
      </div>
      {/* 완전한 기능을 가진 JobList 컴포넌트 */}
      <JobList simpleMode={false} />
    </div>
  );
};

export default Home; 
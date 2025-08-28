import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Briefcase, Phone, Globe, Home, Edit } from 'lucide-react';

const EmployerProfile: React.FC = () => {
  const { user } = useAuth();
  const [companyInfo, setCompanyInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        // 1) companyInfo 문서 우선
        const ref = doc(db, 'companyInfo', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setCompanyInfo(snap.data());
          return;
        }
        // 2) users 문서 fallback (employerInfo 포함 가능)
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data: any = userSnap.data();
          setCompanyInfo(data.employerInfo || data);
        }
      } catch (e) {
        console.error('회사 정보 로딩 실패:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [user?.uid]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600">회사 프로필을 보려면 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-blue-600" />
              회사 정보
            </h1>
            <p className="text-gray-600">회원가입 시 입력한 회사 정보와 담당자 정보를 확인합니다.</p>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/company/${user.uid}`}
              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Edit className="w-4 h-4" /> 회사 정보
            </Link>
            <Link
              to={`/accommodation-info/${user.uid}`}
              className="inline-flex items-center gap-2 px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
            >
              <Home className="w-4 h-4" /> 기숙사 정보
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">불러오는 중...</div>
        ) : (
          <>
            {/* 기본 정보 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">회사명</span>
                  <p className="text-gray-900 font-medium">{companyInfo?.name || companyInfo?.companyName || '미등록'}</p>
                </div>
                <div>
                  <span className="text-gray-500">담당자</span>
                  <p className="text-gray-900 font-medium">{user.displayName || '미등록'}</p>
                </div>
              </div>
            </div>

            {/* 연락처/주소 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">연락처 / 주소</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span>{companyInfo?.contactPhone || companyInfo?.phone || '연락처 미등록'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>{companyInfo?.website || '웹사이트 미등록'}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-500">주소</span>
                  <p className="text-gray-900">{companyInfo?.address || '주소 미등록'}</p>
                </div>
              </div>
            </div>

            {/* 상태 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">상태</h3>
              <div className="text-sm text-gray-700">
                <p>업종: {companyInfo?.industry || '미등록'}</p>
                <p>규모: {companyInfo?.size || companyInfo?.companySize || '미등록'}</p>
                <p>복지: {companyInfo?.benefits?.length ? companyInfo.benefits.join(', ') : '미등록'}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployerProfile;



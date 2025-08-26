import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const UserDebug: React.FC = () => {
  const { user } = useAuth();
  const [firestoreData, setFirestoreData] = React.useState<any>(null);
  const [companyInfoData, setCompanyInfoData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const fetchFirestoreData = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      // users 컬렉션에서 사용자 정보 가져오기
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setFirestoreData(userDoc.data());
      }

      // companyInfo 컬렉션에서 회사 정보 가져오기
      const companyDoc = await getDoc(doc(db, 'companyInfo', user.uid));
      if (companyDoc.exists()) {
        setCompanyInfoData(companyDoc.data());
      }
    } catch (error) {
      console.error('Firestore 데이터 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (newRole: string) => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      // users 컬렉션 업데이트
      await updateDoc(doc(db, 'users', user.uid), {
        role: newRole,
        updatedAt: new Date()
      });
      
      // localStorage 업데이트
      const updatedUser = { ...user, role: newRole };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setMessage(`역할이 ${newRole}로 성공적으로 변경되었습니다.`);
      
      // 데이터 새로고침
      setTimeout(() => {
        fetchFirestoreData();
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('역할 업데이트 실패:', error);
      setMessage('역할 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const checkUserByEmail = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      // 이메일로 사용자 검색
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', user.email));
      const querySnapshot = await getDocs(q);
      
      console.log('이메일로 검색된 사용자들:', querySnapshot.docs.map(doc => doc.data()));
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setMessage(`이메일 ${user.email}로 검색된 사용자 역할: ${userData.role}`);
      } else {
        setMessage('해당 이메일로 사용자를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('사용자 검색 실패:', error);
      setMessage('사용자 검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchFirestoreData();
  }, [user?.uid]);

  if (!user) {
    return <div className="p-4">로그인이 필요합니다.</div>;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">사용자 정보 디버깅</h1>
      
      {message && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          {message}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 현재 사용자 정보 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">현재 사용자 정보 (Context)</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-60">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        {/* localStorage 정보 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">localStorage 정보</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-60">
            {JSON.stringify(JSON.parse(localStorage.getItem('user') || 'null'), null, 2)}
          </pre>
        </div>

        {/* Firestore users 데이터 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Firestore users 데이터</h2>
          {loading ? (
            <p>로딩 중...</p>
          ) : (
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-60">
              {JSON.stringify(firestoreData, null, 2)}
            </pre>
          )}
        </div>

        {/* Firestore companyInfo 데이터 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Firestore companyInfo 데이터</h2>
          {loading ? (
            <p>로딩 중...</p>
          ) : (
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-60">
              {JSON.stringify(companyInfoData, null, 2)}
            </pre>
          )}
        </div>

        {/* 역할 수정 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">역할 수정</h2>
          <div className="space-y-2">
            <button
              onClick={() => updateUserRole('employer')}
              disabled={loading}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              구인자로 변경
            </button>
            <button
              onClick={() => updateUserRole('jobseeker')}
              disabled={loading}
              className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              구직자로 변경
            </button>
            <button
              onClick={() => updateUserRole('admin')}
              disabled={loading}
              className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 disabled:opacity-50"
            >
              관리자로 변경
            </button>
          </div>
        </div>

        {/* 추가 기능 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">추가 기능</h2>
          <div className="space-y-2">
            <button
              onClick={checkUserByEmail}
              disabled={loading}
              className="w-full bg-purple-500 text-white p-2 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              이메일로 사용자 검색
            </button>
            <button
              onClick={fetchFirestoreData}
              disabled={loading}
              className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600 disabled:opacity-50"
            >
              데이터 새로고침
            </button>
          </div>
        </div>
      </div>

      {/* 대시보드 링크 */}
      <div className="mt-4 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">대시보드 링크</h2>
        <div className="space-x-2">
          <a href="/employer-dashboard" className="text-blue-500 hover:underline">
            구인자 대시보드
          </a>
          <span>|</span>
          <a href="/jobseeker-dashboard" className="text-green-500 hover:underline">
            구직자 대시보드
          </a>
          <span>|</span>
          <a href="/admin-dashboard" className="text-red-500 hover:underline">
            관리자 대시보드
          </a>
        </div>
      </div>
    </div>
  );
};

export default UserDebug;

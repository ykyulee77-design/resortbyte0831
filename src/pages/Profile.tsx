import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Trash2, AlertTriangle, FileText, Edit, Save, XCircle, Phone, Briefcase, GraduationCap, Award, DollarSign, Home, Globe } from 'lucide-react';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { deleteUser, getAuth } from 'firebase/auth';
import { Resume } from '../types';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resumeEdit, setResumeEdit] = useState<Resume>(user?.resume || {});
  const [resumeMode, setResumeMode] = useState<'view' | 'edit'>(user?.resume ? 'view' : 'edit');
  const [resumeSaving, setResumeSaving] = useState(false);
  // 구인자용 회사 정보
  const [companyInfo, setCompanyInfo] = useState<any | null>(null);
  const [companyLoading, setCompanyLoading] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!user?.uid || user.role !== 'employer') return;
      setCompanyLoading(true);
      try {
        const ref = doc(db, 'companyInfo', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setCompanyInfo(snap.data());
          return;
        }
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data: any = userSnap.data();
          setCompanyInfo(data.employerInfo || data);
        }
      } catch (e) {
        console.error('회사 정보 로딩 실패:', e);
      } finally {
        setCompanyLoading(false);
      }
    };
    fetchCompany();
  }, [user?.uid, user?.role]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    try {
      setDeleteLoading(true);
      
      // 사용자 확인
      const confirmDelete = window.confirm(
        '정말로 계정을 삭제하시겠습니까?\n\n' +
        '이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.\n' +
        '삭제를 진행하려면 "확인"을 클릭하세요.'
      );
      
      if (!confirmDelete) {
        setShowDeleteModal(false);
        return;
      }

      // Firestore에서 사용자 데이터 삭제
      await deleteDoc(doc(db, 'users', user.uid));
      
      // Firebase Auth에서 사용자 계정 삭제
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        await deleteUser(currentUser);
      }
      
      alert('계정이 성공적으로 삭제되었습니다.');
      navigate('/');
      
    } catch (error: any) {
      console.error('계정 삭제 실패:', error);
      
      if (error.code === 'auth/requires-recent-login') {
        alert('보안상의 이유로 최근 로그인이 필요합니다. 다시 로그인 후 시도해주세요.');
      } else {
        alert('계정 삭제 중 오류가 발생했습니다: ' + error.message);
      }
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setResumeEdit(prev => ({ ...prev, [name]: value }));
  };

  const handleResumeSave = async () => {
    if (!user) return;
    setResumeSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { resume: resumeEdit });
      setResumeMode('view');
      window.location.reload(); // 새로고침으로 최신 정보 반영
    } catch (e) {
      alert('이력서 저장 실패');
    } finally {
      setResumeSaving(false);
    }
  };



  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-600">이력서를 확인하려면 로그인해주세요.</p>
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
              {user.role === 'employer' ? (
                <>
                  <Briefcase className="w-8 h-8 text-blue-600" />
                  회사 정보
                </>
              ) : (
                <>
                  <FileText className="w-8 h-8 text-purple-600" />
                  이력서
                </>
              )}
            </h1>
            <p className="text-gray-600">
              {user.role === 'employer' 
                ? '회사 정보를 관리하고 업데이트하세요.' 
                : '회사에 제출할 이력서를 작성하고 관리하세요.'
              }
            </p>
          </div>

        </div>
      </div>

      {user.role === 'employer' ? (
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                회사 정보
              </h2>
              <div className="flex gap-2">
                <a
                  href={`/company/${user.uid}`}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Edit className="w-4 h-4" />
                  회사 정보 수정
                </a>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* 회사 기본 정보 카드 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">회사명</span>
                  <p className="text-gray-900 font-medium">{companyInfo?.name || companyInfo?.companyName || '미등록'}</p>
                </div>
                <div>
                  <span className="text-gray-500">담당자</span>
                  <p className="text-gray-900 font-medium">{user?.displayName || '미등록'}</p>
                </div>
              </div>
            </div>

            {/* 연락처/주소 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">연락처 / 주소</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span>{companyInfo?.contactPhone || '연락처 미등록'}</span>
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

            {/* 기숙사 상태 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">기숙사</h3>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-orange-600" />
                  <span>기숙사 상세정보 관리</span>
                </div>
                <a
                  href={`/accommodation/${user.uid}`}
                  className="inline-flex items-center px-3 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  이동
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                이력서 정보
              </h2>
              <div className="flex gap-2">
                {resumeMode === 'view' ? (
                  <button
                    onClick={() => setResumeMode('edit')}
                    className="flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    수정
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleResumeSave}
                      disabled={resumeSaving}
                      className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {resumeSaving ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={() => {
                        setResumeEdit(user?.resume || {});
                        setResumeMode('view');
                      }}
                      className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      <XCircle className="w-4 h-4" />
                      취소
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        
        <div className="p-6">
          {/* 기본 정보 - 모든 사용자에게 표시 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              기본 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user.displayName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user.email}</p>
              </div>
            </div>
          </div>

          {/* 이력서 정보 - 구직자에게만 표시 */}
          {user.role === 'jobseeker' && resumeMode === 'view' && user.resume ? (
            <div className="space-y-6">
              {/* 연락처 정보 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  연락처 정보
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                    <p className="text-sm text-gray-900">{user?.resume?.phone || '미입력'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
                    <p className="text-sm text-gray-900">{user?.resume?.birth || '미입력'}</p>
                  </div>
                </div>
              </div>

              {/* 직무 정보 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  직무 정보
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">희망 직무</label>
                    <p className="text-sm text-gray-900">{user?.resume?.jobType || '미입력'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">경력</label>
                    <p className="text-sm text-gray-900">{user?.resume?.career || '미입력'}</p>
                  </div>
                </div>
              </div>

              {/* 학력 및 자격 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  학력 및 자격
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">학력</label>
                    <p className="text-sm text-gray-900">{user?.resume?.education || '미입력'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">자격증/특기</label>
                    <p className="text-sm text-gray-900">
                      {user?.resume?.certs && user?.resume?.certs.length > 0 
                        ? user?.resume?.certs.join(', ') 
                        : '미입력'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* 급여 및 근무 정보 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-yellow-600" />
                  급여 및 근무 정보
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">희망 급여</label>
                    <p className="text-sm text-gray-900">
                      {user?.resume?.expectedSalary 
                        ? `${user?.resume?.expectedSalary?.toLocaleString?.()}원` 
                        : '미입력'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">입사 가능일</label>
                    <p className="text-sm text-gray-900">{user?.resume?.availableStartDate || '미입력'}</p>
                  </div>
                </div>
              </div>

              {/* 자기소개 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-600" />
                  자기소개
                </h4>
                <div>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {user?.resume?.intro || '자기소개를 입력해주세요.'}
                  </p>
                </div>
              </div>
            </div>
          ) : user.role === 'jobseeker' ? (
            <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleResumeSave(); }}>
              {/* 연락처 정보 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  연락처 정보
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                    <input
                      type="tel"
                      name="phone"
                      value={resumeEdit.phone || ''}
                      onChange={handleResumeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="010-1234-5678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
                    <input
                      type="text"
                      name="birth"
                      value={resumeEdit.birth || ''}
                      onChange={handleResumeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="1990-01-01"
                    />
                  </div>
                </div>
              </div>

              {/* 직무 정보 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  직무 정보
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">희망 직무</label>
                    <input
                      type="text"
                      name="jobType"
                      value={resumeEdit.jobType || ''}
                      onChange={handleResumeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="리조트 서비스, 호텔 관리 등"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">경력</label>
                    <input
                      type="text"
                      name="career"
                      value={resumeEdit.career || ''}
                      onChange={handleResumeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="신입, 1년차, 3년차 등"
                    />
                  </div>
                </div>
              </div>

              {/* 학력 및 자격 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  학력 및 자격
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">학력</label>
                    <input
                      type="text"
                      name="education"
                      value={resumeEdit.education || ''}
                      onChange={handleResumeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="고등학교 졸업, 대학교 졸업 등"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">자격증/특기</label>
                    <input
                      type="text"
                      name="certs"
                      value={resumeEdit.certs?.join(', ') || ''}
                      onChange={(e) => {
                        const certs = e.target.value.split(',').map(cert => cert.trim()).filter(cert => cert);
                        setResumeEdit(prev => ({ ...prev, certs }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="자격증1, 자격증2, 특기1 (쉼표로 구분)"
                    />
                  </div>
                </div>
              </div>

              {/* 급여 및 근무 정보 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-yellow-600" />
                  급여 및 근무 정보
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">희망 급여 (월)</label>
                    <input
                      type="number"
                      name="expectedSalary"
                      value={resumeEdit.expectedSalary || ''}
                      onChange={handleResumeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="2000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">입사 가능일</label>
                    <input
                      type="text"
                      name="availableStartDate"
                      value={resumeEdit.availableStartDate || ''}
                      onChange={handleResumeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="즉시 가능, 2024-02-01 등"
                    />
                  </div>
                </div>
              </div>

              {/* 자기소개 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-600" />
                  자기소개
                </h4>
                <div>
                  <textarea
                    name="intro"
                    value={resumeEdit.intro || ''}
                    onChange={handleResumeChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="자신의 강점, 경험, 지원 동기 등을 자유롭게 작성해주세요."
                  />
                </div>
              </div>
            </form>
          ) : null}
        </div>
      </div>
      )}

      {/* 계정 관리 섹션 */}
      <div className="mt-8 bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">계정 관리</h2>
        </div>
        <div className="p-6">
          <div className="flex gap-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              계정 삭제
            </button>
          </div>
        </div>
      </div>

      {/* 계정 삭제 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">계정 삭제</h3>
            </div>
            <p className="text-gray-600 mb-6">
              정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? '삭제 중...' : '삭제'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 
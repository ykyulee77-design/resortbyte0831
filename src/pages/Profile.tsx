import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Trash2, AlertTriangle, FileText, Edit, Save, XCircle, Phone, Briefcase, GraduationCap, Award, DollarSign, Home, Globe, Users, Clock } from 'lucide-react';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { deleteUser, getAuth } from 'firebase/auth';
import { Resume } from '../types';
import UnifiedScheduleGrid from '../components/UnifiedScheduleGrid';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resumeEdit, setResumeEdit] = useState<Resume>(user?.resume || {});
  const [resumeMode, setResumeMode] = useState<'view' | 'edit'>(user?.resume ? 'view' : 'edit');
  const [resumeSaving, setResumeSaving] = useState(false);
  const [scheduleCollapsed, setScheduleCollapsed] = useState(true);
  // 구인자용 회사 정보
  const [companyInfo, setCompanyInfo] = useState<any | null>(null);

  // 이력서 옵션들






  const languageOptions = [
    '한국어 (모국어)',
    '영어 (초급)',
    '영어 (중급)',
    '영어 (고급)',
    '중국어',
    '일본어',
    '베트남어',
    '기타'
  ];

  const computerSkillOptions = [
    'MS Office (Word, Excel, PowerPoint)',
    '이메일/인터넷',
    '포토샵/그래픽 디자인',
    '회계 프로그램',
    'POS 시스템',
    '기타'
  ];

  useEffect(() => {
    const fetchCompany = async () => {
      if (!user?.uid || user.role !== 'employer') return;
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

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
                  나의 프로필 (이력서)
                </>
              )}
            </h1>
            <p className="text-gray-600">
              {user.role === 'employer' 
                ? '회사 정보를 관리하고 업데이트하세요.' 
                : '회사에 제출할 이력서를 작성하고 관리하세요. 지원 시 이 정보가 이력서로 사용됩니다.'
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">최종 출신학교</label>
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

              {/* 근무 선호도 - 스케줄 그리드 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  선호 근무시간
                </h4>
                
                {/* 선호근무시간 타입 표시 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">선호근무시간 타입</label>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user?.resume?.preferredTimeType === 'general' 
                        ? 'bg-blue-100 text-blue-800' 
                        : user?.resume?.preferredTimeType === 'specific'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                                             {user?.resume?.preferredTimeType === 'general' ? '일반' :
                        user?.resume?.preferredTimeType === 'specific' ? '선호시간 있음' : '미설정'}
                    </span>
                    {user?.resume?.preferredTimeType === 'general' && (
                      <span className="text-sm text-gray-500">시간대에 상관없이 근무 가능</span>
                    )}
                                         {user?.resume?.preferredTimeType === 'specific' && (
                       <span className="text-sm text-gray-500">선호하는 시간대가 있음</span>
                     )}
                  </div>
                </div>

                {/* 시간지정일 때만 스케줄 그리드 표시 */}
                {user?.resume?.preferredTimeType === 'specific' && user?.resume?.preferredTimeSlots && user.resume.preferredTimeSlots.length > 0 ? (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-900">선호 시간대</h5>
                      <button
                        onClick={() => setScheduleCollapsed(!scheduleCollapsed)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {scheduleCollapsed ? (
                          <>
                            <span>펼치기</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>접기</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                    {!scheduleCollapsed && (
                      <UnifiedScheduleGrid
                        selectedTimeSlots={user.resume.preferredTimeSlots}
                        mode="view"
                        title="선호 근무시간"
                        description="설정된 선호 근무시간"
                        showStatistics={true}
                        showActions={false}
                        jobseekerView={true}
                        readOnly={true}
                      />
                    )}
                  </div>
                                 ) : user?.resume?.preferredTimeType === 'specific' ? (
                   <div className="border-t border-gray-200 pt-4">
                     <div className="text-center py-6">
                       <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                         <Clock className="w-6 h-6 text-purple-500" />
                       </div>
                       <p className="text-purple-600 text-sm font-medium">선호하는 시간대가 있음</p>
                       <p className="text-purple-500 text-xs mt-1">선호 시간대를 설정해보세요</p>
                     </div>
                   </div>
                ) : user?.resume?.preferredTimeType === 'general' ? (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-6 h-6 text-blue-500" />
                      </div>
                      <p className="text-blue-600 text-sm font-medium">시간대에 상관없이 근무 가능</p>
                      <p className="text-blue-500 text-xs mt-1">모든 시간대의 일자리에 지원할 수 있습니다</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">선호 근무시간이 설정되지 않았습니다</p>
                    <p className="text-sm text-gray-400 mt-1">편집 모드에서 선호하는 시간을 설정해보세요</p>
                  </div>
                )}
              </div>

              {/* 급여 및 기타 선호도 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-yellow-600" />
                  급여 및 기타 선호도
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">희망 시급</label>
                    <p className="text-sm text-gray-900">
                      {user?.resume?.hourlyWage 
                        ? `${user?.resume?.hourlyWage?.toLocaleString?.()}원/시간` 
                        : '미입력'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">입사 가능일</label>
                    <p className="text-sm text-gray-900">{user?.resume?.availableStartDate || '미입력'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">기타 선호사항</label>
                    <div className="space-y-1">
                      {user?.resume?.travelWilling && <p className="text-sm text-gray-900">• 출장 가능</p>}
                      {user?.resume?.dormitoryWilling && <p className="text-sm text-gray-900">• 기숙사 이용 희망</p>}
                      {user?.resume?.drivingLicense && <p className="text-sm text-gray-900">• 운전면허 보유</p>}
                      {!user?.resume?.travelWilling && !user?.resume?.dormitoryWilling && !user?.resume?.drivingLicense && 
                        <p className="text-sm text-gray-500">미입력</p>
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* 경험 및 스킬 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  경험 및 스킬
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">관련 경험</label>
                    <div className="space-y-1">
                      {user?.resume?.customerServiceExp && <p className="text-sm text-gray-900">• 고객 응대 경험</p>}
                      {user?.resume?.restaurantExp && <p className="text-sm text-gray-900">• 음식점/호텔 경험</p>}
                      {!user?.resume?.customerServiceExp && !user?.resume?.restaurantExp && 
                        <p className="text-sm text-gray-500">미입력</p>
                      }
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">언어 능력</label>
                    <div className="space-y-1">
                      {user?.resume?.languages && user.resume.languages.length > 0 ? 
                        user.resume.languages.map(lang => (
                          <p key={lang} className="text-sm text-gray-900">• {lang}</p>
                        ))
                        : <p className="text-sm text-gray-500">미입력</p>
                      }
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">컴퓨터 활용 능력</label>
                  <div className="space-y-1">
                    {user?.resume?.computerSkills && user.resume.computerSkills.length > 0 ? 
                      user.resume.computerSkills.map(skill => (
                        <p key={skill} className="text-sm text-gray-900">• {skill}</p>
                      ))
                      : <p className="text-sm text-gray-500">미입력</p>
                    }
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
                      placeholder="예: 리조트 서비스, 호텔 관리, 음식점 서비스 등"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      추천: 리조트 서비스, 호텔 관리, 음식점 서비스, 청소/정리, 안내/접수, 운전/배송 등
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">경력</label>
                    <input
                      type="text"
                      name="career"
                      value={resumeEdit.career || ''}
                      onChange={handleResumeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="예: 신입, 2년, 호텔업 3년 경험 등"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      추천: 신입, 1년 미만, 1-3년, 3-5년, 5년 이상 등
                    </p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">최종 출신학교</label>
                    <input
                      type="text"
                      name="education"
                      value={resumeEdit.education || ''}
                      onChange={handleResumeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="예: 서울대학교 경영학과 졸업, 고등학교 졸업 등"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      추천: 고등학교 졸업, 대학교 졸업, 대학원 졸업 등
                    </p>
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

              {/* 근무 선호도 - 스케줄 그리드 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  선호 근무시간 설정
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  선호하는 근무시간을 설정하면 맞춤 일자리를 추천받을 수 있습니다.
                </p>
                
                {/* 선호근무시간 타입 선택 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">선호근무시간 타입</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors">
                      <input
                        type="radio"
                        name="preferredTimeType"
                        value="general"
                        checked={resumeEdit.preferredTimeType === 'general'}
                        onChange={(e) => {
                          setResumeEdit(prev => ({ 
                            ...prev, 
                            preferredTimeType: e.target.value as 'general' | 'specific',
                            preferredTimeSlots: e.target.value === 'general' ? [] : prev.preferredTimeSlots
                          }));
                        }}
                        className="mr-3 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">일반</div>
                        <div className="text-sm text-gray-500">시간대에 상관없이 근무 가능</div>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors">
                      <input
                        type="radio"
                        name="preferredTimeType"
                        value="specific"
                        checked={resumeEdit.preferredTimeType === 'specific'}
                        onChange={(e) => {
                          setResumeEdit(prev => ({ 
                            ...prev, 
                            preferredTimeType: e.target.value as 'general' | 'specific'
                          }));
                        }}
                        className="mr-3 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">선호시간 있음</div>
                        <div className="text-sm text-gray-500">선호하는 시간대가 있음</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 시간지정 선택 시에만 스케줄 그리드 표시 */}
                {resumeEdit.preferredTimeType === 'specific' && (
                  <div className="border-t border-gray-200 pt-6">
                    <h5 className="text-sm font-medium text-gray-900 mb-3">선호 시간대 설정</h5>
                    <UnifiedScheduleGrid
                      selectedTimeSlots={resumeEdit.preferredTimeSlots || []}
                      onChange={(timeSlots) => {
                        setResumeEdit(prev => ({ ...prev, preferredTimeSlots: timeSlots }));
                      }}
                      mode="edit"
                      title="선호 근무시간"
                      description="선호하는 근무시간을 클릭하여 설정하세요"
                      showStatistics={true}
                      showActions={false}
                      jobseekerView={true}
                    />
                  </div>
                )}
              </div>

              {/* 급여 및 기타 선호도 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-yellow-600" />
                  급여 및 기타 선호도
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">희망 시급</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="hourlyWage"
                        value={resumeEdit.hourlyWage || ''}
                        onChange={handleResumeChange}
                        min="10000"
                        step="1000"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="10000"
                      />
                      <span className="text-sm text-gray-500 whitespace-nowrap">원/시간</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">최소 10,000원부터 1,000원 단위로 입력 가능</p>
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
                  <div className="md:col-span-2 space-y-3">
                    <label className="block text-sm font-medium text-gray-700">기타 선호사항</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="travelWilling"
                          checked={resumeEdit.travelWilling || false}
                          onChange={(e) => setResumeEdit(prev => ({ ...prev, travelWilling: e.target.checked }))}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">출장 가능</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="dormitoryWilling"
                          checked={resumeEdit.dormitoryWilling || false}
                          onChange={(e) => setResumeEdit(prev => ({ ...prev, dormitoryWilling: e.target.checked }))}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">기숙사 이용 희망</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="drivingLicense"
                          checked={resumeEdit.drivingLicense || false}
                          onChange={(e) => setResumeEdit(prev => ({ ...prev, drivingLicense: e.target.checked }))}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">운전면허 보유</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 경험 및 스킬 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  경험 및 스킬
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">관련 경험</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="customerServiceExp"
                          checked={resumeEdit.customerServiceExp || false}
                          onChange={(e) => setResumeEdit(prev => ({ ...prev, customerServiceExp: e.target.checked }))}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">고객 응대 경험</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="restaurantExp"
                          checked={resumeEdit.restaurantExp || false}
                          onChange={(e) => setResumeEdit(prev => ({ ...prev, restaurantExp: e.target.checked }))}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">음식점/호텔 경험</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">언어 능력</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {languageOptions.map(lang => (
                        <label key={lang} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={resumeEdit.languages?.includes(lang) || false}
                            onChange={(e) => {
                              const currentLangs = resumeEdit.languages || [];
                              const newLangs = e.target.checked
                                ? [...currentLangs, lang]
                                : currentLangs.filter(l => l !== lang);
                              setResumeEdit(prev => ({ ...prev, languages: newLangs }));
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{lang}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">컴퓨터 활용 능력</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {computerSkillOptions.map(skill => (
                      <label key={skill} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={resumeEdit.computerSkills?.includes(skill) || false}
                          onChange={(e) => {
                            const currentSkills = resumeEdit.computerSkills || [];
                            const newSkills = e.target.checked
                              ? [...currentSkills, skill]
                              : currentSkills.filter(s => s !== skill);
                            setResumeEdit(prev => ({ ...prev, computerSkills: newSkills }));
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{skill}</span>
                      </label>
                    ))}
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
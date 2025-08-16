import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Trash2, AlertTriangle, X, Send, CheckCircle, XCircle, Clock } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Application, Resume } from '../types';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 이 줄을 추가!
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumeEdit, setResumeEdit] = useState<Resume>(user?.resume || {});
  const [resumeMode, setResumeMode] = useState<'view' | 'edit'>(user?.resume ? 'view' : 'edit');
  const [resumeSaving, setResumeSaving] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      // 계정 삭제 로직은 현재 AuthContext에서 제거되었으므로
      // 사용자에게 알림만 표시
      alert('계정 삭제 기능은 현재 사용할 수 없습니다. 관리자에게 문의하세요.');
      setShowDeleteModal(false);
    } catch (error) {
      console.error('계정 삭제 실패:', error);
      alert('계정 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
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

  // 지원 내역 가져오기
  const fetchApplications = async () => {
    if (!user?.uid) return;

    try {
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('jobseekerId', '==', user.uid)
      );
      const querySnapshot = await getDocs(applicationsQuery);
      const fetchedApplications: Application[] = querySnapshot.docs.map(doc => {
        const raw = doc.data().appliedAt;
        let appliedAt: Date;
        if (raw instanceof Date) {
          appliedAt = raw;
        } else if (raw && typeof raw.toDate === 'function') {
          appliedAt = raw.toDate();
        } else if (typeof raw === 'string' || typeof raw === 'number') {
          appliedAt = new Date(raw);
        } else {
          appliedAt = new Date();
        }
        return {
          id: doc.id,
          jobPostId: doc.data().jobPostId,
          jobseekerId: doc.data().jobseekerId,
          jobseekerName: doc.data().jobseekerName,
          status: doc.data().status,
          appliedAt,
          message: doc.data().message || ''
        };
      });
      setApplications(fetchedApplications);
    } catch (error) {
      console.error('지원 내역 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-600">프로필을 확인하려면 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">프로필</h1>
        <p className="text-gray-600">계정 정보를 확인하고 관리하세요.</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">계정 정보</h2>
        </div>
        
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-16 w-16 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-gray-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{user.displayName}</h3>
              <p className="text-gray-600">{user.email}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                user.role === 'employer' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {user.role === 'admin' ? '관리자' : user.role === 'employer' ? '구인자' : '구직자'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">계정 정보</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">이름</label>
                  <p className="mt-1 text-sm text-gray-900">{user.displayName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">이메일</label>
                  <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">회원 유형</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user.role === 'admin' ? '관리자' : user.role === 'employer' ? '구인자' : '구직자'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">사용자 ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{user.uid}</p>
                </div>
              </div>
            </div>

            {/* 지원 요약 (구직자인 경우에만 표시) */}
            {user.role === 'jobseeker' && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">지원 요약</h4>
                
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">지원 내역을 불러오는 중...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 통계 카드 */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <Send className="h-5 w-5 text-blue-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">총 지원</p>
                            <p className="text-lg font-bold text-blue-900">{applications.length}건</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-yellow-900">검토 중</p>
                            <p className="text-lg font-bold text-yellow-900">
                              {applications.filter(app => app.status === 'pending').length}건
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-green-900">채용됨</p>
                            <p className="text-lg font-bold text-green-900">
                              {applications.filter(app => app.status === 'accepted').length}건
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-red-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <XCircle className="h-5 w-5 text-red-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-red-900">거절됨</p>
                            <p className="text-lg font-bold text-red-900">
                              {applications.filter(app => app.status === 'rejected').length}건
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 최근 지원 내역 */}
                    {applications.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">최근 지원 내역</h5>
                        <div className="space-y-2">
                          {applications.slice(0, 3).map((application) => (
                            <div key={application.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    지원 ID: {application.id.substring(0, 8)}...
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {application.appliedAt?.toLocaleDateString('ko-KR')}
                                  </p>
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  application.status === 'withdrawn' ? 'bg-gray-100 text-gray-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {application.status === 'accepted' ? '채용됨' :
                                   application.status === 'rejected' ? '거절됨' :
                                   application.status === 'withdrawn' ? '취소됨' : '검토 중'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {applications.length === 0 && (
                      <div className="text-center py-6">
                        <Send className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">아직 지원한 일자리가 없습니다</p>
                        <p className="text-xs text-gray-400 mt-1">일자리에 지원해보세요!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 이력서 정보 입력/수정 UI (구직자만) */}
            {user.role === 'jobseeker' && (
              <div className="border-t border-gray-200 pt-4 mt-8">
                <h4 className="text-sm font-medium text-gray-900 mb-2">간단 이력서 정보</h4>
                {resumeMode === 'view' && user.resume ? (
                  <div className="space-y-2">
                    <div><b>연락처:</b> {user.resume.phone || '-'}</div>
                    <div><b>생년월일:</b> {user.resume.birth || '-'}</div>
                    <div><b>희망직무:</b> {user.resume.jobType || '-'}</div>
                    <div><b>경력:</b> {user.resume.career || '-'}</div>
                    <div><b>자기소개:</b> {user.resume.intro || '-'}</div>
                    <div><b>자격증/특기:</b> {(user.resume.certs && user.resume.certs.length > 0) ? user.resume.certs.join(', ') : '-'}</div>
                    <button onClick={() => setResumeMode('edit')} className="mt-2 px-3 py-1 bg-blue-500 text-white rounded">수정</button>
                  </div>
                ) : (
                  <form className="space-y-2" onSubmit={e => { e.preventDefault(); handleResumeSave(); }}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">연락처</label>
                      <input name="phone" value={resumeEdit.phone || ''} onChange={handleResumeChange} className="mt-1 block w-full border rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">생년월일</label>
                      <input name="birth" value={resumeEdit.birth || ''} onChange={handleResumeChange} className="mt-1 block w-full border rounded px-2 py-1" placeholder="예: 1990-01-01" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">희망직무</label>
                      <input name="jobType" value={resumeEdit.jobType || ''} onChange={handleResumeChange} className="mt-1 block w-full border rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">경력</label>
                      <input name="career" value={resumeEdit.career || ''} onChange={handleResumeChange} className="mt-1 block w-full border rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">자기소개</label>
                      <textarea name="intro" value={resumeEdit.intro || ''} onChange={handleResumeChange} className="mt-1 block w-full border rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">자격증/특기 (쉼표로 구분)</label>
                      <input name="certs" value={resumeEdit.certs ? resumeEdit.certs.join(',') : ''} onChange={e => setResumeEdit(prev => ({ ...prev, certs: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} className="mt-1 block w-full border rounded px-2 py-1" />
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <button type="submit" disabled={resumeSaving} className="px-4 py-1 bg-blue-600 text-white rounded">저장</button>
                      {user.resume && <button type="button" onClick={() => setResumeMode('view')} className="px-4 py-1 bg-gray-300 rounded">취소</button>}
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex space-x-4">
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-resort-500"
            >
              <LogOut className="h-4 w-4 mr-2" />
              로그아웃
            </button>
            
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              계정 삭제
            </button>
          </div>
        </div>
      </div>

      {/* 계정 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">계정 삭제 확인</h3>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-red-800">{user.displayName}</p>
                      <p className="text-sm text-red-700">{user.email}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deleteLoading ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 
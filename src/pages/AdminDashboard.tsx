import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminUsers from './AdminUsers';
import { Copy, Shield, Users, FileText, BarChart3, UserPlus } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  status: 'active' | 'suspended';
}

interface JobPost {
  id: string;
  title: string;
  employer: string;
  status: 'active' | 'closed' | 'pending';
  createdAt: Date;
  applications: number;
}

interface AdminInvite {
  id: string;
  code: string;
  createdBy: string;
  createdAt: Date;
  usedBy?: string;
  usedAt?: Date;
  isActive: boolean;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'jobs' | 'analytics' | 'admin-invites'>('users');

  // 가상의 구인자(채용 공고) 데이터 2개 + 상태 관리
  const [jobPosts, setJobPosts] = useState<JobPost[]>([
    {
      id: '1',
      title: '평창 리조트 프론트 데스크',
      employer: '평창 리조트',
      status: 'active',
      createdAt: new Date('2024-07-01'),
      applications: 5
    },
    {
      id: '2',
      title: '용평 리조트 하우스키핑',
      employer: '용평 리조트',
      status: 'closed',
      createdAt: new Date('2024-06-15'),
      applications: 2
    }
  ]);

  // 가상의 사용자 데이터
  const [users] = useState<User[]>([
    {
      id: '1',
      email: 'employer1@example.com',
      role: 'employer',
      createdAt: new Date('2024-06-01'),
      status: 'active'
    },
    {
      id: '2',
      email: 'employer2@example.com',
      role: 'employer',
      createdAt: new Date('2024-06-15'),
      status: 'active'
    },
    {
      id: '3',
      email: 'jobseeker1@example.com',
      role: 'jobseeker',
      createdAt: new Date('2024-06-10'),
      status: 'active'
    },
    {
      id: '4',
      email: 'jobseeker2@example.com',
      role: 'jobseeker',
      createdAt: new Date('2024-06-20'),
      status: 'active'
    },
    {
      id: '5',
      email: 'jobseeker3@example.com',
      role: 'jobseeker',
      createdAt: new Date('2024-07-01'),
      status: 'active'
    },
    {
      id: '6',
      email: 'admin@resortbyte.com',
      role: 'admin',
      createdAt: new Date('2024-05-01'),
      status: 'active'
    }
  ]);

  // 관리자 초대 코드 상태
  const [adminInvites, setAdminInvites] = useState<AdminInvite[]>([
    {
      id: '1',
      code: 'RESORT_ADMIN_2024',
      createdBy: 'admin@resortbyte.com',
      createdAt: new Date('2024-06-01'),
      isActive: true
    },
    {
      id: '2',
      code: 'ADMIN_INVITE_001',
      createdBy: 'admin@resortbyte.com',
      createdAt: new Date('2024-07-01'),
      usedBy: 'newadmin@example.com',
      usedAt: new Date('2024-07-05'),
      isActive: false
    }
  ]);

  // 공고 등록 폼 상태
  const [showForm, setShowForm] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    employer: '',
    status: 'active' as 'active' | 'closed' | 'pending',
    applications: 0,
    createdAt: new Date()
  });

  // 통계 계산
  const totalUsers = users.length;
  const employerCount = users.filter(u => u.role === 'employer').length;
  const jobseekerCount = users.filter(u => u.role === 'jobseeker').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  const totalJobPosts = jobPosts.length;
  const activeJobPosts = jobPosts.filter(j => j.status === 'active').length;
  const closedJobPosts = jobPosts.filter(j => j.status === 'closed').length;
  const pendingJobPosts = jobPosts.filter(j => j.status === 'pending').length;

  const totalApplications = jobPosts.reduce((sum, job) => sum + job.applications, 0);
  const avgApplications = totalJobPosts > 0 ? Math.round(totalApplications / totalJobPosts) : 0;

  // user가 null이거나 admin이 아니면 접근 차단
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">접근 권한이 없습니다</h2>
          <p className="text-gray-600">관리자 권한이 필요합니다.</p>
        </div>
      </div>
    );
  }

  // 입력값 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewJob(prev => ({
      ...prev,
      [name]: name === 'applications'
        ? Number(value)
        : name === 'status'
        ? value as 'active' | 'closed' | 'pending'
        : value
    }));
  };

  // 등록 버튼 클릭 시
  const handleAddJob = () => {
    setJobPosts(prev => [
      ...prev,
      {
        ...newJob,
        id: Date.now().toString(),
        createdAt: new Date(newJob.createdAt)
      }
    ]);
    setShowForm(false);
    setNewJob({ title: '', employer: '', status: 'active', applications: 0, createdAt: new Date() });
  };

  // 관리자 초대 코드 생성
  const generateAdminInviteCode = () => {
    const code = `ADMIN_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const newInvite: AdminInvite = {
      id: Date.now().toString(),
      code,
      createdBy: user.email,
      createdAt: new Date(),
      isActive: true
    };
    setAdminInvites(prev => [newInvite, ...prev]);
  };

  // 초대 코드 복사
  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // 실제로는 토스트 메시지를 표시할 수 있습니다
    alert('초대 코드가 클립보드에 복사되었습니다.');
  };

  // 초대 코드 비활성화
  const deactivateInviteCode = (id: string) => {
    setAdminInvites(prev => 
      prev.map(invite => 
        invite.id === id ? { ...invite, isActive: false } : invite
      )
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        {/* 헤더 */}
        <div className="bg-red-600 text-white px-6 py-4 rounded-t-lg">
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
          <p className="text-red-100">시스템 관리 및 모니터링</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'users'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              사용자 관리
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'jobs'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              채용 공고 관리
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'analytics'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              통계
            </button>
            <button
              onClick={() => setActiveTab('admin-invites')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'admin-invites'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="w-4 h-4 mr-2" />
              관리자 초대
            </button>
          </nav>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6">
          {activeTab === 'users' && (
            <AdminUsers />
          )}

          {activeTab === 'jobs' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">채용 공고 관리</h2>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={() => setShowForm(true)}
                >
                  공고 등록
                </button>
              </div>

              {/* 공고 등록 폼 (모달) */}
              {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                    <h3 className="text-lg font-bold mb-4">채용 공고 등록</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">제목</label>
                        <input
                          type="text"
                          name="title"
                          value={newJob.title}
                          onChange={handleInputChange}
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">구인자</label>
                        <input
                          type="text"
                          name="employer"
                          value={newJob.employer}
                          onChange={handleInputChange}
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">상태</label>
                        <select
                          name="status"
                          value={newJob.status}
                          onChange={handleInputChange}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="active">활성</option>
                          <option value="closed">마감</option>
                          <option value="pending">대기</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">지원자 수</label>
                        <input
                          type="number"
                          name="applications"
                          value={newJob.applications}
                          onChange={handleInputChange}
                          className="w-full border rounded px-3 py-2"
                          min={0}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">등록일</label>
                        <input
                          type="date"
                          name="createdAt"
                          value={newJob.createdAt.toISOString().slice(0, 10)}
                          onChange={e => setNewJob(prev => ({ ...prev, createdAt: new Date(e.target.value) }))}
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-6">
                      <button
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        onClick={() => setShowForm(false)}
                      >
                        취소
                      </button>
                      <button
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        onClick={handleAddJob}
                        disabled={!newJob.title || !newJob.employer}
                      >
                        등록
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        구인자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        지원자 수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        등록일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobPosts.map(job => (
                      <tr key={job.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.employer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            job.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : job.status === 'closed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {job.status === 'active' ? '활성' : job.status === 'closed' ? '마감' : '대기'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.applications}명
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.createdAt.toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <select
                            value={job.status}
                            onChange={() => {}}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                            disabled
                          >
                            <option value="active">활성</option>
                            <option value="closed">마감</option>
                            <option value="pending">대기</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'admin-invites' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">관리자 초대 관리</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    새로운 관리자를 초대하기 위한 코드를 생성하고 관리합니다.
                  </p>
                </div>
                <button
                  onClick={generateAdminInviteCode}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  초대 코드 생성
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 mb-1">보안 안내</h3>
                    <p className="text-xs text-yellow-700">
                      • 생성된 초대 코드는 안전하게 전달하세요.<br/>
                      • 사용된 코드는 자동으로 비활성화됩니다.<br/>
                      • 불필요한 코드는 즉시 비활성화하세요.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        초대 코드
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        생성자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        생성일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {adminInvites.map(invite => (
                      <tr key={invite.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {invite.code}
                            </code>
                            {invite.isActive && (
                              <button
                                onClick={() => copyInviteCode(invite.code)}
                                className="ml-2 text-gray-400 hover:text-gray-600"
                                title="코드 복사"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invite.createdBy}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invite.createdAt.toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invite.usedBy || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invite.usedAt ? invite.usedAt.toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            invite.isActive 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {invite.isActive ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {invite.isActive && (
                            <button
                              onClick={() => deactivateInviteCode(invite.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              비활성화
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">통계</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-800">총 사용자</h3>
                  <p className="text-3xl font-bold text-blue-600">{totalUsers}명</p>
                  <p className="text-sm text-blue-600 mt-2">
                    구인자: {employerCount}명
                  </p>
                  <p className="text-sm text-blue-600">
                    구직자: {jobseekerCount}명
                  </p>
                  <p className="text-sm text-blue-600">
                    관리자: {adminCount}명
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-800">총 채용 공고</h3>
                  <p className="text-3xl font-bold text-green-600">{totalJobPosts}개</p>
                  <p className="text-sm text-green-600 mt-2">
                    활성: {activeJobPosts}개
                  </p>
                  <p className="text-sm text-green-600">
                    마감: {closedJobPosts}개
                  </p>
                  <p className="text-sm text-green-600">
                    대기: {pendingJobPosts}개
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-purple-800">총 지원</h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {totalApplications}건
                  </p>
                  <p className="text-sm text-purple-600 mt-2">
                    평균: {avgApplications}건/공고
                  </p>
                </div>
              </div>

              {/* 추가 통계 */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-800">최근 활동</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-yellow-700">
                      최근 가입: {users.length > 0 ? users[users.length - 1].email : '없음'}
                    </p>
                    <p className="text-sm text-yellow-700">
                      최근 공고: {jobPosts.length > 0 ? jobPosts[jobPosts.length - 1].title : '없음'}
                    </p>
                  </div>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-indigo-800">시스템 상태</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-indigo-700">
                      활성 사용자: {users.filter(u => u.status === 'active').length}명
                    </p>
                    <p className="text-sm text-indigo-700">
                      활성 공고: {activeJobPosts}개
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 
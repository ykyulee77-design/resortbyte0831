import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { initializeAdminAuth } from '../utils/adminAuth';
// Firebase import 제거됨
import UserManagement from '../components/admin/UserManagement';
import JobManagement from '../components/admin/JobManagement';
import MemberManagement from '../components/admin/MemberManagement';
import ReportManagement from '../components/admin/ReportManagement';
import LinkManagement from '../components/admin/LinkManagement';
import ResortLifeManagement from '../components/admin/ResortLifeManagement';
import { 
  cleanupAllData, 
  cleanupCollection, 
  cleanupJobPostsByStatus,
  cleanupOldApplications,
  cleanupInactiveUsers,
  cleanupResolvedReports,
  cleanupSampleData
} from '../utils/dataCleanup';
import { addSampleLinks } from '../utils/sampleLinks';
import { 
  Copy, 
  Shield, 
  Users, 
  FileText, 
  BarChart3, 
  UserPlus, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  Database,
  Server,
  Globe,
  Shield as ShieldIcon,
  Zap,
  Clock,
  DollarSign,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Bell,
  Search,
  Filter,
  Calendar,
  MapPin,
  Building,
  Heart,
  Home,
  Star,
  MessageSquare,
  Flag,
  Archive,
  Trash2,
  Edit,
  Plus,
  MoreHorizontal
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalJobPosts: number;
  totalApplications: number;
  activeEmployers: number;
  activeJobseekers: number;
  pendingApprovals: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  uptime: number; // 분 단위
  responseTime: number; // ms
  errorRate: number; // %
  storageUsed: number; // GB
  storageLimit: number; // GB
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'job_post' | 'application' | 'system_alert' | 'admin_action';
  description: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'success';
  userId?: string;
  jobPostId?: string;
}

interface AdminInvite {
  id: string;
  code: string;
  createdBy: string;
  createdAt: Date;
  usedBy?: string;
  usedAt?: Date;
  isActive: boolean;
  role: 'admin' | 'moderator';
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 관리자 권한 체크
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    // 관리자 권한 초기화 (버튼/액션 표시용 권한 로드)
    if (user?.uid) {
      initializeAdminAuth(user.uid).catch(() => {
        // 초기화 실패 시에도 페이지는 접근 가능하되, 제한적 표시
      });
    }
  }, [user, navigate]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'analytics' | 'system' | 'admin-invites' | 'settings' | 'reports' | 'links' | 'resort-life'>('overview');
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalJobPosts: 0,
    totalApplications: 0,
    activeEmployers: 0,
    activeJobseekers: 0,
    pendingApprovals: 0,
    systemHealth: 'excellent',
    uptime: 0,
    responseTime: 0,
    errorRate: 0,
    storageUsed: 0,
    storageLimit: 10
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDataCleanupModal, setShowDataCleanupModal] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  // 신고 개수 관련 코드 제거됨

  // 데이터 초기화 함수들
  const handleFullDataCleanup = async () => {
    if (!confirm('⚠️ 경고: 모든 데이터가 삭제됩니다. 관리자 계정만 보존됩니다. 계속하시겠습니까?')) {
      return;
    }
    
    setCleanupLoading(true);
    try {
      const result = await cleanupAllData(true);
      if (result.success) {
        alert('데이터 초기화가 완료되었습니다.');
        setShowDataCleanupModal(false);
        // 페이지 새로고침
        window.location.reload();
      } else {
        alert('데이터 초기화에 실패했습니다: ' + result.message);
      }
    } catch (error) {
      console.error('데이터 초기화 오류:', error);
      alert('데이터 초기화 중 오류가 발생했습니다.');
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleCollectionCleanup = async (collectionName: string) => {
    if (!confirm(`⚠️ ${collectionName} 컬렉션의 모든 데이터가 삭제됩니다. 계속하시겠습니까?`)) {
      return;
    }
    
    setCleanupLoading(true);
    try {
      const result = await cleanupCollection(collectionName);
      if (result.success) {
        alert(`${collectionName} 컬렉션이 삭제되었습니다.`);
        setShowDataCleanupModal(false);
        // 페이지 새로고침
        window.location.reload();
      } else {
        alert(`${collectionName} 삭제에 실패했습니다: ` + result.message);
      }
    } catch (error) {
      console.error(`${collectionName} 삭제 오류:`, error);
      alert(`${collectionName} 삭제 중 오류가 발생했습니다.`);
    } finally {
      setCleanupLoading(false);
    }
  };

  // 선택적 삭제 함수들
  const handleSelectiveCleanup = async (cleanupFunction: () => Promise<{success: boolean, message: string}>, confirmMessage: string) => {
    if (!confirm(confirmMessage)) {
      return;
    }
    
    setCleanupLoading(true);
    try {
      const result = await cleanupFunction();
      if (result.success) {
        alert(result.message);
        setShowDataCleanupModal(false);
        // 페이지 새로고침
        window.location.reload();
      } else {
        alert('삭제에 실패했습니다: ' + result.message);
      }
    } catch (error) {
      console.error('선택적 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setCleanupLoading(false);
    }
  };

  // 시스템 통계 로드
  useEffect(() => {
    const loadSystemStats = async () => {
      try {
        setLoading(true);
        // 실제 데이터베이스에서 통계 로드
        // 임시 데이터
        setSystemStats({
          totalUsers: 156,
          totalJobPosts: 89,
          totalApplications: 342,
          activeEmployers: 23,
          activeJobseekers: 133,
          pendingApprovals: 5,
          systemHealth: 'excellent',
          uptime: 1440, // 24시간
          responseTime: 245,
          errorRate: 0.02,
          storageUsed: 2.3,
          storageLimit: 10
        });
      } catch (error) {
        console.error('시스템 통계 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSystemStats();
  }, []);

  // 시스템 상태 색상
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 저장소 사용률
  const storageUsagePercent = (systemStats.storageUsed / systemStats.storageLimit) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-resort-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
                <p className="text-sm text-gray-600">시스템 모니터링 및 관리</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(systemStats.systemHealth)}`}>
                <Activity className="inline h-4 w-4 mr-1" />
                {systemStats.systemHealth === 'excellent' && '정상'}
                {systemStats.systemHealth === 'good' && '양호'}
                {systemStats.systemHealth === 'warning' && '주의'}
                {systemStats.systemHealth === 'critical' && '위험'}
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: '개요', icon: BarChart3 },
              { id: 'users', label: '회원 관리', icon: Users },
              { id: 'jobs', label: '공고 관리', icon: FileText },
              { id: 'reports', label: '신고 관리', icon: Flag },
              { id: 'links', label: '링크 관리', icon: Globe },
              { id: 'resort-life', label: '리조트바이트 생활', icon: Heart },
              { id: 'analytics', label: '분석', icon: TrendingUp },
              { id: 'system', label: '시스템', icon: Server },
              { id: 'admin-invites', label: '관리자 초대', icon: UserPlus },
              { id: 'settings', label: '설정', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-resort-500 text-resort-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
            </button>
              );
            })}
          </nav>
        </div>

        {/* 개요 탭 */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 관리 기능 바로가기 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">관리 기능</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 flex items-start gap-3"
                >
                  <div className="p-2 bg-blue-100 rounded-md">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">회원 관리</div>
                    <div className="text-xs text-gray-500">회원 승인/정지/권한</div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 flex items-start gap-3"
                >
                  <div className="p-2 bg-green-100 rounded-md">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">공고 관리</div>
                    <div className="text-xs text-gray-500">공고 승인/거부/삭제</div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('system')}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 flex items-start gap-3"
                >
                  <div className="p-2 bg-purple-100 rounded-md">
                    <Server className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">시스템 모니터링</div>
                    <div className="text-xs text-gray-500">상태/성능/저장소</div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 flex items-start gap-3"
                >
                  <div className="p-2 bg-gray-100 rounded-md">
                    <Settings className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">설정</div>
                    <div className="text-xs text-gray-500">시스템 기본 설정</div>
                  </div>
                </button>
              </div>
            </div>
            {/* 주요 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 사용자</p>
                    <p className="text-2xl font-bold text-gray-900">{systemStats.totalUsers.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">+12%</span>
                  <span className="text-gray-500 ml-1">이번 주</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">활성 공고</p>
                    <p className="text-2xl font-bold text-gray-900">{systemStats.totalJobPosts}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">+8%</span>
                  <span className="text-gray-500 ml-1">이번 주</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">지원서</p>
                    <p className="text-2xl font-bold text-gray-900">{systemStats.totalApplications}</p>
                  </div>
                      </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">+15%</span>
                  <span className="text-gray-500 ml-1">이번 주</span>
                      </div>
                      </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                      </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">승인 대기</p>
                    <p className="text-2xl font-bold text-gray-900">{systemStats.pendingApprovals}</p>
                      </div>
                    </div>
                <div className="mt-4 flex items-center text-sm">
                  <XCircle className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-600">처리 필요</span>
                    </div>
                  </div>
                </div>

            {/* 시스템 상태 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 상태</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">응답 시간</span>
                    <span className="text-sm font-medium">{systemStats.responseTime}ms</span>
              </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">가동 시간</span>
                    <span className="text-sm font-medium">{Math.floor(systemStats.uptime / 60)}시간 {systemStats.uptime % 60}분</span>
            </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">오류율</span>
                    <span className="text-sm font-medium">{systemStats.errorRate}%</span>
                </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">저장소 사용량</span>
                    <span className="text-sm font-medium">{systemStats.storageUsed}GB / {systemStats.storageLimit}GB</span>
              </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        storageUsagePercent > 80 ? 'bg-red-500' : 
                        storageUsagePercent > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${storageUsagePercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <Users className="h-5 w-5 text-blue-600 mb-2" />
                                         <p className="text-sm font-medium">회원 관리</p>
                     <p className="text-xs text-gray-500">회원 승인/정지</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('jobs')}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <FileText className="h-5 w-5 text-green-600 mb-2" />
                    <p className="text-sm font-medium">공고 관리</p>
                    <p className="text-xs text-gray-500">공고 승인/거부</p>
                  </button>
                              <button
                    onClick={() => setActiveTab('system')}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                              >
                    <Server className="h-5 w-5 text-purple-600 mb-2" />
                    <p className="text-sm font-medium">시스템 모니터링</p>
                    <p className="text-xs text-gray-500">성능 확인</p>
                              </button>
                            <button
                    onClick={() => setActiveTab('admin-invites')}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                    <UserPlus className="h-5 w-5 text-orange-600 mb-2" />
                    <p className="text-sm font-medium">관리자 초대</p>
                    <p className="text-xs text-gray-500">새 관리자 추가</p>
                            </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 회원 관리 탭 */}
        {activeTab === 'users' && <MemberManagement />}
        
        {/* 공고 관리 탭 */}
        {activeTab === 'jobs' && <JobManagement />}
        
        {/* 신고 관리 탭 */}
        {activeTab === 'reports' && <ReportManagement />}
        
        {/* 링크 관리 탭 */}
        {activeTab === 'links' && <LinkManagement />}
        
        {/* 리조트바이트 생활 관리 탭 */}
        {activeTab === 'resort-life' && <ResortLifeManagement />}
        
        {/* 분석 탭 */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">데이터 분석</h2>
              <p className="text-gray-600">분석 기능은 개발 중입니다.</p>
              </div>
            </div>
          )}

        {/* 시스템 모니터링 탭 */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            {/* 데이터 관리 섹션 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">데이터 관리</h2>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-lg font-medium text-red-800 mb-2">⚠️ 데이터 초기화</h3>
                  <p className="text-red-700 mb-4">
                    배포 전 샘플 데이터를 정리하거나 전체 데이터를 초기화할 수 있습니다.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDataCleanupModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      데이터 초기화 관리
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">시스템 모니터링</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">시스템 상태</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">CPU 사용률</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">메모리 사용률</span>
                      <span className="text-sm font-medium">62%</span>
                </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">디스크 사용률</span>
                      <span className="text-sm font-medium">23%</span>
                </div>
                </div>
              </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">네트워크</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">응답 시간</span>
                      <span className="text-sm font-medium">245ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">오류율</span>
                      <span className="text-sm font-medium">0.02%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">가동 시간</span>
                      <span className="text-sm font-medium">24시간</span>
                  </div>
                </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        
        {/* 관리자 초대 탭 */}
        {activeTab === 'admin-invites' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">관리자 초대</h2>
              <p className="text-gray-600">관리자 초대 기능은 개발 중입니다.</p>
            </div>
          </div>
        )}
        
        {/* 설정 탭 */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">시스템 설정</h2>
              <p className="text-gray-600">시스템 설정 기능은 개발 중입니다.</p>
        </div>
          </div>
        )}

        {/* 데이터 초기화 모달 */}
        {showDataCleanupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">데이터 초기화 관리</h3>
                <button
                  onClick={() => setShowDataCleanupModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={cleanupLoading}
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ 주의사항</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• 데이터 삭제는 되돌릴 수 없습니다</li>
                    <li>• 전체 초기화 시 관리자 계정은 보존됩니다</li>
                    <li>• 개별 컬렉션 삭제 시 해당 데이터만 삭제됩니다</li>
                  </ul>
                </div>

                {/* 샘플 데이터 관리 */}
                <div className="border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-2">🎯 샘플 데이터 관리</h4>
                  <p className="text-sm text-orange-700 mb-3">
                    샘플 데이터를 삭제하거나 유용한 링크 샘플을 추가할 수 있습니다.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSelectiveCleanup(
                        cleanupSampleData,
                        '⚠️ 샘플 데이터(sample-employer로 시작하는 데이터)를 삭제하시겠습니까?'
                      )}
                      disabled={cleanupLoading}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      {cleanupLoading ? '처리 중...' : '샘플 데이터 삭제'}
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm('샘플 링크를 추가하시겠습니까?')) return;
                        setCleanupLoading(true);
                        try {
                          const result = await addSampleLinks();
                          if (result.success) {
                            alert(result.message);
                          } else {
                            alert(result.message);
                          }
                        } catch (error) {
                          console.error('샘플 링크 추가 오류:', error);
                          alert('샘플 링크 추가 중 오류가 발생했습니다.');
                        } finally {
                          setCleanupLoading(false);
                        }
                      }}
                      disabled={cleanupLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {cleanupLoading ? '처리 중...' : '샘플 링크 추가'}
                    </button>
                  </div>
                </div>

                {/* 전체 데이터 초기화 */}
                <div className="border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">전체 데이터 초기화</h4>
                  <p className="text-sm text-red-700 mb-3">
                    모든 샘플 데이터를 삭제하고 관리자 계정만 보존합니다.
                  </p>
                  <button
                    onClick={handleFullDataCleanup}
                    disabled={cleanupLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {cleanupLoading ? '처리 중...' : '전체 데이터 초기화'}
                  </button>
                </div>

                {/* 선택적 삭제 옵션 */}
                <div className="border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-3">🎯 선택적 삭제</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleSelectiveCleanup(
                        () => cleanupJobPostsByStatus('pending'),
                        '⚠️ 대기 중인 공고를 모두 삭제하시겠습니까?'
                      )}
                      disabled={cleanupLoading}
                      className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50 text-sm"
                    >
                      대기 중인 공고 삭제
                    </button>
                    
                    <button
                      onClick={() => handleSelectiveCleanup(
                        () => cleanupJobPostsByStatus('rejected'),
                        '⚠️ 거부된 공고를 모두 삭제하시겠습니까?'
                      )}
                      disabled={cleanupLoading}
                      className="px-3 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 text-sm"
                    >
                      거부된 공고 삭제
                    </button>
                    
                    <button
                      onClick={() => handleSelectiveCleanup(
                        () => cleanupOldApplications(30),
                        '⚠️ 30일 이전의 지원서를 모두 삭제하시겠습니까?'
                      )}
                      disabled={cleanupLoading}
                      className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 text-sm"
                    >
                      30일 이전 지원서 삭제
                    </button>
                    
                    <button
                      onClick={() => handleSelectiveCleanup(
                        cleanupInactiveUsers,
                        '⚠️ 관리자를 제외한 모든 사용자를 삭제하시겠습니까?'
                      )}
                      disabled={cleanupLoading}
                      className="px-3 py-2 bg-indigo-100 text-indigo-800 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50 text-sm"
                    >
                      비관리자 사용자 삭제
                    </button>
                    
                    <button
                      onClick={() => handleSelectiveCleanup(
                        cleanupResolvedReports,
                        '⚠️ 처리된 신고를 모두 삭제하시겠습니까?'
                      )}
                      disabled={cleanupLoading}
                      className="px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 text-sm"
                    >
                      처리된 신고 삭제
                    </button>
                  </div>
                </div>

                {/* 개별 컬렉션 삭제 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">전체 컬렉션 삭제</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'jobPosts', label: '공고 데이터' },
                      { name: 'applications', label: '지원 데이터' },
                      { name: 'companyInfo', label: '회사 정보' },
                      { name: 'accommodationInfo', label: '기숙사 정보' },
                      { name: 'reports', label: '신고 데이터' },
                      { name: 'evaluations', label: '평가 데이터' }
                    ].map((collection) => (
                      <button
                        key={collection.name}
                        onClick={() => handleCollectionCleanup(collection.name)}
                        disabled={cleanupLoading}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
                      >
                        {collection.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 
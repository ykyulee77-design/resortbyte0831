import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'analytics' | 'system' | 'admin-invites' | 'settings'>('overview');
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
              { id: 'users', label: '사용자 관리', icon: Users },
              { id: 'jobs', label: '공고 관리', icon: FileText },
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
                    <p className="text-sm font-medium">사용자 관리</p>
                    <p className="text-xs text-gray-500">사용자 승인/정지</p>
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

        {/* 다른 탭들은 기존 컴포넌트 사용 */}
        {activeTab === 'users' && <div>사용자 관리 컴포넌트</div>}
        {activeTab === 'jobs' && <div>공고 관리 컴포넌트</div>}
        {activeTab === 'analytics' && <div>분석 컴포넌트</div>}
        {activeTab === 'system' && <div>시스템 모니터링 컴포넌트</div>}
        {activeTab === 'admin-invites' && <div>관리자 초대 컴포넌트</div>}
        {activeTab === 'settings' && <div>설정 컴포넌트</div>}
      </div>
    </div>
  );
};

export default AdminDashboard; 
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, FileText, TrendingUp, Calendar } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalJobPosts: number;
  totalApplications: number;
  activeJobPosts: number;
  jobseekers: number;
  employers: number;
  admins: number;
  recentJobPosts: number;
  recentApplications: number;
}

const AdminStats: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalJobPosts: 0,
    totalApplications: 0,
    activeJobPosts: 0,
    jobseekers: 0,
    employers: 0,
    admins: 0,
    recentJobPosts: 0,
    recentApplications: 0
  });
  const [loading, setLoading] = useState(true);

  // Firebase에서 통계 데이터 가져오기
  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // 사용자 통계
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        role: doc.data().role,
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      // 공고 통계
      const jobPostsQuery = query(collection(db, 'jobPosts'), orderBy('createdAt', 'desc'));
      const jobPostsSnapshot = await getDocs(jobPostsQuery);
      const jobPosts = jobPostsSnapshot.docs.map(doc => ({
        id: doc.id,
        isActive: doc.data().isActive,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        applications: doc.data().applications || []
      }));

      // 지원 통계
      const applicationsQuery = query(collection(db, 'applications'), orderBy('appliedAt', 'desc'));
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const applications = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        appliedAt: doc.data().appliedAt?.toDate() || new Date()
      }));

      // 최근 7일 계산
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // 통계 계산
      const newStats: Stats = {
        totalUsers: users.length,
        totalJobPosts: jobPosts.length,
        totalApplications: applications.length,
        activeJobPosts: jobPosts.filter(job => job.isActive).length,
        jobseekers: users.filter(user => user.role === 'jobseeker').length,
        employers: users.filter(user => user.role === 'employer').length,
        admins: users.filter(user => user.role === 'admin').length,
        recentJobPosts: jobPosts.filter(job => job.createdAt >= sevenDaysAgo).length,
        recentApplications: applications.filter(app => app.appliedAt >= sevenDaysAgo).length
      };

      setStats(newStats);
    } catch (error) {
      console.error('통계 데이터 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
          <p className="text-gray-600">통계를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">대시보드 통계</h2>
        <p className="text-gray-600">리조트바이트 플랫폼의 전체 현황을 확인하세요.</p>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 사용자</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 공고</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalJobPosts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 지원</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">활성 공고</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeJobPosts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 사용자 분포 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">사용자 분포</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900">구직자</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.jobseekers}명</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900">구인자</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.employers}명</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900">관리자</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.admins}명</span>
              </div>
            </div>
            
            {/* 원형 차트 */}
            <div className="mt-6">
              <div className="flex justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    {stats.totalUsers > 0 && (
                      <>
                        <circle
                          cx="64"
                          cy="64"
                          r="54"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-blue-500"
                          strokeDasharray={`${(stats.jobseekers / stats.totalUsers) * 339.292} 339.292`}
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="54"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-green-500"
                          strokeDasharray={`${(stats.employers / stats.totalUsers) * 339.292} 339.292`}
                          strokeDashoffset={`-${(stats.jobseekers / stats.totalUsers) * 339.292}`}
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="54"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-red-500"
                          strokeDasharray={`${(stats.admins / stats.totalUsers) * 339.292} 339.292`}
                          strokeDashoffset={`-${((stats.jobseekers + stats.employers) / stats.totalUsers) * 339.292}`}
                        />
                      </>
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">{stats.totalUsers}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">최근 7일 활동</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">새 공고</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.recentJobPosts}개</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${Math.min((stats.recentJobPosts / Math.max(stats.totalJobPosts, 1)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">새 지원</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.recentApplications}건</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${Math.min((stats.recentApplications / Math.max(stats.totalApplications, 1)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">활동 요약</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• 평균 일일 공고 등록: {(stats.recentJobPosts / 7).toFixed(1)}개</p>
                <p>• 평균 일일 지원: {(stats.recentApplications / 7).toFixed(1)}건</p>
                <p>• 공고 활성화율: {stats.totalJobPosts > 0 ? ((stats.activeJobPosts / stats.totalJobPosts) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 추가 통계 정보 */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">플랫폼 현황</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.totalJobPosts > 0 ? ((stats.totalApplications / stats.totalJobPosts) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-gray-600">평균 지원률</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.totalUsers > 0 ? ((stats.employers / stats.totalUsers) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-gray-600">구인자 비율</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.totalJobPosts > 0 ? ((stats.activeJobPosts / stats.totalJobPosts) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-gray-600">공고 활성화율</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats; 
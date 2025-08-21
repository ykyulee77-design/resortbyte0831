import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, DollarSign, Send, FileText, Clock, Sparkles, Target, User, Users, Building, Share2, Check } from 'lucide-react';
import UnifiedScheduleGrid from '../components/UnifiedScheduleGrid';

import ActivityTimeline from '../components/ActivityTimeline';
import { TimeSlot } from '../types';


interface JobPost {
  id: string;
  title: string;
  employerName: string;
  location: string;
  salary: { min: number; max: number };
  scheduleType: string;
  workTypes: any[];
  recommendationScore?: number;
  reasons?: string[];
}

interface Application {
  id: string;
  jobPostId: string;
  status: string;
  appliedAt: any;
}

interface WorkerAvailability {
  id: string;
  dayOfWeek: number;
  timeSlot: number;
  priority: string;
}



const JobseekerDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [workerAvailabilities, setWorkerAvailabilities] = useState<WorkerAvailability[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [recommendedJobs, setRecommendedJobs] = useState<JobPost[]>([]);
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);
  const [showAllRecommendedJobs, setShowAllRecommendedJobs] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch job posts
        const jobPostsQuery = query(collection(db, 'jobPosts'), orderBy('createdAt', 'desc'));
        const jobPostsSnapshot = await getDocs(jobPostsQuery);
        const jobPostsData = jobPostsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as JobPost[];
        setJobPosts(jobPostsData);

        // Fetch applications
        if (user) {
          const applicationsQuery = query(
            collection(db, 'applications'),
            where('jobseekerId', '==', user.uid)
          );
          const applicationsSnapshot = await getDocs(applicationsQuery);
          const applicationsData = applicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Application[];
          setApplications(applicationsData);

          // Fetch worker availabilities
          const availabilitiesQuery = query(
            collection(db, 'workerAvailabilities'),
            where('jobseekerId', '==', user.uid)
          );
          const availabilitiesSnapshot = await getDocs(availabilitiesQuery);
          const availabilitiesData = availabilitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WorkerAvailability[];
          setWorkerAvailabilities(availabilitiesData);

          // Generate activities
          const generatedActivities = generateActivities(applicationsData, jobPostsData);
          setActivities(generatedActivities);

          // Generate recommendations
          const recommendations = generateRecommendations(jobPostsData, user.resume);
          setRecommendedJobs(recommendations);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const convertAvailabilitiesToTimeSlots = (availabilities: WorkerAvailability[]): TimeSlot[] => {
    return availabilities.map(availability => ({
      day: availability.dayOfWeek,
      start: availability.timeSlot,
      end: availability.timeSlot + 1,
      priority: availability.priority === 'high' ? 1 : 2
    }));
  };

  const generateActivities = (applications: Application[], jobPosts: JobPost[]) => {
    const activities: any[] = [];
    
    applications.forEach(application => {
      const jobPost = jobPosts.find(post => post.id === application.jobPostId);
      if (!jobPost) return;

      // 지원 활동
      activities.push({
        id: `app-${application.id}`,
        type: 'application',
        title: '일자리 지원',
        description: `${jobPost.title}에 지원했습니다`,
        timestamp: application.appliedAt?.toDate?.() || new Date(),
        jobTitle: jobPost.title,
        companyName: jobPost.employerName,
        status: application.status
      });

      // 상태 변경 활동 (최근 상태가 pending이 아닌 경우)
      if (application.status !== 'pending') {
        activities.push({
          id: `status-${application.id}`,
          type: 'status_change',
          title: '지원 상태 변경',
          description: `${jobPost.title}의 지원 상태가 변경되었습니다`,
          timestamp: application.appliedAt?.toDate?.() || new Date(),
          jobTitle: jobPost.title,
          companyName: jobPost.employerName,
          status: application.status
        });
      }
    });

    // 근무시간 설정 활동 (최근에 설정한 경우)
    if (workerAvailabilities.length > 0) {
      activities.push({
        id: 'schedule-update',
        type: 'schedule_update',
        title: '근무시간 설정',
        description: '선호하는 근무시간을 설정했습니다',
        timestamp: new Date(),
      });
    }

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // 매칭 추천 함수
  const generateRecommendations = (jobPosts: JobPost[], userResume: any) => {
    if (!userResume) return [];

    const recommendations = jobPosts
      .filter(jobPost => {
        // 이미 지원한 공고는 제외
        const hasApplied = applications.some(app => app.jobPostId === jobPost.id);
        if (hasApplied) return false;

        // 시급 조건 확인
        if (userResume.hourlyWage && jobPost.salary) {
          const jobMinWage = jobPost.salary.min;
          const userWage = userResume.hourlyWage;
          // 사용자 희망 시급의 80% 이상인 공고만 추천
          if (jobMinWage < userWage * 0.8) return false;
        }

        return true;
      })
      .map(jobPost => {
        let score = 0;
        let reasons: string[] = [];

        // 시급 매칭 점수 (최대 30점)
        if (userResume.hourlyWage && jobPost.salary) {
          const jobMinWage = jobPost.salary.min;
          const userWage = userResume.hourlyWage;
          const wageRatio = Math.min(jobMinWage / userWage, 1.5);
          const wageScore = Math.round((wageRatio - 0.8) * 100);
          score += Math.max(0, Math.min(30, wageScore));
          if (wageScore > 0) reasons.push('시급 조건 부합');
        }

        // 선호시간 매칭 점수 (최대 40점)
        if (userResume.preferredTimeType === 'specific' && userResume.preferredTimeSlots && jobPost.workTypes) {
          let timeScore = 0;
          jobPost.workTypes.forEach(workType => {
            if (workType.schedules && userResume.preferredTimeSlots) {
              // 간단한 시간 매칭 로직 (calculateMatchingScore 대신)
              const userSlots = userResume.preferredTimeSlots;
              const jobSlots = workType.schedules;
              let matchedSlots = 0;
              
              jobSlots.forEach((jobSlot: any) => {
                const hasMatch = userSlots.some((userSlot: any) => 
                  userSlot.day === jobSlot.day && 
                  !(userSlot.end <= jobSlot.start || userSlot.start >= jobSlot.end)
                );
                if (hasMatch) matchedSlots++;
              });
              
              timeScore = Math.max(timeScore, (matchedSlots / jobSlots.length) * 100);
            }
          });
          score += Math.round((timeScore / 100) * 40);
          if (timeScore > 0) reasons.push('선호시간 부합');
        } else if (userResume.preferredTimeType === 'general') {
          score += 25; // 일반 타입은 기본 점수
          reasons.push('시간대 무관');
        }

        // 근무타입 매칭 점수 (최대 30점)
        if (userResume.jobType && jobPost.workTypes) {
          const hasMatchingWorkType = jobPost.workTypes.some(workType => 
            workType.name && workType.name.toLowerCase().includes(userResume.jobType.toLowerCase())
          );
          if (hasMatchingWorkType) {
            score += 30;
            reasons.push('희망 직무 부합');
          }
        }

        return {
          ...jobPost,
          recommendationScore: score,
          reasons
        };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 10); // 상위 10개 추천 (더보기 기능을 위해)

    return recommendations;
  };

  // 공유하기 함수
  const handleShareJob = async (jobPost: JobPost) => {
    const shareUrl = `${window.location.origin}/job-post/${jobPost.id}`;
    const shareText = `🏖️ 리조트 일자리 추천!\n\n${jobPost.title}\n${jobPost.employerName}\n${jobPost.location}\n${jobPost.salary ? `${jobPost.salary.min.toLocaleString()}원 ~ ${jobPost.salary.max.toLocaleString()}원` : '급여 협의'}\n\n자세히 보기: ${shareUrl}`;

    try {
      if (navigator.share) {
        // 네이티브 공유 API 사용 (모바일)
        await navigator.share({
          title: jobPost.title,
          text: shareText,
          url: shareUrl,
        });
      } else {
        // 클립보드 복사 (데스크톱)
        await navigator.clipboard.writeText(shareText);
        setCopiedJobId(jobPost.id);
        setTimeout(() => setCopiedJobId(null), 2000);
      }
    } catch (error) {
      console.error('공유하기 실패:', error);
      // 폴백: 클립보드 복사
      try {
        await navigator.clipboard.writeText(shareText);
        setCopiedJobId(jobPost.id);
        setTimeout(() => setCopiedJobId(null), 2000);
      } catch (clipboardError) {
        console.error('클립보드 복사 실패:', clipboardError);
      }
    }
  };

  const saveAvailabilities = async (timeSlots: TimeSlot[], closeModal: boolean = false) => {
    if (!user) return;

    try {
      // Delete existing availabilities
      const deletePromises = workerAvailabilities.map(availability =>
        deleteDoc(doc(db, 'workerAvailabilities', availability.id))
      );
      await Promise.all(deletePromises);

      // Add new availabilities
      const addPromises = timeSlots.map(slot =>
        addDoc(collection(db, 'workerAvailabilities'), {
          jobseekerId: user.uid,
          dayOfWeek: slot.day,
          timeSlot: slot.start,
          priority: slot.priority === 1 ? 'high' : 'low',
          createdAt: serverTimestamp()
        })
      );
      await Promise.all(addPromises);

      // Update user's resume with preferred time slots
      if (user.resume) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          'resume.preferredTimeType': 'specific',
          'resume.preferredTimeSlots': timeSlots
        });
      }

      // Update local state
      const newAvailabilities: WorkerAvailability[] = timeSlots.map((slot, index) => ({
        id: `temp-${index}`,
        dayOfWeek: slot.day,
        timeSlot: slot.start,
        priority: slot.priority === 1 ? 'high' : 'low'
      }));
      setWorkerAvailabilities(newAvailabilities);

      if (closeModal) {
        setShowScheduleModal(false);
      }
    } catch (error) {
      console.error('Error saving availabilities:', error);
    }
  };

  const filteredJobPosts = jobPosts.filter(post => {
    const notApplied = !applications.some(app => app.jobPostId === post.id);
    return notApplied;
  });



  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              안녕하세요, {user?.displayName}님!
            </h1>
            <p className="text-base text-gray-600">
              맞춤 일자리를 찾아보세요
            </p>
          </div>
        </div>



        {/* 메인 콘텐츠 - 세로 배치 */}
        <div className="space-y-6">
          {/* 내 프로필 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-blue-50 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                  <User className="w-5 h-5 text-white" />
                </div>
                내 프로필
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* 프로필 정보 행 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-xl font-bold text-white">
                        {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{user?.displayName || '사용자'}</h4>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="text-center px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-lg font-bold text-blue-600">{applications.length}</div>
                      <div className="text-xs text-blue-700">총지원</div>
                    </div>
                    <div className="text-center px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="text-lg font-bold text-amber-600">{applications.filter(app => app.status === 'pending' || app.status === 'reviewing').length}</div>
                      <div className="text-xs text-amber-700">검토중</div>
                    </div>
                    <div className="text-center px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="text-lg font-bold text-emerald-600">{applications.filter(app => app.status === 'accepted').length}</div>
                      <div className="text-xs text-emerald-700">채용됨</div>
                    </div>
                  </div>
                </div>



                {/* 이력서 정보 행 */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    이력서
                  </h4>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">상태:</span>
                        <span className={`font-medium px-3 py-1 rounded-full text-sm ${
                          user?.resume ? 'text-gray-900 bg-gray-200' : 'text-gray-600 bg-gray-100'
                        }`}>
                          {user?.resume ? '완료' : '미완성'}
                        </span>
                      </div>
                      {user?.resume && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">희망 시급:</span>
                          <span className="text-gray-900 font-medium">
                            {user.resume.hourlyWage ? 
                              `${user.resume.hourlyWage.toLocaleString()}원` : 
                              '미입력'
                            }
                          </span>
                        </div>
                      )}
                    </div>
                    <Link
                      to="/profile"
                      className="group relative bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 text-sm font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      <span className="relative z-10">이력서 관리</span>
                    </Link>
                  </div>
                </div>

                {/* 크루 행 */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-600" />
                    크루
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">8개</div>
                      <div className="text-xs text-gray-600">다시 같이 일해요</div>
                      <div className="text-xs text-gray-500 mt-1">(총 12개 근무경험)</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">156h</div>
                      <div className="text-xs text-gray-600">총 근무시간</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">4.8</div>
                      <div className="text-xs text-gray-600">평균 평점</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">98%</div>
                      <div className="text-xs text-gray-600">만족도</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 지원현황 및 추천 일자리 섹션들 */}
          <div className="space-y-6">
            {/* 지원현황 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                          <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                <Send className="w-5 h-5 text-gray-600" />
                지원현황
                    <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                      {filteredApplications.length}개
                    </span>
              </h3>
                  <div className="flex items-center gap-4">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="all">전체</option>
                      <option value="pending">지원 완료</option>
                      <option value="reviewing">검토 중</option>
                      <option value="interview_scheduled">면접 예정</option>
                      <option value="accepted">채용 확정</option>
                      <option value="rejected">불합격</option>
                    </select>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span>검토 중: {applications.filter(app => app.status === 'pending' || app.status === 'reviewing').length}개</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>채용 확정: {applications.filter(app => app.status === 'accepted').length}개</span>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
            <div className="p-6">
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">아직 지원한 일자리가 없습니다</h3>
                  <p className="text-sm text-gray-500">관심 있는 일자리에 지원해보세요</p>
                </div>
              ) : (
                  <div className="grid gap-4">
                    {filteredApplications.slice(0, 6).map((application) => {
                    const jobPost = jobPosts.find(post => post.id === application.jobPostId);
                    if (!jobPost) return null;

                    const getStatusColor = (status: string) => {
                      switch (status) {
                          case 'pending': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
                          case 'reviewing': return 'text-blue-600 bg-blue-100 border-blue-200';
                          case 'interview_scheduled': return 'text-purple-600 bg-purple-100 border-purple-200';
                          case 'interview_completed': return 'text-indigo-600 bg-indigo-100 border-indigo-200';
                          case 'offer_sent': return 'text-orange-600 bg-orange-100 border-orange-200';
                          case 'accepted': return 'text-green-600 bg-green-100 border-green-200';
                          case 'rejected': return 'text-red-600 bg-red-100 border-red-200';
                          case 'withdrawn': return 'text-gray-600 bg-gray-100 border-gray-200';
                          default: return 'text-gray-600 bg-gray-100 border-gray-200';
                      }
                    };

                    const getStatusText = (status: string) => {
                      switch (status) {
                          case 'pending': return '지원 완료';
                          case 'reviewing': return '검토 중';
                          case 'interview_scheduled': return '면접 예정';
                          case 'interview_completed': return '면접 완료';
                          case 'offer_sent': return '제안 전송';
                          case 'accepted': return '채용 확정';
                          case 'rejected': return '불합격';
                          case 'withdrawn': return '지원 취소';
                        default: return '알 수 없음';
                      }
                    };

                      const getStatusIcon = (status: string) => {
                        switch (status) {
                          case 'pending': return '📝';
                          case 'reviewing': return '👀';
                          case 'interview_scheduled': return '📅';
                          case 'interview_completed': return '✅';
                          case 'offer_sent': return '💼';
                          case 'accepted': return '🎉';
                          case 'rejected': return '❌';
                          case 'withdrawn': return '↩️';
                          default: return '❓';
                        }
                      };

                    return (
                      <div
                          key={application.id}
                          className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                        >
                          <Link to={`/application-detail/${application.id}`} className="flex-1 min-w-0 cursor-pointer">
                            <div className="flex items-center gap-4 text-sm">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleShareJob(jobPost);
                                }}
                                className="flex items-center justify-center w-6 h-6 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors"
                                title="친구에게 공유하기"
                              >
                                {copiedJobId === jobPost.id ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Share2 className="w-4 h-4" />
                                )}
                              </button>
                              <span className="font-medium text-gray-900 group-hover:text-green-600 transition-colors truncate min-w-0 flex-1">
                                {jobPost.title}
                              </span>
                              <span className="flex items-center gap-1 text-gray-600">
                                <Building className="w-3 h-3" />
                                <span className="truncate">{jobPost.employerName}</span>
                              </span>
                              <span className="flex items-center gap-1 text-gray-500">
                                <MapPin className="w-3 h-3" />
                                <span>{jobPost.location}</span>
                              </span>
                              {jobPost.salary && (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <DollarSign className="w-3 h-3" />
                                  <span>
                                    {jobPost.salary.min.toLocaleString()}원 ~ {jobPost.salary.max.toLocaleString()}원
                                  </span>
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {jobPost.scheduleType === 'smart_matching' ? '스마트 매칭' : '일반 근무'}
                              </span>
                            </div>
                          </Link>
                          <div className="flex items-center gap-3 ml-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                              <span className="mr-1">{getStatusIcon(application.status)}</span>
                              {getStatusText(application.status)}
                            </span>
                            <div className="text-xs text-gray-400">
                              {application.appliedAt?.toDate?.()?.toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) || '날짜 없음'}
                            </div>
                          </div>
                        </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

            {/* 매칭 추천 일자리 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-purple-50 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-sm">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    매칭 추천 일자리
                    <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                      {recommendedJobs.length}개
                    </span>
                </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Target className="w-4 h-4" />
                      <span>선호도 기반 추천</span>
                    </div>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="group relative flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      <Clock className="w-4 h-4" />
                      선호 시간
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  💡 이미 지원한 공고는 제외됩니다
                </div>
              </div>
            </div>
            <div className="p-6">
              {recommendedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-10 h-10 text-gray-400" />
                  </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">추천 일자리가 없습니다</h3>
                    <p className="text-sm text-gray-500 mb-4">이력서를 완성하거나 선호도를 설정해보세요</p>
                    <Link
                      to="/profile"
                      className="group relative inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 text-sm font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      <User className="w-4 h-4 mr-2 relative z-10" />
                      <span className="relative z-10">이력서 완성하기</span>
                    </Link>
                </div>
              ) : (
                  <div className="grid gap-4">
                  {recommendedJobs
                    .slice(0, showAllRecommendedJobs ? recommendedJobs.length : 5)
                    .sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0))
                    .map((jobPost, index) => (
                    <div
                      key={jobPost.id}
                      className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                    >
                      <Link to={`/job-post/${jobPost.id}`} className="flex-1 min-w-0 cursor-pointer">
                        <div className="flex items-center gap-6 text-sm overflow-hidden relative">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleShareJob(jobPost);
                            }}
                            className="flex items-center justify-center w-6 h-6 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-colors flex-shrink-0"
                            title="친구에게 공유하기"
                          >
                            {copiedJobId === jobPost.id ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>
                          <span className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors truncate max-w-52 flex-shrink-0">
                            {jobPost.title}
                          </span>
                          <div className="w-8"></div>
                          <span className="px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full flex-shrink-0 shadow-sm">
                            {jobPost.recommendationScore}점
                          </span>
                          <span className="flex items-center gap-2 text-gray-700 flex-shrink-0">
                            <Building className="w-4 h-4" />
                            <span className="truncate max-w-24 font-medium">{jobPost.employerName}</span>
                          </span>
                          <span className="flex items-center gap-2 text-gray-600 flex-shrink-0">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate max-w-20 font-medium">{jobPost.location}</span>
                          </span>
                          {jobPost.salary && (
                            <span className="flex items-center gap-2 text-gray-600 flex-shrink-0">
                              <DollarSign className="w-4 h-4" />
                              <span className="truncate max-w-28 font-medium">
                                {jobPost.salary.min.toLocaleString()}원 ~ {jobPost.salary.max.toLocaleString()}원
                              </span>
                            </span>
                          )}
                          <span className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
                            <Clock className="w-4 h-4" />
                            <span className="truncate max-w-20 font-medium">
                              {jobPost.scheduleType === 'smart_matching' ? '스마트 매칭' : '일반 근무'}
                            </span>
                          </span>
                          {/* 매칭 이유 표시 */}
                          {jobPost.reasons && jobPost.reasons.length > 0 && (
                            <span className="flex items-center gap-2 text-xs text-purple-600 flex-shrink-0">
                              <Sparkles className="w-4 h-4" />
                              <span className="truncate max-w-24 font-medium">{jobPost.reasons[0]}</span>
                            </span>
                          )}
                        </div>
                      </Link>
                      <div className="flex items-center gap-3 ml-4">
                      </div>
                    </div>
                  ))}
                  {recommendedJobs.length > 5 && (
                    <div className="text-center pt-4 border-t border-gray-100">
                      {!showAllRecommendedJobs ? (
                        <button
                          onClick={() => setShowAllRecommendedJobs(true)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                        >
                          더보기 ({recommendedJobs.length - 5}개 더)
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowAllRecommendedJobs(false)}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                        >
                          접기
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 최근 활동 섹션 - 하단 가로 배치 */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-amber-50 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                최근 활동
              </h3>
            </div>
            <div className="p-6">
              <ActivityTimeline activities={activities} maxItems={5} />
            </div>
          </div>
        </div>
      </div>

      {/* 선호 근무시간 설정 모달 */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">선호 근무시간 설정</h3>
                <p className="text-gray-600 mt-1">이력서의 선호근무시간과 동일하게 설정됩니다. 맞춤 일자리를 추천받을 수 있어요!</p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            {/* 단계별 가이드 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">설정 방법</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span>선호하는 요일과 시간대를 클릭하세요</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span>우선순위를 설정할 수 있습니다 (매우 선호/선호)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span>저장하면 선호도에 맞는 일자리를 추천받을 수 있습니다!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
                          <UnifiedScheduleGrid
                selectedTimeSlots={user?.resume?.preferredTimeSlots || convertAvailabilitiesToTimeSlots(workerAvailabilities)}
                onSave={(timeSlots) => {
                  saveAvailabilities(timeSlots, true);
                }}
                onCancel={() => {
                  if (window.confirm('변경사항이 저장되지 않습니다. 정말로 취소하시겠습니까?')) {
                    setShowScheduleModal(false);
                  }
                }}
                mode="edit"
                title="선호 근무시간"
                description="선호하는 근무시간을 설정하면 맞춤 일자리를 추천받을 수 있어요!"
                jobseekerView={true}
                showActions={true}
                showStatistics={true}
              />
            
            {/* 하단 안내 */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <Sparkles className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-sm text-gray-700">
                  <strong>💡 팁:</strong> 이 설정은 이력서의 선호근무시간과 동기화됩니다. 
                  더 구체적으로 선호하는 시간을 설정할수록 정확한 일자리를 추천받을 수 있습니다!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobseekerDashboard;

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Search, MapPin, DollarSign, Send, FileText, Bell, Clock, Sparkles, Target, User, Users, Building, Home, ChevronDown, ChevronRight } from 'lucide-react';
import UnifiedScheduleGrid from '../components/UnifiedScheduleGrid';
import { calculateMatchingScore } from '../utils/matchingAlgorithm';
import { TimeSlot } from '../types';

interface JobPost {
  id: string;
  title: string;
  employerName: string;
  location: string;
  salary: { min: number; max: number };
  scheduleType: string;
  workTypes: any[];
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

interface MatchingResult {
  jobPostId: string;
  workTypeId: string;
  company: {
    name: string;
    location: string;
  };
  workTypeName: string;
  percentage: number;
}

interface PositiveReview {
  id: string;
  content: string;
  rating: number;
  createdAt: any;
}

const JobseekerDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [workerAvailabilities, setWorkerAvailabilities] = useState<WorkerAvailability[]>([]);
  const [matchingResults, setMatchingResults] = useState<MatchingResult[]>([]);
  const [evaluations, setEvaluations] = useState<PositiveReview[]>([]);
  const [isCompanySectionCollapsed, setIsCompanySectionCollapsed] = useState(true);
  const [isAccommodationSectionCollapsed, setIsAccommodationSectionCollapsed] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [accommodationInfo, setAccommodationInfo] = useState<any>(null);

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

          // Fetch evaluations
          const evaluationsQuery = query(
            collection(db, 'positiveReviews'),
            where('jobseekerId', '==', user.uid)
          );
          const evaluationsSnapshot = await getDocs(evaluationsQuery);
          const evaluationsData = evaluationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PositiveReview[];
          setEvaluations(evaluationsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const performSmartMatching = useCallback(() => {
    if (!user) return;

    const results: MatchingResult[] = [];
    
    jobPosts.forEach(jobPost => {
      jobPost.workTypes?.forEach(workType => {
        let score = 0;
        
        // If user has set availabilities, calculate matching score
        if (workerAvailabilities.length > 0) {
          const workSchedule = Array.isArray(workType.schedules)
            ? workType.schedules.map((s: any) => ({
                dayOfWeek: s.day,
                timeSlot: s.start, // 직접 시간 사용 (0-23)
              }))
            : [];
          score = calculateMatchingScore(workerAvailabilities, workSchedule);
        } else {
          // If no availabilities set, give a base score for all jobs
          score = 0.3; // 30% base matching score
        }
        
        if (score > 0) {
          results.push({
            jobPostId: jobPost.id,
            workTypeId: workType.id,
            company: {
              name: jobPost.employerName,
              location: jobPost.location
            },
            workTypeName: workType.name,
            percentage: Math.round(score * 100)
          });
        }
      });
    });

    // Sort by percentage and take top results
    results.sort((a, b) => b.percentage - a.percentage);
    setMatchingResults(results.slice(0, 8));
  }, [user, jobPosts, workerAvailabilities]);

  useEffect(() => {
    // Always perform smart matching when jobPosts change, regardless of availabilities
    performSmartMatching();
  }, [performSmartMatching]);

  const convertAvailabilitiesToTimeSlots = (availabilities: WorkerAvailability[]): TimeSlot[] => {
    return availabilities.map(avail => {
      // 기존 데이터 호환성을 위한 마이그레이션
      let startHour = avail.timeSlot;
      let endHour = (avail.timeSlot + 1) % 24;
      
      // 기존 3시간 단위 데이터를 1시간 단위로 변환
      if (avail.timeSlot <= 3) { // 0, 1, 2, 3 (기존 3시간 단위)
        startHour = avail.timeSlot * 3;
        endHour = (avail.timeSlot + 1) * 3;
        if (endHour > 24) endHour = 24;
      }
      
      return {
        day: avail.dayOfWeek,
        start: startHour,
        end: endHour,
        priority: avail.priority === 'high' ? 1 : 2
      };
    });
  };

  const saveAvailabilities = async (timeSlots: TimeSlot[], closeModal: boolean = false) => {
    if (!user) return;

    try {
      // Delete existing availabilities
      const existingQuery = query(
        collection(db, 'workerAvailabilities'),
        where('jobseekerId', '==', user.uid)
      );
      const existingSnapshot = await getDocs(existingQuery);
      const deletePromises = existingSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Add new availabilities
      const addPromises = timeSlots.map(slot =>
        addDoc(collection(db, 'workerAvailabilities'), {
          jobseekerId: user.uid,
          dayOfWeek: slot.day,
          timeSlot: slot.start, // 직접 시간 저장 (0-23)
          priority: slot.priority === 1 ? 'high' : 'low',
          createdAt: serverTimestamp()
        })
      );
      await Promise.all(addPromises);

      // Update local state
      const newAvailabilities: WorkerAvailability[] = timeSlots.map((slot, index) => ({
        id: `temp-${index}`,
        dayOfWeek: slot.day,
        timeSlot: slot.start, // 직접 시간 사용
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
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.employerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !locationFilter || post.location.includes(locationFilter);
    const notApplied = !applications.some(app => app.jobPostId === post.id);
    
    return matchesSearch && matchesLocation && notApplied;
  });

  const recommendedJobPosts = filteredJobPosts;

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

        {/* 메인 콘텐츠 - 세로 배치로 변경 */}
        <div className="space-y-6">
          {/* 1. 내 프로필 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                내 프로필
              </h3>
            </div>
            <div className="p-6">
              {/* 프로필 정보 */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-base font-bold text-white">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">{user?.displayName || '사용자'}</h4>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* 계정 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                      <User className="w-3 h-3 text-blue-600" />
                    </div>
                    계정 정보
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-600">이름: </span>
                      <span className="text-gray-900 font-medium">{user?.displayName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">이메일: </span>
                      <span className="text-gray-900 font-medium">{user?.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">회원 유형: </span>
                      <span className="text-blue-600 font-medium">구직자</span>
                    </div>
                  </div>
                </div>

                {/* 지원 요약 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                      <Send className="w-3 h-3 text-green-600" />
                    </div>
                    지원 요약
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                      <div className="text-base font-bold text-blue-600">{applications.length}</div>
                      <div className="text-xs text-gray-600">총 지원</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                      <div className="text-base font-bold text-yellow-600">
                        {applications.filter(app => app.status === 'pending').length}
                      </div>
                      <div className="text-xs text-gray-600">검토 중</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                      <div className="text-base font-bold text-green-600">
                        {applications.filter(app => app.status === 'accepted').length}
                      </div>
                      <div className="text-xs text-gray-600">채용됨</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                      <div className="text-base font-bold text-red-600">
                        {applications.filter(app => app.status === 'rejected').length}
                      </div>
                      <div className="text-xs text-gray-600">거절됨</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 이력서 정보 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-8">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center">
                    <FileText className="w-3 h-3 text-purple-600" />
                  </div>
                  이력서 정보
                </h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-gray-600">이력서 상태: </span>
                    <span className="text-green-600 font-medium">완료</span>
                  </div>
                  <div>
                    <span className="text-gray-600">마지막 업데이트: </span>
                    <span className="text-gray-900 font-medium">2024.01.15</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors">
                    이력서 보기
                  </button>
                  <button className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors">
                    이력서 수정
                  </button>
                </div>
              </div>

              {/* 프로필 액션 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/crew-dashboard"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all group"
                >
                  <span className="text-sm font-medium text-gray-900">평가</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Users className="w-3 h-3 text-blue-600" />
                    </div>
                    {evaluations.length > 0 && (
                      <span className="text-xs text-blue-600 font-medium">
                        {evaluations.length}개
                      </span>
                    )}
                    <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>

                <button className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all group">
                  <span className="text-sm font-medium text-gray-900">알림 설정</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Bell className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>

                <button className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all group">
                  <span className="text-sm font-medium text-gray-900">스마트 매칭</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 2. 지원현황 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                    <Send className="w-4 h-4 text-green-600" />
                  </div>
                  지원현황
                  <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    {applications.length}개
                  </span>
                </h3>
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
                  {applications.slice(0, 6).map((application) => {
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
                      <Link
                        key={application.id}
                        to={`/application-detail/${application.id}`}
                        className="block p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all duration-200 group bg-white"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-semibold text-gray-900 group-hover:text-green-600 transition-colors truncate mb-1">
                              {jobPost.title}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <Building className="w-4 h-4" />
                              <span className="truncate">{jobPost.employerName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                              <MapPin className="w-4 h-4" />
                              <span>{jobPost.location}</span>
                            </div>
                            {jobPost.salary && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                <DollarSign className="w-4 h-4" />
                                <span>
                                  {jobPost.salary.min.toLocaleString()}원 ~ {jobPost.salary.max.toLocaleString()}원
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                              <span className="mr-1">{getStatusIcon(application.status)}</span>
                              {getStatusText(application.status)}
                            </span>
                            <div className="text-xs text-gray-400 text-right">
                              {application.appliedAt?.toDate?.()?.toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) || '날짜 없음'}
                            </div>
                          </div>
                        </div>
                        
                        {/* 추가 정보 */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {jobPost.scheduleType === 'smart_matching' ? '스마트 매칭' : '일반 근무'}
                            </span>
                            {jobPost.workTypes && jobPost.workTypes.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {jobPost.workTypes.length}개 근무타입
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-green-600 font-medium group-hover:text-green-700">
                            <span>상세보기</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {applications.length > 6 && (
                    <div className="text-center pt-4 border-t border-gray-100">
                      <Link 
                        to="/my-applications" 
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:text-green-700 font-medium bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <span>전체 지원내역 보기</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                          {applications.length}개
                        </span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. 맞춤 추천 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-purple-600" />
                  </div>
                  맞춤 추천
                </h3>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  <Clock className="w-4 h-4" />
                  선호 근무시간 설정
                </button>
              </div>
            </div>
            <div className="p-6">
              {matchingResults.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Target className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {workerAvailabilities.length === 0 ? '선호 근무시간을 설정해보세요' : '맞춤 일자리가 없습니다'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {workerAvailabilities.length === 0 
                      ? '위의 "선호 근무시간 설정" 버튼을 클릭하여 선호하는 근무시간을 설정하면 더 정확한 맞춤 일자리를 추천받을 수 있어요'
                      : '현재 설정된 선호 시간에 맞는 일자리가 없습니다. 다른 시간대도 고려해보세요'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {matchingResults.map((result) => {
                    const jobPost = jobPosts.find(post => post.id === result.jobPostId);
                    if (!jobPost) return null;

                    return (
                      <Link
                        key={`${result.jobPostId}-${result.workTypeId}`}
                        to={`/job/${jobPost.id}?workTypeId=${result.workTypeId}`}
                        className="block py-3 px-4 border-b border-gray-100 hover:bg-purple-50 hover:border-purple-200 transition-all group last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <h4 className="text-base font-medium text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                                {jobPost.title}
                              </h4>
                              <span className="text-sm text-gray-500 truncate">
                                {result.company.name}
                              </span>
                              <span className="flex items-center gap-1 text-sm text-gray-500 flex-shrink-0">
                                <MapPin className="h-3 w-3" />
                                {result.company.location}
                              </span>
                              <span className="flex items-center gap-1 text-sm text-gray-500 flex-shrink-0">
                                <DollarSign className="h-3 w-3" />
                                {jobPost.salary
                                  ? `${jobPost.salary.min.toLocaleString()}원 ~ ${jobPost.salary.max.toLocaleString()}원`
                                  : '급여 정보 없음'}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex-shrink-0">
                                {result.percentage}% 매칭
                              </span>
                              <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full flex-shrink-0">
                                {result.workTypeName}
                              </span>
                            </div>
                          </div>
                          <div className="text-gray-400 group-hover:text-purple-600 transition-colors ml-4 flex-shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 4. 리조트바이트 생활 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🌴</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">리조트바이트 생활</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 내 경험 공유 섹션 */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">💭</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">내 경험 공유</h4>
                      <p className="text-sm text-gray-600">리조트에서의 특별한 순간들을 기록해보세요</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-900">오늘의 생각</span>
                        <Link to="/reviews/media/new" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          작성하기
                        </Link>
                      </div>
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl">✍️</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">오늘 느낀 점을 기록해보세요</p>
                        <p className="text-xs text-gray-500">감정, 배운 점, 특별한 순간</p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-900">일상 브이로그</span>
                        <Link to="/reviews" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          전체 보기
                        </Link>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">📹</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">오늘의 업무 모습</p>
                            <p className="text-xs text-gray-500">2시간 전 업로드</p>
                          </div>
                          <div className="text-xs text-blue-600 font-medium">조회 24</div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">📸</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">팀원들과의 점심시간</p>
                            <p className="text-xs text-gray-500">어제 업로드</p>
                          </div>
                          <div className="text-xs text-green-600 font-medium">좋아요 8</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 리조트 라이프 스토리 섹션 */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">🌟</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">리조트 라이프 스토리</h4>
                      <p className="text-sm text-gray-600">나만의 특별한 경험을 공유해보세요</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-900">특별한 순간</span>
                        <Link to="/reviews/media/new" className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                          공유하기
                        </Link>
                      </div>
                      <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl">🎬</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">특별했던 순간을 영상으로</p>
                        <p className="text-xs text-gray-500">고객과의 만남, 팀워크, 성취감</p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-900">나의 성장 기록</span>
                        <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                          더보기
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">첫 고객 응대 성공!</p>
                            <p className="text-xs text-gray-500">3일 전 기록</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="text-xs text-gray-600">성취</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">팀원들과 친해졌어요</p>
                            <p className="text-xs text-gray-500">1주일 전 기록</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-blue-500">💙</span>
                            <span className="text-xs text-gray-600">관계</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 최근 활동 통계 */}
              <div className="mt-6 bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm">📊</span>
                  </div>
                  <h4 className="text-base font-semibold text-gray-900">나의 리조트바이트 활동</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">15</div>
                    <div className="text-sm text-gray-600">공유한 순간</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">8</div>
                    <div className="text-sm text-gray-600">브이로그</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">23</div>
                    <div className="text-sm text-gray-600">받은 좋아요</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 mb-1">156</div>
                    <div className="text-sm text-gray-600">총 조회수</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. 전체 일자리 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Search className="w-4 h-4 text-indigo-600" />
                  </div>
                  전체 일자리
                </h3>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="일자리 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="지역"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              {recommendedJobPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">일자리가 없습니다</h3>
                  <p className="text-sm text-gray-500">다른 검색어를 시도해보세요</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recommendedJobPosts.slice(0, 15).map((jobPost) => (
                    <Link
                      key={jobPost.id}
                      to={`/job/${jobPost.id}`}
                      className="block py-3 px-4 border-b border-gray-100 hover:bg-indigo-50 hover:border-indigo-200 transition-all group last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h4 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                              {jobPost.title}
                            </h4>
                            <span className="text-xs text-gray-500 truncate">
                              {jobPost.employerName}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                              <MapPin className="h-3 w-3" />
                              {jobPost.location}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                              <DollarSign className="h-3 w-3" />
                              {jobPost.salary
                                ? `${jobPost.salary.min.toLocaleString()}원 ~ ${jobPost.salary.max.toLocaleString()}원`
                                : '급여 정보 없음'}
                            </span>
                            {jobPost.scheduleType === 'smart_matching' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                                스마트 매칭
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-gray-400 group-hover:text-indigo-600 transition-colors ml-4 flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {recommendedJobPosts.length > 15 && (
                    <div className="text-center pt-4 border-t border-gray-100">
                      <span className="text-sm text-gray-500">
                        더 많은 일자리를 보려면 검색어를 변경해보세요
                      </span>
                    </div>
                  )}
                </div>
              )}
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
                <p className="text-gray-600 mt-1">내가 선호하는 근무시간을 설정하면 맞춤 일자리를 추천받을 수 있어요!</p>
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
                selectedTimeSlots={convertAvailabilitiesToTimeSlots(workerAvailabilities)}
                onSave={(timeSlots) => {
                  // 저장 버튼을 클릭했을 때만 실제 저장 실행
                  saveAvailabilities(timeSlots, true);
                }}
                onCancel={() => {
                  // 취소 시 사용자에게 확인
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
                  <strong>💡 팁:</strong> 더 구체적으로 선호하는 시간을 설정할수록 정확한 일자리를 추천받을 수 있습니다. 
                  실제로 일하고 싶은 시간대를 선택해보세요!
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

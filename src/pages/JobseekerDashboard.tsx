import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Search, MapPin, DollarSign, Send, FileText, Bell, Clock, Sparkles, Target, User, Users, Building } from 'lucide-react';
import UnifiedScheduleGrid from '../components/UnifiedScheduleGrid';
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



const JobseekerDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [workerAvailabilities, setWorkerAvailabilities] = useState<WorkerAvailability[]>([]);

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

        {/* 메인 콘텐츠 - 가로 배치로 복원 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 1. 왼쪽 사이드바 - 프로필 및 요약 */}
        <div className="space-y-6">
            {/* 프로필 카드 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                내 프로필
              </h3>
            </div>
            <div className="p-6">
              {/* 프로필 정보 */}
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

                {/* 지원 요약 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-900">총 지원</span>
                    <span className="text-lg font-bold text-blue-600">{applications.length}개</span>
                    </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium text-yellow-900">검토 중</span>
                    <span className="text-lg font-bold text-yellow-600">
                      {applications.filter(app => app.status === 'pending').length}개
                    </span>
                    </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-900">채용됨</span>
                    <span className="text-lg font-bold text-green-600">
                      {applications.filter(app => app.status === 'accepted').length}개
                    </span>
                </div>
              </div>

              {/* 이력서 정보 */}
                <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center">
                    <FileText className="w-3 h-3 text-purple-600" />
                  </div>
                  이력서 정보
                </h4>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">상태:</span>
                      <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                        user?.resume ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      }`}>
                        {user?.resume ? '완료' : '미완성'}
                      </span>
                    </div>
                    {user?.resume && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">희망 급여:</span>
                        <span className="text-gray-900 font-medium">
                          {user.resume.expectedSalary ? 
                            `${user.resume.expectedSalary.toLocaleString()}원` : 
                            '미입력'
                          }
                        </span>
                  </div>
                    )}
                  </div>
                  <Link
                    to="/profile"
                    className="w-full text-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    이력서 관리
                  </Link>
                </div>
                </div>
              </div>

            {/* 빠른 액션 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h3>
              <div className="space-y-3">
                <Link
                  to="/crew-dashboard"
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Users className="w-4 h-4 mr-2" />
                  평가 보기
                </Link>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  근무 일정 설정
                </button>
                <Link
                  to="/notifications"
                  className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  알림 설정
                </Link>
              </div>
            </div>
          </div>

          {/* 2. 메인 콘텐츠 - 지원현황 및 추천 일자리 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 지원현황 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
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
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

            {/* 추천 일자리 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-violet-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                    <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                    추천 일자리
                    <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      {recommendedJobPosts.length}개
                    </span>
                </h3>
                  <div className="flex items-center gap-2">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="일자리 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">전체 지역</option>
                      <option value="서울">서울</option>
                      <option value="부산">부산</option>
                      <option value="대구">대구</option>
                      <option value="인천">인천</option>
                      <option value="광주">광주</option>
                      <option value="대전">대전</option>
                      <option value="울산">울산</option>
                    </select>
                </div>
              </div>
            </div>
            <div className="p-6">
              {recommendedJobPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">추천 일자리가 없습니다</h3>
                    <p className="text-sm text-gray-500">검색 조건을 변경해보세요</p>
                </div>
              ) : (
                  <div className="grid gap-4">
                  {recommendedJobPosts.slice(0, 15).map((jobPost) => (
                    <Link
                      key={jobPost.id}
                      to={`/job/${jobPost.id}`}
                        className="block p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-200 group bg-white"
                    >
                        <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                            <h4 className="text-base font-semibold text-gray-900 group-hover:text-purple-600 transition-colors truncate mb-1">
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
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600 border border-purple-200">
                              지원 가능
                            </span>
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

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  Check, 
  Clock, 
  MapPin, 
  DollarSign, 
  Building, 
  User, 
  Sparkles, 
  Target,
  Plus,
  Eye,
  Activity,
  Phone,
  Briefcase,
  Users,
  Award,
  Star,
  ThumbsUp,
  Calendar,
  Camera,
  Home,
} from 'lucide-react';
import { calculateEvaluationStats, getTrustLevelColor, getTrustLevelText } from '../utils/evaluationService';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { formatDate } from '../utils/dateUtils';
import { Application, JobPost } from '../types';

const JobseekerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [profileCollapsed, setProfileCollapsed] = useState(false);
  const [recommendationsCollapsed, setRecommendationsCollapsed] = useState(false);
  const [applicationsCollapsed, setApplicationsCollapsed] = useState(false);
  const [activitiesCollapsed, setActivitiesCollapsed] = useState(false);
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<JobPost[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<JobPost[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [workerStats, setWorkerStats] = useState({
    totalWorkCount: 0,
    positiveReviews: 0,
    averageRating: 0,
    lastWorkDate: null as Date | null,
    rehireRate: 0,
    trustLevel: 'low' as 'very_high' | 'high' | 'medium' | 'low',
  });
  const [myReviewCount, setMyReviewCount] = useState(0);

  // 공유 기능
  const handleShareJob = async (jobPost: JobPost) => {
    const shareUrl = `${window.location.origin}/job-post/${jobPost.id}`;
    const shareText = `🏖️ ${jobPost.title} - ${jobPost.location}\n\n${shareUrl}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: jobPost.title,
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopiedJobId(jobPost.id);
        setTimeout(() => setCopiedJobId(null), 2000);
      }
    } catch (error) {
      console.error('공유 실패:', error);
    }
  };

  // Firebase에서 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1. 내 리뷰 수 로딩
        try {
          const myReviewsQuery = query(collection(db, 'reviews'), where('userId', '==', user.uid));
          const myReviewsSnap = await getDocs(myReviewsQuery);
          setMyReviewCount(myReviewsSnap.size);
        } catch (e) {
          console.log('내 리뷰 수 로딩 실패:', e);
          setMyReviewCount(0);
        }

        // 2. 지원서 로딩 (먼저 지원한 공고 ID들을 가져옴)
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('jobseekerId', '==', user.uid),
        );
        const applicationsSnapshot = await getDocs(applicationsQuery);
        const applicationsData = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Application[];
        setApplications(applicationsData);

        console.log('지원서 데이터:', applicationsData);

        // 2. 지원한 공고 ID들 추출
        const appliedJobIds = applicationsData.map(app => app.jobPostId);
        console.log('지원한 공고 ID들:', appliedJobIds);

        // 3. 지원한 공고 정보 가져오기 (활성/비활성 모두 포함)
        let appliedJobsData: JobPost[] = [];
        
        if (appliedJobIds.length > 0) {
          // Firebase의 'in' 쿼리는 최대 10개만 지원하므로 배치로 처리
          const batchSize = 10;
          for (let i = 0; i < appliedJobIds.length; i += batchSize) {
            const batch = appliedJobIds.slice(i, i + batchSize);
            const appliedJobsQuery = query(
              collection(db, 'jobPosts'),
              where('__name__', 'in', batch)
            );
            const appliedJobsSnapshot = await getDocs(appliedJobsQuery);
            const batchData = appliedJobsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            })) as JobPost[];
            appliedJobsData = [...appliedJobsData, ...batchData];
          }
        }
        
        setAppliedJobs(appliedJobsData);
        console.log('지원한 공고 데이터:', appliedJobsData);

        // 4. 활성 구인공고 로딩 (추천용)
        const jobPostsQuery = query(
          collection(db, 'jobPosts'),
          where('isActive', '==', true),
        );
        const jobPostsSnapshot = await getDocs(jobPostsQuery);
        const jobPostsData = jobPostsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as JobPost[];
        
        setJobPosts(jobPostsData);

        // 5. 추천 일자리 계산 (지원하지 않은 활성 공고만)
        const availableJobs = jobPostsData.filter(job => !appliedJobIds.includes(job.id));
        
        const recommended = availableJobs.map(job => {
          let score = 0;
          
          // 1. 새로 등록된 공고 우선순위 (최근 7일 내 등록)
          const jobDate = job.createdAt?.toDate?.() || new Date();
          const daysSincePosted = Math.floor((new Date().getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSincePosted <= 7) {
            score += 30; // 새 공고 보너스
          } else if (daysSincePosted <= 14) {
            score += 15; // 2주 내 공고 보너스
          }
          
          // 2. 이력서 기반 매칭 (사용자 이력서가 있는 경우)
          if (user?.resume) {
            const resume = user.resume;
            
            // 급여 매칭
            if (resume.hourlyWage && job.salary) {
              const wageDiff = Math.abs(resume.hourlyWage - job.salary.min);
              if (wageDiff <= 1000) score += 20;
              else if (wageDiff <= 2000) score += 10;
              else if (wageDiff <= 5000) score += 5;
            }
            
            // 직무 매칭
            if (resume.jobType && job.jobTitle) {
              const jobTypes = Array.isArray(resume.jobType) ? resume.jobType : [resume.jobType];
              const jobTitleLower = job.jobTitle.toLowerCase();
              const hasMatchingJobType = jobTypes.some(type => 
                jobTitleLower.includes(type.toLowerCase()) || 
                type.toLowerCase().includes(jobTitleLower)
              );
              if (hasMatchingJobType) score += 25;
            }
            
            // 경험 매칭
            if (resume.customerServiceExp && job.description?.toLowerCase().includes('고객')) {
              score += 15;
            }
            if (resume.restaurantExp && job.description?.toLowerCase().includes('음식')) {
              score += 15;
            }
            
            // 언어 능력 매칭
            if (resume.languages && resume.languages.length > 0) {
              const jobDescLower = job.description?.toLowerCase() || '';
              const hasLanguageRequirement = resume.languages.some(lang => 
                jobDescLower.includes(lang.toLowerCase())
              );
              if (hasLanguageRequirement) score += 10;
            }
          }
          
          // 3. 위치 기반 매칭 (간단한 지역 매칭)
          if (user?.resume?.address && job.location) {
            const userAddress = user.resume.address.toLowerCase();
            const jobLocation = job.location.toLowerCase();
            if (userAddress.includes(jobLocation) || jobLocation.includes(userAddress)) {
              score += 20;
            }
          }
          
          // 4. 기본 점수 (모든 공고에 기본 점수)
          score += 10;
          
          return {
            ...job,
            recommendationScore: Math.min(score, 100), // 최대 100점
          };
        }).sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
        
        setRecommendedJobs(recommended);

        // 4. 알바생 통계 로딩 (실제 평가 데이터 사용)
        if (user?.uid) {
          const evaluationStats = await calculateEvaluationStats(user.uid);
          setWorkerStats({
            totalWorkCount: evaluationStats.totalWorkCount || 0,
            positiveReviews: evaluationStats.totalPositiveEvaluations || 0,
            averageRating: evaluationStats.averageRating,
            lastWorkDate: evaluationStats.lastWorkDate || null,
            rehireRate: evaluationStats.rehireRate,
            trustLevel: evaluationStats.trustLevel,
          });
        }

        // 5. 활동 내역 로딩
        const activitiesData: any[] = [];

        // 지원 활동 추가
        applicationsData.forEach(app => {
          const jobPost = appliedJobsData.find(job => job.id === app.jobPostId);
          activitiesData.push({
            id: `app_${app.id}`,
            type: 'application',
            title: `${jobPost ? jobPost.title : '공고'}에 지원함`,
            description: `지원 상태: ${getStatusText(app.status)}`,
            date: app.createdAt || new Date(),
            icon: 'Send',
            color: 'green',
            link: `/application-detail/${app.id}`,
          });
        });

        // 리뷰 활동 추가
        try {
          const myReviewsQuery2 = query(collection(db, 'reviews'), where('userId', '==', user.uid));
          const myReviewsSnap2 = await getDocs(myReviewsQuery2);
          myReviewsSnap2.docs.slice(0, 5).forEach(docSnap => {
            const r = docSnap.data() as any;
            activitiesData.push({
              id: `review_${docSnap.id}`,
              type: 'review',
              title: `${(r.reviewType === 'accommodation' ? '기숙사' : '회사')} 리뷰 작성`,
              description: `${(r.overallRating || 0)}점 · ${r.content?.slice(0, 30) || ''}`,
              date: r.date || new Date(),
              icon: 'Star',
              color: 'yellow',
              link: '/reviews',
            });
          });
        } catch (e) {
          console.log('리뷰 활동 로딩 실패:', e);
        }

        // 날짜순으로 정렬 (최신순)
        activitiesData.sort((a, b) => {
          const dateA = (a.date as any)?.toDate?.() || a.date;
          const dateB = (b.date as any)?.toDate?.() || b.date;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });

        setActivities(activitiesData);

      } catch (error) {
        console.error('데이터 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      loadData();
    }
  }, [user?.uid]);

  const filteredApplications = applications.filter((app) => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  const getStatusText = (status: string) => {
    switch (status) {
    case 'pending': return '대기중';
    case 'reviewing': return '검토중';
    case 'interview_scheduled': return '면접 예정';
    case 'interview_completed': return '면접 완료';
    case 'offer_sent': return '제안';
    case 'accepted': return '채용';
    case 'rejected': return '거절';
    case 'withdrawn': return '철회';
    default: return '알 수 없음';
    }
  };

  const hasResume = () => hasActualResumeContent();
  
  // 실제 이력서 내용이 있는지 확인하는 함수
  const hasActualResumeContent = () => {
    if (!user?.resume) return false;
    
    const resume = user.resume;
    
    // 핵심 이력서 필드들이 실제로 입력되었는지 확인
    return !!(
      resume.phone ||
      resume.birth ||
      resume.jobType ||
      resume.career ||
      resume.hourlyWage ||
      resume.availableStartDate ||
      resume.customerServiceExp ||
      resume.restaurantExp ||
      (resume.languages && resume.languages.length > 0) ||
      resume.intro
    );
  };

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 헤더 섹션 */}
        <div className="mb-6">
          <div className="text-center lg:text-left">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              안녕하세요, {user?.displayName}님!
            </h1>

            {/* 이력서 작성 안내문 - 항상 표시 */}
            {(
              <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    이력서를 작성해주세요
                  </h3>
                                     <div className="mb-3">
                     <div className="text-xs text-gray-600 text-center leading-relaxed">
                       이력서를 작성하면 <span className="font-medium">바로 지원할 수 있고</span>, <span className="font-medium">맞춤 일자리를 추천받으며</span>, <span className="font-medium">합격 확률이 높아지고</span>, <span className="font-medium">신뢰도를 쌓을 수 있어요</span>. 지원할 때 작성해도 됩니다.
                     </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="space-y-4">
          {/* 나의 프로필(이력서) 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                   나의 프로필 (이력서)
                </h3>
                <div className="flex items-center gap-2">
                  {hasActualResumeContent() ? (
                    <>
                      <Link
                        to="/profile"
                        className="inline-flex items-center px-2 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                         수정
                      </Link>
                      <Link
                        to="/job-list"
                        className="inline-flex items-center px-2 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-medium"
                      >
                        <Send className="w-3 h-3 mr-1" />
                         일자리
                      </Link>
                    </>
                  ) : (
                                         <Link
                       to="/profile?mode=edit"
                       className="inline-flex items-center px-2 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
                     >
                       <FileText className="w-3 h-3 mr-1" />
                        이력서 등록
                     </Link>
                  )}
                  <button
                    onClick={() => setProfileCollapsed(!profileCollapsed)}
                    className="flex items-center gap-1 px-2 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors text-xs"
                  >
                    {profileCollapsed ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronUp className="w-3 h-3" />
                    )}
                    {profileCollapsed ? '펼치기' : '접기'}
                  </button>
                </div>
              </div>
            </div>
            {!profileCollapsed && (
              <div className="p-3">
                {user?.resume ? (
                  <div className="space-y-2">
                    {/* 기본 정보 + 연락처 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="border border-gray-200 rounded-md p-2">
                        <h4 className="text-xs font-semibold text-gray-900 mb-1 flex items-center gap-1">
                          <User className="w-3 h-3 text-blue-600" />
                          기본 정보
                        </h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">이름:</span>
                            <span className="text-xs text-gray-900">{user?.displayName || '사용자'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">이메일:</span>
                            <span className="text-xs text-gray-900">{user?.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-md p-2">
                        <h4 className="text-xs font-semibold text-gray-900 mb-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-green-600" />
                          연락처 정보
                        </h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">전화번호:</span>
                            <span className="text-xs text-gray-900">{user?.resume?.phone || <span className="text-red-500">미입력</span>}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">생년월일:</span>
                            <span className="text-xs text-gray-900">{user?.resume?.birth || <span className="text-red-500">미입력</span>}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 직무 정보 + 급여 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="border border-gray-200 rounded-md p-2">
                        <h4 className="text-xs font-semibold text-gray-900 mb-1 flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-blue-600" />
                          직무 정보
                        </h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">희망 직무:</span>
                            <span className="text-xs text-gray-900">
                              {user?.resume?.jobType ? 
                                (Array.isArray(user.resume.jobType) ? 
                                  user.resume.jobType.join(', ') : 
                                  user.resume.jobType
                                ) : 
                                <span className="text-red-500">미입력</span>
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">경력:</span>
                            <span className="text-xs text-gray-900">{user?.resume?.career || <span className="text-red-500">미입력</span>}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-md p-2">
                        <h4 className="text-xs font-semibold text-gray-900 mb-1 flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-yellow-600" />
                          급여 정보
                        </h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">희망 시급:</span>
                            <span className="text-xs text-gray-900">
                              {user?.resume?.hourlyWage 
                                ? `${user?.resume?.hourlyWage?.toLocaleString?.()}원/시간` 
                                : <span className="text-red-500">미입력</span>
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">입사 가능일:</span>
                            <span className="text-xs text-gray-900">{user?.resume?.availableStartDate || <span className="text-red-500">미입력</span>}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 경험 및 스킬 */}
                    <div className="border border-gray-200 rounded-md p-2">
                      <h4 className="text-xs font-semibold text-gray-900 mb-1 flex items-center gap-1">
                        <Users className="w-3 h-3 text-green-600" />
                        경험 및 스킬
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-600">관련 경험:</span>
                          </div>
                          <div className="text-xs">
                            {user?.resume?.customerServiceExp && <p className="text-gray-900">• 고객 응대 경험</p>}
                            {user?.resume?.restaurantExp && <p className="text-gray-900">• 음식점/호텔 경험</p>}
                            {!user?.resume?.customerServiceExp && !user?.resume?.restaurantExp && 
                               <p className="text-red-500">미입력</p>
                            }
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-600">언어 능력:</span>
                          </div>
                          <div className="text-xs">
                            {user?.resume?.languages && user.resume.languages.length > 0 ? 
                              user.resume.languages.map((lang: string) => (
                                <p key={lang} className="text-gray-900">• {lang}</p>
                              ))
                              : <p className="text-red-500">미입력</p>
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 자기소개 */}
                    {user?.resume?.intro && (
                      <div className="border border-gray-200 rounded-md p-2">
                        <h4 className="text-xs font-semibold text-gray-900 mb-1 flex items-center gap-1">
                          <Award className="w-3 h-3 text-orange-600" />
                          자기소개
                        </h4>
                        <div>
                          <p className="text-xs text-gray-900 whitespace-pre-wrap">
                            {user?.resume?.intro}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 크루 활동 시스템 */}
                    <div className="border border-gray-200 rounded-md p-2">
                      <h4 className="text-xs font-semibold text-gray-900 mb-1 flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        크루 활동
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded p-1">
                          <div className="flex items-center gap-1 mb-1">
                            <ThumbsUp className="w-2 h-2 text-green-600" />
                            <span className="text-xs font-medium text-gray-700">재고용</span>
                          </div>
                          <div className="text-sm font-bold text-green-600">
                            {workerStats.positiveReviews}회
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded p-1">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="w-2 h-2 text-blue-600" />
                            <span className="text-xs font-medium text-gray-700">총 일한 횟수</span>
                          </div>
                          <div className="text-sm font-bold text-blue-600">
                            {workerStats.totalWorkCount}회
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded p-1">
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="w-2 h-2 text-yellow-500" />
                            <span className="text-xs font-medium text-gray-700">평균 평점</span>
                          </div>
                          <div className="text-sm font-bold text-purple-600">
                            {workerStats.averageRating}점
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded p-1">
                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="w-2 h-2 text-gray-600" />
                            <span className="text-xs font-medium text-gray-700">마지막 일한 날</span>
                          </div>
                          <div className="text-xs font-bold text-gray-600">
                            {workerStats.lastWorkDate ? 
                              workerStats.lastWorkDate.toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                              }) : '없음'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pt-1 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            재고용률: <span className="font-semibold text-green-600">{workerStats.rehireRate}%</span>
                          </span>
                          <span className={`px-1 py-0.5 rounded text-xs font-medium ${getTrustLevelColor(workerStats.trustLevel)}`}>
                            신뢰도: {getTrustLevelText(workerStats.trustLevel)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">이력서를 작성해주세요</h3>
                    <p className="text-sm text-gray-500 mb-3">이력서를 작성하면 맞춤 일자리를 추천받을 수 있습니다</p>
                    <div className="flex gap-2">
                      <Link
                        to="/profile"
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                         이력서 작성하기
                      </Link>
                      <Link
                        to="/mutual-evaluation"
                        className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                         평가 시스템
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 매칭 추천 일자리 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-purple-50">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                   매칭 추천 일자리
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full border border-purple-100">
                    {recommendedJobs.length}개
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Target className="w-3 h-3" />
                    <span>이력서 기반 맞춤 추천</span>
                  </div>
                  <div className="flex-1"></div>
                  <button
                    onClick={() => setRecommendationsCollapsed(!recommendationsCollapsed)}
                    className="flex items-center gap-1 px-2 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors text-xs"
                  >
                    {recommendationsCollapsed ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronUp className="w-3 h-3" />
                    )}
                    {recommendationsCollapsed ? '펼치기' : '접기'}
                  </button>
                </div>
              </div>
            </div>
            {!recommendationsCollapsed && (
              <div className="p-4">
                {recommendedJobs.length === 0 ? (
                  <div className="text-center py-8">
                    {!hasResume() ? (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Sparkles className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-purple-900 mb-2">맞춤형 일자리를 추천받으세요!</h3>
                        <p className="text-sm text-purple-700 mb-4">
                          이력서를 작성하시면 당신에게 딱 맞는 리조트 일자리를 추천해드려요
                        </p>
                        <div className="flex gap-3 justify-center">
                          <Link
                            to="/profile"
                            className="inline-flex items-center px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            이력서 작성하기
                          </Link>
                          <Link
                            to="/job-list"
                            className="inline-flex items-center px-4 py-2 bg-white text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            전체 일자리 보기
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Sparkles className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-2">현재 추천 일자리가 없습니다</h3>
                        <p className="text-sm text-gray-500 mb-3">더 나은 매칭을 위해 이력서를 업데이트해보세요</p>
                        <Link
                          to="/profile"
                          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                        >
                          <User className="w-4 h-4 mr-1" />
                           이력서 업데이트
                        </Link>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recommendedJobs.slice(0, showAllRecommendations ? recommendedJobs.length : 5).map((jobPost, index) => (
                      <div
                        key={jobPost.id}
                        className="flex items-center justify-between p-2 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                      >
                        <Link to={`/job-post/${jobPost.id}`} className="flex-1 min-w-0 cursor-pointer">
                          <div className="flex items-center gap-3 text-sm overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                                {jobPost.title}
                              </span>
                              <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full flex-shrink-0">
                                {jobPost.recommendationScore}점
                              </span>
                            </div>
                            
                            {/* 간단한 정보 한 줄 */}
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <Building className="w-3 h-3 text-gray-400" />
                                {jobPost.employerName || '회사명 없음'}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-gray-400" />
                                {jobPost.salary ? 
                                  `${jobPost.salary.min.toLocaleString()}~${jobPost.salary.max.toLocaleString()}원` 
                                  : '급여 정보 없음'
                                }
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                {jobPost.location || '위치 정보 없음'}
                              </span>
                            </div>
                          </div>
                        </Link>
                        
                        {/* 공유 버튼 */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleShareJob(jobPost);
                          }}
                          className="flex items-center justify-center w-6 h-6 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-colors flex-shrink-0 ml-2"
                          title="친구에게 공유하기"
                        >
                          {copiedJobId === jobPost.id ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Share2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ))}
                      
                    {/* 더보기/접기 버튼 */}
                    {recommendedJobs.length > 5 && (
                      <div className="pt-2 border-t border-gray-100">
                        <button
                          onClick={() => setShowAllRecommendations(!showAllRecommendations)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors text-sm font-medium"
                        >
                          {showAllRecommendations ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                                접기
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                                더보기 ({recommendedJobs.length - 5}개 더)
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>



          {/* 지원 현황 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-green-50">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Send className="w-4 h-4 text-white" />
                  </div>
                   지원 현황
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                    {applications.length}개
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">전체</option>
                    <option value="pending">대기중</option>
                    <option value="reviewing">검토중</option>
                    <option value="interview_scheduled">면접 예정</option>
                    <option value="interview_completed">면접 완료</option>
                    <option value="offer_sent">제안</option>
                    <option value="accepted">채용</option>
                    <option value="rejected">거절</option>
                    <option value="withdrawn">철회</option>
                  </select>
                  <div className="flex-1"></div>
                  <button
                    onClick={() => setApplicationsCollapsed(!applicationsCollapsed)}
                    className="flex items-center gap-1 px-2 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors text-xs"
                  >
                    {applicationsCollapsed ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronUp className="w-3 h-3" />
                    )}
                    {applicationsCollapsed ? '펼치기' : '접기'}
                  </button>
                </div>
              </div>
            </div>
            {!applicationsCollapsed && (
              <div className="p-4">
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">아직 지원한 일자리가 없습니다</h3>
                    <p className="text-sm text-gray-500 mb-3">관심 있는 일자리에 지원해보세요</p>
                    <Link
                      to="/job-list"
                      className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                       일자리 보기
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredApplications.map((application) => {
                      // appliedJobs에서 먼저 찾고, 없으면 jobPosts에서 찾기
                      let jobPost = appliedJobs.find(job => job.id === application.jobPostId);
                      if (!jobPost) {
                        jobPost = jobPosts.find(job => job.id === application.jobPostId);
                      }

                      if (!jobPost) {
                        console.log('공고를 찾을 수 없음:', application.jobPostId);
                        return null;
                      }

                      const getStatusColor = (status: string) => {
                        switch (status) {
                        case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                        case 'reviewing': return 'bg-blue-100 text-blue-800 border-blue-200';
                        case 'interview_scheduled': return 'bg-purple-100 text-purple-800 border-purple-200';
                        case 'interview_completed': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
                        case 'offer_sent': return 'bg-orange-100 text-orange-800 border-orange-200';
                        case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
                        case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
                        case 'withdrawn': return 'bg-gray-100 text-gray-800 border-gray-200';
                        default: return 'bg-gray-100 text-gray-800 border-gray-200';
                        }
                      };

                      const getStatusText = (status: string) => {
                        switch (status) {
                        case 'pending': return '대기중';
                        case 'reviewing': return '검토중';
                        case 'interview_scheduled': return '면접 예정';
                        case 'interview_completed': return '면접 완료';
                        case 'offer_sent': return '제안';
                        case 'accepted': return '채용';
                        case 'rejected': return '거절';
                        case 'withdrawn': return '철회';
                        default: return '알 수 없음';
                        }
                      };

                      return (
                        <div
                          key={application.id}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <Link to={`/application-detail/${application.id}`} className="flex-1 min-w-0 cursor-pointer">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors text-sm">
                                  {jobPost ? jobPost.title : application.jobTitle || '공고 제목 없음'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                                  {getStatusText(application.status)}
                                </span>
                              </div>
                            </Link>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {application.createdAt ? formatDate(application.createdAt) : '날짜 없음'}
                              </span>
                              <Link
                                to={`/application-detail/${application.id}`}
                                className="text-green-600 hover:text-green-800 text-xs font-medium px-2 py-1 bg-white rounded border border-green-200 hover:bg-green-50 transition-colors"
                              >
                                상세보기
                              </Link>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                            <div className="flex items-center gap-1 text-gray-600">
                              <span className="font-medium text-gray-700">회사:</span>
                              <span className="truncate">{jobPost ? jobPost.employerName : application.employerName || '회사명 없음'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                              <span className="font-medium text-gray-700">위치:</span>
                              <span>{jobPost ? jobPost.location : application.location || '위치 정보 없음'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                              <span className="font-medium text-gray-700">급여:</span>
                              <span>
                                {jobPost?.salary ? 
                                  `${jobPost.salary.min.toLocaleString()}~${jobPost.salary.max.toLocaleString()}원 (${jobPost.salary.type === 'hourly' ? '시급' : jobPost.salary.type === 'daily' ? '일급' : '월급'})` 
                                  : '급여 정보 없음'
                                }
                              </span>
                            </div>
                          </div>
                          
                          {application.coverLetter && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="text-xs text-gray-600 line-clamp-2">
                                <span className="font-medium">지원 동기:</span> {application.coverLetter}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 활동 내역 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-blue-50">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                   활동 내역
                </h3>
                <div className="flex-1"></div>
                <button
                  onClick={() => setActivitiesCollapsed(!activitiesCollapsed)}
                  className="flex items-center gap-1 px-2 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors text-xs"
                >
                  {activitiesCollapsed ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronUp className="w-3 h-3" />
                  )}
                  {activitiesCollapsed ? '펼치기' : '접기'}
                </button>
              </div>
            </div>
            {!activitiesCollapsed && (
              <div className="p-4">
                {activities.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Activity className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">활동 내역이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.slice(0, 10).map((activity) => {
                      const getActivityIcon = (iconName: string) => {
                        switch (iconName) {
                        case 'Send': return <Send className="w-4 h-4" />;
                        case 'ThumbsUp': return <ThumbsUp className="w-4 h-4" />;
                        case 'FileText': return <FileText className="w-4 h-4" />;
                        case 'Star': return <Star className="w-4 h-4" />;
                        case 'Camera': return <Camera className="w-4 h-4" />;
                        default: return <Activity className="w-4 h-4" />;
                        }
                      };

                      const getActivityColor = (color: string) => {
                        switch (color) {
                        case 'green': return 'text-green-600 bg-green-50 border-green-200';
                        case 'blue': return 'text-blue-600 bg-blue-50 border-blue-200';
                        case 'purple': return 'text-purple-600 bg-purple-50 border-purple-200';
                        case 'yellow': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
                        case 'pink': return 'text-pink-600 bg-pink-50 border-pink-200';
                        default: return 'text-gray-600 bg-gray-50 border-gray-200';
                        }
                      };

                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${getActivityColor(activity.color)}`}>
                            {getActivityIcon(activity.icon)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {activity.title}
                              </h4>
                              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                {activity.date ? formatDate(activity.date) : '날짜 없음'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              {activity.description}
                            </p>
                            {activity.link && (
                              <Link
                                to={activity.link}
                                className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                상세보기 →
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {activities.length > 10 && (
                      <div className="text-center pt-2">
                        <span className="text-xs text-gray-500">
                          최근 10개 활동만 표시됩니다
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobseekerDashboard;

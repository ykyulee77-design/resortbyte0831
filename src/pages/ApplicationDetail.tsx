import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Application, JobPost, User, PositiveReview, CompanyInfo, WorkType, TimeSlot } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';
import UnifiedScheduleGrid from '../components/UnifiedScheduleGrid';
import InterviewNoteModal from '../components/InterviewNoteModal';
import { 
  Users, 
  Building, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Clock, 
  FileText, 
  User as UserIcon, 
  Phone, 
  Mail, 
  GraduationCap, 
  Briefcase, 
  Award, 
  MessageSquare,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Send,
  X,
} from 'lucide-react';

const ApplicationDetail: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPreviewMode = applicationId === 'preview';
  const [application, setApplication] = useState<Application | null>(null);
  const [jobPost, setJobPost] = useState<JobPost | null>(null);
  const [jobseeker, setJobseeker] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showInterviewNoteModal, setShowInterviewNoteModal] = useState(false);
  const [evaluations, setEvaluations] = useState<PositiveReview[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      if (isPreviewMode) {
        // 미리보기 모드: 세션스토리지에서 데이터 가져오기
        const tempApplication = sessionStorage.getItem('tempApplication');
        const tempJobPost = sessionStorage.getItem('tempJobPost');
        
        if (!tempApplication || !tempJobPost) {
          alert('미리보기 데이터를 찾을 수 없습니다.');
          navigate(-1);
          return;
        }

        const applicationData = JSON.parse(tempApplication);
        const jobPostData = JSON.parse(tempJobPost);

        // 미리보기용 Application 객체 생성
        const previewApplication: Application = {
          id: 'preview',
          jobPostId: jobPostData.id,
          jobseekerId: user?.uid || '',
          jobseekerName: user?.displayName || '',
          status: 'pending',
          appliedAt: new Date(),
          coverLetter: applicationData.coverLetter || '',
          experience: user?.resume?.career || '',
          education: user?.resume?.education || '',
          availableStartDate: user?.resume?.availableStartDate ? new Date(user.resume.availableStartDate) : undefined,
          skills: user?.resume?.computerSkills || [],
          hourlyWage: user?.resume?.hourlyWage || 0,
          message: '',
          jobTitle: jobPostData.title,
          employerName: jobPostData.employerName,
          location: jobPostData.location,
          salary: jobPostData.salary,
          selectedWorkTypeIds: applicationData.selectedWorkTypeIds || [],
          processStage: 'applied',
          priority: 'medium',
          tags: [],
          resume: user?.resume,
        };

        // JobPost 데이터에 필수 필드 추가
        const completeJobPostData = {
          ...jobPostData,
          employerId: jobPostData.employerId || 'unknown',
          isActive: jobPostData.isActive !== undefined ? jobPostData.isActive : true,
          applications: jobPostData.applications || [],
          startDate: jobPostData.startDate || new Date(),
        };

        setApplication(previewApplication);
        setJobPost(completeJobPostData);
        // User 타입에 맞게 id 속성 추가하고 role 타입 캐스팅
        setJobseeker(user ? { 
          ...user, 
          id: user.uid,
          role: user.role as 'employer' | 'jobseeker' | 'admin'
        } : null);
        setLoading(false);
        return;
      }

      if (!applicationId) return;

      try {
        // 지원서 정보 가져오기
        const applicationDoc = await getDoc(doc(db, 'applications', applicationId));
        if (!applicationDoc.exists()) {
          alert('지원서를 찾을 수 없습니다.');
          navigate('/dashboard');
          return;
        }

        const data = applicationDoc.data();
        const raw = data.appliedAt;
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
        
        const applicationData: Application = {
          id: applicationDoc.id,
          jobPostId: data.jobPostId,
          jobseekerId: data.jobseekerId,
          jobseekerName: data.jobseekerName,
          status: data.status,
          appliedAt,
          coverLetter: data.coverLetter || '',
          experience: data.experience || '',
          education: data.education || '',
          availableStartDate: data.availableStartDate ? (data.availableStartDate.toDate ? data.availableStartDate.toDate() : new Date(data.availableStartDate)) : undefined,
          skills: data.skills || [],
          hourlyWage: data.hourlyWage || 0,
          message: data.message || '',
          jobTitle: data.jobTitle,
          employerName: data.employerName,
          location: data.location,
          salary: data.salary,
          selectedWorkTypeIds: data.selectedWorkTypeIds || [],
          processStage: data.processStage || 'applied',
          priority: data.priority || 'medium',
          tags: data.tags || [],
        };
        setApplication(applicationData);

        // 공고 정보 가져오기
        const jobPostDoc = await getDoc(doc(db, 'jobPosts', applicationData.jobPostId));
        if (jobPostDoc.exists()) {
          setJobPost({ id: jobPostDoc.id, ...jobPostDoc.data() } as JobPost);
        }

        // 지원자 정보 가져오기
        const userDoc = await getDoc(doc(db, 'users', applicationData.jobseekerId));
        if (userDoc.exists()) {
          setJobseeker({ uid: userDoc.id, ...userDoc.data() } as User);
        }

        // 회사 정보 가져오기 (공고 작성자 정보)
        if (jobPostDoc.exists()) {
          const jobPostData = jobPostDoc.data() as JobPost;
          const companyDoc = await getDoc(doc(db, 'companyInfo', jobPostData.employerId));
          if (companyDoc.exists()) {
            setCompanyInfo({ id: companyDoc.id, ...companyDoc.data() } as CompanyInfo);
          }
        }

        // 평가 정보 가져오기 (평가 노출이 허용된 경우에만)
        if (data.showEvaluations) {
          const evaluationsQuery = collection(db, 'positiveReviews');
          const evaluationsSnapshot = await getDocs(evaluationsQuery);
          const evaluationsData = evaluationsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as PositiveReview))
            .filter(review => 
              review.jobseekerId === applicationData.jobseekerId && 
              review.isPublic,
            );
          setEvaluations(evaluationsData);
        }

        setStatus(applicationData.status as 'pending' | 'accepted' | 'rejected');
      } catch (error) {
        console.error('지원서 정보를 가져오는 중 오류 발생:', error);
        alert('지원서 정보를 가져오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [applicationId, navigate]);

  const handleStatusChange = async (newStatus: 'accepted' | 'rejected') => {
    if (!application) return;

    try {
      setShowFeedbackModal(true);
      setStatus(newStatus);
    } catch (error) {
      console.error('상태 변경 중 오류 발생:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handlePreviewApply = async () => {
    if (isApplying) return; // 이미 지원 중이면 중복 실행 방지
    
    if (!application || !user?.uid || !jobPost) {
      console.error('필수 데이터 누락:', { application: !!application, user: !!user?.uid, jobPost: !!jobPost });
      alert('필수 데이터가 누락되었습니다. 다시 시도해주세요.');
      return;
    }

    // jobPost.id가 없으면 세션스토리지에서 다시 가져오기
    if (!jobPost.id) {
      const tempJobPost = sessionStorage.getItem('tempJobPost');
      if (tempJobPost) {
        const jobPostData = JSON.parse(tempJobPost);
        if (jobPostData.id) {
          setJobPost(prev => prev ? { ...prev, id: jobPostData.id } : null);
        } else {
          alert('공고 정보가 올바르지 않습니다. 다시 시도해주세요.');
          return;
        }
      } else {
        alert('공고 정보를 찾을 수 없습니다. 다시 시도해주세요.');
        return;
      }
    }

    setIsApplying(true);
    try {
      console.log('지원 데이터 준비 중...', { 
        jobPostId: jobPost.id, 
        jobseekerId: user.uid,
        jobPost: jobPost,
        application: application
      });
      
      // 지원서 생성
      const now = new Date();
      const applicationData: any = {
        jobPostId: jobPost.id,
        jobseekerId: user.uid,
        jobseekerName: user.displayName || '',
        status: 'pending',
        appliedAt: now,
        coverLetter: application.coverLetter || '',
        experience: application.experience || '',
        education: application.education || '',
        skills: application.skills || [],
        hourlyWage: application.hourlyWage || 0,
        message: application.message || '',
        jobTitle: jobPost.title || '',
        employerName: jobPost.employerName || jobPost.workplaceName || '회사명 없음',
        location: jobPost.location || '',
        salary: jobPost.salary || { min: 0, max: 0, type: '시급' },
        selectedWorkTypeIds: application.selectedWorkTypeIds || [],
        processStage: 'applied',
        priority: 'medium',
        tags: [],
        createdAt: now,
        updatedAt: now,
      };

      // undefined가 아닌 경우에만 필드 추가
      if (application.availableStartDate) {
        // Date 객체가 유효한지 확인
        const date = application.availableStartDate;
        if (date instanceof Date && !isNaN(date.getTime())) {
          applicationData.availableStartDate = date;
        } else if (typeof date === 'string' || typeof date === 'number') {
          const parsedDate = new Date(date);
          if (!isNaN(parsedDate.getTime())) {
            applicationData.availableStartDate = parsedDate;
          }
        }
      }

      console.log('Firestore에 지원서 저장 중...', applicationData);
      const docRef = await addDoc(collection(db, 'applications'), applicationData);
      console.log('지원서 저장 성공:', docRef.id);

      // 세션스토리지 정리
      sessionStorage.removeItem('tempApplication');
      sessionStorage.removeItem('tempJobPost');

      alert('지원이 성공적으로 완료되었습니다!');
      navigate('/dashboard');
    } catch (error) {
      console.error('지원 실패 상세 오류:', error);
      alert(`지원에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleInterviewNote = async (interviewData: { note: string; contactInfo: string; interviewDate: string; }) => {
    if (!application || !user?.uid) return;

    try {
      await updateDoc(doc(db, 'applications', application.id), {
        status: 'interview_completed',
        employerFeedback: interviewData.note,
        interviewContactInfo: interviewData.contactInfo,
        interviewDate: interviewData.interviewDate,
        updatedAt: new Date(),
      });

      // 알림 생성
      await addDoc(collection(db, 'notifications'), {
        userId: application.jobseekerId,
        title: '면접 완료',
        message: `${jobPost?.title} 공고에 대한 면접이 완료되었습니다.`,
        type: 'application_status',
        isRead: false,
        createdAt: new Date(),
        applicationId: application.id,
        status: 'interview_completed',
      });

      // 로컬 상태 업데이트
      setApplication(prev => prev ? {
        ...prev,
        status: 'interview_completed',
        employerFeedback: interviewData.note,
        interviewContactInfo: interviewData.contactInfo,
        interviewDate: interviewData.interviewDate,
      } : null);

      setShowInterviewNoteModal(false);
      alert('면접 노트가 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('면접 노트 저장 중 오류 발생:', error);
      alert('면접 노트 저장 중 오류가 발생했습니다.');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!application) return;

    try {
      // 지원서 상태 업데이트
      await updateDoc(doc(db, 'applications', application.id), {
        status: status,
        employerFeedback: feedback,
        employerFeedbackAt: new Date(),
        updatedAt: new Date(),
      });

      // 알림 생성
      await addDoc(collection(db, 'notifications'), {
        userId: application.jobseekerId,
        title: `지원 상태 변경: ${status === 'accepted' ? '승인' : '거절'}`,
        message: status === 'accepted' 
          ? `축하합니다! ${jobPost?.title} 공고에 지원하신 내용이 승인되었습니다.`
          : `안타깝게도 ${jobPost?.title} 공고에 지원하신 내용이 거절되었습니다.`,
        type: 'application_status',
        isRead: false,
        createdAt: new Date(),
        applicationId: application.id,
        status: status,
      });

      setShowFeedbackModal(false);
      setFeedback('');
      alert('지원 상태가 성공적으로 변경되었습니다.');
      navigate('/dashboard');
    } catch (error) {
      console.error('피드백 제출 중 오류 발생:', error);
      alert('피드백 제출 중 오류가 발생했습니다.');
    }
  };

  // 근무타입 클릭 시 스케줄 그리드 모달 열기
  const handleWorkTypeClick = (workType: WorkType) => {
    setSelectedWorkType(workType);
    setShowScheduleModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', text: '지원완료' },
      reviewing: { color: 'bg-blue-100 text-blue-800', text: '검토중' },
      interview_scheduled: { color: 'bg-purple-100 text-purple-800', text: '면접예정' },
      interview_completed: { color: 'bg-indigo-100 text-indigo-800', text: '면접완료' },
      offer_sent: { color: 'bg-orange-100 text-orange-800', text: '채용제안' },
      accepted: { color: 'bg-green-100 text-green-800', text: '최종채용' },
      rejected: { color: 'bg-red-100 text-red-800', text: '거절됨' },
      withdrawn: { color: 'bg-gray-100 text-gray-800', text: '취소됨' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">지원서 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!application || !jobPost || !jobseeker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">지원서를 찾을 수 없습니다</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-3xl font-bold text-gray-800">지원서 상세 보기</h1>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(application.status)}
              <span className="text-sm text-gray-500">
                지원일: {formatDate(application.appliedAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽 컬럼 - 공고 정보 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 등록 공고 정보 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                등록 공고 정보
              </h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">{jobPost.title}</h3>
                  <p className="text-blue-600 text-sm font-medium mb-1">
                    {companyInfo?.name || jobPost.workplaceName || jobPost.employerName || '회사명 없음'}
                  </p>
                  <p className="text-blue-700 text-sm">{jobPost.jobTitle}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{jobPost.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {jobPost.salary.min.toLocaleString()} - {jobPost.salary.max.toLocaleString()} {jobPost.salary.type}
                    </span>
                  </div>
                  
                  {jobPost.workSchedule && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{jobPost.workSchedule.hours}</span>
                    </div>
                  )}
                </div>

                {jobPost.description && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-800 mb-2">공고 설명</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{jobPost.description}</p>
                  </div>
                )}

                {jobPost.requirements && jobPost.requirements.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-800 mb-2">요구사항</h4>
                    <div className="flex flex-wrap gap-1">
                      {jobPost.requirements.map((req, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {jobPost.benefits && jobPost.benefits.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-800 mb-2">복리후생</h4>
                    <div className="flex flex-wrap gap-1">
                      {jobPost.benefits.map((benefit, index) => (
                        <span key={index} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 지원자 기본 정보 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-green-600" />
                지원자 정보
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{application.jobseekerName || jobseeker.displayName}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a 
                    href={`mailto:${jobseeker.email}`}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {jobseeker.email}
                  </a>
                </div>
                
                {jobseeker.resume?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <a 
                      href={`tel:${jobseeker.resume.phone}`}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {jobseeker.resume.phone}
                    </a>
                  </div>
                )}
                
                {jobseeker.resume?.birth && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{jobseeker.resume.birth}</span>
                  </div>
                )}

                {/* 면접 노트 작성 버튼 - 구인자만 */}
                {user?.role === 'employer' && application.status === 'pending' && !isPreviewMode && (
                  <div className="pt-3 border-t">
                    <button
                      onClick={() => setShowInterviewNoteModal(true)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      면접 노트 작성
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽 컬럼 - 이력서 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 이력서 상세 정보 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                이력서 상세 정보
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 학력 및 자격 */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      학력사항
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {application.education || jobseeker.resume?.education ? (
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {application.education || jobseeker.resume?.education}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">작성되지 않음</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-600" />
                      자격증/특기
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {jobseeker.resume?.certs && jobseeker.resume.certs.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {jobseeker.resume.certs.map((cert, index) => (
                            <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                              {cert}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">작성되지 않음</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 경력 및 기술 */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-green-600" />
                      경력사항
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {application.experience || jobseeker.resume?.career ? (
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {application.experience || jobseeker.resume?.career}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">작성되지 않음</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-orange-600" />
                      보유 기술
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {application.skills && application.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {application.skills.map((skill, index) => (
                            <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">작성되지 않음</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 희망 조건 */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">희망 조건</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">희망 시급</h4>
                    <p className="text-blue-700">
                      {application.hourlyWage || jobseeker.resume?.hourlyWage ? 
                        `${(application.hourlyWage || jobseeker.resume?.hourlyWage || 0).toLocaleString()}원/시간` : 
                        '미입력'
                      }
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-1">입사 가능일</h4>
                    <p className="text-green-700">
                      {application.availableStartDate || jobseeker.resume?.availableStartDate ? 
                        (() => {
                          const date = application.availableStartDate || jobseeker.resume?.availableStartDate;
                          if (date instanceof Date) {
                            return date.toLocaleDateString();
                          } else if (typeof date === 'string') {
                            return new Date(date).toLocaleDateString();
                          }
                          return '미입력';
                        })() : 
                        '미입력'
                      }
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-1">희망 직무</h4>
                    <p className="text-purple-700">
                      {application.jobTitle || jobseeker.resume?.jobType || '미입력'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 자기소개 */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">자기소개</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {application.coverLetter || jobseeker.resume?.intro ? (
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {application.coverLetter || jobseeker.resume?.intro}
                    </p>
                  ) : (
                    <p className="text-gray-500 italic">작성되지 않음</p>
                  )}
                </div>
              </div>

              {/* 선택한 근무타입 */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  선택한 근무타입
                </h3>
                {application.selectedWorkTypeIds && application.selectedWorkTypeIds.length > 0 ? (
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {application.selectedWorkTypeIds.map((workTypeId, index) => {
                        const workType = jobPost?.workTypes?.find(wt => wt.id === workTypeId);
                        return (
                          <div 
                            key={index} 
                            className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all"
                            onClick={() => workType && handleWorkTypeClick(workType)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-indigo-800">{workType ? workType.name : `근무타입 ${index + 1}`}</h4>
                              <div className="flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                                  선택됨
                                </span>
                                {workType && (
                                  <Clock className="h-3 w-3 text-indigo-500" />
                                )}
                              </div>
                            </div>
                            {workType && workType.description && (
                              <p className="text-sm text-gray-600 leading-relaxed">{workType.description}</p>
                            )}
                            {workType && (
                              <p className="text-indigo-600 text-xs mt-2">클릭하여 스케줄 확인</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-3 border-t border-indigo-200">
                      <p className="text-sm text-indigo-700">
                        총 <strong>{application.selectedWorkTypeIds.length}개</strong>의 근무타입을 선택했습니다.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-500 italic">선택한 근무타입이 없습니다.</p>
                  </div>
                )}
              </div>

              {/* 추가 메시지 */}
              {application.message && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    추가 메시지
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-700">{application.message}</p>
                  </div>
                </div>
              )}

              {/* 평가 정보 */}
              {application.showEvaluations && evaluations.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" />
                    이전 근무 평가
                  </h3>
                  <div className="space-y-3">
                    {evaluations.map((evaluation) => (
                      <div key={evaluation.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-green-800 mb-2">다시 같이 일하고 싶어요</h4>
                            <p className="text-green-700 text-sm leading-relaxed">{evaluation.description}</p>
                          </div>
                          <div className="text-xs text-green-600 ml-4">
                            {evaluation.createdAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 면접 노트 */}
            {application.employerFeedback && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  면접 노트
                </h2>
                <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                  {/* 면접 노트 내용 */}
                  <div>
                    <h3 className="font-medium text-purple-800 mb-2">면접 내용</h3>
                    <p className="text-purple-700 whitespace-pre-wrap leading-relaxed">{application.employerFeedback}</p>
                  </div>
                  
                  {/* 면접 연락처 */}
                  {application.interviewContactInfo && (
                    <div>
                      <h3 className="font-medium text-purple-800 mb-2">면접 연락처</h3>
                      <p className="text-purple-700">{application.interviewContactInfo}</p>
                    </div>
                  )}
                  
                  {/* 면접일자 */}
                  {application.interviewDate && (
                    <div>
                      <h3 className="font-medium text-purple-800 mb-2">면접일자</h3>
                      <p className="text-purple-700">{application.interviewDate}</p>
                    </div>
                  )}
                  
                  <p className="text-sm text-purple-600 mt-3 pt-3 border-t border-purple-200">
                    작성일: {formatDate(application.employerFeedbackAt)}
                  </p>
                </div>
              </div>
            )}

            {/* 미리보기 모드에서 지원하기 버튼 */}
            {isPreviewMode && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">지원하기</h2>
                <div className="flex gap-4">
                  <button
                    onClick={handlePreviewApply}
                    disabled={isApplying}
                    className={`flex-1 px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isApplying 
                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isApplying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        지원 중...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        최종 지원하기
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => navigate(-1)}
                    disabled={isApplying}
                    className={`flex-1 px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isApplying 
                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                        : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    돌아가기
                  </button>
                </div>
              </div>
            )}

            {/* 면접 프로세스 버튼 - 구인자만 */}
            {user?.role === 'employer' && application.status === 'pending' && !isPreviewMode && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">지원자 관리</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowInterviewNoteModal(true)}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    면접 노트 작성
                  </button>
                  <button
                    onClick={() => handleStatusChange('rejected')}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    거절하기
                  </button>
                </div>
              </div>
            )}

            {/* 면접 완료 후 채용 결정 버튼 */}
            {user?.role === 'employer' && application.status === 'interview_completed' && !isPreviewMode && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">채용 결정</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate(`/final-hiring-decision/${application.id}`)}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    최종 채용 결정
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 면접 노트 작성 모달 */}
      {showInterviewNoteModal && (
        <InterviewNoteModal
          application={{
            ...application,
            // 지원자 연락처 정보 추가
            phone: jobseeker.resume?.phone || '',
            email: jobseeker.email || '',
            resume: jobseeker.resume
          }}
          onSave={handleInterviewNote}
          onCancel={() => setShowInterviewNoteModal(false)}
        />
      )}

      {/* 피드백 모달 */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              {status === 'accepted' ? '승인' : '거절'} 피드백 작성
            </h3>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={`지원자를 ${status === 'accepted' ? '승인' : '거절'}하는 이유를 작성해주세요...`}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmitFeedback}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                제출
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 스케줄 그리드 모달 */}
      {showScheduleModal && selectedWorkType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedWorkType.name} - 근무 스케줄
                </h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-indigo-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">시급:</span>
                  <span className="ml-2 text-indigo-600 font-semibold">
                    {selectedWorkType.hourlyWage?.toLocaleString()}원
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">스케줄 수:</span>
                  <span className="ml-2 text-indigo-600 font-semibold">
                    {selectedWorkType.schedules?.length || 0}개
                  </span>
                </div>
                {selectedWorkType.description && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">설명:</span>
                    <span className="ml-2 text-gray-600">{selectedWorkType.description}</span>
                  </div>
                )}
              </div>
            </div>

            <UnifiedScheduleGrid
              selectedTimeSlots={selectedWorkType.schedules || []}
              mode="view"
              title={`${selectedWorkType.name} 근무 스케줄`}
              description="선택된 근무 시간대를 확인하세요"
              showStatistics={true}
              showActions={false}
              readOnly={true}
              employerView={true}
            />
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetail; 
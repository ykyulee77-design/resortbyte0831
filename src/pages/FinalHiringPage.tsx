import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, query, where, orderBy, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { Application, JobPost, User, CompanyInfo, PositiveReview } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';
import { 
  Users, 
  Building, 
  MapPin, 
  DollarSign, 
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
} from 'lucide-react';

const FinalHiringPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [application, setApplication] = useState<Application | null>(null);
  const [jobPost, setJobPost] = useState<JobPost | null>(null);
  const [jobseeker, setJobseeker] = useState<User | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [evaluations, setEvaluations] = useState<PositiveReview[]>([]);
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      if (!applicationId || !user) {
        return;
      }

      try {
        setLoading(true);
        
        // 지원서 정보 가져오기
        const applicationDoc = await getDoc(doc(db, 'applications', applicationId));
        if (!applicationDoc.exists()) {
          alert('지원서를 찾을 수 없습니다.');
          navigate(-1);
          return;
        }

        const applicationData = applicationDoc.data() as Application;
        setApplication({ ...applicationData, id: applicationDoc.id });

        // 공고 정보 가져오기 (자사 공고만)
        const jobPostDoc = await getDoc(doc(db, 'jobPosts', applicationData.jobPostId));
        if (jobPostDoc.exists()) {
          const jobPostData = jobPostDoc.data() as JobPost;
          if (jobPostData.employerId === user.uid) {
            setJobPost({ ...jobPostData, id: jobPostDoc.id });
          } else {
            alert('해당 공고에 대한 접근 권한이 없습니다.');
            navigate(-1);
            return;
          }
        }

        // 지원자 정보 가져오기 (기본 정보만)
        const jobseekerDoc = await getDoc(doc(db, 'users', applicationData.jobseekerId));
        if (jobseekerDoc.exists()) {
          const jobseekerData = jobseekerDoc.data() as User;
          const safeJobseekerData = {
            id: jobseekerDoc.id,
            uid: jobseekerData.uid,
            email: jobseekerData.email,
            displayName: jobseekerData.displayName,
            role: jobseekerData.role,
            phone: jobseekerData.phone,
            resume: applicationData.resume || undefined
          };
          setJobseeker(safeJobseekerData);
        }

        // 회사 정보 가져오기
        if (applicationData.jobPostId) {
          const companyInfoDoc = await getDoc(doc(db, 'companyInfo', applicationData.jobPostId));
          if (companyInfoDoc.exists()) {
            setCompanyInfo({ ...companyInfoDoc.data() as CompanyInfo, id: companyInfoDoc.id });
          }
        }

        // 이전 근무 평가 가져오기
        if (applicationData.showEvaluations) {
          const evaluationsQuery = query(
            collection(db, 'positiveReviews'),
            where('targetUserId', '==', applicationData.jobseekerId),
            orderBy('createdAt', 'desc')
          );
          const evaluationsSnapshot = await getDocs(evaluationsQuery);
          const evaluationsData = evaluationsSnapshot.docs.map(doc => ({
            ...doc.data() as PositiveReview,
            id: doc.id
          }));
          setEvaluations(evaluationsData);
        }

        // 해당 지원자의 모든 지원 내역 가져오기 (자사 공고만)
        const allApplicationsQuery = query(
          collection(db, 'applications'),
          where('jobseekerId', '==', applicationData.jobseekerId),
          orderBy('appliedAt', 'desc')
        );
        const allApplicationsSnapshot = await getDocs(allApplicationsQuery);
        
        const allApplicationsData = await Promise.all(
          allApplicationsSnapshot.docs.map(async (docSnapshot) => {
            const appData = docSnapshot.data() as Application;
            
            let jobPostData: JobPost | undefined = undefined;
            try {
              const jobPostDocRef = doc(db, 'jobPosts', appData.jobPostId);
              const jobPostDoc = await getDoc(jobPostDocRef);
              if (jobPostDoc.exists()) {
                const postData = jobPostDoc.data() as JobPost;
                if (postData.employerId === user.uid) {
                  jobPostData = { ...postData, id: jobPostDoc.id };
                }
              }
            } catch (error) {
              console.error(`공고 정보 로딩 실패 (${appData.jobPostId}):`, error);
            }
            
            return {
              ...appData,
              id: docSnapshot.id,
              jobPost: jobPostData
            };
          })
        );
        
        const filteredApplications = allApplicationsData.filter(app => app.jobPost);
        setAllApplications(filteredApplications);

      } catch (error) {
        console.error('지원서 상세 정보 로딩 실패:', error);
        alert('지원서 정보를 불러오는데 실패했습니다.');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [applicationId, navigate, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'interview_completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return '채용 확정';
      case 'rejected': return '채용 거절';
      case 'interview_completed': return '면접 완료';
      case 'pending': return '지원 완료';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">최종 채용 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!application || !jobseeker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">지원서 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  최종 채용 - {application?.jobseekerName || '지원자명 없음'}
                </h1>
                <p className="text-sm text-gray-600">
                  {jobPost?.title || application?.jobTitle || '공고명 없음'} • {jobPost?.location || '위치 정보 없음'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application?.status || 'pending')}`}>
                {getStatusText(application?.status || 'pending')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽 패널 - 지원자 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 지원자 기본 정보 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{application.jobseekerName}</h2>
                  <p className="text-gray-600">{jobPost?.title || application.jobTitle || '공고명 없음'}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>지원일: {formatDate(application.appliedAt)}</span>
                    <span>희망시급: {application.hourlyWage?.toLocaleString()}원</span>
                  </div>
                </div>
              </div>

              {/* 연락처 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {jobseeker.phone && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">전화번호</p>
                      <a href={`tel:${jobseeker.phone}`} className="text-blue-600 hover:text-blue-800">
                        {jobseeker.phone}
                      </a>
                    </div>
                  </div>
                )}
                {jobseeker.email && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">이메일</p>
                      <a href={`mailto:${jobseeker.email}`} className="text-blue-600 hover:text-blue-800">
                        {jobseeker.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* 자기소개서 */}
              {application.coverLetter && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    자기소개서
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{application.coverLetter}</p>
                  </div>
                </div>
              )}

              {/* 현재 지원 공고 정보 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  지원 공고 정보
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-blue-800 text-lg">
                        {jobPost?.title || application.jobTitle || '공고명 없음'}
                      </h4>
                      <p className="text-blue-600 text-sm font-medium">
                        {companyInfo?.name || jobPost?.workplaceName || jobPost?.employerName || '회사명 없음'}
                      </p>
                      <p className="text-blue-700 text-sm">
                        {jobPost?.jobTitle || '직무명 없음'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          {jobPost?.location || '위치 정보 없음'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          {jobPost?.salary?.min?.toLocaleString() || jobPost?.salary?.toLocaleString() || '급여 정보 없음'} - {jobPost?.salary?.max?.toLocaleString() || jobPost?.salary?.toLocaleString() || '급여 정보 없음'} {jobPost?.salary?.type || '원'}
                        </span>
                      </div>
                      
                      {jobPost?.workSchedule && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{jobPost.workSchedule.hours}</span>
                        </div>
                      )}
                    </div>
                    
                    {jobPost?.description && (
                      <div className="border-t border-blue-200 pt-3">
                        <h5 className="font-medium text-blue-800 mb-2">공고 설명</h5>
                        <p className="text-sm text-blue-700 leading-relaxed">{jobPost.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 이력서 상세 정보 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  이력서 상세 정보
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 경력사항 */}
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      경력사항
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {application.experience || jobseeker.resume?.career ? (
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {application.experience || jobseeker.resume?.career}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">경력사항이 없습니다.</p>
                      )}
                    </div>
                  </div>
                  
                  {/* 학력사항 */}
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      학력사항
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {application.education || jobseeker.resume?.education ? (
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {application.education || jobseeker.resume?.education}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">학력사항이 없습니다.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 추가 이력서 정보 */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 희망시급 및 시작일 */}
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      희망 조건
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">희망시급:</span>
                        <span className="text-sm font-medium">
                          {application.hourlyWage?.toLocaleString() || jobseeker.resume?.hourlyWage?.toLocaleString() || '미입력'}원
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">희망 시작일:</span>
                        <span className="text-sm font-medium">
                          {application.availableStartDate ? formatDate(application.availableStartDate) : 
                           jobseeker.resume?.availableStartDate ? formatDate(new Date(jobseeker.resume.availableStartDate)) : '미입력'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 자격증/특기 */}
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                      <Award className="h-4 w-4 mr-2" />
                      자격증/특기
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {jobseeker.resume?.certs && jobseeker.resume.certs.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {jobseeker.resume.certs.map((cert, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                            >
                              {cert}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">자격증/특기가 없습니다.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 보유 기술 */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                    <Award className="h-4 w-4 mr-2" />
                    보유 기술
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {application.skills && application.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {application.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : jobseeker.resume?.computerSkills && jobseeker.resume.computerSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {jobseeker.resume.computerSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">보유 기술이 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 자기소개 */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    자기소개
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {jobseeker.resume?.intro ? (
                      <p className="text-gray-700 whitespace-pre-wrap">{jobseeker.resume.intro}</p>
                    ) : (
                      <p className="text-gray-500 italic">자기소개가 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 선택한 근무타입 */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    선택한 근무타입
                  </h4>
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    {application.selectedWorkTypeIds && application.selectedWorkTypeIds.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {application.selectedWorkTypeIds.map((workTypeId, index) => {
                            const workType = jobPost?.workTypes?.find(wt => wt.id === workTypeId);
                            return (
                              <div 
                                key={index} 
                                className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-medium text-indigo-800">{workType ? workType.name : `근무타입 ${index + 1}`}</h5>
                                  <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                                    선택됨
                                  </span>
                                </div>
                                {workType && workType.description && (
                                  <p className="text-sm text-gray-600 leading-relaxed">{workType.description}</p>
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
                      </>
                    ) : (
                      <p className="text-gray-500 italic">선택한 근무타입이 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 추가 메시지 */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    추가 메시지
                  </h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    {application.message ? (
                      <p className="text-blue-700">{application.message}</p>
                    ) : (
                      <p className="text-gray-500 italic">추가 메시지가 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 이전 근무 평가 */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    이전 근무 평가
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {application.showEvaluations && evaluations.length > 0 ? (
                      <div className="space-y-3">
                        {evaluations.map((evaluation) => (
                          <div key={evaluation.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-green-800 mb-2">다시 같이 일하고 싶어요</h5>
                                <p className="text-green-700 text-sm leading-relaxed">{evaluation.description}</p>
                              </div>
                              <div className="text-xs text-green-600 ml-4">
                                {evaluation.createdAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">이전 근무 평가가 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 면접 노트 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                면접 노트
              </h3>
              
              <div className="space-y-4">
                {/* 면접 내용 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">면접 내용</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {application.employerFeedback ? (
                      <p className="text-gray-700 whitespace-pre-wrap">{application.employerFeedback}</p>
                    ) : (
                      <p className="text-gray-500 italic">면접 내용이 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 면접 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">면접 시 연락처</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {application.interviewContactInfo ? (
                        application.interviewContactInfo.includes('@') ? (
                          <a 
                            href={`mailto:${application.interviewContactInfo}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {application.interviewContactInfo}
                          </a>
                        ) : (
                          <a 
                            href={`tel:${application.interviewContactInfo}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {application.interviewContactInfo}
                          </a>
                        )
                      ) : (
                        <p className="text-gray-500 italic">면접 시 연락처가 없습니다.</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">면접 일자</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {application.interviewDate ? (
                        <p className="text-gray-700">{application.interviewDate}</p>
                      ) : (
                        <p className="text-gray-500 italic">면접 일자가 없습니다.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 최종 확정 사유 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                최종 확정 사유
              </h3>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                {application.status === 'accepted' && application.employerFeedback ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{application.employerFeedback}</p>
                ) : (
                  <p className="text-gray-500 italic">최종 확정 사유가 없습니다.</p>
                )}
              </div>
            </div>

            {/* 최종 거절 사유 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <XCircle className="h-5 w-5 mr-2 text-red-600" />
                최종 거절 사유
              </h3>
              
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                {application.status === 'rejected' && application.employerFeedback ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{application.employerFeedback}</p>
                ) : (
                  <p className="text-gray-500 italic">최종 거절 사유가 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽 패널 */}
          <div className="space-y-6">
            {/* 지원 정보 요약 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                지원 정보
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">지원일</span>
                  <span className="text-sm font-medium">{formatDate(application.appliedAt)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">희망시급</span>
                  <span className="text-sm font-medium">{application.hourlyWage?.toLocaleString()}원</span>
                </div>
                
                {application.availableStartDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">희망 시작일</span>
                    <span className="text-sm font-medium">{formatDate(application.availableStartDate)}</span>
                  </div>
                )}
                
                {application.skills && application.skills.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600">보유 기술</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {application.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 모든 지원 내역 */}
            {allApplications.length > 1 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  모든 지원 내역 ({allApplications.length}건)
                </h3>
                
                <div className="space-y-3">
                  {allApplications.map((app, index) => (
                    <div 
                      key={app.id} 
                      className={`p-4 rounded-lg border ${
                        app.id === application.id 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">
                            {app.jobPost?.title || app.jobTitle || '공고명 없음'}
                          </h4>
                          {app.id === application.id && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              현재 지원서
                            </span>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          app.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          app.status === 'interview_completed' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {app.status === 'accepted' ? '채용 확정' :
                           app.status === 'pending' ? '검토중' :
                           app.status === 'rejected' ? '채용 거절' :
                           app.status === 'interview_completed' ? '면접 완료' :
                           app.status}
                        </span>
                      </div>
                      
                      {/* 공고 정보 */}
                      {app.jobPost && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Building className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">공고 정보</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-medium text-gray-700">직무:</span> {app.jobPost.jobTitle || '직무명 없음'}
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">위치:</span> {app.jobPost.location || '위치 정보 없음'}
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">급여:</span> {
                                app.jobPost.salary?.min?.toLocaleString() || app.jobPost.salary?.toLocaleString()
                              } - {
                                app.jobPost.salary?.max?.toLocaleString() || app.jobPost.salary?.toLocaleString()
                              } {app.jobPost.salary?.type || '원'}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">지원일:</span> {formatDate(app.appliedAt)}
                        </div>
                        <div>
                          <span className="font-medium">희망시급:</span> {app.hourlyWage?.toLocaleString()}원
                        </div>
                      </div>
                      
                      {app.message && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          <span className="text-xs font-medium text-gray-700">추가 메시지:</span>
                          <p className="text-xs text-gray-600 mt-1">{app.message}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalHiringPage;

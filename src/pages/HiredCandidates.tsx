import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, CheckCircle, Calendar, MapPin, DollarSign, Phone, Mail, Eye, Star, X } from 'lucide-react';
import { Application, JobPost } from '../types';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { formatDate, createDateFromTimestamp } from '../utils/dateUtils';
import PositiveReviewModal from '../components/PositiveReviewModal';
import CrewProfileCard from '../components/CrewProfileCard';

const HiredCandidates: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [userData, setUserData] = useState<{[key: string]: any}>({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<{id: string, name: string, jobPostId: string} | null>(null);
  const [showCrewProfile, setShowCrewProfile] = useState(false);
  const [reviewedJobseekers, setReviewedJobseekers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        // 1. 본인(구인자)의 공고 목록 가져오기
        const jobPostsQuery = query(
          collection(db, 'jobPosts'),
          where('employerId', '==', user.uid),
        );
        const jobPostsSnap = await getDocs(jobPostsQuery);
        const fetchedJobPosts: JobPost[] = jobPostsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as JobPost[];
        setJobPosts(fetchedJobPosts);

        // 2. 해당 공고들에 지원한 지원서 중 최종 채용된 것들만 가져오기
        const jobPostIds = fetchedJobPosts.map(post => post.id);
        if (jobPostIds.length === 0) {
          setApplications([]);
          setLoading(false);
          return;
        }
        
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('jobPostId', 'in', jobPostIds.slice(0, 10)), // Firestore in 쿼리 제한(10개)
          where('status', '==', 'accepted'),
        );
        const applicationsSnap = await getDocs(applicationsQuery);
        const fetchedApplications: Application[] = applicationsSnap.docs.map(doc => {
          const data = doc.data();
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
          return {
            id: doc.id,
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
            phone: data.phone || '',
            email: data.email || '',
            processStage: data.processStage || 'applied',
            priority: data.priority || 'medium',
            tags: data.tags || [],
          };
        });
        setApplications(fetchedApplications);

        // 지원자들의 사용자 정보 가져오기 (이메일 등)
        const uniqueJobseekerIds = Array.from(new Set(fetchedApplications.map(app => app.jobseekerId)));
        const userDataMap: {[key: string]: any} = {};
         
        for (const jobseekerId of uniqueJobseekerIds) {
          try {
            const userDoc = await getDoc(doc(db, 'users', jobseekerId));
            if (userDoc.exists()) {
              userDataMap[jobseekerId] = userDoc.data();
            }
          } catch (error) {
            console.error(`사용자 정보 가져오기 실패 (${jobseekerId}):`, error);
          }
        }
         
        setUserData(userDataMap);

        // 이미 평가를 작성한 구직자들 확인
        const reviewedSet = new Set<string>();
        for (const application of fetchedApplications) {
          const reviewQuery = query(
            collection(db, 'positiveReviews'),
            where('employerId', '==', user?.uid),
            where('jobseekerId', '==', application.jobseekerId),
            where('jobPostId', '==', application.jobPostId),
          );
          const reviewSnapshot = await getDocs(reviewQuery);
          if (!reviewSnapshot.empty) {
            reviewedSet.add(`${application.jobseekerId}-${application.jobPostId}`);
          }
        }
        setReviewedJobseekers(reviewedSet);
      } catch (error) {
        console.error('최종 채용자 데이터 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filteredApplications = applications.filter(app => {
    return selectedJobId === 'all' || app.jobPostId === selectedJobId;
  });

  const getJobPostTitle = (jobPostId: string) => {
    const jobPost = jobPosts.find(post => post.id === jobPostId);
    return jobPost?.title || '삭제된 공고';
  };

  const getWorkTypeNames = (application: Application) => {
    const jobPost = jobPosts.find(post => post.id === application.jobPostId);
    if (!application.selectedWorkTypeIds || application.selectedWorkTypeIds.length === 0) {
      return ['근무타입 미선택'];
    }
    return application.selectedWorkTypeIds.map(workTypeId => {
      const workType = jobPost?.workTypes?.find(wt => wt.id === workTypeId);
      return workType?.name || `근무타입 ${workTypeId}`;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-resort-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          최종 채용자 관리
        </h1>
        <p className="text-gray-600">
          최종 채용된 지원자들의 현황을 확인하고 관리하세요.
        </p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 최종 채용자</p>
              <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">채용 공고 수</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(applications.map(app => app.jobPostId)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">이번 달 채용</p>
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(app => {
                  const thisMonth = new Date();
                  const appliedMonth = createDateFromTimestamp(app.appliedAt);
                  if (!appliedMonth) return false;
                  return thisMonth.getMonth() === appliedMonth.getMonth() && 
                         thisMonth.getFullYear() === appliedMonth.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">공고별 필터:</label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-resort-500 focus:border-resort-500"
          >
            <option value="all">전체 공고</option>
            {Array.from(new Set(applications.map(app => app.jobPostId))).map(jobPostId => (
              <option key={jobPostId} value={jobPostId}>
                {getJobPostTitle(jobPostId)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 최종 채용자 목록 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">최종 채용자 목록</h3>
        </div>
        
        {filteredApplications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">최종 채용자가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">
              아직 최종 채용된 지원자가 없거나 필터 조건에 맞는 채용자가 없습니다.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredApplications.map((application) => {
              const jobPost = jobPosts.find(post => post.id === application.jobPostId);
              const workTypeNames = getWorkTypeNames(application);
              
              return (
                <div key={application.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{application.jobseekerName}</h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          최종 채용
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{jobPost?.title}</p>
                      
                      {/* 선택된 근무타입 표시 */}
                      <div className="mb-2">
                        <div className="text-xs text-gray-500 mb-1">채용된 근무타입:</div>
                        <div className="flex flex-wrap gap-1">
                          {workTypeNames.map((workTypeName, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {workTypeName}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* 지원 정보 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>지원일: {formatDate(application.appliedAt, 'ko-KR')}</span>
                        </div>
                        {application.hourlyWage && application.hourlyWage > 0 && (
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-2" />
                            <span>희망시급: {application.hourlyWage.toLocaleString()}원/시간</span>
                          </div>
                        )}
                        {application.availableStartDate && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>희망시작일: {formatDate(application.availableStartDate, 'ko-KR')}</span>
                          </div>
                        )}
                        {(application.phone || userData[application.jobseekerId]?.resume?.phone) && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            <span>연락처: {application.phone || userData[application.jobseekerId]?.resume?.phone}</span>
                          </div>
                        )}
                        {(application.email || userData[application.jobseekerId]?.email) && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            <span>이메일: {application.email || userData[application.jobseekerId]?.email}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* 지원 동기 */}
                      {application.coverLetter && (
                        <div className="bg-gray-50 rounded-md p-3 mb-3">
                          <p className="text-sm text-gray-700">{application.coverLetter}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex space-x-2">
                      {reviewedJobseekers.has(`${application.jobseekerId}-${application.jobPostId}`) ? (
                        <button
                          onClick={() => {
                            setSelectedCrew({
                              id: application.jobseekerId,
                              name: application.jobseekerName,
                              jobPostId: application.jobPostId,
                            });
                            setShowCrewProfile(true);
                          }}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          평가완료
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedCrew({
                              id: application.jobseekerId,
                              name: application.jobseekerName,
                              jobPostId: application.jobPostId,
                            });
                            setShowReviewModal(true);
                          }}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                        >
                          <Star className="h-4 w-4 mr-1" />
                          평가
                        </button>
                      )}
                      <Link
                        to={`/application-detail/${application.id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        상세보기
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 긍정적 평가 모달 */}
      {selectedCrew && (
        <PositiveReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedCrew(null);
          }}
          jobseekerId={selectedCrew.id}
          jobseekerName={selectedCrew.name}
          jobPostId={selectedCrew.jobPostId}
          employerId={user?.uid || ''}
          onReviewComplete={() => {
            setShowReviewModal(false);
            setShowCrewProfile(true);
            // 평가 완료 후 상태 업데이트
            if (selectedCrew) {
              setReviewedJobseekers(prev => new Set(Array.from(prev).concat(`${selectedCrew.id}-${selectedCrew.jobPostId}`)));
            }
          }}
        />
      )}

      {/* 크루 프로필 모달 */}
      {selectedCrew && showCrewProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCrew.name}님의 크루 프로필
                </h2>
                <button
                  onClick={() => {
                    setShowCrewProfile(false);
                    setSelectedCrew(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <CrewProfileCard
                jobseekerId={selectedCrew.id}
                jobseekerName={selectedCrew.name}
                showFullProfile={true}
                onReviewClick={() => {
                  setShowCrewProfile(false);
                  setShowReviewModal(true);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HiredCandidates;

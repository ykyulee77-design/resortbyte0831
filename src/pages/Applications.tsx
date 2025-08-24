import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Application, JobPost } from '../types';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';

const Applications: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedWorkTypeId, setSelectedWorkTypeId] = useState<string>('all');

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

        // 2. 해당 공고들에 지원한 지원서 목록 가져오기
        const jobPostIds = fetchedJobPosts.map(post => post.id);
        if (jobPostIds.length === 0) {
          setApplications([]);
          setLoading(false);
          return;
        }
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('jobPostId', 'in', jobPostIds.slice(0, 10)), // Firestore in 쿼리 제한(10개)
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
          };
        });
        setApplications(fetchedApplications);
      } catch (error) {
        console.error('지원자/공고 데이터 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleStatusChange = async (applicationId: string, newStatus: Application['status']) => {
    try {
      // Firestore에서 지원서 상태 업데이트
      const applicationRef = doc(db, 'applications', applicationId);
      await updateDoc(applicationRef, {
        status: newStatus,
        updatedAt: new Date(),
      });

      // 로컬 상태 업데이트
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus }
            : app,
        ),
      );

      const statusText = getStatusText(newStatus);
      alert(`지원자 상태가 "${statusText}"로 변경되었습니다.`);
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const getNextStatusOptions = (currentStatus: Application['status']): Array<{value: Application['status'], label: string, color: string}> => {
    switch (currentStatus) {
    case 'pending':
      return [
        { value: 'reviewing', label: '검토중으로 변경', color: 'bg-blue-600 hover:bg-blue-700' },
        { value: 'rejected', label: '거절', color: 'bg-red-600 hover:bg-red-700' },
      ];
    case 'reviewing':
      return [
        { value: 'interview_scheduled', label: '면접예정', color: 'bg-purple-600 hover:bg-purple-700' },
        { value: 'rejected', label: '거절', color: 'bg-red-600 hover:bg-red-700' },
      ];
    case 'interview_scheduled':
      return [
        { value: 'interview_completed', label: '면접완료', color: 'bg-indigo-600 hover:bg-indigo-700' },
        { value: 'rejected', label: '거절', color: 'bg-red-600 hover:bg-red-700' },
      ];
    case 'interview_completed':
      return [
        { value: 'offer_sent', label: '채용제안', color: 'bg-orange-600 hover:bg-orange-700' },
        { value: 'rejected', label: '거절', color: 'bg-red-600 hover:bg-red-700' },
      ];
    case 'offer_sent':
      return [
        { value: 'accepted', label: '최종채용', color: 'bg-green-600 hover:bg-green-700' },
        { value: 'rejected', label: '거절', color: 'bg-red-600 hover:bg-red-700' },
      ];
    default:
      return [];
    }
  };

  const filteredApplications = applications.filter(app => {
    // 상태 필터
    const statusMatch = selectedStatus === 'all' || app.status === selectedStatus;
    
    // 근무타입 필터
    const workTypeMatch = selectedWorkTypeId === 'all' || 
      (app.selectedWorkTypeIds && app.selectedWorkTypeIds.includes(selectedWorkTypeId));
    
    return statusMatch && workTypeMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
    case 'pending':
      return 'bg-gray-100 text-gray-800';
    case 'reviewing':
      return 'bg-blue-100 text-blue-800';
    case 'interview_scheduled':
      return 'bg-purple-100 text-purple-800';
    case 'interview_completed':
      return 'bg-indigo-100 text-indigo-800';
    case 'offer_sent':
      return 'bg-orange-100 text-orange-800';
    case 'accepted':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'withdrawn':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
    case 'pending':
      return '지원완료';
    case 'reviewing':
      return '검토중';
    case 'interview_scheduled':
      return '면접예정';
    case 'interview_completed':
      return '면접완료';
    case 'offer_sent':
      return '채용제안';
    case 'accepted':
      return '최종채용';
    case 'rejected':
      return '거절됨';
    case 'withdrawn':
      return '취소됨';
    default:
      return '검토 중';
    }
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
          지원자 관리
        </h1>
        <p className="text-gray-600">
          지원자 현황을 확인하고 관리하세요.
        </p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 지원자</p>
              <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">검토중</p>
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(app => app.status === 'reviewing').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">최종채용</p>
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(app => app.status === 'accepted').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">면접예정</p>
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(app => app.status === 'interview_scheduled').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">거절됨</p>
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(app => app.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">상태별 필터:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-resort-500 focus:border-resort-500"
          >
            <option value="all">전체</option>
            <option value="pending">지원완료</option>
            <option value="reviewing">검토중</option>
            <option value="interview_scheduled">면접예정</option>
            <option value="interview_completed">면접완료</option>
            <option value="offer_sent">채용제안</option>
            <option value="accepted">최종채용</option>
            <option value="rejected">거절됨</option>
            <option value="withdrawn">취소됨</option>
          </select>
          
          <label className="text-sm font-medium text-gray-700">근무타입별 필터:</label>
          <select
            value={selectedWorkTypeId}
            onChange={(e) => setSelectedWorkTypeId(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-resort-500 focus:border-resort-500"
          >
            <option value="all">전체 근무타입</option>
            {Array.from(new Set(applications.flatMap(app => app.selectedWorkTypeIds || []))).map(workTypeId => {
              const jobPost = jobPosts.find(post => 
                post.workTypes?.some(wt => wt.id === workTypeId),
              );
              const workType = jobPost?.workTypes?.find(wt => wt.id === workTypeId);
              return (
                <option key={workTypeId} value={workTypeId}>
                  {workType?.name || `근무타입 ${workTypeId}`}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* 지원자 목록 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">지원자 목록</h3>
        </div>
        
        {filteredApplications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">지원자가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">
              아직 지원자가 없거나 필터 조건에 맞는 지원자가 없습니다.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredApplications.map((application) => {
              const jobPost = jobPosts.find(post => post.id === application.jobPostId);
              return (
                <Link
                  key={application.id}
                  to={`/application-detail/${application.id}`}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{application.jobseekerName}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {getStatusText(application.status)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{jobPost?.title}</p>
                        
                        {/* 선택된 근무타입 표시 */}
                        {application.selectedWorkTypeIds && application.selectedWorkTypeIds.length > 0 && (
                          <div className="mb-2">
                            <div className="text-xs text-gray-500 mb-1">선택한 근무타입:</div>
                            <div className="flex flex-wrap gap-1">
                              {application.selectedWorkTypeIds.map((workTypeId) => {
                                const workType = jobPost?.workTypes?.find(wt => wt.id === workTypeId);
                                return (
                                  <span key={workTypeId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {workType?.name || `근무타입 ${workTypeId}`}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {application.message && (
                          <div className="bg-gray-50 rounded-md p-3 mb-3">
                            <p className="text-sm text-gray-700">{application.message}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <span>지원일: {formatDate(application.appliedAt, 'ko-KR')}</span>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex space-x-2">
                        {getNextStatusOptions(application.status).map((option) => (
                          <button
                            key={option.value}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleStatusChange(application.id, option.value);
                            }}
                            className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white ${option.color}`}
                          >
                            {option.value === 'rejected' ? (
                              <XCircle className="h-4 w-4 mr-1" />
                            ) : option.value === 'accepted' ? (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            ) : (
                              <Clock className="h-4 w-4 mr-1" />
                            )}
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications; 
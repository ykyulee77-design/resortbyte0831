import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Application, JobPost } from '../types';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter,
  Search,
  User,
  MessageSquare,
  FileText,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ApplicantManagementDashboardProps {
  jobPostId?: string;
}

const ApplicantManagementDashboard: React.FC<ApplicantManagementDashboardProps> = ({ jobPostId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'interview_completed' | 'accepted' | 'rejected'>('all');
  const [selectedJobPostId, setSelectedJobPostId] = useState<string>(jobPostId || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  // 통계 데이터는 filteredApplications 정의 후에 계산됩니다

  useEffect(() => {
    if (user?.uid) {
      loadApplications();
      loadJobPosts();
    }
  }, [user, jobPostId]);

  useEffect(() => {
    if (jobPostId) {
      setSelectedJobPostId(jobPostId);
    }
  }, [jobPostId]);

  const loadApplications = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const applicationsQuery = jobPostId 
        ? query(collection(db, 'applications'), where('jobPostId', '==', jobPostId))
        : query(collection(db, 'applications'), where('employerId', '==', user.uid));
      
      const snapshot = await getDocs(applicationsQuery);
      const fetchedApplications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Application));
      
      setApplications(fetchedApplications);
    } catch (error) {
      console.error('지원서 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobPosts = async () => {
    if (!user?.uid) return;
    
    try {
      const jobPostsQuery = query(collection(db, 'jobPosts'), where('employerId', '==', user.uid));
      const snapshot = await getDocs(jobPostsQuery);
      const fetchedJobPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as JobPost));
      
      setJobPosts(fetchedJobPosts);
    } catch (error) {
      console.error('공고 로딩 실패:', error);
    }
  };

  const handleInterviewNote = async (applicationId: string, interviewData: {
    note: string;
    contactInfo: string;
    interviewDate: string;
  }) => {
    try {
      await updateDoc(doc(db, 'applications', applicationId), {
        status: 'interview_completed',
        processStage: 'interviewed',
        employerFeedback: interviewData.note,
        interviewContactInfo: interviewData.contactInfo,
        interviewDate: interviewData.interviewDate,
        employerFeedbackAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      setShowInterviewModal(false);
      loadApplications();
      alert('면접 노트가 저장되었습니다.');
    } catch (error) {
      console.error('면접 노트 저장 실패:', error);
      alert('면접 노트 저장에 실패했습니다.');
    }
  };

  const handleHiringDecision = async (applicationId: string, decisionData: {
    decision: 'accepted' | 'rejected';
    hiringReason?: string;
    rejectionReason?: string;
    offerDetails?: {
      salary: string;
      startDate: string;
      benefits: string;
    };
  }) => {
    try {
      const feedback = decisionData.decision === 'accepted' 
        ? `[채용 확정] ${decisionData.hiringReason}`
        : `[채용 거절] ${decisionData.rejectionReason}`;

      await updateDoc(doc(db, 'applications', applicationId), {
        status: decisionData.decision,
        processStage: 'decision_made',
        employerFeedback: feedback,
        employerFeedbackAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      setShowDecisionModal(false);
      loadApplications();
      alert(`채용이 ${decisionData.decision === 'accepted' ? '확정' : '거절'}되었습니다.`);
    } catch (error) {
      console.error('채용 결정 저장 실패:', error);
      alert('채용 결정 저장에 실패했습니다.');
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '검토중';
      case 'interview_completed': return '면접 완료';
      case 'accepted': return '채용 확정';
      case 'rejected': return '채용 거절';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'interview_completed': return 'bg-purple-100 text-purple-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesJobPost = selectedJobPostId === 'all' || app.jobPostId === selectedJobPostId;
    const matchesSearch = searchTerm === '' || 
      app.jobseekerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesJobPost && matchesSearch;
  });

  // 통계 데이터 - 필터링된 결과 기준
  const stats = {
    total: filteredApplications.length,
    pending: filteredApplications.filter(app => app.status === 'pending').length,
    interviewed: filteredApplications.filter(app => app.status === 'interview_completed').length,
    accepted: filteredApplications.filter(app => app.status === 'accepted').length,
    rejected: filteredApplications.filter(app => app.status === 'rejected').length,
    other: filteredApplications.filter(app => 
      !['pending', 'interview_completed', 'accepted', 'rejected'].includes(app.status)
    ).length,
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">지원자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">지원자 관리</h1>
        <p className="text-gray-600 mt-2">검토중 → 면접 → 채용 확정/거절의 간단한 프로세스로 지원자를 관리하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">전체</p>
              <p className="text-lg font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">검토중</p>
              <p className="text-lg font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">면접 완료</p>
              <p className="text-lg font-bold text-gray-900">{stats.interviewed}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">채용 확정</p>
              <p className="text-lg font-bold text-gray-900">{stats.accepted}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">채용 거절</p>
              <p className="text-lg font-bold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">기타</p>
              <p className="text-lg font-bold text-gray-900">{stats.other}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="지원자명 또는 직무 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">전체 상태</option>
              <option value="pending">검토중</option>
              <option value="interview_completed">면접 완료</option>
              <option value="accepted">채용 확정</option>
              <option value="rejected">채용 거절</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedJobPostId}
              onChange={(e) => setSelectedJobPostId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">전체 공고</option>
              {jobPosts.map((jobPost) => (
                <option key={jobPost.id} value={jobPost.id}>
                  {jobPost.title}
                </option>
              ))}
            </select>
          </div>
          
          <div className="text-right">
            <span className="text-sm text-gray-600">
              {filteredApplications.length}개 중 {applications.length}개
            </span>
          </div>
        </div>
      </div>

      {/* 지원자 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">지원자 목록</h2>
        </div>
        
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filter !== 'all' ? '검색 결과가 없습니다' : '지원자가 없습니다'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || filter !== 'all' 
                ? '다른 검색어나 필터를 시도해보세요'
                : '새로운 지원자가 나타나면 여기에 표시됩니다'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredApplications.map((application) => (
              <div
                key={application.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors flex-1"
                    onClick={() => {
                      // 진행 상태에 따라 다른 페이지로 이동
                      if (application.status === 'accepted') {
                        // 채용 확정된 경우 최종 채용 페이지로 이동
                        navigate(`/final-hiring/${application.id}`);
                      } else {
                        // 그 외의 경우 일반 지원서 상세 페이지로 이동
                        navigate(`/application-detail/${application.id}`);
                      }
                    }}
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">
                        {application.jobseekerName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {application.jobTitle} • {application.location}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>지원일: {application.appliedAt instanceof Date ? application.appliedAt.toLocaleDateString() : '날짜 정보 없음'}</span>
                        <span>희망시급: {application.hourlyWage?.toLocaleString()}원</span>
                        {application.phone && (
                          <span>
                            연락처: 
                            <a 
                              href={`tel:${application.phone}`}
                              className="text-blue-600 hover:text-blue-800 underline ml-1"
                            >
                              {application.phone}
                            </a>
                          </span>
                        )}
                        {application.email && (
                          <span>
                            이메일: 
                            <a 
                              href={`mailto:${application.email}`}
                              className="text-blue-600 hover:text-blue-800 underline ml-1"
                            >
                              {application.email}
                            </a>
                          </span>
                        )}
                      </div>
                      {application.employerFeedback && (
                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <div><strong>면접 노트:</strong> {application.employerFeedback}</div>
                          {application.interviewContactInfo && (
                            <div>
                              <strong>연락처:</strong> 
                              {application.interviewContactInfo.includes('@') ? (
                                <a 
                                  href={`mailto:${application.interviewContactInfo}`}
                                  className="text-blue-600 hover:text-blue-800 underline ml-1"
                                >
                                  {application.interviewContactInfo}
                                </a>
                              ) : (
                                <a 
                                  href={`tel:${application.interviewContactInfo}`}
                                  className="text-blue-600 hover:text-blue-800 underline ml-1"
                                >
                                  {application.interviewContactInfo}
                                </a>
                              )}
                            </div>
                          )}
                          {application.interviewDate && (
                            <div><strong>면접일자:</strong> {application.interviewDate}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {getStatusText(application.status)}
                    </span>
                    
                    <div className="flex gap-2">
                      {application.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowInterviewModal(true);
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                          title="면접 노트 작성"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      )}
                      
                      {application.status === 'interview_completed' && (
                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowDecisionModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="채용 결정"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      {application.status === 'accepted' && (
                        <button
                          onClick={() => {
                            navigate(`/final-hiring/${application.id}`);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="최종 채용 페이지"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* 면접 노트 모달 */}
      {showInterviewModal && selectedApplication && (
        <InterviewNoteModal
          application={selectedApplication}
          onClose={() => setShowInterviewModal(false)}
          onSubmit={handleInterviewNote}
        />
      )}

      {/* 채용 결정 모달 */}
      {showDecisionModal && selectedApplication && (
        <HiringDecisionModal
          application={selectedApplication}
          onClose={() => setShowDecisionModal(false)}
          onSubmit={handleHiringDecision}
        />
      )}
    </div>
  );
};

// 면접 노트 모달 컴포넌트
const InterviewNoteModal: React.FC<{
  application: Application;
  onClose: () => void;
  onSubmit: (applicationId: string, interviewData: {
    note: string;
    contactInfo: string;
    interviewDate: string;
  }) => Promise<void>;
}> = ({ application, onClose, onSubmit }) => {
  const [interviewNote, setInterviewNote] = useState(application.employerFeedback || '');
  const [contactInfo, setContactInfo] = useState(() => {
    // 구직자 지원서에서 연락처 정보 자동 추출
    // 기존 면접 노트에 저장된 연락처가 있으면 우선 사용
    if (application.interviewContactInfo) return application.interviewContactInfo;
    // 지원서에서 연락처 정보 추출
    if (application.phone) return application.phone;
    if (application.email) return application.email;
    return '';
  });
  const [interviewDate, setInterviewDate] = useState(application.interviewDate || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(application.id, {
      note: interviewNote,
      contactInfo: contactInfo,
      interviewDate: interviewDate,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">면접 노트 - {application.jobseekerName}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              구직자 연락처 
              <span className="text-xs text-gray-500 ml-1">(지원서에서 자동 추출)</span>
            </label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="전화번호 또는 이메일"
            />
            {!contactInfo && (
              <p className="text-xs text-red-500 mt-1">
                지원서에 연락처 정보가 없습니다. 수동으로 입력해주세요.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">면접일자</label>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">면접 노트</label>
            <textarea
              value={interviewNote}
              onChange={(e) => setInterviewNote(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="면접 내용, 평가, 인상 등을 자유롭게 작성해주세요..."
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 채용 결정 모달 컴포넌트
const HiringDecisionModal: React.FC<{
  application: Application;
  onClose: () => void;
  onSubmit: (applicationId: string, decisionData: {
    decision: 'accepted' | 'rejected';
    hiringReason?: string;
    rejectionReason?: string;
    offerDetails?: {
      salary: string;
      startDate: string;
      benefits: string;
    };
  }) => Promise<void>;
}> = ({ application, onClose, onSubmit }) => {
  const [decision, setDecision] = useState<'accepted' | 'rejected'>('accepted');
  const [hiringReason, setHiringReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [offerDetails, setOfferDetails] = useState({
    salary: '',
    startDate: '',
    benefits: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(application.id, {
      decision,
      hiringReason: decision === 'accepted' ? hiringReason : undefined,
      rejectionReason: decision === 'rejected' ? rejectionReason : undefined,
      offerDetails: decision === 'accepted' ? offerDetails : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">채용 결정 - {application.jobseekerName}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">채용 결정</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="accepted"
                  checked={decision === 'accepted'}
                  onChange={(e) => setDecision(e.target.value as 'accepted' | 'rejected')}
                  className="mr-2"
                />
                <span className="text-green-700 font-medium">채용 확정</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="rejected"
                  checked={decision === 'rejected'}
                  onChange={(e) => setDecision(e.target.value as 'accepted' | 'rejected')}
                  className="mr-2"
                />
                <span className="text-red-700 font-medium">채용 거절</span>
              </label>
            </div>
          </div>

          {/* 채용 확정 시 */}
          {decision === 'accepted' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  채용 확정 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={hiringReason}
                  onChange={(e) => setHiringReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="면접 내용을 바탕으로 한 채용 확정 사유를 작성해주세요..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제안 급여</label>
                  <input
                    type="text"
                    value={offerDetails.salary}
                    onChange={(e) => setOfferDetails(prev => ({ ...prev, salary: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="예: 15,000원/시간"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">근무 시작일</label>
                  <input
                    type="date"
                    value={offerDetails.startDate}
                    onChange={(e) => setOfferDetails(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">복리후생</label>
                <textarea
                  value={offerDetails.benefits}
                  onChange={(e) => setOfferDetails(prev => ({ ...prev, benefits: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="제공되는 복리후생을 작성해주세요..."
                />
              </div>
            </div>
          )}

          {/* 채용 거절 시 */}
          {decision === 'rejected' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                거절 사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="면접 내용을 바탕으로 한 거절 사유를 작성해주세요..."
                required
              />
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={(decision === 'accepted' && !hiringReason) || (decision === 'rejected' && !rejectionReason)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              결정 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



export default ApplicantManagementDashboard;

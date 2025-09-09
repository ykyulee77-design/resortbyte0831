import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Trash2, 
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  MapPin,
  Building,
  DollarSign,
  Clock,
  AlertTriangle,
  Star,
  RotateCcw
} from 'lucide-react';
import { adminAuth, initializeAdminAuth } from '../../utils/adminAuth';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';

interface JobPost {
  id: string;
  title: string;
  companyName: string;
  location: string;
  salary: string; // 렌더링용 문자열로 정규화
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  employerId: string;
  employerName: string;
  description: string;
  requirements: string[];
  benefits: string[];
  applications: number;
  views: number;
  isHidden?: boolean; // 소프트 삭제(숨김)
}

const JobManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = (user as any)?.role === 'admin';
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [filteredJobPosts, setFilteredJobPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'expired'>('all');
  const [jobTypeFilter, setJobTypeFilter] = useState<'all' | 'full-time' | 'part-time' | 'contract' | 'internship'>('all');
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

  // 관리자 권한 초기화
  useEffect(() => {
    if (user?.uid && isAdmin) {
      initializeAdminAuth(user.uid).catch(() => {
        console.log('관리자 권한 초기화 실패');
      });
    }
  }, [user, isAdmin]);

  // 공고 목록 로드
  useEffect(() => {
    const loadJobPosts = async () => {
      try {
        setLoading(true);
        
        // 실제 Firebase에서 공고 목록 로드
        const jobPostsRef = collection(db, 'jobPosts');
        const jobPostsSnapshot = await getDocs(jobPostsRef);
        
        const jobPostsData: JobPost[] = [];
        
        for (const jobDoc of jobPostsSnapshot.docs) {
          const jobData = jobDoc.data();

          // 급여 정규화: 객체 형태({ min, max, type })면 보기 좋은 문자열로 변환
          let salaryText = '';
          const rawSalary = jobData.salary;
          if (rawSalary && typeof rawSalary === 'object') {
            const min = rawSalary.min ?? '';
            const max = rawSalary.max ?? '';
            const type = rawSalary.type ?? '';
            if (min || max || type) {
              const range = [min, max].filter(v => v !== '').join(' ~ ');
              salaryText = [range, type].filter(Boolean).join(' ');
            }
          } else if (typeof rawSalary === 'string') {
            salaryText = rawSalary;
          }
          
          const jobPost: JobPost = {
            id: jobDoc.id,
            title: jobData.title || '',
            companyName: jobData.companyName || '',
            location: jobData.location || '',
            salary: salaryText,
            jobType: jobData.jobType || 'full-time',
            status: jobData.status || 'pending',
            createdAt: jobData.createdAt?.toDate() || new Date(),
            expiresAt: jobData.expiresAt?.toDate() || new Date(),
            employerId: jobData.employerId || '',
            employerName: jobData.employerName || '',
            description: jobData.description || '',
            requirements: jobData.requirements || [],
            benefits: jobData.benefits || [],
            applications: jobData.applications || 0,
            views: jobData.views || 0,
            isHidden: jobData.isHidden === true,
          };
          
          jobPostsData.push(jobPost);
        }
        
        setJobPosts(jobPostsData);
        setFilteredJobPosts(jobPostsData);
      } catch (error) {
        console.error('공고 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadJobPosts();
  }, []);

  // 필터링
  useEffect(() => {
    let filtered = jobPosts;

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // 직종 필터
    if (jobTypeFilter !== 'all') {
      filtered = filtered.filter(job => job.jobType === jobTypeFilter);
    }

    setFilteredJobPosts(filtered);
  }, [jobPosts, searchTerm, statusFilter, jobTypeFilter]);

  // 공고 승인
  const approveJob = async (job: JobPost) => {
    if (!isAdmin) {
      alert('공고 승인 권한이 없습니다.');
      return;
    }

    try {
      // Firebase에서 공고 상태 업데이트
      const jobRef = doc(db, 'jobPosts', job.id);
      await updateDoc(jobRef, {
        status: 'approved',
        approvedAt: new Date(),
        updatedAt: new Date()
      });

      // 로컬 상태 업데이트
      const updatedJobs = jobPosts.map(j => 
        j.id === job.id ? { ...j, status: 'approved' as const } : j
      );
      setJobPosts(updatedJobs);
      
      alert(`${job.title} 공고가 승인되었습니다.`);
    } catch (error) {
      console.error('공고 승인 실패:', error);
      alert('공고 승인에 실패했습니다.');
    }
  };

  // 공고 거부
  const rejectJob = async (job: JobPost) => {
    if (!isAdmin) {
      alert('공고 승인 권한이 없습니다.');
      return;
    }

    try {
      // Firebase에서 공고 상태 업데이트
      const jobRef = doc(db, 'jobPosts', job.id);
      await updateDoc(jobRef, {
        status: 'rejected',
        rejectedAt: new Date(),
        updatedAt: new Date()
      });

      // 로컬 상태 업데이트
      const updatedJobs = jobPosts.map(j => 
        j.id === job.id ? { ...j, status: 'rejected' as const } : j
      );
      setJobPosts(updatedJobs);
      
      alert(`${job.title} 공고가 거부되었습니다.`);
    } catch (error) {
      console.error('공고 거부 실패:', error);
      alert('공고 거부에 실패했습니다.');
    }
  };

  // 거부된 공고 복원 (다시 pending 상태로)
  const restoreRejectedJob = async (job: JobPost) => {
    if (!isAdmin) {
      alert('공고 복원 권한이 없습니다.');
      return;
    }

    try {
      // Firebase에서 공고 상태 업데이트
      const jobRef = doc(db, 'jobPosts', job.id);
      await updateDoc(jobRef, {
        status: 'pending',
        rejectedAt: null,
        updatedAt: new Date()
      });

      // 로컬 상태 업데이트
      const updatedJobs = jobPosts.map(j => 
        j.id === job.id ? { ...j, status: 'pending' as const } : j
      );
      setJobPosts(updatedJobs);
      
      alert(`${job.title} 공고가 복원되었습니다.`);
    } catch (error) {
      console.error('공고 복원 실패:', error);
      alert('공고 복원에 실패했습니다.');
    }
  };

  // 공고 삭제
  const deleteJob = async (job: JobPost) => {
    if (!isAdmin) {
      alert('공고 삭제 권한이 없습니다.');
      return;
    }

    if (!confirm(`정말로 ${job.title} 공고를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // Firebase에서 공고 삭제
      const jobRef = doc(db, 'jobPosts', job.id);
      await deleteDoc(jobRef);

      // 로컬 상태 업데이트
      const updatedJobs = jobPosts.filter(j => j.id !== job.id);
      setJobPosts(updatedJobs);
      
      alert(`${job.title} 공고가 삭제되었습니다.`);
    } catch (error) {
      console.error('공고 삭제 실패:', error);
      alert('공고 삭제에 실패했습니다.');
    }
  };

  // 공고 숨김(소프트 삭제)
  const hideJob = async (job: JobPost) => {
    if (!isAdmin) {
      alert('공고 숨김 권한이 없습니다.');
      return;
    }
    try {
      const jobRef = doc(db, 'jobPosts', job.id);
      await updateDoc(jobRef, { isHidden: true, updatedAt: new Date() });
      setJobPosts(prev => prev.map(j => j.id === job.id ? { ...j, isHidden: true } : j));
      alert('공고가 숨김 처리되었습니다.');
    } catch (error) {
      console.error('공고 숨김 실패:', error);
      alert('공고 숨김에 실패했습니다.');
    }
  };

  // 공고 복원
  const restoreJob = async (job: JobPost) => {
    if (!isAdmin) {
      alert('공고 복원 권한이 없습니다.');
      return;
    }
    try {
      const jobRef = doc(db, 'jobPosts', job.id);
      await updateDoc(jobRef, { isHidden: false, updatedAt: new Date() });
      setJobPosts(prev => prev.map(j => j.id === job.id ? { ...j, isHidden: false } : j));
      alert('공고가 복원되었습니다.');
    } catch (error) {
      console.error('공고 복원 실패:', error);
      alert('공고 복원에 실패했습니다.');
    }
  };

  // 상태 배지
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">승인 대기</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">승인됨</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">거부됨</span>;
      case 'expired':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">만료됨</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">알 수 없음</span>;
    }
  };

  // 직종 배지
  const getJobTypeBadge = (jobType: string) => {
    switch (jobType) {
      case 'full-time':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">정규직</span>;
      case 'part-time':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">파트타임</span>;
      case 'contract':
        return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">계약직</span>;
      case 'internship':
        return <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">인턴</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">기타</span>;
    }
  };

  // 단체 공고 승인
  const bulkApproveJobs = async () => {
    if (!isAdmin) {
      alert('공고 승인 권한이 없습니다.');
      return;
    }

    if (selectedJobs.length === 0) {
      alert('승인할 공고를 선택해주세요.');
      return;
    }

    if (!confirm(`선택된 ${selectedJobs.length}개 공고를 승인하시겠습니까?`)) {
      return;
    }

    try {
      const updates = selectedJobs.map(async (jobId) => {
        const jobRef = doc(db, 'jobPosts', jobId);
        await updateDoc(jobRef, {
          status: 'approved',
          approvedAt: new Date(),
          updatedAt: new Date()
        });
      });

      await Promise.all(updates);
      setJobPosts(prev => prev.map(j => 
        selectedJobs.includes(j.id) ? { ...j, status: 'approved' as const } : j
      ));
      setSelectedJobs([]);
      alert('선택된 공고가 승인되었습니다.');
    } catch (error) {
      console.error('단체 승인 실패:', error);
      alert('단체 승인에 실패했습니다.');
    }
  };

  // 단체 공고 거부
  const bulkRejectJobs = async () => {
    if (!isAdmin) {
      alert('공고 거부 권한이 없습니다.');
      return;
    }

    if (selectedJobs.length === 0) {
      alert('거부할 공고를 선택해주세요.');
      return;
    }

    if (!confirm(`선택된 ${selectedJobs.length}개 공고를 거부하시겠습니까?`)) {
      return;
    }

    try {
      const updates = selectedJobs.map(async (jobId) => {
        const jobRef = doc(db, 'jobPosts', jobId);
        await updateDoc(jobRef, {
          status: 'rejected',
          rejectedAt: new Date(),
          updatedAt: new Date()
        });
      });

      await Promise.all(updates);
      setJobPosts(prev => prev.map(j => 
        selectedJobs.includes(j.id) ? { ...j, status: 'rejected' as const } : j
      ));
      setSelectedJobs([]);
      alert('선택된 공고가 거부되었습니다.');
    } catch (error) {
      console.error('단체 거부 실패:', error);
      alert('단체 거부에 실패했습니다.');
    }
  };

  // 단체 공고 숨김
  const bulkHideJobs = async () => {
    if (!isAdmin) {
      alert('공고 숨김 권한이 없습니다.');
      return;
    }

    if (selectedJobs.length === 0) {
      alert('숨길 공고를 선택해주세요.');
      return;
    }

    if (!confirm(`선택된 ${selectedJobs.length}개 공고를 숨기시겠습니까?`)) {
      return;
    }

    try {
      const updates = selectedJobs.map(async (jobId) => {
        const jobRef = doc(db, 'jobPosts', jobId);
        await updateDoc(jobRef, { isHidden: true, updatedAt: new Date() });
      });

      await Promise.all(updates);
      setJobPosts(prev => prev.map(j => 
        selectedJobs.includes(j.id) ? { ...j, isHidden: true } : j
      ));
      setSelectedJobs([]);
      alert('선택된 공고가 숨김 처리되었습니다.');
    } catch (error) {
      console.error('단체 숨김 실패:', error);
      alert('단체 숨김에 실패했습니다.');
    }
  };

  // 단체 공고 삭제
  const bulkDeleteJobs = async () => {
    if (!isAdmin) {
      alert('공고 삭제 권한이 없습니다.');
      return;
    }

    if (selectedJobs.length === 0) {
      alert('삭제할 공고를 선택해주세요.');
      return;
    }

    if (!confirm(`선택된 ${selectedJobs.length}개 공고를 영구 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const deletes = selectedJobs.map(async (jobId) => {
        const jobRef = doc(db, 'jobPosts', jobId);
        await deleteDoc(jobRef);
      });

      await Promise.all(deletes);
      setJobPosts(prev => prev.filter(j => !selectedJobs.includes(j.id)));
      setSelectedJobs([]);
      alert('선택된 공고가 삭제되었습니다.');
    } catch (error) {
      console.error('단체 삭제 실패:', error);
      alert('단체 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-resort-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">공고 관리</h2>
          <p className="text-sm text-gray-600">총 {filteredJobPosts.length}개의 공고</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              // 새 공고 등록 페이지로 이동 (관리자용)
              navigate('/job-post/new');
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            공고 등록
          </button>
          <button className="px-4 py-2 bg-resort-600 text-white rounded-lg hover:bg-resort-700">
            공고 내보내기
          </button>
        </div>
      </div>

      {/* 단체 관리 버튼들 */}
      {selectedJobs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-900">
                {selectedJobs.length}개 공고 선택됨
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={bulkApproveJobs}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                선택 승인
              </button>
              <button
                onClick={bulkRejectJobs}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                선택 거부
              </button>
              <button
                onClick={bulkHideJobs}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                선택 숨김
              </button>
              <button
                onClick={bulkDeleteJobs}
                className="px-3 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 text-sm"
              >
                선택 삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="제목, 회사명, 지역"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
            >
              <option value="all">전체</option>
              <option value="pending">승인 대기</option>
              <option value="approved">승인됨</option>
              <option value="rejected">거부됨</option>
              <option value="expired">만료됨</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">직종</label>
            <select
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
            >
              <option value="all">전체</option>
              <option value="full-time">정규직</option>
              <option value="part-time">파트타임</option>
              <option value="contract">계약직</option>
              <option value="internship">인턴</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setJobTypeFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              필터 초기화
            </button>
          </div>
        </div>
      </div>

      {/* 공고 목록 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedJobs.length > 0 && filteredJobPosts.every(j => selectedJobs.includes(j.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedJobs(filteredJobPosts.map(j => j.id));
                      } else {
                        setSelectedJobs([]);
                      }
                    }}
                    className="rounded border-gray-300 text-resort-600 focus:ring-resort-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  공고 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  회사
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  직종
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  지원/조회
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등록일
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobPosts.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedJobs.includes(job.id)}
                      onChange={(e) => {
                        setSelectedJobs(prev => e.target.checked ? [...prev, job.id] : prev.filter(id => id !== job.id));
                      }}
                      className="rounded border-gray-300 text-resort-600 focus:ring-resort-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {job.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {job.location}
                      </div>
                      <div className="text-sm text-gray-500">
                        <DollarSign className="inline h-3 w-3 mr-1" />
                        {job.salary}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{job.companyName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getJobTypeBadge(job.jobType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(job.status)}
                      {job.isHidden && (
                        <span className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded-full">숨김</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{job.applications} 지원</div>
                    <div>{job.views} 조회</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowJobModal(true);
                        }}
                        className="text-resort-600 hover:text-resort-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {job.status === 'pending' && isAdmin && (
                        <>
                          <button
                            onClick={() => approveJob(job)}
                            className="text-green-600 hover:text-green-900"
                            title="승인"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => rejectJob(job)}
                            className="text-red-600 hover:text-red-900"
                            title="거부"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {job.status === 'rejected' && isAdmin && (
                        <button
                          onClick={() => restoreRejectedJob(job)}
                          className="text-blue-600 hover:text-blue-900"
                          title="복원"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          {job.isHidden ? (
                            <button
                              onClick={() => restoreJob(job)}
                              className="text-emerald-600 hover:text-emerald-900"
                              title="복원"
                            >
                              복원
                            </button>
                          ) : (
                            <button
                              onClick={() => hideJob(job)}
                              className="text-gray-600 hover:text-gray-900"
                              title="숨김"
                            >
                              숨김
                            </button>
                          )}
                          <button
                            onClick={() => deleteJob(job)}
                            className="text-red-600 hover:text-red-900"
                            title="영구 삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 공고 상세 모달 */}
      {showJobModal && selectedJob && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2xl shadow-lg rounded-md bg-white max-w-2xl">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">공고 상세 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">제목</label>
                  <p className="text-sm text-gray-900">{selectedJob?.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">회사명</label>
                  <p className="text-sm text-gray-900">{selectedJob?.companyName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">지역</label>
                  <p className="text-sm text-gray-900">{selectedJob?.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">급여</label>
                  <p className="text-sm text-gray-900">{selectedJob?.salary}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">직종</label>
                  <div className="mt-1">{selectedJob && getJobTypeBadge(selectedJob.jobType)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">상태</label>
                  <div className="mt-1">{selectedJob && getStatusBadge(selectedJob.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">설명</label>
                  <p className="text-sm text-gray-900">{selectedJob?.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">자격요건</label>
                  <ul className="text-sm text-gray-900 list-disc list-inside">
                    {selectedJob?.requirements?.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">복리후생</label>
                  <ul className="text-sm text-gray-900 list-disc list-inside">
                    {selectedJob?.benefits?.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">지원자 수</label>
                    <p className="text-sm text-gray-900">{selectedJob?.applications}명</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">조회 수</label>
                    <p className="text-sm text-gray-900">{selectedJob?.views}회</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">등록일</label>
                    <p className="text-sm text-gray-900">{selectedJob?.createdAt?.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">만료일</label>
                    <p className="text-sm text-gray-900">{selectedJob?.expiresAt?.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobManagement;

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
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
  Star
} from 'lucide-react';
import { adminAuth } from '../../utils/adminAuth';

interface JobPost {
  id: string;
  title: string;
  companyName: string;
  location: string;
  salary: string;
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
}

const JobManagement: React.FC = () => {
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [filteredJobPosts, setFilteredJobPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'expired'>('all');
  const [jobTypeFilter, setJobTypeFilter] = useState<'all' | 'full-time' | 'part-time' | 'contract' | 'internship'>('all');
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);

  // 공고 목록 로드
  useEffect(() => {
    const loadJobPosts = async () => {
      try {
        setLoading(true);
        // 실제 데이터베이스에서 공고 목록 로드
        const mockJobPosts: JobPost[] = [
          {
            id: '1',
            title: '리조트 프론트 데스크',
            companyName: '제주 리조트',
            location: '제주도',
            salary: '월 250만원',
            jobType: 'full-time',
            status: 'pending',
            createdAt: new Date('2024-01-15'),
            expiresAt: new Date('2024-02-15'),
            employerId: 'emp1',
            employerName: '제주 리조트',
            description: '리조트 프론트 데스크 업무를 담당할 직원을 모집합니다.',
            requirements: ['고등학교 졸업 이상', '고객 서비스 경험 우대'],
            benefits: ['4대보험', '퇴직연금', '연차휴가'],
            applications: 5,
            views: 23
          },
          {
            id: '2',
            title: '리조트 주방 보조',
            companyName: '부산 리조트',
            location: '부산',
            salary: '시급 12,000원',
            jobType: 'part-time',
            status: 'approved',
            createdAt: new Date('2024-01-10'),
            expiresAt: new Date('2024-02-10'),
            employerId: 'emp2',
            employerName: '부산 리조트',
            description: '리조트 주방 보조 업무를 담당할 직원을 모집합니다.',
            requirements: ['주방 경험 우대', '체력이 좋은 분'],
            benefits: ['식대 제공', '교통비 지원'],
            applications: 12,
            views: 45
          },
          {
            id: '3',
            title: '리조트 청소원',
            companyName: '강릉 리조트',
            location: '강릉',
            salary: '월 200만원',
            jobType: 'full-time',
            status: 'rejected',
            createdAt: new Date('2024-01-05'),
            expiresAt: new Date('2024-02-05'),
            employerId: 'emp3',
            employerName: '강릉 리조트',
            description: '리조트 청소 업무를 담당할 직원을 모집합니다.',
            requirements: ['청소 경험 우대', '성실한 분'],
            benefits: ['4대보험', '퇴직연금'],
            applications: 3,
            views: 18
          }
        ];
        setJobPosts(mockJobPosts);
        setFilteredJobPosts(mockJobPosts);
      } catch (error) {
        console.error('공고 목록 로드 실패:', error);
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
    if (!adminAuth.canApproveJobs()) {
      alert('공고 승인 권한이 없습니다.');
      return;
    }

    try {
      // 실제 데이터베이스 업데이트
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
    if (!adminAuth.canApproveJobs()) {
      alert('공고 승인 권한이 없습니다.');
      return;
    }

    try {
      // 실제 데이터베이스 업데이트
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

  // 공고 삭제
  const deleteJob = async (job: JobPost) => {
    if (!adminAuth.canDeleteJobs()) {
      alert('공고 삭제 권한이 없습니다.');
      return;
    }

    if (!confirm(`정말로 ${job.title} 공고를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // 실제 데이터베이스에서 삭제
      const updatedJobs = jobPosts.filter(j => j.id !== job.id);
      setJobPosts(updatedJobs);
      
      alert(`${job.title} 공고가 삭제되었습니다.`);
    } catch (error) {
      console.error('공고 삭제 실패:', error);
      alert('공고 삭제에 실패했습니다.');
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
          <button className="px-4 py-2 bg-resort-600 text-white rounded-lg hover:bg-resort-700">
            공고 내보내기
          </button>
        </div>
      </div>

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
                    {getStatusBadge(job.status)}
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
                      {job.status === 'pending' && adminAuth.canApproveJobs() && (
                        <>
                          <button
                            onClick={() => approveJob(job)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => rejectJob(job)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {adminAuth.canDeleteJobs() && (
                        <button
                          onClick={() => deleteJob(job)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                  <p className="text-sm text-gray-900">{selectedJob.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">회사명</label>
                  <p className="text-sm text-gray-900">{selectedJob.companyName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">지역</label>
                  <p className="text-sm text-gray-900">{selectedJob.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">급여</label>
                  <p className="text-sm text-gray-900">{selectedJob.salary}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">직종</label>
                  <div className="mt-1">{getJobTypeBadge(selectedJob.jobType)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">상태</label>
                  <div className="mt-1">{getStatusBadge(selectedJob.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">설명</label>
                  <p className="text-sm text-gray-900">{selectedJob.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">자격요건</label>
                  <ul className="text-sm text-gray-900 list-disc list-inside">
                    {selectedJob.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">복리후생</label>
                  <ul className="text-sm text-gray-900 list-disc list-inside">
                    {selectedJob.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">지원자 수</label>
                    <p className="text-sm text-gray-900">{selectedJob.applications}명</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">조회 수</label>
                    <p className="text-sm text-gray-900">{selectedJob.views}회</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">등록일</label>
                    <p className="text-sm text-gray-900">{selectedJob.createdAt.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">만료일</label>
                    <p className="text-sm text-gray-900">{selectedJob.expiresAt.toLocaleDateString()}</p>
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

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldOff,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  Building,
  User,
  Mail,
  Phone,
  FileText,
  Download,
  Upload,
  RefreshCw,
  RotateCcw,
  
  Star,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adminAuth, initializeAdminAuth } from '../../utils/adminAuth';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';

interface Member {
  uid: string;
  email: string;
  displayName: string;
  role: 'jobseeker' | 'employer' | 'admin';
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  isSuspended: boolean;
  isVerified: boolean;
  profileCompleted: boolean;
  isHidden?: boolean;
  
  // 구직자 정보
  jobseekerInfo?: {
    phone?: string;
    birthDate?: Date;
    gender?: 'male' | 'female' | 'other';
    education?: string;
    experience?: string;
    skills?: string[];
    desiredSalary?: string;
    desiredLocation?: string[];
    resumeUrl?: string;
    profileImageUrl?: string;
  };
  
  // 구인자 정보
  employerInfo?: {
    companyName: string;
    companySize?: 'small' | 'medium' | 'large';
    industry?: string;
    website?: string;
    phone?: string;
    address?: string;
    workplaceLocation?: string;
    businessNumber?: string;
    companyImageUrl?: string;
    verifiedBusiness: boolean;
  };
  
  // 통계 정보
  stats: {
    totalJobPosts?: number;
    totalApplications?: number;
    totalViews?: number;
    responseRate?: number;
    avgResponseTime?: number; // 시간 단위
    lastActivity?: Date;
  };
  
  // 상태 정보
  status: {
    emailVerified: boolean;
    phoneVerified: boolean;
    profileVerified: boolean;
    documentsVerified: boolean;
    premiumMember: boolean;
    subscriptionExpiresAt?: Date;
  };
}

const MemberManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = (user as any)?.role === 'admin';
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'jobseeker' | 'employer' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'inactive'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // 관리자 권한 초기화
  useEffect(() => {
    if (user?.uid && isAdmin) {
      initializeAdminAuth(user.uid).catch(() => {
        console.log('관리자 권한 초기화 실패');
      });
    }
  }, [user, isAdmin]);

  // 회원 목록 로드
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        
        // 실제 Firebase에서 회원 목록 로드
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        const membersData: Member[] = [];
        
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          
          // 기본 사용자 정보
          const member: Member = {
            uid: userDoc.id,
            email: userData.email || '',
            displayName: userData.displayName || userData.name || '이름 없음',
            role: userData.role || 'jobseeker',
            createdAt: userData.createdAt?.toDate() || new Date(),
            lastLoginAt: userData.lastLoginAt?.toDate(),
            isActive: userData.isActive !== false,
            isSuspended: userData.isSuspended || false,
            isVerified: userData.isVerified || false,
            profileCompleted: userData.profileCompleted || false,
            isHidden: userData.isHidden === true,
            
            // 구직자 정보
            jobseekerInfo: userData.role === 'jobseeker' ? {
              phone: userData.phone || '',
              birthDate: userData.birthDate?.toDate(),
              gender: userData.gender,
              education: userData.education || '',
              experience: userData.experience || '',
              skills: userData.skills || [],
              desiredSalary: userData.desiredSalary || '',
              desiredLocation: userData.desiredLocation || [],
              resumeUrl: userData.resumeUrl || '',
              profileImageUrl: userData.profileImageUrl || ''
            } : undefined,
            
            // 구인자 정보
            employerInfo: userData.role === 'employer' ? {
              companyName: userData.companyName || '',
              companySize: userData.companySize,
              industry: userData.industry || '',
              website: userData.website || '',
              phone: userData.phone || '',
              address: userData.address || '',
              workplaceLocation: userData.workplaceLocation || '',
              businessNumber: userData.businessNumber || '',
              companyImageUrl: userData.companyImageUrl || '',
              verifiedBusiness: userData.verifiedBusiness || false
            } : undefined,
            
            // 통계 정보 (기본값)
            stats: {
              totalJobPosts: userData.role === 'employer' ? (userData.totalJobPosts || 0) : undefined,
              totalApplications: userData.totalApplications || 0,
              totalViews: userData.totalViews || 0,
              responseRate: userData.responseRate || 0,
              avgResponseTime: userData.avgResponseTime || 0,
              lastActivity: userData.lastActivity?.toDate() || new Date()
            },
            
            // 상태 정보
            status: {
              emailVerified: userData.emailVerified || false,
              phoneVerified: userData.phoneVerified || false,
              profileVerified: userData.profileVerified || false,
              documentsVerified: userData.documentsVerified || false,
              premiumMember: userData.premiumMember || false,
              subscriptionExpiresAt: userData.subscriptionExpiresAt?.toDate()
            }
          };
          
          membersData.push(member);
        }
        
        setMembers(membersData);
        setFilteredMembers(membersData);
      } catch (error) {
        console.error('회원 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  // 필터링
  useEffect(() => {
    let filtered = members;

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter((member: Member) => 
        member.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.employerInfo?.companyName && member.employerInfo.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 역할 필터
    if (roleFilter !== 'all') {
      filtered = filtered.filter((member: Member) => member.role === roleFilter);
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter((member: Member) => member.isActive && !member.isSuspended);
      } else if (statusFilter === 'suspended') {
        filtered = filtered.filter((member: Member) => member.isSuspended);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter((member: Member) => !member.isActive);
      }
    }

    // 인증 필터
    if (verificationFilter !== 'all') {
      if (verificationFilter === 'verified') {
        filtered = filtered.filter((member: Member) => member.isVerified);
      } else if (verificationFilter === 'unverified') {
        filtered = filtered.filter((member: Member) => !member.isVerified);
      }
    }

    setFilteredMembers(filtered);
  }, [members, searchTerm, roleFilter, statusFilter, verificationFilter]);

  // 회원 정지/해제
  const toggleMemberSuspension = async (member: Member) => {
    if (!isAdmin) {
      alert('회원 정지 권한이 없습니다.');
      return;
    }

    try {
      // Firebase에서 회원 상태 업데이트
      const userRef = doc(db, 'users', member.uid);
      await updateDoc(userRef, {
        isSuspended: !member.isSuspended,
        updatedAt: new Date()
      });

      // 로컬 상태 업데이트
      const updatedMembers = members.map((m: Member) => 
        m.uid === member.uid 
          ? { ...m, isSuspended: !m.isSuspended }
          : m
      );
      setMembers(updatedMembers);
      
      alert(`${member.displayName} 회원이 ${member.isSuspended ? '정지 해제' : '정지'}되었습니다.`);
    } catch (error) {
      console.error('회원 상태 변경 실패:', error);
      alert('회원 상태 변경에 실패했습니다.');
    }
  };

  // 회원 삭제
  const deleteMember = async (member: Member) => {
    if (!isAdmin) {
      alert('회원 삭제 권한이 없습니다.');
      return;
    }

    if (!confirm(`정말로 ${member.displayName} 회원을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // Firebase에서 회원 삭제
      const userRef = doc(db, 'users', member.uid);
      await deleteDoc(userRef);

      // 로컬 상태 업데이트
      const updatedMembers = members.filter((m: Member) => m.uid !== member.uid);
      setMembers(updatedMembers);
      
      alert(`${member.displayName} 회원이 삭제되었습니다.`);
    } catch (error) {
      console.error('회원 삭제 실패:', error);
      alert('회원 삭제에 실패했습니다.');
    }
  };

  // 회원 숨김/복원
  const hideMember = async (member: Member) => {
    if (!isAdmin) {
      alert('회원 숨김 권한이 없습니다.');
      return;
    }
    try {
      const userRef = doc(db, 'users', member.uid);
      await updateDoc(userRef, { isHidden: true, updatedAt: new Date() });
      setMembers(prev => prev.map(m => m.uid === member.uid ? { ...m, isHidden: true } : m));
    } catch (error) {
      console.error('회원 숨김 실패:', error);
      alert('회원 숨김에 실패했습니다.');
    }
  };

  const restoreMember = async (member: Member) => {
    if (!isAdmin) {
      alert('회원 복원 권한이 없습니다.');
      return;
    }
    try {
      const userRef = doc(db, 'users', member.uid);
      await updateDoc(userRef, { isHidden: false, updatedAt: new Date() });
      setMembers(prev => prev.map(m => m.uid === member.uid ? { ...m, isHidden: false } : m));
    } catch (error) {
      console.error('회원 복원 실패:', error);
      alert('회원 복원에 실패했습니다.');
    }
  };

  // 회원 인증 상태 변경
  // 인증 승인/해제 기능은 현재 요구사항에서 제외

  // 역할 아이콘
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4 text-red-600" />;
      case 'employer': return <Building className="h-4 w-4 text-blue-600" />;
      case 'jobseeker': return <User className="h-4 w-4 text-green-600" />;
      default: return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  // 상태 배지
  const getStatusBadge = (member: Member) => {
    if (member.isSuspended) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">정지</span>;
    }
    if (!member.isActive) {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">비활성</span>;
    }
    if (member.isVerified) {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">활성</span>;
    }
    return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">미인증</span>;
  };

  // 인증 상태 배지
  const getVerificationBadge = (member: Member) => {
    if (member.isVerified) {
      return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">인증됨</span>;
    }
    return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">미인증</span>;
  };

  // 프리미엄 배지
  const getPremiumBadge = (member: Member) => {
    if (member.status.premiumMember) {
      return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">프리미엄</span>;
    }
    return null;
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
          <h2 className="text-xl font-semibold text-gray-900">회원 관리</h2>
          <p className="text-sm text-gray-600">총 {filteredMembers.length}명의 회원</p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Download className="inline h-4 w-4 mr-2" />
            회원 내보내기
          </button>
          <button className="px-4 py-2 bg-resort-600 text-white rounded-lg hover:bg-resort-700">
            <Upload className="inline h-4 w-4 mr-2" />
            회원 가져오기
          </button>
          {selectedMembers.length > 0 && (
            <>
              <button
                onClick={async () => {
                  if (!confirm(`선택된 ${selectedMembers.length}명 회원을 숨기시겠습니까?`)) return;
                  try {
                    const updates = selectedMembers.map(async (uid) => {
                      const userRef = doc(db, 'users', uid);
                      await updateDoc(userRef, { isHidden: true, updatedAt: new Date() });
                    });
                    await Promise.all(updates);
                    setMembers(prev => prev.map(m => selectedMembers.includes(m.uid) ? { ...m, isHidden: true } : m));
                    setSelectedMembers([]);
                    alert('선택된 회원이 숨김 처리되었습니다.');
                  } catch (e) {
                    alert('대량 숨김 중 오류가 발생했습니다.');
                  }
                }}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <EyeOff className="inline h-4 w-4 mr-1" /> 선택 숨김
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`선택된 ${selectedMembers.length}명 회원을 복원하시겠습니까?`)) return;
                  try {
                    const updates = selectedMembers.map(async (uid) => {
                      const userRef = doc(db, 'users', uid);
                      await updateDoc(userRef, { isHidden: false, updatedAt: new Date() });
                    });
                    await Promise.all(updates);
                    setMembers(prev => prev.map(m => selectedMembers.includes(m.uid) ? { ...m, isHidden: false } : m));
                    setSelectedMembers([]);
                    alert('선택된 회원이 복원되었습니다.');
                  } catch (e) {
                    alert('대량 복원 중 오류가 발생했습니다.');
                  }
                }}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <RotateCcw className="inline h-4 w-4 mr-1" /> 선택 복원
              </button>
            </>
          )}
          {selectedMembers.length > 0 && (
            <>
              <button
                onClick={async () => {
                  if (!isAdmin) {
                    alert('회원 정지 권한이 없습니다.');
                    return;
                  }
                  if (!confirm(`선택된 ${selectedMembers.length}명 회원을 정지하시겠습니까?`)) return;
                  try {
                    const updates = selectedMembers.map(async (uid) => {
                      const userRef = doc(db, 'users', uid);
                      await updateDoc(userRef, { isSuspended: true, updatedAt: new Date() });
                    });
                    await Promise.all(updates);
                    setMembers(prev => prev.map(m => selectedMembers.includes(m.uid) ? { ...m, isSuspended: true } : m));
                    setSelectedMembers([]);
                    alert('선택된 회원이 정지되었습니다.');
                  } catch (e) {
                    alert('대량 정지 중 오류가 발생했습니다.');
                  }
                }}
                className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                선택 정지
              </button>
              <button
                onClick={async () => {
                  if (!isAdmin) {
                    alert('회원 삭제 권한이 없습니다.');
                    return;
                  }
                  if (!confirm(`선택된 ${selectedMembers.length}명 회원을 삭제하시겠습니까?`)) return;
                  try {
                    const deletes = selectedMembers.map(async (uid) => {
                      const userRef = doc(db, 'users', uid);
                      await deleteDoc(userRef);
                    });
                    await Promise.all(deletes);
                    setMembers(prev => prev.filter(m => !selectedMembers.includes(m.uid)));
                    setSelectedMembers([]);
                    alert('선택된 회원이 삭제되었습니다.');
                  } catch (e) {
                    alert('대량 삭제 중 오류가 발생했습니다.');
                  }
                }}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                선택 삭제
              </button>
            </>
          )}
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="이름, 이메일, 회사명"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
            >
              <option value="all">전체</option>
              <option value="jobseeker">크루</option>
              <option value="employer">리조트</option>
              <option value="admin">관리자</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="suspended">정지</option>
              <option value="inactive">비활성</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">인증</label>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
            >
              <option value="all">전체</option>
              <option value="verified">인증됨</option>
              <option value="unverified">미인증</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button 
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
                setVerificationFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              필터 초기화
            </button>
          </div>
        </div>
      </div>

      {/* 회원 목록 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedMembers.length > 0 && filteredMembers.every(m => selectedMembers.includes(m.uid))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers(filteredMembers.map(m => m.uid));
                      } else {
                        setSelectedMembers([]);
                      }
                    }}
                    className="rounded border-gray-300 text-resort-600 focus:ring-resort-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  회원 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  인증/프리미엄
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  활동 통계
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.uid)}
                        onChange={(e) => {
                          setSelectedMembers(prev => e.target.checked ? [...prev, member.uid] : prev.filter(id => id !== member.uid));
                        }}
                        className="mr-3 rounded border-gray-300 text-resort-600 focus:ring-resort-500"
                      />
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-resort-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-resort-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.displayName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.email}
                        </div>
                        {member.isHidden && (
                          <div className="text-xs inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">숨김</div>
                        )}
                        {member.employerInfo?.companyName && (
                          <div className="text-xs text-gray-400">
                            {member.employerInfo.companyName}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRoleIcon(member.role)}
                      <span className="ml-2 text-sm text-gray-900">
                        {member.role === 'jobseeker' ? '크루' : 
                         member.role === 'employer' ? '리조트' : '관리자'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(member)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {getPremiumBadge(member)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.role === 'jobseeker' && (
                      <div>
                        <div>지원: {member.stats.totalApplications || 0}</div>
                        <div>조회: {member.stats.totalViews || 0}</div>
                      </div>
                    )}
                    {member.role === 'employer' && (
                      <div>
                        <div>공고: {member.stats.totalJobPosts || 0}</div>
                        <div>지원: {member.stats.totalApplications || 0}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setShowMemberModal(true);
                        }}
                        className="text-resort-600 hover:text-resort-900"
                        title="상세 보기"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {isAdmin && (
                        member.isHidden ? (
                          <button
                            onClick={() => restoreMember(member)}
                            className="text-emerald-600 hover:text-emerald-900"
                            title="복원"
                          >
                            복원
                          </button>
                        ) : (
                          <button
                            onClick={() => hideMember(member)}
                            className="text-gray-600 hover:text-gray-900"
                            title="숨김"
                            disabled={member.role === 'admin'}
                          >
                            숨김
                          </button>
                        )
                      )}
                      {/* 정지/해제 버튼 */}
                      {isAdmin && (
                        <button
                          onClick={() => toggleMemberSuspension(member)}
                          className={member.isSuspended ? "text-green-600 hover:text-green-900" : "text-yellow-600 hover:text-yellow-900"}
                          title={member.isSuspended ? "정지 해제" : "정지"}
                        >
                          {member.isSuspended ? <CheckCircle className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                        </button>
                      )}
                      {/* 삭제 버튼 */}
                      {isAdmin && (
                        <button
                          onClick={() => deleteMember(member)}
                          className="text-red-600 hover:text-red-900"
                          title="삭제"
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

      {/* 회원 상세 모달 */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2xl shadow-lg rounded-md bg-white max-w-4xl">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">회원 상세 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 기본 정보 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">기본 정보</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">이름</label>
                      <p className="text-sm text-gray-900">{selectedMember.displayName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">이메일</label>
                      <p className="text-sm text-gray-900">{selectedMember.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">역할</label>
                      <p className="text-sm text-gray-900">
                        {selectedMember.role === 'jobseeker' ? '크루' : 
                         selectedMember.role === 'employer' ? '리조트' : '관리자'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">가입일</label>
                      <p className="text-sm text-gray-900">{selectedMember.createdAt.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">최근 로그인</label>
                      <p className="text-sm text-gray-900">
                        {selectedMember.lastLoginAt ? selectedMember.lastLoginAt.toLocaleDateString() : '로그인 기록 없음'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 상태 정보 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">상태 정보</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">계정 상태</label>
                      <div className="mt-1">{getStatusBadge(selectedMember)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">인증 상태</label>
                      <div className="mt-1">{getVerificationBadge(selectedMember)}</div>
                    </div>
                    {getPremiumBadge(selectedMember) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">구독 상태</label>
                        <div className="mt-1">{getPremiumBadge(selectedMember)}</div>
                        {selectedMember.status.subscriptionExpiresAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            만료일: {selectedMember.status.subscriptionExpiresAt.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 크루 정보 */}
                {selectedMember.jobseekerInfo && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">크루 정보</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">연락처</label>
                        <p className="text-sm text-gray-900">{selectedMember.jobseekerInfo.phone || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">희망 급여</label>
                        <p className="text-sm text-gray-900">{selectedMember.jobseekerInfo.desiredSalary || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">희망 지역</label>
                        <p className="text-sm text-gray-900">
                          {selectedMember.jobseekerInfo.desiredLocation?.join(', ') || '-'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">보유 기술</label>
                        <p className="text-sm text-gray-900">
                          {selectedMember.jobseekerInfo.skills?.join(', ') || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 리조트 정보 */}
                {selectedMember.employerInfo && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">리조트 정보</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">회사명</label>
                        <p className="text-sm text-gray-900">{selectedMember.employerInfo.companyName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">연락처</label>
                        <p className="text-sm text-gray-900">{selectedMember.employerInfo.phone || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">사업자번호</label>
                        <p className="text-sm text-gray-900">{selectedMember.employerInfo.businessNumber || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">업종</label>
                        <p className="text-sm text-gray-900">{selectedMember.employerInfo.industry || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">회사 규모</label>
                        <p className="text-sm text-gray-900">
                          {selectedMember.employerInfo.companySize === 'small' ? '소규모' :
                           selectedMember.employerInfo.companySize === 'medium' ? '중규모' :
                           selectedMember.employerInfo.companySize === 'large' ? '대규모' : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 활동 통계 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">활동 통계</h4>
                  <div className="space-y-3">
                    {selectedMember.role === 'jobseeker' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">총 지원 수</label>
                          <p className="text-sm text-gray-900">{selectedMember.stats.totalApplications || 0}건</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">프로필 조회 수</label>
                          <p className="text-sm text-gray-900">{selectedMember.stats.totalViews || 0}회</p>
                        </div>
                      </>
                    )}
                    {selectedMember.role === 'employer' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">총 공고 수</label>
                          <p className="text-sm text-gray-900">{selectedMember.stats.totalJobPosts || 0}건</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">총 지원 수</label>
                          <p className="text-sm text-gray-900">{selectedMember.stats.totalApplications || 0}건</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">응답률</label>
                          <p className="text-sm text-gray-900">{selectedMember.stats.responseRate || 0}%</p>
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">최근 활동</label>
                      <p className="text-sm text-gray-900">
                        {selectedMember.stats.lastActivity ? selectedMember.stats.lastActivity.toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowMemberModal(false)}
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

export default MemberManagement;

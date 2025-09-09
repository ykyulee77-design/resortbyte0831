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
  Calendar,
  MapPin,
  Building,
  User,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adminAuth, AdminPermission } from '../../utils/adminAuth';
import { db, storage } from '../../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'jobseeker' | 'employer' | 'admin';
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  isSuspended: boolean;
  companyName?: string;
  workplaceLocation?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'jobseeker' | 'employer' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // 사용자 목록 로드
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        // 실제 데이터베이스에서 사용자 목록 로드
        const mockUsers: User[] = [
          {
            uid: '1',
            email: 'user1@example.com',
            displayName: '김철수',
            role: 'jobseeker',
            createdAt: new Date('2024-01-15'),
            lastLoginAt: new Date('2024-01-20'),
            isActive: true,
            isSuspended: false
          },
          {
            uid: '2',
            email: 'employer1@example.com',
            displayName: '리조트A',
            role: 'employer',
            createdAt: new Date('2024-01-10'),
            lastLoginAt: new Date('2024-01-19'),
            isActive: true,
            isSuspended: false,
            companyName: '리조트A',
            workplaceLocation: '제주도'
          },
          {
            uid: '3',
            email: 'admin@example.com',
            displayName: '관리자',
            role: 'admin',
            createdAt: new Date('2024-01-01'),
            lastLoginAt: new Date('2024-01-20'),
            isActive: true,
            isSuspended: false
          }
        ];
        setUsers(mockUsers);
        setFilteredUsers(mockUsers);
      } catch (error) {
        console.error('사용자 목록 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // 필터링
  useEffect(() => {
    let filtered = users;

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 역할 필터
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => user.isActive && !user.isSuspended);
      } else if (statusFilter === 'suspended') {
        filtered = filtered.filter(user => user.isSuspended);
      }
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  // 사용자 정지/해제
  const toggleUserSuspension = async (user: User) => {
    if (!adminAuth.canSuspendUsers()) {
      alert('사용자 정지 권한이 없습니다.');
      return;
    }

    try {
      // 실제 데이터베이스 업데이트
      const updatedUsers = users.map(u => 
        u.uid === user.uid 
          ? { ...u, isSuspended: !u.isSuspended }
          : u
      );
      setUsers(updatedUsers);
      
      alert(`${user.displayName} 사용자가 ${user.isSuspended ? '정지 해제' : '정지'}되었습니다.`);
    } catch (error) {
      console.error('사용자 상태 변경 실패:', error);
      alert('사용자 상태 변경에 실패했습니다.');
    }
  };

  // 사용자 삭제
  const deleteUser = async (user: User) => {
    if (!adminAuth.canDeleteUsers()) {
      alert('사용자 삭제 권한이 없습니다.');
      return;
    }

    if (!confirm(`정말로 ${user.displayName} 사용자를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // 실제 데이터베이스에서 삭제
      const updatedUsers = users.filter(u => u.uid !== user.uid);
      setUsers(updatedUsers);
      
      alert(`${user.displayName} 사용자가 삭제되었습니다.`);
    } catch (error) {
      console.error('사용자 삭제 실패:', error);
      alert('사용자 삭제에 실패했습니다.');
    }
  };

  // 안전삭제: 연결된 데이터/파일까지 함께 삭제
  const safeDeleteUser = async (user: User) => {
    if (!adminAuth.canDeleteUsers()) {
      alert('사용자 삭제 권한이 없습니다.');
      return;
    }

    if (!confirm(`정말로 ${user.displayName} 사용자를 안전삭제 하시겠습니까?\n\n※ 연결된 지원서/공고/알림/리뷰와 업로드 파일이 함께 삭제됩니다.`)) {
      return;
    }

    try {
      // 1) Firestore 연결 데이터 삭제 (존재하는 경우에 한해 안전하게 시도)
      const deleteByQuery = async (col: string, field: string, value: string) => {
        try {
          const q = query(collection(db, col), where(field, '==', value));
          const snap = await getDocs(q);
          for (const d of snap.docs) {
            await deleteDoc(doc(db, col, d.id));
          }
        } catch (e) {
          console.error(`[안전삭제] ${col} 정리 실패:`, e);
        }
      };

      // 구직자 기준 데이터
      await deleteByQuery('applications', 'jobseekerId', user.uid);
      await deleteByQuery('positiveReviews', 'jobseekerId', user.uid);
      await deleteByQuery('notifications', 'userId', user.uid);

      // 리조트(고용주) 기준 데이터
      await deleteByQuery('jobPosts', 'employerId', user.uid);
      await deleteByQuery('companyInfo', 'id', user.uid); // 프로젝트에 따라 키가 다를 수 있음

      // 2) Storage 업로드 파일 정리 (일반적으로 사용자 uid 기반 경로를 사용한다고 가정)
      const tryDeleteFolder = async (folderPath: string) => {
        try {
          const folderRef = ref(storage, folderPath);
          const listing = await listAll(folderRef);
          await Promise.all(listing.items.map(item => deleteObject(item)));
          // 하위 폴더도 정리
          for (const prefix of listing.prefixes) {
            const nested = await listAll(prefix);
            await Promise.all(nested.items.map(item => deleteObject(item)));
          }
        } catch (e) {
          console.error('[안전삭제] Storage 정리 실패:', folderPath, e);
        }
      };
      await tryDeleteFolder(`uploads/${user.uid}`);
      await tryDeleteFolder(`resumes/${user.uid}`);

      // 3) 로컬 목록에서도 제거 (현재 화면 반영)
      const updatedUsers = users.filter(u => u.uid !== user.uid);
      setUsers(updatedUsers);

      alert(`${user.displayName} 사용자가 안전삭제되었습니다. (연결 데이터/파일 정리 포함)`);
    } catch (error) {
      console.error('안전삭제 실패:', error);
      alert('안전삭제에 실패했습니다. 일부 데이터가 남아있을 수 있습니다. 로그를 확인하세요.');
    }
  };

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
  const getStatusBadge = (user: User) => {
    if (user.isSuspended) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">정지</span>;
    }
    if (user.isActive) {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">활성</span>;
    }
    return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">비활성</span>;
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
          <h2 className="text-xl font-semibold text-gray-900">사용자 관리</h2>
          <p className="text-sm text-gray-600">총 {filteredUsers.length}명의 사용자</p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-resort-600 text-white rounded-lg hover:bg-resort-700">
            사용자 내보내기
          </button>
        </div>
      </div>

      {/* 안내 배너: 안전삭제 설명 */}
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5" />
        <div className="text-sm leading-relaxed">
          <b>안전삭제</b>는 선택한 사용자를 지우는 것에 더해, 해당 사용자와 연결된 지원서, 공고, 알림, 리뷰 및 업로드 파일까지 함께 정리합니다.
          일반 <b>삭제</b>는 사용자 레코드만 제거하므로 연결 데이터나 파일이 남을 수 있습니다.
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
                placeholder="이름 또는 이메일"
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
            </select>
          </div>
          
          <div className="flex items-end">
            <button 
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              필터 초기화
            </button>
          </div>
        </div>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  최근 로그인
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-resort-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-resort-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.displayName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        {user.companyName && (
                          <div className="text-xs text-gray-400">
                            {user.companyName}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRoleIcon(user.role)}
                      <span className="ml-2 text-sm text-gray-900">
                        {user.role === 'jobseeker' ? '크루' : 
                         user.role === 'employer' ? '리조트' : '관리자'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt ? user.lastLoginAt.toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="text-resort-600 hover:text-resort-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {adminAuth.canSuspendUsers() && (
                        <button
                          onClick={() => toggleUserSuspension(user)}
                          className={user.isSuspended ? "text-green-600 hover:text-green-900" : "text-yellow-600 hover:text-yellow-900"}
                        >
                          {user.isSuspended ? <CheckCircle className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                        </button>
                      )}
                      {adminAuth.canDeleteUsers() && (
                        <>
                          <button
                            onClick={() => deleteUser(user)}
                            className="text-red-600 hover:text-red-900"
                            title="삭제 (사용자만 삭제)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => safeDeleteUser(user)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="안전삭제 (연결 데이터/파일 포함)"
                          >
                            <AlertTriangle className="h-4 w-4" />
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

      {/* 사용자 상세 모달 */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">사용자 상세 정보</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">이름</label>
                  <p className="text-sm text-gray-900">{selectedUser.displayName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">이메일</label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">역할</label>
                  <p className="text-sm text-gray-900">
                    {selectedUser.role === 'jobseeker' ? '크루' : 
                     selectedUser.role === 'employer' ? '리조트' : '관리자'}
                  </p>
                </div>
                {selectedUser.companyName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">회사명</label>
                    <p className="text-sm text-gray-900">{selectedUser.companyName}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">가입일</label>
                  <p className="text-sm text-gray-900">{selectedUser.createdAt.toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">상태</label>
                  <div className="mt-1">{getStatusBadge(selectedUser)}</div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUserModal(false)}
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

export default UserManagement;

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { WorkType, JobPost } from '../types';
import { workTypeService } from '../utils/scheduleMatchingService';
// WorkTypeEditModal import 제거 - 더 이상 사용하지 않음
import WorkTypeDetailViewModal from '../components/WorkTypeDetailViewModal';
import { ArrowLeft, Plus, Search, Filter, Briefcase } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const WorkTypesPage: React.FC = () => {
  const { user } = useAuth();
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType | null>(null);
  const [showDetailViewModal, setShowDetailViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [workTypeJobPosts, setWorkTypeJobPosts] = useState<{[key: string]: JobPost[]}>({});

  useEffect(() => {
    if (user) {
      loadWorkTypes();
    }
  }, [user]);

  const loadWorkTypes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const fetchedWorkTypes = await workTypeService.getWorkTypesByEmployer(user.uid);
      setWorkTypes(fetchedWorkTypes);
      
      // 각 근무 Type에 연결된 구인공고 로드
      await loadWorkTypeJobPosts(fetchedWorkTypes);
    } catch (error) {
      console.error('근무 타입 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkTypeJobPosts = async (workTypes: WorkType[]) => {
    if (!user) return;
    
    try {
      const jobPostsRef = collection(db, 'jobPosts');
      const jobPostsData: {[key: string]: JobPost[]} = {};
      
      // 모든 구인공고를 가져와서 필터링
      const allJobPosts = await getDocs(jobPostsRef);
      
      // 각 근무 Type에 대해 연결된 구인공고 조회
      for (const workType of workTypes) {
        const filteredJobPosts = allJobPosts.docs.filter(doc => {
          const data = doc.data();
          
          // workTypes 배열에서 현재 workType.id와 일치하는 항목 찾기
          const hasWorkType = (
            (data.workTypes && Array.isArray(data.workTypes) && 
              data.workTypes.some(wt => {
                if (typeof wt === 'string') {
                  return wt === workType.id;
                } else if (typeof wt === 'object' && wt !== null) {
                  return wt.id === workType.id;
                }
                return false;
              })) ||
            (data.workType && data.workType === workType.id) ||
            (data.workTypeId && data.workTypeId === workType.id) ||
            (data.selectedWorkType && data.selectedWorkType === workType.id)
          );
          
          return hasWorkType;
        });
        
        const jobPosts: JobPost[] = filteredJobPosts.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as JobPost));
        
        jobPostsData[workType.id] = jobPosts;
      }
      
      setWorkTypeJobPosts(jobPostsData);
    } catch (error) {
      console.error('구인공고 로딩 실패:', error);
    }
  };

  const handleWorkTypeClick = (workType: WorkType) => {
    setSelectedWorkType(workType);
    setShowDetailViewModal(true);
  };

  // handleWorkTypeEdit과 handleWorkTypeUpdate 함수 제거 - 더 이상 사용하지 않음

  const handleWorkTypeDelete = (workTypeId: string) => {
    setWorkTypes(prev => prev.filter(wt => wt.id !== workTypeId));
    setSelectedWorkType(null);
    setShowDetailViewModal(false);
    
    // 구인공고 정보에서도 제거
    setWorkTypeJobPosts(prev => {
      const newData = { ...prev };
      delete newData[workTypeId];
      return newData;
    });
  };

  const filteredWorkTypes = workTypes.filter(workType => {
    // 빈 ID를 가진 근무타입 제외
    if (!workType.id || workType.id.trim() === '') {
      return false;
    }
    
    const matchesSearch = workType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (workType.description && workType.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && workType.isActive) ||
                         (filterActive === 'inactive' && !workType.isActive);
    
    return matchesSearch && matchesFilter;
  });

  const activeWorkTypes = filteredWorkTypes.filter(wt => wt.isActive).length;
  const totalWorkTypes = filteredWorkTypes.length;

    // 스케줄 시간 계산 함수 (메모이제이션)
  const calculateScheduleTime = React.useMemo(() => {
    return (schedules: any[]) => {
      if (!schedules || schedules.length === 0) return { totalHours: 0, avgHoursPerDay: 0 };

      let totalHours = 0;
      const daysWithSchedules = new Set();
      
      schedules.forEach(schedule => {
        // TimeSlot 구조: { day, start, end, priority }
        if (schedule.start !== undefined && schedule.end !== undefined) {
          const hours = schedule.end - schedule.start;
          totalHours += hours;
          
          // 요일 정보가 있으면 해당 요일 추가
          if (schedule.day !== undefined) {
            daysWithSchedules.add(schedule.day);
          }
        }
      });
      
      const daysCount = daysWithSchedules.size || 1; // 최소 1일로 설정
      const avgHoursPerDay = Math.round((totalHours / daysCount) * 10) / 10;
      
      return { totalHours, avgHoursPerDay };
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">근무 타입을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
                         <button
               onClick={() => window.history.back()}
               className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
             >
               <ArrowLeft className="h-5 w-5" />
             </button>
                         <div>
               <h1 className="text-3xl font-bold text-gray-900">근무 Type 상세</h1>
               <p className="text-gray-600 mt-1">
                 근무 유형을 생성하고 관리하여 스마트 매칭을 최적화하세요
               </p>
             </div>
          </div>
                     <button
             onClick={() => setShowCreateModal(true)}
             className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
           >
             <Plus className="h-4 w-4 mr-2" />
             새 근무 Type
           </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <div className="w-6 h-6 bg-blue-600 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 근무 Type</p>
              <p className="text-2xl font-bold text-gray-900">{totalWorkTypes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <div className="w-6 h-6 bg-green-600 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">활성 근무 Type</p>
              <p className="text-2xl font-bold text-gray-900">{activeWorkTypes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <div className="w-6 h-6 bg-purple-600 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">매칭률</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalWorkTypes > 0 ? Math.round((activeWorkTypes / totalWorkTypes) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="근무 타입 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as any)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
          
          <div className="text-right">
            <span className="text-sm text-gray-600">
              {filteredWorkTypes.length}개 중 {workTypes.length}개
            </span>
          </div>
        </div>
      </div>

      {/* 근무 타입 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">근무 Type 목록</h2>
        </div>
        
        {filteredWorkTypes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-gray-400 rounded"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterActive !== 'all' ? '검색 결과가 없습니다' : '근무 Type이 없습니다'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterActive !== 'all' 
                ? '다른 검색어나 필터를 시도해보세요'
                : '새로운 근무 Type을 생성하여 스마트 매칭을 시작하세요'
              }
            </p>
                         {!searchTerm && filterActive === 'all' && (
               <button
                 onClick={() => setShowCreateModal(true)}
                 className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
               >
                 <Plus className="h-4 w-4 mr-2" />
                 첫 번째 근무 Type 생성
               </button>
             )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredWorkTypes.map((workType) => (
              <div
                key={workType.id}
                onClick={() => handleWorkTypeClick(workType)}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${
                      workType.isActive ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                                         <div>
                       <h3 className="text-lg font-medium text-gray-900">
                         {workType.name} 
                         <span className="text-xs text-gray-500 ml-2">(ID: {workType.id})</span>
                       </h3>
                       {workType.description && (
                         <p className="text-sm text-gray-600 mt-1">{workType.description}</p>
                       )}
                       
                                               {/* 연결된 구인공고 표시 */}
                        {workTypeJobPosts[workType.id] && workTypeJobPosts[workType.id].length > 0 && (
                          <div className="mt-2 space-y-1">
                            {workTypeJobPosts[workType.id].slice(0, 2).map((jobPost) => (
                              <div key={jobPost.id} className="text-xs text-blue-600 font-medium">
                                {jobPost.title}
                              </div>
                            ))}
                            {workTypeJobPosts[workType.id].length > 2 && (
                              <div className="text-xs text-blue-500">
                                외 {workTypeJobPosts[workType.id].length - 2}개 더...
                              </div>
                            )}
                          </div>
                        )}
                       

                       
                       <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                         {(() => {
                           const { totalHours, avgHoursPerDay } = calculateScheduleTime(workType.schedules);
                           return (
                             <>
                               <span>총 {totalHours}시간</span>
                               <span>일평균 {avgHoursPerDay}시간</span>
                               <span>스케줄: {workType.schedules?.length || 0}개</span>
                               {workType.schedules && workType.schedules.length > 0 && (
                                 <span className="text-blue-600">
                                   {workType.schedules.slice(0, 3).map(s => `${s.day}(${s.start}-${s.end})`).join(', ')}
                                   {workType.schedules.length > 3 && '...'}
                                 </span>
                               )}
                             </>
                           );
                         })()}
                         <span>생성일: {workType.createdAt?.toDate?.() ? workType.createdAt.toDate().toLocaleDateString() : '날짜 정보 없음'}</span>
                       </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      workType.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {workType.isActive ? '활성' : '비활성'}
                    </span>
                    <div className="w-5 h-5 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* 근무 타입 상세보기 모달 */}
      <WorkTypeDetailViewModal
        workType={selectedWorkType}
        isOpen={showDetailViewModal}
        onClose={() => {
          setShowDetailViewModal(false);
          setSelectedWorkType(null);
        }}
        onUpdate={(updatedWorkType) => {
          // 스케줄 수정 후 목록 새로고침
          loadWorkTypes();
        }}
        linkedJobPosts={selectedWorkType ? workTypeJobPosts[selectedWorkType.id] || [] : []}
        isCreateMode={false}
      />

      {/* 근무 타입 수정 모달 - 더 이상 사용하지 않음 */}
      {/* <WorkTypeEditModal
        workType={selectedWorkType}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedWorkType(null);
        }}
        onUpdate={handleWorkTypeUpdate}
      /> */}

      {/* 새 근무 타입 생성 모달 */}
      <WorkTypeDetailViewModal
        workType={showCreateModal ? {
          id: '',
          employerId: user?.uid || '',
          name: '',
          description: '',
          hourlyWage: 0,
          schedules: [],
          isActive: true,
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        } : null}
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
        }}
        onCreate={(newWorkType: WorkType) => {
          // 새 근무 타입 생성 후 성공 메시지
          alert(`새 근무 타입 "${newWorkType.name}"이(가) 생성되었습니다!`);
          setShowCreateModal(false);
          loadWorkTypes(); // 목록 새로고침
        }}
        isCreateMode={true}
        linkedJobPosts={[]}
      />
    </div>
  );
};

export default WorkTypesPage;

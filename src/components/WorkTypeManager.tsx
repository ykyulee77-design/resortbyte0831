import React, { useEffect, useState } from 'react';
import { WorkType } from '../types';
import { workTypeService } from '../utils/scheduleMatchingService';
import WorkTypeEditModal from './WorkTypeEditModal';
import { Clock, Plus, Trash2, X } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface WorkTypeManagerProps {
  employerId?: string;
  onClose?: () => void;
  onSelectWorkType?: (workType: WorkType) => void;
  isSelectionMode?: boolean;
  onWorkTypeCreated?: (workType: WorkType) => void;
}

const WorkTypeManager: React.FC<WorkTypeManagerProps> = ({ 
  employerId, 
  onClose, 
  onSelectWorkType,
  isSelectionMode = false,
  onWorkTypeCreated
}) => {
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(false);
  const [newWorkTypeName, setNewWorkTypeName] = useState('');
  const [newWorkTypeDescription, setNewWorkTypeDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWorkTypeForDetail, setSelectedWorkTypeForDetail] = useState<WorkType | null>(null);
  const [showWorkTypeDetailModal, setShowWorkTypeDetailModal] = useState(false);

  const loadWorkTypes = async () => {
    if (!employerId) return;
    setLoading(true);
    try {
      console.log('WorkTypeManager: 근무타입 로딩 시작, employerId:', employerId);
      const list = await workTypeService.getWorkTypesByEmployer(employerId);
      console.log('WorkTypeManager: 로딩된 근무타입들:', list);
      setWorkTypes(list);
    } catch (e) {
      console.error('근무 유형 불러오기 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkTypes();
  }, [employerId]);

  const handleCreate = async () => {
    if (!newWorkTypeName.trim() || !employerId) return;
    
    try {
      const newWorkType = await workTypeService.createWorkType({
        employerId,
        name: newWorkTypeName.trim(),
        description: newWorkTypeDescription.trim(),
        schedules: [],
        isActive: true
      });
      
      // 생성 후 바로 목록 새로고침
      await loadWorkTypes();
      
      // 콜백 호출
      if (onWorkTypeCreated) {
        onWorkTypeCreated(newWorkType);
      }
      
      setShowCreateForm(false);
      setNewWorkTypeName('');
      setNewWorkTypeDescription('');
    } catch (e) {
      console.error('근무 유형 생성 실패:', e);
    }
  };



  const handleWorkTypeClick = (wt: WorkType) => {
    if (isSelectionMode && onSelectWorkType) {
      onSelectWorkType(wt);
    } else {
      setSelectedWorkTypeForDetail(wt);
      setShowWorkTypeDetailModal(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 근무 유형을 삭제하시겠습니까?')) return;
    try {
      await workTypeService.deleteWorkType(id);
      await loadWorkTypes();
    } catch (e) {
      console.error('근무 유형 삭제 실패:', e);
    }
  };

  return (
    <>
      {/* 메인 모달 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold">
                {isSelectionMode ? '근무 유형 선택' : '근무 유형 관리'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {isSelectionMode ? '공고에 적용할 근무 유형을 선택하세요' : '근무 유형을 생성하고 관리하세요'}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* 새 근무 유형 생성 섹션 */}
          {!isSelectionMode && (
            <div className="mb-6">
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full p-4 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  새 근무 유형 생성
                </button>
              ) : (
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">근무 유형명 *</label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newWorkTypeName}
                        onChange={(e) => setNewWorkTypeName(e.target.value)}
                        placeholder="예: 주간 근무, 야간 근무"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newWorkTypeDescription}
                        onChange={(e) => setNewWorkTypeDescription(e.target.value)}
                        placeholder="근무 유형에 대한 설명"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewWorkTypeName('');
                        setNewWorkTypeDescription('');
                      }}
                      className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={!newWorkTypeName.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      생성
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 근무 유형 목록 */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              {isSelectionMode ? '선택 가능한 근무 유형' : '등록된 근무 유형'}
            </h4>

            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">불러오는 중...</p>
              </div>
            ) : workTypes.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">등록된 근무 유형이 없습니다</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workTypes
                  .filter(wt => wt.employerId === employerId)
                  .filter(wt => wt.id && wt.id.trim() !== '') // 빈 ID 제거
                  .map(wt => (
                  <div
                    key={wt.id}
                    className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
                      isSelectionMode ? 'cursor-pointer hover:border-blue-300' : ''
                    }`}
                    onClick={() => handleWorkTypeClick(wt)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1">{wt.name}</h5>
                        {wt.description && (
                          <p className="text-sm text-gray-600 mb-2">{wt.description}</p>
                        )}

                      </div>
                      
                      {!isSelectionMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(wt.id);
                          }}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {isSelectionMode && onSelectWorkType && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWorkType(wt);
                        }}
                        className="w-full mt-3 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                      >
                        ✓ 선택하기
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>



      {/* 근무타입 수정 모달 */}
      <WorkTypeEditModal
        workType={selectedWorkTypeForDetail}
        isOpen={showWorkTypeDetailModal}
        onClose={() => {
          setShowWorkTypeDetailModal(false);
          setSelectedWorkTypeForDetail(null);
        }}
        onUpdate={(updatedWorkType: WorkType) => {
          // 업데이트 후 목록 새로고침
          loadWorkTypes();
          setSelectedWorkTypeForDetail(updatedWorkType);
          setShowWorkTypeDetailModal(false);
          setSelectedWorkTypeForDetail(null);
        }}
      />
    </>
  );
};

export default WorkTypeManager;

import React, { useState, useEffect, useMemo } from 'react';
import { WorkType, JobPost, TimeSlot } from '../types';
import { X, Edit3, Clock, Calendar, Briefcase, Eye, Save, X as XIcon, Plus } from 'lucide-react';
import ScheduleDisplay from './ScheduleDisplay';
import UnifiedScheduleGrid from './UnifiedScheduleGrid';
import { workTypeService } from '../utils/scheduleMatchingService';
import { Timestamp } from 'firebase/firestore';

interface WorkTypeDetailViewModalProps {
  workType: WorkType | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedWorkType: WorkType) => void; // 업데이트만 알리는 콜백
  onCreate?: (newWorkType: WorkType) => void; // 생성 콜백
  linkedJobPosts?: JobPost[];
  isCreateMode?: boolean; // 생성 모드 여부
}

const WorkTypeDetailViewModal: React.FC<WorkTypeDetailViewModalProps> = ({ 
  workType, 
  isOpen, 
  onClose,
  onUpdate,
  onCreate,
  linkedJobPosts = [],
  isCreateMode = false,
}) => {
  const [showScheduleDetail, setShowScheduleDetail] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSchedules, setEditedSchedules] = useState<TimeSlot[]>([]);
  const [editedFormData, setEditedFormData] = useState({
    name: '',
    description: '',
    hourlyWage: 0,
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // 편집 모드 시작
  const handleStartEdit = () => {
    setEditedSchedules(workType?.schedules || []);
    setEditedFormData({
      name: workType?.name || '',
      description: workType?.description || '',
      hourlyWage: workType?.hourlyWage || 0,
      isActive: workType?.isActive || true,
    });
    setIsEditing(true);
  };

  // 생성 모드일 때 초기 편집 상태 설정
  useEffect(() => {
    if (isCreateMode && isOpen) {
      setIsEditing(true);
      setEditedSchedules([]);
      setEditedFormData({
        name: '',
        description: '',
        hourlyWage: 0,
        isActive: true,
      });
    }
  }, [isCreateMode, isOpen]);

  // 편집 모드 취소
  const handleCancelEdit = () => {
    if (isCreateMode) {
      // 생성 모드에서는 모달 닫기
      onClose();
    } else {
      // 수정 모드에서는 편집 상태만 취소
      setIsEditing(false);
      setEditedSchedules([]);
      setEditedFormData({
        name: '',
        description: '',
        hourlyWage: 0,
        isActive: true,
      });
    }
  };

  // 전체 정보 저장
  const handleSave = async () => {

    
    if (!workType) {
      console.error('workType이 없습니다.');
      return;
    }

    // 필수 필드 검증
    if (!editedFormData.name.trim()) {
      alert('근무타입명을 입력해주세요.');
      return;
    }

    

    setIsSaving(true);
    try {
      // ID가 없거나 빈 문자열인 경우 생성 모드로 처리
      const shouldCreate = isCreateMode || !workType.id || workType.id.trim() === '';
      
      if (shouldCreate) {
        // 생성 모드

        
        const newWorkType = {
          employerId: workType.employerId,
          name: editedFormData.name.trim(),
          description: editedFormData.description.trim(),
          hourlyWage: editedFormData.hourlyWage,
          isActive: editedFormData.isActive,
          schedules: editedSchedules,
        };

        const createdWorkType = await workTypeService.createWorkType(newWorkType);
        
        // 부모 컴포넌트에 생성 알림
        if (onCreate) {
          onCreate(createdWorkType);
        }
        
        // 생성 모드에서는 모달 닫기
        onClose();
      } else {
        // 수정 모드 (유효한 ID가 있는 경우)

        
        const updatedWorkType: WorkType = {
          ...workType,
          name: editedFormData.name.trim(),
          description: editedFormData.description.trim(),
          hourlyWage: editedFormData.hourlyWage,
          isActive: editedFormData.isActive,
          schedules: editedSchedules,
          updatedAt: Timestamp.now(),
        };
        
        await workTypeService.updateWorkType(workType.id, updatedWorkType);
        

        
        // 수정 모드 종료하고 조회 모드로 돌아가기
        setIsEditing(false);
        
        // 부모 컴포넌트에 업데이트 알림
        if (onUpdate) {
          onUpdate(updatedWorkType);
        }
      }
      
    } catch (error) {
      console.error(isCreateMode ? '근무타입 생성 실패:' : '근무타입 수정 실패:', error);
      alert(isCreateMode ? '근무타입 생성에 실패했습니다. 다시 시도해주세요.' : '근무타입 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  // 스케줄 통계 계산 (메모이제이션)
  const stats = React.useMemo(() => {
    if (!workType) return { totalHours: 0, avgHoursPerDay: 0, totalTimeSlots: 0 };
    
    const schedules = isEditing ? editedSchedules : workType.schedules;
    if (!schedules || schedules.length === 0) return { totalHours: 0, avgHoursPerDay: 0, totalTimeSlots: 0 };

    const totalHours = schedules.reduce((total, slot) => {
      // 24시간을 넘어가는 경우 처리 (예: 23:00-01:00)
      const start = slot.start || 0;
      const end = slot.end || 0;
      let hours = end - start;
      if (hours <= 0) hours += 24;
      return total + hours;
    }, 0);

    const uniqueDays = new Set(schedules?.map(slot => slot.day) || []).size;
    const avgHoursPerDay = uniqueDays > 0 ? totalHours / uniqueDays : 0;

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
      totalTimeSlots: schedules?.length || 0,
    };
  }, [workType, isEditing, editedSchedules]);

  if (!isOpen || !workType) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isCreateMode ? 'bg-green-100' : 'bg-blue-100'}`}>
              {isCreateMode ? (
                <Plus className="h-6 w-6 text-green-600" />
              ) : (
                <Eye className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {isCreateMode ? '새 근무 Type 생성' : '근무 Type 상세'}
              </h3>
              <p className="text-gray-600 mt-1">
                {isCreateMode 
                  ? '새로운 근무타입을 생성하고 스케줄을 설정할 수 있습니다' 
                  : '근무타입 정보와 스케줄을 확인할 수 있습니다'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 기본 정보 */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                기본 정보
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    근무타입명
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedFormData.name}
                      onChange={(e) => setEditedFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="근무타입명을 입력하세요"
                    />
                  ) : (
                    <p className="text-lg font-medium text-gray-900">{workType.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시급 (원/시간)
                  </label>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editedFormData.hourlyWage}
                        onChange={(e) => setEditedFormData(prev => ({ ...prev, hourlyWage: Number(e.target.value) }))}
                        min="0"
                        step="1000"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="시급을 입력하세요"
                      />
                      <span className="text-sm text-gray-600 whitespace-nowrap">원/시간</span>
                    </div>
                  ) : (
                    <p className="text-gray-700 font-medium">
                      {workType.hourlyWage ? `${workType.hourlyWage.toLocaleString()}원/시간` : '시급 미설정'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editedFormData.description}
                      onChange={(e) => setEditedFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="근무타입에 대한 설명을 입력하세요"
                    />
                  ) : (
                    <p className="text-gray-700">
                      {workType.description || '설명이 없습니다.'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상태
                  </label>
                  {isEditing ? (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editedFormData.isActive}
                        onChange={(e) => setEditedFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        활성 상태로 설정
                      </label>
                    </div>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      workType.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {workType.isActive ? '활성' : '비활성'}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    생성일
                  </label>
                  <p className="text-gray-700">
                    {workType.createdAt?.toDate?.() ? 
                      workType.createdAt.toDate().toLocaleDateString('ko-KR') : 
                      '날짜 정보 없음'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* 스케줄 통계 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                스케줄 통계
              </h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalHours}</div>
                  <div className="text-sm text-blue-700">총 시간</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-indigo-600">{stats.totalTimeSlots}</div>
                  <div className="text-sm text-indigo-700">시간대</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-purple-600">{stats.avgHoursPerDay}</div>
                  <div className="text-sm text-purple-700">일 평균</div>
                </div>
              </div>
              {isEditing && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 text-center">
                    💡 스케줄을 수정하면 통계가 실시간으로 업데이트됩니다
                  </p>
                </div>
              )}
            </div>

            {/* 연결된 구인공고 - 생성 모드에서는 숨김 */}
            {!isCreateMode && linkedJobPosts.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  적용 업무 ({linkedJobPosts.length}개)
                </h4>
                
                <div className="space-y-2">
                  {linkedJobPosts.map((jobPost) => (
                    <div key={jobPost.id} className="p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900">{jobPost.title}</h5>
                      <p className="text-sm text-gray-600">{jobPost.employerName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 스케줄 표시 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                스케줄 정보
              </h4>
              <div className="flex items-center gap-2">
                {!isEditing && !isCreateMode && (
                  <button
                    onClick={handleStartEdit}
                    className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    수정
                  </button>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <UnifiedScheduleGrid
                selectedTimeSlots={editedSchedules}
                onChange={(timeSlots) => {
                  setEditedSchedules(timeSlots);
                }}
                onSave={(timeSlots) => {
                  setEditedSchedules(timeSlots);
                }}
                mode="edit"
                title="스케줄"
                description="근무시간을 설정하세요"
                employerView={true}
                showActions={false}
                showStatistics={true}
                readOnly={false}
              />
            ) : (
              <ScheduleDisplay 
                schedules={workType.schedules || []} 
                showDetail={showScheduleDetail}
              />
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isCreateMode ? '생성' : '저장'}
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkTypeDetailViewModal;

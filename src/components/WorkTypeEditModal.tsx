import React, { useState, useEffect } from 'react';
import { WorkType, TimeSlot } from '../types';
import { X, Save, Building, Calendar, Users, Target } from 'lucide-react';
import { workTypeService } from '../utils/scheduleMatchingService';
import UnifiedScheduleGrid from './UnifiedScheduleGrid';
import { Timestamp } from 'firebase/firestore';

interface WorkTypeEditModalProps {
  workType: WorkType | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedWorkType: WorkType) => void;
  isCreateMode?: boolean;
}

const WorkTypeEditModal: React.FC<WorkTypeEditModalProps> = ({ 
  workType, 
  isOpen, 
  onClose,
  onUpdate,
  isCreateMode = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hourlyWage: 0,
    isActive: true,
  });
  const [schedules, setSchedules] = useState<TimeSlot[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (workType) {
      setFormData({
        name: workType.name,
        description: workType.description || '',
        hourlyWage: workType.hourlyWage || 0,
        isActive: workType.isActive,
      });
      setSchedules(workType.schedules || []);
      setErrors({});
    }
  }, [workType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
        type === 'number' ? Number(value) : value,
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = '근무타입명을 입력해주세요';
    }

    if (schedules.length === 0) {
      newErrors.schedules = '최소 하나의 스케줄을 설정해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!workType || !validateForm()) return;

    setIsSaving(true);
    try {
      if (isCreateMode) {
        const newWorkType = await workTypeService.createWorkType({
          employerId: workType.employerId,
          name: formData.name.trim(),
          description: formData.description.trim(),
          hourlyWage: formData.hourlyWage,
          schedules: schedules,
          isActive: formData.isActive,
        });
          
        if (onUpdate) {
          onUpdate(newWorkType);
        }
      } else {
        const updatedWorkType: WorkType = {
          ...workType,
          name: formData.name.trim(),
          description: formData.description.trim(),
          hourlyWage: formData.hourlyWage,
          isActive: formData.isActive,
          schedules: schedules,
          updatedAt: Timestamp.now(),
        };

        await workTypeService.updateWorkType(workType.id, updatedWorkType);
          
        if (onUpdate) {
          onUpdate(updatedWorkType);
        }
      }
      
      onClose();
    } catch (error) {
      console.error(isCreateMode ? '근무타입 생성 실패:' : '근무타입 수정 실패:', error);
      setErrors({ general: isCreateMode ? '근무타입 생성에 실패했습니다. 다시 시도해주세요.' : '근무타입 수정에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !workType) return null;

  // 통계 계산 - 실제 시간 계산
  const stats = {
    totalHours: schedules.reduce((total, slot) => {
      // 24시간을 넘어가는 경우 처리 (예: 23:00-01:00)
      const start = slot.start || 0;
      const end = slot.end || 0;
      let hours = end - start;
      if (hours <= 0) hours += 24;
      return total + hours;
    }, 0),
    avgHoursPerDay: schedules.length > 0 ? Math.round(schedules.length / 7 * 10) / 10 : 0,
    totalTimeSlots: schedules.length,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 - 상세 모달과 동일 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Building className="h-8 w-8 text-blue-600" />
              {formData.name || '새 근무타입'}
            </h3>
            <p className="text-gray-600 mt-1">근무타입 수정</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* 기본 정보 - 상세 모달과 동일한 구조 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              기본 정보
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">근무타입명</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="근무타입명을 입력하세요"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시급 (원/시간)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="hourlyWage"
                    value={formData.hourlyWage}
                    onChange={handleInputChange}
                    min="0"
                    step="1000"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="시급을 입력하세요"
                  />
                  <span className="text-sm text-gray-600 whitespace-nowrap">원/시간</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    활성 상태로 설정
                  </label>
                </div>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="근무타입에 대한 설명을 입력하세요"
                />
              </div>
            </div>
          </div>

          {/* 스케줄 통계 - 상세 모달과 동일 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5" />
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
            
            {errors.schedules && (
              <p className="text-red-600 text-sm mt-3 text-center">{errors.schedules}</p>
            )}
          </div>

          {/* 스케줄 시각화 - 상세 모달과 동일 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              근무 스케줄
            </h4>
            
            <UnifiedScheduleGrid
              selectedTimeSlots={schedules}
              onSave={(timeSlots) => setSchedules(timeSlots)}
              mode="edit"
              title="스케줄"
              description="근무시간을 설정하세요"
              employerView={true}
              showActions={true}
              showStatistics={false}
              readOnly={false}
            />
          </div>

          {/* 매칭 정보 - 상세 모달과 동일 */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              매칭 정보
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <h5 className="font-medium text-purple-900 mb-2">구직자 매칭</h5>
                <p className="text-sm text-purple-700">
                  이 근무타입은 구직자의 선호시간과 매칭되어 추천됩니다.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <h5 className="font-medium text-purple-900 mb-2">스마트 매칭</h5>
                <p className="text-sm text-purple-700">
                  시간대 우선순위를 고려하여 정확한 매칭을 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 액션 */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
        </div>
      </div>
    </div>
  );
};

export default WorkTypeEditModal;


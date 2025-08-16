import React from 'react';
import { WorkType } from '../types';
import { X, Building, Calendar, Users, Target } from 'lucide-react';
import UnifiedScheduleGrid from './UnifiedScheduleGrid';

interface WorkTypeDetailModalProps {
  workType: WorkType | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (workType: WorkType) => void;
}

const WorkTypeDetailModal: React.FC<WorkTypeDetailModalProps> = ({ 
  workType, 
  isOpen, 
  onClose,
  onEdit
}) => {
  if (!isOpen || !workType) return null;

  // 통계 계산 - 실제 시간 계산
  const stats = {
    totalHours: (workType.schedules || []).reduce((total, slot) => {
      // 24시간을 넘어가는 경우 처리 (예: 23:00-01:00)
      let hours = slot.end - slot.start;
      if (hours <= 0) hours += 24;
      return total + hours;
    }, 0),
    avgHoursPerDay: workType.schedules?.length ? Math.round(workType.schedules.length / 7 * 10) / 10 : 0,
    totalTimeSlots: workType.schedules?.length || 0
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Building className="h-8 w-8 text-blue-600" />
              {workType.name}
            </h3>
            <p className="text-gray-600 mt-1">근무타입 상세 정보</p>
          </div>
          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                onClick={() => onEdit(workType)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Calendar className="w-4 h-4" />
                수정
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              기본 정보
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">근무타입명</label>
                <p className="text-gray-900 font-medium">{workType.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시급</label>
                <p className="text-gray-900 font-medium">{workType.hourlyWage ? `${workType.hourlyWage.toLocaleString()}원/시간` : '시급 미설정'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  workType.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {workType.isActive ? '활성' : '비활성'}
                </span>
              </div>
              {workType.description && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <p className="text-gray-900">{workType.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* 스케줄 통계 */}
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
          </div>

          {/* 스케줄 시각화 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              근무 스케줄
            </h4>
            
            <UnifiedScheduleGrid
              selectedTimeSlots={workType.schedules || []}
              mode="view"
              title="근무 스케줄"
              description="설정된 근무시간을 확인하세요"
              employerView={true}
              showActions={false}
              readOnly={true}
            />
          </div>

          {/* 매칭 정보 */}
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
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkTypeDetailModal;

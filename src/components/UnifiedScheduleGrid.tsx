import React, { useState, useEffect } from 'react';
import { TimeSlot } from '../types';
import { Clock, Edit3, Save, X, Users, Building, CheckCircle, Sun, Moon, Coffee } from 'lucide-react';

interface UnifiedScheduleGridProps {
  selectedTimeSlots: TimeSlot[];
  onSave?: (timeSlots: TimeSlot[]) => void;
  onChange?: (timeSlots: TimeSlot[]) => void; // 실시간 변경 알림
  onCancel?: () => void;
  mode: 'view' | 'edit' | 'create';
  title?: string;
  description?: string;
  showStatistics?: boolean;
  showActions?: boolean;
  readOnly?: boolean;
  maxSelections?: number;
  employerView?: boolean; // 구인자 관점에서 보기
  jobseekerView?: boolean; // 구직자 관점에서 보기
}

const UnifiedScheduleGrid: React.FC<UnifiedScheduleGridProps> = ({
  selectedTimeSlots,
  onSave,
  onChange,
  onCancel,
  mode = 'view',
  title = '스케줄',
  description = '근무시간을 설정하세요',
  showStatistics = true,
  showActions = true,
  readOnly = false,
  maxSelections,
  employerView = false,
  jobseekerView = false
}) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(selectedTimeSlots);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'create');

  // Update internal state when props change
  useEffect(() => {
    setTimeSlots(selectedTimeSlots);
  }, [selectedTimeSlots]);

  const days = ['월', '화', '수', '목', '금', '토', '일'];
  
  // 24시간을 1시간 단위로 설정
  const timeSlotsList = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const handleTimeSlotClick = (dayOfWeek: number, timeSlotIndex: number) => {
    if (readOnly || !isEditing) return;

    const startHour = timeSlotIndex;
    const endHour = (timeSlotIndex + 1) % 24;

    const existingSlot = timeSlots.find(
      slot => slot.day === dayOfWeek && slot.start === startHour && slot.end === endHour
    );

    if (existingSlot) {
      // 선택 해제
      const newTimeSlots = timeSlots.filter(slot =>
        !(slot.day === dayOfWeek && slot.start === startHour && slot.end === endHour)
      );
      setTimeSlots(newTimeSlots);
      onChange?.(newTimeSlots); // 실시간 변경 알림
    } else {
      // 새로운 슬롯 추가
      if (maxSelections && timeSlots.length >= maxSelections) {
        alert(`최대 ${maxSelections}개의 시간대만 선택할 수 있습니다.`);
        return;
      }

      const newSlot: TimeSlot = {
        day: dayOfWeek,
        start: startHour,
        end: endHour
      };
      const newTimeSlots = [...timeSlots, newSlot];
      setTimeSlots(newTimeSlots);
      onChange?.(newTimeSlots); // 실시간 변경 알림
    }
  };

  const isSlotSelected = (dayOfWeek: number, timeSlotIndex: number) => {
    const startHour = timeSlotIndex;
    const endHour = (timeSlotIndex + 1) % 24;
    return timeSlots.some(
      slot => slot.day === dayOfWeek && slot.start === startHour && slot.end === endHour
    );
  };

  const getSlotClassName = (isSelected: boolean) => {
    if (employerView) {
      // 구인자 관점: 파란색 계열
      return isSelected 
        ? 'bg-blue-500 text-white hover:bg-blue-600' 
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200';
    } else if (jobseekerView) {
      // 구직자 관점: 보라색 계열
      return isSelected 
        ? 'bg-purple-500 text-white hover:bg-purple-600' 
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200';
    } else {
      // 기본: 녹색 계열
      return isSelected 
        ? 'bg-green-500 text-white hover:bg-green-600' 
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200';
    }
  };

  const getTimeIcon = (timeSlotIndex: number) => {
    if (timeSlotIndex >= 6 && timeSlotIndex <= 18) {
      return <Sun className="w-2 h-2" />;
    } else if (timeSlotIndex >= 22 || timeSlotIndex <= 6) {
      return <Moon className="w-2 h-2" />;
    } else {
      return <Coffee className="w-2 h-2" />;
    }
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setSaving(true);
    try {
      await onSave(timeSlots);
      if (mode === 'create') {
        setIsEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (mode === 'create') {
      setTimeSlots([]);
    } else {
      setTimeSlots(selectedTimeSlots);
    }
    setIsEditing(false);
    onCancel?.();
  };

  const getHeaderColor = () => {
    if (employerView) return 'from-blue-50 to-indigo-50';
    if (jobseekerView) return 'from-purple-50 to-pink-50';
    return 'from-green-50 to-emerald-50';
  };

  const getHeaderIcon = () => {
    if (employerView) return <Building className="h-5 w-5 text-blue-600" />;
    if (jobseekerView) return <Users className="h-5 w-5 text-purple-600" />;
    return <Clock className="h-5 w-5 text-green-600" />;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      {(title || description) && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className={`p-6 bg-gradient-to-r ${getHeaderColor()} border-b border-gray-200`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-3">
                  {getHeaderIcon()}
                  {title}
                </h4>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
              
              {showActions && mode !== 'view' && (
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
                      >
                        {saving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
                      >
                        <X className="w-4 h-4" />
                        취소
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                    >
                      <Edit3 className="w-4 h-4" />
                      수정
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* 시간대 선택 그리드 - 단순화된 도표 형태 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="w-10 px-1 py-1 text-left text-xs font-semibold text-gray-900 border border-gray-300">
                    시간
                  </th>
                  {days.map((day, index) => (
                    <th key={day} className="w-6 px-0.5 py-1 text-center text-xs font-semibold text-gray-900 border border-gray-300">
                      <div className={`${index >= 5 ? 'text-red-600' : ''}`}>
                        {day}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlotsList.map((timeSlot, timeIndex) => (
                  <tr key={timeIndex} className="hover:bg-gray-50">
                    <td className="w-10 px-1 py-0.5 text-xs font-medium text-gray-900 bg-gray-50 border border-gray-300">
                      <div className="flex items-center gap-0.5">
                        {getTimeIcon(timeIndex)}
                        <span className="text-xs">{timeSlot}</span>
                      </div>
                    </td>
                    {days.map((day, dayIndex) => {
                      const isSelected = isSlotSelected(dayIndex, timeIndex);
                      return (
                        <td key={`${day}-${timeIndex}`} className="w-6 px-0 py-0 border border-gray-300">
                          <button
                            type="button"
                            onClick={() => handleTimeSlotClick(dayIndex, timeIndex)}
                            className={`w-full h-4 border-0 transition-all duration-200 text-xs font-medium ${getSlotClassName(isSelected)} ${readOnly || !isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                            title={`${day} ${timeSlot}`}
                            disabled={readOnly || !isEditing}
                          >
                            {isSelected && <CheckCircle className="w-2 h-2 mx-auto" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 헤더가 없을 때 - 시간대 선택 그리드만 표시 */}
      {!title && !description && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="w-10 px-1 py-1 text-left text-xs font-semibold text-gray-900 border border-gray-300">
                    시간
                  </th>
                  {days.map((day, index) => (
                    <th key={day} className="w-6 px-0.5 py-1 text-center text-xs font-semibold text-gray-900 border border-gray-300">
                      <div className={`${index >= 5 ? 'text-red-600' : ''}`}>
                        {day}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlotsList.map((timeSlot, timeIndex) => (
                  <tr key={timeIndex} className="hover:bg-gray-50">
                    <td className="w-10 px-1 py-0.5 text-xs font-medium text-gray-900 bg-gray-50 border border-gray-300">
                      <div className="flex items-center gap-0.5">
                        {getTimeIcon(timeIndex)}
                        <span className="text-xs">{timeSlot}</span>
                      </div>
                    </td>
                    {days.map((day, dayIndex) => {
                      const isSelected = isSlotSelected(dayIndex, timeIndex);
                      return (
                        <td key={`${day}-${timeIndex}`} className="w-6 px-0 py-0 border border-gray-300">
                          <button
                            type="button"
                            onClick={() => handleTimeSlotClick(dayIndex, timeIndex)}
                            className={`w-full h-4 border-0 transition-all duration-200 text-xs font-medium ${getSlotClassName(isSelected)} ${readOnly || !isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                            title={`${day} ${timeSlot}`}
                            disabled={readOnly || !isEditing}
                          >
                            {isSelected && <CheckCircle className="w-2 h-2 mx-auto" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


    </div>
  );
};

export default UnifiedScheduleGrid;

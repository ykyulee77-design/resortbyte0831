import React, { useState, useEffect } from 'react';
import { TimeSlot } from '../types';

interface ScheduleGridProps {
  selectedTimeSlots: TimeSlot[];
  onSave: (timeSlots: TimeSlot[]) => void;
  onCancel: () => void;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ selectedTimeSlots, onSave, onCancel }) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(selectedTimeSlots);
  const [saving, setSaving] = useState(false);

  // Update internal state when props change
  useEffect(() => {
    setTimeSlots(selectedTimeSlots);
  }, [selectedTimeSlots]);

  const days = ['월', '화', '수', '목', '금', '토', '일'];
  
  // 24시간을 1시간 단위로 설정
  const timeSlotsList = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    const nextHour = ((i + 1) % 24).toString().padStart(2, '0');
    return `${hour}:00-${nextHour}:00`;
  });

  const handleTimeSlotClick = (dayOfWeek: number, timeSlotIndex: number) => {
    const startHour = timeSlotIndex;
    const endHour = (timeSlotIndex + 1) % 24;

    const existingSlot = timeSlots.find(
      slot => slot.day === dayOfWeek && slot.start === startHour && slot.end === endHour,
    );

    if (existingSlot) {
      // 우선순위 변경: 1 (high) -> 2 (low) -> none
      if (existingSlot.priority === 1) {
        setTimeSlots(prev => prev.map(slot =>
          slot.day === dayOfWeek && slot.start === startHour && slot.end === endHour
            ? { ...slot, priority: 2 }
            : slot,
        ));
      } else if (existingSlot.priority === 2) {
        setTimeSlots(prev => prev.filter(slot =>
          !(slot.day === dayOfWeek && slot.start === startHour && slot.end === endHour),
        ));
      }
    } else {
      // 새로운 슬롯 추가 (기본값: 1 - high)
      setTimeSlots(prev => [...prev, { 
        day: dayOfWeek as any, 
        start: startHour, 
        end: endHour, 
        priority: 1,
        startTime: `${startHour.toString().padStart(2, '0')}:00`,
        endTime: `${endHour.toString().padStart(2, '0')}:00`,
      }]);
    }
  };

  const getSlotStatus = (dayOfWeek: number, timeSlotIndex: number) => {
    const startHour = timeSlotIndex;
    const endHour = (timeSlotIndex + 1) % 24;
    const slot = timeSlots.find(
      s => s.day === dayOfWeek && s.start === startHour && s.end === endHour,
    );
    return slot?.priority || 'none';
  };

  const getSlotClassName = (status: number | string) => {
    switch (status) {
    case 1:
      return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm';
    case 2:
      return 'bg-gradient-to-br from-blue-200 to-blue-300 text-blue-800 hover:from-blue-300 hover:to-blue-400 shadow-sm';
    default:
      return 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800';
    }
  };

  const getSlotText = (status: number | string) => {
    switch (status) {
    case 1:
      return '매우 선호';
    case 2:
      return '선호';
    default:
      return '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(timeSlots);
    } finally {
      setSaving(false);
    }
  };

  const getTimeSlotText = (slot: TimeSlot) => {
    const start = slot.start || 0;
    const end = slot.end || 0;
    const startHour = start.toString().padStart(2, '0');
    const endHour = end.toString().padStart(2, '0');
    return `${startHour}:00-${endHour}:00`;
  };

  // 시간대를 6개씩 그룹화하여 표시 (4행 x 6열)
  const timeSlotGroups = [];
  for (let i = 0; i < timeSlotsList.length; i += 6) {
    timeSlotGroups.push(timeSlotsList.slice(i, i + 6));
  }

  return (
    <div className="space-y-6">
      {/* 시간대 선택 그리드 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">근무시간 선택 (24시간)</h4>
          <p className="text-sm text-gray-600">
            클릭하여 선호하는 시간대를 선택하세요. 
            <span className="font-medium text-blue-600"> 파란색</span>은 매우 선호, 
            <span className="font-medium text-blue-500"> 연한 파란색</span>은 선호를 나타냅니다.
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  시간대
                </th>
                {days.map((day, index) => (
                  <th key={day} className="px-2 py-4 text-center text-sm font-semibold text-gray-900 border-b border-gray-200">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlotGroups.map((group, groupIndex) => (
                <tr key={groupIndex} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 bg-gray-50">
                    <div className="space-y-1">
                      {group.map((timeSlot, timeIndex) => (
                        <div key={timeIndex} className="text-xs">
                          {timeSlot}
                        </div>
                      ))}
                    </div>
                  </td>
                  {days.map((day, dayIndex) => (
                    <td key={`${day}-${groupIndex}`} className="px-1 py-3">
                      <div className="space-y-1">
                        {group.map((timeSlot, timeIndex) => {
                          const actualTimeIndex = groupIndex * 6 + timeIndex;
                          const status = getSlotStatus(dayIndex, actualTimeIndex);
                          return (
                            <button
                              key={timeIndex}
                              onClick={() => handleTimeSlotClick(dayIndex, actualTimeIndex)}
                              className={`w-full h-8 rounded transition-all duration-200 text-xs font-medium ${getSlotClassName(status)} transform hover:scale-105 active:scale-95`}
                              title={timeSlot}
                            >
                              {getSlotText(status)}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 선택된 시간대 요약 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
        <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-blue-700">✓</span>
          </div>
          선택된 시간대 요약
        </h4>
        <div className="space-y-3">
          {days.map((day, dayIndex) => {
            const daySlots = timeSlots.filter(slot => slot.day === dayIndex);
            if (daySlots.length === 0) return null;

            const highPriority = daySlots.filter(slot => slot.priority === 1);
            const lowPriority = daySlots.filter(slot => slot.priority === 2);

            return (
              <div key={day} className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-blue-900">{day}</span>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    {daySlots.length}개 선택
                  </span>
                </div>
                <div className="space-y-1">
                  {highPriority.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-blue-700 font-medium">
                        매우 선호: {highPriority.map(slot => getTimeSlotText(slot)).join(', ')}
                      </span>
                    </div>
                  )}
                  {lowPriority.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
                      <span className="text-sm text-blue-600">
                        선호: {lowPriority.map(slot => getTimeSlotText(slot)).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {timeSlots.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-blue-400">⏰</span>
              </div>
              <p className="text-blue-600 text-sm font-medium">아직 선택된 시간대가 없습니다.</p>
              <p className="text-blue-500 text-xs mt-1">위의 시간대를 클릭하여 선호하는 시간을 설정해보세요!</p>
            </div>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-4">
        <button
          onClick={onCancel}
          className="px-8 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              저장 중...
            </div>
          ) : (
            '저장하기'
          )}
        </button>
      </div>
    </div>
  );
};

export default ScheduleGrid;

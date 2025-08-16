import React, { useState } from 'react';
import { TimeSlot } from '../types';

interface ScheduleDisplayProps {
  schedules: TimeSlot[];
  compact?: boolean;
  maxVisible?: number;
  showDetail?: boolean;
}

const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ 
  schedules, 
  compact = false,
  maxVisible = 3,
  showDetail = false
}) => {
  const [showAll, setShowAll] = useState(false);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // 시간대가 선택되었는지 확인
  const isTimeSlotSelected = (day: number, hour: number): boolean => {
    return schedules.some(slot => 
      slot.day === day && slot.start <= hour && slot.end > hour
    );
  };

  // 시간대의 우선순위 확인
  const getTimeSlotPriority = (day: number, hour: number): number => {
    const slot = schedules.find(s => 
      s.day === day && s.start <= hour && s.end > hour
    );
    return slot?.priority || 0;
  };

  // 선택된 시간대 요약
  const getSelectedSummary = () => {
    const totalHours = schedules.length;
    const priority1Hours = schedules.filter(slot => slot.priority === 1).length;
    const priority2Hours = schedules.filter(slot => slot.priority === 2).length;

    return {
      totalHours,
      priority1Hours,
      priority2Hours
    };
  };

  // 스케줄을 우선순위별로 그룹화하고 정렬
  const groupSchedulesByPriority = () => {
    const priority1Slots = schedules.filter(slot => slot.priority === 1);
    const priority2Slots = schedules.filter(slot => slot.priority === 2);
    
    // 1순위가 먼저, 2순위가 나중에 오도록 정렬
    return [...priority1Slots, ...priority2Slots];
  };

  const sortedSchedules = groupSchedulesByPriority();
  const visibleSchedules = showAll ? sortedSchedules : sortedSchedules.slice(0, maxVisible);
  const hasMore = sortedSchedules.length > maxVisible;
  const summary = getSelectedSummary();

  // 스케줄을 요일별로 그룹화
  const groupSchedulesByDay = (schedules: TimeSlot[]) => {
    const grouped: { [key: number]: TimeSlot[] } = {};
    schedules.forEach(slot => {
      if (!grouped[slot.day]) {
        grouped[slot.day] = [];
      }
      grouped[slot.day].push(slot);
    });
    return grouped;
  };

  const groupedSchedules = groupSchedulesByDay(visibleSchedules);

  if (compact && !showDetail) {
    // 컴팩트 모드: 작은 스케줄 표시
    return (
      <div className="space-y-2">
        <div className="text-xs text-gray-600">
          총 {summary.totalHours}시간
          {summary.priority1Hours > 0 && ` (1순위: ${summary.priority1Hours}시간)`}
          {summary.priority2Hours > 0 && ` (2순위: ${summary.priority2Hours}시간)`}
        </div>
        
        <div className="border border-gray-200 rounded overflow-hidden">
          {/* 헤더 */}
          <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200">
            <div className="p-1 text-center text-xs font-medium text-gray-600"></div>
            {days.map((day) => (
              <div key={day} className="p-1 text-center text-xs font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* 시간대별 행 (6시간씩 그룹화) */}
          {[0, 6, 12, 18].map((startHour) => (
            <div key={startHour} className="grid grid-cols-8 border-b border-gray-200 last:border-b-0">
              {/* 시간 라벨 */}
              <div className="p-1 text-center text-xs text-gray-500 bg-gray-50 border-r border-gray-200">
                {startHour.toString().padStart(2, '0')}-
                {(startHour + 5).toString().padStart(2, '0')}
              </div>
              
              {/* 각 요일의 시간대 */}
              {days.map((_, dayIndex) => {
                const hasSelection = Array.from({ length: 6 }, (_, i) => startHour + i)
                  .some(hour => isTimeSlotSelected(dayIndex, hour));
                const priority = Array.from({ length: 6 }, (_, i) => startHour + i)
                  .map(hour => getTimeSlotPriority(dayIndex, hour))
                  .filter(p => p > 0)[0] || 0;
                
                return (
                  <div
                    key={`${dayIndex}-${startHour}`}
                    className={`
                      p-1 border-r border-gray-200 last:border-r-0
                      ${hasSelection 
                        ? priority === 1 
                          ? 'bg-blue-500' 
                          : 'bg-blue-300'
                        : 'bg-white'
                      }
                    `}
                  >
                    <div className="w-full h-4 flex items-center justify-center">
                      {hasSelection && (
                        <div className={`
                          w-2 h-2 rounded-full
                          ${priority === 1 ? 'bg-white' : 'bg-blue-700'}
                        `} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* 더보기/접기 버튼 */}
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            {showAll ? '접기' : `더보기 (${sortedSchedules.length - maxVisible}개 더)`}
          </button>
        )}
      </div>
    );
  }

  // 전체 모드: 모든 시간대 표시
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        총 {summary.totalHours}시간
        {summary.priority1Hours > 0 && ` (1순위: ${summary.priority1Hours}시간)`}
        {summary.priority2Hours > 0 && ` (2순위: ${summary.priority2Hours}시간)`}
      </div>
      
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {/* 헤더 */}
        <div className="grid grid-cols-8 bg-gray-100 border-b border-gray-300">
          <div className="p-2 text-center text-sm font-medium text-gray-700"></div>
          {days.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* 시간대별 행 */}
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-200 last:border-b-0">
            {/* 시간 라벨 */}
            <div className="p-2 text-center text-xs text-gray-500 bg-gray-50 border-r border-gray-200">
              {hour.toString().padStart(2, '0')}:00
            </div>
            
            {/* 각 요일의 시간대 */}
            {days.map((_, dayIndex) => {
              const isSelected = isTimeSlotSelected(dayIndex, hour);
              const priority = getTimeSlotPriority(dayIndex, hour);
              
              return (
                <div
                  key={`${dayIndex}-${hour}`}
                  className={`
                    p-1 border-r border-gray-200 last:border-r-0
                    ${isSelected 
                      ? priority === 1 
                        ? 'bg-blue-500' 
                        : 'bg-blue-300'
                      : 'bg-white'
                    }
                  `}
                >
                  <div className="w-full h-6 flex items-center justify-center">
                    {isSelected && (
                      <div className={`
                        w-3 h-3 rounded-full
                        ${priority === 1 ? 'bg-white' : 'bg-blue-700'}
                      `} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 더보기/접기 버튼 */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          {showAll ? '접기' : `더보기 (${sortedSchedules.length - maxVisible}개 더)`}
        </button>
      )}
    </div>
  );
};

export default ScheduleDisplay;

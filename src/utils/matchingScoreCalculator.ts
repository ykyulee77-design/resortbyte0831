import { TimeSlot } from '../types';

export interface MatchingScoreResult {
  score: number;
  matchedSlots: number;
  totalSlots: number;
  details: {
    day: number;
    matched: number;
    total: number;
    percentage: number;
  }[];
}

export const calculateMatchingScore = (
  workerAvailabilities: TimeSlot[],
  jobRequirements: TimeSlot[],
): MatchingScoreResult => {
  if (workerAvailabilities.length === 0 || jobRequirements.length === 0) {
    return {
      score: 0,
      matchedSlots: 0,
      totalSlots: jobRequirements.length,
      details: [],
    };
  }

  let totalMatched = 0;
  const details: { day: number; matched: number; total: number; percentage: number }[] = [];

  // 요일별로 매칭 점수 계산
  for (let day = 0; day < 7; day++) {
    const workerSlots = workerAvailabilities.filter(slot => slot.day === day);
    const jobSlots = jobRequirements.filter(slot => slot.day === day);
    
    if (jobSlots.length === 0) continue;

    let dayMatched = 0;
    
    jobSlots.forEach(jobSlot => {
      // 근무자가 해당 시간대에 가능한지 확인
      const hasMatchingSlot = workerSlots.some(workerSlot => {
        // 시간대가 겹치는지 확인
        const workerStart = workerSlot.start || 0;
        const workerEnd = workerSlot.end || 0;
        const jobStart = jobSlot.start || 0;
        const jobEnd = jobSlot.end || 0;
        const timeOverlap = !(workerEnd <= jobStart || workerStart >= jobEnd);
        
        return timeOverlap;
      });
      
      if (hasMatchingSlot) {
        dayMatched++;
        totalMatched++;
      }
    });

    const dayPercentage = (dayMatched / jobSlots.length) * 100;
    details.push({
      day,
      matched: dayMatched,
      total: jobSlots.length,
      percentage: dayPercentage,
    });
  }

  const totalScore = (totalMatched / jobRequirements.length) * 100;

  return {
    score: Math.round(totalScore),
    matchedSlots: totalMatched,
    totalSlots: jobRequirements.length,
    details,
  };
};

export const calculateTimeOverlap = (
  workerSlot: TimeSlot,
  jobSlot: TimeSlot,
): boolean => {
  if (workerSlot.day === jobSlot.day) {
    const workerStart = workerSlot.start || 0;
    const workerEnd = workerSlot.end || 0;
    const jobStart = jobSlot.start || 0;
    const jobEnd = jobSlot.end || 0;
    
    const timeOverlap = !(workerEnd <= jobStart || workerStart >= jobEnd);
    return timeOverlap;
  }
  return false;
};

export const getMatchingScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600 bg-green-100';
  if (score >= 60) return 'text-yellow-600 bg-yellow-100';
  if (score >= 40) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
};

export const getMatchingScoreText = (score: number): string => {
  if (score >= 80) return '매우 높음';
  if (score >= 60) return '높음';
  if (score >= 40) return '보통';
  if (score >= 20) return '낮음';
  return '매우 낮음';
};

export const getDayName = (day: number): string => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[day];
};

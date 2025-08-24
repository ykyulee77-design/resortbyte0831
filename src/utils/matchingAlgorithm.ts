interface WorkerAvailability {
  id: string;
  dayOfWeek: number;
  timeSlot: number; // 0-23 (24시간 단위)
  priority: string;
}

interface WorkSchedule {
  dayOfWeek: number;
  timeSlot: number; // 0-23 (24시간 단위)
}

export const calculateMatchingScore = (
  workerAvailabilities: WorkerAvailability[],
  workSchedule: WorkSchedule[],
): number => {
  // Add defensive check for undefined or null inputs
  if (!workerAvailabilities || !workSchedule || !workerAvailabilities.length || !workSchedule.length) {
    return 0;
  }

  let totalScore = 0;
  let maxPossibleScore = 0;

  workSchedule.forEach(schedule => {
    const matchingAvailability = workerAvailabilities.find(
      availability =>
        availability.dayOfWeek === schedule.dayOfWeek &&
        availability.timeSlot === schedule.timeSlot,
    );

    if (matchingAvailability) {
      // 우선순위에 따른 점수 계산
      const priorityScore = matchingAvailability.priority === 'high' ? 1.0 : 0.7;
      totalScore += priorityScore;
    }

    maxPossibleScore += 1.0;
  });

  return maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
};

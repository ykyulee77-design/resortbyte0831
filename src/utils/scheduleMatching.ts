import { WorkerAvailability, TimeSlot } from '../types';

export const calculateMatchingScore = (
  workerAvailabilities: WorkerAvailability[],
  workTypeSchedules: TimeSlot[],
): number => {
  if (!workerAvailabilities.length || !workTypeSchedules.length) {
    return 0;
  }

  let totalScore = 0;
  const priority1Weight = 2;
  const priority2Weight = 1;

  workTypeSchedules.forEach(schedule => {
    const start = schedule.start || 0;
    const end = schedule.end || 0;
    for (let hour = start; hour < end; hour++) {
      const availability = workerAvailabilities.find(
        wa => wa.day === schedule.day && wa.hour === hour,
      );

      if (availability) {
        const weight = availability.priority === 1 ? priority1Weight : priority2Weight;
        totalScore += weight;
      }
    }
  });

  return totalScore;
};

export const convertAvailabilitiesToTimeSlots = (
  workerAvailabilities: WorkerAvailability[],
): TimeSlot[] => {
  const timeSlots: TimeSlot[] = [];
  const availabilityMap = new Map<string, number[]>();

  workerAvailabilities.forEach(availability => {
    const key = `${availability.day}-${availability.hour}`;
    if (!availabilityMap.has(key)) {
      availabilityMap.set(key, []);
    }
    availabilityMap.get(key)!.push(availability.priority);
  });

  availabilityMap.forEach((priorities, key) => {
    const [dayStr, hourStr] = key.split('-');
    const hour = parseInt(hourStr);
    const maxPriority = Math.max(...priorities) as 1 | 2;
    
    timeSlots.push({
      day: dayStr as any,
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
      start: hour,
      end: hour + 1,
      priority: maxPriority,
    });
  });

  return timeSlots;
};

export const convertTimeSlotsToAvailabilities = (
  timeSlots: TimeSlot[],
  workerId: string,
): Omit<WorkerAvailability, 'id' | 'createdAt'>[] => {
  const availabilities: Omit<WorkerAvailability, 'id' | 'createdAt'>[] = [];

  timeSlots.forEach(slot => {
    const start = slot.start || 0;
    const end = slot.end || 0;
    for (let hour = start; hour < end; hour++) {
      availabilities.push({
        workerId,
        day: slot.day,
        hour,
        priority: slot.priority || 1,
      });
    }
  });

  return availabilities;
};

export const calculateMatchPercentage = (
  matchScore: number,
  totalHours: number,
): number => {
  if (totalHours === 0) return 0;
  return Math.round((matchScore / totalHours) * 100);
};

export const getMatchQuality = (matchPercentage: number): string => {
  if (matchPercentage >= 90) return 'excellent';
  if (matchPercentage >= 75) return 'good';
  if (matchPercentage >= 50) return 'fair';
  if (matchPercentage >= 25) return 'poor';
  return 'very_poor';
};

export const getMatchQualityColor = (matchQuality: string): string => {
  switch (matchQuality) {
  case 'excellent':
    return 'bg-green-100 text-green-800';
  case 'good':
    return 'bg-blue-100 text-blue-800';
  case 'fair':
    return 'bg-yellow-100 text-yellow-800';
  case 'poor':
    return 'bg-orange-100 text-orange-800';
  case 'very_poor':
    return 'bg-red-100 text-red-800';
  default:
    return 'bg-gray-100 text-gray-800';
  }
};

export const formatSchedule = (schedules: TimeSlot[]): string => {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayGroups = new Map<string | number, TimeSlot[]>();

  schedules.forEach(schedule => {
    if (!dayGroups.has(schedule.day)) {
      dayGroups.set(schedule.day, []);
    }
    dayGroups.get(schedule.day)!.push(schedule);
  });

  const formattedParts: string[] = [];
  dayGroups.forEach((slots, day) => {
    const sortedSlots = slots.sort((a, b) => (a.start || 0) - (b.start || 0));
    const mergedSlots = mergeConsecutiveSlots(sortedSlots);
    
    const timeStrings = mergedSlots.map(slot => 
      `${(slot.start || 0).toString().padStart(2, '0')}:00-${(slot.end || 0).toString().padStart(2, '0')}:00`,
    );
    
    const dayIndex = typeof day === 'number' ? day : getDayIndex(day as string);
    formattedParts.push(`${dayNames[dayIndex]} ${timeStrings.join(', ')}`);
  });

  return formattedParts.join(', ');
};

const getDayIndex = (day: string): number => {
  const dayMap: { [key: string]: number } = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6,
  };
  return dayMap[day] || 0;
};

const mergeConsecutiveSlots = (slots: TimeSlot[]): TimeSlot[] => {
  if (slots.length === 0) return [];

  const merged: TimeSlot[] = [];
  let current = { ...slots[0] };

  for (let i = 1; i < slots.length; i++) {
    const currentEnd = current.end || 0;
    const nextStart = slots[i].start || 0;
    
    if (nextStart === currentEnd) {
      current.end = slots[i].end || 0;
    } else {
      merged.push(current);
      current = { ...slots[i] };
    }
  }

  merged.push(current);
  return merged;
};

export const getAvailabilitySummary = (workerAvailabilities: WorkerAvailability[]) => {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const summary = {
    totalHours: workerAvailabilities.length,
    priority1Hours: workerAvailabilities.filter(wa => wa.priority === 1).length,
    priority2Hours: workerAvailabilities.filter(wa => wa.priority === 2).length,
    daysAvailable: new Set(workerAvailabilities.map(wa => wa.day)).size,
    dayBreakdown: dayNames.map((day, index) => ({
      day,
      hours: workerAvailabilities.filter(wa => wa.day === index || wa.day === getDayName(index)).length,
    })),
  };

  return summary;
};

const getDayName = (index: number): string => {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayNames[index] || 'sunday';
};

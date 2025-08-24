import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp, 
} from 'firebase/firestore';
import { db } from '../firebase';
import { WorkType, WorkerAvailability, TimeSlot, MatchingResult } from '../types';
import { calculateMatchingScore } from './scheduleMatching';

// WorkType 관련 서비스
export const workTypeService = {
  // WorkType 생성
  async createWorkType(workType: Omit<WorkType, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkType> {
    const docRef = await addDoc(collection(db, 'workTypes'), {
      ...workType,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // 생성된 문서를 바로 가져와서 반환
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as WorkType;
    }
    
    // fallback: 기본 객체 반환 (ID는 반드시 포함)
    return {
      id: docRef.id,
      ...workType,
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
    } as WorkType;
  },

  // WorkType 업데이트
  async updateWorkType(id: string, updates: Partial<WorkType>): Promise<void> {
    const docRef = doc(db, 'workTypes', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  // WorkType 삭제
  async deleteWorkType(id: string): Promise<void> {
    const docRef = doc(db, 'workTypes', id);
    await deleteDoc(docRef);
  },

  // 사용자의 WorkType 목록 조회
  async getWorkTypesByEmployer(employerId: string): Promise<WorkType[]> {
    try {
      console.log('getWorkTypesByEmployer 호출됨, employerId:', employerId);
      
      // 복합 인덱스가 빌드 중일 때를 대비해 단순 쿼리 사용
      const q = query(
        collection(db, 'workTypes'),
        where('employerId', '==', employerId),
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Firebase 쿼리 결과, 문서 수:', querySnapshot.docs.length);
      
      const workTypes = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('문서 데이터:', { id: doc.id, employerId: data.employerId, name: data.name });
        return {
          id: doc.id,
          ...data,
        };
      }) as WorkType[];
      
      console.log('매핑된 workTypes:', workTypes);
      
      // 클라이언트에서 필터링 및 정렬
      const filteredAndSorted = workTypes
        .filter(wt => wt.isActive !== false) // isActive가 true이거나 undefined인 경우
        .sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 
            (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0);
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 
            (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0);
          return bTime - aTime; // 최신순
        });
      
      console.log('필터링 및 정렬된 workTypes:', filteredAndSorted);
      return filteredAndSorted;
    } catch (error) {
      console.error('WorkType 조회 실패:', error);
      return [];
    }
  },

  // WorkType 상세 조회
  async getWorkTypeById(id: string): Promise<WorkType | null> {
    const docRef = doc(db, 'workTypes', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as WorkType;
    }
    
    return null;
  },
};

// WorkerAvailability 관련 서비스
export const workerAvailabilityService = {
  // 가용 시간 저장 (기존 데이터 삭제 후 새로 저장)
  async saveWorkerAvailabilities(
    workerId: string, 
    availabilities: Omit<WorkerAvailability, 'id' | 'createdAt'>[],
  ): Promise<void> {
    // 기존 가용 시간 삭제
    const existingQuery = query(
      collection(db, 'workerAvailabilities'),
      where('workerId', '==', workerId),
    );
    const existingDocs = await getDocs(existingQuery);
    
    // 새로운 가용 시간 추가
    for (const availability of availabilities) {
      await addDoc(collection(db, 'workerAvailabilities'), {
        ...availability,
        createdAt: serverTimestamp(),
      });
    }
  },

  // 사용자의 가용 시간 조회
  async getWorkerAvailabilities(workerId: string): Promise<WorkerAvailability[]> {
    const q = query(
      collection(db, 'workerAvailabilities'),
      where('workerId', '==', workerId),
      orderBy('day'),
      orderBy('hour'),
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as WorkerAvailability[];
  },

  // 가용 시간 삭제
  async deleteWorkerAvailabilities(workerId: string): Promise<void> {
    const q = query(
      collection(db, 'workerAvailabilities'),
      where('workerId', '==', workerId),
    );
    const querySnapshot = await getDocs(q);
    
    for (const doc of querySnapshot.docs) {
      await deleteDoc(doc.ref);
    }
  },
};

// 매칭 관련 서비스
export const matchingService = {
  // 구직자와 일자리 매칭 계산
  async calculateMatchingResults(
    workerId: string, 
    jobPosts: any[],
  ): Promise<MatchingResult[]> {
    // 작업자의 가용 시간 조회
    const availabilitiesQuery = query(
      collection(db, 'workerAvailabilities'),
      where('workerId', '==', workerId),
    );
    
    const availabilitiesSnapshot = await getDocs(availabilitiesQuery);
    const availabilities = availabilitiesSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as WorkerAvailability[];

    const results: MatchingResult[] = [];

    // 각 공고에 대해 매칭 점수 계산
    for (const jobPost of jobPosts) {
      if (jobPost.scheduleType === 'smart_matching' && jobPost.workTypes) {
        for (const workType of jobPost.workTypes) {
          const matchScore = calculateMatchingScore(availabilities, workType.schedules);
          
          if (matchScore > 0) {
            const totalHours = workType.schedules.reduce((sum: number, slot: TimeSlot) => 
              sum + ((slot.end || 0) - (slot.start || 0)), 0,
            );
            
            results.push({
              jobPostId: jobPost.id,
              workTypeId: workType.id,
              workTypeName: workType.name,
              matchScore,
              detailedScore: {
                priority1Matches: availabilities.filter(wa => wa.priority === 1).length,
                priority2Matches: availabilities.filter(wa => wa.priority === 2).length,
                totalPossibleMatches: totalHours,
                overlapHours: matchScore,
              },
              company: {
                name: jobPost.employerName,
                location: jobPost.location,
              },
              schedulePreview: workType.schedules,
            } as MatchingResult);
          }
        }
      }
    }

    // 매칭 점수 순으로 정렬
    return results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  },

  // 추천 일자리 조회
  async getRecommendedJobs(
    workerId: string,
    limit = 10,
  ): Promise<MatchingResult[]> {
    // 활성화된 공고 조회
    const jobPostsQuery = query(
      collection(db, 'jobPosts'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
    );
    
    const jobPostsSnapshot = await getDocs(jobPostsQuery);
    const jobPosts = jobPostsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 매칭 결과 계산
    const matchingResults = await this.calculateMatchingResults(workerId, jobPosts);
    
    return matchingResults.slice(0, limit);
  },
};

// 유틸리티 함수들
export const scheduleUtils = {
  // TimeSlot을 WorkerAvailability로 변환
  convertTimeSlotsToAvailabilities(
    timeSlots: TimeSlot[], 
    workerId: string,
  ): Omit<WorkerAvailability, 'id' | 'createdAt'>[] {
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
  },

  // WorkerAvailability를 TimeSlot으로 변환
  convertAvailabilitiesToTimeSlots(
    availabilities: WorkerAvailability[],
  ): TimeSlot[] {
    const timeSlots: TimeSlot[] = [];
    const availabilityMap = new Map<string, number[]>(); // day-hour -> priorities

    // 같은 시간대의 가용 시간들을 그룹화
    availabilities.forEach(availability => {
      const key = `${availability.day}-${availability.hour}`;
      if (!availabilityMap.has(key)) {
        availabilityMap.set(key, []);
      }
      availabilityMap.get(key)!.push(availability.priority);
    });

    // 연속된 시간대를 TimeSlot으로 변환
    availabilityMap.forEach((priorities, key) => {
      const [dayStr, hourStr] = key.split('-');
      const hour = parseInt(hourStr);
      const maxPriority = Math.max(...priorities);
      
      timeSlots.push({
        day: dayStr as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
        start: hour,
        end: hour + 1,
        priority: maxPriority as 1 | 2,
      });
    });

    return timeSlots;
  },

  // 스케줄 포맷팅
  formatSchedule(schedules: TimeSlot[]): string {
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayGroups = new Map<string | number, TimeSlot[]>();

    // 요일별로 그룹화
    schedules.forEach(schedule => {
      if (!dayGroups.has(schedule.day)) {
        dayGroups.set(schedule.day, []);
      }
      dayGroups.get(schedule.day)!.push(schedule);
    });

    // 각 요일의 시간대를 정렬하고 병합
    const formattedParts: string[] = [];
    dayGroups.forEach((slots, day) => {
      const sortedSlots = slots.sort((a, b) => (a.start || 0) - (b.start || 0));
      const mergedSlots = this.mergeConsecutiveSlots(sortedSlots);
      
      const timeStrings = mergedSlots.map(slot => 
        `${(slot.start || 0).toString().padStart(2, '0')}:00-${(slot.end || 0).toString().padStart(2, '0')}:00`,
      );
      
      const dayIndex = typeof day === 'number' ? day : this.getDayIndex(day as string);
      formattedParts.push(`${dayNames[dayIndex]} ${timeStrings.join(', ')}`);
    });

    return formattedParts.join(', ');
  },

  // 요일 문자열을 인덱스로 변환
  getDayIndex(day: string): number {
    const dayMap: { [key: string]: number } = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6,
    };
    return dayMap[day] || 0;
  },

  // 연속된 시간대 병합
  mergeConsecutiveSlots(slots: TimeSlot[]): TimeSlot[] {
    if (slots.length === 0) return [];

    const merged: TimeSlot[] = [];
    let current = { ...slots[0] };

    for (let i = 1; i < slots.length; i++) {
      const currentEnd = current.end || 0;
      const nextStart = slots[i].start || 0;
      
      if (nextStart === currentEnd) {
        // 연속된 시간대인 경우 병합
        current.end = slots[i].end || 0;
      } else {
        // 연속되지 않은 경우 현재 슬롯을 저장하고 새로운 슬롯 시작
        merged.push(current);
        current = { ...slots[i] };
      }
    }

    merged.push(current);
    return merged;
  },
};

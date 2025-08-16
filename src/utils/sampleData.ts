import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { JobPost } from '../types';

export const addSampleJobPosts = async () => {
  const sampleJobPosts: Omit<JobPost, 'id'>[] = [
    {
      employerId: 'sample-employer-1',
      employerName: '제주 리조트',
      title: '리조트 프론트 데스크 직원',
      description: '제주 리조트에서 고객 응대 및 예약 관리를 담당할 직원을 모집합니다. 친절하고 책임감 있는 분을 찾습니다.',
      location: '제주도',
      salary: {
        min: 18000,
        max: 22000,
        type: 'hourly'
      },
      requirements: [
        '고등학교 졸업 이상',
        '컴퓨터 활용 능력 우수자',
        '고객 응대 경험 우대',
        '제주도 거주자 우대'
      ],
      benefits: [
        '4대보험',
        '퇴직연금',
        '식대 지원',
        '교통비 지원',
        '연차휴가'
      ],
      workSchedule: {
        days: ['월', '화', '수', '목', '금', '토', '일'],
        hours: '09:00-18:00'
      },
      startDate: Timestamp.fromDate(new Date('2024-01-15')),
      endDate: Timestamp.fromDate(new Date('2024-12-31')),
      isActive: true,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      applications: []
    },
    {
      employerId: 'sample-employer-2',
      employerName: '부산 해운대 리조트',
      title: '리조트 시설 관리원',
      description: '부산 해운대 리조트의 시설 관리를 담당할 직원을 모집합니다. 정비 경험이 있는 분을 우대합니다.',
      location: '부산',
      salary: {
        min: 20000,
        max: 25000,
        type: 'hourly'
      },
      requirements: [
        '고등학교 졸업 이상',
        '시설 정비 경험 우대',
        '면허 소지자 우대',
        '부산 지역 거주자'
      ],
      benefits: [
        '4대보험',
        '퇴직연금',
        '식대 지원',
        '교통비 지원',
        '연차휴가',
        '야근 수당'
      ],
      workSchedule: {
        days: ['월', '화', '수', '목', '금'],
        hours: '08:00-17:00'
      },
      startDate: Timestamp.fromDate(new Date('2024-02-01')),
      endDate: Timestamp.fromDate(new Date('2024-12-31')),
      isActive: true,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      applications: []
    },
    {
      employerId: 'sample-employer-3',
      employerName: '강원도 스키 리조트',
      title: '스키장 안전요원',
      description: '강원도 스키 리조트에서 스키장 안전을 담당할 직원을 모집합니다. 스키 경험이 있는 분을 우대합니다.',
      location: '강원도',
      salary: {
        min: 22000,
        max: 28000,
        type: 'hourly'
      },
      requirements: [
        '고등학교 졸업 이상',
        '스키 경험 우대',
        '응급처치 자격증 우대',
        '강원도 거주자 우대'
      ],
      benefits: [
        '4대보험',
        '퇴직연금',
        '식대 지원',
        '숙박 지원',
        '스키 패스 제공',
        '연차휴가'
      ],
      workSchedule: {
        days: ['월', '화', '수', '목', '금', '토', '일'],
        hours: '08:00-17:00'
      },
      startDate: Timestamp.fromDate(new Date('2024-01-01')),
      endDate: Timestamp.fromDate(new Date('2024-03-31')),
      isActive: true,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      applications: []
    },
    {
      employerId: 'sample-employer-4',
      employerName: '경주 문화 리조트',
      title: '문화 프로그램 안내원',
      description: '경주 문화 리조트에서 문화 프로그램 안내 및 관리를 담당할 직원을 모집합니다. 역사에 관심이 있는 분을 우대합니다.',
      location: '경주',
      salary: {
        min: 16000,
        max: 20000,
        type: 'hourly'
      },
      requirements: [
        '고등학교 졸업 이상',
        '컴퓨터 활용 능력',
        '외국어 능력 우대',
        '경주 지역 거주자'
      ],
      benefits: [
        '4대보험',
        '퇴직연금',
        '식대 지원',
        '교통비 지원',
        '문화 프로그램 참여 혜택',
        '연차휴가'
      ],
      workSchedule: {
        days: ['월', '화', '수', '목', '금', '토'],
        hours: '09:00-18:00'
      },
      startDate: Timestamp.fromDate(new Date('2024-01-20')),
      endDate: Timestamp.fromDate(new Date('2024-12-31')),
      isActive: true,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      applications: []
    }
  ];

  try {
    console.log('샘플 공고 데이터 추가 시작...');
    
    for (const jobPost of sampleJobPosts) {
      await addDoc(collection(db, 'jobPosts'), jobPost);
      console.log('공고 추가됨:', jobPost.title);
    }
    
    console.log('모든 샘플 공고 데이터가 성공적으로 추가되었습니다.');
  } catch (error) {
    console.error('샘플 데이터 추가 실패:', error);
  }
}; 
import { Timestamp } from 'firebase/firestore';

export interface Resume {
  phone?: string;
  birth?: string;
  jobType?: string;
  career?: string;
  intro?: string;
  certs?: string[];
  photoUrl?: string;
  showEvaluations?: boolean;
  education?: string;
  expectedSalary?: number;
  availableStartDate?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'employer' | 'jobseeker' | 'admin';
  createdAt: Timestamp;
  profileImage?: string;
  phone?: string;
  location?: string;
  workplaceName?: string;
  workplaceLocation?: string;
  contactPerson?: string;
  companyInfo?: CompanyInfo;
  accommodationInfo?: AccommodationInfo;
  resume?: Resume;
}

export interface CompanyInfo {
  id: string;
  employerId: string;
  name: string;
  description: string;
  website?: string;
  industry: string;
  companySize: string;
  foundedYear?: number;
  benefits: string[];
  culture: string;
  images: string[];
  contactEmail?: string;
  contactPhone?: string;
  contactPerson?: string;
  address: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  region: string;
  dormitory: boolean;
  dormitoryFacilities: string[];
  salaryRange: string;
  environment: '도심' | '준생활권' | '외진곳';
  workTimeType?: '주간 근무타입' | '야간 근무타입' | '주말근무타입' | '주중근무타입' | '무관';
}

export interface ExternalLink {
  type: 'real_estate' | 'hotel' | 'booking' | 'review' | 'other';
  title: string;
  url: string;
  description?: string;
}

export interface AccommodationReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
  helpful?: number;
}

export interface AccommodationInfo {
  id: string;
  employerId: string;
  name: string;
  description: string;
  type: 'dormitory' | 'apartment' | 'house' | 'other';
  address: string;
  distanceFromWorkplace: string;
  capacity: number;
  currentOccupancy: number;
  roomTypes: RoomType[];
  facilities: string[];
  facilitiesOther?: string;
  monthlyRent: number;
  utilities: string[];
  images: string[];
  rules: string[];
  contactPerson: string;
  contactPhone: string;
  isAvailable: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // 새로운 필드들 추가
  deposit?: number; // 보증금
  // 객실 유형 체크박스 필드 추가
  roomTypeOptions?: {
    singleRoom?: boolean; // 1인실
    doubleRoom?: boolean; // 2인실
    tripleRoom?: boolean; // 3인실
    quadRoom?: boolean; // 4인실
    otherRoom?: boolean; // 기타
  };
  // 요금 유형 필드 추가
  paymentType?: 'free' | 'paid'; // 무료 또는 유료
  // 객실별 월세 필드 추가
  roomPrices?: {
    singleRoom?: number; // 1인실 월세 (천원 단위)
    doubleRoom?: number; // 2인실 월세 (천원 단위)
    tripleRoom?: number; // 3인실 월세 (천원 단위)
    quadRoom?: number; // 4인실 월세 (천원 단위)
    otherRoom?: number; // 기타 월세 (천원 단위)
  };
  // 기타 객실 유형 텍스트 필드 추가
  otherRoomType?: string; // 기타 객실 유형 설명
  // 부대시설 체크박스 필드 추가
  facilityOptions?: {
    parking?: boolean; // 주차장
    laundry?: boolean; // 세탁실
    kitchen?: boolean; // 공용주방
    gym?: boolean; // 체육관
    studyRoom?: boolean; // 스터디룸
    lounge?: boolean; // 휴게실
    wifi?: boolean; // 와이파이
    security?: boolean; // 보안시설
    elevator?: boolean; // 엘리베이터
    other?: boolean; // 기타
  };
  otherFacilityText?: string; // 부대시설 기타 텍스트
  // 객실시설 기타 필드 추가
  otherFacilities?: boolean; // 기타 시설 체크박스
  otherFacilitiesText?: string; // 기타 시설 텍스트
  contractPeriod?: string; // 계약기간
  contractStartDate?: string; // 계약 시작일
  contractEndDate?: string; // 계약 종료일
  moveInDate?: string; // 입주 가능일
  petAllowed?: boolean; // 반려동물 허용
  smokingAllowed?: boolean; // 흡연 허용
  parkingAvailable?: boolean; // 주차 가능
  internetIncluded?: boolean; // 인터넷 포함
  airConditioning?: boolean; // 에어컨
  heating?: boolean; // 난방
  laundry?: boolean; // 세탁기
  kitchen?: boolean; // 주방
  bathroom?: 'private' | 'shared' | 'none'; // 화장실 유형
  wifi?: boolean; // 와이파이
  tv?: boolean; // TV
  refrigerator?: boolean; // 냉장고
  bed?: boolean; // 침대
  desk?: boolean; // 책상
  closet?: boolean; // 옷장
  security?: string[]; // 보안 시설
  nearbyFacilities?: string[]; // 주변 시설
  transportation?: string[]; // 교통편
  externalLinks?: ExternalLink[]; // 외부 링크 (부동산, 호텔 등)
  reviews?: AccommodationReview[]; // 리뷰
  averageRating?: number; // 평균 평점
  totalReviews?: number; // 총 리뷰 수
  amenities?: string[]; // 편의시설
  restrictions?: string[]; // 제한사항
  specialFeatures?: string[]; // 특별한 특징
  maintenanceContact?: string; // 관리 연락처
  emergencyContact?: string; // 비상 연락처
  checkInTime?: string; // 체크인 시간
  checkOutTime?: string; // 체크아웃 시간
  cancellationPolicy?: string; // 취소 정책
  houseRules?: string[]; // 숙소 규칙
  cleaningService?: boolean; // 청소 서비스
  cleaningFrequency?: string; // 청소 빈도
  mealService?: boolean; // 식사 서비스
  mealOptions?: string[]; // 식사 옵션
  noiseLevel?: 'quiet' | 'moderate' | 'lively'; // 소음 수준
  neighborhood?: string; // 주변 환경
  safetyRating?: number; // 안전도 평점
  accessibility?: string[]; // 접근성
  sustainability?: string[]; // 친환경 요소
  // 비용 정보 (부대비용) 추가 필드
  utilitiesCostType?: '무료' | '실비' | '유료';
  utilitiesCostAmount?: number;
  mealCostType?: '무료' | '유료';
  mealCostAmount?: number;
  mealNote?: string; // 식사 추가 정보
  // 새로운 비용 정보 구조
  costInfo?: {
    room?: {
      type: '무료' | '유료';
      amount?: number;
      note?: string;
    };
    meal?: {
      type: '무료' | '유료';
      amount?: number;
      note?: string;
    };
    utilities?: {
      type: '무료' | '실비' | '유료';
      amount?: number;
      note?: string;
    };
    other?: {
      type: '무료' | '유료';
      amount?: number;
      note?: string;
    };
  };
}

export interface RoomType {
  type: string;
  capacity?: number;
  price: number;
  available: number;
  description: string;
  // 식사 정보 (편집 섹션 요구사항)
  mealType?: '무료' | '유료';
  mealNote?: string;
}

export interface JobPost {
  id: string;
  employerId: string;
  employerName: string;
  workplaceName?: string;
  workplaceLocation?: string;
  contactPerson?: string;
  title: string;
  jobTitle?: string; // 채용직무 필드 추가
  description: string;
  location: string;
  salary: {
    min: number;
    max: number;
    type: 'hourly' | 'daily' | 'monthly';
  };
  requirements: string[];
  benefits: string[];
  workSchedule: {
    days: string[];
    hours: string;
  };
  workTypes?: WorkType[];
  workTimeType?: '주간 근무타입' | '야간 근무타입' | '주말근무타입' | '주중근무타입' | '무관';
  scheduleType?: 'traditional' | 'flexible' | 'smart_matching';
  startDate: Timestamp;
  endDate?: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  applications: Application[];
  views?: number;
  contactInfo?: { email: string; phone: string };
  memo?: string;
}

export interface Application {
  id: string;
  jobPostId: string;
  jobseekerId: string;
  jobseekerName: string;
  status: 'pending' | 'reviewing' | 'interview_scheduled' | 'interview_completed' | 'offer_sent' | 'accepted' | 'rejected' | 'withdrawn';
  appliedAt: Date;
  message?: string;
  coverLetter?: string;
  experience?: string;
  education?: string;
  availableStartDate?: Date;
  skills?: string[];
  expectedSalary?: number;
  selectedWorkTypeIds?: string[]; // 선택된 근무타입 ID들을 배열로 변경
  updatedAt?: Date;
  employerFeedback?: string;
  employerFeedbackAt?: Date;
  jobTitle?: string;
  employerName?: string;
  location?: string;
  salary?: { min: number; max: number; type: string };
  phone?: string; // 연락처 정보 추가
  email?: string; // 이메일 정보 추가
  showEvaluations?: boolean; // 평가 노출 여부
}

export interface ApplicationTemplate {
  id: string;
  userId: string;
  name: string;
  coverLetter: string;
  experience: string;
  education: string;
  skills: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Chat {
  id: string;
  participants: string[];
  jobPostId: string;
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: Timestamp;
  isRead: boolean;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewedId: string;
  jobPostId: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'application' | 'message' | 'review' | 'system' | 'application_status';
  isRead: boolean;
  createdAt: Timestamp;
  relatedId?: string;
  applicationId?: string;
  status?: 'pending' | 'reviewing' | 'interview_scheduled' | 'interview_completed' | 'offer_sent' | 'accepted' | 'rejected' | 'withdrawn';
}

export interface WorkType {
  id: string;
  employerId: string;
  name: string;
  description?: string;
  schedules: TimeSlot[];
  hourlyWage?: number; // 시급 (원/시간)
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TimeSlot {
  day: number;
  start: number;
  end: number;
  priority?: 1 | 2;
}

export interface WorkerAvailability {
  id: string;
  workerId: string;
  day: number;
  hour: number;
  priority: 1 | 2;
  createdAt: Timestamp | Date;
}

// 긍정적 평가 시스템을 위한 새로운 타입들
export interface PositiveReview {
  id: string;
  employerId: string;
  jobseekerId: string;
  jobPostId: string;
  workTypeId?: string;
  reviewType: 'praise' | 'certification' | 'skill_recognition' | 'attitude' | 'teamwork' | 'reliability';
  category: 'service_skill' | 'communication' | 'punctuality' | 'adaptability' | 'leadership' | 'problem_solving' | 'customer_service' | 'technical_skill';
  title: string;
  description: string;
  tags: string[]; // 예: "친절함", "정확함", "창의적", "책임감"
  isPublic: boolean; // 크루 프로필에 공개할지 여부
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SkillCertification {
  id: string;
  jobseekerId: string;
  employerId: string;
  jobPostId: string;
  skillName: string;
  skillCategory: 'service' | 'technical' | 'management' | 'communication' | 'language' | 'certification';
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  description: string;
  evidence?: string; // 인증 근거 (예: "3개월간 고객 서비스 담당")
  certifiedAt: Timestamp;
  expiresAt?: Timestamp; // 만료일이 있는 경우
  isVerified: boolean;
}

export interface CrewProfile {
  id: string;
  jobseekerId: string;
  totalWorkDays: number;
  totalWorkHours: number;
  completedJobs: number;
  positiveReviews: number;
  skillCertifications: number;
  averageRating: number;
  badges: Badge[];
  skills: SkillSummary[];
  workHistory: WorkHistoryItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'service' | 'reliability' | 'skill' | 'achievement' | 'special';
  earnedAt: Timestamp;
  criteria: string; // 획득 조건
}

export interface SkillSummary {
  skillName: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  experienceCount: number; // 해당 스킬로 일한 횟수
  lastUsed: Timestamp;
  certifications: number; // 인증받은 횟수
}

export interface WorkHistoryItem {
  id: string;
  jobPostId: string;
  employerName: string;
  jobTitle: string;
  workType: string;
  startDate: Timestamp;
  endDate: Timestamp;
  totalHours: number;
  positiveReviews: number;
  skillsUsed: string[];
  isCompleted: boolean;
}

export interface MatchingResult {
  jobPostId: string;
  workTypeId: string;
  workTypeName: string;
  matchScore: number;
  detailedScore: {
    priority1Matches: number;
    priority2Matches: number;
    totalPossibleMatches: number;
    overlapHours: number;
  };
  company: {
    id: string;
    name: string;
    location: string;
  };
  schedulePreview: TimeSlot[];
}

declare global {
  interface Window {
    Kakao: {
      init: (appKey: string) => void;
      isInitialized: () => boolean;
      Link: {
        sendDefault: (options: {
          objectType: string;
          content: {
            title: string;
            description: string;
            imageUrl: string;
            link: {
              mobileWebUrl: string;
              webUrl: string;
            };
          };
          buttons: Array<{
            title: string;
            link: {
              mobileWebUrl: string;
              webUrl: string;
            };
          }>;
        }) => void;
        sendStory?: (options: any) => void;
      };
    };
  }
} 
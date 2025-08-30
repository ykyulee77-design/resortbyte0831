import { Timestamp } from 'firebase/firestore';

// 공통 타입 정의
export type DateOrTimestamp = Date | Timestamp;
export type StatusType = 'pending' | 'reviewing' | 'interview_scheduled' | 'interview_completed' | 'offer_sent' | 'accepted' | 'rejected' | 'withdrawn';

// 기본 인터페이스들
export interface BaseEntity {
  id: string;
  createdAt?: Timestamp; // 선택적으로 변경
  updatedAt?: Timestamp;
}

// RoomType 타입 추가
export interface RoomType {
  id: string;
  name: string;
  description: string;
  capacity: number;
  price: number;
  available?: number; // 추가
  facilities: string[];
  images: string[];
  isAvailable: boolean;
}

// WorkerAvailability 타입 추가
export interface WorkerAvailability {
  id?: string; // 추가
  workerId: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | 0 | 1 | 2 | 3 | 4 | 5 | 6;
  hour: number;
  priority: 1 | 2;
}

// TimeSlot 타입 수정 (start, end 속성 추가)
export interface TimeSlot {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  start?: number; // 시간 매칭을 위한 숫자 값
  end?: number;   // 시간 매칭을 위한 숫자 값
  priority?: 1 | 2; // 우선순위 추가
}

// MatchingResult 타입 수정
export interface MatchingResult extends BaseEntity {
  jobseekerId: string;
  jobPostId: string;
  workTypeId: string;
  workTypeName?: string; // 추가
  score: number;
  matchScore?: number; // 추가
  detailedScore?: {     // 추가
    priority1Matches: number;
    priority2Matches: number;
    totalPossibleMatches: number;
    overlapHours: number;
  };
  company?: {           // 추가
    name: string;
    location: string;
  };
  schedulePreview?: any; // 추가
  matchedTimeSlots: TimeSlot[];
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  employerResponse?: 'accepted' | 'rejected' | 'pending';
  jobseekerResponse?: 'accepted' | 'rejected' | 'pending';
  responseAt?: Timestamp;
}

export interface Resume {
  phone?: string;
  birth?: string;
  jobType?: string | string[];
  career?: string;
  intro?: string;
  certs?: string[];
  photoUrl?: string;
  showEvaluations?: boolean;
  education?: string;
  hourlyWage?: number;
  availableStartDate?: string;
  address?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  workType?: 'full_time' | 'part_time' | 'temporary' | 'freelance';
  workSchedule?: 'day' | 'night' | 'shift' | 'flexible';
  workDays?: 'weekdays' | 'weekends' | 'both' | 'flexible';
  travelWilling?: boolean;
  dormitoryWilling?: boolean;
  drivingLicense?: boolean;
  customerServiceExp?: boolean;
  restaurantExp?: boolean;
  languages?: string[];
  computerSkills?: string[];
  preferredTimeType?: 'general' | 'specific';
  preferredTimeSlots?: TimeSlot[];
  previousJobs?: {
    company: string;
    position: string;
    period: string;
    reason: string;
  }[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface User extends BaseEntity {
  uid: string;
  email: string;
  displayName: string;
  role: 'employer' | 'jobseeker' | 'admin';
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

export interface CompanyInfo extends BaseEntity {
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

export interface AccommodationReview extends BaseEntity {
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  helpful?: number;
  images?: string[];
}

export interface AccommodationInfo extends BaseEntity {
  employerId: string;
  name: string;
  description: string;
  address: string;
  distanceFromWorkplace?: string; // 추가
  type: 'dormitory' | 'apartment' | 'house' | 'other';
  capacity: number;
  currentOccupancy?: number; // 추가
  roomTypes?: RoomType[]; // 추가
  price: {
    monthly?: number;
    daily?: number;
    deposit?: number;
  };
  monthlyRent?: number; // 추가
  utilities?: string[]; // 추가
  facilities: string[];
  rules: string[];
  images: string[];
  contactInfo: {
    phone: string;
    email?: string;
  };
  contactPerson?: string; // 추가
  contactPhone?: string; // 추가
  availability: boolean;
  isAvailable?: boolean; // 추가
  externalLinks?: ExternalLink[];
  reviews?: AccommodationReview[];
  rating?: number;
  reviewCount?: number;
  otherFacilityText?: string; // 추가
  facilityOptions?: { // 객체 타입으로 수정
    parking?: boolean;
    laundry?: boolean;
    kitchen?: boolean;
    gym?: boolean;
    studyRoom?: boolean;
    lounge?: boolean;
    wifi?: boolean;
    security?: boolean;
    elevator?: boolean;
    other?: boolean;
  };
  // 기존 개별 속성들도 유지
  wifi?: boolean;
  tv?: boolean;
  refrigerator?: boolean;
  airConditioning?: boolean;
  laundry?: boolean;
  kitchen?: boolean;
  parkingAvailable?: boolean;
  petAllowed?: boolean;
  smokingAllowed?: boolean;
  otherFacilities?: string;
  roomTypeOptions?: {
    singleRoom?: boolean;
    doubleRoom?: boolean;
    tripleRoom?: boolean;
    quadRoom?: boolean;
    otherRoom?: boolean;
  };
  paymentType?: 'free' | 'paid';
  roomPrices?: {
    singleRoom?: number;
    doubleRoom?: number;
    tripleRoom?: number;
    quadRoom?: number;
    otherRoom?: number;
  };
  otherRoomType?: string;
}

export interface WorkType extends BaseEntity {
  employerId?: string; // 추가
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  scheduleType?: 'traditional' | 'flexible' | 'smart_matching';
  timeSlots?: TimeSlot[];
  schedules?: TimeSlot[]; // 추가
  maxWorkers?: number;
  hourlyWage?: number;
  requirements?: string[];
}

export interface JobPost extends BaseEntity {
  employerId: string;
  employerName: string;
  workplaceName?: string;
  workplaceLocation?: string;
  contactPerson?: string;
  title: string;
  jobTitle?: string;
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
  applications: Application[];
  views?: number;
  contactInfo?: { email: string; phone: string };
  memo?: string;
  recommendationScore?: number;
}

// 지원자 관리 프로세스를 위한 새로운 타입들
export interface Interview extends BaseEntity {
  applicationId: string;
  jobseekerId: string;
  employerId: string;
  scheduledAt: DateOrTimestamp;
  duration: number; // 분 단위
  location: string;
  type: 'online' | 'offline' | 'phone';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  interviewer?: string;
  meetingLink?: string; // 온라인 면접용
}

export interface InterviewResult extends BaseEntity {
  interviewId: string;
  applicationId: string;
  jobseekerId: string;
  employerId: string;
  overallRating: number; // 1-5점
  technicalSkills: number;
  communicationSkills: number;
  experience: number;
  personality: number;
  notes: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
  nextSteps?: string;
  followUpRequired?: boolean;
}

export interface ResumeReview extends BaseEntity {
  applicationId: string;
  jobseekerId: string;
  employerId: string;
  overallRating: number; // 1-5점
  experienceMatch: number;
  skillsMatch: number;
  educationMatch: number;
  notes: string;
  strengths: string[];
  concerns: string[];
  recommendation: 'proceed_to_interview' | 'reject' | 'hold';
  reviewedBy: string;
}

export interface HiringDecision extends BaseEntity {
  applicationId: string;
  jobseekerId: string;
  employerId: string;
  decision: 'offer' | 'reject' | 'hold';
  offerDetails?: {
    salary: number;
    startDate: DateOrTimestamp;
    position: string;
    benefits: string[];
    conditions: string[];
  };
  rejectionReason?: string;
  feedback?: string;
  decidedBy: string;
  offerExpiryDate?: DateOrTimestamp;
}

// Application 타입 확장
export interface Application extends BaseEntity {
  jobPostId: string;
  jobseekerId: string;
  jobseekerName: string;
  employerId?: string; // 구인자 ID 추가
  status: StatusType;
  appliedAt: DateOrTimestamp;
  message?: string;
  coverLetter?: string;
  experience?: string;
  education?: string;
  availableStartDate?: DateOrTimestamp;
  skills?: string[];
  hourlyWage?: number;
  selectedWorkTypeIds?: string[];
  employerFeedback?: string;
  employerFeedbackAt?: DateOrTimestamp;
  interviewContactInfo?: string;
  interviewDate?: string;
  jobTitle?: string;
  employerName?: string;
  location?: string;
  salary?: { min: number; max: number; type: string };
  phone?: string;
  email?: string;
  showEvaluations?: boolean;
  resume?: Resume;
  
  // 지원자 관리 프로세스 관련 필드들
  resumeReview?: ResumeReview;
  interview?: Interview;
  interviewResult?: InterviewResult;
  hiringDecision?: HiringDecision;
  processStage?: 'applied' | 'resume_reviewed' | 'interview_scheduled' | 'interviewed' | 'decision_made';
  priority?: 'high' | 'medium' | 'low';
  tags?: string[]; // '즉시채용가능', '경험풍부', '신입' 등
  
  // 확장된 공고 정보 (UI에서 사용)
  jobPost?: JobPost;
}

export interface ApplicationTemplate extends BaseEntity {
  userId: string;
  name: string;
  coverLetter: string;
  experience: string;
  education: string;
  skills: string[];
}

export interface Chat extends BaseEntity {
  participants: string[];
  jobPostId: string;
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Timestamp;
  };
}

export interface Message extends BaseEntity {
  chatId: string;
  senderId: string;
  content: string;
  timestamp: Timestamp;
  isRead: boolean;
}

export interface Review extends BaseEntity {
  reviewerId: string;
  reviewedId: string;
  jobPostId: string;
  rating: number;
  comment: string;
}

export interface Notification extends BaseEntity {
  userId: string;
  title: string;
  message: string;
  type: 'application' | 'message' | 'review' | 'system' | 'application_status';
  isRead: boolean;
  relatedId?: string;
  applicationId?: string;
  status?: StatusType;
}

export interface FavoriteJob extends BaseEntity {
  jobseekerId: string;
  jobPostId: string;
  jobTitle: string;
  employerName: string;
  location: string;
  salary: { min: number; max: number; type: string };
  memo?: string;
}

export interface JobShare extends BaseEntity {
  jobseekerId: string;
  jobPostId: string;
  shareType: 'kakao' | 'facebook' | 'link' | 'other';
  shareUrl?: string;
  shareText?: string;
  sharedAt?: Date; // 추가
  jobTitle?: string; // 추가
  employerName?: string; // 추가
  shareMethod?: string; // 추가
  sharedWith?: string; // 추가
}

export interface PositiveReview extends BaseEntity {
  reviewerId: string;
  reviewedId: string;
  jobPostId: string;
  rating: number;
  comment: string;
  tags: string[];
  isAnonymous: boolean;
  reviewerName?: string;
  reviewType?: string; // 추가
  category?: string; // 추가
  title?: string; // 추가
  description?: string; // 추가
  isPublic?: boolean; // 추가
  workTypeId?: string; // 추가
  employerId?: string; // 추가
  jobseekerId?: string; // 추가
}

export interface WorkHistory extends BaseEntity {
  jobseekerId: string;
  jobPostId: string;
  employerId: string;
  jobTitle: string;
  employerName: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  status: 'completed' | 'ongoing' | 'terminated';
  rating?: number;
  review?: string;
  hourlyWage?: number;
  totalHours?: number;
  totalEarnings?: number;
}

export interface SchedulePreference extends BaseEntity {
  jobseekerId: string;
  workTypeId: string;
  preferredDays: string[];
  preferredTimeSlots: TimeSlot[];
  priority: 'high' | 'medium' | 'low';
  isActive: boolean;
}

export interface AccommodationRecommendation extends BaseEntity {
  jobseekerId: string;
  accommodationId: string;
  score: number;
  reasons: string[];
  isViewed: boolean;
  isInterested?: boolean;
}

export interface JobRecommendation extends BaseEntity {
  jobseekerId: string;
  jobPostId: string;
  score: number;
  reasons: string[];
  isViewed: boolean;
  isInterested?: boolean;
}

export interface EvaluationStats {
  userId?: string; // 추가
  totalReviews: number;
  averageRating: number;
  positiveReviews: number;
  negativeReviews: number;
  trustLevel: 'very_high' | 'high' | 'medium' | 'low';
  rehireRate: number;
  lastWorkDate?: Date;
  totalWorkCount?: number; // 추가
  totalPositiveEvaluations?: number; // 추가
  totalNegativeEvaluations?: number; // 추가
}

export interface WorkerStats {
  totalWorkCount: number;
  positiveReviews: number;
  averageRating: number;
  lastWorkDate: Date | null;
  rehireRate: number;
  trustLevel: 'very_high' | 'high' | 'medium' | 'low';
}

// CrewProfile 타입 추가
export interface CrewProfile {
  id: string;
  name: string;
  avatar?: string;
  position: string;
  department: string;
  skills: string[];
  experience: number;
  rating: number;
  reviews: PositiveReview[];
  certifications: SkillCertification[];
  badges: Badge[];
  isAvailable: boolean;
  hourlyWage?: number;
  preferredWorkTypes: string[];
  schedule: TimeSlot[];
  completedJobs?: number; // 추가
  totalWorkHours?: number; // 추가
  positiveReviews?: number; // 추가
  skillCertifications?: number; // 추가
}

// SkillCertification 타입 추가
export interface SkillCertification {
  id: string;
  name: string;
  skillName?: string; // 추가
  issuer: string;
  issueDate: Date;
  certifiedAt?: Date; // 추가
  expiryDate?: Date;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert' | 'beginner'; // beginner 추가
  description?: string;
  evidence?: string; // 추가
}

// Badge 타입 추가
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Date;
  category: 'performance' | 'skill' | 'attendance' | 'special';
}

// MutualEvaluation 타입 추가
export interface MutualEvaluation {
  id: string;
  evaluatorId: string;
  evaluateeId: string;
  jobPostId: string;
  rating: number;
  comment: string;
  categories: {
    communication: number;
    teamwork: number;
    reliability: number;
    skill: number;
    attitude: number;
  };
  createdAt: Date;
  isAnonymous: boolean;
  evaluatorName?: string; // 추가
  evaluatorRole?: string; // 추가
  evaluatedName?: string; // 추가
  evaluatedRole?: string; // 추가
  positiveReason?: string; // 추가
  evaluationType?: string; // 추가
  isVisible?: boolean; // 추가
} 
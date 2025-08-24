import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Award, 
  Clock, 
  Users, 
  Heart, 
  CheckCircle, 
  ThumbsUp,
  Calendar,
  MapPin,
  TrendingUp,
  Badge,
  Eye,
  EyeOff,
} from 'lucide-react';
import { CrewProfile, PositiveReview, SkillCertification, Badge as BadgeType } from '../types';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

interface CrewProfileCardProps {
  jobseekerId: string;
  jobseekerName: string;
  showFullProfile?: boolean;
  onReviewClick?: () => void;
}

const CrewProfileCard: React.FC<CrewProfileCardProps> = ({
  jobseekerId,
  jobseekerName,
  showFullProfile = false,
  onReviewClick,
}) => {
  const [profile, setProfile] = useState<CrewProfile | null>(null);
  const [recentReviews, setRecentReviews] = useState<PositiveReview[]>([]);
  const [skillCertifications, setSkillCertifications] = useState<SkillCertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrivateReviews, setShowPrivateReviews] = useState(false);

  useEffect(() => {
    fetchCrewData();
  }, [jobseekerId]);

  const fetchCrewData = async () => {
    try {
      // 크루 프로필 데이터 가져오기
      const profileQuery = query(
        collection(db, 'crewProfiles'),
        where('jobseekerId', '==', jobseekerId),
      );
      const profileSnapshot = await getDocs(profileQuery);
      
      if (!profileSnapshot.empty) {
        const profileData = { id: profileSnapshot.docs[0].id, ...profileSnapshot.docs[0].data() } as CrewProfile;
        setProfile(profileData);
      }

      // 최근 긍정적 평가 가져오기 (공개된 것만)
      const reviewsQuery = query(
        collection(db, 'positiveReviews'),
        where('jobseekerId', '==', jobseekerId),
        where('isPublic', '==', true),
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() })) as PositiveReview[];
      // 클라이언트에서 정렬
      const sortedReviews = reviewsData.sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt?.toDate?.()?.getTime() || 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt?.toDate?.()?.getTime() || 0;
        return bTime - aTime;
      }).slice(0, 5);
      setRecentReviews(sortedReviews);

      // 스킬 인증 가져오기
      const certificationsQuery = query(
        collection(db, 'skillCertifications'),
        where('jobseekerId', '==', jobseekerId),
        where('isVerified', '==', true),
      );
      const certificationsSnapshot = await getDocs(certificationsQuery);
      const certificationsData = certificationsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() })) as SkillCertification[];
      // 클라이언트에서 정렬
      const sortedCertifications = certificationsData.sort((a, b) => {
        const aTime = a.certifiedAt instanceof Date ? a.certifiedAt.getTime() : (a.certifiedAt as any)?.toDate?.()?.getTime() || 0;
        const bTime = b.certifiedAt instanceof Date ? b.certifiedAt.getTime() : (b.certifiedAt as any)?.toDate?.()?.getTime() || 0;
        return bTime - aTime;
      });
      setSkillCertifications(sortedCertifications);

    } catch (error) {
      console.error('크루 데이터 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReviewTypeIcon = (type: PositiveReview['reviewType']) => {
    switch (type) {
    case 'praise': return Heart;
    case 'certification': return Award;
    case 'skill_recognition': return CheckCircle;
    case 'attitude': return ThumbsUp;
    case 'teamwork': return Users;
    case 'reliability': return Clock;
    default: return Star;
    }
  };

  const getReviewTypeColor = (type: PositiveReview['reviewType']) => {
    switch (type) {
    case 'praise': return 'text-red-500';
    case 'certification': return 'text-yellow-500';
    case 'skill_recognition': return 'text-green-500';
    case 'attitude': return 'text-blue-500';
    case 'teamwork': return 'text-purple-500';
    case 'reliability': return 'text-indigo-500';
    default: return 'text-gray-500';
    }
  };

  const getSkillLevelColor = (level: SkillCertification['level']) => {
    switch (level) {
    case 'beginner': return 'bg-green-100 text-green-800';
    case 'intermediate': return 'bg-blue-100 text-blue-800';
    case 'advanced': return 'bg-purple-100 text-purple-800';
    case 'expert': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSkillLevelText = (level: SkillCertification['level']) => {
    switch (level) {
    case 'beginner': return '초급';
    case 'intermediate': return '중급';
    case 'advanced': return '고급';
    case 'expert': return '전문가';
    default: return '기본';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{jobseekerName}</h2>
            <p className="text-blue-100">크루 프로필</p>
          </div>
          {onReviewClick && (
            <button
              onClick={onReviewClick}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              평가 남기기
            </button>
          )}
        </div>
      </div>

      {/* 통계 요약 */}
      {profile && (
        <div className="p-6 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{profile.completedJobs}</div>
              <div className="text-sm text-gray-600">완료된 일</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{profile.totalWorkHours}</div>
              <div className="text-sm text-gray-600">총 근무시간</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{profile.positiveReviews}</div>
              <div className="text-sm text-gray-600">긍정적 평가</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{profile.skillCertifications}</div>
              <div className="text-sm text-gray-600">스킬 인증</div>
            </div>
          </div>
        </div>
      )}

      {/* 스킬 인증 */}
      {skillCertifications.length > 0 && (
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2 text-yellow-500" />
            스킬 인증
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {skillCertifications.slice(0, showFullProfile ? undefined : 4).map((cert) => (
              <div key={cert.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{cert.skillName}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillLevelColor(cert.level)}`}>
                    {getSkillLevelText(cert.level)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{cert.description}</p>
                {cert.evidence && (
                  <p className="text-xs text-gray-500">근거: {cert.evidence}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 다시 같이 일하고 싶어요 평가 */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
          <span>다시 같이 일하고 싶어요</span>
          <Users className="h-5 w-5 text-blue-500" />
        </h3>
        
        {recentReviews.length > 0 ? (
          <div className="space-y-4">
            {recentReviews.slice(0, showFullProfile ? undefined : 5).map((review) => (
              <div key={review.id} className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-green-900">다시 같이 일하고 싶어요</h4>
                  <span className="text-xs text-green-600">
                    {review.createdAt instanceof Date 
                      ? review.createdAt.toLocaleDateString() 
                      : review.createdAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}
                  </span>
                </div>
                <p className="text-sm text-green-700">{review.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>아직 받은 평가가 없습니다.</p>
            <p className="text-sm">좋은 일을 하면 "다시 같이 일하고 싶어요" 평가를 받을 수 있어요!</p>
          </div>
        )}
      </div>

      {/* 배지 */}
      {profile?.badges && profile.badges.length > 0 && (
        <div className="p-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Badge className="h-5 w-5 mr-2 text-yellow-500" />
            획득한 배지
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {profile.badges.map((badge) => (
              <div key={badge.id} className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-yellow-600 text-lg">🏆</span>
                </div>
                <div className="text-sm font-medium text-gray-900">{badge.name}</div>
                <div className="text-xs text-gray-500">{badge.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 전체 프로필 보기 링크 */}
      {!showFullProfile && (
        <div className="p-6 bg-gray-50 border-t">
          <button className="w-full text-center text-blue-600 hover:text-blue-700 font-medium">
            전체 프로필 보기 →
          </button>
        </div>
      )}
    </div>
  );
};

export default CrewProfileCard;

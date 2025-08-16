import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Star, 
  Award, 
  Clock, 
  Users, 
  Heart, 
  CheckCircle, 
  ThumbsUp,
  Calendar,
  TrendingUp,
  Badge,
  Trophy,
  Target,
  Activity
} from 'lucide-react';
import { CrewProfile, PositiveReview, SkillCertification, WorkHistoryItem } from '../types';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const CrewDashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CrewProfile | null>(null);
  const [recentReviews, setRecentReviews] = useState<PositiveReview[]>([]);
  const [skillCertifications, setSkillCertifications] = useState<SkillCertification[]>([]);
  const [workHistory, setWorkHistory] = useState<WorkHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'skills' | 'history'>('overview');

  useEffect(() => {
    if (user?.uid) {
      fetchCrewData();
    }
  }, [user?.uid]);

  const fetchCrewData = async () => {
    try {
      // 크루 프로필 데이터 가져오기
      const profileQuery = query(
        collection(db, 'crewProfiles'),
        where('jobseekerId', '==', user?.uid)
      );
      const profileSnapshot = await getDocs(profileQuery);
      
      if (!profileSnapshot.empty) {
        const profileData = { id: profileSnapshot.docs[0].id, ...profileSnapshot.docs[0].data() } as CrewProfile;
        setProfile(profileData);
      }

      // 긍정적 평가 가져오기 (공개된 것만)
      const reviewsQuery = query(
        collection(db, 'positiveReviews'),
        where('jobseekerId', '==', user?.uid),
        where('isPublic', '==', true)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PositiveReview[];
      // 클라이언트에서 정렬
      const sortedReviews = reviewsData.sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt.toDate().getTime();
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt.toDate().getTime();
        return bTime - aTime;
      });
      setRecentReviews(sortedReviews);

      // 스킬 인증 가져오기
      const certificationsQuery = query(
        collection(db, 'skillCertifications'),
        where('jobseekerId', '==', user?.uid),
        where('isVerified', '==', true)
      );
      const certificationsSnapshot = await getDocs(certificationsQuery);
      const certificationsData = certificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SkillCertification[];
      // 클라이언트에서 정렬
      const sortedCertifications = certificationsData.sort((a, b) => {
        const aTime = a.certifiedAt instanceof Date ? a.certifiedAt.getTime() : a.certifiedAt.toDate().getTime();
        const bTime = b.certifiedAt instanceof Date ? b.certifiedAt.getTime() : b.certifiedAt.toDate().getTime();
        return bTime - aTime;
      });
      setSkillCertifications(sortedCertifications);

      // 근무 이력 가져오기
      const historyQuery = query(
        collection(db, 'workHistory'),
        where('jobseekerId', '==', user?.uid)
      );
      const historySnapshot = await getDocs(historyQuery);
      const historyData = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WorkHistoryItem[];
      // 클라이언트에서 정렬
      const sortedHistory = historyData.sort((a, b) => {
        const aTime = a.startDate instanceof Date ? a.startDate.getTime() : a.startDate.toDate().getTime();
        const bTime = b.startDate instanceof Date ? b.startDate.getTime() : b.startDate.toDate().getTime();
        return bTime - aTime;
      });
      setWorkHistory(sortedHistory);

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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">크루 대시보드</h1>
          <p className="text-gray-600 mt-2">당신의 성과와 평가를 확인하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">완료된 일</p>
                <p className="text-2xl font-bold text-gray-900">{profile?.completedJobs || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 근무시간</p>
                <p className="text-2xl font-bold text-gray-900">{profile?.totalWorkHours || 0}시간</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">긍정적 평가</p>
                <p className="text-2xl font-bold text-gray-900">{profile?.positiveReviews || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">스킬 인증</p>
                <p className="text-2xl font-bold text-gray-900">{profile?.skillCertifications || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: '개요', icon: Activity },
                { id: 'reviews', label: '평가', icon: Heart },
                { id: 'skills', label: '스킬', icon: Award },
                { id: 'history', label: '근무이력', icon: Calendar }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* 개요 탭 */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 최근 성과 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 성과</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">이번 달 완료된 일</span>
                        <span className="text-lg font-semibold text-blue-600">
                          {Math.floor((profile?.completedJobs || 0) / 12)}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">평균 평점</span>
                        <span className="text-lg font-semibold text-green-600">
                          {profile?.averageRating ? profile.averageRating.toFixed(1) : '0.0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 최근 "다시 같이 일하고 싶어요" 평가 미리보기 */}
                {recentReviews.length > 0 && (
                  <div>
                                         <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                       <span>최근 받은 평가</span>
                       <Users className="h-5 w-5 text-blue-500" />
                     </h3>
                    <div className="space-y-3">
                      {recentReviews.slice(0, 3).map((review) => (
                        <div key={review.id} className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-green-900">다시 같이 일하고 싶어요</h4>
                            <span className="text-xs text-green-600">
                              {review.createdAt instanceof Date 
                                ? review.createdAt.toLocaleDateString() 
                                : review.createdAt.toDate().toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-green-700 mt-2">{review.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 배지 */}
                {profile?.badges && profile.badges.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">획득한 배지</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {profile.badges.map((badge) => (
                        <div key={badge.id} className="text-center">
                          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-yellow-600 text-2xl">🏆</span>
                          </div>
                          <div className="text-sm font-medium text-gray-900">{badge.name}</div>
                          <div className="text-xs text-gray-500">{badge.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 평가 탭 */}
            {activeTab === 'reviews' && (
              <div>
                                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                   <span>다시 같이 일하고 싶어요</span>
                   <Users className="h-5 w-5 text-blue-500" />
                 </h3>
                {recentReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">아직 받은 평가가 없습니다</h3>
                    <p className="mt-1 text-sm text-gray-500">일을 완료하면 구인자로부터 "다시 같이 일하고 싶어요" 평가를 받을 수 있습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentReviews.map((review) => (
                      <div key={review.id} className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-green-900">다시 같이 일하고 싶어요</h4>
                          <span className="text-xs text-green-600">
                            {review.createdAt instanceof Date 
                              ? review.createdAt.toLocaleDateString() 
                              : review.createdAt.toDate().toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-green-700 mb-3">{review.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 스킬 탭 */}
            {activeTab === 'skills' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">스킬 인증</h3>
                {skillCertifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">아직 인증된 스킬이 없습니다</h3>
                    <p className="mt-1 text-sm text-gray-500">일을 완료하면 구인자로부터 스킬 인증을 받을 수 있습니다.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skillCertifications.map((cert) => (
                      <div key={cert.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{cert.skillName}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillLevelColor(cert.level)}`}>
                            {getSkillLevelText(cert.level)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{cert.description}</p>
                        {cert.evidence && (
                          <p className="text-xs text-gray-500 mb-2">근거: {cert.evidence}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          인증일: {cert.certifiedAt instanceof Date 
                            ? cert.certifiedAt.toLocaleDateString() 
                            : cert.certifiedAt.toDate().toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 근무이력 탭 */}
            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">근무 이력</h3>
                {workHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">아직 근무 이력이 없습니다</h3>
                    <p className="mt-1 text-sm text-gray-500">일을 완료하면 근무 이력이 기록됩니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workHistory.map((work) => (
                      <div key={work.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{work.jobTitle}</h4>
                          <span className="text-sm text-gray-500">{work.employerName}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-2">
                          <div>근무타입: {work.workType}</div>
                          <div>총 시간: {work.totalHours}시간</div>
                          <div>긍정적 평가: {work.positiveReviews}개</div>
                          <div>상태: {work.isCompleted ? '완료' : '진행중'}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {work.startDate.toDate().toLocaleDateString()} ~ {work.endDate.toDate().toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrewDashboard;

export interface RecommendationSite {
  category: 'real_estate' | 'hotel' | 'booking' | 'review' | 'local';
  name: string;
  url: string;
  description: string;
  features: string[];
  icon: string;
}

export const accommodationRecommendations: RecommendationSite[] = [
  // 부동산 사이트
  {
    category: 'real_estate',
    name: '네이버 부동산',
    url: 'https://newland.naver.com',
    description: '네이버에서 제공하는 종합 부동산 정보 서비스',
    features: ['매물 검색', '지도 기반 검색', '실거래가 조회', '부동산 뉴스'],
    icon: '🏠'
  },
  {
    category: 'real_estate',
    name: 'KB부동산',
    url: 'https://kbland.kr',
    description: 'KB국민은행에서 운영하는 부동산 정보 플랫폼',
    features: ['매물 정보', '실거래가', '부동산 시세', '대출 정보'],
    icon: '🏢'
  },
  {
    category: 'real_estate',
    name: '다방',
    url: 'https://www.dabangapp.com',
    description: '부동산 중개업계 1위 플랫폼',
    features: ['원룸/투룸', '오피스텔', '아파트', '빌라/연립'],
    icon: '🏘️'
  },
  {
    category: 'real_estate',
    name: '직방',
    url: 'https://www.zigbang.com',
    description: '부동산 정보와 중개 서비스를 제공하는 플랫폼',
    features: ['매물 검색', '지도 검색', '실시간 알림', 'VR 투어'],
    icon: '🏡'
  },
  {
    category: 'real_estate',
    name: '부동산114',
    url: 'https://www.r114.com',
    description: '전국 부동산 정보를 제공하는 종합 플랫폼',
    features: ['매물 검색', '시세 정보', '부동산 뉴스', '중개업소 정보'],
    icon: '📊'
  },

  // 호텔/숙박 사이트
  {
    category: 'hotel',
    name: '야놀자',
    url: 'https://www.yanolja.com',
    description: '국내 최대 숙박 예약 플랫폼',
    features: ['호텔', '펜션', '리조트', '게스트하우스'],
    icon: '🏨'
  },
  {
    category: 'hotel',
    name: '여기어때',
    url: 'https://www.goodchoice.kr',
    description: '국내 숙박 예약 서비스',
    features: ['호텔', '모텔', '펜션', '게스트하우스'],
    icon: '🏩'
  },
  {
    category: 'hotel',
    name: '호텔스닷컴',
    url: 'https://www.hotels.com',
    description: '글로벌 호텔 예약 플랫폼',
    features: ['국내외 호텔', '리조트', '특가 할인', '멤버십'],
    icon: '🌍'
  },
  {
    category: 'hotel',
    name: '아고다',
    url: 'https://www.agoda.com',
    description: '아시아 최대 호텔 예약 사이트',
    features: ['호텔', '리조트', '게스트하우스', '특가'],
    icon: '🏖️'
  },
  {
    category: 'hotel',
    name: '부킹닷컴',
    url: 'https://www.booking.com',
    description: '세계 최대 여행 예약 플랫폼',
    features: ['호텔', '아파트먼트', '게스트하우스', '특가'],
    icon: '✈️'
  },

  // 리뷰 사이트
  {
    category: 'review',
    name: '네이버 지도',
    url: 'https://map.naver.com',
    description: '네이버에서 제공하는 지도 및 장소 리뷰 서비스',
    features: ['장소 검색', '리뷰', '사진', '길찾기'],
    icon: '🗺️'
  },
  {
    category: 'review',
    name: '카카오맵',
    url: 'https://map.kakao.com',
    description: '카카오에서 제공하는 지도 서비스',
    features: ['장소 검색', '리뷰', '사진', '교통정보'],
    icon: '📍'
  },
  {
    category: 'review',
    name: '구글 리뷰',
    url: 'https://www.google.com/maps',
    description: '구글 맵스의 장소 리뷰 및 평가',
    features: ['장소 검색', '리뷰', '평점', '사진'],
    icon: '⭐'
  },

  // 지역별 추천
  {
    category: 'local',
    name: '지역 부동산 협회',
    url: 'https://www.reb.or.kr',
    description: '대한부동산중개업협회 공식 사이트',
    features: ['부동산 정보', '중개업소 검색', '법령 정보', '교육'],
    icon: '🏛️'
  },
  {
    category: 'local',
    name: '국토교통부',
    url: 'https://www.molit.go.kr',
    description: '부동산 정책 및 정보 제공',
    features: ['부동산 정책', '법령 정보', '통계 자료', '공지사항'],
    icon: '🏛️'
  }
];

export const getRecommendationsByCategory = (category: RecommendationSite['category']) => {
  return accommodationRecommendations.filter(site => site.category === category);
};

export const getRecommendationsByLocation = (location: string) => {
  // 지역별 특화 추천 사이트 (향후 확장 가능)
  const localSites = accommodationRecommendations.filter(site => site.category === 'local');
  
  // 기본 추천 사이트 + 지역별 사이트
  return [
    ...accommodationRecommendations.filter(site => site.category !== 'local'),
    ...localSites
  ];
};

export const getPopularSites = () => {
  // 가장 인기 있는 사이트들 (사용자 통계 기반으로 변경 가능)
  return accommodationRecommendations.filter(site => 
    ['네이버 부동산', '다방', '야놀자', '여기어때'].includes(site.name)
  );
};

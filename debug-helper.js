// 🚨 리조트바이트 디버깅 헬퍼 스크립트
// 브라우저 콘솔에서 실행하여 문제를 진단할 수 있습니다.

// 1. 지도 관련 디버깅
window.debugMap = {
  // 현재 좌표 확인
  checkCoordinates: () => {
    console.log('📍 현재 좌표 확인:');
    console.log('accommodationInfo:', window.accommodationInfo);
    console.log('mapCenter:', window.mapCenter);
    console.log('서울 좌표인가?', 
      window.accommodationInfo?.latitude === 37.5665 && 
      window.accommodationInfo?.longitude === 126.9780
    );
  },
  
  // 네이버 지도 API 상태 확인
  checkNaverAPI: () => {
    console.log('🗺️ 네이버 지도 API 상태:');
    console.log('window.naver:', window.naver);
    console.log('window.naver.maps:', window.naver?.maps);
    console.log('window.naver.maps.Service:', window.naver?.maps?.Service);
  },
  
  // 지오코딩 테스트
  testGeocoding: (address) => {
    if (!window.naver?.maps?.Service) {
      console.error('❌ 네이버 지도 API를 사용할 수 없습니다');
      return;
    }
    
    console.log('🔍 지오코딩 테스트:', address);
    window.naver.maps.Service.geocode({
      query: address
    }, (status, response) => {
      console.log('지오코딩 응답:', { status, response });
      console.log('v2.addresses:', response?.v2?.addresses);
    });
  }
};

// 2. 소셜로그인 관련 디버깅
window.debugAuth = {
  // URL 파라미터 확인
  checkURLParams: () => {
    console.log('🔐 URL 파라미터 확인:');
    const urlParams = new URLSearchParams(window.location.search);
    console.log('code:', urlParams.get('code'));
    console.log('state:', urlParams.get('state'));
    console.log('error:', urlParams.get('error'));
  },
  
  // Firebase Auth 상태 확인
  checkFirebaseAuth: () => {
    console.log('🔥 Firebase Auth 상태:');
    console.log('Firebase 앱:', window.firebase?.apps);
    console.log('현재 사용자:', window.auth?.currentUser);
  }
};

// 3. 서버 연결 디버깅
window.debugServer = {
  // API 엔드포인트 테스트
  testAPI: async (endpoint) => {
    try {
      console.log(`🌐 API 테스트: ${endpoint}`);
      const response = await fetch(endpoint);
      const data = await response.json();
      console.log('API 응답:', data);
      return data;
    } catch (error) {
      console.error('API 오류:', error);
    }
  },
  
  // 지오코딩 API 테스트
  testGeocodingAPI: async (address) => {
    try {
      console.log(`🗺️ 지오코딩 API 테스트: ${address}`);
      const response = await fetch(`/api/geocode/coordinates?address=${encodeURIComponent(address)}`);
      const data = await response.json();
      console.log('지오코딩 API 응답:', data);
      return data;
    } catch (error) {
      console.error('지오코딩 API 오류:', error);
    }
  }
};

// 4. 포트 상태 확인
window.debugPorts = {
  // 포트 상태 확인 (개발자 도구에서 실행)
  checkPorts: () => {
    console.log('🔌 포트 상태 확인:');
    console.log('현재 URL:', window.location.href);
    console.log('포트:', window.location.port);
  }
};

// 5. 환경 변수 확인
window.debugEnv = {
  // 환경 변수 확인
  checkEnv: () => {
    console.log('⚙️ 환경 변수 확인:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
    console.log('REACT_APP_NAVER_CLIENT_ID:', process.env.REACT_APP_NAVER_CLIENT_ID);
  }
};

// 6. 전체 진단
window.debugAll = () => {
  console.log('🚨 전체 진단 시작...');
  console.log('='.repeat(50));
  
  // 지도 관련
  window.debugMap.checkCoordinates();
  window.debugMap.checkNaverAPI();
  
  // 소셜로그인 관련
  window.debugAuth.checkURLParams();
  window.debugAuth.checkFirebaseAuth();
  
  // 서버 연결
  window.debugServer.testAPI('/api/health');
  
  // 환경 변수
  window.debugEnv.checkEnv();
  
  console.log('='.repeat(50));
  console.log('✅ 진단 완료');
};

// 사용법 안내
console.log(`
🚨 리조트바이트 디버깅 헬퍼 로드 완료!

사용법:
- window.debugAll() : 전체 진단
- window.debugMap.checkCoordinates() : 좌표 확인
- window.debugMap.testGeocoding('주소') : 지오코딩 테스트
- window.debugAuth.checkURLParams() : URL 파라미터 확인
- window.debugServer.testAPI('/api/health') : API 테스트
- window.debugEnv.checkEnv() : 환경 변수 확인

문제 발생 시 window.debugAll() 실행 후 결과를 확인하세요!
`);

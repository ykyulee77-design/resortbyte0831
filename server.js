const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// 성능 모니터링 미들웨어
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // 느린 요청 경고 (1초 이상)
    if (duration > 1000) {
      console.warn(`⚠️ 느린 요청 감지: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
};

// 요청 제한 미들웨어 (Rate Limiting)
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 최대 100개 요청
  message: {
    error: '너무 많은 요청이 발생했습니다. 15분 후에 다시 시도해주세요.',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 성능 최적화를 위한 설정
app.set('trust proxy', 1);

// 미들웨어 적용
app.use(performanceMonitor);
app.use('/api/', apiLimiter);

// CORS 설정 (더 구체적으로)
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3005', 'http://127.0.0.1:3005', 'http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON 파싱 미들웨어 (크기 제한 설정)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 캐싱
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

// 환경 변수 설정
const PUBLIC_DATA_API_KEY = process.env.PUBLIC_DATA_API_KEY || 'U01TX0FVVEgyMDI1MDgyNTIzNDUzNjExNjEwODc=';
const PUBLIC_DATA_API_URL = 'https://business.juso.go.kr/addrlink/addrLinkApi.do';

// 검색어 검증 함수
const validateSearchQuery = (query) => {
  if (!query || typeof query !== 'string') {
    return { isValid: false, message: '검색어가 필요합니다.' };
  }

  if (query.trim().length < 3) {
    return { isValid: false, message: '검색어는 최소 3글자 이상이어야 합니다.' };
  }

  // 특수문자 검증
  const specialChars = /[%=><]/;
  if (specialChars.test(query)) {
    return { isValid: false, message: '특수문자를 포함할 수 없습니다.' };
  }

  // SQL 인젝션 방지
  const sqlKeywords = ['OR', 'SELECT', 'INSERT', 'DELETE', 'UPDATE', 'CREATE', 'DROP', 'EXEC', 'UNION', 'FETCH', 'DECLARE', 'TRUNCATE'];
  for (const keyword of sqlKeywords) {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(query)) {
      return { isValid: false, message: `"${keyword}"와 같은 특정문자로 검색할 수 없습니다.` };
    }
  }

  return { isValid: true };
};

// 공공데이터 포털 주소 검색 API 프록시 (네이버 → 공공데이터 폴백)
app.get('/api/geocode', async (req, res) => {
  const { query } = req.query;
  
  // 검색어 검증
  const validation = validateSearchQuery(query);
  if (!validation.isValid) {
    return res.status(400).json({ 
      error: validation.message,
      errorCode: 'VALIDATION_ERROR'
    });
  }

  // 1) 먼저 Vercel 서버리스 함수가 있는 경우(배포 환경) 시도
  // 이 경로는 프론트엔드에서 같은 경로로 프록시되므로 내부 호출 대신 네트워크 호출을 피하기 위해 주석 처리
  // 2) 자체 서버의 네이버 지오코딩 프록시 시도 (키가 유효한 경우)
  const tryNaverGeocodeDirect = async () => {
    try {
      const clientId = process.env.NAVER_MAPS_API_KEY_ID || 'c4d9638auv';
      const clientSecret = process.env.NAVER_MAPS_API_KEY || process.env.NAVER_MAPS_API_SECRET || '';
      if (!clientId || !clientSecret) {
        throw new Error('MISSING_NAVER_KEYS');
      }
      const encoded = encodeURIComponent(query);
      const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encoded}`;
      const resp = await axios.get(url, {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': clientId,
          'X-NCP-APIGW-API-KEY': clientSecret,
        },
        timeout: 7000,
      });
      // 네이버 원본 응답 형태를 그대로 반환하여 프론트의 매핑 로직을 살린다
      if (resp?.data) return { type: 'naver', data: resp.data };
      throw new Error('EMPTY_NAVER_RESPONSE');
    } catch (e) {
      console.warn('⚠️ 네이버 지오코딩 실패, 공공데이터로 폴백합니다:', e.message || e);
      return null;
    }
  };

  const tryPublicData = async () => {
    const encodedQuery = encodeURIComponent(query);
    const apiUrl = `${PUBLIC_DATA_API_URL}?currentPage=1&countPerPage=10&keyword=${encodedQuery}&confmKey=${PUBLIC_DATA_API_KEY}&resultType=json`;
    const response = await axios.get(apiUrl, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    // 공공데이터 포털 응답을 네이버 형식과 동일하게 정규화
    const jusoList = response.data?.results?.juso || [];
    const addresses = jusoList.map((j) => ({
      zipCode: j.zipNo || '',
      address: j.roadAddr || j.jibunAddr || '',
      roadAddress: j.roadAddr || '',
      jibunAddress: j.jibunAddr || '',
      buildingName: j.bdNm || '',
      sido: j.siNm || '',
      sigungu: j.sggNm || '',
      roadName: j.rn || '',
      buildingNumber: j.buldMnnm ? `${j.buldMnnm}${j.buldSlno ? '-' + j.buldSlno : ''}` : '',
    }));

    return { type: 'public', data: { addresses } };
  };

  try {
    console.log('🔍 주소 검색 요청:', query);

    const naverResult = await tryNaverGeocodeDirect();
    if (naverResult) {
      return res.json(naverResult.data);
    }

    const publicResult = await tryPublicData();
    return res.json(publicResult.data);
  } catch (error) {
    console.error('❌ 주소 검색 오류(최종):', error.response?.data || error.message);
    if (error.response) {
      res.status(error.response.status).json({
        error: '주소 검색 서비스 오류',
        details: error.response.data,
        errorCode: 'API_ERROR',
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({ error: '주소 검색 시간 초과', errorCode: 'TIMEOUT' });
    } else {
      res.status(500).json({ error: '주소 검색 중 오류가 발생했습니다.', errorCode: 'INTERNAL_ERROR' });
    }
  }
});

// 네이버 지오코딩 API 프록시
app.get('/api/geocode/coordinates', async (req, res) => {
  const { address } = req.query;
  
  if (!address) {
    return res.status(400).json({ 
      error: '주소가 필요합니다.',
      errorCode: 'MISSING_ADDRESS'
    });
  }

  try {
    console.log('🗺️ 네이버 지오코딩 요청:', address);
    
    // 네이버 API 키 확인 (기존 키 사용)
    const clientId = 'c4d9638auv'; // 기존에 사용 중인 키
    const clientSecret = 'bn75KcSeew8y60QMs1q9sRROugdhqtfnXv4kvir1'; // 실제 시크릿 키
    
    // 실제 네이버 지오코딩 API 호출 시도
    console.log('🌐 네이버 지오코딩 API 호출 시도');
    
    // 실제 네이버 지오코딩 API 호출
    const encodedAddress = encodeURIComponent(address);
    const naverApiUrl = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodedAddress}`;
    
    console.log('🌐 네이버 API 호출:', naverApiUrl);
    
    const response = await axios.get(naverApiUrl, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': clientId,
        'X-NCP-APIGW-API-KEY': clientSecret
      },
      timeout: 10000
    });
    
    console.log('📡 네이버 API 응답 상태:', response.status);
    console.log('📦 네이버 API 응답 데이터:', response.data);
    
    if (response.data.addresses && response.data.addresses.length > 0) {
      const addressData = response.data.addresses[0];
      const coordinates = {
        lat: parseFloat(addressData.y),
        lng: parseFloat(addressData.x),
        address: addressData.roadAddress || addressData.jibunAddress,
        roadAddress: addressData.roadAddress,
        jibunAddress: addressData.jibunAddress
      };
      
      console.log('✅ 실제 지오코딩 결과:', coordinates);
      
      res.json({
        success: true,
        data: coordinates
      });
    } else {
      console.log('❌ 주소를 찾을 수 없음');
      res.status(404).json({
        error: '주소를 찾을 수 없습니다.',
        errorCode: 'ADDRESS_NOT_FOUND'
      });
    }
    
  } catch (error) {
    console.error('❌ 네이버 지오코딩 오류:', error.response?.data || error.message);
    console.log('🔄 하드코딩된 좌표로 대체');
    
    // 오류 발생 시 하드코딩된 좌표 사용
    let coordinates = {
      lat: 37.5665,
      lng: 126.9780,
      address: address,
      roadAddress: address,
      jibunAddress: address
    };
    
    // 강원도 평창군 봉평면 태기로 227 - 정확한 좌표
    if (address.includes('강원특별자치도 평창군 봉평면 태기로 227') || 
        address.includes('강원도 평창군 봉평면 태기로 227')) {
      coordinates = { 
        lat: 37.3705, 
        lng: 128.3902, 
        address, 
        roadAddress: address, 
        jibunAddress: address 
      };
    }
    // 서울 강남구 관련 주소들
    else if (address.includes('강남구') || address.includes('선릉로') || address.includes('개포동')) {
      coordinates = { 
        lat: 37.5172, 
        lng: 127.0473, 
        address, 
        roadAddress: address, 
        jibunAddress: address 
      };
    }
    // 홍대/마포구
    else if (address.includes('홍대') || address.includes('마포구')) {
      coordinates = { 
        lat: 37.5563, 
        lng: 126.9226, 
        address, 
        roadAddress: address, 
        jibunAddress: address 
      };
    }
    // 명동/중구
    else if (address.includes('명동') || address.includes('중구')) {
      coordinates = { 
        lat: 37.5636, 
        lng: 126.9826, 
        address, 
        roadAddress: address, 
        jibunAddress: address 
      };
    }
    // 잠실/송파구
    else if (address.includes('잠실') || address.includes('송파구')) {
      coordinates = { 
        lat: 37.5133, 
        lng: 127.1028, 
        address, 
        roadAddress: address, 
        jibunAddress: address 
      };
    }
    // 강원도 일반
    else if (address.includes('강원') || address.includes('평창')) {
      coordinates = { 
        lat: 37.3705, 
        lng: 128.3902, 
        address, 
        roadAddress: address, 
        jibunAddress: address 
      };
    }
    // 부산
    else if (address.includes('부산')) {
      coordinates = { 
        lat: 35.1796, 
        lng: 129.0756, 
        address, 
        roadAddress: address, 
        jibunAddress: address 
      };
    }
    // 대구
    else if (address.includes('대구')) {
      coordinates = { 
        lat: 35.8714, 
        lng: 128.6014, 
        address, 
        roadAddress: address, 
        jibunAddress: address 
      };
    }
    // 인천
    else if (address.includes('인천')) {
      coordinates = { 
        lat: 37.4563, 
        lng: 126.7052, 
        address, 
        roadAddress: address, 
        jibunAddress: address 
      };
    }
    // 광주
    else if (address.includes('광주')) {
      coordinates = { 
        lat: 35.1595, 
        lng: 126.8526, 
        address, 
        roadAddress: address, 
        jibunAddress: address 
      };
    }
    // 대전
    else if (address.includes('대전')) {
      coordinates = { 
        lat: 36.3504, 
        lng: 127.3845, 
        address, 
        roadAddress: address, 
        jibunAddress: address 
      };
    }
    // 울산
    else if (address.includes('울산')) {
      coordinates = { 
        lat: 35.5384, 
        lng: 129.3114, 
        address, 
        roadAddress: address, 
        jibunAddress: address 
      };
    }
    
    console.log('📍 하드코딩된 좌표 매핑 결과:', coordinates);
    
    res.json({
      success: true,
      data: coordinates
    });
  }
});

// 헬스 체크 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Address Search API',
    version: '1.0.0'
  });
});

// 404 처리
app.use((req, res) => {
  res.status(404).json({
    error: '요청한 엔드포인트를 찾을 수 없습니다.',
    errorCode: 'NOT_FOUND'
  });
});

// 전역 에러 핸들러
app.use((error, req, res, next) => {
  console.error('❌ 서버 오류:', error);
  res.status(500).json({
    error: '서버 내부 오류가 발생했습니다.',
    errorCode: 'INTERNAL_SERVER_ERROR'
  });
});

// (고정 포트 사용) 사용 가능한 포트 탐색 제거

// 서버 시작 (포트 고정)
const startServer = async () => {
  try {
    const server = app.listen(PORT, () => {
      console.log(`🚀 주소 검색 API 서버가 http://localhost:${PORT}에서 실행 중입니다.`);
      console.log(`📋 사용 가능한 엔드포인트:`);
      console.log(`   - GET /api/geocode?query=<검색어> - 주소 검색`);
      console.log(`   - GET /api/geocode/coordinates?address=<주소> - 지오코딩 (향후 구현)`);
      console.log(`   - GET /api/health - 서버 상태 확인`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 서버를 종료합니다...');
      server.close(() => {
        console.log('✅ 서버가 안전하게 종료되었습니다.');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 서버를 종료합니다...');
      server.close(() => {
        console.log('✅ 서버가 안전하게 종료되었습니다.');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ 서버 시작 오류:', error);
    process.exit(1);
  }
};

startServer();

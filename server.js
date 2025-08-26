const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// 성능 최적화를 위한 설정
app.set('trust proxy', 1);

// CORS 설정 (더 구체적으로)
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
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

// 공공데이터 포털 주소 검색 API 프록시
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

  try {
    console.log('🔍 주소 검색 요청:', query);
    
    // 공공데이터 포털 API 호출
    const encodedQuery = encodeURIComponent(query);
    const apiUrl = `${PUBLIC_DATA_API_URL}?currentPage=1&countPerPage=10&keyword=${encodedQuery}&confmKey=${PUBLIC_DATA_API_KEY}&resultType=json`;
    
    console.log('🌐 API 호출 URL:', apiUrl);
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10초 타임아웃
    });
    
    console.log('📡 API 응답 상태:', response.status);
    
    // 공공데이터 포털 API 응답 그대로 반환
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ 주소 검색 오류:', error.response?.data || error.message);
    
    // 에러 응답 처리
    if (error.response) {
      res.status(error.response.status).json({
        error: '주소 검색 서비스 오류',
        details: error.response.data,
        errorCode: 'API_ERROR'
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({
        error: '주소 검색 시간 초과',
        errorCode: 'TIMEOUT'
      });
    } else {
      res.status(500).json({
        error: '주소 검색 중 오류가 발생했습니다.',
        errorCode: 'INTERNAL_ERROR'
      });
    }
  }
});

// 지도 연동을 위한 지오코딩 API (향후 구현)
app.get('/api/geocode/coordinates', async (req, res) => {
  const { address } = req.query;
  
  if (!address) {
    return res.status(400).json({ 
      error: '주소가 필요합니다.',
      errorCode: 'MISSING_ADDRESS'
    });
  }

  try {
    console.log('🗺️ 지오코딩 요청:', address);
    
    // TODO: 실제 지오코딩 API 연동 (Naver, Google, Kakao 등)
    // 현재는 임시로 서울 시청 좌표 반환
    
    // 실제 구현 예시:
    // const geocodingResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`);
    // const coordinates = geocodingResponse.data.results[0].geometry.location;
    
    const mockCoordinates = {
      latitude: 37.5665,
      longitude: 126.9780,
      formattedAddress: address,
      confidence: 0.8
    };
    
    res.json({
      success: true,
      data: mockCoordinates
    });
    
  } catch (error) {
    console.error('❌ 지오코딩 오류:', error);
    res.status(500).json({
      error: '지오코딩 중 오류가 발생했습니다.',
      errorCode: 'GEOCODING_ERROR'
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
app.use('*', (req, res) => {
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

// 사용 가능한 포트 찾기 함수
const findAvailablePort = async (startPort) => {
  const net = require('net');
  
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
};

// 서버 시작 (포트 충돌 처리 포함)
const startServer = async () => {
  try {
    const availablePort = await findAvailablePort(PORT);
    
    const server = app.listen(availablePort, () => {
      console.log(`🚀 주소 검색 API 서버가 http://localhost:${availablePort}에서 실행 중입니다.`);
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

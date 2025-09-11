const functions = require('firebase-functions');
const express = require('express');
const axios = require('axios');
const cors = require('cors');

// Express app
const app = express();

// CORS: 전면 허용(단순화) + 프리플라이트 204
app.use(cors({ origin: true }));
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  next();
});
app.use(express.json());

// 공공데이터 포털 API 설정
const PUBLIC_DATA_API_KEY = process.env.PUBLIC_DATA_API_KEY || 'U01TX0FVVEgyMDI1MDgyNTIzNDUzNjExNjEwODc=';
const PUBLIC_DATA_API_URL = 'https://business.juso.go.kr/addrlink/addrLinkApi.do';

// 입력 검증
function validateSearchQuery(query) {
  if (!query || typeof query !== 'string') return { isValid: false, message: '검색어가 필요합니다.' };
  if (query.trim().length < 3) return { isValid: false, message: '검색어는 최소 3글자 이상이어야 합니다.' };
  const special = /[%=><]/; if (special.test(query)) return { isValid: false, message: '특수문자를 포함할 수 없습니다.' };
  const sql = ['OR','SELECT','INSERT','DELETE','UPDATE','CREATE','DROP','EXEC','UNION','FETCH','DECLARE','TRUNCATE'];
  for (const k of sql) { if (new RegExp(k, 'i').test(query)) return { isValid: false, message: `"${k}"와 같은 특정문자로 검색할 수 없습니다.` }; }
  return { isValid: true };
}

// 네이버 직접 호출 (성공 시 원본 데이터 리턴)
async function tryNaver(query) {
  const clientId = process.env.NAVER_MAPS_API_KEY_ID || process.env.REACT_APP_NAVER_CLIENT_ID || 'c4d9638auv';
  const clientSecret = process.env.NAVER_MAPS_API_KEY || process.env.REACT_APP_NAVER_CLIENT_SECRET || 'bn75KcSeew8y60QMs1q9sRROugdhqtfnXv4kvir1';
  if (!clientId || !clientSecret) throw new Error('MISSING_NAVER_KEYS');
  const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;
  const resp = await axios.get(url, {
    headers: {
      'X-NCP-APIGW-API-KEY-ID': clientId,
      'X-NCP-APIGW-API-KEY': clientSecret,
    },
    timeout: 8000,
  });
  return resp.data;
}

// 공공데이터 호출 (성공 시 원본 데이터 리턴)
async function tryPublic(query) {
  const apiUrl = `${PUBLIC_DATA_API_URL}?currentPage=1&countPerPage=10&keyword=${encodeURIComponent(query)}&confmKey=${PUBLIC_DATA_API_KEY}&resultType=json`;
  const resp = await axios.get(apiUrl, { timeout: 10000 });
  return resp.data;
}

// 주소 검색 엔드포인트 (네이버 → 공공데이터 폴백)
app.get('/api/geocode', async (req, res) => {
  const { query } = req.query;
  const v = validateSearchQuery(query);
  if (!v.isValid) return res.status(400).json({ error: v.message, errorCode: 'VALIDATION_ERROR' });
  try {
    try {
      const naver = await tryNaver(String(query));
      return res.json(naver);
    } catch (e) {
      const pub = await tryPublic(String(query));
      return res.json(pub);
    }
  } catch (error) {
    if (error?.response) return res.status(error.response.status).json({ error: '주소 검색 서비스 오류', details: error.response.data, errorCode: 'API_ERROR' });
    if (error?.code === 'ECONNABORTED') return res.status(408).json({ error: '주소 검색 시간 초과', errorCode: 'TIMEOUT' });
    return res.status(500).json({ error: '주소 검색 중 오류가 발생했습니다.', errorCode: 'INTERNAL_ERROR' });
  }
});

// 좌표 지오코딩(선택적)
app.get('/api/geocode/coordinates', async (req, res) => {
  const { address } = req.query;
  if (!address) return res.status(400).json({ error: '주소가 필요합니다.', errorCode: 'MISSING_ADDRESS' });
  try {
    const data = await tryNaver(String(address));
    if (Array.isArray(data.addresses) && data.addresses.length > 0) {
      const a = data.addresses[0];
      return res.json({ success: true, data: { lat: parseFloat(a.y), lng: parseFloat(a.x), address: a.roadAddress || a.jibunAddress, roadAddress: a.roadAddress, jibunAddress: a.jibunAddress } });
    }
    return res.status(404).json({ error: '주소를 찾을 수 없습니다.', errorCode: 'ADDRESS_NOT_FOUND' });
  } catch (error) {
    return res.status(200).json({ success: true, data: { lat: 37.5665, lng: 126.9780, address, roadAddress: address, jibunAddress: address } });
  }
});

exports.api = functions.region('asia-northeast3').https.onRequest(app);



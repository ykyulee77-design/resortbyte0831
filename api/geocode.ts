import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Naver Maps Geocoding API
// https://api.ncloud-docs.com/docs/ai-naver-mapsgeocoding-geocode
const NAVER_GEOCODE_URL = 'https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode';

function validateSearchQuery(query: unknown): { isValid: boolean; message?: string } {
  if (!query || typeof query !== 'string') {
    return { isValid: false, message: '검색어가 필요합니다.' };
  }
  if (query.trim().length < 3) {
    return { isValid: false, message: '검색어는 최소 3글자 이상이어야 합니다.' };
  }
  const specialChars = /[%=><]/;
  if (specialChars.test(query)) {
    return { isValid: false, message: '특수문자를 포함할 수 없습니다.' };
  }
  const sqlKeywords = ['OR', 'SELECT', 'INSERT', 'DELETE', 'UPDATE', 'CREATE', 'DROP', 'EXEC', 'UNION', 'FETCH', 'DECLARE', 'TRUNCATE'];
  for (const keyword of sqlKeywords) {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(query)) {
      return { isValid: false, message: `"${keyword}"와 같은 특정문자로 검색할 수 없습니다.` };
    }
  }
  return { isValid: true };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET만 허용
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { query } = req.query;
  const validation = validateSearchQuery(query);
  if (!validation.isValid) {
    res.status(400).json({ error: validation.message, errorCode: 'VALIDATION_ERROR' });
    return;
  }

  // Server-side credentials (never expose to client)
  const ncpClientId = process.env.NAVER_MAPS_API_KEY_ID;
  const ncpClientSecret = process.env.NAVER_MAPS_API_KEY;
  if (!ncpClientId || !ncpClientSecret) {
    res.status(500).json({ error: '서버 환경 변수 NAVER_MAPS_API_KEY_ID / NAVER_MAPS_API_KEY가 설정되지 않았습니다.' });
    return;
  }

  try {
    const response = await axios.get(NAVER_GEOCODE_URL, {
      params: { query: String(query) },
      headers: {
        'X-NCP-APIGW-API-KEY-ID': ncpClientId,
        'X-NCP-APIGW-API-KEY': ncpClientSecret,
      },
      timeout: 10000,
    });

    // 그대로 전달 (프론트에서 매핑)
    res.status(200).json(response.data);
  } catch (error: any) {
    if (error?.response) {
      res.status(error.response.status).json({
        error: '주소 검색 서비스 오류',
        details: error.response.data,
        errorCode: 'API_ERROR',
      });
      return;
    }
    if (error?.code === 'ECONNABORTED') {
      res.status(408).json({ error: '주소 검색 시간 초과', errorCode: 'TIMEOUT' });
      return;
    }
    res.status(500).json({ error: '주소 검색 중 오류가 발생했습니다.', errorCode: 'INTERNAL_ERROR' });
  }
}



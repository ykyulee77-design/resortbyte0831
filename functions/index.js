const { onRequest } = require('firebase-functions/v2/https');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const admin = require('firebase-admin');

// Firebase Admin 초기화
if (!admin.apps.length) {
  // 개발 환경에서는 서비스 계정 키 파일 사용
  if (process.env.NODE_ENV !== 'production') {
    try {
      const serviceAccount = require('./resortbyte-dev-firebase-adminsdk.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (error) {
      console.log('서비스 계정 키 파일을 찾을 수 없습니다. 기본 초기화를 사용합니다.');
      admin.initializeApp();
    }
  } else {
    admin.initializeApp();
  }
}

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

// 네이버 OAuth 설정
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || 'R0oImlUQC6DqKKV_V5BR';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || 'dKhvaDBUvY';

// 카카오 OAuth 설정
const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID || 'f863ee0b8e46e5ced4c1a9cf30199e72';
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET || ''; // 카카오는 Client Secret이 선택사항

// 구글 OAuth 설정
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// 구글 액세스 토큰 가져오기
async function getGoogleAccessToken(code) {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams({
    code: code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: 'http://localhost:3001/auth/google/callback',
    grant_type: 'authorization_code',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('구글 토큰 요청 실패:', response.status, errorText);
    throw new Error(`구글 토큰 요청 실패: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('구글 액세스 토큰 가져오기 성공');
  return data.access_token;
}

// 구글 사용자 정보 가져오기
async function getGoogleUserInfo(accessToken) {
  const userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
  
  const response = await fetch(userInfoUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('구글 사용자 정보 요청 실패:', response.status, errorText);
    throw new Error(`구글 사용자 정보 요청 실패: ${response.status} ${errorText}`);
  }

  const userInfo = await response.json();
  console.log('구글 사용자 정보 가져오기 성공:', userInfo.name);
  
  return {
    id: userInfo.id,
    email: userInfo.email,
    name: userInfo.name,
    profile_image: userInfo.picture || '',
    email_verified: userInfo.verified_email || false,
  };
}

// 네이버 액세스 토큰 가져오기
async function getNaverAccessToken(code, state) {
  const tokenUrl = 'https://nid.naver.com/oauth2.0/token';
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: NAVER_CLIENT_ID,
    client_secret: NAVER_CLIENT_SECRET,
    code: code,
    state: state,
  });

  const response = await axios.post(tokenUrl, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data;
}

// 네이버 사용자 정보 가져오기
async function getNaverUserInfo(accessToken) {
  const userInfoUrl = 'https://openapi.naver.com/v1/nid/me';
  const response = await axios.get(userInfoUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return response.data;
}

// 네이버 로그인 콜백 처리
app.post('/api/auth/naver/callback', async (req, res) => {
  try {
    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: '인증 코드가 없습니다.' 
      });
    }

    console.log('네이버 콜백 처리 시작:', { code: code.substring(0, 10) + '...', state });

    // 1. 액세스 토큰 가져오기
    const tokenData = await getNaverAccessToken(code, state);
    
    if (!tokenData.access_token) {
      return res.status(400).json({ 
        success: false, 
        error: '액세스 토큰을 가져올 수 없습니다.' 
      });
    }

    // 2. 사용자 정보 가져오기
    const userInfoResponse = await getNaverUserInfo(tokenData.access_token);
    
    if (userInfoResponse.resultcode !== '00') {
      return res.status(400).json({ 
        success: false, 
        error: '사용자 정보를 가져올 수 없습니다.' 
      });
    }

    const naverUser = userInfoResponse.response;
    
    // 3. Firebase 사용자 생성 또는 업데이트
    let firebaseUser;
    const email = naverUser.email;
    const uid = `naver_${naverUser.id}`;

    try {
      // 기존 사용자 확인
      firebaseUser = await admin.auth().getUser(uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // 새 사용자 생성
        firebaseUser = await admin.auth().createUser({
          uid: uid,
          email: email,
          displayName: naverUser.name,
          photoURL: naverUser.profile_image,
        });
        console.log('새 Firebase 사용자 생성:', uid);
      } else {
        throw error;
      }
    }

    // 4. Firestore에 사용자 정보 저장
    const userDoc = admin.firestore().doc(`users/${uid}`);
    const userSnapshot = await userDoc.get();
    
    const userData = {
      email: email,
      displayName: naverUser.name,
      mobile: naverUser.mobile || '',
      profile_image: naverUser.profile_image || '',
      provider: 'naver',
      providerId: naverUser.id,
      updatedAt: new Date().toISOString(),
    };

    if (!userSnapshot.exists) {
      // 새 사용자인 경우
      userData.role = 'jobseeker'; // 기본 역할
      userData.createdAt = new Date().toISOString();
      await userDoc.set(userData);
      console.log('새 사용자 Firestore 문서 생성:', uid);
    } else {
      // 기존 사용자인 경우
      await userDoc.update(userData);
      console.log('기존 사용자 Firestore 문서 업데이트:', uid);
    }

    // 5. 커스텀 토큰 생성 (서비스 계정 키가 있는 경우에만)
    let customToken = null;
    try {
      customToken = await admin.auth().createCustomToken(uid);
      console.log('커스텀 토큰 생성 성공');
    } catch (error) {
      console.log('커스텀 토큰 생성 실패 (서비스 계정 키 없음):', error.message);
    }

    // 6. 응답
    return res.json({
      success: true,
      customToken: customToken,
      user: {
        id: naverUser.id,
        uid: uid,
        email: email,
        name: naverUser.name,
        mobile: naverUser.mobile || '',
        profile_image: naverUser.profile_image || '',
        role: userSnapshot.exists ? (await userSnapshot.data()).role : 'jobseeker'
      }
    });

  } catch (error) {
    console.error('네이버 콜백 처리 오류:', error);
    return res.status(500).json({ 
      success: false, 
      error: '서버 오류가 발생했습니다.' 
    });
  }
});

// 카카오 액세스 토큰 가져오기
async function getKakaoAccessToken(code) {
  const tokenUrl = 'https://kauth.kakao.com/oauth/token';
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: KAKAO_CLIENT_ID,
    redirect_uri: `${process.env.NODE_ENV === 'production' ? 'https://resortbyte.com' : 'http://localhost:3001'}/auth/kakao/callback`,
    code: code,
  });

  if (KAKAO_CLIENT_SECRET) {
    params.append('client_secret', KAKAO_CLIENT_SECRET);
  }

  const response = await axios.post(tokenUrl, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data.access_token;
}

// 카카오 사용자 정보 가져오기
async function getKakaoUserInfo(accessToken) {
  const userInfoUrl = 'https://kapi.kakao.com/v2/user/me';
  const response = await axios.get(userInfoUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const userData = response.data;
  console.log('카카오 사용자 정보:', userData);

  return {
    id: userData.id.toString(),
    email: userData.kakao_account?.email || '',
    name: userData.kakao_account?.profile?.nickname || '카카오 사용자',
    profile_image: userData.kakao_account?.profile?.profile_image_url || '',
    mobile: userData.kakao_account?.phone_number || '', // 전화번호 (동의 시에만)
  };
}

// 카카오 OAuth 콜백 처리
app.post('/auth/kakao/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    console.log('카카오 콜백 요청:', { code: code ? '있음' : '없음', state });

    if (!code) {
      return res.status(400).json({ success: false, error: '인증 코드가 없습니다.' });
    }

    // 1. 액세스 토큰 가져오기
    let accessToken;
    try {
      accessToken = await getKakaoAccessToken(code);
      console.log('카카오 액세스 토큰 획득 성공');
    } catch (error) {
      console.error('카카오 액세스 토큰 오류:', error.response?.data || error.message);
      return res.status(400).json({ success: false, error: '액세스 토큰을 가져올 수 없습니다.' });
    }

    // 2. 사용자 정보 가져오기
    let kakaoUser;
    try {
      kakaoUser = await getKakaoUserInfo(accessToken);
      console.log('카카오 사용자 정보 획득 성공:', kakaoUser.name);
    } catch (error) {
      console.error('카카오 사용자 정보 오류:', error.response?.data || error.message);
      return res.status(400).json({ success: false, error: '사용자 정보를 가져올 수 없습니다.' });
    }

    // 3. Firebase Auth에서 사용자 생성/업데이트
    const email = kakaoUser.email || `kakao_${kakaoUser.id}@kakao.local`;
    const uid = `kakao_${kakaoUser.id}`;
    
    try {
      await admin.auth().getUser(uid);
      console.log('기존 Firebase 사용자:', uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        await admin.auth().createUser({
          uid: uid,
          email: email,
          displayName: kakaoUser.name,
          photoURL: kakaoUser.profile_image,
        });
        console.log('새 Firebase 사용자 생성:', uid);
      } else {
        throw error;
      }
    }

    // 4. Firestore에 사용자 정보 저장
    const userDoc = admin.firestore().doc(`users/${uid}`);
    const userSnapshot = await userDoc.get();
    
    const userData = {
      email: email,
      displayName: kakaoUser.name,
      mobile: kakaoUser.mobile || '',
      profile_image: kakaoUser.profile_image || '',
      provider: 'kakao',
      providerId: kakaoUser.id,
      updatedAt: new Date().toISOString(),
    };

    if (!userSnapshot.exists) {
      // 새 사용자인 경우
      userData.role = 'jobseeker'; // 기본 역할
      userData.createdAt = new Date().toISOString();
      await userDoc.set(userData);
      console.log('새 사용자 Firestore 문서 생성:', uid);
    } else {
      // 기존 사용자인 경우
      await userDoc.update(userData);
      console.log('기존 사용자 Firestore 문서 업데이트:', uid);
    }

    // 5. 커스텀 토큰 생성 (서비스 계정 키가 있는 경우에만)
    let customToken = null;
    try {
      customToken = await admin.auth().createCustomToken(uid);
      console.log('커스텀 토큰 생성 성공');
    } catch (error) {
      console.log('커스텀 토큰 생성 실패 (서비스 계정 키 없음):', error.message);
    }

    // 6. 응답
    return res.json({
      success: true,
      customToken: customToken,
      user: {
        id: kakaoUser.id,
        uid: uid,
        email: email,
        name: kakaoUser.name,
        mobile: kakaoUser.mobile || '',
        profile_image: kakaoUser.profile_image || '',
        provider: 'kakao',
      },
    });

  } catch (error) {
    console.error('카카오 콜백 처리 실패:', error);
    return res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
  }
});

// 구글 JWT 토큰 검증
async function verifyGoogleToken(idToken) {
  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(GOOGLE_CLIENT_ID);
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    console.log('구글 토큰 검증 성공:', payload.name);
    
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      profile_image: payload.picture || '',
      email_verified: payload.email_verified,
    };
  } catch (error) {
    console.error('구글 토큰 검증 실패:', error);
    throw error;
  }
}

// 구글 OAuth 콜백 처리
app.post('/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    console.log('구글 콜백 요청:', { code: code ? '있음' : '없음', state });

    if (!code) {
      return res.status(400).json({ success: false, error: '인증 코드가 없습니다.' });
    }

    // 1. 구글 액세스 토큰 가져오기
    let googleUser;
    try {
      const accessToken = await getGoogleAccessToken(code);
      googleUser = await getGoogleUserInfo(accessToken);
      console.log('구글 사용자 정보 가져오기 성공:', googleUser.name);
    } catch (error) {
      console.error('구글 사용자 정보 가져오기 오류:', error.message);
      return res.status(400).json({ success: false, error: '사용자 정보를 가져올 수 없습니다.' });
    }

    // 2. Firebase Auth에서 사용자 생성/업데이트
    const email = googleUser.email;
    const uid = `google_${googleUser.id}`;
    
    try {
      await admin.auth().getUser(uid);
      console.log('기존 Firebase 사용자:', uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        await admin.auth().createUser({
          uid: uid,
          email: email,
          displayName: googleUser.name,
          photoURL: googleUser.profile_image,
          emailVerified: googleUser.email_verified,
        });
        console.log('새 Firebase 사용자 생성:', uid);
      } else {
        throw error;
      }
    }

    // 3. Firestore에 사용자 정보 저장
    const userDoc = admin.firestore().doc(`users/${uid}`);
    const userSnapshot = await userDoc.get();
    
    const userData = {
      email: email,
      displayName: googleUser.name,
      mobile: '', // 구글은 전화번호 제공하지 않음
      profile_image: googleUser.profile_image || '',
      provider: 'google',
      providerId: googleUser.id,
      emailVerified: googleUser.email_verified,
      updatedAt: new Date().toISOString(),
    };

    if (!userSnapshot.exists) {
      // 새 사용자인 경우
      userData.role = 'jobseeker'; // 기본 역할
      userData.createdAt = new Date().toISOString();
      await userDoc.set(userData);
      console.log('새 사용자 Firestore 문서 생성:', uid);
    } else {
      // 기존 사용자인 경우
      await userDoc.update(userData);
      console.log('기존 사용자 Firestore 문서 업데이트:', uid);
    }

    // 4. 커스텀 토큰 생성 (서비스 계정 키가 있는 경우에만)
    let customToken = null;
    try {
      customToken = await admin.auth().createCustomToken(uid);
      console.log('커스텀 토큰 생성 성공');
    } catch (error) {
      console.log('커스텀 토큰 생성 실패 (서비스 계정 키 없음):', error.message);
    }

    // 5. 응답
    return res.json({
      success: true,
      customToken: customToken,
      user: {
        id: googleUser.id,
        uid: uid,
        email: email,
        name: googleUser.name,
        mobile: '',
        profile_image: googleUser.profile_image || '',
        provider: 'google',
        emailVerified: googleUser.email_verified,
      },
    });

  } catch (error) {
    console.error('구글 콜백 처리 실패:', error);
    return res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
  }
});

exports.api = onRequest({ region: 'asia-northeast3' }, app);



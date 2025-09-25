require('dotenv').config();
const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3004;

// Idempotency store for authorization codes (in-memory with TTL)
const usedAuthCodes = new Map(); // code -> expiresAt(ms)
const AUTH_CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isCodeRecentlyUsed(code) {
  const now = Date.now();
  // cleanup expired entries opportunistically
  for (const [k, exp] of usedAuthCodes) {
    if (exp <= now) usedAuthCodes.delete(k);
  }
  const expiresAt = usedAuthCodes.get(code);
  if (expiresAt && expiresAt > now) {
    return true;
  }
  usedAuthCodes.set(code, now + AUTH_CODE_TTL_MS);
  return false;
}

// CORS  -     ȯ 
const NODE_ENV = process.env.NODE_ENV || 'development';
const defaultOrigins = ['http://localhost:3005', 'http://127.0.0.1:3005'];
const envOrigins = (process.env.APP_ORIGINS || process.env.APP_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
const ALLOWED_ORIGINS = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(cors({
  origin: function (origin, callback) {
    //  ȯ濡  ų( û)   
    if (NODE_ENV !== 'production') return callback(null, true);

    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Preflight 
app.options('*', cors());
app.use(express.json());

// Firebase Admin SDK ʱȭ
try {
  const serviceAccount = require('./firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://resortbyte-dev.firebaseio.com'
  });
  console.log('?? Firebase Admin SDK ʱȭ ');
} catch (error) {
  console.error('? Firebase Admin SDK ʱȭ :', error.message);
}

// ̹ API  - ȯ溯 
const NAVER_CLIENT_ID = process.env.NAVER_LOGIN_CLIENT_ID || process.env.REACT_APP_NAVER_LOGIN_CLIENT_ID || process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_LOGIN_CLIENT_SECRET || process.env.REACT_APP_NAVER_LOGIN_CLIENT_SECRET || process.env.NAVER_CLIENT_SECRET;

if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
  console.warn('?? ̹α Client ID/Secret ȯ溯  ʾҽϴ.');
}

// ̹    Լ
async function getNaverUserInfo(code, redirectUri) {
  try {
    // 1. ׼ ū û (form-encoded)
    const form = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: NAVER_CLIENT_ID,
      client_secret: NAVER_CLIENT_SECRET,
      code: code,
      redirect_uri: redirectUri,
    });

    const tokenResponse = await axios.post(
      'https://nid.naver.com/oauth2.0/token',
      form.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token } = tokenResponse.data;

    // 2.   û
    const userResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    //  ʵ Ȯο( )
    try {
      const keys = Object.keys(userResponse.data?.response || {});
      console.log(' Naver profile keys:', keys);
    } catch {}

    return userResponse.data.response;
  } catch (error) {
    console.error('? ̹    :', error.response?.data || error.message);
    throw error;
  }
}

// ̹ ݹ Ʈ
app.post('/auth/naver/callback', async (req, res) => {
  try {
    const { code, state, redirectUri } = req.body;
    console.log('?? ̹ ݹ :', { code: code ? code.slice(0, 8) + '...' : null, state, redirectUri });

    if (!code) {
      return res.status(400).json({ success: false, error: 'Authorization code is required' });
    }

    // Idempotency: ignore reused codes for a short TTL
    if (isCodeRecentlyUsed(code)) {
      return res.status(409).json({ success: false, error: 'Authorization code already used' });
    }

    // state로 요청된 역할 (신규 가입 시 기본값으로만 사용)
    const parsedRole = state ? String(state).split('|')[0] : 'jobseeker';

    // Ʈ  redirectUri 켱  (̹ ְܼ ġؾ )
    let effectiveRedirectUri = redirectUri;
    if (!effectiveRedirectUri && process.env.NAVER_REDIRECT_URI) {
      effectiveRedirectUri = process.env.NAVER_REDIRECT_URI;
    }
    if (!effectiveRedirectUri) {
      const referer = req.headers.referer || '';
      try {
        const url = new URL(referer);
        effectiveRedirectUri = `${url.origin}/auth/naver/callback`;
      } catch {
        effectiveRedirectUri = `${ALLOWED_ORIGINS[0] || 'http://localhost:3005'}/auth/naver/callback`;
      }
    }
    console.log('Using redirectUri for token exchange:', effectiveRedirectUri);

    // ̹   
    const naverUser = await getNaverUserInfo(code, effectiveRedirectUri);
    const uid = `naver_${naverUser.id}`;

    // Firestore    Ȯ
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const isNewUser = !userDoc.exists;
    const existingData = userDoc.exists ? userDoc.data() || {} : {};

    // 기존 역할 우선 + 회사정보 존재 시 고용주로 승격
    let effectiveRole = existingData.role || parsedRole;
    try {
      const hasCompanyInfo = !!(
        existingData.companyName && existingData.companyAddress && existingData.companyPhone
      );
      if (effectiveRole !== 'employer' && hasCompanyInfo) {
        effectiveRole = 'employer';
      }
    } catch {}

    // Firebase Custom Token 
    const customToken = await admin.auth().createCustomToken(uid, {
      provider: 'naver',
      role: effectiveRole,
    });

    //   Firestore /Ʈ
    const toSave = {
      uid,
      email: naverUser.email || existingData.email || '',
      displayName: naverUser.name || naverUser.nickname || existingData.displayName || '',
      role: effectiveRole,
      contactPhone: naverUser.mobile || naverUser.mobile_e164 || existingData.contactPhone || '',
      provider: 'naver',
      naverId: naverUser.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: existingData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(toSave, { merge: true });

    // ȸ ʿ  Ǵ()
    const refreshed = (await userRef.get()).data() || {};
    const needsCompanyInfo = effectiveRole === 'employer' && (
      !refreshed.companyName || !refreshed.companyAddress || !refreshed.companyPhone
    );

    res.json({
      success: true,
      customToken,
      isNewUser,
      needsCompanyInfo,
      user: {
        uid,
        email: toSave.email,
        displayName: toSave.displayName,
        role: effectiveRole,
        contactPhone: toSave.contactPhone,
      }
    });

  } catch (error) {
    console.error('? ̹ ݹ ó :', error.response?.data || error.message || error);
    res.status(500).json({ success: false, error: error.response?.data || error.message || 'Internal Server Error' });
  }
});

app.get('/api/geocode', async (req, res) => {
  try {
    const keyword = String(req.query.query || '').trim();
    if (!keyword) {
      return res.status(400).json({ error: 'query parameter is required' });
    }

    const localFunctionsUrl = 'http://127.0.0.1:5002/resortbyte-dev/asia-northeast3/api/api/geocode';
    const cloudFunctionsUrl = 'https://api-asia-northeast3-resortbyte.cloudfunctions.net/api/geocode';
    const candidates = NODE_ENV === 'development'
      ? [localFunctionsUrl, cloudFunctionsUrl]
      : [cloudFunctionsUrl];

    let lastErr;
    for (const base of candidates) {
      try {
        const url = `${base}?query=${encodeURIComponent(keyword)}`;
        const r = await axios.get(url, { timeout: 10000 });
        // 그대로 프락시 반환
        return res.status(r.status).json(r.data);
      } catch (e) {
        lastErr = e;
        continue;
      }
    }

    return res.status(502).json({ error: 'Geocode upstream unavailable', detail: lastErr?.message || lastErr });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ｺ üũ Ʈ
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`?? Backend running on http://localhost:${PORT}`);
});

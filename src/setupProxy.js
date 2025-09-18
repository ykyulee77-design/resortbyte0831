const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5002',
      pathRewrite: {
        '^/api': '/resortbyte-dev/asia-northeast3/api/api', // Firebase Functions 경로 + Express 앱 경로
      },
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.log('프록시 오류:', err.message);
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('프록시 요청:', req.method, req.url, '→', proxyReq.path);
      },
    })
  );
};



const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 백엔드 API 프록시
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
      logLevel: 'silent',
    })
  );
};



import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 프로덕션에서는 불필요한 콘솔 로그를 무력화해 콘솔 오염을 방지합니다.
if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.log = () => {};
  // eslint-disable-next-line no-console
  console.debug = () => {};
  // eslint-disable-next-line no-console
  console.warn = () => {};
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

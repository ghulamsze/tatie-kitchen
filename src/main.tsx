import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './design/tokens.css';
import './design/components.css';
import './design/phone.css';
import './design/printMenu.css';
import { initTheme } from './design/theme.ts';
import { initSecureUrlSession } from './lib/security/secureSession.ts';

// Inisialisasi token acak URL setiap refresh & tema
initSecureUrlSession();
initTheme();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

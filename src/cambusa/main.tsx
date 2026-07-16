import React from 'react';
import ReactDOM from 'react-dom/client';
import { CambusaApp } from './CambusaApp';
import './cambusa.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/cambusa-sw.js'));
}

ReactDOM.createRoot(document.getElementById('cambusa-root')!).render(
  <React.StrictMode><CambusaApp /></React.StrictMode>,
);

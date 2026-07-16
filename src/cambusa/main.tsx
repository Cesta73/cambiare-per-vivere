import React from 'react';
import ReactDOM from 'react-dom/client';
import { CambusaApp } from './CambusaApp';
import './cambusa.css';
import './cambusa-embedded.css';
import './cambusa-dialog-fixes.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/cambusa-sw.js'));
}

const embeddedPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname) &&
  new URLSearchParams(window.location.search).has('embedded');

ReactDOM.createRoot(document.getElementById('cambusa-root')!).render(
  <React.StrictMode><CambusaApp embedded={embeddedPreview} /></React.StrictMode>,
);

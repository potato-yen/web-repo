import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import AItest from './AItest';

const root = createRoot(document.getElementById('root'));
const el = document.getElementById('react-root');
if (el) {
  createRoot(el).render(<AItest />);
}
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

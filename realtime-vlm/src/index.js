// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // You need App.js or App.jsx as the main component
import './index.css';    // Optional: if you use global CSS

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

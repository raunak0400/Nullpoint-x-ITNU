import React from 'react';

export const VsIcon = () => (
    <svg width="40" height="40" viewBox="0 0 100 100" className="rounded-full">
      <defs>
        <linearGradient id="vs-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="black" stroke="url(#vs-gradient)" strokeWidth="4" />
      <path d="M 30 40 C 40 60, 40 30, 50 50 C 60 70, 60 40, 70 60" stroke="url(#vs-gradient)" fill="none" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
  

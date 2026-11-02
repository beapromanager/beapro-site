import React from 'react';
import { createRoot } from 'react-dom/client';
import './ops.css';
import { App } from './App.tsx';

// The owner's dashboard: no intro, no counting, no service worker, and nothing in the game links here.
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);

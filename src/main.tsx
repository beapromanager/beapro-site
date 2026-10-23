import React from 'react';
import { createRoot } from 'react-dom/client';
import './ui/tokens.css';
import './ui/onboard.css';
import { App } from './ui/App.tsx';
import { ErrorBoundary } from './ui/components/Crashed.tsx';
import { wireInstall, registerWorker } from './ui/install.ts';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* the net: a crash becomes a card with a way back and a report, not a blank */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Chrome fires its install event early and only once, so the listener has to be
// in place before anything renders. The worker is what makes it fire at all.
wireInstall();
registerWorker(import.meta.env.BASE_URL);

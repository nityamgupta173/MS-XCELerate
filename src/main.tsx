import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './ui/base.css';

const Kiosk = lazy(() => import('./surfaces/kiosk/Kiosk'));
const Phone = lazy(() => import('./surfaces/Phone'));
const Expert = lazy(() => import('./surfaces/Expert'));
const Council = lazy(() => import('./surfaces/Council'));
const Demo = lazy(() => import('./surfaces/Demo'));
const About = lazy(() => import('./surfaces/About'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Navigate to="/demo" replace />} />
          <Route path="/kiosk" element={<Kiosk />} />
          <Route path="/m" element={<Phone />} />
          <Route path="/expert" element={<Expert />} />
          <Route path="/council" element={<Council />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/demo" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppLayout } from '@/components/layouts/AppLayout/AppLayout';
import { DemoPage } from '@/components/pages/DemoPage/DemoPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppLayout>
      <DemoPage />
    </AppLayout>
  </StrictMode>,
);

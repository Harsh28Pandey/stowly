import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import { AuthProvider } from './auth';
import { VaultProvider } from './vault';
import { StorageProvider } from './storage';
import { NotificationProvider } from './notifications';
import { LiveStoreProvider } from './data/liveStore';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LiveStoreProvider>
          <StorageProvider>
            <NotificationProvider>
              <VaultProvider>
                <App />
                <Toaster position="top-center" richColors closeButton />
              </VaultProvider>
            </NotificationProvider>
          </StorageProvider>
        </LiveStoreProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

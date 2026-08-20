import React from 'react';
import ReactDOM from 'react-dom/client';
import { AdaptivityProvider, AppRoot, ConfigProvider } from '@vkontakte/vkui';
import vkBridge from '@vkontakte/vk-bridge';
import App from './App';
import '@vkontakte/vkui/dist/vkui.css';

// Инициализация VK Bridge
vkBridge.send('VKWebAppInit').catch(console.error);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ConfigProvider platform="vkcom" appearance="light">
      <AdaptivityProvider>
        <AppRoot mode="embedded" scroll="contain">
          <App />
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  </React.StrictMode>
);
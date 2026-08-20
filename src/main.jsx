import React from 'react';
import ReactDOM from 'react-dom/client';
import { AdaptivityProvider, AppRoot, ConfigProvider } from '@vkontakte/vkui';
import vkBridge from '@vkontakte/vk-bridge';
import App from './App';
import '@vkontakte/vkui/dist/vkui.css';
import './styles.css';

vkBridge.send('VKWebAppInit');

ReactDOM.createRoot(document.getElementById('root')).render(
  <ConfigProvider platform="vkcom" appearance="light">
    <AdaptivityProvider>
      <AppRoot>
        <App />
      </AppRoot>
    </AdaptivityProvider>
  </ConfigProvider>
);
import React from 'react';
import ReactDOM from 'react-dom/client';
import { 
  AdaptivityProvider, 
  AppRoot, 
  ConfigProvider,
  useAdaptivity
} from '@vkontakte/vkui';
import vkBridge from '@vkontakte/vk-bridge';
import App from './App';
import '@vkontakte/vkui/dist/vkui.css';
import './styles.css';

// Инициализируем VK Bridge
vkBridge.send('VKWebAppInit');

// Компонент для получения настроек адаптивности
function AppWrapper() {
  return (
    <ConfigProvider 
      platform="vkcom" 
      appearance="light"
      webviewType="internal"
    >
      <AdaptivityProvider>
        <AppRoot 
          mode="embedded"
          scroll="contain"
        >
          <App />
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);

// Отправляем событие о готовности приложения
vkBridge.send('VKWebAppSetViewSettings', {
  status_bar_style: 'light',
  action_bar_color: 'none'
}).catch(console.error);
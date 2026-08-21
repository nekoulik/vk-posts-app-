import React, { useState, useEffect } from 'react';
import vkBridge from '@vkontakte/vk-bridge';
import {
  Panel,
  PanelHeader,
  Group,
  Button,
  Div,
  Textarea,
  Snackbar,
  ScreenSpinner
} from '@vkontakte/vkui';

export default function App() {
  const [fetching, setFetching] = useState(true);
  const [post, setPost] = useState({ text: '' });
  const [snackbar, setSnackbar] = useState(null);
  const [groupId, setGroupId] = useState('-240736389');

  useEffect(() => {
    vkBridge.send('VKWebAppInit')
      .then(() => {
        console.log('VK Bridge initialized');
        setFetching(false);
      })
      .catch((error) => {
        console.error('Init error:', error);
        setFetching(false);
      });
  }, []);

  const publishPost = async () => {
    if (!post.text.trim()) {
      setSnackbar('⚠️ Введите текст поста');
      return;
    }

    const ownerId = groupId ? parseInt(groupId) : -240736389;

    try {
      setSnackbar('🔑 Получение токена...');

      // Получаем токен доступа
      const tokenResponse = await vkBridge.send('VKWebAppGetAccessToken', {
        app_id: 54729099,
        scope: 'wall,groups'
      });

      const accessToken = tokenResponse.access_token;
      console.log('Token received');

      setSnackbar('⏳ Публикация...');

      // Публикуем пост с токеном
      const response = await vkBridge.send('VKWebAppCallAPIMethod', {
        method: 'wall.post',
        params: {
          owner_id: ownerId,
          message: post.text,
          from_group: 1,
          access_token: accessToken,
        },
      });

      console.log('Post published:', response);
      setSnackbar('✅ Пост опубликован!');
      setPost({ text: '' });
    } catch (e) {
      console.error('Full error:', e);
      const errorMsg = e.error_data?.error_reason || e.error_msg || 'Неизвестная ошибка';
      setSnackbar('❌ Ошибка: ' + errorMsg);
    }
  };

  if (fetching) {
    return <ScreenSpinner size="large" />;
  }

  return (
    <Panel id="main">
      <PanelHeader>Посты для группы</PanelHeader>

      <Group header={<div style={{ padding: '8px 16px', fontWeight: 'bold' }}>Редактор поста</div>}>
        <Div>
          <Textarea
            placeholder="Текст поста..."
            value={post.text}
            onChange={(e) => setPost(p => ({ ...p, text: e.target.value }))}
            style={{ minHeight: 140 }}
          />
        </Div>

        <Div>
          <Textarea
            placeholder="ID группы (с минусом, например: -240736389)"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            style={{ minHeight: 40 }}
          />
          <div style={{ fontSize: '12px', color: '#818C99', marginTop: '4px' }}>
            ID группы с минусом
          </div>
        </Div>
      </Group>

      <Group>
        <Div>
          <Button
            size="l"
            stretched
            mode="primary"
            onClick={publishPost}
            disabled={!post.text.trim()}
          >
            Опубликовать
          </Button>
        </Div>
      </Group>

      {snackbar && (
        <Snackbar onClose={() => setSnackbar(null)} duration={4000}>
          {snackbar}
        </Snackbar>
      )}
    </Panel>
  );
}
import React, { useState, useEffect } from 'react';
import vkBridge from '@vkontakte/vk-bridge';
import {
  Panel, PanelHeader, Group, Button, Div,
  ScreenSpinner, Snackbar
} from '@vkontakte/vkui';

export default function App() {
  const [fetching, setFetching] = useState(true);
  const [post, setPost] = useState({ text: '' });
  const [snackbar, setSnackbar] = useState(null);

  useEffect(() => {
    setFetching(false);
  }, []);

  const publishPost = async () => {
    if (!post.text.trim()) {
      setSnackbar('Введите текст поста');
      return;
    }
    try {
      await vkBridge.send('VKWebAppCallAPIMethod', {
        method: 'wall.post',
        params: {
          owner_id: -1,
          message: post.text,
          from_group: 1,
        },
      });
      setSnackbar('✅ Пост опубликован!');
      setPost({ text: '' });
    } catch (e) {
      setSnackbar('❌ Ошибка: ' + e.message);
    }
  };

  if (fetching) return <ScreenSpinner size="large" />;

  return (
    <Panel id="main">
      <PanelHeader>Посты для группы</PanelHeader>

      <Group header={<div style={{ padding: '8px 16px' }}>Редактор поста</div>}>
        <Div>
          <textarea
            placeholder="Текст поста..."
            value={post.text}
            onChange={(e) => setPost(p => ({ ...p, text: e.target.value }))}
            style={{ width: '100%', minHeight: 140, padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
          />
        </Div>
      </Group>

      <Group>
        <Div>
          <Button size="l" stretched mode="primary" onClick={publishPost}>
            Опубликовать
          </Button>
        </Div>
      </Group>

      {snackbar && (
        <Snackbar onClose={() => setSnackbar(null)}>{snackbar}</Snackbar>
      )}
    </Panel>
  );
}
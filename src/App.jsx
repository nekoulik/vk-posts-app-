import React, { useState, useEffect } from 'react';
import vkBridge from '@vkontakte/vk-bridge';

export default function App() {
  const [post, setPost] = useState({ text: '' });
  const [snackbar, setSnackbar] = useState(null);
  const [groupId, setGroupId] = useState('-240736389');

  useEffect(() => {
    vkBridge.send('VKWebAppInit')
      .then(() => {
        console.log('VK Bridge initialized');
      })
      .catch((error) => {
        console.error('Init error:', error);
      });
  }, []);

  const publishPost = async () => {
    if (!post.text.trim()) {
      setSnackbar('⚠️ Введите текст поста');
      setTimeout(() => setSnackbar(null), 3000);
      return;
    }

    const ownerId = groupId ? parseInt(groupId) : -240736389;

    try {
      setSnackbar(' Получение токена...');

      const tokenResponse = await vkBridge.send('VKWebAppGetAuthToken', {
        app_id: 54729099,
        scope: 'wall'  // ← ИСПРАВЛЕНО: было scopes, стало scope
      });

      const accessToken = tokenResponse.access_token;
      console.log('Token received');

      setSnackbar('⏳ Публикация...');

      const response = await vkBridge.send('VKWebAppCallAPIMethod', {
        method: 'wall.post',
        params: {
          owner_id: ownerId,
          message: post.text,
          from_group: 1,
          access_token: accessToken,
          v: '5.131'
        },
      });

      console.log('Post published:', response);
      setSnackbar('✅ Пост опубликован!');
      setPost({ text: '' });
      setTimeout(() => setSnackbar(null), 3000);
    } catch (e) {
      console.error('Full error:', e);
      const errorMsg = e.error_data?.error_reason || e.error_msg || 'Неизвестная ошибка';
      setSnackbar('❌ Ошибка: ' + errorMsg);
      setTimeout(() => setSnackbar(null), 5000);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: '-apple-system, BlinkMacSystemFont, Roboto, Tahoma, sans-serif',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h2 style={{ 
        marginBottom: '20px', 
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#000'
      }}>
        Редактор поста
      </h2>

      <div style={{ marginBottom: '15px' }}>
        <textarea
          placeholder="Текст поста..."
          value={post.text}
          onChange={(e) => setPost(p => ({ ...p, text: e.target.value }))}
          style={{ 
            width: '100%', 
            minHeight: '140px', 
            padding: '12px',
            fontSize: '15px',
            border: '1px solid #dfe1e5',
            borderRadius: '8px',
            resize: 'vertical',
            boxSizing: 'border-box',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="ID группы (с минусом, например: -240736389)"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '12px',
            fontSize: '15px',
            border: '1px solid #dfe1e5',
            borderRadius: '8px',
            boxSizing: 'border-box',
            fontFamily: 'inherit'
          }}
        />
        <div style={{ 
          fontSize: '13px', 
          color: '#818C99', 
          marginTop: '5px' 
        }}>
          ID группы с минусом
        </div>
      </div>

      <button
        onClick={publishPost}
        disabled={!post.text.trim()}
        style={{
          width: '100%',
          padding: '12px',
          background: !post.text.trim() ? '#a8b2c1' : '#4a76a8',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '500',
          cursor: !post.text.trim() ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s'
        }}
      >
        Опубликовать
      </button>

      {snackbar && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          background: snackbar.includes('✅') ? '#4CAF50' : snackbar.includes('️') ? '#FF9800' : '#f44336',
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '15px',
          zIndex: 1000,
          textAlign: 'center',
          minWidth: '280px'
        }}>
          {snackbar}
        </div>
      )}
    </div>
  );
}
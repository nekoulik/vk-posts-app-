import React, { useState, useEffect } from 'react';
import vkBridge from '@vkontakte/vk-bridge';

// ВСТАВЬТЕ СЮДА ВАШ СЕРВИСНЫЙ ТОКЕН ГРУППЫ
const SERVICE_TOKEN = 'vk1.a.5mzvvWhn31q52jIBExVBZ2GwlLTejbheETudjePd6yPQt-GIv0vbzHvQ9MizSZqRkK-VgBHyCDVSayGBET3xCL75fTurTWVrI9BFUaRxRlPU-IouJNEUPMUI8ITOvwAHI0Qo7FQSfSfUk63KJxNVI5wjiF20SAlhjSeHo_nacEzUPETaEOIaKDnfUhmaDu3D8CjEwxN_470Ty_gBBQUtZQ';

export default function App() {
  const [post, setPost] = useState({ text: '' });
  const [snackbar, setSnackbar] = useState(null);
  const [groupId, setGroupId] = useState('240736389');

  useEffect(() => {
    vkBridge.send('VKWebAppInit').catch(console.error);
  }, []);

  const publishPost = async () => {
    if (!post.text.trim()) {
      setSnackbar('⚠️ Введите текст поста');
      setTimeout(() => setSnackbar(null), 3000);
      return;
    }

    // Убираем минус если есть
    const cleanGroupId = groupId.replace('-', '');

    try {
      setSnackbar('⏳ Публикация...');

      const response = await fetch(
        `https://api.vk.com/method/wall.post?` +
        `owner_id=-${cleanGroupId}&` +
        `message=${encodeURIComponent(post.text)}&` +
        `access_token=${SERVICE_TOKEN}&` +
        `v=5.131`
      );
      
      const data = await response.json();
      console.log('API Response:', data);

      if (data.error) {
        throw new Error(data.error.error_msg);
      }

      setSnackbar('✅ Пост опубликован!');
      setPost({ text: '' });
      setTimeout(() => setSnackbar(null), 3000);
    } catch (e) {
      console.error('Error:', e);
      setSnackbar('❌ Ошибка: ' + e.message);
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
      <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
        Редактор поста
      </h2>

      <div style={{ marginBottom: '15px' }}>
        <textarea
          placeholder="Текст поста..."
          value={post.text}
          onChange={(e) => setPost(p => ({ ...p, text: e.target.value }))}
          style={{ 
            width: '100%', minHeight: '140px', padding: '12px',
            fontSize: '15px', border: '1px solid #dfe1e5',
            borderRadius: '8px', resize: 'vertical', boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="ID группы (например: 240736389)"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          style={{ 
            width: '100%', padding: '12px', fontSize: '15px',
            border: '1px solid #dfe1e5', borderRadius: '8px', boxSizing: 'border-box'
          }}
        />
        <div style={{ fontSize: '13px', color: '#818C99', marginTop: '5px' }}>
          ID группы без минуса
        </div>
      </div>

      <button
        onClick={publishPost}
        disabled={!post.text.trim()}
        style={{
          width: '100%', padding: '12px',
          background: !post.text.trim() ? '#a8b2c1' : '#4a76a8',
          color: 'white', border: 'none', borderRadius: '8px',
          fontSize: '16px', fontWeight: '500',
          cursor: !post.text.trim() ? 'not-allowed' : 'pointer'
        }}
      >
        Опубликовать
      </button>

      {snackbar && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '50%',
          transform: 'translateX(-50%)', padding: '12px 24px',
          background: snackbar.includes('✅') ? '#4CAF50' : '#f44336',
          color: 'white', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '15px', zIndex: 1000
        }}>
          {snackbar}
        </div>
      )}
    </div>
  );
}
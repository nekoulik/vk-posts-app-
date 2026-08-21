import React, { useState, useEffect } from 'react';
import vkBridge from '@vkontakte/vk-bridge';

// Получаем токен из переменной окружения
const SERVICE_TOKEN = import.meta.env.VITE_SERVICE_TOKEN;

// Шаблоны постов
const TEMPLATES = [
  {
    id: 'news',
    name: '📢 Новость',
    text: '📢 Важная новость!\n\n{заголовок}\n\n{описание}\n\n#новости #важно'
  },
  {
    id: 'promo',
    name: '🎉 Акция',
    text: '🎉 АКЦИЯ!\n\n{название акции}\n\n📅 С {дата начала} по {дата конца}\n\n{условия}\n\n#акция #скидки'
  },
  {
    id: 'question',
    name: '❓ Вопрос',
    text: '❓ Вопрос к аудитории:\n\n{текст вопроса}\n\n✍️ Делитесь мнением в комментариях!\n\n#опрос #вопрос'
  },
  {
    id: 'article',
    name: '📝 Статья',
    text: '{заголовок статьи}\n\n{вступление}\n\n---\n\n{основной текст}\n\n---\n\n{заключение}\n\n#статья'
  },
  {
    id: 'product',
    name: '🛍️ Товар',
    text: '🛍️ {название товара}\n\n💰 Цена: {цена}\n\n📦 {описание}\n\n📩 Для заказа пишите в ЛС\n\n#товар #магазин'
  },
  {
    id: 'event',
    name: '📅 Событие',
    text: '📅 Приглашаем на событие!\n\n{название события}\n\n🗓️ {дата}\n {время}\n📍 {место}\n\n{описание}\n\n#событие #встреча'
  },
  {
    id: 'quote',
    name: '💬 Цитата',
    text: ' {текст цитаты}\n\n— {автор}\n\n#цитата #мудрость'
  },
  {
    id: 'contest',
    name: '🏆 Конкурс',
    text: '🏆 КОНКУРС!\n\n{описание конкурса}\n\n Приз: {приз}\n\n До {дата окончания}\n\nУсловия:\n{условия участия}\n\n#конкурс #розыгрыш'
  }
];

// Ключ для localStorage
const DRAFT_KEY = 'vk_posts_draft';

export default function App() {
  const [post, setPost] = useState({ text: '' });
  const [snackbar, setSnackbar] = useState(null);
  const [groupId, setGroupId] = useState('240736389');
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Загрузка черновика при открытии приложения
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.text) {
          setPost({ text: draft.text });
          setHasDraft(true);
          console.log('Черновик восстановлен');
        }
        if (draft.groupId) {
          setGroupId(draft.groupId);
        }
        if (draft.templateId) {
          const template = TEMPLATES.find(t => t.id === draft.templateId);
          if (template) {
            setSelectedTemplate(template);
          }
        }
      }
    } catch (e) {
      console.error('Ошибка загрузки черновика:', e);
    }

    vkBridge.send('VKWebAppInit').catch(console.error);
  }, []);

  // Автосохранение черновика при изменениях
  useEffect(() => {
    const draft = {
      text: post.text,
      groupId: groupId,
      templateId: selectedTemplate?.id || null,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setHasDraft(true);
  }, [post.text, groupId, selectedTemplate]);

  // Загрузка шаблона
  const loadTemplate = (template) => {
    setPost({ text: template.text });
    setSelectedTemplate(template);
    setShowTemplates(false);
    setSnackbar(`✅ Шаблон "${template.name}" загружен`);
    setTimeout(() => setSnackbar(null), 3000);
  };

  // Очистить текст и черновик
  const clearText = () => {
    setPost({ text: '' });
    setSelectedTemplate(null);
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setSnackbar('️ Черновик удалён');
    setTimeout(() => setSnackbar(null), 3000);
  };

  // Восстановить черновик (если был очищен)
  const restoreDraft = () => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.text) setPost({ text: draft.text });
        if (draft.groupId) setGroupId(draft.groupId);
        if (draft.templateId) {
          const template = TEMPLATES.find(t => t.id === draft.templateId);
          if (template) setSelectedTemplate(template);
        }
        setSnackbar('♻️ Черновик восстановлен');
        setTimeout(() => setSnackbar(null), 3000);
      }
    } catch (e) {
      console.error('Ошибка восстановления:', e);
    }
  };

  const publishPost = async () => {
    if (!post.text.trim()) {
      setSnackbar('️ Введите текст поста');
      setTimeout(() => setSnackbar(null), 3000);
      return;
    }

    if (!SERVICE_TOKEN) {
      setSnackbar('❌ Токен не настроен');
      setTimeout(() => setSnackbar(null), 3000);
      return;
    }

    const cleanGroupId = groupId.replace('-', '');

    try {
      setSnackbar('⏳ Публикация...');

      const response = await vkBridge.send('VKWebAppCallAPIMethod', {
        method: 'wall.post',
        params: {
          owner_id: -parseInt(cleanGroupId),
          message: post.text,
          from_group: 1,
          access_token: SERVICE_TOKEN,
          v: '5.131'
        },
      });

      console.log('Post published:', response);
      
      // Очищаем черновик после успешной публикации
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
      
      setSnackbar('✅ Пост опубликован!');
      setPost({ text: '' });
      setSelectedTemplate(null);
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
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h2 style={{ 
        marginBottom: '20px', 
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#000'
      }}>
        Редактор поста
      </h2>

      {/* Индикатор черновика */}
      {hasDraft && post.text && (
        <div style={{ 
          marginBottom: '15px', 
          padding: '10px 15px', 
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px'
        }}>
          <span style={{ color: '#856404' }}>
            💾 Есть сохранённый черновик
          </span>
          <button
            onClick={restoreDraft}
            style={{
              padding: '6px 12px',
              background: '#ffc107',
              color: '#856404',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            ♻️ Восстановить
          </button>
        </div>
      )}

      {/* Кнопки управления */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          style={{
            padding: '10px 20px',
            background: '#6c5ce7',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          {showTemplates ? '🙈 Скрыть шаблоны' : '📋 Выбрать шаблон'}
        </button>
        
        {(post.text || hasDraft) && (
          <button
            onClick={clearText}
            style={{
              padding: '10px 20px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🗑️ Очистить всё
          </button>
        )}
      </div>

      {/* Список шаблонов */}
      {showTemplates && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '20px', 
          background: '#f8f9fa',
          borderRadius: '12px',
          border: '1px solid #e0e0e0'
        }}>
          <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>
            📋 Выберите шаблон:
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
            gap: '12px' 
          }}>
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => loadTemplate(template)}
                style={{
                  padding: '15px',
                  background: selectedTemplate?.id === template.id ? '#6c5ce7' : 'white',
                  color: selectedTemplate?.id === template.id ? 'white' : '#333',
                  border: `2px solid ${selectedTemplate?.id === template.id ? '#6c5ce7' : '#e0e0e0'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  fontWeight: selectedTemplate?.id === template.id ? '600' : '400'
                }}
                onMouseEnter={(e) => {
                  if (selectedTemplate?.id !== template.id) {
                    e.target.style.borderColor = '#6c5ce7';
                    e.target.style.background = '#f0f0ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTemplate?.id !== template.id) {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.background = 'white';
                  }
                }}
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Текущий шаблон */}
      {selectedTemplate && !showTemplates && (
        <div style={{ 
          marginBottom: '15px', 
          padding: '12px', 
          background: '#e8f5e9',
          borderRadius: '8px',
          border: '1px solid #4caf50',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: '500', color: '#2e7d32' }}>
            ✅ Активен: {selectedTemplate.name}
          </span>
          <button
            onClick={() => setSelectedTemplate(null)}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              color: '#2e7d32',
              border: '1px solid #2e7d32',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Убрать
          </button>
        </div>
      )}

      {/* Текстовое поле */}
      <div style={{ marginBottom: '15px' }}>
        <textarea
          placeholder="Текст поста... (или выберите шаблон выше)"
          value={post.text}
          onChange={(e) => setPost(p => ({ ...p, text: e.target.value }))}
          style={{ 
            width: '100%', 
            minHeight: '200px', 
            padding: '15px',
            fontSize: '15px',
            border: '1px solid #dfe1e5',
            borderRadius: '8px',
            resize: 'vertical',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            lineHeight: '1.6'
          }}
        />
        <div style={{ 
          fontSize: '13px', 
          color: '#818C99', 
          marginTop: '8px',
          textAlign: 'right'
        }}>
          Символов: {post.text.length} {hasDraft && '• 💾 автосохранено'}
        </div>
      </div>

      {/* ID группы */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="ID группы (например: 240736389)"
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
          ID группы без минуса
        </div>
      </div>

      {/* Кнопка публикации */}
      <button
        onClick={publishPost}
        disabled={!post.text.trim()}
        style={{
          width: '100%',
          padding: '14px',
          background: !post.text.trim() ? '#a8b2c1' : '#4a76a8',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '17px',
          fontWeight: '600',
          cursor: !post.text.trim() ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s'
        }}
      >
        📤 Опубликовать
      </button>

      {/* Snackbar */}
      {snackbar && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '14px 28px',
          background: snackbar.includes('✅') ? '#4CAF50' : snackbar.includes('⚠️') ? '#FF9800' : '#f44336',
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '15px',
          zIndex: 1000,
          textAlign: 'center',
          minWidth: '300px',
          fontWeight: '500'
        }}>
          {snackbar}
        </div>
      )}
    </div>
  );
}
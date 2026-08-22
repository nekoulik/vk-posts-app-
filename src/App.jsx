import React, { useState, useEffect, useRef } from 'react';
import vkBridge from '@vkontakte/vk-bridge';

const SERVICE_TOKEN = import.meta.env.VITE_SERVICE_TOKEN;

const TEMPLATES = [
  { id: 'news', name: '📢 Новость', text: '📢 Важная новость!\n\n{заголовок}\n\n{описание}\n\n#новости #важно' },
  { id: 'promo', name: '🎉 Акция', text: '🎉 АКЦИЯ!\n\n{название акции}\n\n📅 С {дата начала} по {дата конца}\n\n{условия}\n\n#акция #скидки' },
  { id: 'question', name: '❓ Вопрос', text: '❓ Вопрос к аудитории:\n\n{текст вопроса}\n\n️ Делитесь мнением в комментариях!\n\n#опрос #вопрос' },
  { id: 'article', name: ' Статья', text: '📝 {заголовок статьи}\n\n{вступление}\n\n---\n\n{основной текст}\n\n---\n\n{заключение}\n\n#статья' },
  { id: 'product', name: '🛍️ Товар', text: '🛍️ {название товара}\n\n💰 Цена: {цена}\n\n📦 {описание}\n\n Для заказа пишите в ЛС\n\n#товар #магазин' },
  { id: 'event', name: '📅 Событие', text: '📅 Приглашаем на событие!\n\n{название события}\n\n️ {дата}\n⏰ {время}\n📍 {место}\n\n{описание}\n\n#событие #встреча' },
  { id: 'quote', name: '💬 Цитата', text: '💭 {текст цитаты}\n\n— {автор}\n\n#цитата #мудрость' },
  { id: 'contest', name: '🏆 Конкурс', text: '🏆 КОНКУРС!\n\n{описание конкурса}\n\n🎁 Приз: {приз}\n\n⏰ До {дата окончания}\n\nУсловия:\n{условия участия}\n\n#конкурс #розыгрыш' }
];

const POPULAR_TAGS = [
  'новости', 'важно', 'акция', 'скидки', 'конкурс',
  'розыгрыш', 'опрос', 'вопрос', 'товар', 'магазин',
  'статья', 'событие', 'встреча', 'цитата', 'мудрость',
  'реклама', 'услуги', 'работа', 'вакансия', 'обучение'
];

const DRAFT_KEY = 'vk_posts_draft';

export default function App() {
  const [post, setPost] = useState({ text: '' });
  const [snackbar, setSnackbar] = useState(null);
  const [groupId, setGroupId] = useState('240736389');
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [showPopularTags, setShowPopularTags] = useState(false);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.text && draft.text.trim()) {
          setPost({ text: draft.text });
          setGroupId(draft.groupId || '240736389');
          setTags(draft.tags || []);
          if (draft.images && draft.images.length > 0) {
            setImages(draft.images);
          }
          setDraftLoaded(true);
        }
      }
    } catch (e) {
      console.error('Ошибка загрузки черновика:', e);
    }
    vkBridge.send('VKWebAppInit').catch(console.error);
  }, []);

  useEffect(() => {
    if (post.text.trim() || tags.length > 0 || images.length > 0) {
      const draft = {
        text: post.text,
        groupId: groupId,
        tags: tags,
        images: images.map(img => ({ 
          tempId: img.tempId, url: img.url,
          id: img.id, owner_id: img.owner_id,
          access_key: img.access_key, uploaded: img.uploaded
        })),
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [post.text, groupId, tags, images]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (images.length + files.length > 10) {
      setSnackbar('⚠️ Можно загрузить максимум 10 фото');
      setTimeout(() => setSnackbar(null), 3000);
      return;
    }

    setUploading(true);
    setSnackbar(null);

    try {
      const cleanGroupId = groupId.replace('-', '');
      
      let userToken = SERVICE_TOKEN;
      
      try {
        const tokenResponse = await vkBridge.send('VKWebAppGetAuthToken', {
          app_id: 54729099,
          scope: 'photos,wall'
        });
        userToken = tokenResponse.access_token;
        console.log('✅ Получили токен пользователя');
      } catch (tokenError) {
        console.warn('Не удалось получить токен пользователя, используем сервисный:', tokenError);
      }

      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          setSnackbar(`⚠️ Файл "${file.name}" слишком большой (макс. 5MB)`);
          setTimeout(() => setSnackbar(null), 3000);
          continue;
        }

        const previewUrl = URL.createObjectURL(file);
        const tempId = Date.now() + Math.random();
        
        setImages(prev => [...prev, { tempId, url: previewUrl, uploading: true }]);

        try {
          // 🔥 ШАГ 1: Получаем URL для загрузки на стену группы
          const uploadServerResponse = await vkBridge.send('VKWebAppCallAPIMethod', {
            method: 'photos.getWallUploadServer',
            params: { 
              group_id: cleanGroupId,
              access_token: userToken,
              v: '5.131'
            }
          });

          const uploadData = uploadServerResponse.response || uploadServerResponse;
          const uploadUrl = uploadData.upload_url;
          
          if (!uploadUrl) throw new Error('Не получен upload_url');

          //  ШАГ 2: Загружаем файл ЧЕРЕЗ VERCEL API (обходим CORS!)
          const formData = new FormData();
          formData.append('photo', file);

          const uploadResponse = await fetch(`/api/upload?uploadUrl=${encodeURIComponent(uploadUrl)}`, {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) throw new Error(`Upload failed: ${uploadResponse.status}`);

          const uploadResult = await uploadResponse.json();
          console.log(' Результат загрузки:', uploadResult);

          // Извлекаем данные
          let photoData = uploadResult.photo;
          let server = uploadResult.server;
          let hash = uploadResult.hash;

          if (!photoData || !server || !hash) {
            throw new Error(`Неполные данные: photo=${photoData}, server=${server}, hash=${hash}`);
          }

          // 🔥 ШАГ 3: Сохраняем фото через saveWallPhoto с токеном пользователя
          const savedResponse = await vkBridge.send('VKWebAppCallAPIMethod', {
            method: 'photos.saveWallPhoto',
            params: {
              group_id: parseInt(cleanGroupId),
              photo: photoData,
              server: server,
              hash: hash,
              access_token: userToken,  // ← Токен пользователя!
              v: '5.131'
            }
          });

          console.log('💾 Сырой ответ photos.saveWallPhoto:', savedResponse);

          let savedPhoto = null;
          if (savedResponse && savedResponse.response) {
            savedPhoto = Array.isArray(savedResponse.response) ? savedResponse.response[0] : savedResponse.response;
          } else if (Array.isArray(savedResponse)) {
            savedPhoto = savedResponse[0];
          } else {
            savedPhoto = savedResponse;
          }

          console.log('🖼️ Извлечённые данные фото:', savedPhoto);

          if (!savedPhoto || !savedPhoto.id || !savedPhoto.owner_id) {
            throw new Error(`Не удалось получить ID фото. Получено: ${JSON.stringify(savedPhoto)}`);
          }

          setImages(prev => prev.map(img => 
            img.tempId === tempId ? {
              ...img,
              id: savedPhoto.id,
              owner_id: savedPhoto.owner_id,
              access_key: savedPhoto.access_key || '',
              uploading: false,
              uploaded: true
            } : img
          ));

          console.log(`✅ Фото сохранено: ${savedPhoto.owner_id}_${savedPhoto.id}`);

        } catch (uploadError) {
          console.error('❌ Ошибка загрузки фото:', uploadError);
          const errorMsg = uploadError.error_data?.error_msg || uploadError.error_msg || uploadError.message || 'Неизвестная ошибка';
          setSnackbar(`❌ Не удалось загрузить "${file.name}": ${errorMsg}`);
          setTimeout(() => setSnackbar(null), 4000);
          setImages(prev => prev.filter(img => img.tempId !== tempId));
        }
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setSnackbar('❌ Ошибка при загрузке фото: ' + error.message);
      setTimeout(() => setSnackbar(null), 5000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    const img = images[index];
    if (img.url && img.url.startsWith('blob:')) URL.revokeObjectURL(img.url);
    setImages(images.filter((_, i) => i !== index));
  };

  const addTag = (tag) => {
    const cleanTag = tag.trim().toLowerCase().replace(/^#/, '');
    if (!cleanTag) return;
    if (tags.includes(cleanTag)) {
      setSnackbar('️ Этот тег уже добавлен');
      setTimeout(() => setSnackbar(null), 2000);
      return;
    }
    setTags([...tags, cleanTag]);
    setNewTag('');
  };

  const removeTag = (tagToRemove) => setTags(tags.filter(tag => tag !== tagToRemove));

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(newTag);
    }
  };

  const getFinalText = () => {
    let text = post.text.trim();
    if (tags.length > 0) {
      text += '\n\n' + tags.map(t => `#${t}`).join(' ');
    }
    return text;
  };

  const loadTemplate = (template) => {
    setPost({ text: template.text });
    setSelectedTemplate(template);
    setShowTemplates(false);
    setSnackbar(`✅ Шаблон "${template.name}" загружен`);
    setTimeout(() => setSnackbar(null), 3000);
  };

  const clearAll = () => {
    images.forEach(img => { if (img.url && img.url.startsWith('blob:')) URL.revokeObjectURL(img.url); });
    setPost({ text: '' });
    setSelectedTemplate(null);
    setTags([]);
    setNewTag('');
    setImages([]);
    setShowTemplates(true);
    localStorage.removeItem(DRAFT_KEY);
    setDraftLoaded(false);
    setSnackbar('🗑️ Черновик удалён');
    setTimeout(() => setSnackbar(null), 3000);
  };

  const restoreDraft = () => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.text) {
          setPost({ text: draft.text });
          setGroupId(draft.groupId || '240736389');
          setTags(draft.tags || []);
          if (draft.images) setImages(draft.images.map(img => ({ ...img, uploading: false })));
          setSnackbar('♻️ Черновик восстановлен');
          setTimeout(() => setSnackbar(null), 3000);
        }
      }
    } catch (e) {
      console.error('Ошибка восстановления:', e);
    }
  };

  const publishPost = async () => {
    const finalText = getFinalText();
    
    if (!finalText.trim() && images.length === 0) {
      setSnackbar('⚠️ Введите текст или добавьте фото');
      setTimeout(() => setSnackbar(null), 3000);
      return;
    }

    if (images.some(img => img.uploading)) {
      setSnackbar('⏳ Дождитесь окончания загрузки фото...');
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

      let attachments = '';
      if (images.length > 0) {
        console.log('📸 Все фото в массиве:', images);
        const uploadedPhotos = images.filter(img => img.uploaded);
        console.log('✅ Только загруженные фото:', uploadedPhotos);
        
        const photoIds = uploadedPhotos.map(img => {
          const photoId = `${img.owner_id}_${img.id}`;
          console.log(`   Формируем ID: owner_id=${img.owner_id}, id=${img.id} → ${photoId}`);
          return photoId;
        });
        
        attachments = photoIds.join(',');
        console.log('📎 Итоговая строка attachments:', attachments);
      }

      const params = {
        owner_id: -parseInt(cleanGroupId),
        message: finalText || ' ',
        from_group: 1,
        access_token: SERVICE_TOKEN,
        v: '5.131'
      };

      if (attachments) {
        params.attachments = attachments;
      }

      console.log('🚀 ИТОГОВЫЕ ПАРАМЕТРЫ ДЛЯ wall.post:', params);

      const response = await vkBridge.send('VKWebAppCallAPIMethod', {
        method: 'wall.post',
        params: params
      });

      console.log('✅ Post published successfully:', response);
      
      images.forEach(img => { if (img.url && img.url.startsWith('blob:')) URL.revokeObjectURL(img.url); });
      localStorage.removeItem(DRAFT_KEY);
      setDraftLoaded(false);
      
      setSnackbar('✅ Пост опубликован!');
      setPost({ text: '' });
      setTags([]);
      setNewTag('');
      setImages([]);
      setSelectedTemplate(null);
      setTimeout(() => setSnackbar(null), 3000);
    } catch (e) {
      console.error('❌ Full error при публикации:', e);
      const errorMsg = e.error_data?.error_msg || e.error_data?.error_reason || e.error_msg || 'Неизвестная ошибка';
      setSnackbar(' Ошибка: ' + errorMsg);
      setTimeout(() => setSnackbar(null), 5000);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, Roboto, Tahoma, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '28px', fontWeight: 'bold', color: '#000' }}>Редактор поста</h2>

      {draftLoaded && (
        <div style={{ marginBottom: '15px', padding: '12px 15px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
          <span style={{ color: '#856404', fontWeight: '500' }}>💾 Есть сохранённый черновик</span>
          <button onClick={restoreDraft} style={{ padding: '8px 16px', background: '#ffc107', color: '#856404', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}>♻️ Восстановить</button>
        </div>
      )}

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => setShowTemplates(!showTemplates)} style={{ padding: '10px 20px', background: '#6c5ce7', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '500' }}>
          {showTemplates ? '🙈 Скрыть шаблоны' : '📋 Выбрать шаблон'}
        </button>
        {(post.text || draftLoaded || tags.length > 0 || images.length > 0) && (
          <button onClick={clearAll} style={{ padding: '10px 20px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '500' }}>️ Очистить всё</button>
        )}
      </div>

      {showTemplates && (
        <div style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>📋 Выберите шаблон:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
            {TEMPLATES.map((template) => (
              <button key={template.id} onClick={() => loadTemplate(template)} style={{ padding: '15px', background: selectedTemplate?.id === template.id ? '#6c5ce7' : 'white', color: selectedTemplate?.id === template.id ? 'white' : '#333', border: `2px solid ${selectedTemplate?.id === template.id ? '#6c5ce7' : '#e0e0e0'}`, borderRadius: '8px', fontSize: '14px', cursor: 'pointer', textAlign: 'left', fontWeight: selectedTemplate?.id === template.id ? '600' : '400' }}>
                {template.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedTemplate && !showTemplates && (
        <div style={{ marginBottom: '15px', padding: '12px', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #4caf50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '500', color: '#2e7d32' }}>✅ Активен: {selectedTemplate.name}</span>
          <button onClick={() => setSelectedTemplate(null)} style={{ padding: '6px 12px', background: 'transparent', color: '#2e7d32', border: '1px solid #2e7d32', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Убрать</button>
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <textarea placeholder="Текст поста... (или выберите шаблон выше)" value={post.text} onChange={(e) => setPost(p => ({ ...p, text: e.target.value }))} style={{ width: '100%', minHeight: '200px', padding: '15px', fontSize: '15px', border: '1px solid #dfe1e5', borderRadius: '8px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: '1.6' }} />
        <div style={{ fontSize: '13px', color: '#818C99', marginTop: '8px', textAlign: 'right' }}>Символов: {post.text.length} {post.text.trim() && '• автосохранено'}</div>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>🖼️ Изображения ({images.length}/10)</h3>
        <div style={{ marginBottom: '15px' }}>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} disabled={uploading || images.length >= 10} style={{ display: 'none' }} id="image-upload" />
          <label htmlFor="image-upload" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: images.length >= 10 ? '#a8b2c1' : uploading ? '#f0ad4e' : '#6c5ce7', color: 'white', borderRadius: '8px', fontSize: '15px', cursor: images.length >= 10 ? 'not-allowed' : 'pointer', fontWeight: '500', transition: 'background 0.2s' }}>
            {uploading ? '⏳ Загрузка...' : images.length >= 10 ? '📁 Максимум фото' : '📁 Выбрать фото'}
          </label>
          <span style={{ marginLeft: '12px', fontSize: '13px', color: '#818C99' }}>(JPG, PNG, GIF до 5MB)</span>
        </div>

        {images.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
            {images.map((img, index) => (
              <div key={img.tempId || img.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '2px solid', borderColor: img.uploading ? '#f0ad4e' : img.uploaded ? '#4CAF50' : '#e74c3c', aspectRatio: '1', background: '#000' }}>
                <img src={img.url} alt={`Upload ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: img.uploading ? 0.6 : 1 }} />
                {img.uploading && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>⏳</div>}
                <button onClick={() => removeImage(index)} style={{ position: 'absolute', top: '5px', right: '5px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(231, 76, 60, 0.9)', color: 'white', border: 'none', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>×</button>
                <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '4px 8px', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '11px', textAlign: 'center' }}>
                  {img.uploading ? 'Загрузка...' : img.uploaded ? '✓ Загружено' : '✗ Ошибка'}
                </div>
              </div>
            ))}
          </div>
        )}
        {images.length === 0 && (
          <div style={{ fontSize: '13px', color: '#818C99', textAlign: 'center', padding: '20px', border: '2px dashed #e0e0e0', borderRadius: '8px' }}>📁 Нажмите "Выбрать фото" чтобы добавить изображения</div>
        )}
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>️ Теги ({tags.length})</h3>
          <button onClick={() => setShowPopularTags(!showPopularTags)} style={{ padding: '6px 12px', background: showPopularTags ? '#6c5ce7' : 'white', color: showPopularTags ? 'white' : '#6c5ce7', border: '1px solid #6c5ce7', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
            {showPopularTags ? '🙈 Скрыть популярные' : '⭐ Популярные теги'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input type="text" placeholder="Введите тег и нажмите Enter" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={handleTagKeyDown} style={{ flex: 1, padding: '10px 12px', fontSize: '14px', border: '1px solid #dfe1e5', borderRadius: '6px', boxSizing: 'border-box' }} />
          <button onClick={() => addTag(newTag)} disabled={!newTag.trim()} style={{ padding: '10px 16px', background: !newTag.trim() ? '#a8b2c1' : '#6c5ce7', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: !newTag.trim() ? 'not-allowed' : 'pointer', fontWeight: '500' }}>➕ Добавить</button>
        </div>
        {showPopularTags && (
          <div style={{ marginBottom: '12px', padding: '10px', background: 'white', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '12px', color: '#818C99', marginBottom: '8px' }}>Нажмите на тег, чтобы добавить:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {POPULAR_TAGS.map((tag) => {
                const isAdded = tags.includes(tag);
                return (
                  <button key={tag} onClick={() => !isAdded && addTag(tag)} disabled={isAdded} style={{ padding: '6px 12px', background: isAdded ? '#e0e0e0' : '#f0f0ff', color: isAdded ? '#999' : '#6c5ce7', border: `1px solid ${isAdded ? '#ccc' : '#6c5ce7'}`, borderRadius: '16px', fontSize: '13px', cursor: isAdded ? 'not-allowed' : 'pointer', textDecoration: isAdded ? 'line-through' : 'none' }}>#{tag}</button>
                );
              })}
            </div>
          </div>
        )}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {tags.map((tag) => (
              <div key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#6c5ce7', color: 'white', borderRadius: '16px', fontSize: '13px', fontWeight: '500' }}>
                <span>#{tag}</span>
                <button onClick={() => removeTag(tag)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px', padding: '0 2px', lineHeight: 1, fontWeight: 'bold' }}>×</button>
              </div>
            ))}
          </div>
        )}
        {tags.length === 0 && <div style={{ fontSize: '13px', color: '#818C99', textAlign: 'center', padding: '10px' }}>Теги не добавлены. Они будут автоматически добавлены в конец поста.</div>}
      </div>

      {tags.length > 0 && (
        <div style={{ marginBottom: '15px', padding: '10px 15px', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #4caf50', fontSize: '13px', color: '#2e7d32' }}>
          <strong>👁️ Будет добавлено в конец поста:</strong>
          <div style={{ marginTop: '5px', fontStyle: 'italic' }}>{tags.map(t => `#${t}`).join(' ')}</div>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <input type="text" placeholder="ID группы (например: 240736389)" value={groupId} onChange={(e) => setGroupId(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '15px', border: '1px solid #dfe1e5', borderRadius: '8px', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        <div style={{ fontSize: '13px', color: '#818C99', marginTop: '5px' }}>ID группы без минуса</div>
      </div>

      <button onClick={publishPost} disabled={!post.text.trim() && images.length === 0} style={{ width: '100%', padding: '14px', background: (!post.text.trim() && images.length === 0) ? '#a8b2c1' : '#4a76a8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '17px', fontWeight: '600', cursor: (!post.text.trim() && images.length === 0) ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
        📤 Опубликовать{images.length > 0 && ` с ${images.length} фото`}{tags.length > 0 && ` и ${tags.length} тег.`}
      </button>

      {snackbar && (
        <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '14px 28px', background: snackbar.includes('✅') ? '#4CAF50' : snackbar.includes('⚠️') ? '#FF9800' : '#f44336', color: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '15px', zIndex: 1000, textAlign: 'center', minWidth: '300px', fontWeight: '500' }}>
          {snackbar}
        </div>
      )}
    </div>
  );
}
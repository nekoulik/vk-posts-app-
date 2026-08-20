import React, { useRef } from 'react';
import { Group, Header, Textarea, Button, Div } from '@vkontakte/vkui';
import { Icon28PictureOutline } from '@vkontakte/icons';
import vkBridge from '@vkontakte/vk-bridge';

const EMOJIS = ['😀','😂','❤️','🔥','🎉','✨','👍','📢','🏆','💎','📸','🎁'];

export default function Editor({ post, setPost }) {
  const canvasRef = useRef(null);

  const pickImage = () => {
    // Просто вызываем клик по скрытому input для выбора файла
    document.getElementById('file-input').click();
  };

  const onFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPost(p => ({ ...p, image: url }));
    }
  };

  const generateImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Создаем красивый градиентный фон
    const grad = ctx.createLinearGradient(0, 0, 1000, 600);
    grad.addColorStop(0, '#4C75A2');
    grad.addColorStop(1, '#5181B8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1000, 600);

    // Рисуем текст
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    const lines = post.text.split('\n').slice(0, 6);
    lines.forEach((line, i) => {
      ctx.fillText(line, 500, 150 + i * 70);
    });

    setPost(p => ({ ...p, image: canvas.toDataURL('image/png') }));
  };

  return (
    <Group header={<Header mode="secondary">Редактор поста</Header>}>
      <Div>
        <Textarea
          placeholder="Текст поста..."
          value={post.text}
          onChange={(e) => setPost(p => ({ ...p, text: e.target.value }))}
          style={{ minHeight: 140 }}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {EMOJIS.map(e => (
            <Button 
              key={e} 
              size="m" 
              mode="outline" 
              onClick={() => setPost(p => ({ ...p, text: p.text + e }))}
            >
              {e}
            </Button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input id="file-input" type="file" accept="image/*" hidden onChange={onFile} />
          
          {/* ✅ ИСПРАВЛЕНО: используем Icon28PictureOutline вместо PictureOutline */}
          <Button mode="secondary" before={<Icon28PictureOutline />} onClick={pickImage}>
            Загрузить фото
          </Button>
          
          <Button mode="secondary" onClick={generateImage}>
            🎨 Сгенерировать картинку
          </Button>
        </div>

        {post.image && (
          <img src={post.image} alt="Preview" style={{ width: '100%', marginTop: 12, borderRadius: 8 }} />
        )}

        <canvas ref={canvasRef} width={1000} height={600} style={{ display: 'none' }} />
      </Div>
    </Group>
  );
}
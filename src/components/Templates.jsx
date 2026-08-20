import React from 'react';
import { Group, Header, HorizontalScroll, Card, Title } from '@vkontakte/vkui';

const TEMPLATES = [
  {
    name: '📰 Новость',
    icon: '📰',
    text: '📰 ВАЖНАЯ НОВОСТЬ\n\n',
  },
  {
    name: '🔥 Акция',
    icon: '🔥',
    text: '🔥 АКЦИЯ!\n\nТолько сегодня — ',
  },
  {
    name: '💬 Цитата',
    icon: '💬',
    text: '💬 «\n\n»\n\n— ',
  },
  {
    name: '🏆 Конкурс',
    icon: '🏆',
    text: '🏆 КОНКУРС!\n\nУсловия:\n1. \n2. \n3. \n\nПриз: \n\nИтоги: ',
  },
];

export default function Templates({ onSelect }) {
  return (
    <Group header={<Header mode="secondary">Шаблоны</Header>}>
      <HorizontalScroll>
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px 16px' }}>
          {TEMPLATES.map(t => (
            <Card 
              key={t.name} 
              size="m" 
              mode="tint" 
              style={{ minWidth: 140, cursor: 'pointer' }}
              onClick={() => onSelect(t)}
            >
              <div style={{ padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>
                  {t.icon}
                </div>
                <Title level="3" style={{ marginTop: 4 }}>{t.name}</Title>
              </div>
            </Card>
          ))}
        </div>
      </HorizontalScroll>
    </Group>
  );
}
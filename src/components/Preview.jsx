import React from 'react';
import { Group, Header, Avatar, Title, Text, Div } from '@vkontakte/vkui';

export default function Preview({ post, group, user }) {
  return (
    <Group header={<Header mode="secondary">Предпросмотр</Header>}>
      <Div>
        <div style={{
          background: '#fff',
          border: '1px solid #E7E8EC',
          borderRadius: 12,
          padding: 16,
          fontFamily: '-apple-system, Roboto, sans-serif'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Avatar size={48} src={group?.photo_100} />
            <div>
              <Title level="3">{group?.name || 'Сообщество'}</Title>
              <Text style={{ color: '#818C99' }}>сегодня в 12:00</Text>
            </div>
          </div>

          <div style={{
            whiteSpace: 'pre-wrap',
            fontSize: 15,
            lineHeight: 1.4,
            marginBottom: 12,
            color: '#000'
          }}>
            {post.text || 'Здесь будет текст поста...'}
          </div>

          {post.image && (
            <img src={post.image} alt="" style={{ width: '100%', borderRadius: 8 }} />
          )}

          <div style={{
            display: 'flex',
            gap: 24,
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid #E7E8EC',
            color: '#818C99',
            fontSize: 14
          }}>
            <span>❤️ 0</span>
            <span>💬 0</span>
            <span>🔁 0</span>
            <span>👁 0</span>
          </div>
        </div>
      </Div>
    </Group>
  );
}
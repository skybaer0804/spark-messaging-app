import { useState, useEffect } from 'preact/hooks';
import { Box } from '@/ui-components/Layout/Box';
import { Typography } from '@/ui-components/Typography/Typography';
import { List, ListItem, ListItemText, ListItemAvatar } from '@/ui-components/List/List';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Flex } from '@/ui-components/Layout/Flex';
import { chatApi } from '@/core/api/ApiService';
import { formatTimestamp } from '@/core/utils/messageUtils';
import { useChat } from '../context/ChatContext';
import type { Message } from '../types';
import { IconMessageCircle2 } from '@tabler/icons-preact';

interface ThreadListProps {
  roomId: string;
  onThreadSelect: (message: Message) => void;
}

export const ThreadList = ({ roomId, onThreadSelect }: ThreadListProps) => {
  const [parentMessages, setParentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { services } = useChat();
  const { chat: chatService } = services;

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setIsLoading(true);
        const response = await chatApi.getThreadList(roomId);
        setParentMessages(response.data);
      } catch (error) {
        console.error('Failed to fetch threads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreads();

    // 실시간 스레드 목록 업데이트 리스너
    const unsub = chatService.onRoomMessage((newMsg) => {
      if (newMsg.roomId === roomId && newMsg.parentMessageId) {
        setParentMessages(prev => {
          const parentIdx = prev.findIndex(m => m._id === newMsg.parentMessageId);
          if (parentIdx > -1) {
            // 기존 스레드 업데이트
            const newParent = { 
              ...prev[parentIdx], 
              replyCount: (prev[parentIdx].replyCount || 0) + 1,
              lastReplyAt: newMsg.timestamp 
            };
            const updated = [...prev];
            updated.splice(parentIdx, 1);
            return [newParent, ...updated]; // 최상단으로 이동
          } else {
            // 새로운 스레드가 목록에 나타나야 할 경우 목록 재조회
            fetchThreads();
            return prev;
          }
        });
      }
    });

    return () => unsub();
  }, [roomId, chatService]);

  if (isLoading) {
    return <Box padding="md"><Typography variant="body-medium">불러오는 중...</Typography></Box>;
  }

  if (parentMessages.length === 0) {
    return (
      <Box padding="xl" style={{ textAlign: 'center' }}>
        <Typography variant="body-medium" color="text-tertiary">스레드가 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box style={{ flex: 1, overflowY: 'auto' }}>
      <List>
        {parentMessages.map((msg) => (
          <ListItem 
            key={msg._id} 
            onClick={() => onThreadSelect(msg)}
            className="chat-app__thread-panel__list-item"
          >
            <ListItemAvatar>
              <Avatar src={(msg.senderId as any)?.profileImage || (msg.senderId as any)?.avatar}>
                {(msg.senderId as any)?.username?.substring(0, 1).toUpperCase() || '?'}
              </Avatar>
            </ListItemAvatar>
            <ListItemText 
              primary={
                <Flex justify="space-between" align="center">
                  <Typography variant="body-medium" style={{ fontWeight: 'bold' }}>
                    {(msg.senderId as any)?.username || msg.senderName || 'Unknown'}
                  </Typography>
                  <Typography variant="caption" color="text-tertiary">
                    {formatTimestamp(msg.timestamp)}
                  </Typography>
                </Flex>
              }
              secondary={
                <Box>
                  <Typography 
                    variant="body-medium" 
                    style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      display: '-webkit-box', 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical',
                      margin: '4px 0',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    {msg.content}
                  </Typography>
                  <Flex align="center" gap="xs">
                    <IconMessageCircle2 size={14} style={{ color: 'var(--color-primary-main)' }} />
                    <Typography variant="caption" color="primary" style={{ fontWeight: 'bold' }}>
                      {msg.replyCount} 답글
                    </Typography>
                    {msg.lastReplyAt && (
                      <Typography variant="caption" color="text-tertiary">
                        최근 답글: {formatTimestamp(msg.lastReplyAt)}
                      </Typography>
                    )}
                  </Flex>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};


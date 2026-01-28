import { useRef, useEffect } from 'preact/hooks';
import { memo } from 'preact/compat';
import { Box } from '@/ui-components/Layout/Box';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { ChatMessageItem } from './ChatMessageItem';
import { DateDivider } from './DateDivider/DateDivider';
import { groupMessagesByDate } from '../utils/chatUtils';
import type { Message, ChatRoom, ChatUser } from '../types';
import './Chat.scss';

interface ChatMessagesProps {
  messages: Message[];
  currentUser?: ChatUser | null;
  currentRoom?: ChatRoom;
  messagesRef?: any;
  messagesEndRef?: any;
  onImageClick?: (url: string, fileName: string) => void;
  onThreadClick?: (message: Message) => void;
  onForwardClick?: (message: Message) => void;
  emptyMessage?: string;
  classNamePrefix?: string;
}

function ChatMessagesComponent({
  messages,
  currentUser,
  currentRoom,
  messagesRef: externalMessagesRef,
  messagesEndRef: externalMessagesEndRef,
  onImageClick,
  onThreadClick,
  onForwardClick,
  emptyMessage,
  classNamePrefix = 'chat',
}: ChatMessagesProps) {
  const internalMessagesRef = useRef<HTMLDivElement>(null);
  const internalMessagesEndRef = useRef<HTMLDivElement>(null);
  const baseClass = classNamePrefix;

  // refs가 외부에서 제공되면 사용, 없으면 내부 ref 사용
  const messagesRef = externalMessagesRef || internalMessagesRef;
  const messagesEndRef = externalMessagesEndRef || internalMessagesEndRef;

  // 자체 스크롤 관리 (외부 ref가 없을 때만)
  useEffect(() => {
    if (!externalMessagesRef && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages.length, externalMessagesRef]);

  // 스타일 결정: ChatApp 스타일 vs Chat 스타일
  const isChatAppStyle = externalMessagesRef !== undefined;
  const containerStyle = isChatAppStyle
    ? {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
      }
    : {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: 'var(--space-padding-card-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-gap-sm)',
      };

  return (
    <Box
      className={isChatAppStyle ? undefined : `${baseClass}__messages-list`}
      style={containerStyle}
      ref={messagesRef}
    >
      {messages.length === 0 ? (
        <Box style={{ textAlign: 'center', padding: 'var(--space-padding-card-lg)' }}>
          <Typography variant="body-small" color="text-tertiary">
            {emptyMessage || '메시지가 없습니다.'}
          </Typography>
        </Box>
      ) : (
        <Stack spacing="md" style={{ flex: 1, minHeight: 0 }}>
          {groupMessagesByDate(messages).map((item, index, array) => {
            if (item.type === 'divider') {
              return (
                <DateDivider
                  key={`divider-${item.date?.getTime() || index}`}
                  date={item.date!}
                  classNamePrefix={classNamePrefix}
                />
              );
            }

            // 메시지 그룹화 로직 (이전 메시지와 동일 사용자 & 동일 시간(분) 체크)
            const currentMsg = item.message!;
            const prevItem = index > 0 ? array[index - 1] : null;
            const prevMsg = prevItem?.type === 'message' ? prevItem.message : null;
            
            let isGrouped = false;
            if (prevMsg) {
              const isSameSender = 
                (prevMsg.senderId?.toString() === currentMsg.senderId?.toString());
              
              const isSameMinute = 
                new Date(prevMsg.timestamp).getMinutes() === new Date(currentMsg.timestamp).getMinutes() &&
                new Date(prevMsg.timestamp).getHours() === new Date(currentMsg.timestamp).getHours() &&
                new Date(prevMsg.timestamp).toDateString() === new Date(currentMsg.timestamp).toDateString();
              
              isGrouped = isSameSender && isSameMinute;
            }

            // 안읽음 카운트 계산 (currentRoom이 있을 때만)
            let unreadCount: number | undefined = undefined;
            if (currentRoom && currentMsg) {
              const totalMembers = currentRoom.members?.length || 0;
              const readCount = currentMsg.readBy?.length || 0;
              unreadCount = totalMembers - readCount;
            }

            return (
              <ChatMessageItem
                key={currentMsg._id || `temp-${index}`}
                message={currentMsg}
                currentUser={currentUser}
                onImageClick={onImageClick}
                onThreadClick={onThreadClick}
                onForwardClick={onForwardClick}
                unreadCount={unreadCount && unreadCount > 0 ? unreadCount : undefined}
                classNamePrefix={classNamePrefix}
                isGrouped={isGrouped}
              />
            );
          })}
          {/* v2.2.0: 하단 앵커 요소 (외부 ref가 있을 때만) */}
          {externalMessagesEndRef && <div ref={messagesEndRef} style={{ height: '1px', width: '100%' }} />}
        </Stack>
      )}
    </Box>
  );
}

// memo로 메모이제이션하여 messages 배열 참조가 변경되지 않으면 리렌더링 방지
export const ChatMessages = memo(ChatMessagesComponent, (prevProps, nextProps) => {
  // messages 배열 길이와 내용이 같으면 리렌더링하지 않음
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }
  // 메시지 ID와 답글 수, 마지막 답글 시간, 상태 등을 포함하여 비교하여 내용 변경 시 리렌더링 허용
  const prevData = prevProps.messages.map((m) => `${m._id}-${m.replyCount || 0}-${m.lastReplyAt?.getTime() || 0}-${m.status}`).join(',');
  const nextData = nextProps.messages.map((m) => `${m._id}-${m.replyCount || 0}-${m.lastReplyAt?.getTime() || 0}-${m.status}`).join(',');
  
  return (
    prevData === nextData &&
    prevProps.classNamePrefix === nextProps.classNamePrefix &&
    prevProps.currentUser === nextProps.currentUser
  );
});

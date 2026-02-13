import { useRef, useEffect, useState } from 'preact/hooks';
import { memo } from 'preact/compat';
import { Box } from '@/ui-components/Layout/Box';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconArrowDown } from '@tabler/icons-preact';
import { ChatMessageItem } from './ChatMessageItem';
import { DateDivider } from './DateDivider/DateDivider';
import { groupMessagesByDate } from '../utils/chatUtils';
import { getSafeTime } from '@/core/utils/common';
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
  const [showNewMessageAlert, setShowNewMessageAlert] = useState(false);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const baseClass = classNamePrefix;

  // refs가 외부에서 제공되면 사용, 없으면 내부 ref 사용
  const messagesRef = externalMessagesRef || internalMessagesRef;
  const messagesEndRef = externalMessagesEndRef || internalMessagesEndRef;

  // 스크롤 관리 및 스타일 결정
  const isChatAppStyle = externalMessagesRef !== undefined;

  // Scroll position tracking ref (to avoid re-renders on scroll)
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    if (!messagesRef.current) return;

    // 내 메시지인 경우 무조건 스크롤
    const lastMessage = messages[messages.length - 1];
    const currentUserIdStr = currentUser?._id?.toString();
    const senderIdStr = lastMessage?.senderId?.toString();
    
    const isMyMessage = currentUserIdStr && senderIdStr && currentUserIdStr === senderIdStr;

    // 이전에 하단에 있었거나, 내가 보낸 메시지인 경우에만 스크롤
    if (isAtBottomRef.current || isMyMessage || messages.length === 1) {
      requestAnimationFrame(() => {
        if (messagesRef.current) {
          messagesRef.current.scrollTo({
            top: messagesRef.current.scrollHeight,
            behavior: 'auto'
          });
        }
      });
      setShowNewMessageAlert(false);
      setUnreadAlertCount(0);
      isAtBottomRef.current = true;
    } else if (messages.length > 0) {
      // 하단이 아니었고 내가 보낸게 아니며, 메시지가 있는 경우 알림 표시
      setShowNewMessageAlert(true);
      setUnreadAlertCount(prev => prev + 1);
    }
  }, [messages.length, currentUser?._id]);

  // v2.5.2: 렌더링 시점에 스레드 답글(parentMessageId가 있는 경우)이 본 채팅에 섞이지 않도록 방어 필터링 적용
  const mainMessages = messages.filter(msg => !msg.parentMessageId);

  return (
    <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>
      <Box
        className={isChatAppStyle ? 'chat-app__messages-container' : `${baseClass}__messages-list`}
        ref={messagesRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollBehavior: 'auto',
        }}
        onScroll={() => {
          if (!messagesRef.current) return;
          const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
          
          // 하단 여부 판단: 오차 범위를 10px 정도로 줄여 더 정밀하게 체크
          const isBottom = scrollHeight - clientHeight - scrollTop <= 10;
          
          isAtBottomRef.current = isBottom;

          // 스크롤이 하단에 도달하면 알림 끄기
          if (isBottom) {
            setShowNewMessageAlert(false);
            setUnreadAlertCount(0);
          }
        }}
      >
        {mainMessages.length === 0 ? (
          <Box className="chat-app__messages-container-empty">
            <Typography variant="body-small">
              {emptyMessage || '메시지가 없습니다.'}
            </Typography>
          </Box>
        ) : (
          <Stack spacing="none" style={{ flex: 1, minHeight: 0 }}>
            {groupMessagesByDate(mainMessages).map((item, index, array) => {
              if (item.type === 'divider') {
                return (
                  <DateDivider
                    key={`divider-${getSafeTime(item.date) || index}`}
                    date={item.date!}
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
            {externalMessagesEndRef && <div ref={messagesEndRef} className="chat-app__messages-container-anchor" />}
          </Stack>
        )}
      </Box>

      {/* 새 메시지 알림 버튼: 이제 메시지 영역 하단에 고정됨 */}
      {showNewMessageAlert && (
        <button
          className="chat-app__new-message-alert"
          onClick={() => {
            if (messagesRef.current) {
              messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
              setShowNewMessageAlert(false);
              setUnreadAlertCount(0);
            }
          }}
        >
          <IconArrowDown size={16} />
          <span>새 메시지 {unreadAlertCount > 0 ? `${unreadAlertCount}개` : ''}</span>
        </button>
      )}
    </Box>
  );
}

// memo로 메모이제이션하여 messages 배열 참조가 변경되지 않으면 리렌더링 방지
export const ChatMessages = memo(ChatMessagesComponent, (prevProps, nextProps) => {
  // 메시지 배열 길이가 다르면 무조건 리렌더링 (새 메시지 추가 등)
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }

  // 메시지 ID와 답글 수, 마지막 답글 시간, 상태 등을 포함하여 비교하여 내용 변경 시 리렌더링 허용
  const prevData = prevProps.messages.map((m) => {
    const lastReplyTime = getSafeTime(m.lastReplyAt);
    return `${m._id}-${m.replyCount || 0}-${lastReplyTime}-${m.status}-${m.readBy?.length || 0}`;
  }).join(',');
  const nextData = nextProps.messages.map((m) => {
    const lastReplyTime = getSafeTime(m.lastReplyAt);
    return `${m._id}-${m.replyCount || 0}-${lastReplyTime}-${m.status}-${m.readBy?.length || 0}`;
  }).join(',');

  return (
    prevData === nextData &&
    prevProps.classNamePrefix === nextProps.classNamePrefix &&
    prevProps.currentUser === nextProps.currentUser
  );
});

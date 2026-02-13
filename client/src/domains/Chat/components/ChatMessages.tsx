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
  onRetry?: (messageId: string) => void;
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
  onRetry,
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

  // v2.5.2: 스레드 답글 필터링 + [v2.9.0] _id 기준 중복 제거 (React key 충돌 방어)
  const mainMessages = (() => {
    const filtered = messages.filter(msg => !msg.parentMessageId);
    const seen = new Map<string, number>();
    filtered.forEach((msg, idx) => {
      const id = msg._id?.toString();
      if (id) seen.set(id, idx); // 같은 _id면 나중 것(더 완전한 데이터)을 유지
    });
    return filtered.filter((msg, idx) => {
      const id = msg._id?.toString();
      if (!id) return true;
      return seen.get(id) === idx;
    });
  })();

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
        {((items) => {
              const renderedItems = [];
              let i = 0;
              
              while (i < items.length) {
                const item = items[i];
                
                if (item.type === 'divider') {
                  renderedItems.push(
                    <DateDivider
                      key={`divider-${getSafeTime(item.date) || i}`}
                      date={item.date!}
                    />
                  );
                  i++;
                  continue;
                }

                // 메시지 처리
                const currentMsg = item.message!;
                
                // 이미지 메시지 그룹화 로직
                const isImage = currentMsg.fileData?.fileType === 'image';
                const groupId = currentMsg.groupId;
                const groupedImages: Message[] = [];
                
                if (isImage) {
                  groupedImages.push(currentMsg);
                  let j = i + 1;
                  
                  // 다음 메시지들도 이미지이고, 그룹 ID가 같거나 같은 sender, 같은 시간(분)인지 확인
                  while (j < items.length) {
                    const nextItem = items[j];
                    if (nextItem.type === 'divider') break; // 날짜 바뀌면 그룹 중단
                    
                    const nextMsg = nextItem.message!;
                    const isNextImage = nextMsg.fileData?.fileType === 'image';
                    
                    if (!isNextImage) break;
                    
                    const getSenderIdStr = (senderId: any) => 
                      typeof senderId === 'object' ? senderId?._id?.toString() : senderId?.toString();
                      
                    const isSameSender = (getSenderIdStr(currentMsg.senderId) === getSenderIdStr(nextMsg.senderId));
                    
                    // [v2.6.0] groupId 우선순위, 없으면 기존 시간 기반 로직
                    let shouldGroup = false;
                    if (groupId && nextMsg.groupId === groupId) {
                      shouldGroup = isSameSender;
                    } else if (!groupId && !nextMsg.groupId) {
                      const isSameMinute = 
                        new Date(currentMsg.timestamp).getMinutes() === new Date(nextMsg.timestamp).getMinutes() &&
                        new Date(currentMsg.timestamp).getHours() === new Date(nextMsg.timestamp).getHours();
                      shouldGroup = isSameSender && isSameMinute;
                    }

                    if (shouldGroup) {
                      groupedImages.push(nextMsg);
                      j++;
                    } else {
                      break;
                    }
                  }
                  
                  // 그룹화된 이미지가 있으면 i를 건너뜀
                  if (groupedImages.length > 1) {
                    // 그룹화된 경우, 첫 번째 메시지 아이템에 groupedImages prop을 전달
                    // 그룹화 여부(isGrouped)는 이전 메시지와의 관계를 따짐 (시각적 연결)
                    // 하지만 그리드형태이므로 isGrouped=false로 처리하여 분리된 말풍선처럼 보이게 하거나,
                    // 디자인 의도에 따라 조정. 여기서는 그리드 자체가 하나의 말풍선이 되므로
                    // 이전 메시지가 텍스트이고 같은 유저여도 분리하는게 깔끔할 수 있음.
                    // 일단 기존 로직(이전 메시지와비교)을 유지하되, 이 덩어리 자체를 하나의 아이템으로 봄.
                  } else {
                    // 1장뿐이면 그룹화 취소 (일반 렌더링으로 넘김, 단 groupedImages 배열은 비움)
                    // groupedImages = []; -> const라 재할당 불가, 그냥 아래서 length check로 처리
                  }
                  
                  // 만약 그룹화가 되었다면 j까지 건너뜀
                  if (groupedImages.length > 1) {
                    // 이전 메시지와 그룹화 여부 체크 (Optional)
                    const prevItem = i > 0 ? items[i - 1] : null;
                    const prevMsg = prevItem?.type === 'message' ? prevItem.message : null;
                    let isGrouped = false;
                     if (prevMsg) {
                      const isSameSender = (prevMsg.senderId?.toString() === currentMsg.senderId?.toString());
                      const isSameMinute =
                        new Date(prevMsg.timestamp).getMinutes() === new Date(currentMsg.timestamp).getMinutes() &&
                        new Date(prevMsg.timestamp).getHours() === new Date(currentMsg.timestamp).getHours();
                      isGrouped = isSameSender && isSameMinute;
                    }

                    // 안읽음 카운트 (그룹의 마지막 메시지 기준? 혹은 첫번째? 보통 가장 최신(마지막) 것 기준이 좋음 but 여기선 뭉텅이)
                    // 그냥 첫번째 메시지의 unreadCount 사용 (단순화)
                    let unreadCount: number | undefined = undefined;
                    if (currentRoom) {
                      const totalMembers = currentRoom.members?.length || 0;
                      const readCount = currentMsg.readBy?.length || 0;
                      unreadCount = totalMembers - readCount;
                    }

                    renderedItems.push(
                      <ChatMessageItem
                        key={currentMsg._id || `group-${i}`}
                        message={currentMsg}
                        currentUser={currentUser}
                        onImageClick={onImageClick}
                        onThreadClick={onThreadClick}
                        onForwardClick={onForwardClick}
                        onRetry={onRetry}
                        unreadCount={unreadCount && unreadCount > 0 ? unreadCount : undefined}
                        classNamePrefix={classNamePrefix}
                        isGrouped={isGrouped}
                        groupedImages={groupedImages}
                      />
                    );
                    
                    i = j; // 인덱스 점프
                    continue;
                  }
                } // end if isImage

                // 일반 메시지 처리 (이미지 1장이거나 텍스트 등)
                // 이전 메시지와 그룹화 여부 체크
                const prevItem = i > 0 ? items[i - 1] : null; // 주의: i-1이 divider일 수도 있음. divider면 그룹핑 안됨 (위에서 처리됨 - divider는 type check 필요)
                // 바로 위 루프에서 divider는 push하고 continue했으므로 items[i-1]이 divider일 수 있음.
                
                let isGrouped = false;
                // prevItem이 있고 메시지 타입이어야 함
                if (prevItem && prevItem.type === 'message') {
                  const prevMsg = prevItem.message!;
                   const isSameSender =
                    (prevMsg.senderId?.toString() === currentMsg.senderId?.toString());

                  const isSameMinute =
                    new Date(prevMsg.timestamp).getMinutes() === new Date(currentMsg.timestamp).getMinutes() &&
                    new Date(prevMsg.timestamp).getHours() === new Date(currentMsg.timestamp).getHours() &&
                    new Date(prevMsg.timestamp).toDateString() === new Date(currentMsg.timestamp).toDateString();

                  isGrouped = isSameSender && isSameMinute;
                }

                // 안읽음 카운트
                let unreadCount: number | undefined = undefined;
                if (currentRoom && currentMsg) {
                  const totalMembers = currentRoom.members?.length || 0;
                  const readCount = currentMsg.readBy?.length || 0;
                  unreadCount = totalMembers - readCount;
                }

                renderedItems.push(
                  <ChatMessageItem
                    key={currentMsg._id || `msg-${i}`}
                    message={currentMsg}
                    currentUser={currentUser}
                    onImageClick={onImageClick}
                    onThreadClick={onThreadClick}
                    onForwardClick={onForwardClick}
                    onRetry={onRetry}
                    unreadCount={unreadCount && unreadCount > 0 ? unreadCount : undefined}
                    classNamePrefix={classNamePrefix}
                    isGrouped={isGrouped}
                  />
                );
                
                i++;
              }
              
              return renderedItems;
            })(groupMessagesByDate(mainMessages))}
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
    prevProps.currentUser === nextProps.currentUser &&
    prevProps.onRetry === nextProps.onRetry
  );
});

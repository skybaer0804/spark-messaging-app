import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { formatServerMessage } from '../utils/chatUtils';
import type { ChatRoom, Message } from '../types';
import { useChat } from '../context/ChatContext';
import { useOptimisticUpdate } from './useOptimisticUpdate';
import { useMessageSync } from './useMessageSync';
import { useAuth } from '@/core/hooks/useAuth';
import { chatRoomList } from '@/stores/chatRoomsStore';

export function useChatRoom(enableListener: boolean = true) {
  const { user } = useAuth();
  const { services, isConnected, currentRoom, setCurrentRoom } = useChat();
  const { chat: chatService, room: roomService } = services;

  const { messages, setMessages, sendOptimisticMessage, sendOptimisticFileMessage, updateMessageStatus } = useOptimisticUpdate();
  const { syncMessages } = useMessageSync();

  // v2.5.1: 방 전환 시 로딩 상태 및 Race Condition 방어
  const [isRoomLoading, setIsRoomLoading] = useState(false);
  const latestRoomIdRef = useRef<string | null>(null);

  const handleRoomSelect = useCallback(
    async (room: ChatRoom) => {
      // [v2.5.1] 이미 해당 방을 로딩 중이거나 선택된 방이라면 무시
      if (latestRoomIdRef.current === room._id && isRoomLoading) return;

      try {
        latestRoomIdRef.current = room._id;
        setIsRoomLoading(true);

        await roomService.joinRoom(room._id);
        const history = await chatService.getMessages(room._id);

        // [v2.5.1] 비동기 작업 중에 다른 방으로 요청이 바뀌었다면 상태 업데이트 중단
        if (latestRoomIdRef.current !== room._id) return;

        // v2.2.0: 서버 데이터 모델에 맞춰 포맷팅 (Populate된 senderId 처리)
        const formatted = history.map((msg: any) => formatServerMessage(msg));

        setMessages(formatted);
        setCurrentRoom(room);
        await chatService.setCurrentRoom(room._id);
        
        // v2.4.2: 방 선택 시 서버에 즉시 읽음 처리 신호 전송 (사이드바 카운트 동기화)
        await chatService.markAsRead(room._id);
        
        // v2.2.0: 방 선택 시 해당 방의 안읽음 카운트 로컬에서 초기화
        chatRoomList.value = chatRoomList.value.map((r: any) => 
          r._id === room._id ? { ...r, unreadCount: 0 } : r
        );
      } catch (error) {
        console.error('Failed to select room:', error);
      } finally {
        // [v2.5.1] 내 요청이 마지막 요청이었을 때만 로딩 종료
        if (latestRoomIdRef.current === room._id) {
          setIsRoomLoading(false);
        }
      }
    },
    [chatService, roomService, setMessages, formatServerMessage, isRoomLoading, setCurrentRoom],
  );

  const sendMessage = useCallback(
    async (content: string, parentMessageId?: string) => {
      if (!currentRoom || !user || !content.trim()) return;

      const currentUserId = user.id || (user as any)._id;
      // v2.4.2: 스레드 답글 지원을 위해 parentMessageId 전달
      const tempId = sendOptimisticMessage(currentRoom._id, content, currentUserId, user.username, parentMessageId);

      try {
        const response = await chatService.sendMessage(currentRoom._id, content, 'text', tempId, parentMessageId);
        updateMessageStatus(tempId, {
          _id: response._id,
          sequenceNumber: response.sequenceNumber,
          status: 'sent',
          parentMessageId: response.parentMessageId, // 응답에서 온 확실한 ID 저장
        });
        
        // v2.3.0: 보낸 메시지에 대한 내 방 목록 업데이트는 
        // 서버에서 오는 ROOM_LIST_UPDATED 소켓 이벤트를 통해 처리함 (Server-Side Authority)
      } catch (error) {
        console.error('Failed to send message:', error);
        updateMessageStatus(tempId, { status: 'failed' });
      }
    },
    [currentRoom, user, sendOptimisticMessage, chatService, updateMessageStatus],
  );

  // 네트워크 재연결 시 자동 동기화
  useEffect(() => {
    if (isConnected && currentRoom) {
      syncMessages(currentRoom._id, messages).then((updated) => {
        setMessages(updated);
      });
    }
  }, [isConnected, currentRoom]);

  // 실시간 메시지 수신 및 업데이트 통합 리스너
  useEffect(() => {
    if (!enableListener) return;

    const unsub = chatService.onRoomMessage((newMsg) => {
      // 메시지 포맷팅 적용 (senderName 보장)
      const formattedNewMsg = formatServerMessage(newMsg);
      
      // v2.2.0: 내가 현재 이 방을 보고 있고 활성화 상태라면 즉시 읽음 처리 요청
      if (currentRoom && newMsg.roomId === currentRoom._id) {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
           chatService.markAsRead(currentRoom._id);
        }
      }

      const type = newMsg.type as string;

      // 1. 메시지 업데이트 이벤트 (파일 처리 완료 알림)
      if (type === 'MESSAGE_UPDATED' || type === 'message-updated') {
        // [v2.9.0] 서버에서 최종 메시지를 재조회하여 안전하게 병합
        const messageId = (newMsg as any).messageId?.toString() || newMsg._id?.toString();
        if (messageId) {
          chatService.getMessageById(messageId).then((serverMsg: any) => {
            if (!serverMsg) return;
            const formattedMsg = formatServerMessage(serverMsg);
            setMessages((prev: Message[]) =>
              prev.map((m: Message) => {
                if (m._id?.toString() === messageId) {
                  // 기존 identity 필드 보존 + 서버 파일 데이터만 병합
                  return {
                    ...m,
                    processingStatus: formattedMsg.processingStatus || m.processingStatus,
                    renderUrl: formattedMsg.renderUrl || m.renderUrl,
                    fileData: {
                      ...m.fileData,
                      ...(formattedMsg.fileData || {}),
                    } as any,
                  };
                }
                return m;
              }),
            );
          }).catch((e: any) => {
            console.error('❌ [Hook] 메시지 재조회 실패:', e);
          });
        }
        return;
      }

      // MESSAGE_PROGRESS는 무시 (중간 소켓 이벤트 제거됨)
      if (type === 'MESSAGE_PROGRESS' || type === 'message-progress') {
        return;
      }

      // 2. 신규 메시지 추가 또는 기존 메시지 업데이트
      setMessages((prev: Message[]) => {
        // [스레드 답글 처리] 만약 답글인 경우 (formattedNewMsg 사용으로 정규화된 데이터 확인)
        const parentId = formattedNewMsg.parentMessageId;
        
        if (parentId) {
          const parentIdStr = parentId.toString();
          // 현재 메인 목록에 부모 메시지가 있는지 확인
          const hasParent = prev.some(m => m._id.toString() === parentIdStr);
          
          if (hasParent) {
            return prev.map((m: Message) => {
              if (m._id.toString() === parentIdStr) {
                const myId = (user?.id || (user as any)?._id)?.toString();
                const senderId = formattedNewMsg.senderId?.toString();
                const isMyMessage = myId && senderId && myId === senderId;

                const currentCount = m.replyCount || 0;
                const serverCount = newMsg.replyCount;
                
                let nextCount = currentCount;
                
                if (serverCount !== undefined && serverCount !== null) {
                  nextCount = serverCount;
                } else if (!isMyMessage) {
                  nextCount = currentCount + 1;
                }
                
                return {
                  ...m,
                  replyCount: nextCount,
                  lastReplyAt: newMsg.lastReplyAt ? new Date(newMsg.lastReplyAt) : new Date(newMsg.timestamp),
                };
              }
              return m;
            });
          }
          return prev;
        }

        // [v2.9.0] 중복 체크 강화: tempId, _id, 그리고 낙관적 메시지인지까지 확인
        const newMsgIdStr = newMsg._id?.toString();
        const newMsgSenderId = (typeof newMsg.senderId === 'object' ? (newMsg.senderId as any)?._id : newMsg.senderId)?.toString();
        const currentUserId = (user?.id || (user as any)?._id)?.toString();
        
        const hasDuplicate = prev.some((m: Message) => {
          // tempId 매칭
          if (newMsg.tempId && m.tempId === newMsg.tempId) return true;
          // _id 매칭 (서버 ID 기준)
          if (newMsgIdStr && m._id?.toString() === newMsgIdStr) return true;
          // 낙관적 메시지 매칭: 내가 보낸 메시지이고, 아직 temp_ ID를 가진 메시지가 있으면
          // sequenceNumber 또는 content로 매칭 시도
          if (newMsgSenderId && currentUserId && newMsgSenderId === currentUserId && m._id?.startsWith?.('temp_')) {
            // content + type이 동일하면 동일 메시지로 간주
            if (m.content === formattedNewMsg.content && m.type === formattedNewMsg.type) return true;
            // 파일 메시지의 경우 fileName으로 매칭
            if (m.fileData?.fileName && formattedNewMsg.fileData?.fileName &&
                m.fileData.fileName === formattedNewMsg.fileData.fileName) return true;
          }
          return false;
        });

        if (hasDuplicate) {
          return prev.map((m: Message) => {
            const isIdMatch = newMsgIdStr && m._id?.toString() === newMsgIdStr;
            const isTempMatch = newMsg.tempId && m.tempId === newMsg.tempId;
            // 낙관적 메시지 매칭
            const isOptimisticMatch = newMsgSenderId && currentUserId && newMsgSenderId === currentUserId 
              && m._id?.startsWith?.('temp_')
              && ((m.content === formattedNewMsg.content && m.type === formattedNewMsg.type)
                || (m.fileData?.fileName && formattedNewMsg.fileData?.fileName && m.fileData.fileName === formattedNewMsg.fileData.fileName));
            
            if (isIdMatch || isTempMatch || isOptimisticMatch) {
              // [v2.9.0] identity 필드 보존 + 서버 데이터 병합
              return {
                ...m,
                _id: formattedNewMsg._id || m._id,
                sequenceNumber: formattedNewMsg.sequenceNumber || m.sequenceNumber,
                status: formattedNewMsg.status || m.status,
                processingStatus: formattedNewMsg.processingStatus || m.processingStatus,
                renderUrl: formattedNewMsg.renderUrl || m.renderUrl,
                fileData: formattedNewMsg.fileData ? {
                  ...m.fileData,
                  ...formattedNewMsg.fileData,
                } as any : m.fileData,
              };
            }
            return m;
          });
        }
        
        // sequenceNumber로도 중복 체크 (방어적 코드)
        if (newMsg.sequenceNumber && prev.some((m: Message) => 
          m.sequenceNumber === newMsg.sequenceNumber && 
          m.roomId.toString() === newMsg.roomId.toString()
        )) {
          return prev;
        }
        
        return [...prev, formattedNewMsg].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
      });
    });
    return unsub;
  }, [chatService, setMessages, currentRoom?._id, formatServerMessage]);

  // v2.4.0: 컴포넌트 언마운트 시에만 서버의 Active Room 상태 해제
  useEffect(() => {
    return () => {
      chatService.setCurrentRoom(null);
    };
  }, [chatService]); // currentRoom?._id를 제거하여 방 전환 시 null로 덮어쓰지 않게 함

  return {
    currentRoom,
    messages,
    isRoomLoading,
    sendMessage,
    handleRoomSelect,
    setCurrentRoom,
    setMessages,
    sendOptimisticFileMessage,
    updateMessageStatus,
  };
}

import { useState, useEffect, useRef } from 'preact/hooks';
import { Box } from '@/ui-components/Layout/Box';
import { Typography } from '@/ui-components/Typography/Typography';
import { chatApi } from '@/core/api/ApiService';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInput } from './ChatInput';
import type { Message, ChatUser } from '../types';
import { useChat } from '../context/ChatContext';
import { useOptimisticUpdate } from '../hooks/useOptimisticUpdate';

interface ThreadDetailProps {
  parentMessage: Message;
  currentUser: ChatUser | null;
  onClose?: () => void;
}

export const ThreadDetail = ({ parentMessage, currentUser }: ThreadDetailProps) => {
  const [replies, setReplies] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyInput, setReplyInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { userList, currentRoom, isConnected, services } = useChat();
  const { chat: chatService } = services;
  const { sendOptimisticMessage } = useOptimisticUpdate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReplies = async () => {
      try {
        setIsLoading(true);
        const response = await chatApi.getThreadMessages(parentMessage._id);
        setReplies(response.data);
      } catch (error) {
        console.error('Failed to fetch replies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReplies();

    // 실시간 답글 수신 리스너
    const unsub = chatService.onRoomMessage((newMsg) => {
      const isReplyToCurrent =
        newMsg.parentMessageId?.toString() === parentMessage._id?.toString();

      if (isReplyToCurrent) {
        setReplies(prev => {
          // [v2.8.0] 중복 체크 강화: _id 또는 tempId 매칭 확인
          const hasDuplicate = prev.some(m => 
            (m._id?.toString() === newMsg._id?.toString()) || 
            (newMsg.tempId && m.tempId === newMsg.tempId) ||
            (m._id?.startsWith('temp_') && m.content === newMsg.content && m.senderId === newMsg.senderId)
          );

          if (hasDuplicate) {
            // 기존 낙관적 메시지를 서버 데이터로 업데이트
            return prev.map(m => {
              const isMatch = (m._id?.toString() === newMsg._id?.toString()) || 
                              (newMsg.tempId && m.tempId === newMsg.tempId) ||
                              (m._id?.startsWith('temp_') && m.content === newMsg.content && m.senderId === newMsg.senderId);
              return isMatch ? { ...m, ...newMsg, status: 'sent' } : m;
            });
          }
          
          return [...prev, newMsg].sort((a, b) => (a.threadSequenceNumber || 0) - (b.threadSequenceNumber || 0));
        });
      }
    });

    return () => unsub();
  }, [parentMessage._id, chatService]); // parentMessage._id 의존성 추가로 스레드 전환 대응

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies]);

  const handleSendReply = async () => {
    if (!replyInput.trim()) return;

    // parentMessageId가 확실히 존재하는지 확인
    const parentId = parentMessage._id.toString();
    const currentUserId = (currentUser as any)?._id || (currentUser as any)?.id || 'unknown';

    // v2.5.0: 메인 메시지 목록의 replyCount 낙관적 업데이트 수행
    const tempId = sendOptimisticMessage(
      parentMessage.roomId,
      replyInput,
      currentUserId,
      currentUser?.username,
      parentId
    );

    // [v2.8.0] ThreadDetail 로컬 상태에도 낙관적 업데이트 추가
    const optimisticReply: Message = {
      _id: tempId,
      tempId,
      roomId: parentMessage.roomId,
      senderId: currentUserId,
      senderName: currentUser?.username,
      content: replyInput,
      type: 'text',
      status: 'sending',
      timestamp: new Date(),
      parentMessageId: parentId,
      readBy: [currentUserId],
      sequenceNumber: -1
    };
    setReplies(prev => [...prev, optimisticReply]);

    try {
      const response = await chatApi.sendMessage({
        roomId: parentMessage.roomId,
        content: replyInput,
        tempId, // [v2.8.0] tempId 전달
        parentMessageId: parentId, // 문자열로 변환하여 확실히 전달
      });

      setReplies(prev => prev.map(r => r.tempId === tempId ? { ...r, ...response.data, status: 'sent' } : r));
      setReplyInput('');
    } catch (error) {
      console.error('Failed to send reply:', error);
      setReplies(prev => prev.map(r => r.tempId === tempId ? { ...r, status: 'failed' } : r));
    }
  };

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleFileRemove = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendFile = async () => {
    if (selectedFiles.length === 0) return;
    if (!isConnected || !currentRoom || !currentUser) return;

    const groupId = `group_${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
    const parentId = parentMessage._id.toString();
    const currentUserId = (currentUser as any)?._id || (currentUser as any)?.id || 'unknown';
    const tempId = crypto.randomUUID ? crypto.randomUUID() : `temp_thread_batch_${Date.now()}`;

    // 1. 낙관적 메시지 생성 (ThreadDetail 로컬 상태에 추가)
    const optimisticReply: Message = {
      _id: tempId,
      tempId,
      roomId: parentMessage.roomId,
      senderId: currentUserId,
      senderName: currentUser.username,
      content: selectedFiles.length > 1 ? `[Files] ${selectedFiles[0].name} 외 ${selectedFiles.length - 1}개` : `File: ${selectedFiles[0].name}`,
      type: 'file', // ImageMessageGrid에서 자동 판단
      status: 'sending',
      timestamp: new Date(),
      parentMessageId: parentId,
      readBy: [currentUserId],
      sequenceNumber: -1,
      files: selectedFiles.map(f => ({
        fileName: f.name,
        fileType: f.type.startsWith('image/') ? 'image' : 'file',
        mimeType: f.type,
        size: f.size,
        url: URL.createObjectURL(f),
        processingStatus: 'processing'
      }))
    };
    setReplies(prev => [...prev, optimisticReply]);

    // 2. 메인 메시지 목록 replyCount 업데이트
    sendOptimisticMessage(parentMessage.roomId, '', currentUserId, currentUser.username, parentId);

    const abortController = new AbortController();

    try {
      setUploadingFile(selectedFiles[0]);
      setUploadProgress(0);

      const response = await services.fileTransfer.sendFiles(
        parentMessage.roomId,
        selectedFiles,
        (progress: number) => setUploadProgress(progress),
        abortController.signal,
        groupId
      );

      // 3. 로컬 상태 업데이트
      setReplies(prev => prev.map(r => r.tempId === tempId ? { 
        ...r, 
        ...response, 
        status: 'sent',
        files: response.files.map((f: any) => ({
          ...f,
          size: f.fileSize || f.size,
          url: f.fileUrl || f.url,
          thumbnailUrl: f.thumbnailUrl || f.thumbnail
        }))
      } : r));

      setSelectedFiles([]);
      setReplyInput('');
    } catch (error: any) {
      console.error('Failed to upload file in thread:', error);
      setReplies(prev => prev.map(r => r.tempId === tempId ? { ...r, status: 'failed' } : r));
    } finally {
      setUploadingFile(null);
    }
  };

  return (
    <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: 'var(--color-bg-secondary)' }}>
      {/* Replies Area */}
      <Box style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Parent Message */}
        <Box style={{ borderBottom: '1px solid var(--color-border-subtle)', flexShrink: 0 }}>
          <ChatMessageItem message={parentMessage} currentUser={currentUser} hideToolbar={true} isParentInThread={true} />
        </Box>

        {/* Replies List */}
        <Box style={{ flex: 1 }}>
          {isLoading ? (
            <Box padding="lg" style={{ textAlign: 'center' }}><Typography variant="body" color="text-secondary">불러오는 중...</Typography></Box>
          ) : replies.length === 0 ? (
            <Box padding="xl" style={{ textAlign: 'center' }}><Typography variant="body" color="text-tertiary">아직 답글이 없습니다.</Typography></Box>
          ) : (
            <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {replies.map(reply => (
                <ChatMessageItem key={reply._id} message={reply} currentUser={currentUser} hideToolbar={true} />
              ))}
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>
      </Box>

      {/* Reply Input Area */}
      <Box style={{ flexShrink: 0, borderTop: '1px solid var(--color-border-default)' }}>
        <ChatInput
          input={replyInput}
          setInput={setReplyInput}
          members={userList}
          roomMembers={currentRoom?.members || []}
          selectedFiles={selectedFiles}
          uploadingFile={uploadingFile}
          uploadProgress={uploadProgress}
          isConnected={isConnected}
          placeholder="답글 쓰기..."
          onSendMessage={handleSendReply}
          onSendFile={handleSendFile}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (replyInput.trim()) {
                handleSendReply();
              }
              if (selectedFiles.length > 0) {
                handleSendFile();
              }
            }
          }}
          classNamePrefix="thread-detail"
        />
      </Box>
    </Box>
  );
};

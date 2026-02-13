import { useState, useEffect } from 'preact/hooks';
import { useToast } from '@/core/context/ToastContext';
import { useRouterState } from '@/routes/RouterState';
import { setChatCurrentRoom, currentWorkspaceId } from '@/stores/chatRoomsStore';
import { useAuth } from '@/core/hooks/useAuth';
import { useChat } from '../context/ChatContext';
import { useChatRoom } from './useChatRoom';
import { ChatRoom } from '../types';

export function useChatApp() {
  const { navigate } = useRouterState();
  const {
    isConnected,
    socketId,
    roomList,
    userList,
    workspaceList,
    services,
    refreshRoomList,
  } = useChat();

  const { 
    currentRoom, 
    messages, 
    isRoomLoading, 
    sendMessage, 
    handleRoomSelect, 
    setCurrentRoom, 
    setMessages,
    sendOptimisticFileMessage,
    updateMessageStatus
  } = useChatRoom();

  const [input, setInput] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('chat');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);
  // const [uploadingFile, setUploadingFile] = useState<File | null>(null); // Migrated to uploadStore
  // const [uploadProgress, setUploadProgress] = useState<number>(0); // Migrated to uploadStore
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  const { room: roomService, fileTransfer: fileTransferService, chat: chatService } = services;

  useEffect(() => {
    setChatCurrentRoom(currentRoom?.name || null);
  }, [currentRoom]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    await sendMessage(input.trim());
    setInput('');
  };

  /* v2.8.0: Global Upload State Management */
  
  /**
   * 파일 업로드 프로세스 공통 함수
   */
  const executeUpload = async (tempId: string, file: File, roomId: string, abortController: AbortController, groupId?: string) => {
    const { updateUploadProgress, completeUpload, failUpload } = await import('@/stores/uploadStore');
    
    try {
      updateUploadProgress(tempId, 0);
      
      const response = await fileTransferService.sendFile(
        roomId, 
        file, 
        (progress: number) => {
          updateUploadProgress(tempId, progress);
        },
        abortController.signal,
        groupId // [v2.6.0] 추가
      );

      // 성공 시 낙관적 메시지 업데이트
      updateMessageStatus(tempId, {
        _id: response._id,
        sequenceNumber: response.sequenceNumber,
        status: 'sent',
        fileData: {
          ...response, // 서버 응답 데이터 (url, thumbnailUrl 등)
          fileName: response.fileName,
          size: response.fileSize,
          mimeType: response.mimeType,
        }
      });

      completeUpload(tempId);
      showSuccess('파일 전송 완료');
    } catch (error: any) {
      console.error('Upload execution failed:', error);
      
      if (error.message === 'Upload aborted') {
        showError('전송이 취소되었습니다.');
        updateMessageStatus(tempId, { status: 'failed' }); // 또는 목록에서 제거
      } else {
        const errorMessage = error?.response?.data?.error || error?.message || '파일 전송 실패';
        failUpload(tempId, errorMessage);
        updateMessageStatus(tempId, { status: 'failed' });
        showError(errorMessage);
      }
    }
  };

  const handleFileSend = async (file: File, groupId?: string) => {
    if (!isConnected || !currentRoom || !user) return;

    // 1. 파일 검증
    const validation = fileTransferService.validateFile(file);
    if (!validation.valid) {
      showError(validation.error || '파일 전송 실패');
      return;
    }

    const currentUserId = user.id || (user as any)._id;
    
    // 2. 낙관적 메시지 생성 (UI 즉시 반영) - groupId 전달
    const tempId = sendOptimisticFileMessage(currentRoom._id, file, currentUserId, user.username, undefined, groupId);
    const abortController = new AbortController();

    // 3. 글로벌 스토어에 업로드 추가
    const { addUpload } = await import('@/stores/uploadStore');
    addUpload({
      id: tempId,
      roomId: currentRoom._id,
      file,
      progress: 0,
      status: 'pending',
      retryCount: 0,
      abortController,
      groupId // [v2.6.0] 그룹화 ID 저장
    });

    // 4. 업로드 실행
    await executeUpload(tempId, file, currentRoom._id, abortController, groupId);
  };

  /**
   * 다중 파일 전송 처리 (드래그 앤 드롭 등)
   * 하나의 groupId로 묶어서 낙관적 UI 최적화
   */
  const handleFilesSend = async (files: File[]) => {
    if (files.length === 0) return;
    
    // 다중 파일인 경우(또는 단일 파일이어도 그룹화 가능성 대비) groupId 생성
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // 순차적 또는 병렬로 업로드 실행 (여기서는 병렬)
    await Promise.all(files.map(file => handleFileSend(file, groupId)));
  };

  const retryUpload = async (tempId: string) => {
    const { uploadState, updateUploadProgress } = await import('@/stores/uploadStore');
    const uploadItem = uploadState.value[tempId];
    
    if (!uploadItem) return;

    const abortController = new AbortController();
    
    // 상태 초기화
    updateUploadProgress(tempId, 0);
    updateMessageStatus(tempId, { status: 'sending' });
    
    // 스토어 아이템 업데이트 (AbortController 갱신)
    uploadState.value = {
      ...uploadState.value,
      [tempId]: { ...uploadItem, status: 'uploading', abortController }
    };

    await executeUpload(tempId, uploadItem.file, uploadItem.roomId, abortController, uploadItem.groupId);
  };

  const handleCreateRoom = async (type: ChatRoom['type'] = 'direct', extraData: any = {}) => {
    // direct의 경우 이름이 없어도 멤버가 있으면 생성 가능
    if (type !== 'direct' && !roomIdInput.trim() && !extraData.name) return;
    if (!isConnected) return;

    try {
      const response = await chatService.createRoom({
        name: extraData.name || (type === 'direct' ? undefined : roomIdInput.trim()),
        description: extraData.description,
        members: selectedUserIds.length > 0 ? selectedUserIds : extraData.members || undefined,
        workspaceId: extraData.workspaceId || currentWorkspaceId.value || '',
        type,
        teamId: extraData.teamId,
        parentId: extraData.parentId,
        isPrivate: extraData.isPrivate || false,
      });

      const newRoom = response.data;
      const isNew = response.status === 201;

      // 이미 목록에 있는 방인지 확인
      const exists = roomList.some((r) => r._id === newRoom._id);

      // 새 방이거나 목록에 없으면 새로고침
      if (isNew || !exists) {
        await refreshRoomList();
      }

      // 방 선택 및 해당 경로로 이동 (onRoomSelect는 ChatApp 컴포넌트에서 pathname 감지로 처리됨)
      if (newRoom && newRoom._id) {
        handleRoomSelect(newRoom);
      }

      setRoomIdInput('');
      setSelectedUserIds([]);
      setSelectedWorkspaceIds([]);

      if (isNew) {
        // const typeMap: Record<string, string> = {
        //   direct: '1:1 대화방',
        //   public: '채널',
        //   private: '비공개 채널',
        //   team: '팀',
        //   discussion: '토론',
        // };
        // showSuccess(`${typeMap[type] || type}이 생성되었습니다.`);
      }

      return newRoom;
    } catch (error) {
      console.error('Failed to create room:', error);
      showError('Room 생성 실패');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const toggleWorkspaceSelection = (workspaceId: string) => {
    setSelectedWorkspaceIds((prev) =>
      prev.includes(workspaceId) ? prev.filter((id) => id !== workspaceId) : [...prev, workspaceId],
    );
  };

  const leaveRoom = async (roomId?: string) => {
    const targetRoomId = roomId || currentRoom?._id;
    if (!targetRoomId || !isConnected) return;

    try {
      // [v2.4.0] 현재 보고 있는 방을 나가는 경우라면 즉시 경로 이동 (useEffect 재진입 방지)
      if (currentRoom?._id === targetRoomId) {
        navigate('/chatapp');
      }

      // 1. DB에서 제거 (UserChatRoom 삭제 및 Room 멤버에서 제거)
      await chatService.leaveRoom(targetRoomId);

      // 2. 소켓 채널 퇴장
      await roomService.leaveRoom(targetRoomId);

      // 3. 클라이언트 상태 초기화 (현재 보고 있는 방인 경우만)
      if (currentRoom?._id === targetRoomId) {
        setCurrentRoom(null);
        setMessages([]);
        await chatService.setCurrentRoom(null);
      }

      showSuccess('채팅방을 나갔습니다.');
    } catch (error) {
      console.error('Failed to leave room:', error);
      showError('Room 나가기 실패');
    }
  };

  return {
    isConnected,
    messages,
    input,
    setInput,
    roomIdInput,
    setRoomIdInput,
    currentRoom,
    roomList,
    userList,
    workspaceList,
    selectedUserIds,
    selectedWorkspaceIds,
    toggleUserSelection,
    toggleWorkspaceSelection,
    sendMessage: handleSendMessage,
    handleRoomSelect,
    handleCreateRoom,
    leaveRoom,
    sendFile: handleFileSend,
    sendFiles: handleFilesSend,
    retryUpload,
    // uploadingFile,
    // uploadProgress,
    isRoomLoading,
    socketId,
    setCurrentRoom,
  };
}

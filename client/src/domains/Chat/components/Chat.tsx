import type { ChatAdapter, ChatConfig, ChatMessage } from './types';
import type { Signal } from '@preact/signals';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ImageModal } from './ImageModal';
import { useChatCore } from './hooks/useChatCore';
import { useAuth } from '@/core/hooks/useAuth';
import { Box, Flex } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import { IconButton } from '@/components/ui/icon-button';
import { IconVideo, IconUsers, IconSettings } from '@tabler/icons-preact';
import './Chat.scss';

interface ChatProps {
  adapter: ChatAdapter;
  config?: ChatConfig;
  classNamePrefix?: string;
  roomName?: string;
  onVideoMeetingClick?: () => void;
}

function ChatComponent({ adapter, config = {}, classNamePrefix = 'chat', roomName, onVideoMeetingClick }: ChatProps) {
  const baseClass = config.classNamePrefix || classNamePrefix;
  const { user: currentUser } = useAuth();

  // Signal 기반 input 가져오기 (반응형 업데이트)
  const inputSignal = (adapter as any).getInputSignal?.() as Signal<string> | undefined;

  const {
    input: coreInput,
    setInput: coreSetInput,
    selectedFiles,
    imageModal,
    handleFileSelect,
    handleFileSend,
    handleFileRemove,
    handleImageClick,
    handleCloseImageModal,
  } = useChatCore(adapter);

  // Signal 기반 input이 있으면 사용, 없으면 useChatCore의 input 사용
  const input = inputSignal ? inputSignal.value : coreInput;
  const setInput = inputSignal
    ? (value: string) => {
      adapter.setInput?.(value);
    }
    : coreSetInput;

  // Signal이 있으면 명시적으로 읽어서 구독 (컴포넌트 리렌더링 보장)
  if (inputSignal) {
    void inputSignal.value;
  }

  // Signal 기반 메시지 가져오기 (반응형 업데이트)
  // Signal.value를 읽으면 자동으로 구독되어 Signal이 변경될 때 컴포넌트가 리렌더링됨
  const messagesSignal = (adapter as any).getMessagesSignal?.() as Signal<ChatMessage[]> | undefined;

  // Signal이 있으면 Signal.value를 읽어서 구독 (컴포넌트 리렌더링 보장)
  // Signal이 없으면 일반 함수 호출
  const messages = messagesSignal ? messagesSignal.value : adapter.getMessages();

  const showFileUpload = config.showFileUpload !== false && adapter.showFileUpload?.() !== false;
  const showImageModal = config.showImageModal !== false;

  // 통합 전송 핸들러: 텍스트와 파일을 모두 처리
  const handleSendAll = async () => {
    // 최신 input 값 가져오기
    const currentInput = inputSignal ? inputSignal.value : coreInput;
    const hasFiles = selectedFiles.length > 0;

    if (!adapter.isConnected()) return;

    // 텍스트나 파일 중 하나라도 있어야 전송
    if (!currentInput.trim() && !hasFiles) return;

    try {
      // 1. 텍스트 전송
      if (currentInput.trim()) {
        await adapter.sendMessage(currentInput.trim());
        // setInput을 통해 Signal 혹은 Local State 초기화
        setInput('');
      }

      // 2. 파일 전송 (텍스트 전송과 병렬 또는 순차 실행)
      if (hasFiles) {
        await handleFileSend();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDownWrapped = (e: KeyboardEvent) => {
    // ChatInput 내부에서 처리하므로 여기서는 최소한의 로직만 유지하거나 
    // 필요한 경우 추가적인 전역 단축키를 처리합니다.
    if (e.key === 'Enter' && !e.shiftKey) {
      // ChatInput에서 이미 e.preventDefault()와 전송을 처리함
    }
  };

  return (
    <Box className={baseClass} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {roomName && (
        <Flex
          className={`${baseClass}__header`}
          align="center"
          justify="space-between"
          style={{
            padding: 'var(--primitive-space-4) var(--primitive-space-6)',
            borderBottom: '1px solid var(--color-border-default)',
          }}
        >
          <Flex align="center" gap="md">
            <Typography variant="h4">{roomName}</Typography>
          </Flex>
          <Flex align="center" gap="sm">
            <IconButton onClick={onVideoMeetingClick} title="화상회의 시작">
              <IconVideo size={20} />
            </IconButton>
            <IconButton title="멤버 목록">
              <IconUsers size={20} />
            </IconButton>
            <IconButton title="방 설정">
              <IconSettings size={20} />
            </IconButton>
          </Flex>
        </Flex>
      )}
      <ChatMessages
        messages={messages}
        currentUser={currentUser as any}
        onImageClick={handleImageClick}
        emptyMessage={adapter.getEmptyMessage?.() || config.emptyMessage}
        classNamePrefix={baseClass}
      />
      <ChatInput
        input={input}
        setInput={setInput}
        members={adapter.getWorkspaceUsers?.() || []}
        roomMembers={adapter.getCurrentRoomMembers?.() || []}
        selectedFiles={selectedFiles}
        uploadingFile={adapter.getUploadingFile?.() || null}
        uploadProgress={adapter.getUploadProgress?.() || 0}
        isConnected={adapter.isConnected()}
        placeholder={adapter.getPlaceholder?.() || config.placeholder}
        showFileUpload={showFileUpload}
        onSendMessage={handleSendAll}
        onSendFile={handleSendAll}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        onKeyPress={handleKeyDownWrapped}
        classNamePrefix={baseClass}
      />
      {showImageModal && imageModal && (
        <ImageModal
          url={imageModal.url}
          fileName={imageModal.fileName}
          onClose={handleCloseImageModal}
          classNamePrefix={baseClass}
        />
      )}
    </Box>
  );
}

// Signal을 사용하는 경우 memo를 사용하지 않음 (Signal이 자동으로 리렌더링 처리)
// Signal이 없으면 memo 사용
export const Chat = ChatComponent;

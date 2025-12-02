import { useEffect, useState } from 'preact/hooks';
import type { ChatAdapter, ChatConfig, ChatMessage } from './types';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ImageModal } from './ImageModal';
import { useChatCore } from './hooks/useChatCore';
import './Chat.scss';

interface ChatProps {
    adapter: ChatAdapter;
    config?: ChatConfig;
    classNamePrefix?: string;
}

export function Chat({ adapter, config = {}, classNamePrefix = 'chat' }: ChatProps) {
    const baseClass = config.classNamePrefix || classNamePrefix;
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const {
        input,
        setInput,
        selectedFiles,
        imageModal,
        handleKeyPress,
        handleSendMessage,
        handleFileSelect,
        handleFileSend,
        handleFileRemove,
        handleImageClick,
        handleCloseImageModal,
    } = useChatCore(adapter);

    // Adapter에서 메시지 업데이트
    useEffect(() => {
        // 초기 메시지 로드
        setMessages(adapter.getMessages());

        // Adapter가 변경될 때마다 메시지 업데이트
        // 실제 구현에서는 Adapter가 메시지 변경을 알리는 메커니즘 필요
        // 현재는 컴포넌트가 리렌더링될 때마다 업데이트
    }, [adapter]);

    // Adapter에서 메시지 업데이트
    useEffect(() => {
        // 초기 메시지 로드
        setMessages(adapter.getMessages());
    }, [adapter]);

    // 렌더링 시마다 최신 메시지 가져오기 (실제로는 이벤트 기반으로 변경 필요)
    const currentMessages = adapter.getMessages();
    if (currentMessages.length !== messages.length || JSON.stringify(currentMessages) !== JSON.stringify(messages)) {
        setMessages(currentMessages);
    }

    const showFileUpload = config.showFileUpload !== false && adapter.showFileUpload?.() !== false;
    const showImageModal = config.showImageModal !== false;

    return (
        <>
            <ChatMessages
                messages={messages}
                onImageClick={handleImageClick}
                emptyMessage={adapter.getEmptyMessage?.() || config.emptyMessage}
                classNamePrefix={baseClass}
            />
            <ChatInput
                input={input}
                setInput={setInput}
                selectedFiles={selectedFiles}
                uploadingFile={adapter.getUploadingFile?.() || null}
                uploadProgress={adapter.getUploadProgress?.() || 0}
                isConnected={adapter.isConnected()}
                placeholder={adapter.getPlaceholder?.() || config.placeholder}
                showFileUpload={showFileUpload}
                onSendMessage={handleSendMessage}
                onSendFile={handleFileSend}
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                onKeyPress={handleKeyPress}
                classNamePrefix={baseClass}
            />
            {showImageModal && imageModal && (
                <ImageModal url={imageModal.url} fileName={imageModal.fileName} onClose={handleCloseImageModal} classNamePrefix={baseClass} />
            )}
        </>
    );
}

import { useRef, useEffect } from 'preact/hooks';
import { memo } from 'preact/compat';
import type { ChatMessage } from './types';
import { ChatMessageItem } from './ChatMessageItem';
import './Chat.scss';

interface ChatMessagesProps {
    messages: ChatMessage[];
    onImageClick?: (url: string, fileName: string) => void;
    emptyMessage?: string;
    classNamePrefix?: string;
}

function ChatMessagesComponent({ messages, onImageClick, emptyMessage, classNamePrefix = 'chat' }: ChatMessagesProps) {
    const messagesRef = useRef<HTMLDivElement>(null);
    const baseClass = classNamePrefix;

    // 메시지가 추가될 때 스크롤 하단으로 이동
    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages.length]);

    return (
        <div className={`${baseClass}__messages-list`} ref={messagesRef}>
            {messages.length === 0 ? (
                <div className={`${baseClass}__empty-message`}>{emptyMessage || '메시지가 없습니다.'}</div>
            ) : (
                messages.map((msg) => <ChatMessageItem key={msg.id} message={msg} onImageClick={onImageClick} classNamePrefix={classNamePrefix} />)
            )}
        </div>
    );
}

// memo로 메모이제이션하여 messages 배열 참조가 변경되지 않으면 리렌더링 방지
export const ChatMessages = memo(ChatMessagesComponent, (prevProps, nextProps) => {
    // messages 배열 길이와 내용이 같으면 리렌더링하지 않음
    if (prevProps.messages.length !== nextProps.messages.length) {
        return false;
    }
    // 메시지 ID 비교로 변경 감지
    const prevIds = prevProps.messages.map((m) => m.id).join(',');
    const nextIds = nextProps.messages.map((m) => m.id).join(',');
    return prevIds === nextIds && prevProps.classNamePrefix === nextProps.classNamePrefix;
});

import { useRef, useEffect } from 'preact/hooks';
import type { ChatMessage } from './types';
import { ChatMessageItem } from './ChatMessageItem';
import './Chat.scss';

interface ChatMessagesProps {
    messages: ChatMessage[];
    onImageClick?: (url: string, fileName: string) => void;
    emptyMessage?: string;
    classNamePrefix?: string;
}

export function ChatMessages({ messages, onImageClick, emptyMessage, classNamePrefix = 'chat' }: ChatMessagesProps) {
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

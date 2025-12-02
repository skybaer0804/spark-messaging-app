import { memo } from 'preact/compat';
import type { ChatMessage } from './types';
import { formatTimestamp } from '../../utils/messageUtils';
import { formatFileSize, getFileIcon, downloadFile } from '../../utils/fileUtils';
import './Chat.scss';

interface ChatMessageItemProps {
    message: ChatMessage;
    onImageClick?: (url: string, fileName: string) => void;
    classNamePrefix?: string;
}

function ChatMessageItemComponent({ message, onImageClick, classNamePrefix = 'chat' }: ChatMessageItemProps) {
    const baseClass = classNamePrefix;

    return (
        <div className={`${baseClass}__message ${baseClass}__message--${message.type}`}>
            <div className={`${baseClass}__message-header`}>
                <span className={`${baseClass}__message-sender`}>{message.senderId ? message.senderId.substring(0, 6) : '알 수 없음'}</span>
                <span className={`${baseClass}__message-time`}>{formatTimestamp(message.timestamp)}</span>
            </div>
            {message.fileData ? (
                <div className={`${baseClass}__message-file`}>
                    {message.fileData.fileType === 'image' ? (
                        <div className={`${baseClass}__message-image-wrapper`}>
                            <img
                                src={message.fileData.data}
                                alt={message.fileData.fileName}
                                className={`${baseClass}__message-image`}
                                onClick={() => onImageClick?.(message.fileData!.data, message.fileData!.fileName)}
                            />
                            <button
                                className={`${baseClass}__message-image-download`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    downloadFile(message.fileData!.fileName, message.fileData!.data, message.fileData!.mimeType);
                                }}
                                title="다운로드"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className={`${baseClass}__message-document`}>
                            <div className={`${baseClass}__message-document-icon`}>{getFileIcon(message.fileData.mimeType)}</div>
                            <div className={`${baseClass}__message-document-info`}>
                                <div className={`${baseClass}__message-document-name`}>{message.fileData.fileName}</div>
                                <div className={`${baseClass}__message-document-size`}>{formatFileSize(message.fileData.size)}</div>
                            </div>
                            <button
                                className={`${baseClass}__message-document-download`}
                                onClick={() => downloadFile(message.fileData!.fileName, message.fileData!.data, message.fileData!.mimeType)}
                                title="다운로드"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className={`${baseClass}__message-content`}>{message.content}</div>
            )}
        </div>
    );
}

// memo로 메모이제이션하여 message가 변경되지 않으면 리렌더링 방지
export const ChatMessageItem = memo(ChatMessageItemComponent, (prevProps, nextProps) => {
    return prevProps.message.id === nextProps.message.id && prevProps.classNamePrefix === nextProps.classNamePrefix;
});

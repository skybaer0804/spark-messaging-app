import { useRef } from 'preact/hooks';
import { FilePreview } from './FilePreview';
import './Chat.scss';

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    selectedFiles: File[];
    uploadingFile?: File | null;
    uploadProgress?: number;
    isConnected: boolean;
    placeholder?: string;
    showFileUpload?: boolean;
    onSendMessage: () => void;
    onSendFile: () => void;
    onFileSelect: (e: Event) => void;
    onFileRemove: (index: number) => void;
    onKeyPress: (e: KeyboardEvent) => void;
    classNamePrefix?: string;
}

export function ChatInput({
    input,
    setInput,
    selectedFiles,
    uploadingFile,
    uploadProgress = 0,
    isConnected,
    placeholder,
    showFileUpload = true,
    onSendMessage,
    onSendFile,
    onFileSelect,
    onFileRemove,
    onKeyPress,
    classNamePrefix = 'chat',
}: ChatInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const baseClass = classNamePrefix;

    return (
        <div className={`${baseClass}__input-container`}>
            <FilePreview
                files={selectedFiles}
                uploadingFile={uploadingFile}
                uploadProgress={uploadProgress}
                onRemove={onFileRemove}
                classNamePrefix={classNamePrefix}
            />
            <div className={`${baseClass}__input-wrapper`}>
                {showFileUpload && (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className={`${baseClass}__file-input`}
                            onChange={onFileSelect}
                            accept="image/*,.xlsx,.xls,.csv,.md,.docx,.doc,.pdf"
                            multiple
                            style={{ display: 'none' }}
                        />
                        <button className={`${baseClass}__file-button`} onClick={() => fileInputRef.current?.click()} disabled={!isConnected} title="파일 첨부">
                            📎
                        </button>
                    </>
                )}
                <input
                    type="text"
                    className={`${baseClass}__input`}
                    value={input}
                    onInput={(e) => setInput(e.currentTarget.value)}
                    onKeyPress={onKeyPress}
                    placeholder={placeholder || (isConnected ? '메시지를 입력하세요...' : '연결 중...')}
                    disabled={!isConnected}
                />
                <button
                    onClick={selectedFiles.length > 0 ? onSendFile : onSendMessage}
                    disabled={!isConnected || (!input.trim() && selectedFiles.length === 0)}
                    className={`${baseClass}__send-button`}
                >
                    전송
                </button>
            </div>
        </div>
    );
}

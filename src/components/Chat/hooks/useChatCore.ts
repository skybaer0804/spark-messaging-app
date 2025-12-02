import { useState, useRef } from 'preact/hooks';
import type { ChatAdapter } from '../types';

export function useChatCore(adapter: ChatAdapter) {
    const [input, setInput] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [imageModal, setImageModal] = useState<{ url: string; fileName: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !adapter.isConnected()) return;

        try {
            await adapter.sendMessage(input.trim());
            setInput('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleFileSelect = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const files = Array.from(target.files || []);
        if (files.length > 0) {
            setSelectedFiles((prev) => [...prev, ...files]);
        }
        // 같은 파일을 다시 선택할 수 있도록 input 초기화
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileSend = async () => {
        if (selectedFiles.length > 0 && adapter.sendFile) {
            // 모든 파일을 순차적으로 전송
            for (const file of selectedFiles) {
                try {
                    await adapter.sendFile(file);
                } catch (error) {
                    console.error('Failed to send file:', error);
                }
            }
            setSelectedFiles([]);
        }
    };

    const handleFileRemove = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleImageClick = (imageUrl: string, fileName: string) => {
        setImageModal({ url: imageUrl, fileName });
    };

    const handleCloseImageModal = () => {
        setImageModal(null);
    };

    return {
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
    };
}

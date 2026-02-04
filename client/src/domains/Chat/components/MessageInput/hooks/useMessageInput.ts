import { useState, useRef } from 'preact/hooks';
import { useChatApp } from '../../../hooks/useChatApp';
import { useAuth } from '@/core/hooks/useAuth';
import { useToast } from '@/core/context/ToastContext';
import { FileTransferService } from '@/core/api/FileTransferService';

export const useMessageInput = () => {
  const {
    input,
    setInput,
    isConnected,
    currentRoom,
    uploadingFile,
    uploadProgress,
    sendMessage,
    sendFile,
  } = useChatApp();

  const { user: currentUser } = useAuth();
  const { showError } = useToast();
  
  const [isComposing, setIsComposing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    
    if (files.length > 0) {
      // 각 파일 검증
      const validFiles: File[] = [];
      const fileTransferService = new FileTransferService(null as any, null as any, null as any);
      
      files.forEach((file) => {
        const validation = fileTransferService.validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          showError(`${file.name}: ${validation.error || '파일 검증 실패'}`);
        }
      });
      
      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSend = async () => {
    if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        await sendFile(file);
      }
      setSelectedFiles([]);
    }
  };

  const handleFileRemove = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return {
    input,
    setInput,
    isConnected,
    currentRoom,
    currentUser,
    uploadingFile,
    uploadProgress,
    isComposing,
    setIsComposing,
    selectedFiles,
    fileInputRef,
    inputWrapperRef,
    handleKeyPress,
    handleFileSelect,
    handleFileSend,
    handleFileRemove,
    sendMessage,
  };
};

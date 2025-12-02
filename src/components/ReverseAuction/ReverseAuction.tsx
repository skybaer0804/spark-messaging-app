import { useReverseAuction } from './hooks/useReverseAuction';
import { formatTimestamp } from '../../utils/messageUtils';
import { formatFileSize, getFileIcon, downloadFile } from '../../utils/fileUtils';
import type { Category } from './types';
import { useRef, useEffect, useState } from 'preact/hooks';
import { VideoConference } from './VideoConference/VideoConference';
import { ReverseAuctionVideoConferenceAdapter } from './VideoConference/adapters/VideoConferenceAdapter';
import './ReverseAuction.scss';

export function ReverseAuction() {
    const {
        isConnected,
        userRole,
        currentRoom,
        roomList,
        participants,
        chatMessages,
        chatInput,
        setChatInput,
        showCreateForm,
        setShowCreateForm,
        selectedCategory,
        setSelectedCategory,
        roomTitle,
        setRoomTitle,
        pendingRequests,
        joinRequestStatus,
        localStream,
        isVideoEnabled,
        uploadingFile,
        uploadProgress,
        myRooms,
        handleCreateRoom,
        handleJoinRoom,
        handleApproveRequest,
        handleRejectRequest,
        handleLeaveRoom,
        handleSendChat,
        sendFile,
        startLocalStream,
        stopLocalStream,
        setVideoRef,
        getSocketId,
    } = useReverseAuction();

    const chatMessagesRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [imageModal, setImageModal] = useState<{ url: string; fileName: string } | null>(null);

    // 채팅 메시지가 추가될 때 스크롤 하단으로 이동
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chatMessages.length]);

    // VideoConference Adapter를 useRef로 관리하여 안정적인 참조 유지
    const videoConferenceAdapterRef = useRef<ReverseAuctionVideoConferenceAdapter | null>(null);

    // Adapter는 한 번만 생성
    if (!videoConferenceAdapterRef.current) {
        videoConferenceAdapterRef.current = new ReverseAuctionVideoConferenceAdapter({
            getLocalStream: () => localStream,
            isVideoEnabled: () => isVideoEnabled,
            getParticipants: () => participants,
            getSocketId: () => getSocketId(),
            startLocalStream: async () => {
                await startLocalStream();
            },
            stopLocalStream: async () => {
                await stopLocalStream();
            },
            setVideoRef: (socketId: string, element: HTMLVideoElement | null) => {
                setVideoRef(socketId, element);
            },
        });
    }

    // 최신 값으로 업데이트 (adapter 재생성 없이)
    videoConferenceAdapterRef.current.updateConfig({
        getLocalStream: () => localStream,
        isVideoEnabled: () => isVideoEnabled,
        getParticipants: () => participants,
        getSocketId: () => getSocketId(),
        startLocalStream: async () => {
            await startLocalStream();
        },
        stopLocalStream: async () => {
            await stopLocalStream();
        },
        setVideoRef: (socketId: string, element: HTMLVideoElement | null) => {
            setVideoRef(socketId, element);
        },
    });

    const videoConferenceAdapter = videoConferenceAdapterRef.current;

    const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (selectedFiles.length > 0) {
                handleFileSend();
            } else {
                handleSendChat();
            }
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
        if (selectedFiles.length > 0) {
            // 모든 파일을 순차적으로 전송
            for (const file of selectedFiles) {
                await sendFile(file);
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

    // 초기 화면 (랜딩)
    if (!currentRoom) {
        return (
            <div className="reverse-auction">
                <div className="reverse-auction__header">
                    <h2 className="reverse-auction__title">역경매</h2>
                    {!showCreateForm && (
                        <button className="reverse-auction__create-button" onClick={() => setShowCreateForm(true)} disabled={!isConnected}>
                            🏠 룸 생성 (수요자)
                        </button>
                    )}
                </div>

                {showCreateForm ? (
                    <div className="reverse-auction__create-form">
                        <div className="reverse-auction__form-field">
                            <label className="reverse-auction__label">카테고리</label>
                            <div className="reverse-auction__category-tabs">
                                {(['인테리어', '웹개발', '피규어'] as Category[]).map((cat) => (
                                    <button
                                        key={cat}
                                        className={`reverse-auction__category-tab ${selectedCategory === cat ? 'reverse-auction__category-tab--active' : ''}`}
                                        onClick={() => setSelectedCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="reverse-auction__form-field">
                            <label className="reverse-auction__label">제목</label>
                            <input
                                type="text"
                                className="reverse-auction__input"
                                value={roomTitle}
                                onInput={(e) => setRoomTitle(e.currentTarget.value)}
                                placeholder="예: 3평 원룸 인테리어 견적 요청"
                                disabled={!isConnected}
                            />
                        </div>
                        <div className="reverse-auction__form-actions">
                            <button
                                className="reverse-auction__button reverse-auction__button--secondary"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setRoomTitle('');
                                }}
                            >
                                취소
                            </button>
                            <button
                                className="reverse-auction__button reverse-auction__button--primary"
                                onClick={handleCreateRoom}
                                disabled={!isConnected || !roomTitle.trim()}
                            >
                                생성
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="reverse-auction__room-list">
                        <div className="reverse-auction__room-list-header">
                            <h3 className="reverse-auction__room-list-title">룸 리스트</h3>
                        </div>
                        <div className="reverse-auction__room-list-content">
                            {roomList.length === 0 ? (
                                <div className="reverse-auction__empty">{!isConnected ? <p>서버에 연결 중...</p> : <p>생성된 룸이 없습니다.</p>}</div>
                            ) : (
                                <div className="reverse-auction__room-items">
                                    {roomList.map((room) => (
                                        <div key={room.roomId} className="reverse-auction__room-item">
                                            <div className="reverse-auction__room-item-info">
                                                <span className="reverse-auction__room-item-category">{room.category}</span>
                                                <h4 className="reverse-auction__room-item-title">{room.title}</h4>
                                                <p className="reverse-auction__room-item-meta">참가자: {room.participants}명</p>
                                            </div>
                                            <button
                                                className="reverse-auction__room-item-button"
                                                onClick={() => handleJoinRoom(room)}
                                                disabled={
                                                    !isConnected ||
                                                    (joinRequestStatus === 'pending' && !myRooms.has(room.roomId)) ||
                                                    (joinRequestStatus === 'approved' && !myRooms.has(room.roomId))
                                                }
                                            >
                                                {myRooms.has(room.roomId)
                                                    ? '내 룸'
                                                    : joinRequestStatus === 'approved'
                                                    ? '승인됨 - 입장 중...'
                                                    : joinRequestStatus === 'pending'
                                                    ? '대기 중...'
                                                    : joinRequestStatus === 'rejected'
                                                    ? '거부됨 - 다시 참가'
                                                    : '참가'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // 룸 상세 화면
    return (
        <div className="reverse-auction">
            <div className="reverse-auction__room-header">
                <button className="reverse-auction__back-button" onClick={handleLeaveRoom}>
                    ←
                </button>
                <div className="reverse-auction__room-header-info">
                    <h2 className="reverse-auction__room-title">{currentRoom.title}</h2>
                    <span className="reverse-auction__room-category">{currentRoom.category}</span>
                </div>
            </div>

            {/* 참가 요청 알림 (수요자만) */}
            {userRole === 'demander' && pendingRequests.length > 0 && (
                <div className="reverse-auction__pending-requests">
                    <h4>참가 요청</h4>
                    {pendingRequests.map((request) => (
                        <div key={request.socketId} className="reverse-auction__request-item">
                            <span>{request.name}</span>
                            <div className="reverse-auction__request-actions">
                                <button className="reverse-auction__approve-button" onClick={() => handleApproveRequest(request.socketId)}>
                                    승인
                                </button>
                                <button className="reverse-auction__reject-button" onClick={() => handleRejectRequest(request.socketId)}>
                                    거부
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 영상과 채팅 영역 (Grid 레이아웃) */}
            <div className="reverse-auction__main-content">
                {/* 영상 영역 */}
                <VideoConference adapter={videoConferenceAdapter} />

                {/* 채팅 영역 */}
                <div className="reverse-auction__chat-section">
                    <div className="reverse-auction__chat-messages" ref={chatMessagesRef}>
                        {chatMessages.length === 0 ? (
                            <div className="reverse-auction__chat-empty">메시지가 없습니다.</div>
                        ) : (
                            chatMessages.map((msg) => (
                                <div key={msg.id} className={`reverse-auction__chat-message reverse-auction__chat-message--${msg.type}`}>
                                    <div className="reverse-auction__chat-message-header">
                                        <span className="reverse-auction__chat-message-sender">
                                            {msg.senderId ? msg.senderId.substring(0, 6) : '알 수 없음'}
                                        </span>
                                        <span className="reverse-auction__chat-message-time">{formatTimestamp(msg.timestamp)}</span>
                                    </div>
                                    {msg.fileData ? (
                                        <div className="reverse-auction__chat-message-file">
                                            {msg.fileData.fileType === 'image' ? (
                                                <div className="reverse-auction__chat-message-image-wrapper">
                                                    <img
                                                        src={msg.fileData.data}
                                                        alt={msg.fileData.fileName}
                                                        className="reverse-auction__chat-message-image"
                                                        onClick={() => handleImageClick(msg.fileData!.data, msg.fileData!.fileName)}
                                                    />
                                                    <button
                                                        className="reverse-auction__chat-message-image-download"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            downloadFile(msg.fileData!.fileName, msg.fileData!.data, msg.fileData!.mimeType);
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
                                                <div className="reverse-auction__chat-message-document">
                                                    <div className="reverse-auction__chat-message-document-icon">{getFileIcon(msg.fileData.mimeType)}</div>
                                                    <div className="reverse-auction__chat-message-document-info">
                                                        <div className="reverse-auction__chat-message-document-name">{msg.fileData.fileName}</div>
                                                        <div className="reverse-auction__chat-message-document-size">{formatFileSize(msg.fileData.size)}</div>
                                                    </div>
                                                    <button
                                                        className="reverse-auction__chat-message-document-download"
                                                        onClick={() => downloadFile(msg.fileData!.fileName, msg.fileData!.data, msg.fileData!.mimeType)}
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
                                        <div className="reverse-auction__chat-message-content">{msg.content}</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <div className="reverse-auction__chat-input-container">
                        {selectedFiles.length > 0 && (
                            <div className="reverse-auction__file-preview">
                                {selectedFiles.map((file: File, index: number) => (
                                    <div key={index} className="reverse-auction__file-preview-item">
                                        <span className="reverse-auction__file-preview-icon">{getFileIcon(file.type)}</span>
                                        <span className="reverse-auction__file-preview-name">{file.name}</span>
                                        <span className="reverse-auction__file-preview-size">{formatFileSize(file.size)}</span>
                                        <button className="reverse-auction__file-remove" onClick={() => handleFileRemove(index)}>
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                {uploadingFile && (
                                    <div className="reverse-auction__progress-container">
                                        <div className="reverse-auction__progress-bar">
                                            <div className="reverse-auction__progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                        <span className="reverse-auction__progress-text">{Math.round(uploadProgress)}% 전송 중...</span>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="reverse-auction__chat-input-wrapper">
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="reverse-auction__file-input"
                                onChange={handleFileSelect}
                                accept="image/*,.xlsx,.xls,.csv,.md,.docx,.doc,.pdf"
                                multiple
                                style={{ display: 'none' }}
                            />
                            <button
                                className="reverse-auction__file-button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={!isConnected}
                                title="파일 첨부"
                            >
                                📎
                            </button>
                            <input
                                type="text"
                                className="reverse-auction__chat-input"
                                value={chatInput}
                                onInput={(e) => setChatInput(e.currentTarget.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="메시지를 입력하세요..."
                                disabled={!isConnected}
                            />
                            <button
                                className="reverse-auction__chat-send-button"
                                onClick={selectedFiles.length > 0 ? handleFileSend : handleSendChat}
                                disabled={!isConnected || (!chatInput.trim() && selectedFiles.length === 0)}
                            >
                                전송
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {imageModal && (
                <div className="reverse-auction__image-modal" onClick={handleCloseImageModal}>
                    <div className="reverse-auction__image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="reverse-auction__image-modal-close" onClick={handleCloseImageModal}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <img src={imageModal.url} alt={imageModal.fileName} className="reverse-auction__image-modal-image" />
                    </div>
                </div>
            )}
        </div>
    );
}

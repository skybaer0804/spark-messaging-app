import { memo } from 'preact/compat';
import type { Category, Room } from '../types';
import type { ReverseAuctionStore } from '../stores/ReverseAuctionStore';
import '../ReverseAuction.scss';

interface ReverseAuctionCoreProps {
    store: ReverseAuctionStore;
}

function ReverseAuctionCoreComponent({ store }: ReverseAuctionCoreProps) {
    // Signal을 직접 읽어서 자동으로 반응형 업데이트
    // Signal.value를 읽으면 자동으로 구독되므로 컴포넌트가 리렌더링됨
    const isConnected = store.isConnected.value;
    const userRole = store.userRole.value;
    const currentRoom = store.currentRoom.value;
    const roomList = store.roomList.value;
    const showCreateForm = store.showCreateForm.value;
    const selectedCategory = store.selectedCategory.value;
    const roomTitle = store.roomTitle.value;
    const pendingRequests = store.pendingRequests.value;
    const joinRequestStatus = store.joinRequestStatus.value;
    const myRooms = store.getMyRooms();

    // 룸 생성 핸들러
    const handleCreateRoom = async () => {
        await store.createRoom(selectedCategory, roomTitle);
    };

    // 룸 참가 핸들러
    const handleJoinRoom = async (room: Room) => {
        await store.joinRoom(room);
    };

    // 참가 요청 승인 핸들러
    const handleApproveRequest = async (requesterSocketId: string) => {
        await store.approveRequest(requesterSocketId);
    };

    // 참가 요청 거부 핸들러
    const handleRejectRequest = async (requesterSocketId: string) => {
        await store.rejectRequest(requesterSocketId);
    };

    // 룸 나가기 핸들러
    const handleLeaveRoom = async () => {
        await store.leaveRoom();
    };

    // 초기 화면 (랜딩)
    if (!currentRoom) {
        return (
            <div className="reverse-auction">
                <div className="reverse-auction__header">
                    <h2 className="reverse-auction__title">역경매</h2>
                    {!showCreateForm && (
                        <button
                            className="reverse-auction__create-button"
                            onClick={() => store.setShowCreateForm(true)}
                            disabled={!isConnected}
                        >
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
                                        className={`reverse-auction__category-tab ${
                                            selectedCategory === cat ? 'reverse-auction__category-tab--active' : ''
                                        }`}
                                        onClick={() => store.setSelectedCategory(cat)}
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
                                onInput={(e) => store.setRoomTitle(e.currentTarget.value)}
                                placeholder="예: 3평 원룸 인테리어 견적 요청"
                                disabled={!isConnected}
                            />
                        </div>
                        <div className="reverse-auction__form-actions">
                            <button
                                className="reverse-auction__button reverse-auction__button--secondary"
                                onClick={() => {
                                    store.setShowCreateForm(false);
                                    store.setRoomTitle('');
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
                                <div className="reverse-auction__empty">
                                    {!isConnected ? <p>서버에 연결 중...</p> : <p>생성된 룸이 없습니다.</p>}
                                </div>
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
                                <button
                                    className="reverse-auction__approve-button"
                                    onClick={() => handleApproveRequest(request.socketId)}
                                >
                                    승인
                                </button>
                                <button
                                    className="reverse-auction__reject-button"
                                    onClick={() => handleRejectRequest(request.socketId)}
                                >
                                    거부
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// memo로 메모이제이션하여 store 참조가 변경되지 않으면 리렌더링 방지
export const ReverseAuctionCore = memo(ReverseAuctionCoreComponent, (prevProps, nextProps) => {
    return prevProps.store === nextProps.store;
});


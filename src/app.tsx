import { useState, useEffect, useRef } from 'preact/hooks';
import sparkMessagingClient from './config/sparkMessaging';
import { SparkMessagingError } from '@skybaer0804/spark-messaging-client';
import type { MessageData, RoomMessageData, ConnectedData } from '@skybaer0804/spark-messaging-client';
import './app.css';

interface Message {
    id: string;
    content: string;
    timestamp: Date;
    type: 'sent' | 'received';
    room?: string;
}

export function App() {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [roomIdInput, setRoomIdInput] = useState('chat');
    const [currentRoom, setCurrentRoom] = useState<string | null>(null);
    const [joinedRooms, setJoinedRooms] = useState<string[]>([]);
    const [socketId, setSocketId] = useState<string | null>(null);
    const socketIdRef = useRef<string | null>(null);
    const currentRoomRef = useRef<string | null>(null);

    useEffect(() => {
        console.log('Setting up Spark Messaging client...');
        console.log('Server URL:', import.meta.env.VITE_SERVER_URL || 'http://localhost:3000');
        console.log('Project Key:', import.meta.env.VITE_PROJECT_KEY ? '***' : 'default-project-key-12345');

        // 연결 상태 핸들러 (이미 연결되어 있으면 즉시 호출됨)
        const handleConnected = (data: ConnectedData) => {
            console.log('✅ Connected event received:', data);
            setIsConnected(true);
            setSocketId(data.socketId);
            socketIdRef.current = data.socketId;
        };

        // 연결 상태 변경 핸들러
        const handleConnectionStateChange = (connected: boolean) => {
            console.log('🔄 Connection state changed:', connected);
            setIsConnected(connected);
            if (connected) {
                const status = sparkMessagingClient.getConnectionStatus();
                setSocketId(status.socketId);
                socketIdRef.current = status.socketId;
            } else {
                setSocketId(null);
                socketIdRef.current = null;
            }
        };

        // 일반 메시지 수신 핸들러 (전체 브로드캐스트)
        const handleMessage = (msg: MessageData) => {
            console.log('📨 Message received (broadcast):', msg);
            // 현재 Room에 있으면 일반 메시지는 무시 (Room 메시지만 표시)
            if (currentRoomRef.current) {
                return;
            }
            // 자신이 보낸 메시지인지 확인 (socketId 비교) - useRef로 최신 값 참조
            const currentSocketId = socketIdRef.current;
            const isOwnMessage = msg.senderId === currentSocketId || (msg as any).from === currentSocketId;
            setMessages((prev) => [
                ...prev,
                {
                    id: `${msg.timestamp || Date.now()}-${Math.random()}`,
                    content: msg.content,
                    timestamp: new Date(msg.timestamp || Date.now()),
                    type: isOwnMessage ? 'sent' : 'received',
                },
            ]);
        };

        // Room 메시지 수신 핸들러
        const handleRoomMessage = (msg: RoomMessageData) => {
            console.log('📨 Room message received:', msg);
            // 현재 Room의 메시지만 표시
            if (msg.room !== currentRoomRef.current) {
                return;
            }
            const currentSocketId = socketIdRef.current;
            const isOwnMessage = msg.senderId === currentSocketId || (msg as any).from === currentSocketId;
            setMessages((prev) => [
                ...prev,
                {
                    id: `${msg.timestamp || Date.now()}-${Math.random()}`,
                    content: msg.content,
                    timestamp: new Date(msg.timestamp || Date.now()),
                    type: isOwnMessage ? 'sent' : 'received',
                    room: msg.room,
                },
            ]);
        };

        // Room 입장 핸들러
        const handleRoomJoined = (roomId: string) => {
            console.log('✅ Room joined:', roomId);
            setJoinedRooms((prev) => {
                if (!prev.includes(roomId)) {
                    return [...prev, roomId];
                }
                return prev;
            });
            setCurrentRoom(roomId);
            currentRoomRef.current = roomId;
            setMessages([]); // Room 변경 시 메시지 초기화
        };

        // Room 나가기 핸들러
        const handleRoomLeft = (roomId: string) => {
            console.log('👋 Room left:', roomId);
            setJoinedRooms((prev) => prev.filter((id) => id !== roomId));
            if (currentRoomRef.current === roomId) {
                setCurrentRoom(null);
                currentRoomRef.current = null;
                setMessages([]); // Room 나가면 메시지 초기화
            }
        };

        // 에러 핸들러
        const handleError = (error: Error | SparkMessagingError) => {
            console.error('❌ Error:', error);
            if (error instanceof SparkMessagingError) {
                console.error('Error code:', error.code);
            }
            setIsConnected(false);
        };

        // 이벤트 리스너 등록
        const unsubscribeConnected = sparkMessagingClient.onConnected(handleConnected);
        const unsubscribeStateChange = sparkMessagingClient.onConnectionStateChange(handleConnectionStateChange);
        const unsubscribeMessage = sparkMessagingClient.onMessage(handleMessage);
        const unsubscribeRoomMessage = sparkMessagingClient.onRoomMessage(handleRoomMessage);
        const unsubscribeRoomJoined = sparkMessagingClient.onRoomJoined(handleRoomJoined);
        const unsubscribeRoomLeft = sparkMessagingClient.onRoomLeft(handleRoomLeft);
        const unsubscribeError = sparkMessagingClient.onError(handleError);

        console.log('Event listeners registered.');

        // 연결 상태 확인 (이미 연결되어 있을 수 있음)
        const status = sparkMessagingClient.getConnectionStatus();
        if (status.isConnected) {
            console.log('✅ Already connected:', status);
            setIsConnected(true);
            setSocketId(status.socketId);
            socketIdRef.current = status.socketId;
        }

        // 클린업 (컴포넌트 언마운트 시에만 실행)
        return () => {
            console.log('Cleaning up Spark Messaging client...');
            unsubscribeConnected();
            unsubscribeStateChange();
            unsubscribeMessage();
            unsubscribeRoomMessage();
            unsubscribeRoomJoined();
            unsubscribeRoomLeft();
            unsubscribeError();
            sparkMessagingClient.disconnect();
        };
    }, []); // 의존성 배열 비움 - 컴포넌트 마운트/언마운트 시에만 실행

    const joinRoom = async () => {
        if (!roomIdInput.trim() || !isConnected) return;

        const roomName = roomIdInput.trim();
        if (joinedRooms.includes(roomName)) {
            // 이미 참여 중인 Room이면 현재 Room로 설정
            setCurrentRoom(roomName);
            currentRoomRef.current = roomName;
            setMessages([]);
            return;
        }

        try {
            await sparkMessagingClient.joinRoom(roomName);
            // handleRoomJoined에서 처리됨
        } catch (error) {
            console.error('Failed to join room:', error);
            if (error instanceof SparkMessagingError) {
                alert(`Room 입장 실패: ${error.message} (코드: ${error.code})`);
            } else {
                alert('Room 입장 실패');
            }
        }
    };

    const leaveRoom = async () => {
        if (!currentRoom || !isConnected) return;

        try {
            await sparkMessagingClient.leaveRoom(currentRoom);
            // handleRoomLeft에서 처리됨
        } catch (error) {
            console.error('Failed to leave room:', error);
            if (error instanceof SparkMessagingError) {
                alert(`Room 나가기 실패: ${error.message} (코드: ${error.code})`);
            } else {
                alert('Room 나가기 실패');
            }
        }
    };

    const sendMessage = async () => {
        if (input.trim() && isConnected) {
            const messageContent = input.trim();
            const room = currentRoomRef.current;
            try {
                if (room) {
                    // Room 메시지 전송
                    await sparkMessagingClient.sendRoomMessage(room, 'chat', messageContent);
                } else {
                    // 일반 메시지 전송 (전체 브로드캐스트)
                    await sparkMessagingClient.sendMessage('chat', messageContent);
                }
                // UI에 즉시 추가하지 않음 - 서버에서 브로드캐스트된 메시지를 받아서 표시
                setInput('');
            } catch (error) {
                console.error('Failed to send message:', error);
                if (error instanceof SparkMessagingError) {
                    alert(`메시지 전송 실패: ${error.message} (코드: ${error.code})`);
                } else {
                    alert('메시지 전송 실패');
                }
            }
        }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="app">
            <header className="app-header">
                <h1>Spark Messaging Demo</h1>
                <div className="status-container">
                    <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
                    <span className="status-text">{isConnected ? `Connected (${socketId?.substring(0, 8)}...)` : 'Disconnected'}</span>
                </div>
            </header>

            <main className="app-main">
                <div className="room-section">
                    <div className="room-selector">
                        <label htmlFor="roomId">Room ID:</label>
                        <input
                            id="roomId"
                            type="text"
                            value={roomIdInput}
                            onInput={(e) => setRoomIdInput(e.currentTarget.value)}
                            placeholder="Enter room ID"
                            disabled={!isConnected}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    joinRoom();
                                }
                            }}
                        />
                        <button onClick={joinRoom} disabled={!isConnected || !roomIdInput.trim()} className="room-button join-button">
                            입장
                        </button>
                        {currentRoom && (
                            <button onClick={leaveRoom} disabled={!isConnected} className="room-button leave-button">
                                나가기
                            </button>
                        )}
                    </div>
                    {currentRoom && (
                        <div className="current-room">
                            현재 Room: <strong>{currentRoom}</strong>
                        </div>
                    )}
                    {joinedRooms.length > 0 && (
                        <div className="joined-rooms">
                            참여 중인 Room:{' '}
                            {joinedRooms.map((room) => (
                                <span
                                    key={room}
                                    className={`room-tag ${room === currentRoom ? 'active' : ''}`}
                                    onClick={() => {
                                        if (room !== currentRoom) {
                                            setCurrentRoom(room);
                                            currentRoomRef.current = room;
                                            setMessages([]);
                                        }
                                    }}
                                >
                                    {room}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="messages-container">
                    <div className="messages-list">
                        {messages.length === 0 ? (
                            <div className="empty-message">
                                {currentRoom
                                    ? `${currentRoom} Room에 메시지가 없습니다. 메시지를 보내보세요!`
                                    : '메시지가 없습니다. Room에 입장하거나 메시지를 보내보세요!'}
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`message ${msg.type}`}>
                                    <div className="message-content">{msg.content}</div>
                                    <div className="message-time">
                                        {msg.timestamp.toLocaleTimeString('ko-KR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="input-container">
                    <input
                        type="text"
                        value={input}
                        onInput={(e) => setInput(e.currentTarget.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={
                            !isConnected
                                ? '연결 중...'
                                : currentRoom
                                ? `${currentRoom} Room에 메시지를 입력하세요...`
                                : '메시지를 입력하세요... (전체 브로드캐스트)'
                        }
                        disabled={!isConnected}
                        className="message-input"
                    />
                    <button onClick={sendMessage} disabled={!isConnected || !input.trim()} className="send-button">
                        전송
                    </button>
                </div>
            </main>
        </div>
    );
}

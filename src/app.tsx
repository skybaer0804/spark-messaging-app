import { useState, useEffect } from 'preact/hooks';
import sparkMessagingClient from './config/sparkMessaging';
import { SparkMessagingError } from '@skybaer0804/spark-messaging-client';
import type { MessageData, ConnectedData } from '@skybaer0804/spark-messaging-client';
import './app.css';

interface Message {
    id: string;
    content: string;
    timestamp: Date;
    type: 'sent' | 'received';
}

export function App() {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [roomId, setRoomId] = useState('chat');
    const [socketId, setSocketId] = useState<string | null>(null);

    useEffect(() => {
        console.log('Setting up Spark Messaging client...');
        console.log('Server URL:', import.meta.env.VITE_SERVER_URL || 'http://localhost:3000');
        console.log('Project Key:', import.meta.env.VITE_PROJECT_KEY ? '***' : 'default-project-key-12345');

        // 연결 상태 핸들러 (이미 연결되어 있으면 즉시 호출됨)
        const handleConnected = (data: ConnectedData) => {
            console.log('✅ Connected event received:', data);
            setIsConnected(true);
            setSocketId(data.socketId);
        };

        // 연결 상태 변경 핸들러
        const handleConnectionStateChange = (connected: boolean) => {
            console.log('🔄 Connection state changed:', connected);
            setIsConnected(connected);
            if (connected) {
                const status = sparkMessagingClient.getConnectionStatus();
                setSocketId(status.socketId);
            } else {
                setSocketId(null);
            }
        };

        // 메시지 수신 핸들러
        const handleMessage = (msg: MessageData) => {
            console.log('📨 Message received:', msg);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    content: msg.content,
                    timestamp: new Date(msg.timestamp || Date.now()),
                    type: 'received',
                },
            ]);
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
        const unsubscribeError = sparkMessagingClient.onError(handleError);

        console.log('Event listeners registered.');

        // 연결 상태 확인 (이미 연결되어 있을 수 있음)
        const status = sparkMessagingClient.getConnectionStatus();
        if (status.isConnected) {
            console.log('✅ Already connected:', status);
            setIsConnected(true);
            setSocketId(status.socketId);
        }

        // 클린업
        return () => {
            console.log('Cleaning up Spark Messaging client...');
            unsubscribeConnected();
            unsubscribeStateChange();
            unsubscribeMessage();
            unsubscribeError();
            sparkMessagingClient.disconnect();
        };
    }, []);

    const sendMessage = async () => {
        if (input.trim() && isConnected) {
            try {
                // Promise 기반 메시지 전송
                await sparkMessagingClient.sendMessage('chat', input);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        content: input,
                        timestamp: new Date(),
                        type: 'sent',
                    },
                ]);
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
                <div className="room-selector">
                    <label htmlFor="roomId">Room ID:</label>
                    <input
                        id="roomId"
                        type="text"
                        value={roomId}
                        onInput={(e) => setRoomId(e.currentTarget.value)}
                        placeholder="Enter room ID"
                        disabled={!isConnected}
                    />
                </div>

                <div className="messages-container">
                    <div className="messages-list">
                        {messages.length === 0 ? (
                            <div className="empty-message">메시지가 없습니다. 메시지를 보내보세요!</div>
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
                        placeholder={isConnected ? '메시지를 입력하세요...' : '연결 중...'}
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

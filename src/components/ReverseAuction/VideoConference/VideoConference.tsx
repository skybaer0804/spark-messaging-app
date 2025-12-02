import { memo } from 'preact/compat';
import { useVideoConference } from './hooks/useVideoConference';
import type { VideoConferenceAdapter } from './types';
import './VideoConference.scss';

interface VideoConferenceProps {
    adapter: VideoConferenceAdapter;
}

function VideoConferenceComponent({ adapter }: VideoConferenceProps) {
    const {
        localStream,
        isVideoEnabled,
        participants,
        socketId,
        localVideoRef,
        handleStartLocalStream,
        handleStopLocalStream,
        handleSetVideoRef,
    } = useVideoConference(adapter);

    return (
        <div className="video-conference__section">
            <div className="video-conference__controls">
                {!isVideoEnabled ? (
                    <button className="video-conference__toggle-button" onClick={handleStartLocalStream}>
                        📹 영상 시작
                    </button>
                ) : (
                    <button className="video-conference__toggle-button video-conference__toggle-button--stop" onClick={handleStopLocalStream}>
                        🛑 영상 중지
                    </button>
                )}
            </div>
            <div className="video-conference__grid">
                {/* 로컬 비디오 (자신) */}
                {isVideoEnabled && localStream && (
                    <div className="video-conference__item video-conference__item--local">
                        <video
                            ref={(el) => {
                                localVideoRef.current = el;
                                if (el && socketId) {
                                    handleSetVideoRef('local', el);
                                    if (localStream) {
                                        el.srcObject = localStream;
                                        el.autoplay = true;
                                        el.playsInline = true;
                                        el.muted = true;
                                        el.play().catch((error) => {
                                            console.error('[ERROR] 로컬 비디오 재생 실패:', error);
                                        });
                                    }
                                }
                            }}
                            className="video-conference__element"
                        />
                        <div className="video-conference__label">나 ({socketId?.substring(0, 6)})</div>
                    </div>
                )}

                {/* 원격 비디오 (다른 참가자들) */}
                {participants
                    .filter((p) => p.socketId !== socketId)
                    .slice(0, 4 - (isVideoEnabled ? 1 : 0))
                    .map((participant) => (
                        <div key={participant.socketId} className="video-conference__item">
                            <video
                                ref={(el) => {
                                    handleSetVideoRef(participant.socketId, el);
                                    if (el && participant.stream) {
                                        el.srcObject = participant.stream;
                                        el.autoplay = true;
                                        el.playsInline = true;
                                        el.muted = false;
                                        el.play().catch((error) => {
                                            console.error('[ERROR] 비디오 재생 실패:', error);
                                        });
                                    }
                                }}
                                className="video-conference__element"
                                style={{ display: participant.stream ? 'block' : 'none' }}
                            />
                            {participant.isVideoEnabled !== false && participant.stream ? (
                                <div className="video-conference__label">
                                    {participant.name} ({participant.role === 'demander' ? '수요자' : '공급자'}) - 영상 중
                                </div>
                            ) : (
                                <div className="video-conference__placeholder">
                                    {participant.name}
                                    <br />
                                    <small>{participant.role === 'demander' ? '수요자' : '공급자'}</small>
                                    <br />
                                    <small className="video-conference__loading">
                                        {participant.isVideoEnabled === false ? '영상 중지' : '연결 중...'}
                                    </small>
                                </div>
                            )}
                        </div>
                    ))}

                {/* 빈 슬롯 */}
                {participants.length === 0 && !isVideoEnabled && (
                    <div className="video-conference__placeholder">영상 영역 (영상 시작 버튼을 눌러주세요)</div>
                )}
            </div>
        </div>
    );
}

// React.memo로 메모이제이션하여 props가 변경되지 않으면 리렌더링 방지
export const VideoConference = memo(VideoConferenceComponent, (prevProps, nextProps) => {
    // adapter 참조가 같으면 리렌더링하지 않음
    // 실제 상태 변경은 adapter 내부에서 관리되므로 여기서는 참조만 비교
    return prevProps.adapter === nextProps.adapter;
});


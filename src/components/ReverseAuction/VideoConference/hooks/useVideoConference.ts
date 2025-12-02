import { useState, useEffect, useRef } from 'preact/hooks';
import type { VideoConferenceAdapter } from '../types';

export function useVideoConference(adapter: VideoConferenceAdapter) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [participants, setParticipants] = useState(adapter.getParticipants());
    const [socketId, setSocketId] = useState<string | null>(null);
    const videoElementRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
    const localVideoRef = useRef<HTMLVideoElement | null>(null);

    // adapter의 상태를 동기화
    useEffect(() => {
        const updateState = () => {
            const currentLocalStream = adapter.getLocalStream();
            const currentIsVideoEnabled = adapter.isVideoEnabled();
            const currentParticipants = adapter.getParticipants();
            const currentSocketId = adapter.getSocketId();

            setLocalStream((prev) => {
                if (prev !== currentLocalStream) {
                    return currentLocalStream;
                }
                return prev;
            });
            
            setIsVideoEnabled((prev) => {
                if (prev !== currentIsVideoEnabled) {
                    return currentIsVideoEnabled;
                }
                return prev;
            });
            
            setParticipants((prev) => {
                const prevStr = JSON.stringify(prev);
                const currentStr = JSON.stringify(currentParticipants);
                if (prevStr !== currentStr) {
                    return [...currentParticipants];
                }
                return prev;
            });
            
            setSocketId((prev) => {
                if (prev !== currentSocketId) {
                    return currentSocketId;
                }
                return prev;
            });
        };

        // 초기 상태 설정
        updateState();

        // 주기적으로 상태 동기화 (간단한 폴링 방식)
        const interval = setInterval(updateState, 100);

        return () => {
            clearInterval(interval);
        };
    }, [adapter]);

    // localStream이 변경될 때 로컬 비디오 엘리먼트 업데이트
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            if (localVideoRef.current.srcObject !== localStream) {
                localVideoRef.current.srcObject = localStream;
                localVideoRef.current.autoplay = true;
                localVideoRef.current.playsInline = true;
                localVideoRef.current.muted = true;
                localVideoRef.current.play().catch((error) => {
                    console.error('[ERROR] 로컬 비디오 재생 실패:', error);
                });
            }
        } else if (localVideoRef.current && !localStream) {
            localVideoRef.current.srcObject = null;
        }
    }, [localStream]);

    // participant.stream이 변경될 때 비디오 엘리먼트 업데이트
    useEffect(() => {
        participants.forEach((participant) => {
            if (participant.socketId === socketId) return; // 로컬 비디오는 제외

            const videoElement = videoElementRefs.current.get(participant.socketId);
            if (videoElement) {
                if (participant.stream) {
                    if (videoElement.srcObject !== participant.stream) {
                        videoElement.srcObject = participant.stream;
                        videoElement.autoplay = true;
                        videoElement.playsInline = true;
                        videoElement.muted = false;
                        videoElement.play().catch((error) => {
                            console.error('[ERROR] 비디오 재생 실패:', error);
                        });
                    }
                } else {
                    videoElement.srcObject = null;
                }
            }
        });
    }, [participants, socketId]);

    const handleStartLocalStream = async () => {
        await adapter.startLocalStream();
    };

    const handleStopLocalStream = async () => {
        await adapter.stopLocalStream();
    };

    const handleSetVideoRef = (socketId: string, element: HTMLVideoElement | null) => {
        if (element) {
            videoElementRefs.current.set(socketId, element);
        } else {
            videoElementRefs.current.delete(socketId);
        }
        adapter.setVideoRef(socketId, element);
    };

    return {
        localStream,
        isVideoEnabled,
        participants,
        socketId,
        localVideoRef,
        videoElementRefs,
        handleStartLocalStream,
        handleStopLocalStream,
        handleSetVideoRef,
    };
}


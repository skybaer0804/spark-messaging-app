import type { Participant } from '../../types';

export interface VideoConferenceAdapter {
    getLocalStream(): MediaStream | null;
    isVideoEnabled(): boolean;
    getParticipants(): Participant[];
    getSocketId(): string | null;
    startLocalStream(): Promise<void>;
    stopLocalStream(): Promise<void>;
    setVideoRef(socketId: string, element: HTMLVideoElement | null): void;
}


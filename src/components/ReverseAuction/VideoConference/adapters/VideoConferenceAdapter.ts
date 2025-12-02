import type { VideoConferenceAdapter } from '../types';
import type { Participant } from '../../types';

export class ReverseAuctionVideoConferenceAdapter implements VideoConferenceAdapter {
    private getLocalStreamFn: () => MediaStream | null;
    private isVideoEnabledFn: () => boolean;
    private getParticipantsFn: () => Participant[];
    private getSocketIdFn: () => string | null;
    private startLocalStreamFn: () => Promise<void>;
    private stopLocalStreamFn: () => Promise<void>;
    private setVideoRefFn: (socketId: string, element: HTMLVideoElement | null) => void;

    constructor(config: {
        getLocalStream: () => MediaStream | null;
        isVideoEnabled: () => boolean;
        getParticipants: () => Participant[];
        getSocketId: () => string | null;
        startLocalStream: () => Promise<void>;
        stopLocalStream: () => Promise<void>;
        setVideoRef: (socketId: string, element: HTMLVideoElement | null) => void;
    }) {
        this.getLocalStreamFn = config.getLocalStream;
        this.isVideoEnabledFn = config.isVideoEnabled;
        this.getParticipantsFn = config.getParticipants;
        this.getSocketIdFn = config.getSocketId;
        this.startLocalStreamFn = config.startLocalStream;
        this.stopLocalStreamFn = config.stopLocalStream;
        this.setVideoRefFn = config.setVideoRef;
    }

    // 내부 함수 참조 업데이트 메서드 (adapter 재생성 없이 최신 값 참조)
    updateConfig(config: {
        getLocalStream?: () => MediaStream | null;
        isVideoEnabled?: () => boolean;
        getParticipants?: () => Participant[];
        getSocketId?: () => string | null;
        startLocalStream?: () => Promise<void>;
        stopLocalStream?: () => Promise<void>;
        setVideoRef?: (socketId: string, element: HTMLVideoElement | null) => void;
    }) {
        if (config.getLocalStream) this.getLocalStreamFn = config.getLocalStream;
        if (config.isVideoEnabled) this.isVideoEnabledFn = config.isVideoEnabled;
        if (config.getParticipants) this.getParticipantsFn = config.getParticipants;
        if (config.getSocketId) this.getSocketIdFn = config.getSocketId;
        if (config.startLocalStream) this.startLocalStreamFn = config.startLocalStream;
        if (config.stopLocalStream) this.stopLocalStreamFn = config.stopLocalStream;
        if (config.setVideoRef) this.setVideoRefFn = config.setVideoRef;
    }

    getLocalStream(): MediaStream | null {
        return this.getLocalStreamFn();
    }

    isVideoEnabled(): boolean {
        return this.isVideoEnabledFn();
    }

    getParticipants(): Participant[] {
        return this.getParticipantsFn();
    }

    getSocketId(): string | null {
        return this.getSocketIdFn();
    }

    async startLocalStream(): Promise<void> {
        return this.startLocalStreamFn();
    }

    async stopLocalStream(): Promise<void> {
        return this.stopLocalStreamFn();
    }

    setVideoRef(socketId: string, element: HTMLVideoElement | null): void {
        this.setVideoRefFn(socketId, element);
    }
}


import type { VideoConferenceAdapter, VideoConferenceMessage } from '../types';
import type { VideoStore } from '../../stores/VideoStore';
import type { VideoMeetingStore } from '../../stores/VideoMeetingStore';
import type { WebRTCService } from '../../services/WebRTCService';

export class VideoMeetingVideoConferenceAdapter implements VideoConferenceAdapter {
  private videoStore: VideoStore;
  private videoMeetingStore: VideoMeetingStore;
  private webRTCService: WebRTCService;

  constructor(videoStore: VideoStore, videoMeetingStore: VideoMeetingStore, webRTCService: WebRTCService) {
    this.videoStore = videoStore;
    this.videoMeetingStore = videoMeetingStore;
    this.webRTCService = webRTCService;
  }

  // ... (rest of the file remains same, just replacing types)
  getLocalStream() {
    return this.webRTCService.getLocalStream();
  }
  isVideoEnabled() {
    return this.videoStore.isVideoEnabled.value;
  }
  getParticipants() {
    return this.videoMeetingStore.participants.value;
  }
  getSocketId() {
    return this.videoMeetingStore.socketId.value;
  }
  async startLocalStream() {
    await this.webRTCService.startLocalStream();
  }
  async stopLocalStream() {
    this.webRTCService.stopLocalStream();
  }
  setVideoRef(socketId: string, element: HTMLVideoElement | null) {
    this.webRTCService.setVideoRef(socketId, element);
  }

  // Signal 기반 접근
  getLocalStreamSignal() {
    return this.videoStore.localStream;
  }
  getIsVideoEnabledSignal() {
    return this.videoStore.isVideoEnabled;
  }
  getParticipantsSignal() {
    return this.videoMeetingStore.participants;
  }
  getSocketIdSignal() {
    return this.videoMeetingStore.socketId;
  }

  getRemoteStreams() {
    return this.videoStore.remoteStreams.value;
  }
  isConnected() {
    return this.videoMeetingStore.isConnected.value;
  }
  async toggleVideo() {
    // Note: webRTCService.toggleVideo()가 없을 수도 있음. 
    // 로컬 스트림 트랙 제어로 구현 필요
    const stream = this.webRTCService.getLocalStream();
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.videoStore.isVideoEnabled.value = videoTrack.enabled;
      }
    }
  }
  async toggleAudio() {
    const stream = this.webRTCService.getLocalStream();
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }
  async leave() {
    await this.videoMeetingStore.leaveRoom();
  }
}

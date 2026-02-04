# 채팅 파일 전송 아키텍처 흐름 분석

## 전체 아키텍처 개요

이 프로젝트는 **DB-First 방식**으로 파일 전송을 처리합니다. 파일은 서버에 저장되고, 메시지는 DB에 저장된 후 소켓으로 브로드캐스트됩니다.

---

## 1. 클라이언트 측 (Frontend)

### 1.1 파일 선택 및 검증

**위치**: `client/src/core/api/FileTransferService.ts`

**흐름**:
```
사용자 파일 선택
    ↓
FileTransferService.validateFile()
    - 파일 크기 검증 (최대 10MB)
    - MIME 타입 검증 (이미지, 문서, 동영상, 오디오)
    - 확장자 기반 타입 감지
```

### 1.2 파일 업로드

**위치**: `client/src/domains/Chat/hooks/useChatApp.ts` → `FileTransferService.sendFile()`

**흐름**:
```
useChatApp.handleFileSend()
    ↓
FileTransferService.sendFile(roomId, file, onProgress)
    ↓
FormData 생성 (file + roomId)
    ↓
chatApi.uploadFile(formData) [POST /api/chat/upload]
    - Content-Type: multipart/form-data
    - 진행률 콜백: 10% → 30% → 100%
```

---

## 2. 서버 측 (Backend)

### 2.1 파일 수신 및 저장

**위치**: `server/middleware/upload.js` (Multer 미들웨어)

**설정**:
- 저장 경로: `C:/project/file/original/`
- 파일명: `{랜덤16바이트hex}.{원본확장자}`
- 파일 크기 제한: 50MB
- 허용 MIME 타입: `image/*`, `video/mp4`, `audio/mpeg`, `application/pdf`

### 2.2 파일 업로드 처리

**위치**: `server/controllers/chatController.js` → `uploadFile()`

**단계별 처리**:

1. 파일 존재 확인 (`req.file`)
2. 이미지 타입 감지 및 썸네일 생성
   - `imageService.createThumbnail()` → `C:/project/file/thumbnails/`
3. 시퀀스 번호 원자적 증가
   - `ChatRoom.lastSequenceNumber += 1`
4. DB에 메시지 저장 (Message 모델)
   - `type`: 'image' 또는 'file'
   - `fileUrl`: 파일 경로
   - `thumbnailUrl`: 썸네일 경로 (이미지인 경우)
   - `fileName`, `fileSize`, `mimeType` 저장
5. 채팅방 정보 업데이트
   - `room.lastMessage = newMessage._id`
   - `UserChatRoom.lastReadSequenceNumber` 업데이트 (송신자)
6. 소켓 브로드캐스트
   - `socketService.sendRoomMessage(roomId, type, messageData, senderId)`
7. 방 목록 업데이트 알림 (안읽음 카운트 포함)
   - `socketService.notifyRoomListUpdated()` (수신자들에게만)

### 2.3 소켓 브로드캐스트

**위치**: `server/services/socketService.js`

**메서드**: `sendRoomMessage(roomId, type, content, senderId)`

**전송 데이터 구조**:
```javascript
{
  content: {
    _id: messageId,
    roomId: roomId,
    content: "File: filename.ext",
    fileUrl: "C:/project/file/original/...",
    thumbnailUrl: "C:/project/file/thumbnails/...",
    fileName: "filename.ext",
    fileSize: 12345,
    senderId: userId,
    senderName: "username",
    sequenceNumber: 123,
    readBy: [senderId],
    timestamp: Date
  },
  senderId: userId,
  timestamp: Date.now()
}
```

---

## 3. 클라이언트 수신 및 표시

### 3.1 소켓 메시지 수신

**위치**: `client/src/core/socket/ChatService.ts`

**흐름**:
```
SparkMessaging SDK → onRoomMessage 이벤트
    ↓
ChatService.onRoomMessage()
    ↓
메시지 포맷팅 (Message 인터페이스로 변환)
    - fileUrl, thumbnailUrl, fileName 등 fileData 구성
    ↓
콜백 호출 (useChatRoom 등)
```

### 3.2 UI 표시

**위치**: `client/src/domains/Chat/components/ChatMessageItem.tsx`

**표시 로직**:
- **이미지**: 썸네일 표시 + 클릭 시 확대
- **파일**: 아이콘 + 파일명 + 크기 + 다운로드 버튼
- `fileUrl`을 통해 파일 다운로드/표시

---

## 4. 데이터 모델

### 4.1 Message 모델 (`server/models/Message.js`)

```javascript
{
  roomId: ObjectId,
  senderId: ObjectId,
  content: String,  // "File: filename.ext"
  type: 'text' | 'file' | 'image' | 'system',
  sequenceNumber: Number,
  fileUrl: String,      // 파일 경로
  thumbnailUrl: String, // 썸네일 경로 (이미지)
  fileName: String,
  fileSize: Number,
  mimeType: String,
  readBy: [ObjectId],
  timestamp: Date
}
```

---

## 5. 주요 특징

1. **DB-First**: 파일 업로드 → DB 저장 → 소켓 브로드캐스트
2. **파일 저장**: 서버 로컬 파일시스템 (`C:/project/file/`)
3. **이미지 처리**: Sharp로 썸네일 자동 생성 (300x300, WebP)
4. **시퀀스 번호**: 방별 원자적 증가로 메시지 순서 보장
5. **읽음 처리**: 송신자는 자동 읽음, 수신자는 별도 API 호출
6. **안읽음 카운트**: 실시간 계산 및 소켓으로 전송

---

## 6. 아키텍처 다이어그램

```
[클라이언트]
  FileTransferService
    ↓ (FormData)
  POST /api/chat/upload
    ↓
[서버]
  Multer 미들웨어 (파일 저장)
    ↓
  chatController.uploadFile()
    ├─ 이미지 썸네일 생성
    ├─ DB 저장 (Message)
    ├─ ChatRoom 업데이트
    └─ 소켓 브로드캐스트
        ↓
  socketService.sendRoomMessage()
    ↓
[소켓 서버]
  SparkMessaging SDK
    ↓ (브로드캐스트)
[클라이언트들]
  ChatService.onRoomMessage()
    ↓
  UI 업데이트 (ChatMessageItem)
```

---

## 7. 개선 가능한 부분

1. **파일 저장소**: 로컬 파일시스템 → S3/클라우드 스토리지
2. **파일 URL**: 절대 경로 → HTTP URL (정적 파일 서빙)
3. **파일 크기 제한**: 클라이언트 10MB, 서버 50MB 불일치
4. **에러 처리**: 파일 업로드 실패 시 롤백 로직 부재
5. **파일 삭제**: 메시지 삭제 시 파일 삭제 로직 부재

---

이 구조는 **DB-First 방식**으로, 파일과 메시지가 서버에 저장된 후 실시간으로 전달됩니다.

# Spark Messaging Demo 🚀

> **"웹 기술로 완성한 네이티브 수준의 협업 플랫폼"**
>
> Spark Messaging Demo는 단순한 채팅앱이 아닙니다. 디자이너와 엔지니어를 위한 **3D 협업**, **완벽한 모바일 경험(PWA/TWA)**, 그리고 **극한의 성능 최적화**를 목표로 설계된 차세대 메신저 프로젝트입니다.

---

## 🔥 Why Spark? (핵심 차별점)

### 1. 📱 Mobile First & Native Experience
웹앱이지만 네이티브 앱과 구분이 가지 않는 사용자 경험을 제공합니다.
*   **Dedicated Mobile UI**: 단순히 화면만 줄인 반응형이 아닙니다. 모바일에 최적화된 입력창(`MobileChatInput`)과 터치 제스처를 지원하는 슬라이드 패널을 별도로 구현했습니다.
*   **Overlay System**: 아이폰/안드로이드의 네이티브 모달처럼 동작하는 오버레이 시스템을 직접 구축하여 이질감을 없앴습니다.
*   **Store Ready (TWA)**: 구글 플레이 스토어에 바로 등록할 수 있는 **Trusted Web Activity** 레디 상태입니다.

### 2. 🎨 3D & Rich Collaboration
텍스트로는 설명하기 힘든 아이디어, 이제 3D 모델로 직접 보여주세요.
*   **Built-in 3D Viewer**: 별도 프로그램 설치 없이, 웹 브라우저에서 `.glb` 모델을 자유롭게 회전하고 확대하며 논의할 수 있습니다.
*   **Smart Conversion**: `.stl` 파일을 올리면 서버가 자동으로 웹 최적화 포맷(Draco Compression)으로 변환하여, 모바일에서도 가볍게 로딩됩니다.

### 3. ⚡️ Extreme Performance
수천 개의 메시지가 오가는 대화방에서도 끊김 없는 부드러움을 경험하세요.
*   **Fine-grained Reactivity**: **Preact Signals**를 도입하여, 상태 변화 시 컴포넌트 전체를 다시 그리는 낭비를 없앴습니다. 
*   **Lightweight**: React 호환 라이브러리인 **Preact**를 사용하여 번들 사이즈를 극적으로 줄였습니다(3KB).

---

## ✨ Key Features

### 💬 Powerful Communication
*   **Threads**: 메인 대화 흐름을 방해하지 않는 스레드 댓글 기능.
*   **Forwarding**: 메시지를 다른 채널이나 DM으로 손쉽게 공유.
*   **Mentions**: `@username` 멘션 및 **스마트 알림 설정**(모두 받기 / 멘션만 받기 / 끄기).
*   **Rich Text**: 직접 구현한 마크다운 렌더러와 이모지 피커.

### 🏢 Team & Workspace
*   **Organization**: Workspace > Team & Channel의 체계적인 구조.
*   **Access Control**: 공개(Public) / 비공개(Private) 채널 설정 및 멤버 초대/강퇴 기능.

### 📹 Video Conference
*   **In-Browser Call**: 설치 없이 바로 연결되는 WebRTC 화상 회의.
*   **Dynamic Grid**: 참여자 수에 따라 자동으로 최적화되는 반응형 그리드 뷰.

---

## 🛠 Tech Stack

### Frontend (Client)
*   **Core**: `Preact`, `TypeScript`, `Vite`
*   **State**: `@preact/signals` (High Performance State Management)
*   **UI/UX**: `SCSS Modules`, `CSS Variables` (Theming)
*   **Media**: `Three.js` (@react-three/fiber), `WebRTC`

### Backend (Server)
*   **Runtime**: `Node.js`, `Express`
*   **Real-time**: `Socket.IO` (Custom Adapter Implementation)
*   **Processing**: `Bull Queue` (Async Worker)

### Infrastructure
*   **Database**: `MongoDB` (Mongoose)
*   **Cache**: `Redis` (Session, Pub/Sub)
*   **Storage**: Local / AWS S3 Compatible

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   MongoDB
*   Redis

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/spark-messaging-demo.git

# 2. Install dependencies (Root, Client, Server)
npm install
cd client && npm install
cd ../server && npm install

# 3. Environment Setup
# .env 파일을 server/와 client/에 각각 생성해주세요. (예제 참고)

# 4. Run Development Server
# Root 디렉토리에서
npm run dev
```

---

## 📚 Architecture Deep Dive

이 프로젝트는 **MVC 패턴**을 기반으로, 실시간성 보장을 위한 **Socket 서버**와 무거운 작업을 분리한 **Worker 서버**가 유기적으로 결합된 **Micro-services 지향 아키텍처**를 따릅니다.

> 자세한 기술적 분석 내용은 [project_report.md](./project_report.md)를 참고하세요.

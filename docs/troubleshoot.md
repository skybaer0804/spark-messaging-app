# 모바일 웹 및 PWA 화이트 스크린(White Screen) 트러블슈팅 가이드

이 문서는 모바일 웹(iOS Safari, Android Chrome) 및 PWA 환경에서 발생하는 "화이트 스크린" 현상의 원인과 해결 방안을 정리한 기술 가이드입니다.

---

## 1. 개요 (Symptom)
PC 브라우저에서는 정상 작동하지만, 특정 모바일 기기에서 접속 시 화면이 완전히 하얗게 나오거나 초기 로딩 배경색만 보이고 앱이 실행되지 않는 현상.

## 2. 주요 원인 및 해결책

### 🟢 원인 1: 자바스크립트 런타임 에러 (TypeError)
- **문제**: 서버에서 JSON으로 전달된 날짜 데이터가 `string` 타입임에도 불구하고, 클라이언트 코드에서 `.getTime()` 등을 직접 호출하여 크래시 발생.
- **해결책**:
    - 데이터를 받는 즉시 `new Date()`로 변환하거나, 안전한 유틸리티 함수(`getSafeTime`)를 사용합니다.
    - **핵심 원칙**: UI 컴포넌트 내부에서 변환하기보다 API/소켓 어댑터 층에서 데이터를 정제(Sanitization)하여 전달합니다.

### 🟢 원인 2: 로컬 스토리지 접근 보안 오류 (SecurityError)
- **문제**: 모바일 시크릿 모드나 개인정보 보호 설정이 강화된 브라우저에서 `localStorage`에 접근할 때 `SecurityError`를 던지며 스크립트 실행이 중단됨.
- **해결책**:
    - `localStorage`를 직접 호출하지 않고, `try-catch`로 감싸진 래퍼 유틸리티(`storageCache.ts`)를 사용합니다.
    - 에러 발생 시 앱이 멈추는 대신 `null`을 반환하고 기본값으로 동작하도록 처리합니다.

### 🟢 원인 3: 불안정한 뷰포트 너비 측정 (`window.innerWidth`)
- **문제**: 모바일에서 주소창이 사라지거나 가상 키보드가 올라올 때 `window.innerWidth` 값이 부정확하게 측정되어 반응형 로직이 오작동함.
- **해결책**:
    - `resize` 이벤트 핸들러 대신 `window.matchMedia('(max-width: 768px)')`를 사용하여 CSS와 동일한 기준으로 해상도를 판정합니다.

### 🟢 원인 4: 모바일 브라우저 높이 계산 오류 (`100vh` vs `100dvh`)
- **문제**: 모바일 Safari 등에서 `100vh`는 하단 툴바 영역을 포함하여 계산되므로 실제 콘텐츠가 화면 밖으로 밀려나 화이트 스크린처럼 보일 수 있음.
- **해결책**:
    - **PWA 안정화**: `100dvh`는 키보드 동작 시 높이가 수시로 변해 레이아웃이 출렁거릴 수 있습니다.
    - **최선의 방법**: 
        - `html, body`에 `height: 100%` 및 `overflow: hidden` 설정.
        - `body`에 `min-height: -webkit-fill-available`을 추가하여 iOS 기기에서 실제 가용 화면을 꽉 채우도록 합니다.

### 🟢 원인 5: iOS PWA Safe Area 대응 미흡
- **문제**: 홈 화면 설치(PWA) 시 상단 헤더가 상태 표시줄(Status Bar)과 겹치거나, 하단 입력창이 홈 인디케이터에 가려짐.
- **해결책**:
    - `index.html`에 `viewport-fit=cover` 설정 추가.
    - CSS/인라인 스타일에 `env(safe-area-inset-top)` 및 `env(safe-area-inset-bottom)`를 사용하여 기기별 물리적 여백을 확보합니다.

---

## 3. 체크리스트 (Summary Checklist)

1. [ ] **데이터 정제**: 서버 응답 데이터의 Date 필드가 실제 Date 객체인지 확인했는가?
2. [ ] **보안 저장소**: `localStorage` 접근부를 `try-catch`로 보호했는가?
3. [ ] **뷰포트 설정**: `index.html` 메타 태그에 `viewport-fit=cover`가 포함되었는가?
4. [ ] **안정적 높이**: `100vh` 대신 `100%`와 `-webkit-fill-available`을 사용했는가?
5. [ ] **Safe Area**: 헤더와 푸터에 `env(safe-area-inset-*)` 여백을 적용했는가?
6. [ ] **디버깅**: `vite.config.ts`에서 `console` 로그 제거 옵션이 테스트 중에 꺼져 있는가?

## 4. 관련 파일 참고
- `client/src/core/utils/storageCache.ts`: 안전한 로컬 스토리지 접근
- `client/src/core/utils/common.ts`: 안전한 데이터 변환 유틸리티
- `client/src/core/context/ThemeProvider.tsx`: `matchMedia` 기반 반응형 판정
- `client/index.html`: 뷰포트 및 리소스 힌트 설정

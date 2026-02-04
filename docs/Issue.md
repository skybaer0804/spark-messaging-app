# 모바일 환경 하얀 화면(White Screen) 이슈 정리

## 1. 문제 증상
- **현상**: PC 브라우저에서는 정상 작동하나, 모바일 기기(iOS Safari/Chrome, Android Chrome) 및 TWA 앱으로 접속 시 화면이 하얗게(White Screen) 나옴.
- **주요 에러 메시지 (초기)**: 
  - `net::ERR_CONNECTION_REFUSED`
  - `Chat Connection Error: CONNECTION_ERROR (xhr poll error)`
- **특이사항**: `https://spark.koyeb.app/.well-known/assetlinks.json` 접속 시 초기에는 홈페이지가 떴으나, 현재는 정상적으로 JSON 내용이 확인됨.

## 2. 프로젝트 구조
- **Front-end**: Preact + Vite (PWA 설정 적용)
- **Back-end**: Express (Node.js)
- **배포 환경**: Koyeb (Client/Server 통합 서빙 구조)

## 3. 시도한 해결 방법 및 적용 사항

### [인프라 및 서버 설정]
- **정적 파일 서빙**: `server/index.js`에서 `client/dist` 폴더를 서빙하도록 설정하고, 특히 `.well-known` 폴더에 우선순위를 부여함.
- **SPA 라우팅 대응**: API(` /api`)나 파일(`.js`, `.css` 등) 요청이 아닌 경우 `index.html`을 반환하도록 서버 로직 강화.
- **MIME 타입 보안**: 모바일 브라우저의 엄격한 체크를 위해 `.js` 파일의 `Content-Type`을 `application/javascript`로 강제하고 `X-Content-Type-Options: nosniff` 헤더 추가.
- **CORS 설정**: 중복된 CORS 미들웨어를 제거하고 설정을 일원화하여 OPTIONS(Preflight) 요청 안정화.

### [클라이언트 코드 최적화]
- **환경 변수 일관성**: 코드 내 환경 변수명을 `.env`와 일치시킴 (`VITE_SPARK_SERVER_URL` 등).
- **인증 로직 안정화**: `AuthContext.tsx`에서 API 호출 실패나 지연 시에도 `setLoading(false)`가 반드시 호출되도록 하여 무한 로딩 방지.
- **PWA 서비스 워커**: 
    - `vite.config.ts`에서 `/socket.io/` 경로를 캐싱 예외(`navigateFallbackDenylist`)로 설정.
    - `main.tsx`에서 iOS 호환성을 위해 `requestIdleCallback` 대신 `setTimeout`을 사용하여 워커 등록 지연 처리.
- **시각적 피드백**: `index.html`에 기본 배경색(`#1a1a2e`)을 추가하여 JS 로드 전 상태 구분 가능하게 함.

## 4. 현재 의심되는 원인 (추가 분석 필요)
1. **강력한 서비스 워커 캐시**: 모바일 기기에 이전의 잘못된 응답(404나 잘못된 MIME 타입)이 캐싱되어 서버 수정본이 반영되지 않고 있을 가능성.
2. **모바일 네트워크 환경의 CORS/SSL**: PC와 달리 모바일 네트워크나 특정 브라우저에서 API 서버로의 인증 헤더(`Authorization`) 전송이 차단될 가능성.
3. **JS 번들 런타임 에러**: 특정 모바일 브라우저에서 지원하지 않는 최신 문법이나 API가 포함되어 실행 직후 크래시가 발생할 가능성.

## 5. 향후 조치 제안
- 모바일 기기 브라우저 데이터(캐시/쿠키/서비스 워커) 완전 초기화 후 재테스트.
- `vite.config.ts`에서 `console` 로그 제거 옵션 해제 후 실기기 디버깅(Safari/Chrome Inspect) 시도.
- Koyeb 배포 로그를 통해 모바일 접속 시 발생하는 4xx/5xx 에러 실시간 모니터링.

## 6. 원인 분석 및 해결 (2026-02-04)
### 원인 분석
1. **환경 변수 불일치**: `client/src/config/sparkMessaging.ts`에서 사용하는 환경 변수명(`VITE_SOCKET_URL`)과 `.env` 파일에 정의된 변수명(`VITE_SPARK_SOCKET_URL`)이 일치하지 않음. 이로 인해 소켓 연결 시 기본값인 `localhost`로 연결을 시도함.
2. **Production 환경 변수 부재**: Koyeb 배포 시 `npm run build`를 실행하지만, 배포용 환경 변수 파일(`client/.env.production`)이 없거나 Koyeb 콘솔에서 환경 변수가 주입되지 않아, `VITE_API_URL`이 개발용 설정인 `http://localhost:5000/api`로 빌드됨.
3. **결과**: PC 환경(localhost 서버 가동 또는 브라우저 정책 차이)에서는 동작할 수 있으나, 모바일 기기에서는 `localhost`가 기기 자신을 가리키므로 `CONNECTION_REFUSED` 에러가 발생함.

### 추가 발견된 원인 (2026-02-04)
4. **서비스 워커의 TWA 인증 파일 간섭**: PWA 서비스 워커가 `/.well-known/assetlinks.json` 요청을 페이지 내비게이션으로 오인하여 `index.html`을 반환하는 문제가 확인됨. 이로 인해 최초 접속 시 TWA 인증이 실패하고, 강력 새로고침을 해야만 정상적인 JSON이 보임.
5. **Runtime Error (White Screen 원인)**: `ChatMessageItem.tsx`에서 `lastReplyAt` 값이 Date 객체가 아닌 ISO 문자열로 넘어오는데 `.getTime()` 함수를 직접 호출하여 `TypeError`가 발생함. 이 오류로 인해 앱 렌더링이 중단되어 모바일에서 하얀 화면(White Screen)이 발생했을 가능성이 매우 높음.
6. **취약한 에러 핸들링**: 기존에는 런타임 에러 발생 시 앱이 전체가 멈추고 하얀 화면만 나왔음. AuthContext 초기화 중에도 로딩 화면이 없어 사용자가 멈춘 것으로 오인할 수 있었음.

### 조치 사항
1. **코드 수정 (Reverted)**: 사용자 피드백에 따라 `sparkMessaging.ts` 및 `vite.config.ts`의 환경 변수 관련 수정 사항은 원복함. (PC 접속이 되는 것으로 보아 환경 변수 문제가 아님을 확인)
2. **서비스 워커 예외 처리**: `vite.config.ts`의 `navigateFallbackDenylist`에 `/^\/.well-known/` 정규식을 추가하여, TWA 인증 파일 요청 시 서비스 워커가 개입하지 않고 서버로 직접 요청하도록 수정함.
3. **Runtime Error 수정**: `ChatMessageItem.tsx`에서 `lastReplyAt`을 비교할 때 `new Date()`로 변환 후 안전하게 비교하도록 수정하여 `TypeError` 방지.
4. **Meta Tag 업데이트**: `index.html`에 `mobile-web-app-capable` 메타 태그 추가.
5. **안전장치 추가**: `GlobalErrorBoundary`를 도입하여 치명적인 에러 발생 시 하얀 화면 대신 에러 로그와 새로고침 버튼을 표시하도록 변경. `AuthContext`에 초기화 로딩 UI 추가.
6. **재배포 필요**: 위 변경 사항들을 포함하여 재배포 후 확인 필요.

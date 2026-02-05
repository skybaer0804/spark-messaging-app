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
6. **취약한 에러 핸들링 (Reverted)**: 런타임 에러 복구를 위해 Global Error Boundary 도입을 시도했으나, Preact signals와의 충돌로 추정되는 PC 환경 크래시(`vendor-signals-CPectLUK.js`)가 발생하여 해당 변경사항들을 모두 원복함.

### 조치 사항
1. **코드 수정 (Reverted)**: 사용자 피드백에 따라 `sparkMessaging.ts` 및 `vite.config.ts`의 환경 변수 관련 수정 사항은 원복함.
2. **서비스 워커 예외 처리**: `vite.config.ts`의 `navigateFallbackDenylist`에 `/^\/.well-known/` 정규식을 추가하여, TWA 인증 파일 요청 시 서비스 워커가 개입하지 않고 서버로 직접 요청하도록 수정함. (이것만 유효)
3. **Runtime Error 수정 (Reverted)**: `ChatMessageItem.tsx` 수정 시도했으나 전체 원복 요청으로 인해 Rollback됨. 추후 다시 적용 필요.
4. **전체 원복 (2026-02-04)**: `GlobalErrorBoundary`, Auth Loading, meta tag 등 최근 적용한 변경사항 전체를 원복하여 PC 접속 상태 복구. Mobile White Screen 이슈는 원점 재검토 필요.

### 재해결 (2026-02-04)
1. **ChatMessageItem.tsx & ChatMessages.tsx memo 수정**: `lastReplyAt.getTime()` 호출 시 `lastReplyAt`이 Date 객체가 아닌 string일 경우 발생하는 `TypeError`를 방어하기 위해 `new Date()`로 감싸거나 안전하게 비교하도록 수정.
2. **useMessageSync.ts 데이터 포맷팅 추가**: `syncMessages`를 통해 가져온 raw 데이터가 `formatServerMessage`를 거치지 않아 Date 필드가 string으로 남아있던 문제를 해결.
3. **index.html 초기 배경색 추가**: JS 로드 전 하얀 화면이 잠깐 뜨는 것을 방지하기 위해 인라인 스타일로 배경색(`#1a1a2e`) 지정.
4. **VideoMeetingStore.ts 방어 코드**: `timestamp.getTime()` 호출 전 `new Date()`로 명시적 변환 추가.
5. **공통 유틸리티 추출**: `useChatRoom.ts`에 있던 `formatServerMessage`를 `chatUtils.ts`로 옮겨 `useMessageSync` 등에서도 재사용 가능하게 함.


2026-02-05
소스코드 수정하지말고 현 프로젝트에서 이야기하자.
Issue.md 증상이 여전한데 테스트하다보니까 순간적으로 color 가 index.html에 적용한 컬러(블랙색상)으로 깜빡였거든
@client/index.html 에 컬러 넣은게 화이트스페이스만 있고 모바일에서 확인이 안되니까 넣어본 스타일태그거든.
이점을 추가하면 원인을 줄일 수 있지않을까?
server 통신, socket 통신은 PC 에서 웹사이트, PWA로 잘되니까.
딱 모바일 웹 사이트, PWA가 안되거든.
원인을 추론해보자.

사용자님의 관찰(검은색 배경 깜빡임)은 문제 해결에 있어 매우 중요한 결정적인 단서(Symptom)입니다. 이 현상을 바탕으로 원인을 추론해 보겠습니다.
1. "검은색 깜빡임"이 의미하는 것
index.html에 설정한 #1a1a2e 색상이 보였다는 것은 다음을 보장합니다:
네트워크 정상: 브라우저가 서버로부터 최신 index.html을 성공적으로 가져왔습니다. (캐시된 옛날 파일이 아님)
브라우저 렌더링 시작: 브라우저가 HTML을 해석하고 초기 스타일을 화면에 그리기 시작했습니다.
JS 번들 로드 시작: HTML 파일 하단의 <script type="module" src="/src/main.tsx"></script>를 통해 자바스크립트 실행 단계로 진입했다는 신호입니다.
2. 왜 곧바로 "화이트 스크린"으로 변하는가?
검은색 배경이 사라지고 흰색(또는 밝은 회색)이 되었다는 것은, 자바스크립트가 실행되어 초기 배경색을 덮어버렸음을 의미합니다.
index.css의 영향: client/src/index.css 13라인을 보면 body { background-color: #f5f5f5; }가 설정되어 있습니다. JS 번들이 로드되면서 이 CSS가 적용되면 즉시 검은색에서 밝은 색으로 바뀝니다.
Preact 앱 마운트: main.tsx의 render() 함수가 실행되어 #app 요소 안에 무언가(아마도 Loading 컴포넌트)를 그렸음을 의미합니다.
3. 모바일에서만 안 되는 이유 (추론)
가설 A: AuthContext의 'loading' 상태에서 무한 루프 또는 정지
App.tsx를 보면 useAuth()의 loading이 true일 때 <Loading fullScreen />을 렌더링합니다.
166|    if (loading) return <Loading fullScreen />;
Loading 컴포넌트는 var(--color-bg-default) 배경색을 사용하는데, 테마 초기화 전에는 이 값이 흰색일 가능성이 높습니다.
원인: 모바일에서 authApi.getMe() 호출이 응답이 없거나(Hang) 에러가 났는데 catch문에서 setLoading(false)로 넘어가지 못하는 상황일 수 있습니다.
특히, Issue.md에 언급된 환경 변수 불일치 문제로 인해 모바일 기기가 localhost로 API 요청을 보내려다 타임아웃에 빠졌을 가능성이 큽니다. PC는 localhost 서버가 떠 있을 수 있지만 모바일은 기기 자신을 가리키기 때문입니다.
가설 B: Service Worker의 캐시 오염 (MIME 타입 이슈)
모바일 브라우저(특히 PWA)는 PC보다 서비스 워커 캐시를 더 엄격하게 관리합니다.
만약 서비스 워커가 이전의 잘못된(404나 텍스트 타입으로 잘못 전송된) JS 덩어리(chunk)를 캐싱하고 있다면, main.js는 실행되지만 도중에 다른 모듈을 불러오지 못해 런타임 에러가 발생하고 앱이 멈춰버립니다.
가설 C: 특정 모바일 브라우저의 JS 런타임 에러
Issue.md 49번 라인에서 언급된 lastReplyAt.getTime() 같은 에러가 다른 곳에도 남아있다면, PC에서는 운 좋게 통과되더라도 특정 모바일 브라우저 엔진(WebKit 등)에서는 즉시 크래시를 일으켜 화면 렌더링이 중단될 수 있습니다.
4. 결론 및 원인 압축
사용자님이 보신 "검은색 -> 흰색" 변화는 "HTML 로드 성공 -> JS/CSS 로드 시작 -> 앱 초기화 중 중단"의 흐름을 정확히 보여줍니다.
가장 유력한 원인:
API URL 설정 오류: 모바일 앱이 실제 서버가 아닌 잘못된 URL(예: localhost)로 인증 정보를 확인하려다 응답을 받지 못해 Loading 화면(흰색 배경)에서 멈춰 있음.
초기화 스크립트 크래시: main.tsx나 App.tsx의 초기화 로직(useEffect) 중에 모바일 환경에서만 발생하는 예외(예: localStorage 접근 권한, 서비스 워커 등록 이슈 등)가 발생하여 렌더링이 중단됨.
조언:
index.html에 추가하신 스타일 태그 덕분에 "서버에서 파일을 못 가져오는 문제는 아니다"라는 것을 확실히 배제할 수 있게 되었습니다. 이제 문제는 "JS가 실행된 직후의 앱 초기화 로직" 내부에 있다고 확신하셔도 좋습니다. 특히 좋을 것 같습니다.


이 프로젝트와는 다르게 운영서버는 정확한 환경변수가 적용되어있어.
궁금한게 lastReplayAt.getTime() 같은 에러는 왜 발생하는가? 생각해보면 lastReplay는 getTime() 함수가 없는 객체일 수 있고
옵셔널 체이닝 문법 미적용과 옵셔널 적용되는 값이 제대로된 값이 아니라 사이드 이펙트를 발생할 여지가 있는것 같아.
어떻게 생각해?

사용자님의 추론이 정확합니다. lastReplyAt.getTime()과 같은 에러가 발생하는 근본적인 이유는 "데이터 타입의 불일치"와 "직렬화/역직렬화(Serialization/Deserialization) 과정에서의 누락" 때문입니다.
구체적으로 왜 이런 현상이 발생하는지, 그리고 사용자님이 말씀하신 옵셔널 체이닝과 사이드 이펙트 측면에서 분석해 보겠습니다.
1. getTime() 에러가 발생하는 근본 원인: JSON의 한계
네트워크 통신(API, Socket) 시 데이터는 JSON 형식으로 오고 갑니다. JSON 표준에는 Date 타입이 없기 때문에 모든 날짜 데이터는 문자열(ISO String)로 변환되어 전달됩니다.
서버: lastReplyAt은 MongoDB나 JS 메모리 상에서 Date 객체임.
전송: JSON으로 변환되면서 "2026-02-05T..." 문자열이 됨.
클라이언트: 이를 그대로 받으면 typeof message.lastReplyAt은 'string'이 됩니다.
string 타입에는 .getTime() 함수가 없기 때문에 호출하는 순간 앱이 크래시(White Screen)가 나는 것입니다.
2. "객체일 수 있고, 제대로 된 값이 아닐 수 있다"는 지적에 대하여
사용자님 말씀대로 lastReplyAt이 항상 유효한 Date 객체라고 가정하는 것은 위험합니다.
객체가 아님: 문자열로 넘어온 데이터를 new Date()로 변환하는 과정을 깜빡하면(예: useMessageSync.ts에서 수정 전 상태), 함수가 없는 타입에 함수를 호출하게 됩니다.
값의 부재: 답글이 없는 메시지는 lastReplyAt이 null이나 undefined일 수 있습니다. 이때 null.getTime()을 호출하면 에러가 납니다.
잘못된 값: 서버에서 실수로 0이나 빈 문자열을 보내면 new Date("")는 Invalid Date 객체를 반환하고, 여기에 .getTime()을 하면 NaN이 반환되어 비교 로직(NaN === NaN은 false)에서 예상치 못한 사이드 이펙트를 만듭니다.
3. 옵셔널 체이닝(?.)의 역할과 한계
옵셔널 체이닝은 null이나 undefined인 경우 에러를 막아주지만, 데이터 타입이 틀린 경우(문자열인데 함수 호출)는 막아주지 못합니다.
// 1. null/undefined 방어 (OK)message.lastReplyAt?.getTime(); // 2. 문자열인데 함수 호출 (Error!)// lastReplyAt이 "2026..." 문자열이라면 ?. 문법을 써도 // "문자열에 getTime이라는 함수가 없다"는 런타임 에러 발생
4. 사이드 이펙트의 발생 경로
사용자님이 우려하시는 사이드 이펙트는 주로 memo와 같은 최적화 로직에서 발생합니다.
utils.ts
Lines 12-15
// ChatMessageItem.tsx의 실제 로직 예시(prevProps.message.lastReplyAt === nextProps.message.lastReplyAt || (  !!(prevProps.message.lastReplyAt && nextProps.message.lastReplyAt) &&  new Date(prevProps.message.lastReplyAt).getTime() === new Date(nextProps.message.lastReplyAt).getTime()))
위 코드에서 new Date()를 매번 호출하는 방식은 안전해 보이지만, 만약 한쪽은 Date 객체고 한쪽은 string이라면 단순 비교(===)는 항상 false가 되어 불필요한 리렌더링이 발생합니다.
최악의 경우, 리렌더링 과정에서 다시 에러가 발생하는 무한 루프에 빠질 수도 있습니다.
요약 및 제언
사용자님의 생각처럼 타입에 대한 불신을 가지고 코드를 작성하는 것이 맞습니다.
명시적 변환: 서버 데이터를 받는 즉시 formatServerMessage 유틸리티 등을 통해 string을 Date 객체로 미리 변환해야 합니다. (useMessageSync.ts에서 수정하신 방향)
방어적 코드: lastReplyAt을 다룰 때는 항상 new Date(value).getTime() 처럼 타입이 무엇이든 숫자로 변환하여 비교하거나, isNaN() 체크를 하는 것이 가장 안전합니다.
UI/Logic 분리: UI 컴포넌트(ChatMessageItem) 안에서 이런 복잡한 변환 로직이 돌아가는 것 자체가 버그의 온상이 되므로, 데이터가 컴포넌트에 도달하기 전에 완벽하게 정제(Sanitize)되어야 합니다.
결론적으로, 모바일에서 발생한 화이트 스크린은 "문자열에 .getTime()을 시도해서 발생한 크래시"였을 확률이 99%이며, 이는 데이터 정제 로직이 특정 경로(Sync API 등)에서 누락되었기 때문으로 보입니다.


아주 좋아. 그러면 현 프로젝트의 client 에서 명시적 변환, 방어적 코드, UI/Logic 분리가 필요한 부분을 찾고 어떻게 적용할지 TODOLIST를 작성해봐

현재 프로젝트의 소스코드를 분석한 결과를 바탕으로, 명시적 변환, 방어적 코드, UI/Logic 분리를 위한 구체적인 TODOLIST를 제안합니다.
📋 개선을 위한 TODOLIST
1. 데이터 정제(Sanitization) 로직 강화 (Logic)
[ ] chatUtils.ts의 formatServerMessage 확장:
현재 timestamp, lastReplyAt만 처리 중이나, threadSequenceNumber 등 숫자형 데이터의 NaN 방지 로직 추가.
null이나 undefined가 들어왔을 때 기본값(예: new Date(0))을 반환할지, undefined를 유지할지 명확한 정책 수립.
[ ] 신규 도메인 포맷터 생성:
VideoMeetingStore.ts의 ScheduledMeeting 데이터를 위한 formatMeetingData 유틸리티 생성.
useNotificationApp.ts의 알림 데이터를 위한 formatNotificationData 유틸리티 생성.
2. UI와 비즈니스 로직의 명확한 분리 (UI/Logic)
[ ] ChatMessageItem.tsx의 memo 비교 로직 추출:
chatUtils.ts에 areMessagesEqual(prev, next) 함수를 만들어 복잡한 비교 연산(특히 Date 비교)을 컴포넌트 외부로 이동.
[ ] 날짜 비교 전용 유틸리티 도입:
core/utils/messageUtils.ts에 getSafeTime(date) 함수를 만들어 string | Date | undefined 등 어떤 값이 들어와도 안전하게 숫자를 반환하도록 통일.
3. 방어적 코드 및 사이드 이펙트 방지 (Robustness)
[ ] 전체 .getTime() 호출부 전수 조사:
VideoMeetingStore.ts, useChatRoom.ts 등에서 (data as any).getTime()과 같이 위험하게 호출되는 부분을 getSafeTime()으로 교체.
[ ] 옵셔널 체이닝 및 기본값 할당 적용:
message.fileData?.thumbnail 처럼 중첩된 객체 접근 시 ?? (Nullish Coalescing)를 사용하여 의도치 않은 흰 화면 방지.
[ ] API 호출 결과의 즉각적 정제:
ApiService.ts의 인터셉터나 각 api 객체 호출 직후에 데이터를 정제하여, 스토어나 상태(State)에는 항상 "정제된 객체"만 들어가도록 강제.
🛠 구체적인 적용 예시 (가이드라인)
예시 1: 안전한 시간 변환 유틸리티 (core/utils/messageUtils.ts)
/** * 어떤 형식이든 안전하게 timestamp 숫자를 반환합니다. * 에러 발생 시 0을 반환하여 앱 크래시를 방지합니다. */export const getSafeTime = (date: Date | string | number | undefined | null): number => {  if (!date) return 0;  const d = new Date(date);  return isNaN(d.getTime()) ? 0 : d.getTime();};
예시 2: UI 컴포넌트 리팩토링 (ChatMessageItem.tsx)
// AS-IS: 컴포넌트 파일 안에 복잡한 로직이 섞여 있음export const ChatMessageItem = memo(ChatMessageItemComponent, (prev, next) => {  return prev.message._id === next.message._id &&          new Date(prev.message.lastReplyAt).getTime() === new Date(next.message.lastReplyAt).getTime();});// TO-BE: 유틸리티로 분리하여 가독성과 안정성 확보import { areMessagesEqual } from '../utils/chatUtils';export const ChatMessageItem = memo(ChatMessageItemComponent, areMessagesEqual);
예시 3: 스토어 데이터 정제 (VideoMeetingStore.ts)

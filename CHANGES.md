# 수정 내역 (색인/리다이렉트 문제 해결)

## 1. vercel.json
- 기존: 모든 페이지 요청(`/(.*)`)이 정적 index.html로 바로 rewrite되어 SSR 메타태그 주입 로직이 실행되지 않았음
- 수정: 페이지 요청을 `/api/index?page=$1`로 라우팅하여 server.ts의 injectSeoMetadata가 실제로 실행되도록 변경
- 정적 자산(/assets, favicon.svg, robots.txt)은 그대로 정적 서빙되도록 별도 rewrite 유지
- functions.api/index.ts에 includeFiles: "dist/**" 추가 (서버리스 함수가 dist/index.html을 읽을 수 있도록)

## 2. server.ts
- Path Normalization 미들웨어: 실제 /api/* 호출(path=)과 일반 페이지 라우트(page=)를 구분하도록 분리
  (기존엔 동일한 "path" 파라미터를 함께 썼다면 충돌 가능성이 있어 명확히 분리)
- SSR 메타 주입 catch-all 라우트(app.get("*"))를 감싸던 `!process.env.VERCEL` 조건 제거
  → Vercel 서버리스 환경에서도 실제로 동작하도록 수정 (기존엔 죽은 코드였음)
  → 대신 dev-server.ts(로컬 vite 개발 서버)와 충돌하지 않도록 NODE_ENV === "production" 조건으로 감쌈
- 캐노니컬 도메인 308 리다이렉트에서 req.originalUrl 대신 정규화된 req.url을 사용하도록 수정
  (그렇지 않으면 내부 /api/index?page=... URL이 그대로 새어나가 리다이렉트가 깨짐)
- getBlogsFromFirestore()에 body 필드 추가
- /blog/ SEO 메타데이터 생성 시, /term/ 페이지처럼 크롤러가 읽을 수 있는 숨김 본문(article body)을
  HTML에 함께 주입하도록 추가 (기존엔 title/description만 있고 본문이 없었음)

## 3. src/App.tsx
- activeView, selectedTermCode, selectedCategory, searchQuery의 초기값을 무조건 "home" 등 고정값이 아니라
  window.location.pathname / search를 동기적으로 파싱해서 결정하도록 변경
  → 직접 /blog/xxx, /term/ABC 등으로 접속했을 때 Firestore 데이터 로딩 전까지 홈 화면이
    먼저 보이던 현상(또는 로딩 실패 시 계속 홈처럼 보이던 현상)을 제거

## 배포 후 확인 방법
1. Vercel에 재배포
2. curl -I https://www.whatsthatmean.com/blog/실제글슬러그 로 200 응답 확인
3. 브라우저 개발자도구로 해당 URL의 <title>, <meta name="description">가
   홈페이지와 다르게(글 제목/요약 기준으로) 나오는지 확인
4. Search Console > URL 검사 > 실시간 테스트로 크롤링 결과 재확인 후 색인 생성 요청

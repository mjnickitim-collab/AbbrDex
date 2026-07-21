# whatsThatMean - 프로젝트 개발 역사 및 코드 종합 정리 요약 (Project History & Code Summary)

이 문서는 **whatsThatMean** (https://whatsthatmean.com) 서비스의 기획 의도, 지금까지의 모든 개발 요청 사항(프롬프트), 상세 아키텍처, 개선된 주요 코드 파일 및 성능 최적화 내역을 한눈에 볼 수 있도록 정리한 종합 가이드입니다.

---

## 1. 프로젝트 개요 & 아키텍처

**whatsThatMean**은 현대의 슬랭, 단축어(Acronym), 전문 비즈니스/군사 용어, 그리고 에모지(Emoji)의 의미를 명확히 디코딩하고 일상 사용 예시를 제공하는 인터랙티브 지식 사전 플랫폼입니다.

### 🛠️ 기술 스택 (Full-Stack Setup)
*   **프론트엔드 (Client):** React 19 + TypeScript + Vite + Tailwind CSS v4 + Motion
*   **백엔드 (Server):** Node.js + Express (TypeScript, CJS Bundling via `esbuild`)
*   **데이터베이스 (Database):** Google Firebase Firestore
*   **인증 (Auth):** Firebase Authentication (Admin/User 권한 제어)
*   **AI 모델 Integration:** Google Gemini 3.5 Flash (`@google/genai` 최신 SDK)

### 📈 트래픽 및 데이터 현황
*   **등록된 슬랭 및 용어 수:** 2,257개 이상 (Firestore 실시간 동기화)
*   **블로그 포스트 및 에모지 데이터:** CMS를 통한 실시간 추가 및 SEO 맞춤화 발행 가능

---

## 2. 진행된 주요 사용자 요청 및 프롬프트 기록

지금까지 서비스 고도화를 위해 진행된 주요 프롬프트 및 처리 내역 요약입니다.

### [프롬프트 1] "사전 탐색 뷰(BrowseView)의 성능 개선 및 네비게이션 고도화"
*   **목적:** 2,257개가 넘는 엄청난 단어를 한 화면에 다 불러와 렌더링하면 브라우저 부하가 극대화되므로, **페이지네이션(Pagination)** 및 사용자 친화적 생략 표시(`...` Ellipses) UI 구현이 필요함.
*   **반영 내역:**
    *   `BrowseView.tsx`에 페이지네이션 상태 추가 및 한 페이지당 30개 항목으로 제한.
    *   사용자가 보고 있는 페이지 주변 2개 페이지만 남겨두고 나머지는 `...`로 축약 처리하는 `getPageNumbers` 알고리즘 개발.
    *   카테고리를 바꾸거나 새로 검색을 수행할 시 현재 페이지를 자동으로 `1`로 초기화하도록 최적화.

### [프롬프트 2] "어드민 패널(AdminShell) 구성 요소 레이아웃 정리"
*   **목적:** 블로그 작성 폼, 기존 게시글 목록, 사이트맵 생성기 등의 대시보드 내 정렬 순서를 개선하여 관리자가 CMS 기능을 더 편리하게 제어하도록 변경.
*   **반영 내역:**
    *   기존 발행 목록을 먼저 보여주고, 그 하단에 신규 기사 작성 및 사이트맵 전송 폼을 배치하여 화면 흐름 개선.

### [프롬프트 3] "사이트맵 저장 및 상세 용어 페이지 접속 시 FUNCTION_INVOCATION_FAILED 서버 에러 해결" (최신 개선)
*   **목적:** 사이트맵을 새로 고침하거나 특정 단어 주소(`/term/SOME_CODE`)로 들어갔을 때 가끔 인스턴스 제한시간 초과 및 서버 메모리 과다로 `FUNCTION_INVOCATION_FAILED` 에러가 발생하는 문제 해결.
*   **반영 내역:**
    *   **근본 원인 파악:** 검색 엔진 봇이나 사용자가 `/term/XYZ` 주소로 들어왔을 때, 해당 용어 한 개의 제목과 설명을 추출하기 위해 **Firestore에서 2,257개의 모든 용어 데이터를 전량 조회(getTermsFromFirestore)**하여 인메모리로 검색하는 구조가 큰 병목이었습니다.
    *   **해결 방법 1 (단일 용어 쿼리):** Firestore의 쿼리 필터(`where("code", "==", code)`)를 활용하여 정확히 요청받은 **단 하나의 문서만 읽어오도록(`getTermFromFirestoreByCode`)** 아키텍처를 전면 리팩토링했습니다. 이로써 데이터 읽기 효율이 2,257배 상승했습니다.
    *   **해결 방법 2 (사이트맵 인메모리 캐싱):** 봇이 수시로 긁어가는 `/sitemap.xml` 요청 시마다 Firestore의 데이터 전체를 새로 다운로드하지 않도록, **12시간 동안 유지되는 초고속 서버 인메모리 캐시(`getCachedSitemapXml`)**를 도입했습니다.
    *   **해결 방법 3 (DB측 불필요 정렬 제거):** 정렬이 필요 없는 사이트맵 XML 생성용 대량 데이터 수집 쿼리에서 `orderBy("code")` 옵션을 제거하여 Firestore DB 자체의 부하를 최소화했습니다.

---

## 3. 핵심 소스코드 및 최적화 내역

다음은 핵심 백엔드/프론트엔드 코드 중 가장 뛰어난 기법과 안정성이 담긴 고도화 버전입니다.

### 🖥️ 백엔드 성능 최적화: `/server.ts` (주요 변경분)

```typescript
// 1. 특정 용어 한 개만 고속으로 직접 읽어오는 경량 쿼리 설계 (메모리 보존)
async function getTermFromFirestoreByCode(code: string) {
  try {
    const termsCol = collection(firestoreDb, "terms");
    // 대문자 변환 및 양방향 공백 제거 후 정확한 단 1개의 매칭값만 limit(1) 조회
    const q = query(termsCol, where("code", "==", code.toUpperCase().trim()), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        code: data.code || "",
        full: data.full || "",
        cat: data.cat || "",
        ex: data.ex || ""
      };
    }
    return null;
  } catch (err) {
    console.error(`Error fetching single term (${code}) from Firestore:`, err);
    return null;
  }
}

// 2. 검색봇 접속 대비 사이트맵 인메모리 캐시 변수 설정
let cachedSitemapXml: string | null = null;
let lastSitemapGenTime = 0;
const SITEMAP_CACHE_DURATION = 1000 * 60 * 60 * 12; // 12시간 동안 DB 재호출 원천 방지

async function getCachedSitemapXml(forceRefresh = false): Promise<string> {
  const now = Date.now();
  // 어드민이 관리자 화면에서 "Apply Sitemap"을 직접 눌렀을 때만 forceRefresh=true로 신규 생성
  if (forceRefresh || !cachedSitemapXml || (now - lastSitemapGenTime) > SITEMAP_CACHE_DURATION) {
    console.log(`Generating sitemap.xml (Force: ${forceRefresh})...`);
    cachedSitemapXml = await buildSitemapXmlString();
    lastSitemapGenTime = now;
  }
  return cachedSitemapXml;
}

// 3. 서버 사이드 렌더링(SSR) SEO 메타 데이터 매칭부 최적화
} else if (pathname.startsWith("/term/")) {
  const code = decodeURIComponent(pathname.substring(6)).toUpperCase();
  // ★ 기존의 getTermsFromFirestore() 호출을 getTermFromFirestoreByCode(code)로 전면 교체하여 속도 극대화 ★
  const foundTerm = await getTermFromFirestoreByCode(code);
  if (foundTerm) {
    const categoryName = foundTerm.cat ? (foundTerm.cat.charAt(0).toUpperCase() + foundTerm.cat.slice(1)) : "Slang";
    title = `${foundTerm.code} Meaning: What Does ${foundTerm.code} Mean? | whatsthatmean`;
    desc = `What does ${foundTerm.code} stand for? It means "${foundTerm.full}". Learn its definition, category (${categoryName}), and see real-world texting examples like: "${foundTerm.ex || ""}"`;
  }
}
```

### 📱 프론트엔드 최적화: `/src/components/BrowseView.tsx` (페이지네이션)

```typescript
// 1. 페이지별 30개씩 분할 계산
const ITEMS_PER_PAGE = 30;
const totalPages = Math.ceil(filteredTerms.length / ITEMS_PER_PAGE);
const paginatedTerms = filteredTerms.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);

// 2. 유동적인 Ellipses (...) 번호 구성 함수
const getPageNumbers = () => {
  const pages: (number | string)[] = [];
  const range = 2; // 현재 페이지 주변 좌우 표시 개수
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - range && i <= currentPage + range)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }
  return pages;
};

const handlePageChange = (pNum: number) => {
  setCurrentPage(pNum);
  window.scrollTo({ top: 0, behavior: "smooth" }); // 매끄러운 스크롤 탑
};
```

---

## 4. 추가 제안 가능한 고도화 및 개선점 (Future Roadmaps)

whatsThatMean 서비스의 장기적인 가치와 구글 검색 점유율을 더욱 늘리기 위한 추천 개선 방안입니다.

1.  **용어 사전 페이지 클라이언트 캐싱 (Service Worker / Redis):**
    자주 변경되지 않는 2,250개 이상의 용어 상세 페이지에 대해 서버 측에 Redis나 CDN 캐싱 레이어(Cloudflare, Vercel Edge Cache)를 결합하면 로딩 타임이 "0ms"에 수렴하게 되며, DB 비용이 실질적으로 0원에 가까워집니다.
2.  **구글 검색 노출용 Structured Data (JSON-LD) 삽입:**
    용어 디테일 메타 데이터를 주입할 때 구글 검색 로봇이 사전 형식으로 바로 이해할 수 있도록 JSON-LD 형식을 `<head>`에 넣어주면 구글 통합 검색의 '사전 검색 결과 상위 스니펫'에 즉시 등재될 수 있습니다. (예: `Definition`, `Example` 스키마 적용).
3.  **인공지능 실시간 자동 용어 해설 (AI Context Extension):**
    사용자가 모르는 단어를 사전에서 클릭하면, 사전에 등재된 정적 텍스트 외에도 Gemini 3.5 Flash가 실시간으로 웹의 최신 밈 사용 빈도나 인스타그램/X(트위터) 트렌드를 요약하여 "실시간 트렌드 분석 리포트" 탭을 즉석에서 제공할 수 있습니다.

---

### 📝 파일 보관 안내
본 문서인 `PROJECT_HISTORY_AND_CODE_SUMMARY.md`는 프로젝트 루트 경로에 물리적으로 저장되었습니다. 코드를 내보내거나 보관하실 때 이 파일을 함께 참조하시면 전체 기능 역사를 완벽히 파악할 수 있습니다.

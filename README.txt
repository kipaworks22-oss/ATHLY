ATHLY – KBO 연동 베타 (프론트엔드 + 서버리스 백엔드)

파일
- index.html : SPA 엔트리 (GitHub Pages에서 동작)
- App.js     : 선수 검색/연결 + 기록 기능
- config.js  : 백엔드 주소 설정 (비어있으면 데모 모드)
- worker/worker.js : Cloudflare Workers 예시 (/kbo/search, /kbo/sync)

사용법
1) GitHub Pages 배포
   - 새 저장소 생성 → index.html, App.js, config.js 업로드
   - Settings > Pages > Branch: main / root → Save
   - https://YOURID.github.io/athly-kbo 로 접속

2) Cloudflare Worker 배포
   - npm i -g wrangler
   - wrangler init athly-kbo-worker --yes
   - 생성된 프로젝트의 소스에 worker/worker.js 내용 반영
   - wrangler deploy 후 발급된 https://YOURSUB.workers.dev 메모

3) 프론트-백엔드 연결
   - config.js 의 BACKEND_BASE 값을 workers 주소로 변경
     예) export const BACKEND_BASE = "https://YOURSUB.workers.dev";

주의
- 현재 worker.js는 데모 응답입니다. 실제 KBO 파싱/데이터 피드는 약관 준수 하에 직접 구현/제휴가 필요합니다.

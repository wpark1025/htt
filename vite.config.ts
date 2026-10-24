import { defineConfig } from 'vite';

// 상대 경로 base: GitHub Pages 하위 경로, 커스텀 도메인, 로컬 파일 열기 모두에서 동작
export default defineConfig({
  base: './',
});

import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <main class="home">
    <h1>HTT 타자연습</h1>
    <p>한글 · English · 수준 조절 가능</p>
    <p class="muted">준비 중입니다. 첫 단계: 두벌식 자리 연습.</p>
  </main>
`;

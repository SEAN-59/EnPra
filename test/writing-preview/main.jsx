import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  WritingBoardClient,
  WritingPracticeClient,
  WritingSessionClient,
  WritingNotebookClient,
} from '@/components/writing-client';
import { WritingHeader } from '@/components/writing-header';
import { WritingSubnav } from '@/components/writing-subnav';
import '@/app/globals.css';

const path = location.pathname;
const session = /^\/writing\/session\/(\d+)$/.exec(path);
const notebook = path === '/writing/notebook';
const practice = path === '/writing/practice';
const content = session ? (
  <WritingSessionClient sessionId={Number(session[1])} />
) : notebook ? (
  <WritingNotebookClient />
) : practice ? (
  <WritingPracticeClient />
) : (
  <WritingBoardClient />
);
createRoot(document.getElementById('root')).render(
  <main className="min-h-screen bg-[#f7f4ed] px-5 py-6 text-[#222] sm:px-8">
    <div className="mx-auto max-w-4xl">
      <aside className="mb-6 rounded-xl bg-[#fff0e9] p-4 text-sm leading-6">
        <p className="font-semibold">
          실제 AI · 최신 라이팅 코드 · 운영 기록과 분리된 로컬 테스트
        </p>
        {location.port === '4179' && (
          <p>
            첫 채점 자동 정리 검수용 · 5.0 기본반 · 예시 답안 기록이 포함돼
            있어요.{' '}
            <a
              className="underline"
              href="http://127.0.0.1:4178/writing/notebook"
            >
              이전 테스트 기록 보기
            </a>
          </p>
        )}
        <p>
          테스트 기록은 종료 시 사라져요. 연결은 시작 후 60분 유지돼요. 실제
          로그인 검증은 포함하지 않아요.
        </p>
        <p>
          문제 생성·첨삭은 잠시 걸릴 수 있어요. 평가는 공식 IELTS Band가 아닌
          학습 단계별 수행 결과예요.
        </p>
        <nav className="mt-2 flex gap-6">
          <a className="underline" href="http://127.0.0.1:4177/voca">
            보카 미리보기
          </a>
          <a className="underline" href="/writing">
            라이팅 보드
          </a>
        </nav>
      </aside>
      {!session && (
        <>
          <WritingHeader />
          <div className="mt-8">
            <WritingSubnav
              activeItem={
                notebook ? 'NOTEBOOK' : practice ? 'PRACTICE' : 'BOARD'
              }
            />
          </div>
        </>
      )}
      {content}
    </div>
  </main>,
);

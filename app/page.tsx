import { BookOpen, CheckCircle2, PenLine, Sparkles } from 'lucide-react';

import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from '@/app/chatgpt-auth';
import { PracticeDashboard } from '@/app/practice-dashboard';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getChatGPTUser();

  if (user) {
    return <PracticeDashboard displayName={user.displayName} signOutHref={chatGPTSignOutPath('/')} />;
  }

  const signInHref = chatGPTSignInPath('/');

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-[#1d2935]">
      <header className="border-b border-[#ded7ca] px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#1d2935] text-[#f7f4ed]"><BookOpen className="size-5" aria-hidden="true" /></span>
            <span><span className="block font-serif text-xl leading-none tracking-tight">EnPra</span><span className="mt-1 block text-[10px] font-semibold tracking-[0.18em] text-[#727a76] uppercase">English practice</span></span>
          </div>
          <a href={signInHref} className="ml-auto inline-flex shrink-0 whitespace-nowrap text-sm font-semibold text-[#44514e] hover:text-[#1d2935]">ChatGPT로 로그인</a>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-18 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-28">
        <div>
          <p className="text-sm font-semibold tracking-wide text-[#d76a47]">TODAY&apos;S ENGLISH, YOUR WORDS</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.04] tracking-tight sm:text-6xl">영어를,<br />매일 한 문장씩.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#5e6965]">EnPra는 짧게 쓰고, 차분하게 돌아보며 영어를 내 것으로 만드는 개인 연습 공간입니다.</p>
          <div className="mt-9 flex flex-col items-end gap-2 self-end text-right">
            <Button asChild size="lg" className="h-12 rounded-xl bg-[#1d2935] px-6 text-[#fffdf8] hover:bg-[#344451]"><a href={signInHref}>ChatGPT로 학습 시작 <Sparkles className="size-4" data-icon="inline-end" aria-hidden="true" /></a></Button>
            <span className="text-xs text-[#727a76]">별도 회원가입 없이 시작하세요.</span>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#ded7ca] bg-[#fffdf8] p-6 shadow-[0_20px_55px_rgba(35,44,43,0.08)] sm:p-8">
          <p className="text-sm font-semibold text-[#d76a47]">10 minutes a day</p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight">오늘의 연습 흐름</h2>
          <div className="mt-7 space-y-5">
            <div className="flex gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f0eb] text-[#38634f]"><PenLine className="size-5" aria-hidden="true" /></span><div><p className="font-semibold">짧게 작성하기</p><p className="mt-1 text-sm leading-6 text-[#68736e]">하루 한 주제로 3–5문장을 영어로 써 보세요.</p></div></div>
            <div className="flex gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f8eadf] text-[#c86442]"><Sparkles className="size-5" aria-hidden="true" /></span><div><p className="font-semibold">피드백 받기</p><p className="mt-1 text-sm leading-6 text-[#68736e]">문법과 표현을 이해하기 쉬운 방식으로 확인합니다.</p></div></div>
            <div className="flex gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7efe9] text-[#38634f]"><CheckCircle2 className="size-5" aria-hidden="true" /></span><div><p className="font-semibold">나만의 기록 만들기</p><p className="mt-1 text-sm leading-6 text-[#68736e]">로그인한 계정에 연습 흐름을 안전하게 이어갑니다.</p></div></div>
          </div>
        </div>
      </section>
    </main>
  );
}

export type UiCopyScreenSeed = {
  screenKey: string;
  displayName: string;
  routePath: string | null;
  sortOrder: number;
};

export type UiCopyEntrySeed = {
  screenKey: string;
  variableName: string;
  sourceText: string;
  draftText: string;
  description: string;
  textFormat: 'plain' | 'multiline';
};

export const UI_COPY_SCREENS: UiCopyScreenSeed[] = [
  {
    "screenKey": "home.landing",
    "displayName": "홈 · 로그인 전",
    "routePath": "/",
    "sortOrder": 10
  },
  {
    "screenKey": "home.dashboard",
    "displayName": "홈 · 학습 대시보드",
    "routePath": "/",
    "sortOrder": 11
  },
  {
    "screenKey": "common.shell",
    "displayName": "공통 · 앱 레이아웃",
    "routePath": null,
    "sortOrder": 20
  },
  {
    "screenKey": "connect",
    "displayName": "ChatGPT 연결",
    "routePath": "/connect",
    "sortOrder": 30
  },
  {
    "screenKey": "mypage",
    "displayName": "마이페이지",
    "routePath": "/mypage",
    "sortOrder": 40
  },
  {
    "screenKey": "voca.board",
    "displayName": "VOCA · 보드",
    "routePath": "/voca",
    "sortOrder": 100
  },
  {
    "screenKey": "voca.list",
    "displayName": "VOCA · 목록",
    "routePath": "/voca/list",
    "sortOrder": 110
  },
  {
    "screenKey": "writing.common",
    "displayName": "WRITING · 공통",
    "routePath": "/writing",
    "sortOrder": 200
  },
  {
    "screenKey": "writing.board",
    "displayName": "WRITING · 보드",
    "routePath": "/writing",
    "sortOrder": 210
  },
  {
    "screenKey": "writing.practice",
    "displayName": "WRITING · 학습과 테스트",
    "routePath": "/writing/practice",
    "sortOrder": 220
  },
  {
    "screenKey": "writing.placement",
    "displayName": "WRITING · 레벨 테스트",
    "routePath": "/writing/placement",
    "sortOrder": 230
  },
  {
    "screenKey": "writing.session",
    "displayName": "WRITING · 문제 풀이",
    "routePath": "/writing/session/:id",
    "sortOrder": 240
  },
  {
    "screenKey": "writing.notebook",
    "displayName": "WRITING · 오답노트",
    "routePath": "/writing/notebook",
    "sortOrder": 250
  },
  {
    "screenKey": "writing.ui",
    "displayName": "WRITING · 공통 학습 UI",
    "routePath": "/writing",
    "sortOrder": 260
  },
  {
    "screenKey": "speaking.common",
    "displayName": "SPEAKING · 공통",
    "routePath": "/speaking",
    "sortOrder": 290
  },
  {
    "screenKey": "speaking.board",
    "displayName": "SPEAKING · 보드",
    "routePath": "/speaking",
    "sortOrder": 300
  },
  {
    "screenKey": "speaking.practice",
    "displayName": "SPEAKING · 학습과 테스트",
    "routePath": "/speaking/practice",
    "sortOrder": 310
  },
  {
    "screenKey": "speaking.notebook",
    "displayName": "SPEAKING · 오답노트",
    "routePath": "/speaking/notebook",
    "sortOrder": 320
  },
  {
    "screenKey": "speaking.part1",
    "displayName": "SPEAKING · Part 1",
    "routePath": "/speaking/part1",
    "sortOrder": 330
  },
  {
    "screenKey": "speaking.part2",
    "displayName": "SPEAKING · Part 2",
    "routePath": "/speaking/part2",
    "sortOrder": 340
  },
  {
    "screenKey": "speaking.part3",
    "displayName": "SPEAKING · Part 3",
    "routePath": "/speaking/part3",
    "sortOrder": 350
  },
  {
    "screenKey": "admin",
    "displayName": "MANAGE · 서비스 관리",
    "routePath": "/admin",
    "sortOrder": 9000
  },
  {
    "screenKey": "manage.copy",
    "displayName": "MANAGE · 문구 관리",
    "routePath": "/admin",
    "sortOrder": 9010
  }
];

export const UI_COPY_ENTRIES: UiCopyEntrySeed[] = [
  {
    "screenKey": "admin",
    "variableName": "copy_001",
    "sourceText": "ADMIN",
    "draftText": "ADMIN",
    "description": "app/admin/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "admin",
    "variableName": "copy_002",
    "sourceText": "MANAGE",
    "draftText": "MANAGE",
    "description": "app/admin/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "admin",
    "variableName": "description",
    "sourceText": "고정 문구의 초안, 발행본, 되돌리기 이력을 관리합니다.",
    "draftText": "고정 문구의 초안, 발행본, 되돌리기 이력을 관리합니다.",
    "description": "app/admin/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "admin",
    "variableName": "title",
    "sourceText": "서비스 관리.",
    "draftText": "서비스 관리.",
    "description": "app/admin/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_001",
    "sourceText": "Account",
    "draftText": "Account",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_002",
    "sourceText": "ADMIN",
    "draftText": "ADMIN",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_003",
    "sourceText": "English practice",
    "draftText": "English practice",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_004",
    "sourceText": "EnPra",
    "draftText": "EnPra",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_005",
    "sourceText": "HOME",
    "draftText": "HOME",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_006",
    "sourceText": "LISTENING",
    "draftText": "LISTENING",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_007",
    "sourceText": "MANAGE",
    "draftText": "MANAGE",
    "description": "components/admin-navigation-link.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_008",
    "sourceText": "Practice",
    "draftText": "Practice",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_009",
    "sourceText": "READING",
    "draftText": "READING",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_010",
    "sourceText": "SPEAKING",
    "draftText": "SPEAKING",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_011",
    "sourceText": "VOCA",
    "draftText": "VOCA",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_012",
    "sourceText": "WRITING",
    "draftText": "WRITING",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_013",
    "sourceText": "계정 메뉴",
    "draftText": "계정 메뉴",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_014",
    "sourceText": "계정 메뉴 닫기",
    "draftText": "계정 메뉴 닫기",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_015",
    "sourceText": "로그아웃",
    "draftText": "로그아웃",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_016",
    "sourceText": "마이페이지",
    "draftText": "마이페이지",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_017",
    "sourceText": "프로필 메뉴 열기",
    "draftText": "프로필 메뉴 열기",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_018",
    "sourceText": "학습 메뉴",
    "draftText": "학습 메뉴",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_019",
    "sourceText": "학습 메뉴 닫기",
    "draftText": "학습 메뉴 닫기",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "common.shell",
    "variableName": "copy_020",
    "sourceText": "학습 메뉴 열기",
    "draftText": "학습 메뉴 열기",
    "description": "components/app-shell.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_001",
    "sourceText": "\"take part in\"의 뜻과 자연스러운 예문을 알려줘.",
    "draftText": "\"take part in\"의 뜻과 자연스러운 예문을 알려줘.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_002",
    "sourceText": "1. 아래 주소를 열고 ChatGPT에 로그인하세요.",
    "draftText": "1. 아래 주소를 열고 ChatGPT에 로그인하세요.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_003",
    "sourceText": "2. 이 코드를 입력하세요.",
    "draftText": "2. 이 코드를 입력하세요.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_004",
    "sourceText": "AI connection",
    "draftText": "AI connection",
    "description": "components/ai-connection-status.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_005",
    "sourceText": "AI CONNECTION",
    "draftText": "AI CONNECTION",
    "description": "components/ai-connection-status.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_006",
    "sourceText": "AI 사용 OAuth",
    "draftText": "AI 사용 OAuth",
    "description": "components/ai-connection-status.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_007",
    "sourceText": "AI 응답 테스트",
    "draftText": "AI 응답 테스트",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_008",
    "sourceText": "AI 응답을 받지 못했습니다.",
    "draftText": "AI 응답을 받지 못했습니다.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_009",
    "sourceText": "AI 응답을 받지 못했어요.",
    "draftText": "AI 응답을 받지 못했어요.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_010",
    "sourceText": "ChatGPT 연결",
    "draftText": "ChatGPT 연결",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_011",
    "sourceText": "ChatGPT 연결을 시작하지 못했어요.",
    "draftText": "ChatGPT 연결을 시작하지 못했어요.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_012",
    "sourceText": "ChatGPT 연결을 시작할 수 없습니다.",
    "draftText": "ChatGPT 연결을 시작할 수 없습니다.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_013",
    "sourceText": "ChatGPT 연결을 해제했어요.",
    "draftText": "ChatGPT 연결을 해제했어요.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_014",
    "sourceText": "ChatGPT 연결하기",
    "draftText": "ChatGPT 연결하기",
    "description": "components/ai-connection-status.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_015",
    "sourceText": "Content-Type",
    "draftText": "Content-Type",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_016",
    "sourceText": "EnPra로 돌아가기",
    "draftText": "EnPra로 돌아가기",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_017",
    "sourceText": "POST",
    "draftText": "POST",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_018",
    "sourceText": "내 ChatGPT 계정 연결을 관리합니다.",
    "draftText": "내 ChatGPT 계정 연결을 관리합니다.",
    "description": "components/ai-connection-status.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_019",
    "sourceText": "다시 시도해 주세요.",
    "draftText": "다시 시도해 주세요.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_020",
    "sourceText": "로그인 완료를 확인하고 있습니다.",
    "draftText": "로그인 완료를 확인하고 있습니다.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_021",
    "sourceText": "로그인 확인 중",
    "draftText": "로그인 확인 중",
    "description": "components/ai-connection-status.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_022",
    "sourceText": "상태 확인 중",
    "draftText": "상태 확인 중",
    "description": "components/ai-connection-status.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_023",
    "sourceText": "연결 관리",
    "draftText": "연결 관리",
    "description": "components/ai-connection-status.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_024",
    "sourceText": "연결 상태를 확인하고 있습니다.",
    "draftText": "연결 상태를 확인하고 있습니다.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_025",
    "sourceText": "연결 상태를 확인할 수 없습니다.",
    "draftText": "연결 상태를 확인할 수 없습니다.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_026",
    "sourceText": "연결 상태를 확인할 수 없어요.",
    "draftText": "연결 상태를 확인할 수 없어요.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_027",
    "sourceText": "연결 필요",
    "draftText": "연결 필요",
    "description": "components/ai-connection-status.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_028",
    "sourceText": "연결된 내 Codex 계정으로 실제 학습 요청을 한 번 보냅니다.",
    "draftText": "연결된 내 Codex 계정으로 실제 학습 요청을 한 번 보냅니다.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_029",
    "sourceText": "연결됨",
    "draftText": "연결됨",
    "description": "components/ai-connection-status.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_030",
    "sourceText": "연결을 해제하지 못했어요.",
    "draftText": "연결을 해제하지 못했어요.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_031",
    "sourceText": "연결을 해제할 수 없습니다.",
    "draftText": "연결을 해제할 수 없습니다.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_032",
    "sourceText": "연결하면 내 ChatGPT 계정으로 AI 피드백을 사용할 수 있습니다.",
    "draftText": "연결하면 내 ChatGPT 계정으로 AI 피드백을 사용할 수 있습니다.",
    "description": "components/ai-connection-status.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_033",
    "sourceText": "연결한 ChatGPT 계정으로 EnPra의 AI 학습 기능을 사용할 수 있습니다.",
    "draftText": "연결한 ChatGPT 계정으로 EnPra의 AI 학습 기능을 사용할 수 있습니다.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_034",
    "sourceText": "이제 AI가 단어 생성과 학습 피드백에 사용됩니다.",
    "draftText": "이제 AI가 단어 생성과 학습 피드백에 사용됩니다.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "connect",
    "variableName": "copy_035",
    "sourceText": "잠시 후 다시 시도해 주세요.",
    "draftText": "잠시 후 다시 시도해 주세요.",
    "description": "components/ai-connection-manager.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.dashboard",
    "variableName": "copy_001",
    "sourceText": "ACCOUNT",
    "draftText": "ACCOUNT",
    "description": "app/practice-dashboard.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.dashboard",
    "variableName": "copy_002",
    "sourceText": "AI 피드백 연결 기능을 준비 중입니다.",
    "draftText": "AI 피드백 연결 기능을 준비 중입니다.",
    "description": "app/practice-dashboard.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.dashboard",
    "variableName": "copy_003",
    "sourceText": "EnPra 베타 서비스를 준비하고 있어요.",
    "draftText": "EnPra 베타 서비스를 준비하고 있어요.",
    "description": "app/practice-dashboard.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.dashboard",
    "variableName": "copy_004",
    "sourceText": "EnPra의 새로운 소식과 내 활동을 한곳에서 확인하세요.",
    "draftText": "EnPra의 새로운 소식과 내 활동을 한곳에서 확인하세요.",
    "description": "app/practice-dashboard.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.dashboard",
    "variableName": "copy_005",
    "sourceText": "HOME",
    "draftText": "HOME",
    "description": "app/practice-dashboard.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.dashboard",
    "variableName": "copy_006",
    "sourceText": "MY ACTIVITY",
    "draftText": "MY ACTIVITY",
    "description": "app/practice-dashboard.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.dashboard",
    "variableName": "copy_007",
    "sourceText": "NEW",
    "draftText": "NEW",
    "description": "app/practice-dashboard.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.dashboard",
    "variableName": "copy_008",
    "sourceText": "각 학습 영역과 개인 기록 기능은 순서대로 열릴 예정입니다.",
    "draftText": "각 학습 영역과 개인 기록 기능은 순서대로 열릴 예정입니다.",
    "description": "app/practice-dashboard.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.dashboard",
    "variableName": "copy_009",
    "sourceText": "계정별 AI 연결 상태는 프로필 메뉴에서 확인할 수 있습니다.",
    "draftText": "계정별 AI 연결 상태는 프로필 메뉴에서 확인할 수 있습니다.",
    "description": "app/practice-dashboard.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.dashboard",
    "variableName": "copy_010",
    "sourceText": "나의 대시보드",
    "draftText": "나의 대시보드",
    "description": "app/practice-dashboard.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.dashboard",
    "variableName": "copy_011",
    "sourceText": "마이페이지 ↗",
    "draftText": "마이페이지 ↗",
    "description": "app/practice-dashboard.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.dashboard",
    "variableName": "copy_012",
    "sourceText": "서비스 공지",
    "draftText": "서비스 공지",
    "description": "app/practice-dashboard.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.dashboard",
    "variableName": "copy_013",
    "sourceText": "아직 기록이 없습니다.",
    "draftText": "아직 기록이 없습니다.",
    "description": "app/practice-dashboard.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.dashboard",
    "variableName": "copy_014",
    "sourceText": "학습을 시작하면 내 활동이 이곳에 표시됩니다.",
    "draftText": "학습을 시작하면 내 활동이 이곳에 표시됩니다.",
    "description": "app/practice-dashboard.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.landing",
    "variableName": "copy_001",
    "sourceText": "ChatGPT로 로그인",
    "draftText": "ChatGPT로 로그인",
    "description": "app/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.landing",
    "variableName": "copy_002",
    "sourceText": "ChatGPT로 학습 시작",
    "draftText": "ChatGPT로 학습 시작",
    "description": "app/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.landing",
    "variableName": "copy_003",
    "sourceText": "English practice",
    "draftText": "English practice",
    "description": "app/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.landing",
    "variableName": "copy_004",
    "sourceText": "EnPra",
    "draftText": "EnPra",
    "description": "app/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.landing",
    "variableName": "description",
    "sourceText": "EnPra는 짧게 쓰고, 차분하게 돌아보며 영어를 내 것으로 만드는 개인 연습 공간입니다.",
    "draftText": "EnPra는 짧게 쓰고, 차분하게 돌아보며 영어를 내 것으로 만드는 개인 연습 공간입니다.",
    "description": "app/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.landing",
    "variableName": "copy_006",
    "sourceText": "TODAY'S ENGLISH, YOUR WORDS",
    "draftText": "TODAY'S ENGLISH, YOUR WORDS",
    "description": "app/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.landing",
    "variableName": "copy_007",
    "sourceText": "나만의 기록 만들기",
    "draftText": "나만의 기록 만들기",
    "description": "app/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.landing",
    "variableName": "copy_008",
    "sourceText": "로그인한 계정에 연습 흐름을 안전하게 이어갑니다.",
    "draftText": "로그인한 계정에 연습 흐름을 안전하게 이어갑니다.",
    "description": "app/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.landing",
    "variableName": "copy_009",
    "sourceText": "매일 한 문장씩.",
    "draftText": "매일 한 문장씩.",
    "description": "app/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.landing",
    "variableName": "copy_010",
    "sourceText": "문법과 표현을 이해하기 쉬운 방식으로 확인합니다.",
    "draftText": "문법과 표현을 이해하기 쉬운 방식으로 확인합니다.",
    "description": "app/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.landing",
    "variableName": "copy_011",
    "sourceText": "별도 회원가입 없이 시작하세요.",
    "draftText": "별도 회원가입 없이 시작하세요.",
    "description": "app/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.landing",
    "variableName": "copy_012",
    "sourceText": "영어를,",
    "draftText": "영어를,",
    "description": "app/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.landing",
    "variableName": "copy_013",
    "sourceText": "오늘의 연습 흐름",
    "draftText": "오늘의 연습 흐름",
    "description": "app/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.landing",
    "variableName": "copy_014",
    "sourceText": "짧게 작성하기",
    "draftText": "짧게 작성하기",
    "description": "app/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.landing",
    "variableName": "copy_015",
    "sourceText": "피드백 받기",
    "draftText": "피드백 받기",
    "description": "app/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "home.landing",
    "variableName": "copy_016",
    "sourceText": "하루 한 주제로 3–5문장을 영어로 써 보세요.",
    "draftText": "하루 한 주제로 3–5문장을 영어로 써 보세요.",
    "description": "app/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_001",
    "sourceText": "Content-Type",
    "draftText": "Content-Type",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_002",
    "sourceText": "DRAFTS",
    "draftText": "DRAFTS",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_003",
    "sourceText": "Enter",
    "draftText": "Enter",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_004",
    "sourceText": "POST",
    "draftText": "POST",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_005",
    "sourceText": "RELEASE HISTORY",
    "draftText": "RELEASE HISTORY",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_006",
    "sourceText": "SCREENS",
    "draftText": "SCREENS",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_007",
    "sourceText": "STATIC COPY",
    "draftText": "STATIC COPY",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_008",
    "sourceText": "경로",
    "draftText": "경로",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_009",
    "sourceText": "관리 메모",
    "draftText": "관리 메모",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_010",
    "sourceText": "글자 수",
    "draftText": "글자 수",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_011",
    "sourceText": "글자 수 제한",
    "draftText": "글자 수 제한",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_012",
    "sourceText": "글자 수 제한을 초과했어요.",
    "draftText": "글자 수 제한을 초과했어요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_013",
    "sourceText": "길이 제한 없음",
    "draftText": "길이 제한 없음",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_014",
    "sourceText": "되돌린 이유를 기록할까요? (선택)",
    "draftText": "되돌린 이유를 기록할까요? (선택)",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_015",
    "sourceText": "라이팅 학습하기",
    "draftText": "라이팅 학습하기",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_016",
    "sourceText": "문구",
    "draftText": "문구",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_017",
    "sourceText": "문구 · 관리 메모",
    "draftText": "문구 · 관리 메모",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_018",
    "sourceText": "문구 관리 정보를 불러오는 중이에요.",
    "draftText": "문구 관리 정보를 불러오는 중이에요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_019",
    "sourceText": "문구 관리 정보를 불러오지 못했습니다.",
    "draftText": "문구 관리 정보를 불러오지 못했습니다.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_020",
    "sourceText": "문구 관리 정보를 불러오지 못했어요.",
    "draftText": "문구 관리 정보를 불러오지 못했어요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_021",
    "sourceText": "문구 변경사항을 저장했어요.",
    "draftText": "문구 변경사항을 저장했어요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_022",
    "sourceText": "문구 초안",
    "draftText": "문구 초안",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "description",
    "sourceText": "문구는 소속 화면 아래에서 관리합니다.",
    "draftText": "문구는 소속 화면 아래에서 관리합니다.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_024",
    "sourceText": "문구를 저장하지 못했습니다.",
    "draftText": "문구를 저장하지 못했습니다.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_025",
    "sourceText": "문구를 저장하지 못했어요.",
    "draftText": "문구를 저장하지 못했어요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_026",
    "sourceText": "반영 상태",
    "draftText": "반영 상태",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_027",
    "sourceText": "반영됨",
    "draftText": "반영됨",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_028",
    "sourceText": "발행본 만들기",
    "draftText": "발행본 만들기",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_029",
    "sourceText": "발행본 생성 중",
    "draftText": "발행본 생성 중",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_030",
    "sourceText": "발행본 생성됨",
    "draftText": "발행본 생성됨",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_031",
    "sourceText": "발행본 이력",
    "draftText": "발행본 이력",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_032",
    "sourceText": "발행본을 만들기 전까지 서비스 화면에는 반영되지 않습니다.",
    "draftText": "발행본을 만들기 전까지 서비스 화면에는 반영되지 않습니다.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_033",
    "sourceText": "발행본을 만들면 서비스 화면에 반영됩니다.",
    "draftText": "발행본을 만들면 서비스 화면에 반영됩니다.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_034",
    "sourceText": "발행본을 만들면 화면별 문구 구성에도 반영됩니다.",
    "draftText": "발행본을 만들면 화면별 문구 구성에도 반영됩니다.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_035",
    "sourceText": "발행본을 만들지 못했습니다.",
    "draftText": "발행본을 만들지 못했습니다.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_036",
    "sourceText": "발행본을 만들지 못했어요.",
    "draftText": "발행본을 만들지 못했어요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_037",
    "sourceText": "발행할 문구가 없습니다",
    "draftText": "발행할 문구가 없습니다",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_038",
    "sourceText": "변경 저장",
    "draftText": "변경 저장",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_039",
    "sourceText": "변수명",
    "draftText": "변수명",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_040",
    "sourceText": "비활성",
    "draftText": "비활성",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_041",
    "sourceText": "사용자에게 보이는 문구를 입력하세요.",
    "draftText": "사용자에게 보이는 문구를 입력하세요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_042",
    "sourceText": "사이트 반영 완료",
    "draftText": "사이트 반영 완료",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_043",
    "sourceText": "상태",
    "draftText": "상태",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_044",
    "sourceText": "새 문구",
    "draftText": "새 문구",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_045",
    "sourceText": "새 문구 초안을 등록했어요.",
    "draftText": "새 문구 초안을 등록했어요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_046",
    "sourceText": "새 문구를 등록하지 못했습니다.",
    "draftText": "새 문구를 등록하지 못했습니다.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_047",
    "sourceText": "새 문구를 등록하지 못했어요.",
    "draftText": "새 문구를 등록하지 못했어요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_048",
    "sourceText": "새로고침한 사이트에는 최신 문구가 반영됩니다.",
    "draftText": "새로고침한 사이트에는 최신 문구가 반영됩니다.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_049",
    "sourceText": "생성 실패",
    "draftText": "생성 실패",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "title",
    "sourceText": "서비스 문구 관리",
    "draftText": "서비스 문구 관리",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_051",
    "sourceText": "선택",
    "draftText": "선택",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_052",
    "sourceText": "소속 화면",
    "draftText": "소속 화면",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_053",
    "sourceText": "소속 화면 변경사항을 저장했어요.",
    "draftText": "소속 화면 변경사항을 저장했어요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_054",
    "sourceText": "소속 화면을 등록하지 못했습니다.",
    "draftText": "소속 화면을 등록하지 못했습니다.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_055",
    "sourceText": "소속 화면을 등록하지 못했어요.",
    "draftText": "소속 화면을 등록하지 못했어요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_056",
    "sourceText": "소속 화면을 등록했어요.",
    "draftText": "소속 화면을 등록했어요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_057",
    "sourceText": "소속 화면을 선택하고 title 같은 변수명으로 문구를 등록하세요.",
    "draftText": "소속 화면을 선택하고 title 같은 변수명으로 문구를 등록하세요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_058",
    "sourceText": "소속 화면을 저장하지 못했습니다.",
    "draftText": "소속 화면을 저장하지 못했습니다.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_059",
    "sourceText": "소속 화면을 저장하지 못했어요.",
    "draftText": "소속 화면을 저장하지 못했어요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_060",
    "sourceText": "수정",
    "draftText": "수정",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_061",
    "sourceText": "수정됨",
    "draftText": "수정됨",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_062",
    "sourceText": "아직 등록된 문구가 없습니다.",
    "draftText": "아직 등록된 문구가 없습니다.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_063",
    "sourceText": "아직 등록된 소속 화면이 없습니다.",
    "draftText": "아직 등록된 소속 화면이 없습니다.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_064",
    "sourceText": "아직 만든 발행본이 없습니다.",
    "draftText": "아직 만든 발행본이 없습니다.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_065",
    "sourceText": "아직 없음",
    "draftText": "아직 없음",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_066",
    "sourceText": "언어",
    "draftText": "언어",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_067",
    "sourceText": "언어 · 길이 · 치환 변수",
    "draftText": "언어 · 길이 · 치환 변수",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_068",
    "sourceText": "을 둘 수 있어요.",
    "draftText": "을 둘 수 있어요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_069",
    "sourceText": "이 버전으로 되돌리기",
    "draftText": "이 버전으로 되돌리기",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_070",
    "sourceText": "이 화면 안에서 title 같은 변수명을 사용할 수 있습니다.",
    "draftText": "이 화면 안에서 title 같은 변수명을 사용할 수 있습니다.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_071",
    "sourceText": "이번 발행본에 남길 메모가 있나요? (선택)",
    "draftText": "이번 발행본에 남길 메모가 있나요? (선택)",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_072",
    "sourceText": "입력값을 확인해 주세요.",
    "draftText": "입력값을 확인해 주세요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_073",
    "sourceText": "잠시 후 다시 시도해 주세요.",
    "draftText": "잠시 후 다시 시도해 주세요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_074",
    "sourceText": "저장 전",
    "draftText": "저장 전",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_075",
    "sourceText": "저장 전 → 수정됨 → 반영 완료 순서로 관리돼요.",
    "draftText": "저장 전 → 수정됨 → 반영 완료 순서로 관리돼요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_076",
    "sourceText": "저장 중",
    "draftText": "저장 중",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_077",
    "sourceText": "정렬",
    "draftText": "정렬",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_078",
    "sourceText": "정렬 순서",
    "draftText": "정렬 순서",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_079",
    "sourceText": "초안 등록",
    "draftText": "초안 등록",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_080",
    "sourceText": "최근 발행본",
    "draftText": "최근 발행본",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_081",
    "sourceText": "취소",
    "draftText": "취소",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_082",
    "sourceText": "치환 변수",
    "draftText": "치환 변수",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_083",
    "sourceText": "치환 변수 (쉼표로 구분)",
    "draftText": "치환 변수 (쉼표로 구분)",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_084",
    "sourceText": "코드 연결 기준",
    "draftText": "코드 연결 기준",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_085",
    "sourceText": "표시 위치와 목적",
    "draftText": "표시 위치와 목적",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_086",
    "sourceText": "현재 상태",
    "draftText": "현재 상태",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_087",
    "sourceText": "화면 등록",
    "draftText": "화면 등록",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_088",
    "sourceText": "화면 이름",
    "draftText": "화면 이름",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_089",
    "sourceText": "화면 키",
    "draftText": "화면 키",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_090",
    "sourceText": "화면 키는 코드와 연결되는 기준값이라 수정하지 않습니다. 화면 이름·경로·정렬·활성 상태는 표 안에서 바로 변경할 수 있어요.",
    "draftText": "화면 키는 코드와 연결되는 기준값이라 수정하지 않습니다. 화면 이름·경로·정렬·활성 상태는 표 안에서 바로 변경할 수 있어요.",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_091",
    "sourceText": "활성",
    "draftText": "활성",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "copy_092",
    "sourceText": "활성 문구",
    "draftText": "활성 문구",
    "description": "components/manage-copy-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "mypage",
    "variableName": "copy_001",
    "sourceText": "MY PAGE",
    "draftText": "MY PAGE",
    "description": "app/mypage/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "mypage",
    "variableName": "copy_002",
    "sourceText": "계정과 학습 기록을 관리하는 공간입니다.",
    "draftText": "계정과 학습 기록을 관리하는 공간입니다.",
    "description": "app/mypage/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "mypage",
    "variableName": "copy_003",
    "sourceText": "학습 화면으로",
    "draftText": "학습 화면으로",
    "description": "app/mypage/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.common",
    "variableName": "eyebrow",
    "sourceText": "SPEAKING",
    "draftText": "SPEAKING",
    "description": "components/speaking-header.tsx 상단 영역명",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.common",
    "variableName": "title",
    "sourceText": "나의 Speaking 진단.",
    "draftText": "나의 Speaking 진단.",
    "description": "components/speaking-header.tsx 제목",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.common",
    "variableName": "description",
    "sourceText": "말하기 학습과 테스트 기록을 바탕으로 다음 연습을 이어가세요.",
    "draftText": "말하기 학습과 테스트 기록을 바탕으로 다음 연습을 이어가세요.",
    "description": "components/speaking-header.tsx 설명",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.common",
    "variableName": "board",
    "sourceText": "BOARD",
    "draftText": "BOARD",
    "description": "components/speaking-subnav.tsx 보드 탭",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.common",
    "variableName": "practice",
    "sourceText": "PRACTICE",
    "draftText": "PRACTICE",
    "description": "components/speaking-subnav.tsx 학습 탭",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.common",
    "variableName": "notebook",
    "sourceText": "오답노트",
    "draftText": "오답노트",
    "description": "components/speaking-subnav.tsx 오답노트 탭",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.board",
    "variableName": "eyebrow",
    "sourceText": "CURRENT SPEAKING LEVEL",
    "draftText": "CURRENT SPEAKING LEVEL",
    "description": "components/speaking-board.tsx 현재 레벨 카드 라벨",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.board",
    "variableName": "title",
    "sourceText": "시작 레벨을 설정하세요.",
    "draftText": "시작 레벨을 설정하세요.",
    "description": "components/speaking-board.tsx 시작 카드 제목",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.board",
    "variableName": "description",
    "sourceText": "현재 말하기 실력에 맞는 단계부터 연습을 시작합니다.",
    "draftText": "현재 말하기 실력에 맞는 단계부터 연습을 시작합니다.",
    "description": "components/speaking-board.tsx 시작 카드 설명",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.board",
    "variableName": "practice",
    "sourceText": "학습하기",
    "draftText": "학습하기",
    "description": "components/speaking-board.tsx 학습 이동 버튼",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.board",
    "variableName": "reinforcement",
    "sourceText": "맞춤 보강 학습",
    "draftText": "맞춤 보강 학습",
    "description": "components/speaking-board.tsx 보강 카드 제목",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.board",
    "variableName": "reinforcement_description",
    "sourceText": "진단 결과가 쌓이면 보완이 필요한 발음·표현·답변 구조를 이곳에서 안내합니다.",
    "draftText": "진단 결과가 쌓이면 보완이 필요한 발음·표현·답변 구조를 이곳에서 안내합니다.",
    "description": "components/speaking-board.tsx 보강 카드 설명",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.practice",
    "variableName": "eyebrow",
    "sourceText": "PRACTICE",
    "draftText": "PRACTICE",
    "description": "components/speaking-practice.tsx 상단 라벨",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.practice",
    "variableName": "title",
    "sourceText": "오늘의 Speaking.",
    "draftText": "오늘의 Speaking.",
    "description": "components/speaking-practice.tsx 제목",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.practice",
    "variableName": "description",
    "sourceText": "학습과 테스트 모두 실제 질문에 답하며 진행합니다.",
    "draftText": "학습과 테스트 모두 실제 질문에 답하며 진행합니다.",
    "description": "components/speaking-practice.tsx 설명",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.practice",
    "variableName": "learning",
    "sourceText": "학습하기",
    "draftText": "학습하기",
    "description": "components/speaking-practice.tsx 학습 카드 제목",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.practice",
    "variableName": "learning_description",
    "sourceText": "힌트와 피드백을 사용해 답변을 확장하는 연습입니다.",
    "draftText": "힌트와 피드백을 사용해 답변을 확장하는 연습입니다.",
    "description": "components/speaking-practice.tsx 학습 카드 설명",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.practice",
    "variableName": "test",
    "sourceText": "일반 테스트",
    "draftText": "일반 테스트",
    "description": "components/speaking-practice.tsx 테스트 카드 제목",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.practice",
    "variableName": "test_description",
    "sourceText": "힌트 없이 현재 단계의 말하기 실력을 확인합니다.",
    "draftText": "힌트 없이 현재 단계의 말하기 실력을 확인합니다.",
    "description": "components/speaking-practice.tsx 테스트 카드 설명",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.practice",
    "variableName": "part_one",
    "sourceText": "Part 1 연습 열기",
    "draftText": "Part 1 연습 열기",
    "description": "components/speaking-practice.tsx Part 1 진입 버튼",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.notebook",
    "variableName": "eyebrow",
    "sourceText": "SPEAKING NOTEBOOK",
    "draftText": "SPEAKING NOTEBOOK",
    "description": "components/speaking-notebook.tsx 상단 라벨",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.notebook",
    "variableName": "title",
    "sourceText": "말하기 오답노트",
    "draftText": "말하기 오답노트",
    "description": "components/speaking-notebook.tsx 제목",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.notebook",
    "variableName": "description",
    "sourceText": "완료한 답변의 전사문과 피드백이 이곳에 쌓입니다.",
    "draftText": "완료한 답변의 전사문과 피드백이 이곳에 쌓입니다.",
    "description": "components/speaking-notebook.tsx 설명",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.notebook",
    "variableName": "empty",
    "sourceText": "아직 완료한 Speaking 기록이 없습니다.",
    "draftText": "아직 완료한 Speaking 기록이 없습니다.",
    "description": "components/speaking-notebook.tsx 빈 상태",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_001",
    "sourceText": "5.0A · 학습하기",
    "draftText": "5.0A · 학습하기",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_002",
    "sourceText": "Answer directly, then add one short reason or example.",
    "draftText": "Answer directly, then add one short reason or example.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_003",
    "sourceText": "ASSESSMENT",
    "draftText": "ASSESSMENT",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_004",
    "sourceText": "At weekends, I usually meet my friends or exercise. It helps me reduce stress and feel ready for the next week.",
    "draftText": "At weekends, I usually meet my friends or exercise. It helps me reduce stress and feel ready for the next week.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_005",
    "sourceText": "because 뒤의 이유를 한 단계 더 설명하면 더 설득력 있는 답변이 됩니다.",
    "draftText": "because 뒤의 이유를 한 단계 더 설명하면 더 설득력 있는 답변이 됩니다.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_006",
    "sourceText": "busy 뒤에 대조를 만들 때는 but보다 while 또는 although를 쓰면 연결이 더 자연스러워집니다.",
    "draftText": "busy 뒤에 대조를 만들 때는 but보다 while 또는 although를 쓰면 연결이 더 자연스러워집니다.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_007",
    "sourceText": "GET READY",
    "draftText": "GET READY",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_008",
    "sourceText": "Has your home town changed much in recent years?",
    "draftText": "Has your home town changed much in recent years?",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_009",
    "sourceText": "HINT",
    "draftText": "HINT",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_010",
    "sourceText": "I think people enjoy living there because they can relax near the sea after work. There are also many good restaurants.",
    "draftText": "I think people enjoy living there because they can relax near the sea after work. There are also many good restaurants.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_011",
    "sourceText": "IMPROVE NEXT",
    "draftText": "IMPROVE NEXT",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_012",
    "sourceText": "Let’s move on to a new topic.",
    "draftText": "Let’s move on to a new topic.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_013",
    "sourceText": "Let’s talk about your home town. What kind of place is it?",
    "draftText": "Let’s talk about your home town. What kind of place is it?",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_014",
    "sourceText": "LOCAL RECORDING READY",
    "draftText": "LOCAL RECORDING READY",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_015",
    "sourceText": "M15.5 9.5a4 4 0 0 1 0 5",
    "draftText": "M15.5 9.5a4 4 0 0 1 0 5",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_016",
    "sourceText": "M18 7a7.5 7.5 0 0 1 0 10",
    "draftText": "M18 7a7.5 7.5 0 0 1 0 10",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_017",
    "sourceText": "M3.5 10v4h4l5 4V6l-5 4h-4Z",
    "draftText": "M3.5 10v4h4l5 4V6l-5 4h-4Z",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_018",
    "sourceText": "may move의 이유를 구체적인 직업 분야나 기회와 연결하면 어휘가 더 풍부해집니다.",
    "draftText": "may move의 이유를 구체적인 직업 분야나 기회와 연결하면 어휘가 더 풍부해집니다.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_019",
    "sourceText": "My hometown is a coastal city in Korea. It is busy, but it has many beautiful beaches and friendly people.",
    "draftText": "My hometown is a coastal city in Korea. It is busy, but it has many beautiful beaches and friendly people.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_020",
    "sourceText": "MY RECORDING",
    "draftText": "MY RECORDING",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_021",
    "sourceText": "PART 1 · INTERVIEW",
    "draftText": "PART 1 · INTERVIEW",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_022",
    "sourceText": "PART 1 COMPLETE",
    "draftText": "PART 1 COMPLETE",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_023",
    "sourceText": "Part 1 is complete.",
    "draftText": "Part 1 is complete.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_024",
    "sourceText": "PART 1 READY",
    "draftText": "PART 1 READY",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "title",
    "sourceText": "Part 1 대화 연습.",
    "draftText": "Part 1 대화 연습.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_026",
    "sourceText": "QUESTION",
    "draftText": "QUESTION",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_027",
    "sourceText": "SPEAKING",
    "draftText": "SPEAKING",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_028",
    "sourceText": "TEXT",
    "draftText": "TEXT",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_029",
    "sourceText": "TRANSCRIPT",
    "draftText": "TRANSCRIPT",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_030",
    "sourceText": "What do you usually enjoy doing at weekends?",
    "draftText": "What do you usually enjoy doing at weekends?",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_031",
    "sourceText": "Why do you think people enjoy living there?",
    "draftText": "Why do you think people enjoy living there?",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_032",
    "sourceText": "Would you like to continue living there in the future?",
    "draftText": "Would you like to continue living there in the future?",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_033",
    "sourceText": "Yes, I would like to live there because my family is there. However, I may move to another city for my career.",
    "draftText": "Yes, I would like to live there because my family is there. However, I may move to another city for my career.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_034",
    "sourceText": "Yes, it has changed a lot. More tourists visit the city now, so new hotels and public transport have been developed.",
    "draftText": "Yes, it has changed a lot. More tourists visit the city now, so new hotels and public transport have been developed.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_035",
    "sourceText": "YOUR RESPONSE",
    "draftText": "YOUR RESPONSE",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_036",
    "sourceText": "개인적 이유와 반대 가능성을 함께 제시해 균형 잡힌 답변을 만들었어요.",
    "draftText": "개인적 이유와 반대 가능성을 함께 제시해 균형 잡힌 답변을 만들었어요.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_037",
    "sourceText": "고향에 대해 이야기해 봅시다. 어떤 곳인가요?",
    "draftText": "고향에 대해 이야기해 봅시다. 어떤 곳인가요?",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_038",
    "sourceText": "관광객 증가가 주민들의 생활에 어떤 영향을 주었는지 한 문장 더 보태 보세요.",
    "draftText": "관광객 증가가 주민들의 생활에 어떤 영향을 주었는지 한 문장 더 보태 보세요.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_039",
    "sourceText": "구체적인 활동 하나를 짧게 예시로 들면 답변이 더 기억에 남습니다.",
    "draftText": "구체적인 활동 하나를 짧게 예시로 들면 답변이 더 기억에 남습니다.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_040",
    "sourceText": "내 녹음 듣기",
    "draftText": "내 녹음 듣기",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_041",
    "sourceText": "내 답변",
    "draftText": "내 답변",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_042",
    "sourceText": "녹음 시작",
    "draftText": "녹음 시작",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_043",
    "sourceText": "녹음 전에는 서버로 전송되지 않습니다.",
    "draftText": "녹음 전에는 서버로 전송되지 않습니다.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_044",
    "sourceText": "녹음 종료",
    "draftText": "녹음 종료",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_045",
    "sourceText": "다시 보기",
    "draftText": "다시 보기",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_046",
    "sourceText": "다음 질문을 준비했어요.",
    "draftText": "다음 질문을 준비했어요.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_047",
    "sourceText": "답변 구조 힌트",
    "draftText": "답변 구조 힌트",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_048",
    "sourceText": "답변 처리 중…",
    "draftText": "답변 처리 중…",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_049",
    "sourceText": "답변 확인",
    "draftText": "답변 확인",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_050",
    "sourceText": "답변 확인 닫기",
    "draftText": "답변 확인 닫기",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_051",
    "sourceText": "답변을 정리하고 있어요.",
    "draftText": "답변을 정리하고 있어요.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_052",
    "sourceText": "답변하세요.",
    "draftText": "답변하세요.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_053",
    "sourceText": "대화 시작",
    "draftText": "대화 시작",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_054",
    "sourceText": "대화 연습을 마쳤어요.",
    "draftText": "대화 연습을 마쳤어요.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_055",
    "sourceText": "대화를 시작할 준비가 됐어요.",
    "draftText": "대화를 시작할 준비가 됐어요.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_056",
    "sourceText": "보낸 답변 · 00:42",
    "draftText": "보낸 답변 · 00:42",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_057",
    "sourceText": "사람들이 그곳에서 사는 것을 좋아하는 이유는 무엇이라고 생각하나요?",
    "draftText": "사람들이 그곳에서 사는 것을 좋아하는 이유는 무엇이라고 생각하나요?",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_058",
    "sourceText": "새로 녹음하기",
    "draftText": "새로 녹음하기",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_059",
    "sourceText": "시작을 누르면 카운트다운 뒤 첫 음성 질문이 재생됩니다. 이후에는 답변을 바탕으로 질문이 이어집니다.",
    "draftText": "시작을 누르면 카운트다운 뒤 첫 음성 질문이 재생됩니다. 이후에는 답변을 바탕으로 질문이 이어집니다.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_060",
    "sourceText": "앞으로도 그곳에서 계속 살고 싶나요?",
    "draftText": "앞으로도 그곳에서 계속 살고 싶나요?",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_061",
    "sourceText": "예상 진행 4~6회 · 종료 기준 내 발화 09:30–10:30",
    "draftText": "예상 진행 4~6회 · 종료 기준 내 발화 09:30–10:30",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_062",
    "sourceText": "음성 질문",
    "draftText": "음성 질문",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_063",
    "sourceText": "음성 질문 · 완료됨",
    "draftText": "음성 질문 · 완료됨",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_064",
    "sourceText": "이 화면에서는 실제 마이크를 사용하지 않는 목업입니다.",
    "draftText": "이 화면에서는 실제 마이크를 사용하지 않는 목업입니다.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_065",
    "sourceText": "이유와 예시를 연결해 답변을 확장했어요. 답변 길이도 Part 1에 적절합니다.",
    "draftText": "이유와 예시를 연결해 답변을 확장했어요. 답변 길이도 Part 1에 적절합니다.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_066",
    "sourceText": "일상 활동과 그 효과를 간결하게 연결했습니다.",
    "draftText": "일상 활동과 그 효과를 간결하게 연결했습니다.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_067",
    "sourceText": "전송",
    "draftText": "전송",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_068",
    "sourceText": "주말에는 보통 무엇을 하며 시간을 보내는 것을 좋아하나요?",
    "draftText": "주말에는 보통 무엇을 하며 시간을 보내는 것을 좋아하나요?",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_069",
    "sourceText": "질문",
    "draftText": "질문",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_070",
    "sourceText": "질문 다시 듣기",
    "draftText": "질문 다시 듣기",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_071",
    "sourceText": "질문 텍스트 보기",
    "draftText": "질문 텍스트 보기",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_072",
    "sourceText": "질문 힌트 열기",
    "draftText": "질문 힌트 열기",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "description",
    "sourceText": "질문을 듣고, 직접 녹음한 뒤 답변 흐름과 개선점을 확인하세요.",
    "draftText": "질문을 듣고, 직접 녹음한 뒤 답변 흐름과 개선점을 확인하세요.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_074",
    "sourceText": "질문을 재생하고 있어요.",
    "draftText": "질문을 재생하고 있어요.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_075",
    "sourceText": "질문의 핵심에는 자연스럽게 답했고, 장소를 설명하는 기본 어휘도 적절했어요.",
    "draftText": "질문의 핵심에는 자연스럽게 답했고, 장소를 설명하는 기본 어휘도 적절했어요.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_076",
    "sourceText": "질문이 끝나면 녹음할 수 있습니다.",
    "draftText": "질문이 끝나면 녹음할 수 있습니다.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_077",
    "sourceText": "최근 몇 년 사이에 고향이 많이 변했나요?",
    "draftText": "최근 몇 년 사이에 고향이 많이 변했나요?",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_078",
    "sourceText": "최종 심사와 전체 피드백은 음성 처리 기능을 연결할 때 이 화면에 이어집니다.",
    "draftText": "최종 심사와 전체 피드백은 음성 처리 기능을 연결할 때 이 화면에 이어집니다.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_079",
    "sourceText": "친숙한 주제로 이어지는 음성 대화",
    "draftText": "친숙한 주제로 이어지는 음성 대화",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_080",
    "sourceText": "피드백 · 개선",
    "draftText": "피드백 · 개선",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_081",
    "sourceText": "한국어 뜻",
    "draftText": "한국어 뜻",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_082",
    "sourceText": "현재 녹음만 임시 보관되어 있어요. 새로 녹음하면 교체됩니다.",
    "draftText": "현재 녹음만 임시 보관되어 있어요. 새로 녹음하면 교체됩니다.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part1",
    "variableName": "copy_083",
    "sourceText": "현재완료와 결과 표현을 사용해 변화에 관해 명확히 답했어요.",
    "draftText": "현재완료와 결과 표현을 사용해 변화에 관해 명확히 답했어요.",
    "description": "components/speaking-part-one-prototype.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_001",
    "sourceText": "100개",
    "draftText": "100개",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_002",
    "sourceText": "184개",
    "draftText": "184개",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_003",
    "sourceText": "1회 생성량",
    "draftText": "1회 생성량",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_004",
    "sourceText": "20개",
    "draftText": "20개",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_005",
    "sourceText": "8월 25일–31일",
    "draftText": "8월 25일–31일",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_006",
    "sourceText": "AI가 한 번에 만들어 줄 단어 수입니다.",
    "draftText": "AI가 한 번에 만들어 줄 단어 수입니다.",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_007",
    "sourceText": "BOARD",
    "draftText": "BOARD",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_008",
    "sourceText": "FRI",
    "draftText": "FRI",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_009",
    "sourceText": "LAST TEST",
    "draftText": "LAST TEST",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_010",
    "sourceText": "LEARNING FLOW",
    "draftText": "LEARNING FLOW",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_011",
    "sourceText": "MEMORIZED",
    "draftText": "MEMORIZED",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_012",
    "sourceText": "MEMORY CHECK",
    "draftText": "MEMORY CHECK",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_013",
    "sourceText": "MON",
    "draftText": "MON",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_014",
    "sourceText": "SAT",
    "draftText": "SAT",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_015",
    "sourceText": "SUN",
    "draftText": "SUN",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_016",
    "sourceText": "TESTS TAKEN",
    "draftText": "TESTS TAKEN",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_017",
    "sourceText": "THU",
    "draftText": "THU",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_018",
    "sourceText": "TODAY'S BOARD",
    "draftText": "TODAY'S BOARD",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_019",
    "sourceText": "TOTAL LEARNED",
    "draftText": "TOTAL LEARNED",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_020",
    "sourceText": "TUE",
    "draftText": "TUE",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_021",
    "sourceText": "VOCA",
    "draftText": "VOCA",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_022",
    "sourceText": "VOCA SETTINGS",
    "draftText": "VOCA SETTINGS",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_023",
    "sourceText": "VOCA 학습 설정",
    "draftText": "VOCA 학습 설정",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_024",
    "sourceText": "VOCA 학습 설정 닫기",
    "draftText": "VOCA 학습 설정 닫기",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_025",
    "sourceText": "VOCA 학습 설정 열기",
    "draftText": "VOCA 학습 설정 열기",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_026",
    "sourceText": "WED",
    "draftText": "WED",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_027",
    "sourceText": "가장 최근 테스트",
    "draftText": "가장 최근 테스트",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_028",
    "sourceText": "기본값",
    "draftText": "기본값",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "title",
    "sourceText": "나만의 단어 학습.",
    "draftText": "나만의 단어 학습.",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "description",
    "sourceText": "단어를 모으고, 익히고, 테스트로 확인하세요.",
    "draftText": "단어를 모으고, 익히고, 테스트로 확인하세요.",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_031",
    "sourceText": "뜻 맞추기",
    "draftText": "뜻 맞추기",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_032",
    "sourceText": "문장 맞추기",
    "draftText": "문장 맞추기",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_033",
    "sourceText": "문제 수",
    "draftText": "문제 수",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_034",
    "sourceText": "문제 수 늘리기",
    "draftText": "문제 수 늘리기",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_035",
    "sourceText": "문제 수 줄이기",
    "draftText": "문제 수 줄이기",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_036",
    "sourceText": "미학습",
    "draftText": "미학습",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_037",
    "sourceText": "설정 적용하기",
    "draftText": "설정 적용하기",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_038",
    "sourceText": "영단어 맞추기",
    "draftText": "영단어 맞추기",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_039",
    "sourceText": "오늘 학습",
    "draftText": "오늘 학습",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_040",
    "sourceText": "오늘의 단어 20개",
    "draftText": "오늘의 단어 20개",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_041",
    "sourceText": "외운 단어",
    "draftText": "외운 단어",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_042",
    "sourceText": "이번 주 학습 현황",
    "draftText": "이번 주 학습 현황",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_043",
    "sourceText": "일일 생성량의 60%를 기본으로, 40% · 40% · 20%로 나눕니다.",
    "draftText": "일일 생성량의 60%를 기본으로, 40% · 40% · 20%로 나눕니다.",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_044",
    "sourceText": "전체 응시 테스트",
    "draftText": "전체 응시 테스트",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_045",
    "sourceText": "전체 학습 단어",
    "draftText": "전체 학습 단어",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_046",
    "sourceText": "총 학습 단어 248개 중 74%",
    "draftText": "총 학습 단어 248개 중 74%",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_047",
    "sourceText": "테스트",
    "draftText": "테스트",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_048",
    "sourceText": "테스트 문제 수",
    "draftText": "테스트 문제 수",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_049",
    "sourceText": "학습 설정",
    "draftText": "학습 설정",
    "description": "components/voca-settings.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_050",
    "sourceText": "학습 완료",
    "draftText": "학습 완료",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_051",
    "sourceText": "학습하기",
    "draftText": "학습하기",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.board",
    "variableName": "copy_052",
    "sourceText": "현재 학습 흐름에 맞춘 단어를 복습하고, 바로 테스트까지 이어갈 수 있어요.",
    "draftText": "현재 학습 흐름에 맞춘 단어를 복습하고, 바로 테스트까지 이어갈 수 있어요.",
    "description": "app/voca/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_001",
    "sourceText": "+ 뜻 추가",
    "draftText": "+ 뜻 추가",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_002",
    "sourceText": "BOARD",
    "draftText": "BOARD",
    "description": "components/study-subnav.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_003",
    "sourceText": "COMMON VOCABULARY",
    "draftText": "COMMON VOCABULARY",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_004",
    "sourceText": "Content-Type",
    "draftText": "Content-Type",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_005",
    "sourceText": "DELETE",
    "draftText": "DELETE",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_006",
    "sourceText": "Google 스프레드시트 연동으로 준비할 예정이에요.",
    "draftText": "Google 스프레드시트 연동으로 준비할 예정이에요.",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_007",
    "sourceText": "LIST",
    "draftText": "LIST",
    "description": "components/study-subnav.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_008",
    "sourceText": "MY VOCABULARY",
    "draftText": "MY VOCABULARY",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_009",
    "sourceText": "PERSONAL VOCABULARY",
    "draftText": "PERSONAL VOCABULARY",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_010",
    "sourceText": "POST",
    "draftText": "POST",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_011",
    "sourceText": "PRACTICE",
    "draftText": "PRACTICE",
    "description": "components/study-subnav.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_012",
    "sourceText": "TARGET LIST",
    "draftText": "TARGET LIST",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_013",
    "sourceText": "TEST",
    "draftText": "TEST",
    "description": "components/study-subnav.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_014",
    "sourceText": "VOCA",
    "draftText": "VOCA",
    "description": "components/voca-header.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_015",
    "sourceText": "VOCA 상단의 + 버튼에서 공통 목록을 추가하거나, 개인 단어 목록을 만들어 보세요.",
    "draftText": "VOCA 상단의 + 버튼에서 공통 목록을 추가하거나, 개인 단어 목록을 만들어 보세요.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_016",
    "sourceText": "VOCA 하위 메뉴",
    "draftText": "VOCA 하위 메뉴",
    "description": "components/study-subnav.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_017",
    "sourceText": "VOCABULARY LIBRARY",
    "draftText": "VOCABULARY LIBRARY",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_018",
    "sourceText": "WORD CARDS",
    "draftText": "WORD CARDS",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_019",
    "sourceText": "개인",
    "draftText": "개인",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_020",
    "sourceText": "개인 목록을 불러오는 중…",
    "draftText": "개인 목록을 불러오는 중…",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_021",
    "sourceText": "개인 목록을 불러오지 못했습니다.",
    "draftText": "개인 목록을 불러오지 못했습니다.",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_022",
    "sourceText": "개인 목록을 불러오지 못했어요.",
    "draftText": "개인 목록을 불러오지 못했어요.",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_023",
    "sourceText": "개인 목록을 선택하고 여러 단어를 한 번에 저장할 수 있어요.",
    "draftText": "개인 목록을 선택하고 여러 단어를 한 번에 저장할 수 있어요.",
    "description": "app/voca/list/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_024",
    "sourceText": "개인 목록을 선택한 다음, 원하는 만큼 단어 카드를 만들어 한 번에 저장하세요.",
    "draftText": "개인 목록을 선택한 다음, 원하는 만큼 단어 카드를 만들어 한 번에 저장하세요.",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_025",
    "sourceText": "공통",
    "draftText": "공통",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_026",
    "sourceText": "공통 단어 목록",
    "draftText": "공통 단어 목록",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_027",
    "sourceText": "공통 목록을 불러오지 못했습니다.",
    "draftText": "공통 목록을 불러오지 못했습니다.",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_028",
    "sourceText": "공통 목록을 추가하지 못했습니다.",
    "draftText": "공통 목록을 추가하지 못했습니다.",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_029",
    "sourceText": "공통 목록을 추가하지 못했어요.",
    "draftText": "공통 목록을 추가하지 못했어요.",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_030",
    "sourceText": "내 개인 목록은 바로 열고, 공통 목록은 추가한 뒤 모든 기기에서 이어서 볼 수 있어요.",
    "draftText": "내 개인 목록은 바로 열고, 공통 목록은 추가한 뒤 모든 기기에서 이어서 볼 수 있어요.",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_031",
    "sourceText": "내 목록에서 제거",
    "draftText": "내 목록에서 제거",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_032",
    "sourceText": "내가 추가한 목록",
    "draftText": "내가 추가한 목록",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_033",
    "sourceText": "단어",
    "draftText": "단어",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_034",
    "sourceText": "단어 목록 추가 메뉴 닫기",
    "draftText": "단어 목록 추가 메뉴 닫기",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_035",
    "sourceText": "단어 목록 추가 메뉴 열기",
    "draftText": "단어 목록 추가 메뉴 열기",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_036",
    "sourceText": "단어 목록으로 돌아가기",
    "draftText": "단어 목록으로 돌아가기",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_037",
    "sourceText": "단어 목록을 내 목록에서 제거했어요.",
    "draftText": "단어 목록을 내 목록에서 제거했어요.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_038",
    "sourceText": "단어 목록을 불러오지 못했습니다.",
    "draftText": "단어 목록을 불러오지 못했습니다.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_039",
    "sourceText": "단어 목록을 불러오지 못했어요.",
    "draftText": "단어 목록을 불러오지 못했어요.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_040",
    "sourceText": "단어 목록을 지우지 못했습니다.",
    "draftText": "단어 목록을 지우지 못했습니다.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_041",
    "sourceText": "단어 목록을 지우지 못했어요.",
    "draftText": "단어 목록을 지우지 못했어요.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_042",
    "sourceText": "단어 목록을 지웠어요.",
    "draftText": "단어 목록을 지웠어요.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_043",
    "sourceText": "단어 상태를 저장하지 못했습니다.",
    "draftText": "단어 상태를 저장하지 못했습니다.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_044",
    "sourceText": "단어 상태를 저장하지 못했어요.",
    "draftText": "단어 상태를 저장하지 못했어요.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_045",
    "sourceText": "단어 추가",
    "draftText": "단어 추가",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_046",
    "sourceText": "단어 추가하기",
    "draftText": "단어 추가하기",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_047",
    "sourceText": "단어를 불러오는 중입니다.",
    "draftText": "단어를 불러오는 중입니다.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_048",
    "sourceText": "단어를 저장하지 못했습니다.",
    "draftText": "단어를 저장하지 못했습니다.",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_049",
    "sourceText": "단어를 저장하지 못했어요.",
    "draftText": "단어를 저장하지 못했어요.",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_050",
    "sourceText": "단어를 직접 추가하세요.",
    "draftText": "단어를 직접 추가하세요.",
    "description": "app/voca/list/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_051",
    "sourceText": "닫기",
    "draftText": "닫기",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_052",
    "sourceText": "데이터 불러오기",
    "draftText": "데이터 불러오기",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_053",
    "sourceText": "데이터 불러오기는 다음에 합니다.",
    "draftText": "데이터 불러오기는 다음에 합니다.",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_054",
    "sourceText": "모든 카드에 영단어, 발음, 뜻을 입력해 주세요.",
    "draftText": "모든 카드에 영단어, 발음, 뜻을 입력해 주세요.",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_055",
    "sourceText": "목록 설정 닫기",
    "draftText": "목록 설정 닫기",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_056",
    "sourceText": "목록 지우기",
    "draftText": "목록 지우기",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_057",
    "sourceText": "목록을 불러오는 중입니다.",
    "draftText": "목록을 불러오는 중입니다.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_058",
    "sourceText": "발음",
    "draftText": "발음",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_059",
    "sourceText": "사용자 추가",
    "draftText": "사용자 추가",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_060",
    "sourceText": "새 개인 단어 목록을 열었습니다.",
    "draftText": "새 개인 단어 목록을 열었습니다.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_061",
    "sourceText": "새 목록 이름",
    "draftText": "새 목록 이름",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_062",
    "sourceText": "아직 불러온 단어 목록이 없습니다.",
    "draftText": "아직 불러온 단어 목록이 없습니다.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_063",
    "sourceText": "아직 추가한 단어 목록이 없습니다.",
    "draftText": "아직 추가한 단어 목록이 없습니다.",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_064",
    "sourceText": "영단어",
    "draftText": "영단어",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_065",
    "sourceText": "예: 여행에서 만난 단어",
    "draftText": "예: 여행에서 만난 단어",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_066",
    "sourceText": "요청을 처리하지 못했습니다.",
    "draftText": "요청을 처리하지 못했습니다.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_067",
    "sourceText": "이 목록으로 학습을 시작할 준비 중입니다.",
    "draftText": "이 목록으로 학습을 시작할 준비 중입니다.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_068",
    "sourceText": "잠시 후 다시 시도해 주세요.",
    "draftText": "잠시 후 다시 시도해 주세요.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_069",
    "sourceText": "저장",
    "draftText": "저장",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_070",
    "sourceText": "저장 중…",
    "draftText": "저장 중…",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_071",
    "sourceText": "저장된 단어 리스트",
    "draftText": "저장된 단어 리스트",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "title",
    "sourceText": "저장된 단어 리스트.",
    "draftText": "저장된 단어 리스트.",
    "description": "app/voca/list/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_073",
    "sourceText": "저장된 단어 리스트로 돌아가기",
    "draftText": "저장된 단어 리스트로 돌아가기",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_074",
    "sourceText": "저장된 단어 불러오기",
    "draftText": "저장된 단어 불러오기",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_075",
    "sourceText": "저장된 단어 불러오기 닫기",
    "draftText": "저장된 단어 불러오기 닫기",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_076",
    "sourceText": "저장된 목록을 불러오지 못했습니다.",
    "draftText": "저장된 목록을 불러오지 못했습니다.",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_077",
    "sourceText": "저장한 목록으로 이동합니다.",
    "draftText": "저장한 목록으로 이동합니다.",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_078",
    "sourceText": "저장할 개인 목록 선택",
    "draftText": "저장할 개인 목록 선택",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_079",
    "sourceText": "저장할 목록",
    "draftText": "저장할 목록",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_080",
    "sourceText": "저장할 목록을 선택하세요",
    "draftText": "저장할 목록을 선택하세요",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_081",
    "sourceText": "중복 항목이 많아 요청한 수를 모두 채우지는 못했어요.",
    "draftText": "중복 항목이 많아 요청한 수를 모두 채우지는 못했어요.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_082",
    "sourceText": "중요 단어",
    "draftText": "중요 단어",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_083",
    "sourceText": "추가",
    "draftText": "추가",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "description",
    "sourceText": "추가한 공통 목록과 내 개인 단어 목록을 기기와 관계없이 이어서 학습하세요.",
    "draftText": "추가한 공통 목록과 내 개인 단어 목록을 기기와 관계없이 이어서 학습하세요.",
    "description": "app/voca/list/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_085",
    "sourceText": "추가할 공통 목록이 없습니다.",
    "draftText": "추가할 공통 목록이 없습니다.",
    "description": "components/voca-add-menu.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_086",
    "sourceText": "학습 완료",
    "draftText": "학습 완료",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_087",
    "sourceText": "학습 필요",
    "draftText": "학습 필요",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_088",
    "sourceText": "학습하기",
    "draftText": "학습하기",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_089",
    "sourceText": "학습현황 초기화",
    "draftText": "학습현황 초기화",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_090",
    "sourceText": "학습현황 초기화는 준비 중입니다.",
    "draftText": "학습현황 초기화는 준비 중입니다.",
    "description": "components/voca-list-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "voca.list",
    "variableName": "copy_091",
    "sourceText": "한국어 뜻",
    "draftText": "한국어 뜻",
    "description": "components/voca-manual-entry.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "copy_001",
    "sourceText": "BOARD",
    "draftText": "BOARD",
    "description": "app/writing/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "copy_002",
    "sourceText": "FOUNDATION",
    "draftText": "FOUNDATION",
    "description": "components/writing-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "copy_003",
    "sourceText": "STARTING LEVEL",
    "draftText": "STARTING LEVEL",
    "description": "components/writing-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "copy_004",
    "sourceText": "Task 1 한 문항으로 시작 단계를 확인합니다.",
    "draftText": "Task 1 한 문항으로 시작 단계를 확인합니다.",
    "description": "components/writing-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "copy_005",
    "sourceText": "Task 1과 Task 2로 심화 기준을 확인합니다.",
    "draftText": "Task 1과 Task 2로 심화 기준을 확인합니다.",
    "description": "components/writing-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "copy_006",
    "sourceText": "Task 1과 Task 2로 현재 실력을 확인합니다.",
    "draftText": "Task 1과 Task 2로 현재 실력을 확인합니다.",
    "description": "components/writing-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "copy_007",
    "sourceText": "WRITING",
    "draftText": "WRITING",
    "description": "app/writing/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "copy_008",
    "sourceText": "Writing Board",
    "draftText": "Writing Board",
    "description": "components/writing-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "copy_009",
    "sourceText": "기본 문장 구조부터 바로 학습을 시작합니다.",
    "draftText": "기본 문장 구조부터 바로 학습을 시작합니다.",
    "description": "components/writing-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "copy_010",
    "sourceText": "내 실력에 맞는 Writing 단계로 학습을 시작합니다.",
    "draftText": "내 실력에 맞는 Writing 단계로 학습을 시작합니다.",
    "description": "components/writing-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "copy_011",
    "sourceText": "닫기",
    "draftText": "닫기",
    "description": "components/writing-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "copy_012",
    "sourceText": "레벨 설정하기",
    "draftText": "레벨 설정하기",
    "description": "components/writing-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "copy_013",
    "sourceText": "시작 레벨 선택 닫기",
    "draftText": "시작 레벨 선택 닫기",
    "description": "components/writing-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "copy_014",
    "sourceText": "시작 레벨을 설정하세요.",
    "draftText": "시작 레벨을 설정하세요.",
    "description": "components/writing-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "copy_015",
    "sourceText": "어디서 시작할까요?",
    "draftText": "어디서 시작할까요?",
    "description": "components/writing-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "copy_016",
    "sourceText": "처음 선택한 레벨은 학습의 출발점이 됩니다.",
    "draftText": "처음 선택한 레벨은 학습의 출발점이 됩니다.",
    "description": "components/writing-board.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "start_level_50",
    "sourceText": "5.0+",
    "draftText": "5.0+",
    "description": "components/writing-client.tsx 시작 레벨 선택 카드의 5.0+ 레벨명",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "start_level_60",
    "sourceText": "6.0+",
    "draftText": "6.0+",
    "description": "components/writing-client.tsx 시작 레벨 선택 카드의 6.0+ 레벨명",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.board",
    "variableName": "start_level_70",
    "sourceText": "7.0+",
    "draftText": "7.0+",
    "description": "components/writing-client.tsx 시작 레벨 선택 카드의 7.0+ 레벨명",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.common",
    "variableName": "copy_001",
    "sourceText": "BOARD",
    "draftText": "BOARD",
    "description": "components/writing-subnav.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.common",
    "variableName": "copy_002",
    "sourceText": "NOTEBOOK",
    "draftText": "NOTEBOOK",
    "description": "components/writing-subnav.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.common",
    "variableName": "copy_003",
    "sourceText": "PRACTICE",
    "draftText": "PRACTICE",
    "description": "components/writing-subnav.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.common",
    "variableName": "copy_004",
    "sourceText": "WRITING",
    "draftText": "WRITING",
    "description": "components/writing-header.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.common",
    "variableName": "copy_005",
    "sourceText": "Writing 하위 메뉴",
    "draftText": "Writing 하위 메뉴",
    "description": "components/writing-subnav.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.common",
    "variableName": "title",
    "sourceText": "나의 Writing 진단.",
    "draftText": "나의 Writing 진단.",
    "description": "components/writing-header.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.common",
    "variableName": "copy_007",
    "sourceText": "오답노트",
    "draftText": "오답노트",
    "description": "components/writing-subnav.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.common",
    "variableName": "description",
    "sourceText": "학습과 테스트 기록을 바탕으로 현재 상태를 확인하고, 필요한 다음 학습으로 바로 이어가세요.",
    "draftText": "학습과 테스트 기록을 바탕으로 현재 상태를 확인하고, 필요한 다음 학습으로 바로 이어가세요.",
    "description": "components/writing-header.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.notebook",
    "variableName": "copy_001",
    "sourceText": "NOTEBOOK",
    "draftText": "NOTEBOOK",
    "description": "app/writing/notebook/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.notebook",
    "variableName": "copy_002",
    "sourceText": "WRITING",
    "draftText": "WRITING",
    "description": "app/writing/notebook/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.placement",
    "variableName": "copy_001",
    "sourceText": "Board로 돌아가기",
    "draftText": "Board로 돌아가기",
    "description": "app/writing/placement/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.placement",
    "variableName": "copy_002",
    "sourceText": "STARTING LEVEL TEST",
    "draftText": "STARTING LEVEL TEST",
    "description": "app/writing/placement/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.placement",
    "variableName": "copy_003",
    "sourceText": "Task 1",
    "draftText": "Task 1",
    "description": "app/writing/placement/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.placement",
    "variableName": "copy_004",
    "sourceText": "Task 1 한 문항으로 5.0+ 내부 시작 단계를 확인합니다.",
    "draftText": "Task 1 한 문항으로 5.0+ 내부 시작 단계를 확인합니다.",
    "description": "app/writing/placement/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.placement",
    "variableName": "copy_005",
    "sourceText": "Task 1과 Task 2를 심화 기준으로 확인합니다.",
    "draftText": "Task 1과 Task 2를 심화 기준으로 확인합니다.",
    "description": "app/writing/placement/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.placement",
    "variableName": "copy_006",
    "sourceText": "Task 1과 Task 2를 통해 현재 수준을 확인합니다.",
    "draftText": "Task 1과 Task 2를 통해 현재 수준을 확인합니다.",
    "description": "app/writing/placement/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.placement",
    "variableName": "copy_007",
    "sourceText": "Task 2",
    "draftText": "Task 2",
    "description": "app/writing/placement/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.placement",
    "variableName": "copy_008",
    "sourceText": "TEST COMPOSITION",
    "draftText": "TEST COMPOSITION",
    "description": "app/writing/placement/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.placement",
    "variableName": "copy_009",
    "sourceText": "WRITING",
    "draftText": "WRITING",
    "description": "app/writing/placement/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.placement",
    "variableName": "copy_010",
    "sourceText": "레벨 테스트는 시작 단계만 산정하며, 오답노트와 반복 약점 기록에는 포함되지 않습니다.",
    "draftText": "레벨 테스트는 시작 단계만 산정하며, 오답노트와 반복 약점 기록에는 포함되지 않습니다.",
    "description": "app/writing/placement/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.placement",
    "variableName": "copy_011",
    "sourceText": "사전 설정된 진단 문제 · 힌트 없음",
    "draftText": "사전 설정된 진단 문제 · 힌트 없음",
    "description": "app/writing/placement/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.placement",
    "variableName": "copy_012",
    "sourceText": "사전 설정할 문제와 판정 기준을 등록하면 이곳에서 바로 레벨 테스트를 진행합니다.",
    "draftText": "사전 설정할 문제와 판정 기준을 등록하면 이곳에서 바로 레벨 테스트를 진행합니다.",
    "description": "app/writing/placement/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.placement",
    "variableName": "copy_013",
    "sourceText": "진단 문제를 준비 중입니다.",
    "draftText": "진단 문제를 준비 중입니다.",
    "description": "app/writing/placement/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.practice",
    "variableName": "copy_001",
    "sourceText": "PRACTICE",
    "draftText": "PRACTICE",
    "description": "app/writing/practice/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.practice",
    "variableName": "copy_002",
    "sourceText": "WRITING",
    "draftText": "WRITING",
    "description": "app/writing/practice/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.session",
    "variableName": "copy_001",
    "sourceText": "WRITING",
    "draftText": "WRITING",
    "description": "app/writing/session/[id]/page.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_001",
    "sourceText": "5.0 기본반",
    "draftText": "5.0 기본반",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_002",
    "sourceText": "After",
    "draftText": "After",
    "description": "components/writing-material.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_003",
    "sourceText": "AI NOTE REVIEW",
    "draftText": "AI NOTE REVIEW",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_004",
    "sourceText": "AI REVIEWED FEEDBACK",
    "draftText": "AI REVIEWED FEEDBACK",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_005",
    "sourceText": "AI 검수로 다듬기",
    "draftText": "AI 검수로 다듬기",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_006",
    "sourceText": "AI가 문제를 준비하고 있어요.",
    "draftText": "AI가 문제를 준비하고 있어요.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_007",
    "sourceText": "AI가 시작 레벨 문제를 준비하고 있어요.",
    "draftText": "AI가 시작 레벨 문제를 준비하고 있어요.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_008",
    "sourceText": "AI가 오답노트를 읽기 좋게 정리하고 있어요.",
    "draftText": "AI가 오답노트를 읽기 좋게 정리하고 있어요.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_009",
    "sourceText": "AI가 응답을 준비하고 있어요.",
    "draftText": "AI가 응답을 준비하고 있어요.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_010",
    "sourceText": "Bar chart",
    "draftText": "Bar chart",
    "description": "components/writing-material.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_011",
    "sourceText": "Before",
    "draftText": "Before",
    "description": "components/writing-material.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_012",
    "sourceText": "Board로 돌아가기",
    "draftText": "Board로 돌아가기",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_013",
    "sourceText": "Board로 이동",
    "draftText": "Board로 이동",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_014",
    "sourceText": "Bridge",
    "draftText": "Bridge",
    "description": "components/writing-material.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_015",
    "sourceText": "COMPLETED",
    "draftText": "COMPLETED",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_016",
    "sourceText": "Content-Type",
    "draftText": "Content-Type",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_017",
    "sourceText": "CURRENT WRITING LEVEL",
    "draftText": "CURRENT WRITING LEVEL",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_018",
    "sourceText": "Data",
    "draftText": "Data",
    "description": "components/writing-material.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_019",
    "sourceText": "FOUNDATION",
    "draftText": "FOUNDATION",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_020",
    "sourceText": "FOUNDATION 학습 시작",
    "draftText": "FOUNDATION 학습 시작",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_021",
    "sourceText": "FOUNDATION은 자료 기반 3문장 훈련으로 바로 시작합니다.",
    "draftText": "FOUNDATION은 자료 기반 3문장 훈련으로 바로 시작합니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_022",
    "sourceText": "Grammar",
    "draftText": "Grammar",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_023",
    "sourceText": "HINT 5 · Paragraphs",
    "draftText": "HINT 5 · Paragraphs",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_024",
    "sourceText": "IELTS에 유용한 표현",
    "draftText": "IELTS에 유용한 표현",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_025",
    "sourceText": "LEARNING FEEDBACK",
    "draftText": "LEARNING FEEDBACK",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_026",
    "sourceText": "Line chart",
    "draftText": "Line chart",
    "description": "components/writing-material.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_027",
    "sourceText": "M0,0 L6,3 L0,6 Z",
    "draftText": "M0,0 L6,3 L0,6 Z",
    "description": "components/writing-material.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_028",
    "sourceText": "Map",
    "draftText": "Map",
    "description": "components/writing-material.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_029",
    "sourceText": "MY ANSWER",
    "draftText": "MY ANSWER",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_030",
    "sourceText": "Pie chart",
    "draftText": "Pie chart",
    "description": "components/writing-material.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_031",
    "sourceText": "POST",
    "draftText": "POST",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_032",
    "sourceText": "PRACTICE",
    "draftText": "PRACTICE",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_033",
    "sourceText": "Process diagram",
    "draftText": "Process diagram",
    "description": "components/writing-material.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_034",
    "sourceText": "Q.",
    "draftText": "Q.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_035",
    "sourceText": "REINFORCEMENT",
    "draftText": "REINFORCEMENT",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_036",
    "sourceText": "Sample",
    "draftText": "Sample",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_037",
    "sourceText": "SHORT SOURCE MATERIAL",
    "draftText": "SHORT SOURCE MATERIAL",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_038",
    "sourceText": "SOURCE MATERIAL",
    "draftText": "SOURCE MATERIAL",
    "description": "components/writing-material.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_039",
    "sourceText": "STARTING LEVEL",
    "draftText": "STARTING LEVEL",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_040",
    "sourceText": "Structure",
    "draftText": "Structure",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_041",
    "sourceText": "Table",
    "draftText": "Table",
    "description": "components/writing-material.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_042",
    "sourceText": "Task 1",
    "draftText": "Task 1",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_043",
    "sourceText": "TASK 1",
    "draftText": "TASK 1",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_044",
    "sourceText": "Task 1 한 문항으로 시작 단계를 확인합니다.",
    "draftText": "Task 1 한 문항으로 시작 단계를 확인합니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_045",
    "sourceText": "Task 1과 Task 2로 현재 실력을 확인합니다.",
    "draftText": "Task 1과 Task 2로 현재 실력을 확인합니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_046",
    "sourceText": "Task 1과 Task 2를 심화 기준으로 확인합니다.",
    "draftText": "Task 1과 Task 2를 심화 기준으로 확인합니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_047",
    "sourceText": "Task 2",
    "draftText": "Task 2",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_048",
    "sourceText": "TASK 2",
    "draftText": "TASK 2",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_049",
    "sourceText": "Vocabulary",
    "draftText": "Vocabulary",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_050",
    "sourceText": "Write your response.",
    "draftText": "Write your response.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_051",
    "sourceText": "WRITING QUESTION",
    "draftText": "WRITING QUESTION",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_052",
    "sourceText": "강등",
    "draftText": "강등",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_053",
    "sourceText": "개선 답안",
    "draftText": "개선 답안",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_054",
    "sourceText": "검수 완료",
    "draftText": "검수 완료",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_055",
    "sourceText": "검수에 실패했습니다.",
    "draftText": "검수에 실패했습니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_056",
    "sourceText": "검수할 새 오답노트가 없습니다.",
    "draftText": "검수할 새 오답노트가 없습니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_057",
    "sourceText": "공정도 자료",
    "draftText": "공정도 자료",
    "description": "components/writing-material.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_058",
    "sourceText": "권장 점수에 도달하지 않았더라도 언제든 도전할 수 있습니다.",
    "draftText": "권장 점수에 도달하지 않았더라도 언제든 도전할 수 있습니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_059",
    "sourceText": "그래도 시작",
    "draftText": "그래도 시작",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_060",
    "sourceText": "기본 문장 구조부터 바로 학습을 시작합니다.",
    "draftText": "기본 문장 구조부터 바로 학습을 시작합니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_061",
    "sourceText": "기존 점수와 채점 원본은 유지하고, 읽기 쉬운 피드백으로 정리합니다.",
    "draftText": "기존 점수와 채점 원본은 유지하고, 읽기 쉬운 피드백으로 정리합니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_062",
    "sourceText": "낮출 레벨을 선택하세요",
    "draftText": "낮출 레벨을 선택하세요",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_063",
    "sourceText": "내 실력에 맞는 Writing 단계로 학습을 시작합니다.",
    "draftText": "내 실력에 맞는 Writing 단계로 학습을 시작합니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_064",
    "sourceText": "눌러서 힌트 보기",
    "draftText": "눌러서 힌트 보기",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_065",
    "sourceText": "다음 문제",
    "draftText": "다음 문제",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_066",
    "sourceText": "다음 학습 목표",
    "draftText": "다음 학습 목표",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_067",
    "sourceText": "닫기",
    "draftText": "닫기",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_068",
    "sourceText": "답안 제출",
    "draftText": "답안 제출",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_069",
    "sourceText": "레벨 선택",
    "draftText": "레벨 선택",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_070",
    "sourceText": "레벨 설정하기",
    "draftText": "레벨 설정하기",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_071",
    "sourceText": "레벨을 변경하지 못했습니다.",
    "draftText": "레벨을 변경하지 못했습니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_072",
    "sourceText": "레벨을 설정하지 못했습니다.",
    "draftText": "레벨을 설정하지 못했습니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_073",
    "sourceText": "맞춤 보강 학습",
    "draftText": "맞춤 보강 학습",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_074",
    "sourceText": "먼저 시작 레벨을 설정해 주세요.",
    "draftText": "먼저 시작 레벨을 설정해 주세요.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_075",
    "sourceText": "목표 레벨에 도전할 준비가 되었습니다.",
    "draftText": "목표 레벨에 도전할 준비가 되었습니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_076",
    "sourceText": "문단 구조 가이드를 사용 중입니다. 문단별 역할을 확인하며 작성해 보세요.",
    "draftText": "문단 구조 가이드를 사용 중입니다. 문단별 역할을 확인하며 작성해 보세요.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_077",
    "sourceText": "문단 구조 가이드를 열지 못했습니다.",
    "draftText": "문단 구조 가이드를 열지 못했습니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_078",
    "sourceText": "문제 자료 보기",
    "draftText": "문제 자료 보기",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_079",
    "sourceText": "보강 문제를 준비하고 있어요.",
    "draftText": "보강 문제를 준비하고 있어요.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_080",
    "sourceText": "보강 학습",
    "draftText": "보강 학습",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_081",
    "sourceText": "보강 학습을 시작하지 못했습니다.",
    "draftText": "보강 학습을 시작하지 못했습니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_082",
    "sourceText": "본론 1",
    "draftText": "본론 1",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_083",
    "sourceText": "본론 2",
    "draftText": "본론 2",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_084",
    "sourceText": "서론",
    "draftText": "서론",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_085",
    "sourceText": "세션을 완료했습니다.",
    "draftText": "세션을 완료했습니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_086",
    "sourceText": "세션을 포기하지 못했습니다.",
    "draftText": "세션을 포기하지 못했습니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_087",
    "sourceText": "승급 목표를 선택하세요",
    "draftText": "승급 목표를 선택하세요",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_088",
    "sourceText": "승급 적용하기",
    "draftText": "승급 적용하기",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_089",
    "sourceText": "승급 테스트",
    "draftText": "승급 테스트",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_090",
    "sourceText": "시작 레벨을 설정하세요.",
    "draftText": "시작 레벨을 설정하세요.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_091",
    "sourceText": "아래 3개 질문에 각각 짧은 영어 문장으로 답해 보세요.",
    "draftText": "아래 3개 질문에 각각 짧은 영어 문장으로 답해 보세요.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_092",
    "sourceText": "아직 작업을 계속하고 있어요.",
    "draftText": "아직 작업을 계속하고 있어요.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_093",
    "sourceText": "아직 정리할 오답이 없어요.",
    "draftText": "아직 정리할 오답이 없어요.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_094",
    "sourceText": "아직 풀지 않은 문제가 있습니다.",
    "draftText": "아직 풀지 않은 문제가 있습니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_095",
    "sourceText": "어디서 시작할까요?",
    "draftText": "어디서 시작할까요?",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_096",
    "sourceText": "어떤 유형을 학습할까요?",
    "draftText": "어떤 유형을 학습할까요?",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_097",
    "sourceText": "영어 한 문장으로 답하세요.",
    "draftText": "영어 한 문장으로 답하세요.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_098",
    "sourceText": "영어로 답안을 작성하세요.",
    "draftText": "영어로 답안을 작성하세요.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_099",
    "sourceText": "오늘의 Writing.",
    "draftText": "오늘의 Writing.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_100",
    "sourceText": "오류 설명",
    "draftText": "오류 설명",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_101",
    "sourceText": "요청을 처리하지 못했습니다.",
    "draftText": "요청을 처리하지 못했습니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_102",
    "sourceText": "유의어 · 대체 표현",
    "draftText": "유의어 · 대체 표현",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_103",
    "sourceText": "유의어 · 표현",
    "draftText": "유의어 · 표현",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_104",
    "sourceText": "의견을 논리적으로 전개하는 훈련",
    "draftText": "의견을 논리적으로 전개하는 훈련",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_105",
    "sourceText": "이번 답안을 정리해 볼게요.",
    "draftText": "이번 답안을 정리해 볼게요.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_106",
    "sourceText": "이번에 기억할 핵심",
    "draftText": "이번에 기억할 핵심",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_107",
    "sourceText": "이어서 문제를 푸시겠습니까?",
    "draftText": "이어서 문제를 푸시겠습니까?",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_108",
    "sourceText": "이어서 풀기",
    "draftText": "이어서 풀기",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_109",
    "sourceText": "일반 테스트",
    "draftText": "일반 테스트",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_110",
    "sourceText": "자료",
    "draftText": "자료",
    "description": "components/writing-material.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_111",
    "sourceText": "자료를 객관적으로 분석하는 훈련",
    "draftText": "자료를 객관적으로 분석하는 훈련",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_112",
    "sourceText": "잘했어요.",
    "draftText": "잘했어요.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_113",
    "sourceText": "잠시만 기다려 주세요.",
    "draftText": "잠시만 기다려 주세요.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_114",
    "sourceText": "준비 중",
    "draftText": "준비 중",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_115",
    "sourceText": "지도 자료",
    "draftText": "지도 자료",
    "description": "components/writing-material.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_116",
    "sourceText": "채점 중",
    "draftText": "채점 중",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_117",
    "sourceText": "채점하지 못했습니다.",
    "draftText": "채점하지 못했습니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_118",
    "sourceText": "처리 중",
    "draftText": "처리 중",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_119",
    "sourceText": "처음 선택한 레벨은 학습의 출발점이 됩니다.",
    "draftText": "처음 선택한 레벨은 학습의 출발점이 됩니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_120",
    "sourceText": "첫 학습 결과가 쌓이면 현재 상황에 맞는 보강 학습을 안내합니다.",
    "draftText": "첫 학습 결과가 쌓이면 현재 상황에 맞는 보강 학습을 안내합니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_121",
    "sourceText": "최소 교정 답안",
    "draftText": "최소 교정 답안",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_122",
    "sourceText": "취소",
    "draftText": "취소",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_123",
    "sourceText": "포기하기",
    "draftText": "포기하기",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_124",
    "sourceText": "학습과 테스트에서 보완할 답안이 생기면 이곳에 원문과 첨삭을 함께 기록합니다.",
    "draftText": "학습과 테스트에서 보완할 답안이 생기면 이곳에 원문과 첨삭을 함께 기록합니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_125",
    "sourceText": "학습은 필요한 Task를 골라 집중하고, 테스트는 현재 단계를 빠르게 확인합니다.",
    "draftText": "학습은 필요한 Task를 골라 집중하고, 테스트는 현재 단계를 빠르게 확인합니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_126",
    "sourceText": "학습을 시작하지 못했습니다.",
    "draftText": "학습을 시작하지 못했습니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_127",
    "sourceText": "학습하기",
    "draftText": "학습하기",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_128",
    "sourceText": "항목",
    "draftText": "항목",
    "description": "components/writing-material.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_129",
    "sourceText": "현재 단계 점수는 초기화되며, 이전 학습 기록은 삭제되지 않습니다.",
    "draftText": "현재 단계 점수는 초기화되며, 이전 학습 기록은 삭제되지 않습니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_130",
    "sourceText": "현재 단계 학습",
    "draftText": "현재 단계 학습",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_131",
    "sourceText": "현재 단계에서 조금 더 학습하는 것을 권장합니다.",
    "draftText": "현재 단계에서 조금 더 학습하는 것을 권장합니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_132",
    "sourceText": "현재 세션을 포기할까요? 답하지 않은 문제는 기록에 반영되지 않습니다.",
    "draftText": "현재 세션을 포기할까요? 답하지 않은 문제는 기록에 반영되지 않습니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_133",
    "sourceText": "확인",
    "draftText": "확인",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_134",
    "sourceText": "힌트 사용 기록을 저장하지 못했습니다.",
    "draftText": "힌트 사용 기록을 저장하지 못했습니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_135",
    "sourceText": "힌트 없이 현재 단계의 실력을 확인합니다.",
    "draftText": "힌트 없이 현재 단계의 실력을 확인합니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_136",
    "sourceText": "힌트 열기",
    "draftText": "힌트 열기",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "writing.ui",
    "variableName": "copy_137",
    "sourceText": "힌트와 피드백을 사용해 필요한 Task를 학습합니다.",
    "draftText": "힌트와 피드백을 사용해 필요한 Task를 학습합니다.",
    "description": "components/writing-client.tsx에서 사용하는 고정 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "draft_screen_filter_label",
    "sourceText": "소속 화면",
    "draftText": "소속 화면",
    "description": "components/manage-copy-client.tsx 문구 초안 목록 필터의 라벨",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "draft_screen_filter_all",
    "sourceText": "전체 화면",
    "draftText": "전체 화면",
    "description": "components/manage-copy-client.tsx 문구 초안 목록 필터의 전체 선택값",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "draft_screen_filter_count",
    "sourceText": "{count}개 문구 표시",
    "draftText": "{count}개 문구 표시",
    "description": "components/manage-copy-client.tsx 문구 초안 목록 필터의 결과 수",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "draft_screen_filter_empty_title",
    "sourceText": "이 화면에 등록된 문구가 없습니다.",
    "draftText": "이 화면에 등록된 문구가 없습니다.",
    "description": "components/manage-copy-client.tsx 선택한 화면에 문구가 없을 때 제목",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "draft_screen_filter_empty_description",
    "sourceText": "다른 소속 화면을 선택하거나 새 문구를 등록하세요.",
    "draftText": "다른 소속 화면을 선택하거나 새 문구를 등록하세요.",
    "description": "components/manage-copy-client.tsx 선택한 화면에 문구가 없을 때 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "draft_pagination_previous",
    "sourceText": "이전",
    "draftText": "이전",
    "description": "components/manage-copy-client.tsx 문구 초안 목록 페이지네이션의 이전 버튼",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "draft_pagination_next",
    "sourceText": "다음",
    "draftText": "다음",
    "description": "components/manage-copy-client.tsx 문구 초안 목록 페이지네이션의 다음 버튼",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "draft_pagination_status",
    "sourceText": "{current} / {total} 페이지",
    "draftText": "{current} / {total} 페이지",
    "description": "components/manage-copy-client.tsx 문구 초안 목록의 현재 페이지 표시",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "screen_pagination_label",
    "sourceText": "소속 화면 페이지",
    "draftText": "소속 화면 페이지",
    "description": "components/manage-copy-client.tsx 소속 화면 목록 페이지네이션의 접근성 이름",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "mockup_eyebrow",
    "sourceText": "COPY PREVIEW",
    "draftText": "COPY PREVIEW",
    "description": "components/manage-copy-client.tsx 문구 위치 미리보기의 상단 구분 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "mockup_title",
    "sourceText": "문구 위치 미리보기",
    "draftText": "문구 위치 미리보기",
    "description": "components/manage-copy-client.tsx 문구 위치 미리보기 제목",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "mockup_description",
    "sourceText": "문구를 클릭하면 오른쪽에서 초안을 수정할 수 있습니다.",
    "draftText": "문구를 클릭하면 오른쪽에서 초안을 수정할 수 있습니다.",
    "description": "components/manage-copy-client.tsx 문구 위치 미리보기 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "mockup_no_screen",
    "sourceText": "위 목록에서 소속 화면을 선택하세요.",
    "draftText": "위 목록에서 소속 화면을 선택하세요.",
    "description": "components/manage-copy-client.tsx 소속 화면을 선택하기 전의 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "mockup_edit_title",
    "sourceText": "문구 편집",
    "draftText": "문구 편집",
    "description": "components/manage-copy-client.tsx 목업 오른쪽 편집 영역 제목",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "mockup_edit_empty",
    "sourceText": "목업의 문구를 선택하세요.",
    "draftText": "목업의 문구를 선택하세요.",
    "description": "components/manage-copy-client.tsx 목업에서 문구를 선택하기 전의 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "mockup_source",
    "sourceText": "원문",
    "draftText": "원문",
    "description": "components/manage-copy-client.tsx 목업 편집 영역의 원문 라벨",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "mockup_draft",
    "sourceText": "초안",
    "draftText": "초안",
    "description": "components/manage-copy-client.tsx 목업 편집 영역의 초안 라벨",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "mockup_save",
    "sourceText": "문구 저장",
    "draftText": "문구 저장",
    "description": "components/manage-copy-client.tsx 목업 편집 영역의 저장 버튼",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "screen_management",
    "sourceText": "화면 관리",
    "draftText": "화면 관리",
    "description": "components/manage-copy-client.tsx 관리 화면의 화면 관리 탭",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "user_management",
    "sourceText": "사용자 관리",
    "draftText": "사용자 관리",
    "description": "components/manage-copy-client.tsx 관리 화면의 사용자 관리 탭",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "user_management_eyebrow",
    "sourceText": "USERS",
    "draftText": "USERS",
    "description": "components/manage-copy-client.tsx 사용자 관리 준비 화면의 상단 구분 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "user_management_title",
    "sourceText": "사용자 관리",
    "draftText": "사용자 관리",
    "description": "components/manage-copy-client.tsx 사용자 관리 준비 화면의 제목",
    "textFormat": "plain"
  },
  {
    "screenKey": "manage.copy",
    "variableName": "user_management_description",
    "sourceText": "사용자 권한과 계정 정보 관리는 다음 단계에서 추가합니다.",
    "draftText": "사용자 권한과 계정 정보 관리는 다음 단계에서 추가합니다.",
    "description": "components/manage-copy-client.tsx 사용자 관리 준비 화면의 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.practice",
    "variableName": "part_two",
    "sourceText": "Part 2 카드 연습",
    "draftText": "Part 2 카드 연습",
    "description": "components/speaking-practice.tsx Part 2 이동 버튼",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.practice",
    "variableName": "part_one",
    "sourceText": "Part 1 연습",
    "draftText": "Part 1 연습",
    "description": "components/speaking-practice.tsx Part 1 이동 버튼",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.practice",
    "variableName": "part_three",
    "sourceText": "Part 3 심화 대화",
    "draftText": "Part 3 심화 대화",
    "description": "components/speaking-practice.tsx Part 3 이동 버튼",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "title",
    "sourceText": "Part 2 카드 연습.",
    "draftText": "Part 2 카드 연습.",
    "description": "components/speaking-part-two-prototype.tsx 제목",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "description",
    "sourceText": "카드를 열고 핵심을 메모한 뒤, 하나의 주제를 길게 설명해 보세요.",
    "draftText": "카드를 열고 핵심을 메모한 뒤, 하나의 주제를 길게 설명해 보세요.",
    "description": "components/speaking-part-two-prototype.tsx 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "level_badge",
    "sourceText": "6.5A · 학습하기",
    "draftText": "6.5A · 학습하기",
    "description": "components/speaking-part-two-prototype.tsx 단계 표기",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "part_label",
    "sourceText": "PART 2 · LONG TURN",
    "draftText": "PART 2 · LONG TURN",
    "description": "components/speaking-part-two-prototype.tsx 상단 구분 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "part_description",
    "sourceText": "카드 준비 · 발화 · 연계 질문",
    "draftText": "카드 준비 · 발화 · 연계 질문",
    "description": "components/speaking-part-two-prototype.tsx 상단 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "cue_card",
    "sourceText": "CUE CARD",
    "draftText": "CUE CARD",
    "description": "components/speaking-part-two-prototype.tsx 카드 구분 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "card_open_instruction",
    "sourceText": "카드를 열면 준비 시간이 시작됩니다.",
    "draftText": "카드를 열면 준비 시간이 시작됩니다.",
    "description": "components/speaking-part-two-prototype.tsx 카드 열기 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "card_back_instruction",
    "sourceText": "카드를 눌러 주제를 확인하세요",
    "draftText": "카드를 눌러 주제를 확인하세요",
    "description": "components/speaking-part-two-prototype.tsx 카드 뒷면 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "memo_title",
    "sourceText": "PRIVATE NOTES",
    "draftText": "PRIVATE NOTES",
    "description": "components/speaking-part-two-prototype.tsx 메모 제목",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "memo_before_open",
    "sourceText": "카드를 열면 1분 30초 동안 메모할 수 있어요.",
    "draftText": "카드를 열면 1분 30초 동안 메모할 수 있어요.",
    "description": "components/speaking-part-two-prototype.tsx 메모 시작 전 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "memo_during_prepare",
    "sourceText": "핵심어만 적어 보세요. 이 메모는 채점에 사용되지 않습니다.",
    "draftText": "핵심어만 적어 보세요. 이 메모는 채점에 사용되지 않습니다.",
    "description": "components/speaking-part-two-prototype.tsx 메모 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "memo_after_lock",
    "sourceText": "발화가 시작되어 메모가 잠겼어요. 세션이 끝나면 자동으로 폐기됩니다.",
    "draftText": "발화가 시작되어 메모가 잠겼어요. 세션이 끝나면 자동으로 폐기됩니다.",
    "description": "components/speaking-part-two-prototype.tsx 메모 잠금 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "memo_limit",
    "sourceText": "최대 6줄 · 300자 · 서버에 저장되지 않음",
    "draftText": "최대 6줄 · 300자 · 서버에 저장되지 않음",
    "description": "components/speaking-part-two-prototype.tsx 메모 제한 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "recording_processing",
    "sourceText": "답변 처리 중…",
    "draftText": "답변 처리 중…",
    "description": "components/speaking-part-two-prototype.tsx 처리 상태",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "followup_instruction",
    "sourceText": "질문을 듣고 답변을 녹음하세요.",
    "draftText": "질문을 듣고 답변을 녹음하세요.",
    "description": "components/speaking-part-two-prototype.tsx 추가 질문 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "followup_footer",
    "sourceText": "추가 질문에는 별도 메모 없이 바로 답해 보세요.",
    "draftText": "추가 질문에는 별도 메모 없이 바로 답해 보세요.",
    "description": "components/speaking-part-two-prototype.tsx 추가 질문 발화 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "complete_title",
    "sourceText": "카드 연습을 마쳤어요.",
    "draftText": "카드 연습을 마쳤어요.",
    "description": "components/speaking-part-two-prototype.tsx 완료 제목",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "complete_description",
    "sourceText": "메모는 저장하지 않고 폐기했어요. 음성 처리 연결 후 이 자리에 답변 분석과 최종 피드백이 표시됩니다.",
    "draftText": "메모는 저장하지 않고 폐기했어요. 음성 처리 연결 후 이 자리에 답변 분석과 최종 피드백이 표시됩니다.",
    "description": "components/speaking-part-two-prototype.tsx 완료 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "restart",
    "sourceText": "새 카드 연습",
    "draftText": "새 카드 연습",
    "description": "components/speaking-part-two-prototype.tsx 다시 시작 버튼",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "card_answer_hint",
    "sourceText": "답변 구조 힌트",
    "draftText": "답변 구조 힌트",
    "description": "components/speaking-part-two-prototype.tsx 카드 답변 힌트 메뉴",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "card_translation",
    "sourceText": "카드 번역 보기",
    "draftText": "카드 번역 보기",
    "description": "components/speaking-part-two-prototype.tsx 카드 답변 힌트 메뉴",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "development_example",
    "sourceText": "전개 예시",
    "draftText": "전개 예시",
    "description": "components/speaking-part-two-prototype.tsx 카드 답변 힌트 메뉴",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "question_text_hint",
    "sourceText": "질문 텍스트 보기",
    "draftText": "질문 텍스트 보기",
    "description": "components/speaking-part-two-prototype.tsx 후속 질문 힌트 메뉴",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "answer_structure_hint",
    "sourceText": "답변 구조 힌트",
    "draftText": "답변 구조 힌트",
    "description": "components/speaking-part-two-prototype.tsx 후속 질문 힌트 메뉴",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "question_playing",
    "sourceText": "질문을 재생하고 있어요.",
    "draftText": "질문을 재생하고 있어요.",
    "description": "components/speaking-part-two-prototype.tsx 후속 질문 재생 상태",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "answer_now",
    "sourceText": "답변하세요.",
    "draftText": "답변하세요.",
    "description": "components/speaking-part-two-prototype.tsx 후속 질문 대기 상태",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part2",
    "variableName": "wait_for_question",
    "sourceText": "질문이 끝나면 녹음할 수 있습니다.",
    "draftText": "질문이 끝나면 녹음할 수 있습니다.",
    "description": "components/speaking-part-two-prototype.tsx 후속 질문 녹음 제한 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part3",
    "variableName": "title",
    "sourceText": "Part 3 심화 대화 연습.",
    "draftText": "Part 3 심화 대화 연습.",
    "description": "components/speaking-part-one-prototype.tsx Part 3 제목",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part3",
    "variableName": "description",
    "sourceText": "Part 2 큐카드의 주제를 확장해 사회적 관점과 이유를 논리적으로 설명해 보세요.",
    "draftText": "Part 2 큐카드의 주제를 확장해 사회적 관점과 이유를 논리적으로 설명해 보세요.",
    "description": "components/speaking-part-one-prototype.tsx Part 3 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part3",
    "variableName": "level",
    "sourceText": "6.5A · 학습하기",
    "draftText": "6.5A · 학습하기",
    "description": "components/speaking-part-one-prototype.tsx Part 3 단계",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part3",
    "variableName": "section",
    "sourceText": "PART 3 · DISCUSSION",
    "draftText": "PART 3 · DISCUSSION",
    "description": "components/speaking-part-one-prototype.tsx Part 3 구분 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part3",
    "variableName": "section_description",
    "sourceText": "Part 2 큐카드 주제를 확장한 심화 음성 대화",
    "draftText": "Part 2 큐카드 주제를 확장한 심화 음성 대화",
    "description": "components/speaking-part-one-prototype.tsx Part 3 구역 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part3",
    "variableName": "ready_label",
    "sourceText": "PART 3 READY",
    "draftText": "PART 3 READY",
    "description": "components/speaking-part-one-prototype.tsx Part 3 시작 전 구분 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part3",
    "variableName": "ready_title",
    "sourceText": "심화 대화를 시작할 준비가 됐어요.",
    "draftText": "심화 대화를 시작할 준비가 됐어요.",
    "description": "components/speaking-part-one-prototype.tsx Part 3 시작 전 제목",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part3",
    "variableName": "ready_description",
    "sourceText": "카운트다운 뒤 Part 2 큐카드 주제를 확장한 심화 질문이 재생됩니다. 의견, 이유, 비교와 예시를 활용해 답해 보세요.",
    "draftText": "카운트다운 뒤 Part 2 큐카드 주제를 확장한 심화 질문이 재생됩니다. 의견, 이유, 비교와 예시를 활용해 답해 보세요.",
    "description": "components/speaking-part-one-prototype.tsx Part 3 시작 전 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.part3",
    "variableName": "complete_label",
    "sourceText": "PART 3 COMPLETE",
    "draftText": "PART 3 COMPLETE",
    "description": "components/speaking-part-one-prototype.tsx Part 3 완료 구분 문구",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.practice",
    "variableName": "promotion",
    "sourceText": "승급 테스트",
    "draftText": "승급 테스트",
    "description": "components/speaking-practice.tsx 승급 테스트 버튼",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.practice",
    "variableName": "demotion",
    "sourceText": "강등",
    "draftText": "강등",
    "description": "components/speaking-practice.tsx 강등 버튼",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.practice",
    "variableName": "promotion_description",
    "sourceText": "승급 테스트는 Part 1, Part 2, Part 3을 순서대로 완료해 현재 단계보다 높은 수준을 소화할 수 있는지 확인합니다.",
    "draftText": "승급 테스트는 Part 1, Part 2, Part 3을 순서대로 완료해 현재 단계보다 높은 수준을 소화할 수 있는지 확인합니다.",
    "description": "components/speaking-practice.tsx 승급 테스트 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.practice",
    "variableName": "promotion_pending",
    "sourceText": "현재 Speaking은 음성 처리와 채점 연동 전 단계입니다. 연결 후 이 창에서 바로 승급 테스트를 시작합니다.",
    "draftText": "현재 Speaking은 음성 처리와 채점 연동 전 단계입니다. 연결 후 이 창에서 바로 승급 테스트를 시작합니다.",
    "description": "components/speaking-practice.tsx 승급 테스트 준비 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.practice",
    "variableName": "demotion_description",
    "sourceText": "강등은 현재보다 낮은 공개 레벨을 직접 선택하는 방식으로 제공됩니다. 이전 학습 기록은 유지하고, 새 단계의 측정 점수만 다시 시작합니다.",
    "draftText": "강등은 현재보다 낮은 공개 레벨을 직접 선택하는 방식으로 제공됩니다. 이전 학습 기록은 유지하고, 새 단계의 측정 점수만 다시 시작합니다.",
    "description": "components/speaking-practice.tsx 강등 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.practice",
    "variableName": "demotion_pending",
    "sourceText": "Speaking 레벨 데이터 연동 후 이 창에서 변경할 레벨을 선택할 수 있습니다.",
    "draftText": "Speaking 레벨 데이터 연동 후 이 창에서 변경할 레벨을 선택할 수 있습니다.",
    "description": "components/speaking-practice.tsx 강등 준비 안내",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.notebook",
    "variableName": "queue_label",
    "sourceText": "REVIEW QUEUE",
    "draftText": "REVIEW QUEUE",
    "description": "components/speaking-notebook.tsx 복습 안내 상단 라벨",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.notebook",
    "variableName": "queue_title",
    "sourceText": "다시 확인할 답변",
    "draftText": "다시 확인할 답변",
    "description": "components/speaking-notebook.tsx 복습 안내 제목",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.notebook",
    "variableName": "queue_description",
    "sourceText": "완료한 답변은 질문, 녹음, 전사문과 개선 포인트를 함께 확인할 수 있습니다.",
    "draftText": "완료한 답변은 질문, 녹음, 전사문과 개선 포인트를 함께 확인할 수 있습니다.",
    "description": "components/speaking-notebook.tsx 복습 안내 설명",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.notebook",
    "variableName": "question",
    "sourceText": "QUESTION",
    "draftText": "QUESTION",
    "description": "components/speaking-notebook.tsx 질문 섹션 라벨",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.notebook",
    "variableName": "answer",
    "sourceText": "MY ANSWER",
    "draftText": "MY ANSWER",
    "description": "components/speaking-notebook.tsx 내 답변 섹션 라벨",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.notebook",
    "variableName": "feedback",
    "sourceText": "FEEDBACK · IMPROVE",
    "draftText": "FEEDBACK · IMPROVE",
    "description": "components/speaking-notebook.tsx 피드백 섹션 라벨",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.notebook",
    "variableName": "review",
    "sourceText": "다시 연습하기",
    "draftText": "다시 연습하기",
    "description": "components/speaking-notebook.tsx 재학습 버튼",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.notebook",
    "variableName": "strength",
    "sourceText": "잘한 점",
    "draftText": "잘한 점",
    "description": "components/speaking-notebook.tsx 강점 라벨",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.notebook",
    "variableName": "improve",
    "sourceText": "다음에 보완할 점",
    "draftText": "다음에 보완할 점",
    "description": "components/speaking-notebook.tsx 개선 라벨",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.notebook",
    "variableName": "recording_label",
    "sourceText": "MY RECORDING",
    "draftText": "MY RECORDING",
    "description": "components/speaking-notebook.tsx 녹음 재생 라벨",
    "textFormat": "plain"
  },
  {
    "screenKey": "speaking.notebook",
    "variableName": "pending_note",
    "sourceText": "음성 처리와 채점 연동 후에는 실제 완료 기록만 이 목록에 저장됩니다.",
    "draftText": "음성 처리와 채점 연동 후에는 실제 완료 기록만 이 목록에 저장됩니다.",
    "description": "components/speaking-notebook.tsx 음성 처리 연동 안내",
    "textFormat": "plain"
  }
];

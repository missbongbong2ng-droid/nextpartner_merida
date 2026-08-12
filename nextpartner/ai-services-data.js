/* ==========================================================================
   AI 취업지원 서비스 데이터
   ==========================================================================
   타입 정의 (참고용 — 프로젝트가 바닐라 JS라 실제로는 아래 상수로만 존재):

   type ServiceModalData = {
     id: string;                    // 'ocr' | 'resume' | 'photo' | 'career' | 'interview'
     icon: string;
     title: string;
     subtitle: string;              // 감성 카피 한 줄
     description: string[];         // 불릿 2~3개
     beforeAfter?: {                // 증명사진처럼 예시가 있는 경우만
       beforeLabel: string;
       afterLabel: string;
       beforeImage: string;
       afterImage: string;
     };
     socialProof?: string;          // "최근 결제 구직자 만족도 98%" 등
     price: {
       amount: number;
       unit: '월' | '회';
       credits?: string;            // "총 5회 생성권"
     };
     benefits: string[];
     ctaLabel: string;              // "11,000원 결제하기"
   };

   type PackageModalData = {
     id: string;
     icon: string;
     title: string;
     subtitle: string;
     description: string[];
     items: {
       serviceId: ServiceModalData['id'];   // AI_SERVICES 항목과 연결
       label: string;
       credits: string;
       standalonePrice: number;             // 단품으로 샀을 때 가격 (정가 합산용)
     }[];
     regularPrice: number;   // items[].standalonePrice 합계
     discountPrice: number;
     discountRate: number;   // %, (regularPrice-discountPrice)/regularPrice*100 반올림
     unit: '월';
     socialProof?: string;
     benefits: string[];
     ctaLabel: string;
   };
   ========================================================================== */

const AI_SERVICES = [
  {
    id: 'ocr',
    icon: '📄',
    title: 'AI OCR 이력서 인식',
    subtitle: '예전에 써둔 이력서, 사진 한 장으로 끝내요',
    description: [
      '예전에 쓰던 이력서나 재직증명서를 사진으로 찍거나 파일로 올리면 항목별로 자동 인식해요.',
      '타이핑이 익숙하지 않아도, 갖고 있는 문서만 올리면 바로 시작할 수 있어요.',
      '인식된 내용은 채팅으로 다시 확인하면서 고칠 수 있어요.'
    ],
    socialProof: '최근 30일 이용자 만족도 96%',
    price: { amount: 3300, unit: '회', credits: '1회 인식권' },
    benefits: ['사진 한 장으로 자동 입력', '타이핑 부담 없이 시작', '인식 후 채팅으로 바로 수정'],
    ctaLabel: '3,300원으로 인식하기'
  },
  {
    id: 'resume',
    icon: '📝',
    title: 'AI 자기소개서·이력서 완성형 작성',
    subtitle: '말재주가 없어도, 대화만으로 세련된 문서가 완성돼요',
    description: [
      '말재주가 없거나 컴퓨터 작성이 낯설어도 괜찮아요. AI가 던지는 간단한 질문 몇 개에 편하게 답만 하시면 돼요.',
      '그동안 쌓아오신 경력이 채용 담당자가 선호하는 세련된 이력서·자기소개서 문구로 자동 정리돼요.',
      '완성된 문장이 마음에 안 들면 채팅으로 바로 다시 요청할 수 있어요.'
    ],
    socialProof: '이용자 4명 중 3명이 서류 합격률이 올랐다고 답했어요',
    price: { amount: 9900, unit: '월', credits: '월 5회 생성권' },
    benefits: ['이력서 대화 내용 자동 연계', '강점·지원동기 문장화', '마음에 들 때까지 다시 요청 가능'],
    ctaLabel: '9,900원 결제하기'
  },
  {
    id: 'photo',
    icon: '📷',
    title: 'AI 증명사진',
    subtitle: '사진관 갈 필요 없이, 셀카 한 장이면 충분해요',
    description: [
      '따로 사진관을 찾아가서 비용을 들일 필요가 없어요. 휴대폰으로 평소처럼 찍은 셀카 한 장만 올려주세요.',
      'AI가 배경을 단정하게 정돈하고 고급스러운 정장 스타일을 합성해서, 신뢰감을 주는 이력서 전용 증명사진을 즉시 만들어드려요.',
      '마음에 드는 사진이 나올 때까지 다시 보정을 요청할 수 있어요.'
    ],
    beforeAfter: {
      beforeLabel: 'Before 셀카',
      afterLabel: 'After 증명사진',
      beforeImage: 'contents/ai/photo-before.png',
      afterImage: 'contents/ai/photo-after.jpg'
    },
    socialProof: 'AI 보정 이용자 92%가 실제 이력서에 바로 사용했어요',
    price: { amount: 11000, unit: '월', credits: '월 5회 보정권' },
    benefits: ['정장 톤 자동 보정', '배경 자동 합성', 'Before/After 비교 확인'],
    ctaLabel: '11,000원 결제하기'
  },
  {
    id: 'career',
    icon: '🧭',
    title: '경력 재구성 (AI로 직업찾기)',
    subtitle: '흩어진 경력, 하나의 강점으로 다시 묶어드려요',
    description: [
      '여러 직장, 여러 업무로 흩어져 보이는 경력을 분석해서 지원 가능한 새로운 직무를 추천해드립니다.',
      '같은 경력이라도 어떤 공고에 맞춰 강조할지 방향을 함께 잡아드려요.'
    ],
    socialProof: '베타 이용자 87%가 몰랐던 지원 가능 직무를 새로 발견했어요',
    price: { amount: 9900, unit: '월', credits: '월 5회 분석권' },
    benefits: ['흩어진 경력 자동 정리', '지원 가능 직무 추천', '공고별 강조 포인트 제안'],
    ctaLabel: '9,900원 결제하기'
  },
  {
    id: 'interview',
    icon: '🎤',
    title: 'AI 모의면접',
    subtitle: '실전 면접장 긴장감을 미리 연습해요',
    description: [
      '지원하시는 직무에 맞춰 AI가 예상 질문을 출제해요. (예: 시설관리·경비 직무라면 "이전 직장에서 발생한 노후 배관 긴급 고장 문제를 주도적으로 해결했던 노하우를 말씀해 주세요" 같은 질문이 나와요.)',
      '답변 음성을 분석해서 말하기 속도·자신감 점수 같은 지표와 함께, 어떤 문장을 보완하면 합격률이 높아지는지 시니어 눈높이에 맞춰 알려드려요.',
      '부족했던 답변은 다시 녹음해서 비교해볼 수 있어요.'
    ],
    socialProof: '모의면접 이용자 89%가 실제 면접이 덜 떨렸다고 답했어요',
    price: { amount: 11000, unit: '월', credits: '월 5회 모의면접권' },
    benefits: ['직무 맞춤 질문 제공', '실시간 AI 피드백', '답변 재녹음·비교'],
    ctaLabel: '11,000원 결제하기'
  }
];

/* 패키지 구성: resume + photo + career + interview (4종, 구독형만 묶음 — OCR은 회당 결제라 제외)
   정가 41,800원(=9,900+11,000+9,900+11,000) → 할인가 36,900원, 할인율 12% */
const AI_PACKAGE = {
  id: 'package',
  icon: '🎁',
  title: 'AI 프리미엄 패키지',
  subtitle: '이력서부터 면접까지, 4개를 한 번에 더 저렴하게',
  description: [
    '자소서, 증명사진, 경력 재구성, 모의면접을 각각 결제하는 것보다 저렴하게 한 번에 이용하세요.',
    '각 서비스 이용권은 월 5회씩 그대로 제공되고, 언제든 개별 서비스처럼 다시 요청할 수 있어요.'
  ],
  items: [
    { serviceId: 'resume', label: 'AI 자기소개서·이력서', credits: '월 5회 생성권', standalonePrice: 9900 },
    { serviceId: 'photo', label: 'AI 증명사진', credits: '월 5회 보정권', standalonePrice: 11000 },
    { serviceId: 'career', label: '경력 재구성', credits: '월 5회 분석권', standalonePrice: 9900 },
    { serviceId: 'interview', label: 'AI 모의면접', credits: '월 5회 모의면접권', standalonePrice: 11000 }
  ],
  regularPrice: 41800,
  discountPrice: 36900,
  discountRate: 12,
  unit: '월',
  socialProof: '패키지 이용자 91%가 개별 결제보다 만족스럽다고 답했어요',
  benefits: ['4개 서비스 월 5회씩 이용', '개별 결제 대비 12% 저렴', '서비스별로 원할 때만 골라 사용'],
  ctaLabel: '36,900원으로 시작하기'
};

/* ==========================================================================
   페이지 카피 데이터 — 컴포넌트 안에 하드코딩된 문구가 흩어지지 않도록,
   섹션별 고정 텍스트도 전부 여기로 모아둠.
   ========================================================================== */

/* HeroSection: 상단 네이비 배너 + STEP1 무료 초안 카드 */
const AI_HERO_COPY = {
  tag: 'NEXT PARTNER',
  title: '이력서부터<br>면접까지, 3분이면 준비끝',
  subtitle: '새로운 AI 기술로 손쉽게 나의 다음을 만들어보세요.',
  stepBadge: 'STEP 1 · 모든 기능의 시작',
  stepTitle: 'AI 이력서 초안',
  stepDesc: '항목별 폼에 하나하나 입력하는 대신, 챗봇이 순서대로 질문하고 답변을 대화로 입력해요. 대화가 끝나면 AI가 자동으로 이력서 초안을 완성해드립니다. 내용이 부족하면 챗봇에게 다시 물어보면서 자연스럽게 보완할 수 있어요.',
  chatMock: [
    { from: 'bot', text: '안녕하세요! 이력서 작성을 도와드릴게요. 가장 최근에 하셨던 일부터 편하게 말씀해주시겠어요?' },
    { from: 'me', text: '그린힐 관리사무소에서 경비원으로 2년 일했어요' },
    { from: 'bot', text: '좋아요 :) 그 일에서 주로 어떤 업무를 맡으셨나요?' }
  ]
};

/* ProcessSection: type ProcessStep = { step, label, title, tag?, desc, serviceId? }
   serviceId가 있으면 카드를 눌렀을 때 해당 ServiceDetailModal로 연결 */
const AI_PROCESS_STEPS = [
  { step: 1, label: 'STEP 1', title: '경력진단', tag: 'FREE', desc: '채팅·음성·OCR로 지금까지의 경력을 편하게 풀어놓으면 AI가 정리해드려요.', serviceId: null },
  { step: 2, label: 'STEP 2', title: '완성형 작성', tag: null, desc: '진단한 경력을 자소서·증명사진·경력 재구성까지 완성된 서류로 다듬어요.', serviceId: 'resume' },
  { step: 3, label: 'STEP 3', title: '실전대비', tag: null, desc: '완성된 서류를 바탕으로 AI 모의면접에서 실전처럼 미리 연습해요.', serviceId: 'interview' }
];

/* FaqSection: type FaqItem = { q, a } — a는 innerHTML로 렌더링되어 tel: 링크 등을 포함할 수 있음 */
const AI_FAQS = [
  {
    q: '이용권 생성 횟수는 어떻게 차감되나요?',
    a: '자소서·증명사진·경력재구성·모의면접은 매월 5회씩 생성권이 주어지고, AI가 결과를 만들어드릴 때마다 1회씩 차감돼요. 같은 결과물을 다시 다듬어달라고 요청하는 채팅은 횟수에 포함되지 않으니 마음에 들 때까지 편하게 요청하셔도 됩니다.'
  },
  {
    q: '남은 생성 횟수는 다음 달로 이월되나요?',
    a: '이월되지 않고 매월 초기화돼요. 대신 결제가 유지되는 동안 매달 5회가 다시 채워지니 필요할 때마다 편하게 이용하실 수 있어요.'
  },
  {
    q: '혼자 하기 어려우면 어떻게 하나요?',
    a: '전화로도 도와드려요. 고객센터 <a href="tel:1544-0000" style="color:var(--blue700); font-weight:700;">1544-0000</a>으로 연락 주시면 이력서 작성부터 서비스 이용까지 상담원이 옆에서 안내해드립니다.'
  }
];

function aiServiceById(id){ return AI_SERVICES.find(s => s.id === id); }

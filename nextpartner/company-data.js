const COMPANIES = [
  {
    id: 'greenhill',
    name: '그린힐 관리사무소',
    industry: '시설관리',
    image: 'contents/채용공고/관리사무소.jpeg',
    founded: '2019년 설립',
    employees: '직원 12명',
    address: '서울 강북구 수유동',
    intro: '아파트 및 상업시설의 시설관리를 전문으로 하는 관리업체입니다. 시니어 인력의 숙련된 경험을 적극 활용해 입주민에게 안정적인 관리 서비스를 제공하고 있습니다.',
    news: [
      { date: '2026.07', title: '그린힐 관리사무소, 강북구 신규 단지 3곳과 관리 계약 체결' },
      { date: '2026.05', title: '시니어 채용 확대 — 상반기 채용 인원 전년 대비 40% 증가' },
      { date: '2026.02', title: '입주민 만족도 조사 시설관리 부문 1위 선정' }
    ]
  },
  {
    id: 'happy-care',
    name: '행복요양원',
    industry: '요양·돌봄',
    image: 'contents/채용공고/요양원.png',
    founded: '2015년 설립',
    employees: '직원 32명',
    address: '경기 수원시 팔달구',
    intro: '어르신 한 분 한 분에게 맞춤 돌봄을 제공하는 요양기관입니다. 요양보호사 자격 취득 과정을 직접 지원하며, 경력 무관 채용을 원칙으로 하고 있습니다.',
    news: [
      { date: '2026.08', title: '행복요양원, 경기도 우수 요양기관 인증 획득' },
      { date: '2026.06', title: '무자격자 대상 요양보호사 자격증 취득 지원 프로그램 신설' }
    ]
  },
  {
    id: 'emart-mapo',
    name: '이마트 마포점',
    industry: '유통',
    image: 'contents/채용공고/대형마트.jpeg',
    founded: '2011년 개점',
    employees: '계산팀 18명',
    address: '서울 마포구 공덕동',
    intro: '지역 밀착형 대형마트로, 오전·오후 타임제 근무를 운영해 시니어와 경력단절자에게 유연한 근무 환경을 제공합니다.',
    news: [
      { date: '2026.07', title: '이마트 마포점, 시니어 친화 매장 인증 획득' },
      { date: '2026.04', title: '오전 타임 계산원 채용 확대 — 정기 채용으로 전환' }
    ]
  },
  {
    id: 'seoul-facility',
    name: '서울시설공단',
    industry: '공공기관',
    image: 'contents/채용공고/시설관리.jpg',
    founded: '1983년 설립',
    employees: '공원관리팀 20명',
    address: '서울 강서구 화곡동',
    intro: '서울시 산하 공공기관으로 공원 · 주차 · 체육시설 등을 관리합니다. 안정적인 고용 형태와 4대보험, 정기 상여금을 제공합니다.',
    news: [
      { date: '2026.08', title: '서울시설공단, 강서구 공원관리팀 정규직 채용 공고' },
      { date: '2026.03', title: '공원 이용객 만족도 조사 결과 발표 — 전년 대비 개선' }
    ]
  },
  {
    id: 'coupang-yongin',
    name: '쿠팡물류 용인센터',
    industry: '물류',
    image: 'contents/채용공고/물류센터.jpeg',
    founded: '2018년 가동',
    employees: '검수팀 다수',
    address: '경기 용인시 물류센터',
    intro: '수도권 최대 규모의 물류센터 중 하나로, 냉난방이 완비된 작업장에서 근무합니다. 일 단위 근무 신청이 가능해 원하는 날짜에만 일할 수 있습니다.',
    news: [
      { date: '2026.07', title: '쿠팡물류 용인센터, 무료 셔틀버스 노선 2개 신규 개설' },
      { date: '2026.05', title: '검수팀 인력 상시 채용 전환 — 대기 없이 즉시 근무 가능' }
    ]
  }
];

function companyById(id){ return COMPANIES.find(c => c.id === id); }

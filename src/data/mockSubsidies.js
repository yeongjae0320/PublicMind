export const MOCK_SUBSIDIES = [
  {
    id: "sub_001",
    title: "청년도약계좌",
    category: "금융/자산",
    target: "만 19세 ~ 34세 청년",
    income_req: "개인소득 7,500만원 이하, 가구소득 중위 180% 이하",
    amount: "최대 5,000만원 목돈 마련 지원 (정부기여금 월 최대 2.4만원)",
    tags: ["청년", "목돈마련", "금융"],
    match_score: 95,
    link: "https://ylaccount.kinfa.or.kr/"
  },
  {
    id: "sub_002",
    title: "청년월세 특별지원",
    category: "주거",
    target: "만 19세 ~ 34세 무주택 청년",
    income_req: "청년독립가구 중위소득 60% 이하",
    amount: "월 최대 20만원 (최대 12개월)",
    tags: ["청년", "주거비", "무주택"],
    match_score: 92,
    link: "https://www.bokjiro.go.kr/"
  },
  {
    id: "sub_003",
    title: "근로장려금 (반기/정기)",
    category: "생활안정",
    target: "근로소득, 사업소득, 종교인소득이 있는 가구",
    income_req: "단독가구 2,200만원, 홑벌이 3,200만원, 맞벌이 3,800만원 미만",
    amount: "최대 330만원 지급",
    tags: ["근로자", "현금지원", "저소득층"],
    match_score: 88,
    link: "https://www.hometax.go.kr/"
  },
  {
    id: "sub_004",
    title: "내일배움카드",
    category: "취업/교육",
    target: "구직자, 재직자, 자영업자 등 (일부 제외)",
    income_req: "제한 없음 (단, 대기업 재직자 등 일부 소득/연매출 제한 있음)",
    amount: "기본 300만원 ~ 최대 500만원 훈련비 지원",
    tags: ["취업", "교육비", "직장인", "구직자"],
    match_score: 98,
    link: "https://www.hrd.go.kr/"
  },
  {
    id: "sub_005",
    title: "서울시 청년수당",
    category: "생활안정",
    target: "서울 거주 만 19세 ~ 34세 미취업 청년",
    income_req: "중위소득 150% 이하",
    amount: "월 50만원 (최대 6개월)",
    tags: ["청년", "서울시", "미취업"],
    match_score: 45,
    link: "https://youth.seoul.go.kr/"
  },
  {
    id: "sub_006",
    title: "소상공인 대환대출 지원",
    category: "금융/자산",
    target: "7% 이상 고금리 대출을 이용 중인 소상공인",
    income_req: "NICE평가정보 개인신용평점 839점 이하",
    amount: "최대 5,000만원, 연 4.5% 고정금리 10년 분할상환",
    tags: ["소상공인", "자영업", "대출"],
    match_score: 10,
    link: "https://www.sbiz.or.kr/"
  }
];

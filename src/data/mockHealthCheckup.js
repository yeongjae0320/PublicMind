export const CHECKUP_TIPS = [
  {
    category: "검진 전날",
    title: "금식 시간 지키기",
    desc: "검진 전날 저녁 식사는 7~8시 이전에 가볍게 드시고, 밤 9시 이후부터는 절대 금식해야 합니다. (물, 껌, 사탕, 담배 등 모두 금지)"
  },
  {
    category: "검진 전날",
    title: "음주 및 과로 피하기",
    desc: "음주, 과식, 지나친 피로는 혈압, 간 기능, 혈당 등의 검사 결과에 큰 영향을 미치므로 피해야 합니다."
  },
  {
    category: "검진 당일",
    title: "약 복용 주의사항",
    desc: "혈압약은 이른 아침 소량의 물과 함께 드셔도 무방하나, 당뇨약(인슐린 포함)은 금식 상태에서 복용 시 저혈당 쇼크 위험이 있어 절대 드시면 안 됩니다."
  },
  {
    category: "검진 당일",
    title: "채변 안내 (대장암 검진 대상자)",
    desc: "대장암 검진(분변잠혈검사) 대상자는 검진 전날이나 당일 아침에 강낭콩 크기만큼의 대변을 채취하여 서늘한 곳에 보관 후 제출하세요."
  },
  {
    category: "여성 수검자",
    title: "생리 기간 피하기",
    desc: "생리 중에는 소변 및 부인과 검사 결과에 영향을 줄 수 있으므로, 생리 끝나고 3~7일 이후에 검진을 받는 것이 가장 좋습니다."
  },
  {
    category: "여성 수검자",
    title: "임신 가능성 확인",
    desc: "임신 중이거나 임신 가능성이 있는 경우, 방사선 노출(X-ray, CT 등) 및 수면 내시경이 태아에 영향을 줄 수 있으므로 반드시 의료진에게 미리 알려야 합니다."
  }
];

// 건보공단 6대 암검진 기준 가이드
export const CANCER_CRITERIA = [
  {
    id: 'stomach',
    name: '위암',
    icon: 'stomach', // placeholder for icon name
    targetGender: ['M', 'F'],
    minAge: 40,
    cycle: 2,
    desc: '만 40세 이상 남녀는 2년마다 위내시경 검사를 받습니다.',
    note: '위장조영검사도 가능하나 위내시경이 권장됩니다.'
  },
  {
    id: 'colon',
    name: '대장암',
    icon: 'colon',
    targetGender: ['M', 'F'],
    minAge: 50,
    cycle: 1,
    desc: '만 50세 이상 남녀는 1년마다 분변잠혈검사(대변검사)를 받습니다.',
    note: '대변검사 결과 양성(피가 섞여 나옴)일 경우에만 대장내시경 검사가 무료로 지원됩니다.'
  },
  {
    id: 'liver',
    name: '간암',
    icon: 'liver',
    targetGender: ['M', 'F'],
    minAge: 40,
    cycle: 0.5,
    desc: '만 40세 이상 고위험군(B형/C형 간염 보균자, 간경변증 환자 등)은 1년에 2회(상/하반기) 간 초음파 및 혈액 검사를 받습니다.',
    note: '해당자는 고위험군 진단 후 공단에 등록된 분들에 한합니다.'
  },
  {
    id: 'breast',
    name: '유방암',
    icon: 'breast',
    targetGender: ['F'],
    minAge: 40,
    cycle: 2,
    desc: '만 40세 이상 여성은 2년마다 유방촬영 검사를 받습니다.',
    note: '유방 초음파는 본인 부담으로 추가 가능합니다.'
  },
  {
    id: 'cervical',
    name: '자궁경부암',
    icon: 'cervical',
    targetGender: ['F'],
    minAge: 20,
    cycle: 2, // Applies even/odd rule
    desc: '만 20세 이상 여성은 2년마다(홀수/짝수 연도 출생자 교대) 자궁경부세포검사를 받습니다.',
    note: '자궁적출술을 받았거나 성경험이 없는 경우 검진 전 의사와 상담하세요.'
  },
  {
    id: 'lung',
    name: '폐암',
    icon: 'lung',
    targetGender: ['M', 'F'],
    minAge: 54,
    maxAge: 74,
    cycle: 2,
    desc: '만 54세 ~ 74세 중 30갑년 이상 흡연력을 가진 고위험군은 2년마다 저선량 흉부 CT 검사를 받습니다.',
    note: '최근 2년 내 국가건강검진 문진표 등으로 흡연력이 확인된 경우 대상이 됩니다.'
  }
];

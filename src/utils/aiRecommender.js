const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const fetchAIRecommendations = async (conditions) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API Key is missing.');
  }

  // 매핑 함수들
  const jobMap = { student: '학생', employee: '직장인', business: '자영업/사업', freelancer: '프리랜서', none: '무직', other: '기타' };
  const carMap = { yes: '자차 있음', no: '자차 없음(대중교통 이용)' };
  const childrenMap = { yes: '자녀 있음', no: '자녀 없음' };

  const prompt = `
사용자의 맞춤 조건을 바탕으로 정부/지자체 추천 복지 정책과 최적의 부동산/입지(지역)를 추천해 주세요.
반드시 아래 JSON 형식으로만 응답해 주시고, 다른 말은 하지 마세요 (마크다운 포맷팅도 제외).

[사용자 조건]
- 사는 동네(거주지): ${conditions.location || '미등록'}
- 관심 지역(희망 이주/투자 지역): ${conditions.interestedLocation || '미등록'}
- 직업: ${jobMap[conditions.job] || conditions.job || '미등록'}
- 자차 유무: ${carMap[conditions.car] || conditions.car || '미등록'}
- 자녀 유무: ${childrenMap[conditions.children] || conditions.children || '미등록'}
- 관심사/취미: ${conditions.hobby || '미등록'}

[응답 JSON 형식]
{
  "welfare": [
    { 
      "title": "추천 복지/지원금 이름", 
      "target": "지원 대상 (예: 무주택 청년, 프리랜서 등)",
      "amount": "지원 내용/금액 (예: 월 20만원, 최대 5천만원 대출 등)",
      "reason": "추천 사유 (1줄)" 
    }
  ],
  "realEstate": [
    { 
      "title": "추천 입지/주택 (예: 성수동 청년주택)", 
      "transport": "교통/인프라 (예: 2호선 도보 5분)",
      "price": "예상 시세/보증금 (예: 보증금 5천/월 60)",
      "reason": "추천 사유 (1줄)" 
    }
  ],
  "lifestyle": [
    {
      "title": "실제 존재하는 여가/생활 인프라의 정확한 명칭 (예: 서울대공원 캠핑장, 스타벅스 망원한강공원점, 국립현대미술관 서울)",
      "target": "관련 조건 (예: 자녀 있음, 자차 보유 등)",
      "amount": "실제 주소 및 상세 혜택/정보 (예: 마포구 마포나루길 467, 주말 무료 개방)",
      "reason": "추천 사유 (1줄)"
    }
  ]
}

주의사항:
1. 복지, 부동산, 생활 인프라 모두 **실제로 존재하는 정확한 명칭과 실존하는 장소/제도**만 추천하세요. (예: "근처 공원" ❌ -> "망원 한강공원" ⭕, "상암동 아파트" ❌ -> "상암월드컵파크 4단지" ⭕)
2. 사용자 조건에 맞게 각각 2~3개씩 추천해 주세요.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();
    let resultText = data.choices[0].message.content.trim();
    
    // 안전한 JSON 파싱 (마크다운 블록 제거)
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(resultText);

  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    throw error;
  }
};

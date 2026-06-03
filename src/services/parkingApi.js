const NATIONAL_API_KEY = '7a3edd922501de268c179c92ad1a8dadba4c961d8bec81c71bf969280acf3d99';

// 주차장 이름을 정규화하여 매칭 확률을 높이는 함수
export const normalizeParkingName = (name) => {
  if (!name) return '';
  return name
    .replace(/\s+/g, '') // 모든 공백 제거
    .replace(/\(시\)/g, '') // (시) 제거
    .replace(/\(구\)/g, '') // (구) 제거
    .replace(/공영주차장/g, '') // 공영주차장 단어 제거
    .replace(/주차장/g, '') // 주차장 단어 제거
    .trim();
};

export const fetchNationalRealtimeParking = async () => {
  try {
    const params = new URLSearchParams({
      serviceKey: NATIONAL_API_KEY,
      numOfRows: '1000',
      pageNo: '1',
      _type: 'json'
    });

    const url = `https://apis.data.go.kr/B553881/Parking/PrkRealtimeInfo?${params.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
        if (response.status === 403 || response.status === 502 || response.status === 503) {
            throw new Error('API_SYNCING');
        }
        throw new Error(`HTTP Error: ${response.status}`);
    }

    const text = await response.text();
    if (text.includes('<OpenAPI_ServiceResponse>') || text.startsWith('<')) {
        throw new Error('API_SYNCING');
    }

    const data = JSON.parse(text);
    if (data.response?.header?.resultCode === '00' || data.response?.header?.resultCode === '0000') {
      let items = data.response.body.items || [];
      if (items && items.item) {
        items = items.item;
      }
      return Array.isArray(items) ? items : [items];
    }
    
    return [];
  } catch (error) {
    console.error("전국 주차장 실시간 API 연동 실패:", error);
    if (error.message === 'API_SYNCING') {
      throw error;
    }
    return [];
  }
};

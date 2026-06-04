const API_KEY = '7a3edd922501de268c179c92ad1a8dadba4c961d8bec81c71bf969280acf3d99';

// Sido name mapping for Kakao Geocoder
const sidoMapping = {
  '서울특별시': '서울',
  '부산광역시': '부산',
  '대구광역시': '대구',
  '인천광역시': '인천',
  '광주광역시': '광주',
  '대전광역시': '대전',
  '울산광역시': '울산',
  '세종특별자치시': '세종',
  '경기도': '경기',
  '강원도': '강원',
  '강원특별자치도': '강원',
  '충청북도': '충북',
  '충청남도': '충남',
  '전라북도': '전북',
  '전북특별자치도': '전북',
  '전라남도': '전남',
  '경상북도': '경북',
  '경상남도': '경남',
  '제주특별자치도': '제주'
};

const getGradeTextAndColor = (grade, type) => {
  const g = parseInt(grade);
  if (isNaN(g)) return { status: '정보없음', color: '#94a3b8', gradient: 'linear-gradient(135deg, #cbd5e1, #94a3b8)' };
  
  switch(g) {
    case 1: return { status: '좋음', color: '#3b82f6', gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)' };
    case 2: return { status: '보통', color: '#10b981', gradient: 'linear-gradient(135deg, #34d399, #10b981)' };
    case 3: return { status: '나쁨', color: '#f59e0b', gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)' };
    case 4: return { status: '매우나쁨', color: '#ef4444', gradient: 'linear-gradient(135deg, #f87171, #ef4444)' };
    default: return { status: '정보없음', color: '#94a3b8', gradient: 'linear-gradient(135deg, #cbd5e1, #94a3b8)' };
  }
};

export const fetchFineDust = async (sidoFullName, guName, dongName) => {
  try {
    const sidoName = sidoMapping[sidoFullName] || '서울';
    const url = `${import.meta.env.DEV ? "/api/health" : "https://apis.data.go.kr"}/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?serviceKey=${API_KEY}&returnType=json&numOfRows=100&pageNo=1&sidoName=${encodeURIComponent(sidoName)}&ver=1.0`;
    
    // Add 6-second timeout to prevent infinite hanging if API server is down
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    const json = await response.json();
    
    const items = json?.response?.body?.items || [];
    if (items.length === 0) throw new Error("No data found");

    // Try to find exact match by Gu or Dong
    let station = items.find(item => item.stationName === guName || item.stationName === dongName || guName.includes(item.stationName));
    
    // Fallback to the first station if no match
    if (!station) station = items[0];

    return {
      stationName: station.stationName,
      time: station.dataTime || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      pm10: { value: station.pm10Value || '-', ...getGradeTextAndColor(station.pm10Grade) },
      pm25: { value: station.pm25Value || '-', ...getGradeTextAndColor(station.pm25Grade) },
      o3: { value: station.o3Value || '-', ...getGradeTextAndColor(station.o3Grade) },
      no2: { value: station.no2Value || '-', ...getGradeTextAndColor(station.no2Grade) },
      co: { value: station.coValue || '-', ...getGradeTextAndColor(station.coGrade) },
      so2: { value: station.so2Value || '-', ...getGradeTextAndColor(station.so2Grade) },
      khai: { value: station.khaiValue || '-', ...getGradeTextAndColor(station.khaiGrade) },
      sidoName: sidoName, // Return the mapped Sido name
      regionalData: items.map(item => ({
        stationName: item.stationName,
        pm10Value: parseInt(item.pm10Value) || 0,
        ...getGradeTextAndColor(item.pm10Grade)
      })).filter(item => item.pm10Value > 0).sort((a, b) => a.pm10Value - b.pm10Value)
    };
  } catch (error) {
    console.error("Failed to fetch fine dust data:", error);
    throw error;
  }
};

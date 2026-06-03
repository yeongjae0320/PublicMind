// src/services/aiTools.js

// Function definitions for OpenAI Tool Calling
export const AI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'find_disaster_shelters',
      description: '지정된 좌표(위도, 경도) 주변의 지진해일 대피소 목록을 찾습니다.',
      parameters: {
        type: 'object',
        properties: {
          lat: {
            type: 'number',
            description: '위도 (예: 35.1586)'
          },
          lng: {
            type: 'number',
            description: '경도 (예: 129.1603)'
          }
        },
        required: ['lat', 'lng']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_traffic_info',
      description: '지정된 좌표(위도, 경도) 주변의 실시간 도로 교통 상황(속도, 혼잡도)을 조회합니다.',
      parameters: {
        type: 'object',
        properties: {
          lat: {
            type: 'number',
            description: '위도'
          },
          lng: {
            type: 'number',
            description: '경도'
          }
        },
        required: ['lat', 'lng']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'find_pharmacy',
      description: '지정된 좌표(위도, 경도) 주변의 실시간 운영중인 약국을 찾습니다.',
      parameters: {
        type: 'object',
        properties: {
          lat: {
            type: 'number',
            description: '위도'
          },
          lng: {
            type: 'number',
            description: '경도'
          }
        },
        required: ['lat', 'lng']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_air_quality',
      description: '지정된 행정구역의 실시간 미세먼지 및 대기질 정보를 조회합니다.',
      parameters: {
        type: 'object',
        properties: {
          sidoName: {
            type: 'string',
            description: '시/도 이름 (예: 서울, 부산, 경기 등)'
          },
          guName: {
            type: 'string',
            description: '구 이름 (예: 강남구, 해운대구)'
          }
        },
        required: ['sidoName']
      }
    }
  }
];

export async function executeAiTool(toolCall) {
  const { name, arguments: argsString } = toolCall.function;
  let args;
  try {
    args = JSON.parse(argsString);
  } catch (e) {
    return "파라미터 파싱 오류입니다.";
  }

  if (name === 'find_disaster_shelters') {
    try {
      const apiKey = '11XW1SUZ8097Q1CD'; 
      const minX = args.lng - 0.05;
      const maxX = args.lng + 0.05;
      const minY = args.lat - 0.05;
      const maxY = args.lat + 0.05;
      
      const url = `https://www.safetydata.go.kr/V2/api/DSSP-IF-10944?serviceKey=${apiKey}&pageNo=1&numOfRows=10&returnType=json&startLot=${minX}&endLot=${maxX}&startLat=${minY}&endLat=${maxY}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('API Response Error');
      const data = await response.json();
      
      let items = data?.body || data?.response?.body?.items || [];
      if (!Array.isArray(items)) items = [items];
      
      if (items.length === 0) {
        return "해당 위치 주변에 지진해일 대피소가 없습니다.";
      }

      const topResults = items.slice(0, 5).map(s => ({
        이름: s.SHNT_PLACE_NM || '알수없음',
        주소: s.RN_DTL_ADRES || '주소 정보 없음',
        수용인원: s.PSBL_NMPR || '미상'
      }));

      return JSON.stringify(topResults, null, 2);
    } catch (e) {
      return `대피소 검색 중 오류 발생: ${e.message}`;
    }
  }

  if (name === 'get_traffic_info') {
    try {
      const minX = args.lng - 0.05;
      const maxX = args.lng + 0.05;
      const minY = args.lat - 0.05;
      const maxY = args.lat + 0.05;
      
      const TRAFFIC_API_KEY = '32bd2cd1584342e29277620f5a000ca8';
      const url = `https://openapi.its.go.kr:9443/trafficInfo?apiKey=${TRAFFIC_API_KEY}&type=all&drcType=all&minX=${minX.toFixed(6)}&maxX=${maxX.toFixed(6)}&minY=${minY.toFixed(6)}&maxY=${maxY.toFixed(6)}&getType=json`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('API Response Error');
      const data = await response.json();
      
      const items = data?.body?.items || [];
      
      if (items.length === 0) {
        return "해당 위치 주변의 도로 소통 정보가 없습니다.";
      }

      const topResults = items.slice(0, 5).map(s => ({
        도로명: s.roadName,
        혼잡도: s.speed < 20 ? '혼잡' : (s.speed < 40 ? '서행' : '원활'),
        평균속도: `${s.speed}km/h`,
      }));

      return JSON.stringify(topResults, null, 2);
    } catch (e) {
      return `교통 정보 검색 중 오류 발생: ${e.message}`;
    }
  }

  if (name === 'find_pharmacy') {
    try {
      const API_KEY = '7a3edd922501de268c179c92ad1a8dadba4c961d8bec81c71bf969280acf3d99';
      const url = `https://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyLcinfoInqire?serviceKey=${API_KEY}&WGS84_LON=${args.lng}&WGS84_LAT=${args.lat}&pageNo=1&numOfRows=10`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('API Response Error');
      const text = await response.text();
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const items = Array.from(xmlDoc.getElementsByTagName("item"));
      
      if (items.length === 0) {
        return "해당 위치 주변에 운영중인 약국이 없습니다.";
      }

      const topResults = items.slice(0, 5).map((item) => {
        const getText = (tagName) => {
          const node = item.getElementsByTagName(tagName)[0];
          return node ? node.textContent : '';
        };
        return {
          약국명: getText('dutyName'),
          주소: getText('dutyAddr'),
          전화번호: getText('dutyTel1'),
          거리: `${parseFloat(getText('distance')).toFixed(1)}km`
        };
      });

      return JSON.stringify(topResults, null, 2);
    } catch (e) {
      return `약국 검색 중 오류 발생: ${e.message}`;
    }
  }

  if (name === 'get_air_quality') {
    try {
      const API_KEY = '7a3edd922501de268c179c92ad1a8dadba4c961d8bec81c71bf969280acf3d99';
      const sidoName = args.sidoName;
      const url = `https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?serviceKey=${API_KEY}&returnType=json&numOfRows=100&pageNo=1&sidoName=${encodeURIComponent(sidoName)}&ver=1.0`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('API Response Error');
      const data = await response.json();
      
      const items = data?.response?.body?.items || [];
      
      if (items.length === 0) {
        return "해당 지역의 대기질 정보가 없습니다.";
      }

      // 구 이름이 있으면 필터링 시도
      let targetStation = items[0];
      if (args.guName) {
        const found = items.find(item => item.stationName.includes(args.guName) || args.guName.includes(item.stationName));
        if (found) targetStation = found;
      }

      const getGrade = (val) => {
        const g = parseInt(val);
        if (g === 1) return '좋음';
        if (g === 2) return '보통';
        if (g === 3) return '나쁨';
        if (g === 4) return '매우나쁨';
        return '알수없음';
      };

      const result = {
        측정소: targetStation.stationName,
        미세먼지_PM10: `${targetStation.pm10Value} (${getGrade(targetStation.pm10Grade)})`,
        초미세먼지_PM25: `${targetStation.pm25Value} (${getGrade(targetStation.pm25Grade)})`,
        통합대기환경수치: `${targetStation.khaiValue} (${getGrade(targetStation.khaiGrade)})`,
        측정시간: targetStation.dataTime
      };

      return JSON.stringify(result, null, 2);
    } catch (e) {
      return `대기질 정보 검색 중 오류 발생: ${e.message}`;
    }
  }

  return "알 수 없는 도구(Tool) 호출입니다.";
}

const API_KEY = '7a3edd922501de268c179c92ad1a8dadba4c961d8bec81c71bf969280acf3d99';

// XML Text Parsing Helper
const getText = (xmlNode, tagName) => {
  if (!xmlNode) return '';
  const node = xmlNode.getElementsByTagName(tagName)[0];
  return node ? node.textContent : '';
};

// Parse XML Response into a standard array of objects
const parseHealthXml = (xmlString, type) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const items = Array.from(xmlDoc.getElementsByTagName("item"));
  
  return items.map((item, index) => {
    let distanceKm = parseFloat(getText(item, 'distance')) || 0;
    let distanceStr = distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`;

    return {
      id: `${type}_${index}_${getText(item, 'hpid')}`,
      name: getText(item, 'dutyName'),
      address: getText(item, 'dutyAddr'),
      phone: getText(item, 'dutyTel1'),
      lat: parseFloat(getText(item, 'latitude') || getText(item, 'wgs84Lat')),
      lng: parseFloat(getText(item, 'longitude') || getText(item, 'wgs84Lon')),
      distance: distanceStr,
      distanceValue: distanceKm,
      type: type, // '약국', '병원', '응급실'
      isOpen: true, // Simplified for UI
      operatingHours: '자세한 운영시간은 전화 문의' 
    };
  }).sort((a, b) => a.distanceValue - b.distanceValue);
};

export const fetchPharmacies = async (lat, lng) => {
  try {
    const url = `${import.meta.env.DEV ? "/api/health" : "https://apis.data.go.kr"}/B552657/ErmctInsttInfoInqireService/getParmacyLcinfoInqire?serviceKey=${API_KEY}&WGS84_LON=${lng}&WGS84_LAT=${lat}&pageNo=1&numOfRows=30`;
    const response = await fetch(url);
    const text = await response.text();
    return parseHealthXml(text, '약국');
  } catch (error) {
    console.error("Failed to fetch pharmacies:", error);
    return [];
  }
};

export const fetchHospitals = async (lat, lng) => {
  try {
    const url = `${import.meta.env.DEV ? "/api/health" : "https://apis.data.go.kr"}/B552657/HsptlAsembySearchService/getHsptlMdcncLcinfoInqire?serviceKey=${API_KEY}&WGS84_LON=${lng}&WGS84_LAT=${lat}&pageNo=1&numOfRows=30`;
    const response = await fetch(url);
    const text = await response.text();
    return parseHealthXml(text, '병·의원');
  } catch (error) {
    console.error("Failed to fetch hospitals:", error);
    return [];
  }
};

export const fetchEmergencyRooms = async (lat, lng) => {
  try {
    const url = `${import.meta.env.DEV ? "/api/health" : "https://apis.data.go.kr"}/B552657/ErmctInfoInqireService/getEgytLcinfoInqire?serviceKey=${API_KEY}&WGS84_LON=${lng}&WGS84_LAT=${lat}&pageNo=1&numOfRows=30`;
    const response = await fetch(url);
    const text = await response.text();
    return parseHealthXml(text, '응급실');
  } catch (error) {
    console.error("Failed to fetch emergency rooms:", error);
    return [];
  }
};

export const fetchTopHospitals = async (lat, lng, keyword = '') => {
  try {
    // 건강보험심사평가원 병원정보서비스 (getHospBasisList)
    // 위치 기반 쿼리가 실패하는 경우를 대비해, 전국 기본 30개를 가져오고 프론트에서 임의 좌표로 뿌립니다.
    const url = `${import.meta.env.DEV ? "/api/health" : "https://apis.data.go.kr"}/B551182/hospInfoServicev2/getHospBasisList?serviceKey=${API_KEY}&pageNo=1&numOfRows=30`;
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    const items = Array.from(xmlDoc.getElementsByTagName("item"));
    if (items.length === 0) {
      console.warn("API returned 0 items, using fallback mock data.");
      return [
        {
          id: 'mock_1',
          name: '서울대학교병원',
          address: '서울특별시 종로구 대학로 101',
          phone: '1588-5700',
          lat: lat + 0.01,
          lng: lng + 0.01,
          distance: '1.2km',
          distanceValue: 1.2,
          type: '상급종합',
          isOpen: true,
          operatingHours: '09:00 - 18:00',
          isFirstGrade: true,
          specialties: ['내과', '외과']
        },
        {
          id: 'mock_2',
          name: '삼성서울병원',
          address: '서울특별시 강남구 일원로 81',
          phone: '1599-3114',
          lat: lat - 0.01,
          lng: lng - 0.01,
          distance: '2.5km',
          distanceValue: 2.5,
          type: '상급종합',
          isOpen: true,
          operatingHours: '09:00 - 18:00',
          isFirstGrade: true,
          specialties: ['외과', '소아청소년과']
        },
        {
          id: 'mock_3',
          name: '서울아산병원',
          address: '서울특별시 송파구 올림픽로43길 88',
          phone: '1688-7575',
          lat: lat + 0.02,
          lng: lng - 0.01,
          distance: '3.0km',
          distanceValue: 3.0,
          type: '상급종합',
          isOpen: true,
          operatingHours: '08:30 - 17:30',
          isFirstGrade: true,
          specialties: ['내과', '이비인후과', '정형외과']
        }
      ];
    }
    
    return items.map((item, index) => {
      let distanceKm = parseFloat(getText(item, 'distance')) || 0;
      if (distanceKm > 100) distanceKm = distanceKm / 1000; // Convert meters to km if needed
      let distanceStr = distanceKm > 0 ? (distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`) : '';
      
      const typeName = getText(item, 'clCdNm') || '일반병원'; 
      
      return {
        id: `top_hosp_${index}_${getText(item, 'ykiho')}`,
        name: getText(item, 'yadmNm'), 
        address: getText(item, 'addr'), 
        phone: getText(item, 'telno'), 
        lat: parseFloat(getText(item, 'YPos') || getText(item, 'yPos') || getText(item, 'latitude')) || (lat + (Math.random() - 0.5) * 0.05),
        lng: parseFloat(getText(item, 'XPos') || getText(item, 'xPos') || getText(item, 'longitude')) || (lng + (Math.random() - 0.5) * 0.05),
        distance: distanceStr,
        distanceValue: distanceKm,
        type: typeName,
        isOpen: true,
        operatingHours: '자세한 운영시간은 전화 문의',
        isFirstGrade: true,
        specialties: ['내과', '외과', '정형외과', '소아청소년과', '이비인후과'].sort(() => 0.5 - Math.random()).slice(0, 2)
      };
    }); // Removed the .filter
  } catch (error) {
    console.error("Failed to fetch top hospitals:", error);
    return [];
  }
};

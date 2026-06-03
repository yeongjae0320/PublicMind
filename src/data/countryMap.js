export const COUNTRY_COORDS = {
  "JP": { lat: 36.2048, lng: 138.2529, name: "일본" },
  "CN": { lat: 35.8617, lng: 104.1954, name: "중국" },
  "US": { lat: 37.0902, lng: -95.7129, name: "미국" },
  "FR": { lat: 46.2276, lng: 2.2137, name: "프랑스" },
  "GB": { lat: 55.3781, lng: -3.4360, name: "영국" },
  "DE": { lat: 51.1657, lng: 10.4515, name: "독일" },
  "IT": { lat: 41.8719, lng: 12.5674, name: "이탈리아" },
  "RU": { lat: 61.5240, lng: 105.3188, name: "러시아" },
  "UA": { lat: 48.3794, lng: 31.1656, name: "우크라이나" },
  "IL": { lat: 31.0461, lng: 34.8516, name: "이스라엘" },
  "PS": { lat: 31.9522, lng: 35.2332, name: "팔레스타인" },
  "IR": { lat: 32.4279, lng: 53.6880, name: "이란" },
  "IQ": { lat: 33.2232, lng: 43.6793, name: "이라크" },
  "AF": { lat: 33.9391, lng: 67.7100, name: "아프가니스탄" },
  "SY": { lat: 34.8021, lng: 38.9968, name: "시리아" },
  "TR": { lat: 38.9637, lng: 35.2433, name: "튀르키예" },
  "IN": { lat: 20.5937, lng: 78.9629, name: "인도" },
  "PH": { lat: 12.8797, lng: 121.7740, name: "필리핀" },
  "ID": { lat: -0.7893, lng: 113.9213, name: "인도네시아" },
  "TH": { lat: 15.8700, lng: 100.9925, name: "태국" },
  "VN": { lat: 14.0583, lng: 108.2772, name: "베트남" },
  "MY": { lat: 4.2105, lng: 101.9758, name: "말레이시아" },
  "SG": { lat: 1.3521, lng: 103.8198, name: "싱가포르" },
  "AU": { lat: -25.2744, lng: 133.7751, name: "호주" },
  "NZ": { lat: -40.9006, lng: 174.8860, name: "뉴질랜드" },
  "BR": { lat: -14.2350, lng: -51.9253, name: "브라질" },
  "AR": { lat: -38.4161, lng: -63.6167, name: "아르헨티나" },
  "MX": { lat: 23.6345, lng: -102.5528, name: "멕시코" },
  "CA": { lat: 56.1304, lng: -106.3468, name: "캐나다" },
  "ZA": { lat: -30.5595, lng: 22.9375, name: "남아프리카공화국" },
  "EG": { lat: 26.8206, lng: 30.8025, name: "이집트" },
  "SA": { lat: 23.8859, lng: 45.0792, name: "사우디아라비아" },
  "AE": { lat: 23.4241, lng: 53.8478, name: "아랍에미리트" },
  "ES": { lat: 40.4637, lng: -3.7492, name: "스페인" },
  "MM": { lat: 21.9162, lng: 95.9560, name: "미얀마" },
  "KP": { lat: 40.3399, lng: 127.5101, name: "북한" },
  "TW": { lat: 23.6978, lng: 120.9605, name: "대만" },
  "KR": { lat: 35.9078, lng: 127.7669, name: "대한민국" }
};

export function getCoordinates(isoCode, countryName) {
  if (COUNTRY_COORDS[isoCode]) {
    return COUNTRY_COORDS[isoCode];
  }
  
  // Fallback: search by name
  for (const key in COUNTRY_COORDS) {
    if (COUNTRY_COORDS[key].name === countryName || countryName.includes(COUNTRY_COORDS[key].name)) {
      return COUNTRY_COORDS[key];
    }
  }
  
  // Return random coordinates somewhat near equator if not found, 
  // or a hash based on name to keep it deterministic
  let hash = 0;
  for (let i = 0; i < countryName.length; i++) {
    hash = countryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const lat = (hash % 120) - 60; // -60 to 60
  const lng = ((hash >> 8) % 360) - 180; // -180 to 180
  
  return { lat, lng, name: countryName };
}

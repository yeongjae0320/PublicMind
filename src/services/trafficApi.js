const TRAFFIC_API_KEY = '32bd2cd1584342e29277620f5a000ca8';

export const fetchTrafficInfo = async (bounds) => {
  if (!bounds) return [];
  const { minX, maxX, minY, maxY } = bounds;
  try {
    const params = new URLSearchParams({
      apiKey: TRAFFIC_API_KEY,
      type: 'all', // all, ex, its
      routeNo: '', // Optional if type is all
      drcType: 'all',
      minX: minX.toFixed(6),
      maxX: maxX.toFixed(6),
      minY: minY.toFixed(6),
      maxY: maxY.toFixed(6),
      getType: 'json'
    });

    // trafficInfo API
    const url = `https://openapi.its.go.kr:9443/trafficInfo?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();
    return data?.body?.items || [];
  } catch (error) {
    console.error("Traffic Info Error:", error);
    return [];
  }
};

export const fetchEventInfo = async (bounds) => {
  if (!bounds) return [];
  const { minX, maxX, minY, maxY } = bounds;
  try {
    const params = new URLSearchParams({
      apiKey: TRAFFIC_API_KEY,
      type: 'all', 
      eventType: 'all', // all, cor, acc, wea, ete, dis, etc
      minX: minX.toFixed(6),
      maxX: maxX.toFixed(6),
      minY: minY.toFixed(6),
      maxY: maxY.toFixed(6),
      getType: 'json'
    });

    // eventInfo API
    const url = `https://openapi.its.go.kr:9443/eventInfo?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();
    return data?.body?.items || [];
  } catch (error) {
    console.error("Event Info Error:", error);
    return [];
  }
};

export const fetchCctvInfo = async (bounds) => {
  if (!bounds) return [];
  const { minX, maxX, minY, maxY } = bounds;
  try {
    const params = new URLSearchParams({
      apiKey: TRAFFIC_API_KEY,
      type: 'all', // all, ex, its
      cctvType: '2', // 1: HLS, 2: mp4, 3: image
      minX: minX.toFixed(6),
      maxX: maxX.toFixed(6),
      minY: minY.toFixed(6),
      maxY: maxY.toFixed(6),
      getType: 'json'
    });

    // cctvInfo API
    const url = `https://openapi.its.go.kr:9443/cctvInfo?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();
    
    // cctvInfo returns slightly different structure based on the sample:
    // response.data instead of response.body.items ?
    // The sample XML: <response><coordtype>1</coordtype><datacount>20</datacount><data>...</data>...
    // In JSON it's probably response.response.data array
    // Let's assume standard JSON response for its: data.response.data
    
    if (data?.response?.data) {
        return Array.isArray(data.response.data) ? data.response.data : [data.response.data];
    }
    
    return data?.data || []; 
  } catch (error) {
    console.error("CCTV Info Error:", error);
    return [];
  }
};

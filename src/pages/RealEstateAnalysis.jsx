import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, TrendingUp, AlertCircle, Building, DollarSign } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

import { REGIONS } from '../utils/regions';

function RealEstateAnalysis() {
  const [sido, setSido] = useState('서울');
  const [lawdCd, setLawdCd] = useState('11680'); // 기본 강남구
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // 기본 조회월: 현재 달의 이전 달 (실거래가 신고 기한 감안)
  const getPrevMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}${mm}`;
  };
  
  const [dealYmd, setDealYmd] = useState(getPrevMonth());
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRealEstateData = async () => {
    const apiKey = import.meta.env.VITE_RTMS_API_KEY;
    if (!apiKey) {
      setError("API 인증키가 설정되지 않았습니다. .env 파일에 VITE_RTMS_API_KEY를 추가해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setTransactions([]);
    setCurrentPage(1);

    try {
      const path = `/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade?serviceKey=${apiKey}&LAWD_CD=${lawdCd}&DEAL_YMD=${dealYmd}&numOfRows=1000`;
      const url = import.meta.env.DEV ? `/api/rtms${path}` : `https://asia-northeast3-publicmind-3e47b.cloudfunctions.net/proxyApi?url=${encodeURIComponent("https://apis.data.go.kr" + path)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 403) {
           throw new Error("약 1~2시간 뒤에 정상적으로 데이터를 불러올 수 있습니다.");
        }
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const xmlText = await response.text();
      
      // 공공데이터 에러 응답인 경우 (XML <OpenAPI_ServiceResponse> 체크)
      if (xmlText.includes('<errMsg>') || xmlText.includes('SERVICE ERROR') || xmlText.includes('<returnReasonCode>')) {
         throw new Error("약 1~2시간 뒤에 정상적으로 데이터를 불러올 수 있습니다.");
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      
      const items = xmlDoc.getElementsByTagName("item");
      if (!items || items.length === 0) {
        throw new Error("해당 지역/월에 대한 실거래가 데이터가 없습니다.");
      }

      const parsedData = Array.from(items).map((item, idx) => {
        const aptNm = item.getElementsByTagName("aptNm")[0]?.textContent?.trim() || "알수없음";
        const buildYear = item.getElementsByTagName("buildYear")[0]?.textContent?.trim() || "";
        const dealAmountStr = item.getElementsByTagName("dealAmount")[0]?.textContent?.trim() || "0";
        // '120,000' -> 120000 -> 12억 형태로 변환용 숫자
        const dealAmount = parseInt(dealAmountStr.replace(/,/g, ''), 10);
        
        const dealYear = item.getElementsByTagName("dealYear")[0]?.textContent?.trim() || "";
        const dealMonth = item.getElementsByTagName("dealMonth")[0]?.textContent?.trim() || "";
        const dealDay = item.getElementsByTagName("dealDay")[0]?.textContent?.trim() || "";
        const date = `${dealYear}.${dealMonth.padStart(2, '0')}.${dealDay.padStart(2, '0')}`;
        
        const excluUseAr = parseFloat(item.getElementsByTagName("excluUseAr")[0]?.textContent?.trim() || "0");
        const floor = item.getElementsByTagName("floor")[0]?.textContent?.trim() || "";
        const dong = item.getElementsByTagName("umdNm")[0]?.textContent?.trim() || "";

        return {
          id: `${aptNm}-${idx}`,
          aptNm,
          dong,
          buildYear,
          dealAmount, // 단위: 만원
          dealAmountFormatted: dealAmount >= 10000 
            ? `${Math.floor(dealAmount / 10000)}억 ${dealAmount % 10000 > 0 ? (dealAmount % 10000) + '만' : ''}원`
            : `${dealAmount}만원`,
          date,
          excluUseAr,
          pyeong: Math.round(excluUseAr / 3.3), // 평(대략)
          floor
        };
      });

      // 최신 거래일 순 정렬
      parsedData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(parsedData);
    } catch (err) {
      console.error("실거래가 API 호출 실패:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealEstateData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRealEstateData();
  };

  // 평형대별 거래 건수 통계 데이터 생성
  const getPyeongStats = () => {
    if (!transactions.length) return [];
    
    const ranges = {
      '10평대': 0,
      '20평대': 0,
      '30평대': 0,
      '40평대': 0,
      '50평 이상': 0,
    };
    
    transactions.forEach(t => {
      if (t.pyeong < 20) ranges['10평대']++;
      else if (t.pyeong < 30) ranges['20평대']++;
      else if (t.pyeong < 40) ranges['30평대']++;
      else if (t.pyeong < 50) ranges['40평대']++;
      else ranges['50평 이상']++;
    });

    return Object.keys(ranges).map(key => ({
      name: key,
      건수: ranges[key]
    })).filter(d => d.건수 > 0);
  };

  const pyeongStats = getPyeongStats();
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px', textAlign: 'center', position: 'relative' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>아파트 실거래가 분석</h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px' }}>
          국토교통부 공공데이터를 기반으로 해당 지역의 최신 실거래 내역과 가격 동향을 실시간으로 확인합니다.
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* 검색 필터 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
           
           <div style={{ flex: 1, minWidth: '120px' }}>
             <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
               <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />시/도
             </label>
             <select 
               className="form-input" 
               value={sido} 
               onChange={(e) => {
                 setSido(e.target.value);
                 setLawdCd(REGIONS[e.target.value][0].code);
               }}
               style={{ width: '100%' }}
             >
               {Object.keys(REGIONS).map(s => (
                 <option key={s} value={s}>{s}</option>
               ))}
             </select>
           </div>

           <div style={{ flex: 1, minWidth: '160px' }}>
             <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
               시/군/구
             </label>
             <select 
               className="form-input" 
               value={lawdCd} 
               onChange={(e) => setLawdCd(e.target.value)}
               style={{ width: '100%' }}
             >
               {REGIONS[sido].map(dist => (
                 <option key={dist.code} value={dist.code}>{dist.name}</option>
               ))}
             </select>
           </div>
           
           <div style={{ flex: 1, minWidth: '200px' }}>
             <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
               <Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />계약월 (YYYYMM)
             </label>
             <input 
               type="text" 
               className="form-input" 
               value={dealYmd} 
               onChange={(e) => setDealYmd(e.target.value)}
               placeholder="예: 202403"
               style={{ width: '100%' }}
             />
           </div>

           <button 
             className="btn btn-primary" 
             onClick={handleSearch}
             disabled={loading}
             style={{ padding: '12px 32px', height: '48px', borderRadius: '12px', whiteSpace: 'nowrap' }}
           >
             {loading ? '조회 중...' : '조회하기'}
           </button>
        </div>

        {error && (
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-red)' }}>
            <AlertCircle size={24} style={{ flexShrink: 0 }} />
            <div style={{ fontWeight: 600, lineHeight: 1.5 }}>
              {error}
            </div>
          </div>
        )}

        {/* 결과 영역 */}
        {!error && !loading && transactions.length > 0 && (
          <div className="responsive-grid-1-2" style={{ gap: '24px', alignItems: 'start' }}>
            
            {/* 왼쪽: 통계 및 차트 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-panel fade-in" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} color="var(--primary-blue)" /> 평형별 거래 건수
                </h3>
                <div style={{ height: '250px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pyeongStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }} 
                      />
                      <Bar dataKey="건수" fill="var(--primary-blue)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-panel fade-in" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--primary-blue)' }}>조회 요약</h4>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '4px' }}>{transactions.length}<span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '8px' }}>건</span></div>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{sido} {REGIONS[sido].find(d => d.code === lawdCd)?.name} ({dealYmd.substring(0,4)}년 {dealYmd.substring(4,6)}월) 실거래 신고 건수</p>
              </div>
            </div>

            {/* 오른쪽: 거래 리스트 */}
            <div className="glass-panel fade-in" style={{ padding: '24px', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={20} color="var(--primary-blue)" /> 실거래 상세 내역
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
                {currentTransactions.map((tx, idx) => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="badge" style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.75rem' }}>{tx.dong}</span>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{tx.aptNm}</h4>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <span>{tx.excluUseAr}㎡ ({tx.pyeong}평)</span>
                        <span>•</span>
                        <span>{tx.floor}층</span>
                        <span>•</span>
                        <span>{tx.buildYear}년 건축</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-red)' }}>{tx.dealAmountFormatted}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{tx.date}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: currentPage === 1 ? 'rgba(0,0,0,0.05)' : 'var(--primary-blue)', color: currentPage === 1 ? '#94a3b8' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                  >
                    이전
                  </button>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {currentPage} / {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: currentPage === totalPages ? 'rgba(0,0,0,0.05)' : 'var(--primary-blue)', color: currentPage === totalPages ? '#94a3b8' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                  >
                    다음
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {loading && (
          <div className="responsive-grid-1-2" style={{ gap: '24px' }}>
            <div className="glass-panel skeleton-pulse" style={{ height: '350px', borderRadius: '16px' }}></div>
            <div className="glass-panel skeleton-pulse" style={{ height: '600px', borderRadius: '16px' }}></div>
          </div>
        )}

      </div>
    </div>
  );
}

export default RealEstateAnalysis;

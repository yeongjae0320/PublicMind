import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Phone, AlertCircle, PhoneCall, Globe } from 'lucide-react';
import { useLocation } from 'react-router-dom';

function EmbassyContacts() {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(location.state?.query || '');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchEmbassyData = async () => {
    const apiKey = import.meta.env.VITE_TRAVEL_API_KEY || import.meta.env.VITE_RTMS_API_KEY;
    if (!apiKey) {
      setError("API 인증키가 설정되지 않았습니다. .env 파일에 VITE_TRAVEL_API_KEY를 추가해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setContacts([]);
    setCurrentPage(1);

    try {
      // JSON 포맷으로 요청 (외교부 API)
      const path = `/1262000/EmbassyService2/getEmbassyList2?serviceKey=${apiKey}&pageNo=1&numOfRows=300&returnType=JSON`;
    const url = import.meta.env.DEV ? `/api/travel${path}` : `https://asia-northeast3-publicmind-3e47b.cloudfunctions.net/proxyApi?url=${encodeURIComponent("https://apis.data.go.kr" + path)}`;
    const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 403) {
           throw new Error("약 1~2시간 뒤에 정상적으로 데이터를 불러올 수 있습니다.");
        }
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const textData = await response.text();
      
      // 혹시 에러를 XML이나 텍스트로 보냈는지 확인
      if (textData.includes('<errMsg>') || textData.includes('SERVICE ERROR') || textData.includes('<returnReasonCode>')) {
         throw new Error("약 1~2시간 뒤에 정상적으로 데이터를 불러올 수 있습니다.");
      }

      let data;
      try {
        data = JSON.parse(textData);
      } catch(e) {
        throw new Error("약 1~2시간 뒤에 정상적으로 데이터를 불러올 수 있습니다.");
      }
      
      // 공공데이터 JSON 파싱 (response.body.items.item 형태 대비)
      let list = [];
      if (data.data && Array.isArray(data.data)) {
        list = data.data;
      } else if (data.response?.body?.items?.item) {
        list = Array.isArray(data.response.body.items.item) 
          ? data.response.body.items.item 
          : [data.response.body.items.item];
      } else if (data.data) {
         list = Array.isArray(data.data) ? data.data : [data.data];
      } else {
         // Fallback: 그냥 배열인 경우
         list = Array.isArray(data) ? data : [];
      }

      if (list.length === 0) {
         throw new Error("조회된 영사관 데이터가 없습니다.");
      }

      // 국가명 기준 가나다순 정렬
      list.sort((a, b) => {
        const nameA = a.country_nm || a.country_eng_nm || "";
        const nameB = b.country_nm || b.country_eng_nm || "";
        return nameA.localeCompare(nameB);
      });

      setContacts(list);
    } catch (err) {
      console.error("영사관 API 호출 실패:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmbassyData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // 로컬 검색으로 필터링
    setCurrentPage(1);
  };

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts;
    return contacts.filter(contact => {
      const cNm = contact.country_nm || '';
      const cNmEng = contact.country_eng_nm || '';
      const eNm = contact.embassy_kor_nm || '';
      return cNm.includes(searchTerm) || cNmEng.toLowerCase().includes(searchTerm.toLowerCase()) || eNm.includes(searchTerm);
    });
  }, [contacts, searchTerm]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContacts = filteredContacts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px', textAlign: 'center', position: 'relative' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>전 세계 영사관 연락처</h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px' }}>
          위급 상황 시 즉각 도움을 받을 수 있는 전 세계 현지 대사관 및 영사관 연락처입니다.
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* 검색창 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '600px', position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="국가명 또는 대사관명 검색 (예: 미국, 프랑스)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="form-input"
              style={{ width: '100%', paddingLeft: '52px', height: '60px', fontSize: '1.1rem', borderRadius: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)' }}
            />
          </form>
        </div>

        {error && (
          <div className="glass-panel fade-in" style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-red)', justifyContent: 'center' }}>
            <AlertCircle size={24} style={{ flexShrink: 0 }} />
            <div style={{ fontWeight: 600, lineHeight: 1.5 }}>
              {error}
            </div>
          </div>
        )}

        {/* 결과 리스트 */}
        {!error && !loading && (
          <div className="fade-in">
            <div style={{ marginBottom: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              총 <span style={{ color: 'var(--primary-blue)' }}>{filteredContacts.length}</span>개의 영사관이 검색되었습니다.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {currentContacts.map((contact, idx) => (
                <div key={idx} className="glass-panel hover-lift" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Globe size={18} color="var(--primary-blue)" />
                      <span style={{ fontWeight: 800, color: 'var(--primary-blue)', fontSize: '1.1rem' }}>
                        {contact.country_nm || contact.country_eng_nm || '국가명 알수없음'}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {contact.embassy_kor_nm || '공관명 표기 안됨'}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <MapPin size={16} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {contact.address || contact.address_kor || '주소 정보 없음'}
                      </span>
                    </div>
                    
                    {(contact.tel_no || contact.tel) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          대표: <strong>{contact.tel_no || contact.tel}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 하단 긴급 연락처 (버튼 스타일) */}
                  {(contact.urgency_tel_no || contact.urgency_tel || contact.tel_no || contact.tel) && (
                    <a 
                      href={`tel:${contact.urgency_tel_no || contact.urgency_tel || contact.tel_no || contact.tel}`} 
                      className="btn" 
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', border: 'none', width: '100%', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 600, textDecoration: 'none' }}
                    >
                      <PhoneCall size={18} />
                      긴급 연락하기
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '40px' }}>
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

            {filteredContacts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                검색된 영사관이 없습니다.
              </div>
            )}
          </div>
        )}

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-panel skeleton-pulse" style={{ height: '250px', borderRadius: '16px' }}></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmbassyContacts;

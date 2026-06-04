import React, { useState, useEffect } from 'react';
import { Compass, ArrowRight, BookOpen, AlertCircle, Building, Search } from 'lucide-react';
import BookmarkButton from '../components/BookmarkButton';

function YouthPolicy() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const fetchPolicies = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const apiKey = import.meta.env.VITE_YOUTH_API_KEY;
        if (!apiKey) {
          throw new Error("API 인증키가 설정되지 않았습니다. .env 파일을 확인해주세요.");
        }

        const path = `/go/ythip/getPlcy?apiKeyNm=${apiKey}&pageSize=1000&pageNum=1&rtnType=xml`;
        const fetchUrl = import.meta.env.DEV ? `/api/youth${path}` : `https://asia-northeast3-publicmind-3e47b.cloudfunctions.net/proxyApi?url=${encodeURIComponent("https://www.youthcenter.go.kr" + path)}`;
        const response = await fetch(fetchUrl);
        
        if (!response.ok) {
           throw new Error("서버 응답 오류가 발생했습니다.");
        }

        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        const emps = xmlDoc.getElementsByTagName("youthPolicyList");
        
        if (!emps || emps.length === 0) {
            throw new Error("API 응답 데이터 형식이 올바르지 않습니다. (결과 없음)");
        }

        const parsedPolicies = Array.from(emps).map((emp, i) => {
            const title = emp.getElementsByTagName("plcyNm")[0]?.textContent || '청년정책';
            const lclsfNm = emp.getElementsByTagName("lclsfNm")[0]?.textContent || '';
            const mclsfNm = emp.getElementsByTagName("mclsfNm")[0]?.textContent || '';
            const category = lclsfNm ? (lclsfNm + (mclsfNm ? '/' + mclsfNm : '')) : '청년지원';
            const intro = emp.getElementsByTagName("plcyExplnCn")[0]?.textContent || '상세 내용 참조';
            
            const minAge = emp.getElementsByTagName("sprtTrgtMinAge")[0]?.textContent;
            const maxAge = emp.getElementsByTagName("sprtTrgtMaxAge")[0]?.textContent;
            const target = minAge && maxAge ? `만 ${minAge}세 ~ ${maxAge}세` : '제한없음';
            
            const earnEtcCn = emp.getElementsByTagName("earnEtcCn")[0]?.textContent;
            const earnMinAmt = emp.getElementsByTagName("earnMinAmt")[0]?.textContent;
            const earnMaxAmt = emp.getElementsByTagName("earnMaxAmt")[0]?.textContent;
            const req = earnEtcCn || (earnMinAmt && earnMaxAmt && earnMinAmt !== "0" && earnMaxAmt !== "0" ? `소득 ${earnMinAmt}~${earnMaxAmt}만원` : '-');
            
            const host = emp.getElementsByTagName("sprvsnInstCdNm")[0]?.textContent || emp.getElementsByTagName("operInstCdNm")[0]?.textContent || '정부/지자체';
            const aplyUrl = emp.getElementsByTagName("aplyUrlAddr")[0]?.textContent;
            const refUrl = emp.getElementsByTagName("refUrlAddr1")[0]?.textContent;
            const link = aplyUrl || refUrl || 'https://www.youthcenter.go.kr';
            const bizId = emp.getElementsByTagName("plcyNo")[0]?.textContent || `youth-${i}`;

            return {
                id: bizId,
                title, category, intro, target, req, host, 
                link: link.match(/^http/) ? link : 'https://www.youthcenter.go.kr'
            };
        });
        
        setPolicies(parsedPolicies);
      } catch (err) {
        console.error("청년정책 조회 실패:", err);
        setError(err.message === "API 인증키가 설정되지 않았습니다. .env 파일을 확인해주세요." 
          ? err.message 
          : "청년포털 API 연동 중 오류가 발생했습니다. (임시 데이터를 표시합니다)");
        
        // 에러 발생 시 임시 데이터 제공
        setPolicies([
          {
            id: 'mock-1', title: '청년내일채움공제', category: '일자리/취업',
            intro: '중소·중견기업에 정규직으로 취업한 청년들의 장기근속을 위해 고용노동부와 중소벤처기업부가 공동으로 운영하는 사업입니다.',
            target: '만 15세 이상 34세 이하', req: '중소기업 정규직 신규 취업자', host: '고용노동부', link: 'https://www.youthcenter.go.kr'
          },
          {
            id: 'mock-2', title: '청년우대형 청약통장', category: '주거/금융',
            intro: '기존 주택청약종합저축의 청약 기능과 소득공제 혜택은 그대로 유지하면서 10년간 최대 연 3.3%의 우대금리와 이자소득 비과세 혜택을 제공하는 청약통장입니다.',
            target: '만 19세 이상 34세 이하', req: '연소득 3,600만원 이하 무주택 세대주', host: '국토교통부', link: 'https://www.youthcenter.go.kr'
          },
          {
            id: 'mock-3', title: '청년월세 특별지원', category: '주거/주거지원',
            intro: '경제적 어려움을 겪고 있는 청년층의 주거비 부담 경감을 위해 청년 월세를 한시적으로 특별 지원합니다. (월 최대 20만원, 최대 12개월)',
            target: '만 19세 ~ 34세', req: '기준중위소득 60% 이하', host: '보건복지부', link: 'https://www.youthcenter.go.kr'
          },
          {
            id: 'mock-4', title: '국민취업지원제도', category: '일자리/취업',
            intro: '취업을 희망하는 청년들에게 취업지원서비스를 종합적으로 제공하고, 저소득 구직자에게는 최소한의 소득도 지원하는 한국형 실업부조입니다.',
            target: '만 15세 ~ 69세 (청년특례 18~34세)', req: '취업경험 제한 없음', host: '고용노동부', link: 'https://www.youthcenter.go.kr'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredPolicies = policies.filter(p => 
    p.title.includes(searchTerm) || p.category.includes(searchTerm) || p.intro.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredPolicies.length / ITEMS_PER_PAGE);
  const currentPolicies = filteredPolicies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px', textAlign: 'center', position: 'relative' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>청년 정책 통합 조회</h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px' }}>
          주거, 금융, 취업 등 전국 각지의 다양한 최신 청년 정책을 한눈에 확인해 보세요.
        </p>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Search Bar */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
           <Search size={24} color="var(--primary-blue)" />
           <input 
             type="text" 
             placeholder="관심 있는 정책 키워드(예: 주거, 창업, 지원금)를 검색해보세요" 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="form-input"
             style={{ border: 'none', background: 'transparent', fontSize: '1.1rem', boxShadow: 'none', padding: 0 }}
           />
        </div>

        {error && (
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-red)' }}>
            <AlertCircle size={24} />
            <span style={{ fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {loading ? (
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
             {[1, 2, 3, 4, 5, 6].map(i => (
               <div key={i} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', height: '360px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                   <div style={{ width: '100%' }}>
                     {/* Badge skeleton */}
                     <div className="skeleton-pulse" style={{ height: '24px', width: '60px', borderRadius: '12px', marginBottom: '8px', background: 'rgba(226, 232, 240, 0.6)' }}></div>
                     {/* Title skeleton */}
                     <div className="skeleton-pulse" style={{ height: '28px', width: '85%', borderRadius: '8px', marginBottom: '12px', background: 'rgba(226, 232, 240, 0.6)' }}></div>
                     {/* Host skeleton */}
                     <div className="skeleton-pulse" style={{ height: '16px', width: '40%', borderRadius: '6px', background: 'rgba(226, 232, 240, 0.6)' }}></div>
                   </div>
                 </div>

                 {/* Intro text skeleton */}
                 <div style={{ marginBottom: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                   <div className="skeleton-pulse" style={{ height: '16px', width: '100%', borderRadius: '6px', background: 'rgba(226, 232, 240, 0.6)' }}></div>
                   <div className="skeleton-pulse" style={{ height: '16px', width: '90%', borderRadius: '6px', background: 'rgba(226, 232, 240, 0.6)' }}></div>
                   <div className="skeleton-pulse" style={{ height: '16px', width: '60%', borderRadius: '6px', background: 'rgba(226, 232, 240, 0.6)' }}></div>
                 </div>

                 {/* Requirements box skeleton */}
                 <div style={{ background: 'rgba(255,255,255,0.5)', padding: '12px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                     <div className="skeleton-pulse" style={{ height: '14px', width: '60px', borderRadius: '4px', background: 'rgba(226, 232, 240, 0.6)' }}></div>
                     <div className="skeleton-pulse" style={{ height: '14px', width: '120px', borderRadius: '4px', background: 'rgba(226, 232, 240, 0.6)' }}></div>
                   </div>
                   <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                     <div className="skeleton-pulse" style={{ height: '14px', width: '60px', borderRadius: '4px', background: 'rgba(226, 232, 240, 0.6)' }}></div>
                     <div className="skeleton-pulse" style={{ height: '14px', width: '150px', borderRadius: '4px', background: 'rgba(226, 232, 240, 0.6)' }}></div>
                   </div>
                 </div>

                 {/* Button skeleton */}
                 <div className="skeleton-pulse" style={{ height: '48px', width: '100%', borderRadius: '8px', background: 'rgba(226, 232, 240, 0.6)' }}></div>
               </div>
             ))}
           </div>
        ) : currentPolicies.length > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
              {currentPolicies.map((policy, idx) => (
              <div key={policy.id} className="glass-panel fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', animationDelay: `${idx * 0.05}s`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span className="badge badge-primary" style={{ marginBottom: '8px', display: 'inline-block' }}>{policy.category}</span>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 8px 0', lineHeight: 1.4 }}>{policy.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                      <Building size={14} /> {policy.host}
                    </div>
                  </div>
                  <BookmarkButton item={policy} type="youth" title={policy.title} subtitle={policy.host} link={policy.link} itemId={policy.id} />
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px', flex: 1 }}>
                  {policy.intro.length > 80 ? policy.intro.substring(0, 80) + '...' : policy.intro}
                </p>

                <div style={{ background: 'rgba(255,255,255,0.5)', padding: '12px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem' }}>
                    <strong style={{ color: 'var(--text-primary)', minWidth: '60px' }}>지원연령</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{policy.target}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem' }}>
                    <strong style={{ color: 'var(--text-primary)', minWidth: '60px' }}>취업상태</strong>
                    <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{policy.req}</span>
                  </div>
                </div>

                <button 
                  className="btn btn-outline" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  onClick={() => window.open(policy.link.match(/^http/) ? policy.link : 'https://www.youthcenter.go.kr', '_blank')}
                >
                  <BookOpen size={16} /> 상세 보기
                </button>
              </div>
            ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px', alignItems: 'center' }}>
                <button 
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="btn"
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: currentPage === 1 ? '#f9fafb' : '#fff', color: currentPage === 1 ? '#9ca3af' : 'var(--text-primary)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                >
                  이전
                </button>
                
                <span style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--primary-blue)', color: 'white', fontWeight: 'bold' }}>
                  {currentPage} / {totalPages}
                </span>

                <button 
                  onClick={() => {
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="btn"
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: currentPage === totalPages ? '#f9fafb' : '#fff', color: currentPage === totalPages ? '#9ca3af' : 'var(--text-primary)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                >
                  다음
                </button>
              </div>
            )}
          </>
        ) : !error && (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '8px' }}>검색 결과가 없습니다</h3>
            <p>다른 키워드로 검색해 보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default YouthPolicy;

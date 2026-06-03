import React from 'react';
import { MessageSquare, ThumbsUp, Eye, Search } from 'lucide-react';

const POSTS = [
  { id: 1, category: '공지사항', title: 'SupplyMind V2 업데이트 안내 및 신규 AI 기능 소개', author: '운영자', date: '2026.05.30', views: 1250, likes: 342, comments: 45 },
  { id: 2, category: '정보공유', title: '홍해 우회 항로 관련 유럽 항구별 체선율(Congestion) 현황', author: 'LogisticsPro', date: '2026.05.29', views: 856, likes: 124, comments: 28 },
  { id: 3, category: 'Q&A', title: '대만 가뭄 사태, TSMC 외에 UMC 쪽 리드타임 변화 아시는 분?', author: 'Procurement_Kim', date: '2026.05.28', views: 420, likes: 12, comments: 8 },
  { id: 4, category: '정보공유', title: '베트남 하이퐁 세관 파업 종료 후 통관 정상화 타임라인 정리', author: 'VN_Expert', date: '2026.05.27', views: 630, likes: 88, comments: 15 },
  { id: 5, category: 'Q&A', title: 'ESG 규제 관련 EU 수출 시 필수 증빙 서류 템플릿 있으신가요', author: 'GreenSupply', date: '2026.05.26', views: 312, likes: 45, comments: 11 },
];

function Community() {
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">공급망 실무자 커뮤니티</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>전 세계 공급망 전문가들과 리스크 대응 노하우를 공유하세요.</p>
        </div>
        <button className="btn btn-primary">새 글 작성</button>
      </div>

      <div className="panel">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ fontWeight: 600, color: 'var(--primary-blue)', borderBottom: '2px solid var(--primary-blue)', paddingBottom: '4px' }}>전체글</span>
            <span style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>공지사항</span>
            <span style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>정보공유</span>
            <span style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>Q&A</span>
          </div>
          
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="게시글 검색..." 
              style={{
                width: '100%', padding: '6px 10px 6px 32px',
                border: '1px solid var(--border-color)', borderRadius: '4px',
                outline: 'none', fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <th style={{ padding: '16px 24px', width: '10%' }}>분류</th>
                <th style={{ padding: '16px 24px', width: '50%' }}>제목</th>
                <th style={{ padding: '16px 24px', width: '15%' }}>작성자</th>
                <th style={{ padding: '16px 24px', width: '10%' }}>작성일</th>
                <th style={{ padding: '16px 24px', width: '15%', textAlign: 'right' }}>조회 / 추천</th>
              </tr>
            </thead>
            <tbody>
              {POSTS.map((post, index) => (
                <tr key={post.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background var(--transition-fast)' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-panel-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '16px 24px' }}>
                    <span className={`badge ${post.category === '공지사항' ? 'badge-danger' : 'badge-neutral'}`}>
                      {post.category}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 500, cursor: 'pointer', color: post.category === '공지사항' ? 'var(--text-primary)' : 'inherit' }}>
                    {post.title}
                    <span style={{ color: 'var(--primary-blue)', fontSize: '0.875rem', marginLeft: '8px', fontWeight: 600 }}>[{post.comments}]</span>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{post.author}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{post.date}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> {post.views}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={14} /> {post.likes}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
          {/* Pagination Mock */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" style={{ padding: '4px 12px' }}>1</button>
            <button className="btn btn-outline" style={{ padding: '4px 12px' }}>2</button>
            <button className="btn btn-outline" style={{ padding: '4px 12px' }}>3</button>
            <button className="btn btn-outline" style={{ padding: '4px 12px' }}>다음</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Community;

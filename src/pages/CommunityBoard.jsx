import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, ThumbsUp, Eye, Clock, Hash, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

function CommunityBoard({ category }) {
  const [activeTab, setActiveTab] = useState('latest');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setCurrentPage(1); // Reset page on tab/category change
    setLoading(true);
    setErrorMsg('');
    let q;
    
    if (category) {
      q = query(
        collection(db, 'posts'),
        where('category', '==', category),
        orderBy(activeTab === 'latest' ? 'createdAt' : 'likes', 'desc')
      );
    } else {
      q = query(
        collection(db, 'posts'),
        orderBy(activeTab === 'latest' ? 'createdAt' : 'likes', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => {
        const data = doc.data();
        let timeStr = '방금 전';
        if (data.createdAt) {
          const date = data.createdAt.toDate();
          const now = new Date();
          const diffMs = now - date;
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);
          
          if (diffDays > 0) timeStr = `${diffDays}일 전`;
          else if (diffHours > 0) timeStr = `${diffHours}시간 전`;
          else if (diffMins > 0) timeStr = `${diffMins}분 전`;
        }
        
        return {
          id: doc.id,
          ...data,
          time: timeStr
        };
      });
      if (activeTab === 'popular') {
        fetchedPosts.sort((a, b) => {
          const likesA = a.likes || 0;
          const likesB = b.likes || 0;
          if (likesB !== likesA) return likesB - likesA;
          
          const viewsA = a.views || 0;
          const viewsB = b.views || 0;
          if (viewsB !== viewsA) return viewsB - viewsA;
          
          const commentsA = a.comments || 0;
          const commentsB = b.comments || 0;
          if (commentsB !== commentsA) return commentsB - commentsA;
          
          // If everything is equal, sort by newest
          const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });
      }

      setPosts(fetchedPosts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      if (error.message && error.message.includes('requires an index')) {
        const urlMatch = error.message.match(/(https:\/\/[^\s]+)/);
        if (urlMatch) {
          setErrorMsg(`데이터베이스 정렬을 위한 '색인(Index)' 생성이 필요합니다. 아래 링크를 클릭해 색인을 만들어주세요:\n${urlMatch[0]}`);
        } else {
          setErrorMsg(error.message);
        }
      } else {
        setErrorMsg("데이터를 불러오는 중 오류가 발생했습니다: " + error.message);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [category, activeTab]);

  const handleWriteClick = () => {
    const currentPath = location.pathname.replace(/\/$/, '');
    navigate(`${currentPath}/write`);
  };

  // Get current posts for pagination
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px', textAlign: 'center', position: 'relative' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center', marginBottom: '12px' }}>
          {category ? `${category} 커뮤니티` : '통합 커뮤니티'}
        </h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px', color: 'var(--text-secondary)' }}>
          정보를 나누고 궁금한 점을 질문해 보세요.
        </p>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {/* Tabs and Write Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', padding: '16px 48px 0 48px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div 
              style={{ padding: '16px 8px', cursor: 'pointer', fontWeight: activeTab === 'latest' ? 700 : 600, color: activeTab === 'latest' ? 'var(--primary-blue)' : 'var(--text-secondary)', borderBottom: activeTab === 'latest' ? '2px solid var(--primary-blue)' : '2px solid transparent', fontSize: '1rem', transition: 'all 0.2s' }}
              onClick={() => setActiveTab('latest')}
            >
              최신글
            </div>
            <div 
              style={{ padding: '16px 8px', cursor: 'pointer', fontWeight: activeTab === 'popular' ? 700 : 600, color: activeTab === 'popular' ? 'var(--primary-blue)' : 'var(--text-secondary)', borderBottom: activeTab === 'popular' ? '2px solid var(--primary-blue)' : '2px solid transparent', fontSize: '1rem', transition: 'all 0.2s' }}
              onClick={() => setActiveTab('popular')}
            >
              인기글
            </div>
          </div>
          
          <button className="btn" onClick={handleWriteClick} style={{ padding: '10px 24px', borderRadius: '99px', background: 'var(--primary-blue)', color: 'white', fontWeight: 700, fontSize: '0.95rem', border: 'none', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', transition: 'all 0.2s', cursor: 'pointer', marginBottom: '8px' }}>
            글쓰기
          </button>
        </div>

        {/* Post List */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              로딩 중...
            </div>
          ) : errorMsg ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#ef4444', lineHeight: 1.6 }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>잠깐! 🛑 설정이 하나 남았어요!</div>
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {errorMsg.split('\n').map((line, i) => 
                  line.startsWith('https://') ? 
                  <a key={i} href={line} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-blue)', textDecoration: 'underline', fontWeight: 'bold', display: 'block', marginTop: '12px' }}>
                    👉 색인(Index) 자동 생성 링크 클릭 👈
                  </a> 
                  : <span key={i}>{line}</span>
                )}
              </div>
              <p style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>링크를 클릭하고 새 창에서 생성을 누른 뒤, 약 1~3분 후 완료되면 여기를 새로고침 해주세요.</p>
            </div>
          ) : currentPosts.length > 0 ? (
            currentPosts.map((post, index) => {
              const isTopPopular = activeTab === 'popular' && currentPage === 1 && index === 0;
              const defaultBg = isTopPopular ? 'rgba(37, 99, 235, 0.04)' : 'transparent';
              const hoverBg = isTopPopular ? 'rgba(37, 99, 235, 0.08)' : 'rgba(248,250,252,0.8)';
              
              return (
              <div 
                key={post.id} 
                onClick={() => navigate(`${location.pathname.replace(/\/$/, '')}/${post.id}`)}
                style={{ padding: '24px 48px', borderBottom: index !== currentPosts.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', gap: '24px', cursor: 'pointer', transition: 'background 0.2s', background: defaultBg }} 
                onMouseEnter={(e) => e.currentTarget.style.background = hoverBg} 
                onMouseLeave={(e) => e.currentTarget.style.background = defaultBg}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0, paddingRight: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {post.tags && post.tags.length > 0 ? (
                        post.tags.map((t, i) => (
                          <span key={i} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-blue)', background: 'rgba(37,99,235,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                            #{t}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          # {post.tag || post.category || '공통'}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</span>
                      <span style={{ color: post.comments > 0 ? 'var(--primary-blue)' : 'var(--text-muted)', opacity: post.comments > 0 ? 1 : 0.6, fontWeight: 700, fontSize: '0.95rem' }}>
                        [{post.comments || 0}]
                      </span>
                    </h3>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {post.content}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    <span>{post.isAnonymous ? '익명' : post.authorName}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {post.time}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, flexShrink: 0, minWidth: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={14} /> {post.likes || 0}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> {post.views || 0}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageSquare size={14} /> {post.comments || 0}</div>
                </div>
              </div>
            )})
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              아직 작성된 글이 없습니다. 첫 번째 글을 남겨보세요!
            </div>
          )}
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && !loading && !errorMsg && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '24px', borderTop: '1px solid var(--border-light)' }}>
            <button 
              onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
              disabled={currentPage === 1}
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', background: currentPage === 1 ? 'transparent' : 'rgba(37,99,235,0.05)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
              <ChevronLeft size={18} />
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => paginate(i + 1)}
                style={{ 
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', fontSize: '0.95rem', fontWeight: currentPage === i + 1 ? 700 : 500,
                  background: currentPage === i + 1 ? 'var(--primary-blue)' : 'transparent',
                  color: currentPage === i + 1 ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {i + 1}
              </button>
            ))}

            <button 
              onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
              disabled={currentPage === totalPages}
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', background: currentPage === totalPages ? 'transparent' : 'rgba(37,99,235,0.05)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityBoard;

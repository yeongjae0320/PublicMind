import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ArrowLeft } from 'lucide-react';

function CommunityWrite({ category }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // 엔터 시 폼 제출 방지
      
      if (tags.length >= 3) {
        alert('태그는 최대 3개까지만 추가할 수 있습니다.');
        return;
      }

      const val = tagInput.trim();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    
    if (!auth.currentUser) {
      alert('로그인이 필요한 서비스입니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'posts'), {
        title,
        content,
        category,
        tags,
        isAnonymous,
        authorUid: auth.currentUser.uid,
        authorName: isAnonymous ? '익명' : (auth.currentUser.displayName || '익명 사용자'),
        createdAt: serverTimestamp(),
        likes: 0,
        views: 0,
        comments: 0
      });
      
      alert('게시글이 등록되었습니다.');
      navigate(-1); // 이전 페이지(게시판 목록)로 이동
    } catch (error) {
      console.error('Error adding document: ', error);
      alert('글 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px', textAlign: 'center', position: 'relative' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center', marginBottom: '12px' }}>
          {category ? `${category} 글쓰기` : '새 글 작성'}
        </h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px', color: 'var(--text-secondary)' }}>
          유용한 정보나 질문을 다른 분들과 공유해 보세요.
        </p>
      </div>

      <div style={{ width: '100%' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: 'var(--text-secondary)', 
            marginBottom: '16px',
            fontWeight: 600,
            fontSize: '0.95rem'
          }}
        >
          <ArrowLeft size={18} />
          목록으로 돌아가기
        </button>

        <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.95)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '150px' }}>
              <label style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>카테고리</label>
              <div style={{ padding: '12px 16px', background: 'var(--bg-base)', borderRadius: '8px', color: 'var(--text-secondary)', fontWeight: 600, height: '48px', display: 'flex', alignItems: 'center' }}>
                {category}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 2, minWidth: '300px' }}>
              <label htmlFor="tag" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>태그 (엔터로 추가)</label>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px', 
                padding: '4px 8px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-light)', 
                minHeight: '48px',
                alignItems: 'center',
                background: 'white',
                transition: 'border-color 0.2s'
              }}>
                {tags.map((t, index) => (
                  <div key={index} style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px', 
                    background: 'rgba(37, 99, 235, 0.1)', padding: '6px 12px', borderRadius: '99px',
                    fontSize: '0.9rem', color: 'var(--primary-blue)', fontWeight: 600
                  }}>
                    #{t}
                    <button type="button" onClick={() => removeTag(index)} style={{ color: 'var(--primary-blue)', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', padding: '0', cursor: 'pointer', opacity: 0.7, outline: 'none' }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}>
                      <span style={{ fontSize: '16px', lineHeight: 1 }}>&times;</span>
                    </button>
                  </div>
                ))}
                
                {tags.length < 3 && (
                  <input 
                    id="tag"
                    type="text" 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={tags.length === 0 ? "예: 청년지원 (최대 3개, 입력 후 Enter)" : "추가 태그 입력..."} 
                    style={{ flex: 1, minWidth: '220px', border: 'none', outline: 'none', padding: '6px 8px', fontSize: '0.95rem', background: 'transparent' }}
                  />
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="title" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>제목</label>
            <input 
              id="title"
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요" 
              style={{ padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '1rem', width: '100%', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-blue)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="content" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>내용</label>
            <textarea 
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요" 
              rows="12"
              style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '1rem', width: '100%', outline: 'none', resize: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-blue)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600 }}>
              <input 
                type="checkbox" 
                checked={isAnonymous} 
                onChange={(e) => setIsAnonymous(e.target.checked)} 
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-blue)' }} 
              />
              익명으로 작성하기
            </label>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn" 
              style={{ 
                padding: '12px 32px', 
                borderRadius: '99px', 
                background: isSubmitting ? 'var(--text-muted)' : 'var(--primary-blue)', 
                color: 'white', 
                fontWeight: 700, 
                fontSize: '1rem',
                border: 'none',
                boxShadow: isSubmitting ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.2)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isSubmitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CommunityWrite;

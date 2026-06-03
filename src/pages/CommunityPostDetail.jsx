import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ArrowLeft, MessageSquare, ThumbsUp, Eye, Clock, User, Trash2, Bookmark, CornerDownRight, MessageCircle } from 'lucide-react';

function CommunityPostDetail({ category }) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newComment, setNewComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reply State
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyComment, setReplyComment] = useState('');
  const [isReplyAnonymous, setIsReplyAnonymous] = useState(false);
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);
  
  const viewIncremented = useRef(false);

  useEffect(() => {
    if (!postId) return;

    if (!viewIncremented.current) {
      viewIncremented.current = true;
      const incrementView = async () => {
        try {
          await updateDoc(doc(db, 'posts', postId), { views: increment(1) });
        } catch (err) { console.error(err); }
      };
      incrementView();
    }

    const postRef = doc(db, 'posts', postId);
    const unsubPost = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        let timeStr = '방금 전';
        if (data.createdAt) {
          const diffMs = new Date() - data.createdAt.toDate();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);
          if (diffDays > 0) timeStr = `${diffDays}일 전`;
          else if (diffHours > 0) timeStr = `${diffHours}시간 전`;
          else if (diffMins > 0) timeStr = `${diffMins}분 전`;
        }
        setPost({ id: docSnap.id, ...data, time: timeStr });
      } else {
        alert("존재하지 않거나 삭제된 게시글입니다.");
        navigate(location.pathname.substring(0, location.pathname.lastIndexOf('/')));
      }
      setLoading(false);
    });

    const commentsQuery = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsubComments = onSnapshot(commentsQuery, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => {
        const data = doc.data();
        let timeStr = '방금 전';
        if (data.createdAt) {
          const diffMs = new Date() - data.createdAt.toDate();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);
          if (diffDays > 0) timeStr = `${diffDays}일 전`;
          else if (diffHours > 0) timeStr = `${diffHours}시간 전`;
          else if (diffMins > 0) timeStr = `${diffMins}분 전`;
        }
        return { id: doc.id, ...data, time: timeStr };
      });
      setComments(fetchedComments);
    });

    return () => {
      unsubPost();
      unsubComments();
    };
  }, [postId, navigate]);

  const handleLike = async () => {
    if (!auth.currentUser) return alert("로그인이 필요합니다.");
    try {
      const postRef = doc(db, 'posts', postId);
      const isLiked = post.likedBy && post.likedBy.includes(auth.currentUser.uid);
      if (isLiked) {
        await updateDoc(postRef, { likedBy: arrayRemove(auth.currentUser.uid), likes: increment(-1) });
      } else {
        await updateDoc(postRef, { likedBy: arrayUnion(auth.currentUser.uid), likes: increment(1) });
      }
    } catch (error) { console.error(error); }
  };

  const handleBookmark = async () => {
    if (!auth.currentUser) return alert("로그인이 필요합니다.");
    try {
      const postRef = doc(db, 'posts', postId);
      const isBookmarked = post.bookmarkedBy && post.bookmarkedBy.includes(auth.currentUser.uid);
      if (isBookmarked) {
        await updateDoc(postRef, { bookmarkedBy: arrayRemove(auth.currentUser.uid), bookmarks: increment(-1) });
      } else {
        await updateDoc(postRef, { bookmarkedBy: arrayUnion(auth.currentUser.uid), bookmarks: increment(1) });
      }
    } catch (error) { console.error(error); }
  };

  const handleCommentLike = async (commentId, isLiked) => {
    if (!auth.currentUser) return alert("로그인이 필요합니다.");
    try {
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      if (isLiked) {
        await updateDoc(commentRef, { likedBy: arrayRemove(auth.currentUser.uid), likes: increment(-1) });
      } else {
        await updateDoc(commentRef, { likedBy: arrayUnion(auth.currentUser.uid), likes: increment(1) });
      }
    } catch (error) { console.error(error); }
  };

  const handleDeletePost = async () => {
    if (window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
        alert("게시글이 삭제되었습니다.");
        navigate(location.pathname.substring(0, location.pathname.lastIndexOf('/')));
      } catch (error) {
        console.error(error);
        alert("삭제에 실패했습니다.");
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("댓글을 삭제하시겠습니까?")) {
      try {
        // 하위 답글(대댓글)도 함께 지우려면 복잡한 쿼리가 필요하므로, 여기서는 단순히 문서를 지웁니다.
        // 만약 대댓글이 남는 것을 원치 않는다면, 실제 서비스에서는 클라우드 함수나 일괄 삭제를 사용해야 합니다.
        await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
        await updateDoc(doc(db, 'posts', postId), { comments: increment(-1) });
      } catch (error) { console.error(error); }
    }
  };

  const handleAddComment = async (e, parentId = null) => {
    e.preventDefault();
    if (!auth.currentUser) return alert("로그인이 필요합니다.");
    
    const content = parentId ? replyComment.trim() : newComment.trim();
    if (!content) return;

    if (parentId) setIsReplySubmitting(true);
    else setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        content,
        authorUid: auth.currentUser.uid,
        authorName: (parentId ? isReplyAnonymous : isAnonymous) ? '익명' : (auth.currentUser.displayName || '익명 사용자'),
        isAnonymous: parentId ? isReplyAnonymous : isAnonymous,
        createdAt: serverTimestamp(),
        likes: 0,
        parentId: parentId || null
      });

      await updateDoc(doc(db, 'posts', postId), {
        comments: increment(1)
      });

      if (parentId) {
        setReplyComment('');
        setIsReplyAnonymous(false);
        setReplyingTo(null);
      } else {
        setNewComment('');
        setIsAnonymous(false);
      }
    } catch (error) {
      console.error(error);
      alert("댓글 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
      setIsReplySubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>로딩 중...</div>;
  if (!post) return null;

  const rootComments = comments.filter(c => !c.parentId);
  const repliesByParent = {};
  comments.filter(c => c.parentId).forEach(c => {
    if (!repliesByParent[c.parentId]) repliesByParent[c.parentId] = [];
    repliesByParent[c.parentId].push(c);
  });

  return (
    <div className="fade-in">
      <button 
        onClick={() => navigate(location.pathname.substring(0, location.pathname.lastIndexOf('/')))}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', marginBottom: '24px', padding: 0 }}
      >
        <ArrowLeft size={18} /> 목록으로 돌아가기
      </button>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', padding: '32px 40px' }}>
        
        {/* 헤더 */}
        <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {post.tags && post.tags.length > 0 ? (
              post.tags.map((t, i) => (
                <span key={i} style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-blue)', background: 'rgba(37,99,235,0.1)', padding: '4px 12px', borderRadius: '12px' }}>
                  #{t}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}># {post.tag || post.category || '공통'}</span>
            )}
          </div>
          
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '20px', lineHeight: 1.4 }}>
            {post.title}
          </h1>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)' }}>
                <User size={16} /> {post.isAnonymous ? '익명' : post.authorName}
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {post.time}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <button 
                onClick={handleLike}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: auth.currentUser && post.likedBy && post.likedBy.includes(auth.currentUser.uid) ? 'var(--primary-blue)' : 'var(--text-muted)', transition: 'all 0.2s', padding: 0 }}
              >
                <ThumbsUp size={16} fill={auth.currentUser && post.likedBy && post.likedBy.includes(auth.currentUser.uid) ? 'currentColor' : 'none'} /> {post.likes || 0}
              </button>
              
              <button 
                onClick={handleBookmark}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: auth.currentUser && post.bookmarkedBy && post.bookmarkedBy.includes(auth.currentUser.uid) ? '#eab308' : 'var(--text-muted)', transition: 'all 0.2s', padding: 0 }}
              >
                <Bookmark size={16} fill={auth.currentUser && post.bookmarkedBy && post.bookmarkedBy.includes(auth.currentUser.uid) ? 'currentColor' : 'none'} /> 관심
              </button>
              
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Eye size={16} /> {post.views || 0}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MessageSquare size={16} /> {post.comments || 0}</span>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div style={{ fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: '150px' }}>
          {post.content}
        </div>

        {/* 글 삭제 버튼 */}
        {auth.currentUser && auth.currentUser.uid === post.authorUid && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px', paddingTop: '16px', borderTop: '1px dashed var(--border-light)' }}>
            <button 
              onClick={handleDeletePost}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <Trash2 size={16} /> 삭제하기
            </button>
          </div>
        )}
      </div>

      {/* 댓글 섹션 */}
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', marginTop: '24px', padding: '32px 40px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          댓글 <span style={{ color: 'var(--primary-blue)' }}>{post.comments || 0}</span>
        </h3>
        
        {/* 댓글 작성란 */}
        <form onSubmit={(e) => handleAddComment(e, null)} style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <textarea 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 남겨보세요. 따뜻한 말 한마디가 큰 힘이 됩니다!"
            style={{ width: '100%', minHeight: '100px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'var(--bg-base)', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'none', transition: 'border 0.2s', outline: 'none' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-blue)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary-blue)' }} />
              익명으로 작성
            </label>
            <button 
              type="submit" 
              disabled={isSubmitting || !newComment.trim()}
              className="btn"
              style={{ padding: '8px 24px', borderRadius: '8px', background: isSubmitting || !newComment.trim() ? 'var(--border-light)' : 'var(--primary-blue)', color: isSubmitting || !newComment.trim() ? 'var(--text-muted)' : 'white', fontWeight: 600, border: 'none', cursor: isSubmitting || !newComment.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
              {isSubmitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>

        {/* 댓글 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {rootComments.length > 0 ? rootComments.map(comment => (
            <div key={comment.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--border-light)' }}>
              
              {/* 루트 댓글 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{comment.authorName}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{comment.time}</span>
                  </div>
                  {auth.currentUser && auth.currentUser.uid === comment.authorUid && (
                    <button onClick={() => handleDeleteComment(comment.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', opacity: 0.7 }}>삭제</button>
                  )}
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {comment.content}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                  <button 
                    onClick={() => handleCommentLike(comment.id, comment.likedBy && comment.likedBy.includes(auth.currentUser?.uid))}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0, color: auth.currentUser && comment.likedBy && comment.likedBy.includes(auth.currentUser.uid) ? 'var(--primary-blue)' : 'var(--text-muted)' }}
                  >
                    <ThumbsUp size={14} fill={auth.currentUser && comment.likedBy && comment.likedBy.includes(auth.currentUser.uid) ? 'currentColor' : 'none'} /> 
                    {comment.likes || 0}
                  </button>
                  <button 
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0, color: 'var(--text-secondary)' }}
                  >
                    <MessageCircle size={14} /> 답글 쓰기
                  </button>
                </div>
              </div>

              {/* 답글 입력란 */}
              {replyingTo === comment.id && (
                <div style={{ marginLeft: '24px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <textarea 
                    value={replyComment}
                    onChange={(e) => setReplyComment(e.target.value)}
                    placeholder={`${comment.authorName}님에게 답글 남기기...`}
                    style={{ width: '100%', minHeight: '80px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'var(--bg-base)', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'none', transition: 'border 0.2s', outline: 'none' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-blue)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      <input type="checkbox" checked={isReplyAnonymous} onChange={(e) => setIsReplyAnonymous(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary-blue)' }} /> 익명
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setReplyingTo(null)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>취소</button>
                      <button onClick={(e) => handleAddComment(e, comment.id)} disabled={isReplySubmitting || !replyComment.trim()} style={{ padding: '8px 24px', borderRadius: '8px', background: isReplySubmitting || !replyComment.trim() ? 'var(--border-light)' : 'var(--primary-blue)', color: isReplySubmitting || !replyComment.trim() ? 'var(--text-muted)' : 'white', border: 'none', fontSize: '0.9rem', fontWeight: 600, cursor: isReplySubmitting || !replyComment.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                        등록
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 대댓글(답글) 목록 */}
              {repliesByParent[comment.id] && repliesByParent[comment.id].length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginLeft: '24px', marginTop: '8px' }}>
                  {repliesByParent[comment.id].map(reply => (
                    <div key={reply.id} style={{ display: 'flex', gap: '12px', padding: '12px 16px', background: 'rgba(248,250,252,0.6)', borderRadius: '12px' }}>
                      <CornerDownRight size={16} color="var(--text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{reply.authorName}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{reply.time}</span>
                          </div>
                          {auth.currentUser && auth.currentUser.uid === reply.authorUid && (
                            <button onClick={() => handleDeleteComment(reply.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', opacity: 0.7 }}>삭제</button>
                          )}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {reply.content}
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '2px' }}>
                          <button 
                            onClick={() => handleCommentLike(reply.id, reply.likedBy && reply.likedBy.includes(auth.currentUser?.uid))}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0, color: auth.currentUser && reply.likedBy && reply.likedBy.includes(auth.currentUser.uid) ? 'var(--primary-blue)' : 'var(--text-muted)' }}
                          >
                            <ThumbsUp size={12} fill={auth.currentUser && reply.likedBy && reply.likedBy.includes(auth.currentUser.uid) ? 'currentColor' : 'none'} /> 
                            {reply.likes || 0}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              아직 댓글이 없습니다. 첫 번째 댓글을 남겨주세요!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommunityPostDetail;

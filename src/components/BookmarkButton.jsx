import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

function BookmarkButton({ item, type, title, subtitle, link, itemId }) {
  const { currentUser } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate a unique ID if not provided
  const uid = currentUser?.uid;
  const docId = itemId ? `${type}_${itemId}` : `${type}_${title.replace(/[\s/]/g, '')}`;

  useEffect(() => {
    if (!uid) {
      setIsLoading(false);
      return;
    }

    const checkBookmark = async () => {
      try {
        const docRef = doc(db, 'users', uid, 'bookmarks', docId);
        const docSnap = await getDoc(docRef);
        setIsBookmarked(docSnap.exists());
      } catch (error) {
        console.error("Error checking bookmark:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkBookmark();
  }, [uid, docId]);

  const toggleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent card clicks if any

    if (!uid) {
      alert("로그인이 필요한 서비스입니다.");
      return;
    }

    setIsLoading(true);
    const docRef = doc(db, 'users', uid, 'bookmarks', docId);

    try {
      if (isBookmarked) {
        await deleteDoc(docRef);
        setIsBookmarked(false);
      } else {
        await setDoc(docRef, {
          id: docId,
          type,
          title,
          subtitle: subtitle || '',
          link: link || '',
          data: item,
          createdAt: new Date()
        });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      alert("북마크 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={toggleBookmark}
      disabled={isLoading}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'all 0.2s',
        opacity: isLoading ? 0.5 : 1
      }}
      className="bookmark-btn"
      title={isBookmarked ? "스크랩 취소" : "스크랩하기"}
    >
      <Bookmark 
        size={24} 
        color={isBookmarked ? "var(--primary-blue)" : "var(--text-muted)"} 
        fill={isBookmarked ? "var(--primary-blue)" : "none"} 
      />
    </button>
  );
}

export default BookmarkButton;

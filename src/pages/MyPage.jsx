import React, { useState, useEffect, useRef } from 'react';
import { User, Settings, Bookmark, MessageSquare, AlertTriangle, Clock, ThumbsUp, MapPin, Sparkles, Building, Gift, Download, Coffee, GripVertical, Palette, Calendar, Bell, Users, CheckCircle, Info, Plus } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import BookmarkButton from '../components/BookmarkButton';
import { fetchAIRecommendations } from '../utils/aiRecommender';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebase';
import { updateProfile, deleteUser } from 'firebase/auth';
import { collection, query, where, getDocs, collectionGroup, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import MyActivityTab from '../components/MyActivityTab';

function MyPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile State
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [profileMsg, setProfileMsg] = useState('');
  
  // Delete Account State
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState('');
  
  // 맞춤 조건 상태
  const [conditions, setConditions] = useState({
    location: '',
    interestedLocation: '',
    job: '',
    car: '',
    children: '',
    hobby: ''
  });

  // 맞춤 알림 상태 (Alerts)
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'users', currentUser.uid, 'alerts'));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0));
      setAlerts(fetched);
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAlertsRead = async () => {
    if (!currentUser) return;
    try {
      const unreadAlerts = alerts.filter(a => !a.isRead);
      for (const alert of unreadAlerts) {
        await updateDoc(doc(db, 'users', currentUser.uid, 'alerts', alert.id), { isRead: true });
      }
      setAlerts(alerts.map(a => ({ ...a, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // 가족 관리 상태 (Family)
  const [familyMembers, setFamilyMembers] = useState([]);
  const [newFamily, setNewFamily] = useState({ name: '', relation: '', birthYear: '', gender: 'M' });
  const [showAddFamily, setShowAddFamily] = useState(false);

  const fetchFamilyMembers = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'users', currentUser.uid, 'family'));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFamilyMembers(fetched);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddFamily = async (e) => {
    e.preventDefault();
    if (!newFamily.name || !newFamily.birthYear || !currentUser) return;
    try {
      const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'family'), newFamily);
      setFamilyMembers([...familyMembers, { ...newFamily, id: docRef.id }]);
      setNewFamily({ name: '', relation: '', birthYear: '', gender: 'M' });
      setShowAddFamily(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFamily = async (id) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'family', id));
      setFamilyMembers(familyMembers.filter(f => f.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Live DB Matching (정책 마스터 데이터 비교 및 시딩)
  const isMatchingRef = useRef(false);

  const matchPoliciesAndCreateAlerts = async () => {
    if (!currentUser || isMatchingRef.current) return;
    isMatchingRef.current = true;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userConditions = userDoc.exists() ? userDoc.data().conditions || {} : {};

      const policiesSnap = await getDocs(collection(db, 'policies'));
      const livePolicies = policiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const alertsSnap = await getDocs(collection(db, 'users', currentUser.uid, 'alerts'));
      const existingAlertIds = alertsSnap.docs.map(doc => doc.data().policyId);

      let addedNew = false;
      for (const policy of livePolicies) {
        if (!existingAlertIds.includes(policy.id)) {
          // AI 기반 맞춤 조건 필터링 엔진
          const targetArray = policy.targets || [];
          const locationsArray = policy.locations || [];
          let isMatch = false;

          if (targetArray.includes('전체') || targetArray.length === 0) {
            isMatch = true; // 전국민 대상
          } else {
            // 직업 관련 타겟
            if (targetArray.includes('프리랜서') && userConditions.job === '프리랜서') isMatch = true;
            if (targetArray.includes('소상공인') && userConditions.job === '자영업/소상공인') isMatch = true;
            if (targetArray.includes('직장인') && userConditions.job === '직장인') isMatch = true;
            
            // 가족 관련 타겟
            const familyTargets = ['가족', '다자녀', '임산부', '영유아'];
            if (familyTargets.some(t => targetArray.includes(t)) && userConditions.children && userConditions.children !== '없음') {
              isMatch = true;
            }
            
            // 청년/어르신 기본 매칭 (추후 나이 연동)
            if (targetArray.includes('청년')) isMatch = true; 
            if (targetArray.includes('어르신') && userConditions.job === '은퇴') isMatch = true;
          }

          // 지역 필터 (교집합 검증)
          if (isMatch && !locationsArray.includes('전국') && locationsArray.length > 0) {
            const userLoc = userConditions.location || '';
            const userInterestedLoc = userConditions.interestedLocation || '';
            const isLocMatch = locationsArray.some(loc => userLoc.includes(loc) || userInterestedLoc.includes(loc));
            
            if (!isLocMatch) {
              isMatch = false; // 타겟은 맞지만 거주지/관심지역이 다르면 차단
            }
          }

          if (isMatch) {
            const newAlert = {
              policyId: policy.id,
              type: policy.type || 'info',
              title: policy.title,
              desc: policy.desc,
              date: '오늘', // 실제 서비스에서는 정책 배포일
              isRead: false,
              createdAt: new Date()
            };
            await addDoc(collection(db, 'users', currentUser.uid, 'alerts'), newAlert);
            addedNew = true;
          }
        }
      }
      
      if (addedNew) {
        await fetchAlerts();
      }
    } catch (e) {
      console.error("Policy matching error", e);
    } finally {
      isMatchingRef.current = false;
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchFamilyMembers();
      fetchAlerts().then(() => {
        matchPoliciesAndCreateAlerts();
      });
    }
  }, [currentUser]);

  // AI 추천 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const resultsRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!resultsRef.current) return;
    setIsDownloading(true);
    try {
      const element = resultsRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = 210; // A4 width in mm
      const margin = 15;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      
      // Create PDF with dynamic height to perfectly fit the content
      const pdf = new jsPDF('p', 'mm', [pdfWidth, contentHeight + (margin * 2)]);
      
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
      
      const today = new Date();
      const dateString = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
      pdf.save(`맞춤추천결과_리포트_${dateString}.pdf`);
    } catch (error) {
      console.error('PDF 다운로드 오류:', error);
      alert('PDF 다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRunAI = async () => {
    setIsAnalyzing(true);
    setAiResults(null);
    try {
      const results = await fetchAIRecommendations(conditions);
      setAiResults(results);
      if (currentUser) {
        await setDoc(doc(db, 'users', currentUser.uid), { aiResults: results }, { merge: true });
      }
    } catch (error) {
      alert('AI 분석 중 오류가 발생했습니다. (API 키 혹은 네트워크를 확인해주세요.)');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [activePaletteId, setActivePaletteId] = useState(null);

  const PALETTE_COLORS = [
    { id: 'default', bg: '#ffffff', label: '기본' },
    { id: 'red', bg: '#ffe4e6', label: '빨강' },
    { id: 'yellow', bg: '#fef08a', label: '노랑' },
    { id: 'green', bg: '#dcfce7', label: '초록' },
    { id: 'blue', bg: '#dbeafe', label: '파랑' }
  ];

  const handleColorChange = async (bookmarkId, colorBg) => {
    try {
      if (!currentUser) return;
      await updateDoc(doc(db, 'users', currentUser.uid, 'bookmarks', bookmarkId), {
        color: colorBg
      });
      setBookmarks(prev => prev.map(b => b.id === bookmarkId ? { ...b, color: colorBg } : b));
      setActivePaletteId(null);
    } catch (error) {
      console.error("Color change error:", error);
    }
  };

  const fetchBookmarks = async () => {
    if (!currentUser) return;
    setLoadingBookmarks(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const orderData = userDoc.exists() ? userDoc.data().bookmarkOrder : null;

      const q = query(collection(db, 'users', currentUser.uid, 'bookmarks'));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (orderData && Array.isArray(orderData)) {
        fetched.sort((a, b) => {
          const indexA = orderData.indexOf(a.id);
          const indexB = orderData.indexOf(b.id);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
        });
      } else {
        fetched.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      }
      setBookmarks(fetched);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    const newBookmarks = [...bookmarks];
    const draggedItem = newBookmarks[draggedItemIndex];
    newBookmarks.splice(draggedItemIndex, 1);
    newBookmarks.splice(index, 0, draggedItem);
    
    setDraggedItemIndex(index);
    setBookmarks(newBookmarks);
  };

  const handleDragEnd = async () => {
    setDraggedItemIndex(null);
    if (currentUser) {
      const newOrder = bookmarks.map(b => b.id);
      try {
        await setDoc(doc(db, 'users', currentUser.uid), { bookmarkOrder: newOrder }, { merge: true });
      } catch (e) {
        console.error('Failed to save order', e);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Community State
  const [communityTab, setCommunityTab] = useState('my_posts');
  const [postsData, setPostsData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const formatPost = (docSnap) => {
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
    return { id: docSnap.id, ...data, time: timeStr };
  };

  // 맞춤 조건 현위치 가져오기
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.coord2RegionCode(longitude, latitude, (result, status) => {
              if (status === window.kakao.maps.services.Status.OK) {
                const region = result.find(r => r.region_type === 'H') || result[0];
                if (region) {
                  setConditions(prev => ({ ...prev, location: `${region.region_1depth_name} ${region.region_2depth_name}` }));
                }
              }
            });
          } else {
            setConditions(prev => ({ ...prev, location: '서울특별시 강남구' }));
          }
        },
        (error) => {
          alert('위치 권한을 허용해주세요.');
        }
      );
    } else {
      alert('브라우저가 위치 정보를 지원하지 않습니다.');
    }
  };

  const fetchPosts = async () => {
    if (!currentUser) return;
    setLoadingData(true);
    setErrorMsg('');
    try {
      let fetchedPosts = [];
      
      if (activeTab === 'community') {
        if (communityTab === 'my_posts') {
          const q = query(collection(db, 'posts'), where('authorUid', '==', currentUser.uid));
          const snap = await getDocs(q);
          fetchedPosts = snap.docs.map(formatPost);
        } else if (communityTab === 'my_likes') {
          const q = query(collection(db, 'posts'), where('likedBy', 'array-contains', currentUser.uid));
          const snap = await getDocs(q);
          fetchedPosts = snap.docs.map(formatPost);
        } else if (communityTab === 'my_bookmarks') {
          const q = query(collection(db, 'posts'), where('bookmarkedBy', 'array-contains', currentUser.uid));
          const snap = await getDocs(q);
          fetchedPosts = snap.docs.map(formatPost);
        } else if (communityTab === 'my_comments') {
          // Find all comments by this user
          const q = query(collectionGroup(db, 'comments'), where('authorUid', '==', currentUser.uid));
          const snap = await getDocs(q);
          
          const postIds = new Set();
          snap.docs.forEach(docSnap => {
            const path = docSnap.ref.path;
            const parts = path.split('/');
            if (parts.length >= 2 && parts[0] === 'posts') {
              postIds.add(parts[1]);
            }
          });
          
          // Fetch the parent posts
          const postPromises = Array.from(postIds).map(id => getDoc(doc(db, 'posts', id)));
          const postSnaps = await Promise.all(postPromises);
          fetchedPosts = postSnaps.filter(s => s.exists()).map(formatPost);
        }
      }
      
      // Sort by newest
      fetchedPosts.sort((a, b) => {
        const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setPostsData(fetchedPosts);
    } catch (error) {
      console.error(error);
      if (error.message) {
        const urlMatch = error.message.match(/(https:\/\/[^\s]+)/);
        if (urlMatch) {
          setErrorMsg(`데이터베이스 색인(Index) 생성이 필요합니다. 아래 링크를 클릭해 주세요:\n${urlMatch[0]}`);
        } else {
          setErrorMsg(`데이터를 불러오는 중 오류가 발생했습니다: ${error.message}`);
        }
      } else {
        setErrorMsg('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.conditions) {
              setConditions(data.conditions);
            }
            if (data.aiResults) {
              setAiResults(data.aiResults);
            }
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'community') {
      fetchPosts();
    } else if (activeTab === 'bookmarks') {
      fetchBookmarks();
    }
  }, [activeTab, communityTab]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(currentUser, { displayName });
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { displayName, conditions }, { merge: true });
      setProfileMsg('프로필 및 맞춤 조건이 성공적으로 업데이트되었습니다.');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (error) {
      console.error("Update profile error:", error);
      setProfileMsg('프로필 업데이트에 실패했습니다.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== '계정 삭제') {
      setDeleteError("'계정 삭제'를 정확히 입력해 주세요.");
      return;
    }
    
    try {
      await deleteUser(currentUser);
      alert('계정이 성공적으로 삭제되었습니다. 이용해 주셔서 감사합니다.');
      navigate('/');
    } catch (error) {
      console.error("Delete user error:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert('보안을 위해 재로그인이 필요합니다. 다시 로그인한 후 탈퇴를 진행해 주세요.');
        auth.signOut();
        navigate('/login');
      } else {
        setDeleteError('계정 삭제 중 오류가 발생했습니다.');
      }
    }
  };
  const renderPostList = () => {
    if (loadingData) return <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>데이터를 불러오는 중...</div>;
    
    if (errorMsg) return (
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
    );

    if (postsData.length === 0) return <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>해당하는 게시글이 없습니다.</div>;

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {postsData.map((post, index) => (
          <div 
            key={post.id} 
            onClick={() => navigate(`/${post.category === '부동산' ? 'real-estate' : 'welfare'}/community/${post.id}`)}
            style={{ padding: '24px', borderBottom: index !== postsData.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', gap: '20px', cursor: 'pointer', transition: 'background 0.2s', background: 'transparent' }} 
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(248,250,252,0.8)'} 
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {post.tags && post.tags.length > 0 ? (
                    post.tags.map((t, i) => (
                      <span key={i} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-blue)', background: 'rgba(37,99,235,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                        #{t}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}># {post.tag || post.category || '공통'}</span>
                  )}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-all' }}>
                  {post.title}
                </h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-all' }}>
                {post.content}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                <span>{post.isAnonymous ? '익명' : post.authorName}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {post.time}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={14} /> {post.likes || 0}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageSquare size={14} /> {post.comments || 0}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ minHeight: 'calc(100vh - 160px)' }}>
      <div className="mypage-grid" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px', height: '100%', minHeight: '600px', marginTop: '40px', marginBottom: '40px' }}>
        
        {/* Left Column: Title & Sidebar Tabs */}
        <div className="mypage-sidebar">
          <h1 className="page-title" style={{ marginBottom: '40px', fontSize: '2rem' }}>마이페이지</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('profile')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: 'none', background: activeTab === 'profile' ? 'var(--primary-blue)' : 'transparent', color: activeTab === 'profile' ? '#fff' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
            >
              <Settings size={18} /> 프로필 관리
            </button>
            <button 
              onClick={() => setActiveTab('alerts')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', border: 'none', background: activeTab === 'alerts' ? 'var(--primary-blue)' : 'transparent', color: activeTab === 'alerts' ? '#fff' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Bell size={18} /> 맞춤 알림
              </div>
              {alerts.filter(a => !a.isRead).length > 0 && (
                <span style={{ background: 'var(--accent-red)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '99px', fontWeight: 800 }}>
                  {alerts.filter(a => !a.isRead).length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('family')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: 'none', background: activeTab === 'family' ? 'var(--primary-blue)' : 'transparent', color: activeTab === 'family' ? '#fff' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
            >
              <Users size={18} /> 가족 통합 관리
            </button>
          <button 
            onClick={() => setActiveTab('conditions')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: 'none', background: activeTab === 'conditions' ? 'var(--primary-blue)' : 'transparent', color: activeTab === 'conditions' ? '#fff' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
          >
            <User size={18} /> 나의 맞춤 조건
          </button>
          <button 
            onClick={() => setActiveTab('bookmarks')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: 'none', background: activeTab === 'bookmarks' ? 'var(--primary-blue)' : 'transparent', color: activeTab === 'bookmarks' ? '#fff' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
          >
            <Bookmark size={18} /> 관심 스크랩
          </button>
          <button 
            onClick={() => setActiveTab('community')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: 'none', background: activeTab === 'community' ? 'var(--primary-blue)' : 'transparent', color: activeTab === 'community' ? '#fff' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
          >
            <MessageSquare size={18} /> 커뮤니티 활동
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: 'none', background: activeTab === 'activity' ? 'var(--primary-blue)' : 'transparent', color: activeTab === 'activity' ? '#fff' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
          >
            <Calendar size={18} /> 나의 활동 달력
          </button>
        </div>
        </div>

          {/* Content Area */}
        <div className="panel" style={{ padding: '0', height: '100%', minHeight: '600px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {/* My Activity Tab */}
          {activeTab === 'activity' && (
            <div className="fade-in mypage-section" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              <MyActivityTab currentUser={currentUser} />
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="fade-in mypage-section" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>나의 맞춤 알림</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>나의 프로필 조건에 맞는 새로운 정책과 혜택을 확인하세요.</p>
                </div>
                {alerts.some(a => !a.isRead) && (
                  <button onClick={markAllAlertsRead} style={{ fontSize: '0.85rem', color: 'var(--primary-blue)', background: 'rgba(37,99,235,0.1)', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    모두 읽음 처리
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {alerts.map(alert => (
                  <div key={alert.id} style={{ position: 'relative', background: alert.isRead ? '#f8fafc' : 'white', border: `1px solid ${alert.isRead ? 'var(--border-light)' : 'rgba(37,99,235,0.3)'}`, borderRadius: '16px', padding: '24px', display: 'flex', gap: '20px', transition: 'all 0.2s', boxShadow: alert.isRead ? 'none' : '0 4px 12px rgba(37,99,235,0.05)' }}>
                    {!alert.isRead && (
                      <div style={{ position: 'absolute', top: '24px', left: '0', width: '4px', height: '24px', background: 'var(--primary-blue)', borderRadius: '0 4px 4px 0' }}></div>
                    )}
                    <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: alert.type === 'urgent' ? 'rgba(239,68,68,0.1)' : alert.type === 'info' ? 'rgba(16,185,129,0.1)' : 'rgba(37,99,235,0.1)', color: alert.type === 'urgent' ? 'var(--accent-red)' : alert.type === 'info' ? 'var(--accent-green)' : 'var(--primary-blue)' }}>
                      <Bell size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: alert.isRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{alert.title}</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{alert.date}</span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>{alert.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Family Management Tab */}
          {activeTab === 'family' && (
            <div className="fade-in mypage-section" style={{ display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>가족 통합 관리</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>소중한 가족 구성원을 등록하고 맞춤 혜택을 통합해서 관리하세요.</p>
                </div>
                <button onClick={() => setShowAddFamily(!showAddFamily)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'white', background: 'var(--primary-blue)', padding: '10px 16px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <Plus size={16} /> 구성원 추가
                </button>
              </div>

              {showAddFamily && (
                <div style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>새 가족 구성원 추가</h3>
                  <form onSubmit={handleAddFamily} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">이름</label>
                        <input type="text" className="form-input" placeholder="예: 홍길동" value={newFamily.name} onChange={e => setNewFamily({...newFamily, name: e.target.value})} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">관계</label>
                        <select className="form-input" value={newFamily.relation} onChange={e => setNewFamily({...newFamily, relation: e.target.value})} required>
                          <option value="">선택</option>
                          <option value="배우자">배우자</option>
                          <option value="자녀">자녀</option>
                          <option value="부모님">부모님</option>
                          <option value="형제/자매">형제/자매</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">출생연도 (4자리)</label>
                        <input type="number" className="form-input" placeholder="예: 1980" value={newFamily.birthYear} onChange={e => setNewFamily({...newFamily, birthYear: e.target.value})} required min="1900" max={new Date().getFullYear()} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">성별</label>
                        <div style={{ display: 'flex', gap: '12px', height: '48px' }}>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: newFamily.gender === 'M' ? 'rgba(37,99,235,0.1)' : '#f8fafc', border: `1px solid ${newFamily.gender === 'M' ? 'var(--primary-blue)' : 'var(--border-light)'}`, color: newFamily.gender === 'M' ? 'var(--primary-blue)' : 'var(--text-secondary)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setNewFamily({...newFamily, gender: 'M'})}>남성</div>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: newFamily.gender === 'F' ? 'rgba(37,99,235,0.1)' : '#f8fafc', border: `1px solid ${newFamily.gender === 'F' ? 'var(--primary-blue)' : 'var(--border-light)'}`, color: newFamily.gender === 'F' ? 'var(--primary-blue)' : 'var(--text-secondary)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setNewFamily({...newFamily, gender: 'F'})}>여성</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                      <button type="button" onClick={() => setShowAddFamily(false)} style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'white', fontWeight: 600, cursor: 'pointer' }}>취소</button>
                      <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>추가하기</button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                {familyMembers.map(member => {
                  const currentYear = 2026;
                  const birthYearNum = parseInt(member.birthYear, 10);
                  const isEvenYear = currentYear % 2 === 0;
                  const isEvenBirth = birthYearNum % 2 === 0;
                  const isGeneralEligible = isEvenYear === isEvenBirth;
                  const age = currentYear - birthYearNum;

                  return (
                    <div key={member.id} style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f8fafc', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                            <User size={24} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{member.name}</h3>
                              <span style={{ fontSize: '0.75rem', background: 'var(--bg-base)', padding: '2px 8px', borderRadius: '6px', color: 'var(--text-secondary)', fontWeight: 600 }}>{member.relation}</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              {member.birthYear}년생 ({age}세) · {member.gender === 'M' ? '남성' : '여성'}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteFamily(member.id)} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>삭제</button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ background: isGeneralEligible ? 'rgba(16,185,129,0.05)' : '#f8fafc', border: `1px solid ${isGeneralEligible ? 'rgba(16,185,129,0.2)' : 'var(--border-light)'}`, padding: '16px', borderRadius: '12px' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px', color: isGeneralEligible ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                            {isGeneralEligible ? <CheckCircle size={16} /> : <Info size={16} />} 
                            일반건강검진
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {isGeneralEligible ? '올해(2026년) 무료 일반건강검진 대상자입니다.' : '올해는 일반건강검진 주기가 아닙니다.'}
                          </p>
                        </div>
                        <div style={{ background: age <= 6 ? 'rgba(139,92,246,0.05)' : '#f8fafc', border: `1px solid ${age <= 6 ? 'rgba(139,92,246,0.2)' : 'var(--border-light)'}`, padding: '16px', borderRadius: '12px' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px', color: age <= 6 ? 'var(--accent-purple)' : 'var(--text-secondary)' }}>
                            <AlertTriangle size={16} /> 맞춤 혜택/주의
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {age <= 6 ? '영유아 건강검진 및 필수 예방접종(수두 등) 시기가 도래했습니다.' : age >= 60 ? '어르신 국가 예방접종(폐렴구균, 대상포진 등) 대상 여부를 확인하세요.' : '현재 연령대에 특별히 도래한 필수 혜택/접종 일정이 없습니다.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="fade-in mypage-section" style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              
              {/* Top Section: Profile Info & Conditions */}
              <section>
                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  
                  {/* Basic Info */}
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', color: 'var(--text-primary)' }}>기본 정보 수정</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">이메일 계정 (수정 불가)</label>
                        <input type="email" value={currentUser.email} disabled className="form-input" style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border-light)', boxSizing: 'border-box' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">이름 (닉네임)</label>
                        <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="form-input" placeholder="이름을 입력하세요" required style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)' }} />
                  
                  {/* Conditions */}
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>나의 맞춤 조건 (선택)</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
                      향후 복지 지원금, 부동산 등 AI 맞춤 검색 추천에 활용될 정보입니다.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            사는 동네 
                            <button type="button" onClick={handleGetLocation} style={{ background: 'var(--bg-base)', border: 'none', color: 'var(--primary-blue)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px' }}>
                              <MapPin size={12} /> 현위치 가져오기
                            </button>
                          </label>
                          <input type="text" className="form-input" placeholder="예: 서울특별시 강남구" value={conditions.location} onChange={(e) => setConditions({...conditions, location: e.target.value})} />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>관심 지역</label>
                          <input type="text" className="form-input" placeholder="예: 성동구 성수동" value={conditions.interestedLocation} onChange={(e) => setConditions({...conditions, interestedLocation: e.target.value})} />
                        </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group">
                          <label className="form-label">직업</label>
                          <select className="form-input" value={conditions.job} onChange={(e) => setConditions({...conditions, job: e.target.value})}>
                            <option value="">선택해주세요</option>
                            <option value="student">학생</option>
                            <option value="employee">직장인</option>
                            <option value="business">자영업/사업</option>
                            <option value="freelancer">프리랜서</option>
                            <option value="none">무직</option>
                            <option value="other">기타</option>
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">자차 유무</label>
                          <select className="form-input" value={conditions.car} onChange={(e) => setConditions({...conditions, car: e.target.value})}>
                            <option value="">선택해주세요</option>
                            <option value="yes">있음</option>
                            <option value="no">없음</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group">
                          <label className="form-label">자녀 유무</label>
                          <select className="form-input" value={conditions.children} onChange={(e) => setConditions({...conditions, children: e.target.value})}>
                            <option value="">선택해주세요</option>
                            <option value="yes">있음</option>
                            <option value="no">없음</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">관심사/취미</label>
                          <input type="text" className="form-input" placeholder="예: 등산, 독서, 게임" value={conditions.hobby} onChange={(e) => setConditions({...conditions, hobby: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                    <button type="submit" className="btn btn-primary">정보 저장하기</button>
                    {profileMsg && <p style={{ color: 'var(--accent-green)', fontSize: '0.9rem', fontWeight: 600 }}>{profileMsg}</p>}
                  </div>
                </form>
              </section>

              {/* Bottom Section: Danger Zone */}
              <section style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  위험 구역 (계정 탈퇴)
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: 1.6 }}>
                  계정을 삭제하면 모든 스크랩 정보와 커뮤니티 활동 내역이 영구적으로 삭제되며 복구할 수 없습니다.<br/>
                  탈퇴를 원하시면 아래에 <strong>'계정 삭제'</strong>를 입력해 주세요.
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input 
                      type="text" 
                      placeholder="계정 삭제" 
                      value={deleteInput} 
                      onChange={e => { setDeleteInput(e.target.value); setDeleteError(''); }} 
                      className="form-input" 
                      style={{ padding: '12px 16px', borderRadius: '12px', border: deleteError ? '1px solid var(--accent-red)' : '1px solid var(--border-light)', width: '200px', boxSizing: 'border-box' }}
                    />
                    {deleteError && <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem' }}>{deleteError}</p>}
                  </div>
                  <button 
                    onClick={handleDeleteAccount} 
                    disabled={deleteInput !== '계정 삭제'}
                    className="btn" 
                    style={{ padding: '12px 24px', background: deleteInput === '계정 삭제' ? 'var(--accent-red)' : '#f87171', color: '#fff', opacity: deleteInput === '계정 삭제' ? 1 : 0.6, cursor: deleteInput === '계정 삭제' ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', flexShrink: 0, minWidth: 'max-content', border: 'none', borderRadius: '12px', fontWeight: 600 }}
                  >
                    탈퇴하기
                  </button>
                </div>
              </section>

            </div>
          )}

          {/* Conditions Tab */}
          {activeTab === 'conditions' && (
            <div className="fade-in mypage-section" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>나의 맞춤 분석</h2>
                <button 
                  onClick={handleRunAI} 
                  disabled={isAnalyzing}
                  style={{ 
                    padding: '10px 20px', 
                    borderRadius: '8px', 
                    background: isAnalyzing ? 'var(--border-light)' : 'var(--primary-blue)', 
                    color: isAnalyzing ? 'var(--text-muted)' : '#fff', 
                    border: 'none', 
                    fontSize: '0.95rem', 
                    fontWeight: 600, 
                    cursor: isAnalyzing ? 'not-allowed' : 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: isAnalyzing ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.2)'
                  }}
                >
                  <Sparkles size={18} style={{ animation: isAnalyzing ? 'spin 2s linear infinite' : 'none' }} />
                  {isAnalyzing ? '분석 중...' : 'AI 맞춤 추천 시작하기'}
                </button>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '32px', lineHeight: 1.6 }}>
                프로필에 등록하신 해시태그 기반으로 AI가 최적의 정책과 입지를 분석합니다.
              </p>

              {/* Conditions Summary Tags */}
              <div style={{ background: 'rgba(59, 130, 246, 0.03)', border: '1px solid var(--border-light)', padding: '24px', borderRadius: '16px', marginBottom: '40px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>현재 설정된 조건</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ padding: '6px 14px', background: '#fff', border: '1px solid var(--primary-blue)', color: 'var(--primary-blue)', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>#{conditions.location || '거주지미등록'}</span>
                    {conditions.interestedLocation && <span style={{ padding: '6px 14px', background: '#fff', border: '1px solid var(--accent-purple)', color: 'var(--accent-purple)', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>#{conditions.interestedLocation}</span>}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ padding: '6px 14px', background: '#fff', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>#{conditions.job === 'student' ? '학생' : conditions.job === 'employee' ? '직장인' : conditions.job === 'business' ? '자영업/사업' : conditions.job === 'freelancer' ? '프리랜서' : conditions.job === 'none' ? '무직' : conditions.job || '직업미등록'}</span>
                    <span style={{ padding: '6px 14px', background: '#fff', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>#{conditions.car === 'yes' ? '자차있음' : conditions.car === 'no' ? '대중교통(뚜벅이)' : '자차미등록'}</span>
                    <span style={{ padding: '6px 14px', background: '#fff', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>#{conditions.children === 'yes' ? '자녀있음' : conditions.children === 'no' ? '자녀없음' : '자녀미등록'}</span>
                    {conditions.hobby && <span style={{ padding: '6px 14px', background: '#fff', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>#{conditions.hobby}</span>}
                  </div>
                </div>
              </div>

              {/* Skeleton UI */}
              {isAnalyzing && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}><Gift size={24} color="var(--text-muted)" /> 맞춤 복지 정책 찾는 중...</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                      {[1, 2, 3].map(i => (
                        <div key={i} className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#fff', border: '1px solid var(--border-light)' }}>
                          <div className="skeleton-pulse" style={{ height: '20px', width: '70%', borderRadius: '6px' }}></div>
                          <div className="skeleton-pulse" style={{ height: '14px', width: '100%', borderRadius: '4px', marginTop: '8px' }}></div>
                          <div className="skeleton-pulse" style={{ height: '14px', width: '80%', borderRadius: '4px' }}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}><Building size={24} color="var(--text-muted)" /> 최적의 거주 입지 분석 중...</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                      {[1, 2, 3].map(i => (
                        <div key={i} className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#fff', border: '1px solid var(--border-light)' }}>
                          <div className="skeleton-pulse" style={{ height: '20px', width: '60%', borderRadius: '6px' }}></div>
                          <div className="skeleton-pulse" style={{ height: '14px', width: '90%', borderRadius: '4px', marginTop: '8px' }}></div>
                          <div className="skeleton-pulse" style={{ height: '14px', width: '85%', borderRadius: '4px' }}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}><Coffee size={24} color="var(--text-muted)" /> 맞춤 여가/생활 인프라 탐색 중...</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                      {[1, 2, 3].map(i => (
                        <div key={i} className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#fff', border: '1px solid var(--border-light)' }}>
                          <div className="skeleton-pulse" style={{ height: '20px', width: '65%', borderRadius: '6px' }}></div>
                          <div className="skeleton-pulse" style={{ height: '14px', width: '85%', borderRadius: '4px', marginTop: '8px' }}></div>
                          <div className="skeleton-pulse" style={{ height: '14px', width: '90%', borderRadius: '4px' }}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {aiResults && !isAnalyzing && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={handleDownloadPDF} 
                      disabled={isDownloading}
                      style={{ 
                        padding: '10px 20px', 
                        borderRadius: '8px', 
                        background: '#10b981', 
                        color: '#fff', 
                        border: 'none', 
                        fontSize: '0.95rem', 
                        fontWeight: 700, 
                        cursor: isDownloading ? 'wait' : 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Download size={18} style={{ animation: isDownloading ? 'pulse 1.5s infinite' : 'none' }} />
                      {isDownloading ? 'PDF 생성 중...' : '결과 리포트 다운로드 (PDF)'}
                    </button>
                  </div>

                  <div ref={resultsRef} style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '24px' }}>
                    
                    {/* Welfare Results */}
                    <section>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Gift size={24} color="var(--primary-blue)" /> 추천 맞춤 복지/지원금
                    </h3>
                    <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', wordBreak: 'keep-all' }}>
                        <thead>
                          <tr style={{ background: 'rgba(59,130,246,0.05)', borderBottom: '1px solid var(--border-light)' }}>
                            <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--primary-blue)', width: '25%' }}>정책/지원금명</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', width: '20%' }}>지원 대상</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', width: '25%' }}>지원 내용/금액</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', width: '30%' }}>추천 사유</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aiResults.welfare?.map((item, i) => (
                            <tr key={i} style={{ borderBottom: i !== aiResults.welfare.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                              <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{item.target}</td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{item.amount}</td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>{item.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Real Estate Results */}
                  <section>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Building size={24} color="#8b5cf6" /> 추천 부동산/입지
                    </h3>
                    <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', wordBreak: 'keep-all' }}>
                        <thead>
                          <tr style={{ background: 'rgba(139,92,246,0.05)', borderBottom: '1px solid var(--border-light)' }}>
                            <th style={{ padding: '12px 16px', fontWeight: 700, color: '#8b5cf6', width: '25%' }}>추천 입지/주택</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', width: '25%' }}>교통/인프라</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', width: '20%' }}>예상 시세/보증금</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', width: '30%' }}>추천 사유</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aiResults.realEstate?.map((item, i) => (
                            <tr key={i} style={{ borderBottom: i !== aiResults.realEstate.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                              <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{item.transport}</td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{item.price}</td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>{item.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Lifestyle Results */}
                  <section>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Coffee size={24} color="#ec4899" /> 추천 여가/생활 인프라
                    </h3>
                    <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', wordBreak: 'keep-all' }}>
                        <thead>
                          <tr style={{ background: 'rgba(236,72,153,0.05)', borderBottom: '1px solid var(--border-light)' }}>
                            <th style={{ padding: '12px 16px', fontWeight: 700, color: '#ec4899', width: '25%' }}>추천 인프라/시설</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', width: '20%' }}>관련 조건</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', width: '25%' }}>상세 혜택/정보</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', width: '30%' }}>추천 사유</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aiResults.lifestyle?.map((item, i) => (
                            <tr key={i} style={{ borderBottom: i !== aiResults.lifestyle.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                              <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{item.target}</td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{item.amount}</td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>{item.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* Bookmarks Tab */}
          {activeTab === 'bookmarks' && (
            loadingBookmarks ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>로딩 중...</div>
            ) : bookmarks.length === 0 ? (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', flex: 1, color: 'var(--text-muted)' }}>
                <Bookmark size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)' }}>아직 스크랩한 정보가 없습니다</h3>
                <p style={{ textAlign: 'center' }}>앞으로 제공될 복지 정책, 맞춤 지원금, 병원 정보 등<br/>다양한 공공 정보를 탐색하고 스크랩해보세요!</p>
              </div>
            ) : (
              <div className="fade-in mypage-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>내 관심 스크랩</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {bookmarks.map((bm, index) => (
                    <div 
                      key={bm.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      className="panel bookmark-item" 
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', 
                        background: bm.color || '#fff', border: '1px solid var(--border-light)', borderRadius: '16px',
                        cursor: 'grab',
                        opacity: draggedItemIndex === index ? 0.5 : 1,
                        boxShadow: draggedItemIndex === index ? '0 8px 24px rgba(0,0,0,0.1)' : 'var(--shadow-sm)',
                        transform: draggedItemIndex === index ? 'scale(1.02)' : 'scale(1)',
                        transition: 'box-shadow 0.2s, transform 0.2s, opacity 0.2s, background 0.3s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{ color: 'var(--border-medium)', marginTop: '4px', cursor: 'grab' }}>
                          <GripVertical size={20} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span className="badge badge-primary" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                              {bm.type === 'welfare' ? '맞춤 지원금' : bm.type === 'hospital' ? '1등급 병원' : bm.type === 'festival' ? '무료 축제' : bm.type === 'health' ? '휴일 약국' : bm.type === 'youth' ? '청년 정책' : bm.type}
                            </span>
                          </div>
                          <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{bm.title}</h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{bm.subtitle}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {bm.link && (
                          <button className="btn" style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-light)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); window.open(bm.link, '_blank'); }}>
                            상세보기
                          </button>
                        )}
                        <div style={{ position: 'relative' }}>
                          <button 
                            className="btn" 
                            style={{ padding: '8px', borderRadius: '50%', background: 'var(--bg-base)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); setActivePaletteId(activePaletteId === bm.id ? null : bm.id); }}
                          >
                            <Palette size={18} />
                          </button>
                          {activePaletteId === bm.id && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#fff', borderRadius: '12px', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', gap: '8px', zIndex: 10 }}>
                              {PALETTE_COLORS.map(c => (
                                <div 
                                  key={c.id} 
                                  title={c.label}
                                  onClick={(e) => { e.stopPropagation(); handleColorChange(bm.id, c.bg); }}
                                  style={{ width: '24px', height: '24px', borderRadius: '50%', background: c.bg, border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s' }}
                                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'}
                                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ background: 'var(--bg-base)', borderRadius: '50%', display: 'flex' }}>
                          <BookmarkButton item={bm.data} type={bm.type} title={bm.title} subtitle={bm.subtitle} link={bm.link} itemId={bm.id.replace(bm.type+'_', '')} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Community Tab */}
          {activeTab === 'community' && (
            <div className="fade-in mypage-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>커뮤니티 활동 내역</h2>
              <div style={{ borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button 
                    onClick={() => setCommunityTab('my_posts')}
                    style={{ padding: '12px 4px', border: 'none', background: 'none', borderBottom: communityTab === 'my_posts' ? '2px solid var(--primary-blue)' : '2px solid transparent', color: communityTab === 'my_posts' ? 'var(--primary-blue)' : 'var(--text-secondary)', fontWeight: communityTab === 'my_posts' ? 700 : 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.95rem' }}
                  >작성한 글</button>
                  <button 
                    onClick={() => setCommunityTab('my_comments')}
                    style={{ padding: '12px 4px', border: 'none', background: 'none', borderBottom: communityTab === 'my_comments' ? '2px solid var(--primary-blue)' : '2px solid transparent', color: communityTab === 'my_comments' ? 'var(--primary-blue)' : 'var(--text-secondary)', fontWeight: communityTab === 'my_comments' ? 700 : 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.95rem' }}
                  >댓글 단 글</button>
                  <button 
                    onClick={() => setCommunityTab('my_likes')}
                    style={{ padding: '12px 4px', border: 'none', background: 'none', borderBottom: communityTab === 'my_likes' ? '2px solid var(--primary-blue)' : '2px solid transparent', color: communityTab === 'my_likes' ? 'var(--primary-blue)' : 'var(--text-secondary)', fontWeight: communityTab === 'my_likes' ? 700 : 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.95rem' }}
                  >좋아요 한 글</button>
                  <button 
                    onClick={() => setCommunityTab('my_bookmarks')}
                    style={{ padding: '12px 4px', border: 'none', background: 'none', borderBottom: communityTab === 'my_bookmarks' ? '2px solid var(--primary-blue)' : '2px solid transparent', color: communityTab === 'my_bookmarks' ? 'var(--primary-blue)' : 'var(--text-secondary)', fontWeight: communityTab === 'my_bookmarks' ? 700 : 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.95rem' }}
                  >스크랩 한 글</button>
                </div>
              </div>
              {renderPostList()}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default MyPage;

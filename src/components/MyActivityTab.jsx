import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, FileText, ChevronLeft, ChevronRight, Save, Trash2, X, Palette } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function MyActivityTab({ currentUser }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Data: { '2026-06-01': { attended: true, memo: 'Searched for hospitals' } }
  const [activities, setActivities] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Memo form state
  const [memoText, setMemoText] = useState('');
  const [showStampAnim, setShowStampAnim] = useState(false);

  const PALETTE_COLORS = [
    { id: 'default', bg: '#f8fafc', label: '기본' },
    { id: 'red', bg: '#ffe4e6', label: '중요' },
    { id: 'yellow', bg: '#fef08a', label: '관심' },
    { id: 'green', bg: '#dcfce7', label: '완료' },
    { id: 'blue', bg: '#dbeafe', label: '참고' }
  ];
  const [selectedColor, setSelectedColor] = useState('#f8fafc');

  const getDotColor = (bgColor) => {
    switch (bgColor) {
      case '#ffe4e6': return '#f43f5e'; // rose-500
      case '#fef08a': return '#eab308'; // yellow-500
      case '#dcfce7': return '#22c55e'; // green-500
      case '#dbeafe': return '#3b82f6'; // blue-500
      case '#f8fafc': return '#94a3b8'; // slate-400
      default: return 'var(--primary-blue)';
    }
  };

  // Helper to format date to YYYY-MM-DD local
  const formatDateString = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const todayStr = formatDateString(new Date());
  const selectedStr = formatDateString(selectedDate);

  // Fetch activities from Firestore
  useEffect(() => {
    const fetchActivities = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'private', 'activities');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setActivities(docSnap.data().records || {});
        } else {
          setActivities({});
        }
      } catch (err) {
        console.error("Failed to fetch activities", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [currentUser]);

  useEffect(() => {
    setMemoText('');
    setSelectedColor('#f8fafc');
  }, [selectedStr]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const saveToFirebase = async (newActivities) => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, 'users', currentUser.uid, 'private', 'activities');
      await setDoc(docRef, { records: newActivities }, { merge: true });
    } catch (err) {
      console.error("Failed to save activity", err);
    }
  };

  const handleAttendance = async () => {
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }
    
    // Trigger stamp animation
    setShowStampAnim(true);
    setTimeout(() => setShowStampAnim(false), 1500);

    const newActivities = { ...activities };
    if (!newActivities[todayStr]) newActivities[todayStr] = {};
    newActivities[todayStr].attended = true;
    
    setActivities(newActivities);
    await saveToFirebase(newActivities);
  };

  const handleAddMemo = async () => {
    if (!memoText.trim()) return;
    const newActivities = { ...activities };
    if (!newActivities[selectedStr]) newActivities[selectedStr] = {};
    
    if (!newActivities[selectedStr].memos) {
      newActivities[selectedStr].memos = [];
    }
    newActivities[selectedStr].memos.push({
      id: Date.now().toString(),
      text: memoText,
      color: selectedColor
    });
    
    setActivities(newActivities);
    await saveToFirebase(newActivities);
    setMemoText('');
    setSelectedColor('#f8fafc');
  };

  const handleDeleteMemo = async (id) => {
    if (!window.confirm('메모를 삭제하시겠습니까?')) return;
    
    const newActivities = { ...activities };
    if (newActivities[selectedStr]) {
      if (id === 'legacy') {
        newActivities[selectedStr].memo = '';
        newActivities[selectedStr].color = '';
      } else if (newActivities[selectedStr].memos) {
        newActivities[selectedStr].memos = newActivities[selectedStr].memos.filter(m => m.id !== id);
      }
      
      // Clean up empty records
      const hasMemos = newActivities[selectedStr].memos && newActivities[selectedStr].memos.length > 0;
      if (!newActivities[selectedStr].attended && !newActivities[selectedStr].memo && !hasMemos) {
        delete newActivities[selectedStr];
      }
    }
    
    setActivities(newActivities);
    await saveToFirebase(newActivities);
  };

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  const calendarCells = [];
  
  // Previous month trailing days
  for (let i = 0; i < firstDay; i++) {
    const d = new Date(year, month - 1, daysInPrevMonth - firstDay + i + 1);
    calendarCells.push({ date: d, isCurrentMonth: false });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    calendarCells.push({ date: d, isCurrentMonth: true });
  }
  
  // Next month leading days (to fill 42 cells = 6 weeks)
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(year, month + 1, i);
    calendarCells.push({ date: d, isCurrentMonth: false });
  }

  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>활동 내역을 불러오는 중...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 팝업 도장 애니메이션 CSS */}
      <style>{`
        @keyframes stamp-pop {
          0% { transform: scale(3) rotate(-20deg); opacity: 0; }
          50% { transform: scale(0.8) rotate(5deg); opacity: 1; }
          70% { transform: scale(1.1) rotate(0deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .stamp-anim {
          animation: stamp-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          position: absolute;
          top: 50%;
          left: 50%;
          margin-top: -20px;
          margin-left: -20px;
          z-index: 10;
          color: #ef4444;
          filter: drop-shadow(0 4px 6px rgba(239, 68, 68, 0.3));
          pointer-events: none;
        }
      `}</style>

      {/* 헤더 & 출석체크 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0' }}>나의 활동 달력</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>매일 출석체크하고 오늘의 메모를 남겨보세요.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleAttendance}
            disabled={activities[todayStr]?.attended}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 24px', borderRadius: '12px',
              background: activities[todayStr]?.attended ? '#f1f5f9' : 'linear-gradient(135deg, var(--accent-red), #b91c1c)',
              color: activities[todayStr]?.attended ? 'var(--text-muted)' : 'white',
              fontWeight: 700, fontSize: '0.95rem',
              border: activities[todayStr]?.attended ? '1px solid var(--border-light)' : 'none',
              cursor: activities[todayStr]?.attended ? 'not-allowed' : 'pointer',
              boxShadow: activities[todayStr]?.attended ? 'none' : '0 4px 12px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            <CheckCircle2 size={18} />
            {activities[todayStr]?.attended ? '오늘 출석 완료' : '오늘 출석하기'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        
        {/* 달력 영역 */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border-light)', background: 'white', alignSelf: 'flex-start' }}>
          
          {/* 달력 컨트롤 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <button onClick={prevMonth} style={{ padding: '8px', borderRadius: '50%', background: '#f8fafc', color: 'var(--text-secondary)' }}><ChevronLeft size={20} /></button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {year}년 {month + 1}월
            </h3>
            <button onClick={nextMonth} style={{ padding: '8px', borderRadius: '50%', background: '#f8fafc', color: 'var(--text-secondary)' }}><ChevronRight size={20} /></button>
          </div>

          {/* 달력 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '12px' }}>
            {daysOfWeek.map((day, i) => (
              <div key={day} style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: i === 0 ? 'var(--accent-red)' : i === 6 ? 'var(--primary-blue)' : 'var(--text-secondary)' }}>
                {day}
              </div>
            ))}
          </div>

          {/* 달력 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {calendarCells.map((cell, idx) => {
              const cellDateStr = formatDateString(cell.date);
              const isSelected = cellDateStr === selectedStr;
              const isToday = cellDateStr === todayStr;
              const hasAttendance = activities[cellDateStr]?.attended;
              const cellAct = activities[cellDateStr];
              const hasLegacyMemo = !!cellAct?.memo;
              const hasArrayMemos = cellAct?.memos && cellAct.memos.length > 0;
              const hasMemo = hasLegacyMemo || hasArrayMemos;
              
              const allMemosForDay = [];
              if (hasLegacyMemo) allMemosForDay.push({ color: cellAct.color });
              if (hasArrayMemos) allMemosForDay.push(...cellAct.memos);
              
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(cell.date)}
                  style={{
                    aspectRatio: '1/1',
                    borderRadius: '12px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s',
                    background: isSelected ? 'rgba(37,99,235,0.05)' : 'transparent',
                    border: isSelected ? '1px solid var(--primary-blue)' : isToday ? '1px solid rgba(37,99,235,0.3)' : '1px solid transparent',
                    opacity: cell.isCurrentMonth ? 1 : 0.3
                  }}
                  onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ 
                    fontSize: '0.95rem', 
                    fontWeight: isToday || isSelected ? 800 : 500, 
                    color: isToday ? 'var(--primary-blue)' : 'var(--text-primary)',
                    zIndex: 2
                  }}>
                    {cell.date.getDate()}
                  </span>
                  
                  {/* 방금 찍힌 도장 애니메이션 */}
                  {isToday && showStampAnim && (
                    <div className="stamp-anim" style={{ zIndex: 10 }}>
                      <CheckCircle2 size={40} strokeWidth={1.5} color="var(--accent-red)" fill="rgba(239, 68, 68, 0.1)" />
                    </div>
                  )}
                  
                  {/* 도장 아이콘 (기존) */}
                  {hasAttendance && !(isToday && showStampAnim) && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', marginTop: '-20px', marginLeft: '-20px', opacity: 0.8, color: 'var(--accent-red)', zIndex: 1, pointerEvents: 'none' }}>
                      <CheckCircle2 size={40} strokeWidth={1.5} opacity={0.3} fill="rgba(239, 68, 68, 0.1)" />
                    </div>
                  )}
                  
                  {/* 메모 인디케이터 (수평 나열된 점) */}
                  {hasMemo && (
                    <div style={{ position: 'absolute', bottom: '4px', display: 'flex', gap: '3px', justifyContent: 'center', width: '100%', zIndex: 2 }}>
                      {allMemosForDay.slice(0, 3).map((m, i) => (
                        <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: getDotColor(m.color) }} />
                      ))}
                      {allMemosForDay.length > 3 && (
                        <div style={{ fontSize: '0.5rem', lineHeight: '4px', color: 'var(--text-secondary)', fontWeight: 800 }}>+</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 메모 영역 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border-light)', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} className="text-gradient" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 메모
                </h3>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              
              {/* Existing Memos List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {(!activities[selectedStr]?.memo && (!activities[selectedStr]?.memos || activities[selectedStr].memos.length === 0)) ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed var(--border-medium)' }}>
                    작성된 메모가 없습니다.
                  </div>
                ) : (
                  <>
                    {activities[selectedStr]?.memo && (
                      <div style={{ padding: '16px', background: activities[selectedStr]?.color || '#f8fafc', borderRadius: '12px', position: 'relative', border: '1px solid var(--border-light)' }}>
                        <button onClick={() => handleDeleteMemo('legacy')} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          <X size={16} />
                        </button>
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingRight: '24px' }}>
                          {activities[selectedStr].memo}
                        </div>
                      </div>
                    )}
                    {activities[selectedStr]?.memos?.map(m => (
                      <div key={m.id} style={{ padding: '16px', background: m.color || '#f8fafc', borderRadius: '12px', position: 'relative', border: '1px solid var(--border-light)' }}>
                        <button onClick={() => handleDeleteMemo(m.id)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          <X size={16} />
                        </button>
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingRight: '24px' }}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Add New Memo Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '0 4px' }}>
                  <Palette size={16} color="var(--text-secondary)" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginRight: '4px' }}>새 메모 색상:</span>
                  {PALETTE_COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedColor(c.bg)}
                      title={c.label}
                      style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: c.bg, 
                        border: selectedColor === c.bg ? '2px solid var(--primary-blue)' : '1px solid var(--border-medium)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        transform: selectedColor === c.bg ? 'scale(1.1)' : 'scale(1)'
                      }}
                    />
                  ))}
                </div>

                <textarea
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                  placeholder="오늘 어떤 기능을 사용하셨나요? 피드백이나 일과를 남겨주세요."
                  style={{
                    width: '100%', minHeight: '100px', padding: '16px', borderRadius: '12px',
                    border: '1px solid var(--border-light)', background: selectedColor,
                    fontSize: '0.95rem', color: 'var(--text-primary)', resize: 'none', outline: 'none',
                    fontFamily: 'inherit', transition: 'background 0.3s'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={handleAddMemo}
                    disabled={!memoText.trim()}
                    style={{ 
                      padding: '10px 20px', borderRadius: '8px', color: 'white', fontWeight: 600, 
                      background: !memoText.trim() ? '#cbd5e1' : 'var(--primary-blue)',
                      display: 'flex', alignItems: 'center', gap: '6px', cursor: !memoText.trim() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Save size={16} /> 추가하기
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default MyActivityTab;

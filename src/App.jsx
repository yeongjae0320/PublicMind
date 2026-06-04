import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout & Core
import Layout from './Layout';
import Home from './pages/Home';
import DomainLayout from './pages/DomainLayout';
import DummyPage from './pages/DummyPage';
import CommunityBoard from './pages/CommunityBoard';
import CommunityWrite from './pages/CommunityWrite';
import CommunityPostDetail from './pages/CommunityPostDetail';
import Auth from './pages/Auth';
import AiAssistant from './pages/AiAssistant';
import MyPage from './pages/MyPage';

// Domain Features
import WelfareSearch from './pages/WelfareSearch';
import PolicyDetail from './pages/PolicyDetail';
import YouthPolicy from './pages/YouthPolicy';
import RealEstate from './pages/RealEstate';
import RealEstateAnalysis from './pages/RealEstateAnalysis';
import SafeRent from './pages/SafeRent';
import TravelSafety from './pages/TravelSafety';
import EmbassyContacts from './pages/EmbassyContacts';
import SchoolAnalysis from './pages/SchoolAnalysis';
import Health from './pages/Health';
import TopHospitals from './pages/TopHospitals';
import Traffic from './pages/Traffic';
import RealtimeTraffic from './pages/RealtimeTraffic';
import Environment from './pages/Environment';
import DisasterShelter from './pages/DisasterShelter';
import SafetyMap from './pages/SafetyMap';
import Education from './pages/Education';
import Childcare from './pages/Childcare';
import Culture from './pages/Culture';
import Festival from './pages/Festival';
import SportsReservation from './pages/SportsReservation';
import HealthCheckup from './pages/HealthCheckup';

import { AuthProvider } from './contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { analytics } from './firebase';
import { logEvent } from 'firebase/analytics';

function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'page_view', {
        page_path: location.pathname + location.search
      });
    }
  }, [location]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PageTracker />
        <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          
          {/* 복지/지원금 */}
          <Route path="welfare" element={<DomainLayout title="복지/지원금" menus={[{name: '맞춤 지원금 찾기', path: '/welfare/search'}, {name: '청년 정책', path: '/welfare/youth'}, {name: '복지 커뮤니티', path: '/welfare/community'}]} />}>
            <Route index element={<Navigate to="search" replace />} />
            <Route path="search" element={<WelfareSearch />} />
            <Route path="policy/:id" element={<PolicyDetail />} />
            <Route path="youth" element={<YouthPolicy />} />
            <Route path="community" element={<CommunityBoard category="복지" />} />
            <Route path="community/write" element={<CommunityWrite category="복지" />} />
            <Route path="community/:postId" element={<CommunityPostDetail category="복지" />} />
          </Route>
          
          {/* 부동산/입지 */}
          <Route path="real-estate" element={<DomainLayout title="부동산/입지" menus={[{name: '조건별 동네 찾기', path: '/real-estate/search'}, {name: '실거래가 분석', path: '/real-estate/analysis'}, {name: '전세/월세 지킴이', path: '/real-estate/safety'}, {name: '부동산 커뮤니티', path: '/real-estate/community'}]} />}>
            <Route index element={<Navigate to="search" replace />} />
            <Route path="search" element={<RealEstate />} />
            <Route path="analysis" element={<RealEstateAnalysis />} />
            <Route path="safety" element={<SafeRent />} />
            <Route path="community" element={<CommunityBoard category="부동산" />} />
            <Route path="community/write" element={<CommunityWrite category="부동산" />} />
            <Route path="community/:postId" element={<CommunityPostDetail category="부동산" />} />
          </Route>

          {/* 해외 안전 여행 */}
          <Route path="travel-safety" element={<DomainLayout title="해외 안전 여행" menus={[{name: '실시간 경보 지도', path: '/travel-safety/map'}, {name: '영사관 연락처', path: '/travel-safety/contacts'}, {name: '여행 커뮤니티', path: '/travel-safety/community'}]} />}>
            <Route index element={<Navigate to="map" replace />} />
            <Route path="map" element={<TravelSafety />} />
            <Route path="contacts" element={<EmbassyContacts />} />
            <Route path="community" element={<CommunityBoard category="해외안전" />} />
            <Route path="community/write" element={<CommunityWrite category="해외안전" />} />
            <Route path="community/:postId" element={<CommunityPostDetail category="해외안전" />} />
          </Route>

          {/* 보건/의료 */}
          <Route path="health" element={<DomainLayout title="보건/의료" menus={[{name: '심야/휴일 약국', path: '/health/pharmacy'}, {name: '1등급 병원 검색', path: '/health/hospital'}, {name: '내 건강검진 가이드', path: '/health/checkup'}, {name: '보건 커뮤니티', path: '/health/community'}]} />}>
            <Route index element={<Navigate to="pharmacy" replace />} />
            <Route path="pharmacy" element={<Health />} />
            <Route path="hospital" element={<TopHospitals />} />
            <Route path="checkup" element={<HealthCheckup />} />
            <Route path="community" element={<CommunityBoard category="보건" />} />
            <Route path="community/write" element={<CommunityWrite category="보건" />} />
            <Route path="community/:postId" element={<CommunityPostDetail category="보건" />} />
          </Route>

          {/* 교통/주차 */}
          <Route path="traffic" element={<DomainLayout title="교통/주차" menus={[{name: '빈 주차장 찾기', path: '/traffic/parking'}, {name: '실시간 도로/CCTV', path: '/traffic/road'}, {name: '교통 커뮤니티', path: '/traffic/community'}]} />}>
            <Route index element={<Navigate to="parking" replace />} />
            <Route path="parking" element={<Traffic />} />
            <Route path="road" element={<RealtimeTraffic />} />
            <Route path="community" element={<CommunityBoard category="교통" />} />
            <Route path="community/write" element={<CommunityWrite category="교통" />} />
            <Route path="community/:postId" element={<CommunityPostDetail category="교통" />} />
          </Route>

          {/* 환경/안전 */}
          <Route path="environment" element={<DomainLayout title="환경/안전" menus={[{name: '미세먼지/오존', path: '/environment/air'}, {name: '지진해일 대피소', path: '/environment/shelter'}, {name: '안심 귀갓길 지도', path: '/environment/safety-map'}, {name: '환경 커뮤니티', path: '/environment/community'}]} />}>
            <Route index element={<Navigate to="air" replace />} />
            <Route path="air" element={<Environment />} />
            <Route path="shelter" element={<DisasterShelter />} />
            <Route path="safety-map" element={<SafetyMap />} />
            <Route path="community" element={<CommunityBoard category="환경" />} />
            <Route path="community/write" element={<CommunityWrite category="환경" />} />
            <Route path="community/:postId" element={<CommunityPostDetail category="환경" />} />
          </Route>

          {/* 교육/보육 */}
          <Route path="education" element={<DomainLayout title="교육/보육" menus={[{name: '어린이집 현황', path: '/education/childcare'}, {name: '학군 분석', path: '/education/school-district'}, {name: '교육 커뮤니티', path: '/education/community'}]} />}>
            <Route index element={<Navigate to="childcare" replace />} />
            <Route path="childcare" element={<Childcare />} />
            <Route path="school-district" element={<SchoolAnalysis />} />
            <Route path="community" element={<CommunityBoard category="교육" />} />
            <Route path="community/write" element={<CommunityWrite category="교육" />} />
            <Route path="community/:postId" element={<CommunityPostDetail category="교육" />} />
          </Route>

          {/* 문화/여가 */}
          <Route path="culture" element={<DomainLayout title="문화/여가" menus={[{name: '공공 캠핑장', path: '/culture/camping'}, {name: '무료 축제/공연', path: '/culture/festival'}, {name: '공공 체육시설 예약', path: '/culture/sports'}, {name: '문화 커뮤니티', path: '/culture/community'}]} />}>
            <Route index element={<Navigate to="camping" replace />} />
            <Route path="camping" element={<Culture />} />
            <Route path="festival" element={<Festival />} />
            <Route path="sports" element={<SportsReservation />} />
            <Route path="community" element={<CommunityBoard category="문화" />} />
            <Route path="community/write" element={<CommunityWrite category="문화" />} />
            <Route path="community/:postId" element={<CommunityPostDetail category="문화" />} />
          </Route>

          {/* 기타 라우트 */}
          <Route path="ai-assistant" element={<AiAssistant />} />
          <Route path="login" element={<Auth />} />
          <Route path="register" element={<Auth />} />
          <Route path="mypage" element={<MyPage />} />
        </Route>
      </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// 페이지 컴포넌트들
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Register from './pages/Register';
import JobseekerDashboard from './pages/JobseekerDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminJobPosts from './pages/AdminJobPosts';
import AdminStats from './pages/AdminStats';
import Profile from './pages/Profile';
import JobApplication from './pages/JobApplication';
import ApplicationDetail from './pages/ApplicationDetail';
import ApplicationEdit from './pages/ApplicationEdit';
import ApplicationTemplates from './pages/ApplicationTemplates';
import Notifications from './pages/Notifications';
import Applications from './pages/Applications';
import MyApplications from './pages/MyApplications';
import HiredCandidates from './pages/HiredCandidates';
import JobPostDetail from './pages/JobPostDetail';
import JobList from './pages/JobList';
import Reviews from './pages/Reviews';
import ReviewForm from './pages/ReviewForm';
import ResortReview from './pages/ResortReview';
import ReviewsMediaForm from './pages/ReviewsMediaForm';
import CompanyInfoPage from './pages/CompanyInfo';
import AccommodationInfoPage from './pages/AccommodationInfo';
import WorkTypesPage from './pages/WorkTypesPage';
import JobPostForm from './pages/JobPostForm';
import GatePage from './pages/GatePage';
import CrewDashboard from './pages/CrewDashboard';

// 레이아웃 컴포넌트
import Layout from './components/Layout';
import HomeLayout from './components/HomeLayout';

// 로딩 컴포넌트
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-resort-500 mx-auto mb-4"></div>
      <p className="text-gray-600">로딩 중...</p>
    </div>
  </div>
);

// 에러 페이지 컴포넌트
const ErrorPage: React.FC<{ message?: string }> = ({ message = "페이지를 찾을 수 없습니다." }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">오류가 발생했습니다</h1>
      <p className="text-gray-600">{message}</p>
      <button 
        onClick={() => window.history.back()} 
        className="mt-4 px-4 py-2 bg-resort-500 text-white rounded hover:bg-resort-600"
      >
        이전 페이지로 돌아가기
      </button>
    </div>
  </div>
);

// 보호된 라우트 컴포넌트
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles?: string[];
  fallback?: React.ReactNode;
}> = ({ 
  children, 
  allowedRoles,
  fallback = <ErrorPage message="접근 권한이 없습니다." />
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// 대시보드 라우팅 컴포넌트
const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'jobseeker':
      return <JobseekerDashboard />;
    case 'employer':
      return <CompanyDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Routes>
            {/* 공개 라우트 - HomeLayout 사용 */}
            <Route path="/" element={
              <HomeLayout>
                <GatePage />
              </HomeLayout>
            } />
            <Route path="/home" element={
              <HomeLayout>
                <Home />
              </HomeLayout>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/register" element={<Register />} />
            
            {/* 구인공고 관련 라우트 */}
            <Route path="/jobs" element={<Navigate to="/" replace />} />
            <Route path="/job/:id" element={
              <HomeLayout>
                <JobPostDetail />
              </HomeLayout>
            } />
            
            {/* 회사 정보 관련 라우트 */}
            <Route path="/company/:employerId" element={
              <HomeLayout>
                <CompanyInfoPage />
              </HomeLayout>
            } />
            <Route path="/accommodation/:employerId" element={
              <HomeLayout>
                <AccommodationInfoPage />
              </HomeLayout>
            } />
            
            {/* 리뷰 관련 라우트 */}
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/reviews/new" element={<ReviewForm />} />
            <Route path="/reviews/media/new" element={<ReviewsMediaForm />} />
            <Route path="/resort/:id/reviews" element={<ResortReview />} />

            {/* 보호된 라우트 - Layout 사용 */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardRouter />
                </Layout>
              </ProtectedRoute>
            } />

            {/* 구직자 전용 라우트 */}
            <Route path="/jobseeker" element={
              <ProtectedRoute allowedRoles={['jobseeker']}>
                <HomeLayout>
                  <JobseekerDashboard />
                </HomeLayout>
              </ProtectedRoute>
            } />

            {/* 구인자 전용 라우트 */}
            <Route path="/employer" element={
              <ProtectedRoute allowedRoles={['employer']}>
                <Layout>
                  <CompanyDashboard />
                </Layout>
              </ProtectedRoute>
            } />

            {/* 관리자 전용 라우트 */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <AdminUsers />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/admin/jobposts" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <AdminJobPosts />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/admin/stats" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <AdminStats />
                </Layout>
              </ProtectedRoute>
            } />

            {/* 프로필 페이지 */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />

            {/* 지원서 관련 라우트 */}
            <Route path="/apply/:jobId" element={
              <ProtectedRoute allowedRoles={['jobseeker']}>
                <Layout>
                  <JobApplication />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/applications" element={
              <ProtectedRoute allowedRoles={['employer']}>
                <Layout>
                  <Applications />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/my-applications" element={
              <ProtectedRoute allowedRoles={['jobseeker']}>
                <Layout>
                  <MyApplications />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/hired-candidates" element={
              <ProtectedRoute allowedRoles={['employer']}>
                <Layout>
                  <HiredCandidates />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/application-detail/:applicationId" element={
              <ProtectedRoute allowedRoles={['employer', 'jobseeker']}>
                <Layout>
                  <ApplicationDetail />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/application-edit/:applicationId" element={
              <ProtectedRoute allowedRoles={['jobseeker']}>
                <Layout>
                  <ApplicationEdit />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/application-templates" element={
              <ProtectedRoute allowedRoles={['jobseeker']}>
                <Layout>
                  <ApplicationTemplates />
                </Layout>
              </ProtectedRoute>
            } />

            {/* 알림 페이지 */}
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Layout>
                  <Notifications />
                </Layout>
              </ProtectedRoute>
            } />

            {/* 근무 Type 관리 페이지 */}
            <Route path="/work-types" element={
              <ProtectedRoute allowedRoles={['employer']}>
                <Layout>
                  <WorkTypesPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* 구인공고 등록/수정 페이지 */}
            <Route path="/job-post/new" element={
              <ProtectedRoute allowedRoles={['employer']}>
                <Layout>
                  <JobPostForm />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/job-post/:id/edit" element={
              <ProtectedRoute allowedRoles={['employer']}>
                <Layout>
                  <JobPostForm />
                </Layout>
              </ProtectedRoute>
            } />

            {/* 크루 대시보드 페이지 */}
            <Route path="/crew-dashboard" element={
              <ProtectedRoute allowedRoles={['jobseeker']}>
                <Layout>
                  <CrewDashboard />
                </Layout>
              </ProtectedRoute>
            } />

            {/* 404 페이지 */}
            <Route path="*" element={<ErrorPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 
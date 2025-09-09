import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Menu, X, UserPlus, Home, Users, FileText, BarChart3, Building } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinkClass = (path: string) => {
    const base = 'text-gray-700 hover:text-resort-600 px-3 py-2 rounded-md text-sm font-medium transition-colors';
    const active = 'text-resort-700 border-b-2 border-resort-600';
    return isActivePath(path) ? `${base} ${active}` : base;
  };

  const navLinkClassMobile = (path: string) => {
    const base = 'text-gray-700 hover:text-resort-600 block px-3 py-2 rounded-md text-base font-medium transition-colors';
    const active = 'text-resort-700 border-b-2 border-resort-600';
    return isActivePath(path) ? `${base} ${active}` : base;
  };

  const handleLogout = async () => {
    try {
      await logout();
      // 로그아웃 후 소개페이지로 리다이렉트
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const getMenuItems = () => {
    if (!user) return [];

    switch (user.role) {
    case 'jobseeker':
      return [
        { path: '/jobseeker-dashboard', label: '대시보드', icon: Home },
      ];
    case 'employer':
      return [
        { path: '/employer-dashboard', label: '대시보드', icon: Home },
      ];
    case 'admin':
      return [
        { path: '/admin-dashboard', label: '관리자 대시보드', icon: Home },
      ];
    default:
      return [];
    }
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <div className="w-8 h-8 bg-resort-500 rounded-lg flex items-center justify-center mr-3 group-hover:bg-resort-600 transition-colors">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900 group-hover:text-resort-600 transition-colors">리조트바이트</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* 공개 메뉴 */}
            <Link to="/" className={navLinkClass('/')}>
              소개
            </Link>
            <Link to="/home" className={navLinkClass('/home')}>
              홈
            </Link>
            <Link to="/reviews" className={`${navLinkClass('/reviews')} flex items-center gap-1`}>
              <span role="img" aria-label="life">🌴</span> 리조트바이트 생활
            </Link>
            <Link to="/accommodations" className={`bg-resort-50 text-resort-700 hover:bg-resort-100 border border-resort-200 px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-1 shadow-sm transition-colors ${isActivePath('/accommodations') ? 'border-b-2 border-resort-600' : ''}`}>
              <Building className="w-4 h-4" />
              기숙사
            </Link>
            
            {/* 로그인 필요 메뉴 */}
            {user ? (
              <>
                {/* 사용자별 메뉴 */}
                {getMenuItems().map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={navLinkClass(item.path)}
                    >
                      <Icon className="w-4 h-4 inline mr-1" />
                      {item.label}
                    </Link>
                  );
                })}

                
                <div className="relative group">
                  <Link to="/profile" className={`flex items-center ${navLinkClass('/profile')}`}>
                    <User className="w-4 h-4 mr-1" />
                    {user.displayName}
                  </Link>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-200">
                    <Link
                      to="/profile"
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <User className="w-4 h-4 mr-2" />
                      프로필
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      로그아웃
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-3 ml-4">
                  <Link to="/login" className="text-gray-700 hover:text-resort-600 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    로그인
                  </Link>
                  <Link to="/signup" className="bg-resort-500 hover:bg-resort-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-200 flex items-center">
                    <UserPlus className="w-4 h-4 mr-1" />
                    회원가입
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-resort-600 p-2 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {/* 공개 메뉴 */}
            <Link to="/" className={navLinkClassMobile('/')}
            >
              소개
            </Link>
            <Link to="/home" className={navLinkClassMobile('/home')}>
              홈
            </Link>
            <Link to="/reviews" className={`${navLinkClassMobile('/reviews')} flex items-center gap-2`}>
              <span role="img" aria-label="life">🌴</span> 리조트바이트 생활
            </Link>
            <Link to="/accommodations" className={`bg-resort-50 text-resort-700 hover:bg-resort-100 border border-resort-200 block px-3 py-2 rounded-md text-base font-semibold flex items-center gap-2 shadow-sm transition-colors ${isActivePath('/accommodations') ? 'border-b-2 border-resort-600' : ''}`}>
              <Building className="w-4 h-4" />
              기숙사
            </Link>
            
            {user ? (
              <>
                {/* 사용자별 메뉴 */}
                {getMenuItems().map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={navLinkClassMobile(item.path)}
                    >
                      <Icon className="w-4 h-4 inline mr-2" />
                      {item.label}
                    </Link>
                  );
                })}

                <Link to="/profile" className={`flex items-center ${navLinkClassMobile('/profile')}`}>
                  <User className="w-4 h-4 mr-2" />
                  프로필
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left text-gray-700 hover:text-resort-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <div className="pt-4 border-t border-gray-200">
                  <Link to="/login" className="text-gray-700 hover:text-resort-600 block px-3 py-2 rounded-md text-base font-medium transition-colors">
                    로그인
                  </Link>
                  <Link to="/signup" className="bg-resort-500 hover:bg-resort-600 text-white block px-3 py-2 rounded-md text-base font-medium transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-200 flex items-center">
                    <UserPlus className="w-4 h-4 mr-2" />
                    회원가입
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 
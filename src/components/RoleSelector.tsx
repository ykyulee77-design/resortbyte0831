import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building, ArrowRight } from 'lucide-react';

interface RoleSelectorProps {
  user: {
    uid: string;
    email: string;
    displayName: string;
    roles: string[];
  };
  onRoleSelect: (role: string) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ user, onRoleSelect }) => {
  const navigate = useNavigate();

  const handleRoleSelect = (role: string) => {
    onRoleSelect(role);
    
    // 역할에 따른 대시보드로 이동
    if (role === 'employer') {
      navigate('/employer-dashboard');
    } else if (role === 'jobseeker') {
      navigate('/jobseeker-dashboard');
    } else if (role === 'admin') {
      navigate('/admin-dashboard');
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'jobseeker':
        return {
          title: '크루 (구직자)',
          description: '리조트에서 일할 기회를 찾고 있어요',
          icon: User,
          color: 'blue',
          features: ['간편한 이력서 작성', '맞춤형 일자리 추천', '리조트 후기 및 정보']
        };
      case 'employer':
        return {
          title: '리조트 (채용자)',
          description: '우수한 인재를 찾고 있어요',
          icon: Building,
          color: 'green',
          features: ['채용 공고 등록', '인재 검색', '매칭 서비스']
        };
      case 'admin':
        return {
          title: '관리자',
          description: '시스템을 관리하고 있어요',
          icon: Building,
          color: 'purple',
          features: ['사용자 관리', '시스템 모니터링', '데이터 분석']
        };
      default:
        return {
          title: role,
          description: '역할을 선택하세요',
          icon: User,
          color: 'gray',
          features: []
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            안녕하세요, {user.displayName}님! 👋
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            어떤 역할로 접속하시겠어요?
          </p>
          <p className="mt-1 text-sm text-gray-500">
            등록된 역할 중에서 선택해주세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {user.roles.map((role) => {
            const roleInfo = getRoleInfo(role);
            const Icon = roleInfo.icon;
            
            return (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                className={`group relative bg-white p-8 rounded-xl border-2 border-gray-200 hover:border-${roleInfo.color}-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-${roleInfo.color}-500 focus:ring-offset-2`}
              >
                <div className="text-center">
                  <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-${roleInfo.color}-100 group-hover:bg-${roleInfo.color}-200 transition-colors`}>
                    <Icon className={`h-8 w-8 text-${roleInfo.color}-600`} />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900">{roleInfo.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {roleInfo.description}
                  </p>
                  <div className="mt-4 space-y-2 text-xs text-gray-500">
                    {roleInfo.features.map((feature, index) => (
                      <p key={index}>• {feature}</p>
                    ))}
                  </div>
                  <div className={`mt-6 flex items-center justify-center text-${roleInfo.color}-600 group-hover:text-${roleInfo.color}-700`}>
                    <span className="text-sm font-medium">선택하기</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            다른 역할로 등록하고 싶으시다면{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-resort-600 hover:text-resort-700 font-medium"
            >
              회원가입
            </button>
            페이지를 이용해주세요
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;

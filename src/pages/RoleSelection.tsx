import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import RoleSelector from '../components/RoleSelector';

const RoleSelection: React.FC = () => {
  const { user, selectRole } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  const handleRoleSelect = async (role: string) => {
    try {
      await selectRole(role);
    } catch (error) {
      console.error('역할 선택 실패:', error);
    }
  };

  return (
    <RoleSelector 
      user={user as any} 
      onRoleSelect={handleRoleSelect} 
    />
  );
};

export default RoleSelection;

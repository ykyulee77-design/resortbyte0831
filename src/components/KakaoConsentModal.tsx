import React from 'react';
import { X, Shield, Eye, Phone, Mail, User } from 'lucide-react';

interface KakaoConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
  selectedRole: string;
}

const KakaoConsentModal: React.FC<KakaoConsentModalProps> = ({
  isOpen,
  onClose,
  onAgree,
  selectedRole
}) => {
  if (!isOpen) return null;

  const roleLabel = selectedRole === 'jobseeker' ? '크루' : '리조트';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-6 w-6 text-yellow-600" />
              카카오 정보제공 동의
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-yellow-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {roleLabel} 회원가입을 위한 정보제공 동의
            </h4>
            <p className="text-sm text-gray-600">
              리조트바이트 서비스 이용을 위해 카카오에서 다음 정보를 제공받습니다.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-gray-900 mb-3">제공받는 정보</h5>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-900">이메일</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-900">닉네임</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">
            제공받은 정보는 서비스 제공 목적으로만 사용되며, 안전하게 보호됩니다.
          </div>

          <div className="text-xs text-gray-500 text-center">
            동의하시면 카카오 로그인 페이지로 이동합니다.
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              취소
            </button>
            <button
              onClick={onAgree}
              className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
            >
              동의하고 계속하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KakaoConsentModal;

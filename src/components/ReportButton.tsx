import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { ReportTargetType } from '../types';
import ReportModal from './ReportModal';

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  targetName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'text' | 'button' | 'icon';
}

const ReportButton: React.FC<ReportButtonProps> = ({
  targetType,
  targetId,
  targetName,
  className = '',
  size = 'md',
  variant = 'button'
}) => {
  const [showReportModal, setShowReportModal] = useState(false);

  const handleReportClick = () => {
    setShowReportModal(true);
  };

  const getButtonContent = () => {
    switch (variant) {
      case 'icon':
        return (
          <div className="flex flex-col items-center">
            <Flag className="h-4 w-4" />
            <span className="text-xs mt-0.5">신고</span>
          </div>
        );
      case 'text':
        return '신고하기';
      case 'button':
      default:
        return (
          <>
            <Flag className="h-4 w-4 mr-1" />
            신고하기
          </>
        );
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      case 'md':
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'icon':
        return 'p-2 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 min-w-[3rem]';
      case 'text':
        return 'text-red-500 hover:text-red-700 underline';
      case 'button':
      default:
        return 'bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg';
    }
  };

  return (
    <>
      <button
        onClick={handleReportClick}
        className={`
          ${getVariantClasses()}
          ${getSizeClasses()}
          ${className}
          transition-colors duration-200
          flex items-center justify-center
        `}
        title={`${targetName || '이 항목'}을 신고하기`}
      >
        {getButtonContent()}
      </button>

      {showReportModal && (
        <ReportModal
          targetType={targetType}
          targetId={targetId}
          targetName={targetName}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
};

export default ReportButton;

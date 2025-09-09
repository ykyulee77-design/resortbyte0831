import React, { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';

interface WorkTypeHelpBannerProps {
  storageKey?: string;
}

const WorkTypeHelpBanner: React.FC<WorkTypeHelpBannerProps> = ({ storageKey = 'rtb_worktype_help_dismissed' }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(storageKey);
      if (dismissed === '1') setVisible(false);
    } catch {}
  }, [storageKey]);

  const handleClose = () => {
    setVisible(false);
    try {
      localStorage.setItem(storageKey, '1');
    } catch {}
  };

  if (!visible) return null;

  return (
    <div className="relative rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
      <button onClick={handleClose} className="absolute right-2 top-2 text-blue-500 hover:text-blue-700" aria-label="도움말 닫기">
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 mt-0.5 text-blue-600 flex-shrink-0" />
        <div>
          <p className="font-semibold mb-1">근무타입 설정으로 매칭 정확도를 높여보세요</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>근무타입을 만들고 요일·시간대를 선택합니다.</li>
            <li>시급 등 조건을 입력하고 저장합니다.</li>
            <li>공고에 한 개 이상 근무타입을 연결합니다.</li>
            <li>크루는 선호 시간과 비교되어 자동 매칭됩니다.</li>
          </ol>
          <p className="mt-2 text-xs text-blue-700">언제든지 수정할 수 있으며, 여러 근무타입을 만들어 유연하게 채용할 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
};

export default WorkTypeHelpBanner;



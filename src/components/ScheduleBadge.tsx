import React from 'react';

interface ScheduleBadgeProps {
  variant?: 'smart' | 'priority1' | 'priority2';
  text?: string;
}

const ScheduleBadge: React.FC<ScheduleBadgeProps> = ({ variant = 'smart', text }) => {
  const styleMap = {
    smart: 'bg-blue-100 text-blue-700',
    priority1: 'bg-indigo-100 text-indigo-700',
    priority2: 'bg-sky-100 text-sky-700',
  } as const;

  const label = text || (variant === 'smart' ? '스마트 매칭' : variant === 'priority1' ? '1순위' : '2순위');

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styleMap[variant]}`}>
      {label}
    </span>
  );
};

export default ScheduleBadge;

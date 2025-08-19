import React from 'react';

interface VersionInfoProps {
  className?: string;
  showTime?: boolean;
  showDate?: boolean;
}

const VersionInfo: React.FC<VersionInfoProps> = ({ 
  className = "", 
  showTime = true, 
  showDate = true 
}) => {
  const version = "0.1.0";
  const buildTime = new Date();
  
  const formatTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    let timeString = `v${version}`;
    
    if (showDate) {
      timeString += ` (${year}-${month}-${day})`;
    }
    
    if (showTime) {
      timeString += ` ${hours}:${minutes}:${seconds}`;
    }
    
    return timeString;
  };

  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      {formatTime(buildTime)}
    </div>
  );
};

export default VersionInfo;

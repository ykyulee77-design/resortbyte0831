import React from 'react';
import { Clock, Send, CheckCircle, XCircle, Eye, FileText, MapPin } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'application' | 'status_change' | 'profile_update' | 'schedule_update';
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
  jobTitle?: string;
  companyName?: string;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  maxItems?: number;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities, maxItems = 5 }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <Send className="w-4 h-4 text-blue-600" />;
      case 'status_change':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'profile_update':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'schedule_update':
        return <Clock className="w-4 h-4 text-orange-600" />;
      default:
        return <Eye className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'application':
        return 'bg-blue-100 border-blue-200';
      case 'status_change':
        return 'bg-green-100 border-green-200';
      case 'profile_update':
        return 'bg-purple-100 border-purple-200';
      case 'schedule_update':
        return 'bg-orange-100 border-orange-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  const sortedActivities = activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, maxItems);

  if (sortedActivities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" />
          최근 활동
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">아직 활동 내역이 없습니다</p>
          <p className="text-sm text-gray-400 mt-1">일자리에 지원하면 여기에 표시됩니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-gray-600" />
        최근 활동
      </h3>
      
      <div className="space-y-4">
        {sortedActivities.map((activity, index) => (
          <div key={activity.id} className="flex items-start gap-3">
            {/* 타임라인 라인 */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              {index < sortedActivities.length - 1 && (
                <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
              )}
            </div>
            
            {/* 활동 내용 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {activity.title}
                </h4>
                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                {activity.description}
              </p>
              
              {activity.jobTitle && activity.companyName && (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{activity.jobTitle}</span>
                  <span>•</span>
                  <span className="truncate">{activity.companyName}</span>
                </div>
              )}
              
              {activity.status && (
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    activity.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.status === 'accepted' ? '채용 확정' :
                     activity.status === 'rejected' ? '불합격' :
                     activity.status === 'pending' ? '검토 중' : activity.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {activities.length > maxItems && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            더 많은 활동 보기
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;

import React from 'react';
import { TrendingUp, TrendingDown, Users, Clock, MapPin, DollarSign } from 'lucide-react';

interface DashboardStatsProps {
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  matchingScore?: number;
  preferredLocations?: string[];
  averageSalary?: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalApplications,
  pendingApplications,
  acceptedApplications,
  rejectedApplications,
  matchingScore = 0,
  preferredLocations = [],
  averageSalary = 0
}) => {
  const acceptanceRate = totalApplications > 0 ? (acceptedApplications / totalApplications * 100).toFixed(1) : '0';
  const pendingRate = totalApplications > 0 ? (pendingApplications / totalApplications * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
      {/* 총 지원 수 */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">총 지원</p>
            <p className="text-xl lg:text-2xl font-bold text-blue-900">{totalApplications}</p>
          </div>
          <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-xs text-blue-600">
          <TrendingUp className="w-3 h-3 mr-1" />
          <span>이번 달 {totalApplications}건</span>
        </div>
      </div>

      {/* 검토 중 */}
      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-700">검토 중</p>
            <p className="text-xl lg:text-2xl font-bold text-yellow-900">{pendingApplications}</p>
          </div>
          <div className="w-10 h-10 bg-yellow-200 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-xs text-yellow-600">
          <span>{pendingRate}% 비율</span>
        </div>
      </div>

      {/* 채용 확정 */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-700">채용 확정</p>
            <p className="text-xl lg:text-2xl font-bold text-green-900">{acceptedApplications}</p>
          </div>
          <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-xs text-green-600">
          <span>{acceptanceRate}% 합격률</span>
        </div>
      </div>

      {/* 매칭 점수 */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-700">매칭 점수</p>
            <p className="text-xl lg:text-2xl font-bold text-purple-900">{matchingScore}%</p>
          </div>
          <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-xs text-purple-600">
          <span>근무시간 매칭도</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;

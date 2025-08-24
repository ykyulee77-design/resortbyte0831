import React from 'react';
import { Clock, Sparkles, ArrowRight, Target, Zap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SmartMatchingCTAProps {
  title?: string;
  description?: string;
  onOpenSchedule?: () => void;
  variant?: 'default' | 'enhanced' | 'minimal';
}

const SmartMatchingCTA: React.FC<SmartMatchingCTAProps> = ({
  title = '🎯 스마트 매칭으로 완벽한 일자리 찾기',
  description = '내 시간에 맞는 최적의 일자리를 AI가 추천해드려요!',
  onOpenSchedule,
  variant = 'enhanced',
}) => {
  if (variant === 'minimal') {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-blue-100 text-sm">{description}</p>
            </div>
          </div>
          {onOpenSchedule && (
            <button
              onClick={onOpenSchedule}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              시작하기
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200 p-6 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Target className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{description}</p>
          
          {/* 혜택 아이콘들 */}
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>빠른 매칭</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>높은 적합도</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>시간 맞춤</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {onOpenSchedule && (
              <button
                onClick={onOpenSchedule}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Clock className="w-4 h-4 mr-2" />
                선호 근무시간 설정하기
              </button>
            )}
            <Link
              to="/reviews"
              className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              리조트바이트 생활 보기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            💡 <strong>팁:</strong> 선호 근무시간을 설정하면 매칭률이 3배 높아집니다!
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartMatchingCTA;

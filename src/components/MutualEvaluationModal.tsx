import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { MutualEvaluation } from '../types';
import { X, ThumbsUp, Star, Send } from 'lucide-react';

interface MutualEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluatedUser: {
    id: string;
    name: string;
    role: 'employer' | 'jobseeker';
  };
  jobPostId?: string;
  onEvaluationSubmitted?: () => void;
}

const MutualEvaluationModal: React.FC<MutualEvaluationModalProps> = ({
  isOpen,
  onClose,
  evaluatedUser,
  jobPostId,
  onEvaluationSubmitted,
}) => {
  const { user } = useAuth();
  const [positiveReason, setPositiveReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');

  const positiveReasons = [
    '업무 능력이 뛰어나요',
    '시간을 잘 지켜요',
    '팀워크가 좋아요',
    '긍정적인 태도를 가져요',
    '학습 의지가 강해요',
    '고객 서비스가 우수해요',
    '책임감이 강해요',
    '적응력이 좋아요',
    '의사소통이 원활해요',
    '다시 같이 일하고 싶어요',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !positiveReason.trim()) {
      alert('평가 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const evaluation: Omit<MutualEvaluation, 'id'> = {
        evaluatorId: user.uid,
        evaluatorName: user.displayName || user.email || '익명',
        evaluatorRole: (user.role as 'employer' | 'jobseeker') || 'jobseeker',
        evaluateeId: evaluatedUser.id,
        evaluatedName: evaluatedUser.name,
        evaluatedRole: evaluatedUser.role,
        jobPostId: jobPostId || '',
        rating: 5,
        comment: positiveReason.trim(),
        isAnonymous: false,
        categories: {
          communication: 5,
          teamwork: 5,
          reliability: 5,
          skill: 5,
          attitude: 5,
        },
        createdAt: serverTimestamp() as any,
        evaluationType: 'positive',
        positiveReason: positiveReason.trim(),
        isVisible: true,
      };

      await addDoc(collection(db, 'mutualEvaluations'), evaluation);
      
      alert('긍정적 평가가 등록되었습니다!');
      setPositiveReason('');
      setSelectedReason('');
      onEvaluationSubmitted?.();
      onClose();
    } catch (error) {
      console.error('평가 등록 오류:', error);
      alert('평가 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
    setPositiveReason(reason);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-green-600" />
            긍정적 평가 작성
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 평가 대상 정보 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="text-sm font-medium text-gray-700 mb-1">평가 대상</h3>
            <p className="text-sm text-gray-900">{evaluatedUser.name}</p>
            <p className="text-xs text-gray-500">
              {evaluatedUser.role === 'employer' ? '구인자' : '구직자'}
            </p>
          </div>

          {/* 빠른 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              빠른 선택 (선택사항)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {positiveReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => handleReasonSelect(reason)}
                  className={`text-xs p-2 rounded border transition-colors ${
                    selectedReason === reason
                      ? 'bg-green-100 border-green-300 text-green-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* 평가 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              긍정적 평가 내용 *
            </label>
            <textarea
              value={positiveReason}
              onChange={(e) => setPositiveReason(e.target.value)}
              placeholder="이 분의 긍정적인 점을 자세히 작성해주세요..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              긍정적 평가만 등록되며, 상대방의 프로필에 표시됩니다.
            </p>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !positiveReason.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  등록 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  평가 등록
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MutualEvaluationModal;

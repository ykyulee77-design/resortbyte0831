import React, { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ReportTargetType, ReportReason } from '../types';

interface ReportModalProps {
  targetType: ReportTargetType;
  targetId: string;
  targetName?: string;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({
  targetType,
  targetId,
  targetName,
  onClose
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState<ReportReason>('spam');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reasonOptions = [
    { value: 'spam', label: '스팸/도배', description: '반복적인 광고나 의미없는 내용' },
    { value: 'fake', label: '가짜 정보', description: '거짓된 정보나 허위 공고' },
    { value: 'inappropriate', label: '부적절한 내용', description: '욕설, 차별, 성적 내용 등' },
    { value: 'scam', label: '사기/피싱', description: '사기성 내용이나 개인정보 요구' },
    { value: 'other', label: '기타', description: '위 사유에 해당하지 않는 기타 문제' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!description.trim()) {
      setError('신고 사유를 자세히 설명해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: user.uid,
        reporterName: user.displayName || '익명',
        targetType,
        targetId,
        targetName: targetName || '알 수 없음',
        reason,
        description: description.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
      onClose();
    } catch (error) {
      console.error('신고 제출 실패:', error);
      setError('신고 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTargetTypeLabel = () => {
    return targetType === 'jobPost' ? '공고' : '사용자';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Flag className="h-5 w-5 text-red-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              {getTargetTypeLabel()} 신고하기
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 내용 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 신고 대상 정보 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">신고 대상:</span> {targetName || '알 수 없음'}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">대상 타입:</span> {getTargetTypeLabel()}
            </p>
          </div>

          {/* 신고 사유 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              신고 사유를 선택해주세요
            </label>
            <div className="space-y-2">
              {reasonOptions.map((option) => (
                <label key={option.value} className="flex items-start">
                  <input
                    type="radio"
                    name="reason"
                    value={option.value}
                    checked={reason === option.value}
                    onChange={(e) => setReason(e.target.value as ReportReason)}
                    className="mt-1 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 상세 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상세 설명 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="신고 사유를 자세히 설명해주세요. 구체적인 내용을 적어주시면 더 정확한 검토가 가능합니다."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                구체적인 내용을 적어주시면 더 정확한 검토가 가능합니다.
              </p>
              <span className="text-xs text-gray-400">
                {description.length}/500
              </span>
            </div>
          </div>

          {/* 경고 메시지 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">신고 시 주의사항</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• 허위 신고는 제재를 받을 수 있습니다.</li>
                  <li>• 신고된 내용은 관리자가 검토 후 조치됩니다.</li>
                  <li>• 신고 처리 결과는 별도로 알려드리지 않습니다.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isSubmitting ? '제출 중...' : '신고하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;

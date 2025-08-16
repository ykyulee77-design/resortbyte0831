import React, { useState } from 'react';
import { X, Users, CheckCircle } from 'lucide-react';
import { PositiveReview } from '../types';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface PositiveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobseekerId: string;
  jobseekerName: string;
  jobPostId: string;
  employerId: string;
  workTypeId?: string;
  onReviewComplete?: () => void;
}

const PositiveReviewModal: React.FC<PositiveReviewModalProps> = ({
  isOpen,
  onClose,
  jobseekerId,
  jobseekerName,
  jobPostId,
  employerId,
  workTypeId,
  onReviewComplete
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    setIsSubmitting(true);
    try {
      // 중복 평가 확인
      const existingReviewQuery = query(
        collection(db, 'positiveReviews'),
        where('employerId', '==', employerId),
        where('jobseekerId', '==', jobseekerId),
        where('jobPostId', '==', jobPostId)
      );
      const existingReviewSnapshot = await getDocs(existingReviewQuery);
      
      if (!existingReviewSnapshot.empty) {
        alert('이미 이 구직자에 대한 평가를 작성하셨습니다.');
        setIsSubmitting(false);
        return;
      }

      const reviewData: Omit<PositiveReview, 'id'> = {
        employerId,
        jobseekerId,
        jobPostId,
        ...(workTypeId && { workTypeId }),
        reviewType: 'praise',
        category: 'service_skill',
        title: '다시 같이 일하고 싶어요',
        description: `${jobseekerName}님과 함께 일한 경험이 매우 만족스러웠습니다.`,
        tags: ['recommend'],
        isPublic: true,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any
      };

      const docRef = await addDoc(collection(db, 'positiveReviews'), reviewData);
      console.log('평가 저장 성공! 문서 ID:', docRef.id);

      alert('평가가 성공적으로 등록되었습니다!');
      onClose();
      
      // 평가 완료 후 콜백 실행
      if (onReviewComplete) {
        onReviewComplete();
      }
    } catch (error: any) {
      console.error('평가 등록 실패:', error);
      alert('평가 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {jobseekerName}님 평가하기
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* 간단한 평가 메시지 */}
            <div className="text-center py-8">
                             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Users className="w-8 h-8 text-green-600" />
               </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                다시 같이 일하고 싶어요!
              </h3>
              <p className="text-gray-600">
                {jobseekerName}님과 함께 일한 경험이 매우 만족스러웠습니다.
              </p>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    등록 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    평가 등록
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositiveReviewModal;

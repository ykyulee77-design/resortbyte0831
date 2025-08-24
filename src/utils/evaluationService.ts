import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { MutualEvaluation, EvaluationStats } from '../types';

// 사용자의 평가 통계 계산
export const calculateEvaluationStats = async (userId: string): Promise<EvaluationStats> => {
  try {
    // 사용자의 모든 평가 조회
    const evaluationsQuery = query(
      collection(db, 'positiveReviews'),
      where('reviewedId', '==', userId),
    );
    
    const evaluationsSnapshot = await getDocs(evaluationsQuery);
    const evaluations = evaluationsSnapshot.docs.map(doc => doc.data());
    
    if (evaluations.length === 0) {
      return {
        userId,
        totalReviews: 0,
        totalPositiveEvaluations: 0,
        totalNegativeEvaluations: 0,
        positiveReviews: 0,
        negativeReviews: 0,
        totalWorkCount: 0,
        averageRating: 0,
        lastWorkDate: undefined,
        rehireRate: 0,
        trustLevel: 'low',
      };
    }

    const totalPositiveEvaluations = evaluations.length;
    const totalNegativeEvaluations = 0; // 현재는 positiveReviews만 있으므로 0
    const totalReviews = totalPositiveEvaluations + totalNegativeEvaluations;
    
    const totalRating = evaluations.reduce((sum, evaluation) => sum + (evaluation.rating || 0), 0);
    const averageRating = totalRating / totalPositiveEvaluations;
    
    const lastWorkDate = evaluations.length > 0 
      ? evaluations[evaluations.length - 1].createdAt?.toDate?.() || undefined
      : undefined;
    
    const rehireRate = evaluations.filter(evaluation => evaluation.rating >= 4).length / totalPositiveEvaluations * 100;
    
    let trustLevel: 'very_high' | 'high' | 'medium' | 'low' = 'low';
    if (averageRating >= 4.5 && totalPositiveEvaluations >= 10) trustLevel = 'very_high';
    else if (averageRating >= 4.0 && totalPositiveEvaluations >= 5) trustLevel = 'high';
    else if (averageRating >= 3.5) trustLevel = 'medium';
    
    return {
      userId,
      totalReviews,
      totalPositiveEvaluations,
      totalNegativeEvaluations,
      positiveReviews: totalPositiveEvaluations,
      negativeReviews: totalNegativeEvaluations,
      totalWorkCount: totalPositiveEvaluations,
      averageRating,
      lastWorkDate: lastWorkDate || undefined,
      rehireRate,
      trustLevel,
    };
  } catch (error) {
    console.error('평가 통계 계산 중 오류:', error);
    return {
      userId,
      totalReviews: 0,
      totalPositiveEvaluations: 0,
      totalNegativeEvaluations: 0,
      positiveReviews: 0,
      negativeReviews: 0,
      totalWorkCount: 0,
      averageRating: 0,
      lastWorkDate: undefined,
      rehireRate: 0,
      trustLevel: 'low',
    };
  }
};

// 사용자가 받은 긍정적 평가 목록 조회
export const getUserPositiveEvaluations = async (userId: string): Promise<MutualEvaluation[]> => {
  try {
    const evaluationsQuery = query(
      collection(db, 'mutualEvaluations'),
      where('evaluatedId', '==', userId),
      where('evaluationType', '==', 'positive'),
      where('isVisible', '==', true),
    );

    const evaluationsSnapshot = await getDocs(evaluationsQuery);
    const evaluations = evaluationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as MutualEvaluation[];
    
    // 클라이언트에서 날짜순 정렬
    return evaluations.sort((a, b) => {
      const dateA = a.createdAt ? (a.createdAt as any).toDate() : new Date(0);
      const dateB = b.createdAt ? (b.createdAt as any).toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('긍정적 평가 조회 오류:', error);
    return [];
  }
};

// 사용자가 작성한 평가 목록 조회
export const getUserWrittenEvaluations = async (userId: string): Promise<MutualEvaluation[]> => {
  try {
    const evaluationsQuery = query(
      collection(db, 'mutualEvaluations'),
      where('evaluatorId', '==', userId),
    );

    const evaluationsSnapshot = await getDocs(evaluationsQuery);
    const evaluations = evaluationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as MutualEvaluation[];
    
    // 클라이언트에서 날짜순 정렬
    return evaluations.sort((a, b) => {
      const dateA = a.createdAt ? (a.createdAt as any).toDate() : new Date(0);
      const dateB = b.createdAt ? (b.createdAt as any).toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('작성한 평가 조회 오류:', error);
    return [];
  }
};

// 신뢰도 등급에 따른 색상 반환
export const getTrustLevelColor = (trustLevel: string): string => {
  switch (trustLevel) {
  case 'very_high':
    return 'text-purple-600 bg-purple-100';
  case 'high':
    return 'text-green-600 bg-green-100';
  case 'medium':
    return 'text-yellow-600 bg-yellow-100';
  case 'low':
    return 'text-gray-600 bg-gray-100';
  default:
    return 'text-gray-600 bg-gray-100';
  }
};

// 신뢰도 등급 텍스트 반환
export const getTrustLevelText = (trustLevel: string): string => {
  switch (trustLevel) {
  case 'very_high':
    return '매우 높음';
  case 'high':
    return '높음';
  case 'medium':
    return '보통';
  case 'low':
    return '낮음';
  default:
    return '낮음';
  }
};

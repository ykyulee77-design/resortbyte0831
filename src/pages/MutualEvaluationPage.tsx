import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import MutualEvaluationModal from '../components/MutualEvaluationModal';
import { getUserPositiveEvaluations } from '../utils/evaluationService';
import { MutualEvaluation } from '../types';
import { ThumbsUp, Star, Calendar, User, Building, MessageSquare } from 'lucide-react';

const MutualEvaluationPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<MutualEvaluation[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 다른 사용자 목록 로딩 (자신 제외)
        const usersQuery = query(
          collection(db, 'users'),
        );
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })).filter(u => (u as any).uid !== user.uid);
        
        setUsers(usersData);

        // 내가 받은 긍정적 평가 로딩
        const myEvaluations = await getUserPositiveEvaluations(user.uid);
        setEvaluations(myEvaluations);

      } catch (error) {
        console.error('데이터 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid]);

  const handleEvaluateUser = (targetUser: any) => {
    setSelectedUser(targetUser);
    setShowEvaluationModal(true);
  };

  const handleEvaluationSubmitted = () => {
    // 평가 제출 후 데이터 새로고침
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">상호 평가 시스템</h1>
          <p className="text-gray-600">긍정적 평가만으로 플랫폼의 신뢰도를 높여보세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 평가 작성 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-green-600" />
                긍정적 평가 작성
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                함께 일한 분들에게 긍정적 평가를 남겨보세요
              </p>
            </div>
            <div className="p-6">
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">평가할 수 있는 사용자가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.slice(0, 5).map((targetUser) => (
                    <div
                      key={targetUser.uid}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{targetUser.displayName || '사용자'}</p>
                          <p className="text-sm text-gray-500">
                            {targetUser.role === 'employer' ? '리조트' : '크루'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEvaluateUser(targetUser)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        평가하기
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 내가 받은 평가 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                내가 받은 긍정적 평가
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                다른 분들이 나에게 남긴 긍정적 평가입니다
              </p>
            </div>
            <div className="p-6">
              {evaluations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">아직 받은 평가가 없습니다</p>
                  <p className="text-sm text-gray-400 mt-1">함께 일한 분들이 평가를 남겨주시면 여기에 표시됩니다</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {evaluations.map((evaluation) => (
                    <div
                      key={evaluation.id}
                      className="border border-gray-200 rounded-lg p-4 bg-green-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{evaluation.evaluatorName}</p>
                            <p className="text-xs text-gray-500">
                              {evaluation.evaluatorRole === 'employer' ? '리조트' : '크루'}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {evaluation.createdAt && (evaluation.createdAt as any).toDate?.()?.toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                        {evaluation.positiveReason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 평가 통계 섹션 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              평가 시스템 안내
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ThumbsUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">긍정적 평가만</h3>
                <p className="text-sm text-gray-600">
                  부정적 평가는 제외하고 긍정적 평가만으로 신뢰도를 높입니다
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">신뢰도 시스템</h3>
                <p className="text-sm text-gray-600">
                  평가 점수와 재고용률을 기반으로 신뢰도 등급을 산정합니다
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">활동 이력</h3>
                <p className="text-sm text-gray-600">
                  총 일한 횟수와 마지막 근무일을 통해 활동성을 확인합니다
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 평가 모달 */}
      {selectedUser && (
        <MutualEvaluationModal
          isOpen={showEvaluationModal}
          onClose={() => setShowEvaluationModal(false)}
          evaluatedUser={{
            id: selectedUser.uid,
            name: selectedUser.displayName || selectedUser.email || '사용자',
            role: selectedUser.role || 'jobseeker',
          }}
          onEvaluationSubmitted={handleEvaluationSubmitted}
        />
      )}
    </div>
  );
};

export default MutualEvaluationPage;

import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FavoriteJob, JobPost, JobShare } from '../types';
import { Star, MapPin, DollarSign, Calendar, Trash2, Edit3, Save, X, Share2, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FavoriteJobsProps {
  userId: string;
  showHeader?: boolean;
}

const FavoriteJobs: React.FC<FavoriteJobsProps> = ({ userId, showHeader = true }) => {
  const [favorites, setFavorites] = useState<FavoriteJob[]>([]);
  const [jobShares, setJobShares] = useState<JobShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMemo, setEditingMemo] = useState<string | null>(null);
  const [memoText, setMemoText] = useState('');

  useEffect(() => {
    fetchFavorites();
    fetchJobShares();
  }, [userId]);

  const fetchFavorites = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const favoritesQuery = query(
        collection(db, 'favoriteJobs'),
        where('jobseekerId', '==', userId),
      );
      const snapshot = await getDocs(favoritesQuery);
      const favoritesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as FavoriteJob[];
      // 클라이언트에서 정렬
      favoritesData.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });
      setFavorites(favoritesData);
    } catch (error) {
      console.error('관심 공고 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobShares = async () => {
    if (!userId) return;
    
    try {
      const sharesQuery = query(
        collection(db, 'jobShares'),
        where('jobseekerId', '==', userId),
      );
      const snapshot = await getDocs(sharesQuery);
      const sharesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as JobShare[];
      // 클라이언트에서 정렬
      sharesData.sort((a, b) => {
        const aTime = a.sharedAt instanceof Date ? a.sharedAt : (a.sharedAt as any)?.toDate?.() || new Date(0);
        const bTime = b.sharedAt instanceof Date ? b.sharedAt : (b.sharedAt as any)?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });
      setJobShares(sharesData);
    } catch (error) {
      console.error('공유 공고 불러오기 실패:', error);
    }
  };

  const addToFavorites = async (jobPost: JobPost) => {
    if (!userId) return;

    try {
      const favoriteData = {
        jobseekerId: userId,
        jobPostId: jobPost.id,
        jobTitle: jobPost.title,
        employerName: jobPost.employerName,
        location: jobPost.location,
        salary: jobPost.salary,
        createdAt: new Date(),
        memo: '',
      };

      await addDoc(collection(db, 'favoriteJobs'), favoriteData);
      await fetchFavorites(); // 목록 새로고침
    } catch (error) {
      console.error('관심 공고 추가 실패:', error);
    }
  };

  const removeFromFavorites = async (favoriteId: string) => {
    try {
      await deleteDoc(doc(db, 'favoriteJobs', favoriteId));
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
    } catch (error) {
      console.error('관심 공고 제거 실패:', error);
    }
  };

  const startEditMemo = (favorite: FavoriteJob) => {
    setEditingMemo(favorite.id);
    setMemoText(favorite.memo || '');
  };

  const saveMemo = async (favoriteId: string) => {
    try {
      // Firestore에서 메모 업데이트
      const favoriteRef = doc(db, 'favoriteJobs', favoriteId);
      await updateDoc(favoriteRef, { memo: memoText });
      
      // 로컬 상태 업데이트
      setFavorites(prev => prev.map(fav => 
        fav.id === favoriteId ? { ...fav, memo: memoText } : fav,
      ));
      
      setEditingMemo(null);
      setMemoText('');
    } catch (error) {
      console.error('메모 저장 실패:', error);
    }
  };

  const cancelEditMemo = () => {
    setEditingMemo(null);
    setMemoText('');
  };

  const formatDate = (date: any) => {
    if (date?.toDate) {
      return date.toDate().toLocaleDateString('ko-KR');
    }
    return new Date(date).toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className={showHeader ? 'bg-white rounded-xl shadow-sm border border-gray-200 p-6' : ''}>
        {showHeader && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600" />
            관심 공고
          </h3>
        )}
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className={showHeader ? 'bg-white rounded-xl shadow-sm border border-gray-200 p-6' : ''}>
        {showHeader && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600" />
            관심 공고
          </h3>
        )}
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-gray-500">관심있는 공고가 없습니다</p>
          <p className="text-sm text-gray-400 mt-1">마음에 드는 공고에 별표를 눌러보세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className={showHeader ? 'bg-white rounded-xl shadow-sm border border-gray-200 p-6' : ''}>
      {showHeader && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-600" />
          관심 공고 ({favorites.length})
        </h3>
      )}
      
      {/* 관심 공고 섹션 */}
      {favorites.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            관심 공고 ({favorites.length})
          </h4>
          <div className="space-y-4">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <Link 
                      to={`/job/${favorite.jobPostId}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {favorite.jobTitle}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">{favorite.employerName}</p>
                  </div>
                  <button
                    onClick={() => removeFromFavorites(favorite.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="관심 공고에서 제거"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    {favorite.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {favorite.salary?.min?.toLocaleString()}원 ~ {favorite.salary?.max?.toLocaleString()}원
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(favorite.createdAt)}
                  </div>
                </div>
                
                {/* 메모 섹션 */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">개인 메모</span>
                    {editingMemo !== favorite.id && (
                      <button
                        onClick={() => startEditMemo(favorite)}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        편집
                      </button>
                    )}
                  </div>
                  
                  {editingMemo === favorite.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value)}
                        placeholder="이 공고에 대한 메모를 작성해보세요..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => saveMemo(favorite.id)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          저장
                        </button>
                        <button
                          onClick={cancelEditMemo}
                          className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700 bg-gray-50 rounded-md p-3 min-h-[3rem]">
                      {favorite.memo ? (
                        <p className="whitespace-pre-wrap">{favorite.memo}</p>
                      ) : (
                        <p className="text-gray-400 italic">메모가 없습니다</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 공유 공고 섹션 */}
      {jobShares.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-500" />
            공유한 공고 ({jobShares.length})
          </h4>
          <div className="space-y-4">
            {jobShares.map((share) => (
              <div key={share.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-blue-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <Link 
                      to={`/job/${share.jobPostId}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {share.jobTitle}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">{share.employerName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {share.shareMethod === 'kakao' ? '카카오톡' : 
                        share.shareMethod === 'facebook' ? '페이스북' : 
                          share.shareMethod === 'link' ? '링크' : '메시지'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(share.sharedAt)}
                  </div>
                  {share.sharedWith && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      {share.sharedWith}님과 공유
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 빈 상태 메시지 */}
      {favorites.length === 0 && jobShares.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">관심 공고가 없습니다</h3>
          <p className="text-gray-600 mb-4">관심 있는 공고를 저장하고 친구들과 공유해보세요!</p>
          <Link 
            to="/job-list" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Star className="w-4 h-4 mr-2" />
            일자리 찾아보기
          </Link>
        </div>
      )}
    </div>
  );
};

export default FavoriteJobs;

import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import HomeLayout from '../components/HomeLayout';

const ReviewForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reviewType = searchParams.get('type') === 'accommodation' ? 'accommodation' : 'company';
  const [resort, setResort] = useState('');
  const [overallRating, setOverallRating] = useState(0);
  const [accommodationRating, setAccommodationRating] = useState(0);
  const [content, setContent] = useState('');
  const [resorts, setResorts] = useState<{ id: string; name: string }[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResorts = async () => {
      // 회사 정보에서 id(문서ID)와 name 추출
      const companySnap = await getDocs(collection(db, 'companyInfo'));
      const companyList = companySnap.docs
        .map(doc => ({ id: doc.id, name: doc.data().name }))
        .filter(r => r.name);
      setResorts(companyList);
    };
    fetchResorts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resort) {
      alert('리조트를 선택해 주세요.');
      return;
    }
    if (!overallRating && !accommodationRating && !content.trim()) {
      alert('별점(하나 이상) 또는 내용을 입력해 주세요.');
      return;
    }
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    try {
      await addDoc(collection(db, 'reviews'), {
        resort, // employerId로 저장
        reviewType, // 'company' 또는 'accommodation'
        overallRating,
        accommodationRating,
        content,
        user: user.displayName || user.email,
        userId: user.uid,
        date: serverTimestamp(),
      });
      alert('후기가 등록되었습니다!');
      setResort(''); setOverallRating(0); setAccommodationRating(0); setContent('');
      navigate('/reviews');
    } catch (err) {
      alert('후기 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <HomeLayout>
      <div className="max-w-md mx-auto py-12 px-4">
        <button
          type="button"
          className="mb-4 text-resort-600 hover:underline flex items-center"
          onClick={() => navigate('/reviews')}
        >
          ← 이용자 후기 목록으로 돌아가기
        </button>
        <h1 className="text-xl font-bold text-resort-600 mb-2">
          {reviewType === 'accommodation' ? '기숙사 평가' : '회사 알바 평가'} 작성
        </h1>
        <p className="text-xs text-gray-500 mb-4">
          실제 경험을 바탕으로 솔직하게 작성해 주세요. (최근 경험일수록 좋아요)
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium mb-1">리조트 선택</label>
            <select value={resort} onChange={e => setResort(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">리조트 선택</option>
              {resorts.length === 0 && <option disabled>등록된 리조트가 없습니다</option>}
              {resorts.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">전체 별점</label>
            <div className="flex space-x-1 mb-2">
              {[1,2,3,4,5].map(n => (
                <button type="button" key={n} onClick={() => setOverallRating(n)} className={n <= overallRating ? 'text-yellow-400' : 'text-gray-300'}>
                  ★
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500">
              별점은 전반적인 만족도를 기준으로 선택해 주세요.
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">기숙사 평점</label>
            <div className="flex space-x-1 mb-2">
              {[1,2,3,4,5].map(n => (
                <button type="button" key={n} onClick={() => setAccommodationRating(n)} className={n <= accommodationRating ? 'text-yellow-400' : 'text-gray-300'}>
                  ★
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500">
              기숙사 청결, 편의성, 관리 수준 등을 고려해 주세요.
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">후기 내용</label>
            <textarea 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              rows={4} 
              className="w-full border rounded px-3 py-2" 
              placeholder={reviewType === 'company' ? '회사 알바 경험에 대한 후기를 입력해 주세요' : '기숙사 이용 경험에 대한 후기를 입력해 주세요'} 
            />
            <div className="text-xs text-gray-400 mt-1">별점(하나 이상) 또는 내용만 입력해도 등록 가능합니다.</div>
          </div>
          <button type="submit" className="w-full bg-resort-600 text-white py-2 rounded hover:bg-resort-700 font-semibold">등록하기</button>
        </form>
      </div>
    </HomeLayout>
  );
};

export default ReviewForm; 
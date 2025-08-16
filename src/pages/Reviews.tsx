import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import HomeLayout from '../components/HomeLayout';

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [resorts, setResorts] = useState<{ id: string; name: string }[]>([]);
  const [selectedResort, setSelectedResort] = useState('');
  const [companyMap, setCompanyMap] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    const fetchResorts = async () => {
      const snapshot = await getDocs(collection(db, 'companyInfo'));
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })).filter(r => r.name);
      setResorts(list);
    };
    fetchResorts();
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      const snap = await getDocs(collection(db, 'companyInfo'));
      const map: { [id: string]: string } = {};
      snap.docs.forEach(doc => {
        map[doc.id] = doc.data().name;
      });
      setCompanyMap(map);
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      const snap = await getDocs(collection(db, 'reviews'));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(data);
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    const fetchMedia = async () => {
      const mediaQuery = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(mediaQuery);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedia(data);
    };
    fetchMedia();
  }, []);

  const filteredReviews = selectedResort
    ? reviews.filter(r => r.resort === selectedResort)
    : reviews;

  const filteredMedia = selectedResort
    ? media.filter(m => m.resort === selectedResort)
    : media;

  // 평균 별점 계산
  const avgRating = filteredReviews.length > 0
    ? (filteredReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / filteredReviews.length).toFixed(1)
    : null;

  return (
    <HomeLayout>
      <div className="max-w-3xl mx-auto py-12 px-4">
        {/* 사진/쇼츠 게시 섹션 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-resort-600 flex items-center gap-2">
              <span role="img" aria-label="camera">📸</span> 리조트바이트 사진 & 쇼츠
            </h2>
            <Link to="/reviews/media/new" className="bg-resort-500 text-white px-3 py-1 rounded hover:bg-resort-700 text-sm font-semibold">사진/쇼츠 올리기</Link>
          </div>
          {/* 실제 업로드된 미디어 표시 */}
          {filteredMedia.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <span className="text-4xl">📸</span>
              <p className="text-gray-500 mt-2">아직 업로드된 사진/쇼츠가 없습니다</p>
              <Link to="/reviews/media/new" className="text-resort-600 hover:underline text-sm">
                첫 번째 사진/쇼츠를 업로드해보세요
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredMedia.slice(0, 8).map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  {item.fileType && item.fileType.startsWith('image') ? (
                    <img 
                      src={item.fileUrl} 
                      alt={item.description}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <video 
                      src={item.fileUrl} 
                      className="w-full h-32 object-cover"
                      muted
                    />
                  )}
                  <div className="p-3">
                    <p className="text-xs text-gray-600 mb-1">
                      {companyMap[item.resort] || '알 수 없는 리조트'}
                    </p>
                    <p className="text-sm text-gray-900 line-clamp-2">
                      {item.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {item.createdAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold text-resort-600 mb-2">리조트바이트 이용자 후기</h1>
        <p className="text-gray-600 mb-6">실제 경험자들의 솔직한 후기와 리조트별 평가를 확인해보세요.</p>
        {avgRating && (
          <div className="mb-4 text-yellow-600 font-bold">
            평균 별점: {avgRating} / 5
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <select className="border rounded px-3 py-2 text-sm" value={selectedResort} onChange={e => setSelectedResort(e.target.value)}>
            <option value="">전체 리조트</option>
            {resorts.length === 0 && <option disabled>등록된 리조트가 없습니다</option>}
            {resorts.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <Link to="/reviews/new" className="bg-resort-600 text-white px-4 py-2 rounded hover:bg-resort-700 text-sm font-semibold">후기 작성</Link>
        </div>
        <div className="space-y-6">
          {filteredReviews.length === 0 ? (
            <div className="text-gray-500 text-center">등록된 후기가 없습니다.</div>
          ) : filteredReviews.map(r => (
            <div key={r.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center mb-2">
                <span className="font-bold text-resort-600 mr-2">{r.user}</span>
                <span className="text-xs text-gray-400">{r.date && r.date.toDate ? r.date.toDate().toLocaleDateString() : ''}</span>
                <span className="ml-4 text-xs text-gray-500">
                  {companyMap[r.resort] || r.resort}
                </span>
                <span className="ml-4 text-yellow-400">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              </div>
              <div className="text-gray-800 text-sm">{r.content}</div>
            </div>
          ))}
        </div>
      </div>
    </HomeLayout>
  );
};

export default Reviews; 
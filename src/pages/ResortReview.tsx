import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import HomeLayout from '../components/HomeLayout';

const ResortReview: React.FC = () => {
  const { id } = useParams();
  const [reviews, setReviews] = useState<any[]>([]);
  const [avg, setAvg] = useState<string>('0.0');
  const [companyMap, setCompanyMap] = useState<{ [id: string]: string }>({});
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      const snap = await getDocs(collection(db, 'reviews'));
      const data = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      const filtered = data.filter((r: any) => r.resort === id);
      setReviews(filtered);
      if (filtered.length > 0) {
        const avgScore = (filtered.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / filtered.length).toFixed(1);
        setAvg(avgScore);
      } else {
        setAvg('0.0');
      }
    };
    fetchReviews();
  }, [id]);

  useEffect(() => {
    const fetchCompanies = async () => {
      const snap = await getDocs(collection(db, 'companyInfo'));
      const map: { [id: string]: string } = {};
      snap.docs.forEach(doc => {
        map[doc.id] = doc.data().name;
      });
      setCompanyMap(map);
      if (id && map[id]) setCompanyName(map[id]);
    };
    fetchCompanies();
  }, [id]);

  return (
    <HomeLayout>
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold text-resort-600 mb-2">
          {companyName ? `${companyName} 후기/평가` : '리조트별 평가'}
        </h1>
        <p className="mb-4 text-gray-600">
          평균 별점: <span className="text-yellow-400 font-bold">{avg} / 5</span>
        </p>
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <div className="text-gray-500 text-center">등록된 후기가 없습니다.</div>
          ) : reviews.map(r => (
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

export default ResortReview; 
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import UsefulLinks from '../components/UsefulLinks';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Link as LinkIcon, ExternalLink } from 'lucide-react';

const ResortLifeGuide: React.FC = () => {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    description: '',
    category: 'general' as 'general' | 'blog' | 'cafe' | 'shopping' | 'info'
  });

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'usefulLinks'), {
        ...newLink,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      });

      setNewLink({ title: '', url: '', description: '', category: 'general' });
      setShowAddForm(false);
      alert('링크가 추가되었습니다!');
    } catch (error) {
      console.error('링크 추가 실패:', error);
      alert('링크 추가에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 페이지 제목 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">생활 가이드</h1>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* 링크 추가 버튼 */}
        {user && (
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-resort-600 text-white px-4 py-2 rounded-lg hover:bg-resort-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              링크 추가하기
            </button>
          </div>
        )}

        {/* 링크 추가 폼 */}
        {showAddForm && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">새 링크 추가</h3>
            <form onSubmit={handleAddLink} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  value={newLink.title}
                  onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-resort-500"
                  placeholder="링크 제목을 입력하세요"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-resort-500"
                  placeholder="https://example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={newLink.description}
                  onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-resort-500"
                  placeholder="링크에 대한 간단한 설명을 입력하세요"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={newLink.category}
                  onChange={(e) => setNewLink({ ...newLink, category: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-resort-500"
                >
                  <option value="blog">블로그</option>
                  <option value="cafe">카페/커뮤니티</option>
                  <option value="resort_info">리조트 정보</option>
                  <option value="lifestyle">생활 정보</option>
                  <option value="job_tips">취업 팁</option>
                  <option value="accommodation">숙박 정보</option>
                  <option value="shopping">쇼핑</option>
                  <option value="general">기타</option>
                </select>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-resort-600 text-white px-4 py-2 rounded-lg hover:bg-resort-700 transition-colors"
                >
                  추가하기
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 유용한 링크 목록 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <UsefulLinks />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResortLifeGuide;

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { UsefulLink, LinkCategory } from '../types';
import { ExternalLink, Star, Eye, Filter } from 'lucide-react';

const UsefulLinksPreviewWithFilter: React.FC = () => {
  const [links, setLinks] = useState<UsefulLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<LinkCategory | 'all'>('all');

  // 카테고리 정보
  const categories = [
    { id: 'all', label: '전체' },
    { id: 'blog', label: '블로그' },
    { id: 'cafe', label: '카페/커뮤니티' },
    { id: 'resort_info', label: '리조트 정보' },
    { id: 'lifestyle', label: '생활 정보' },
    { id: 'job_tips', label: '취업 팁' },
    { id: 'accommodation', label: '숙박 정보' },
    { id: 'shopping', label: '쇼핑' },
    { id: 'general', label: '기타' }
  ];

  // 링크 로드
  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      setLoading(true);
      // 인덱스 없이 작동하도록 쿼리 단순화
      const linksQuery = query(
        collection(db, 'usefulLinks'),
        where('status', '==', 'active'),
        limit(50) // 더 많이 로드해서 클라이언트에서 정렬
      );
      const snapshot = await getDocs(linksQuery);
      const linksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UsefulLink[];
      
      // 클라이언트에서 정렬 (추천순 → 클릭수순)
      const sortedLinks = linksData.sort((a, b) => {
        // 먼저 추천 여부로 정렬
        if (a.isRecommended !== b.isRecommended) {
          return b.isRecommended ? 1 : -1;
        }
        // 추천 여부가 같으면 클릭수로 정렬
        return (b.clickCount || 0) - (a.clickCount || 0);
      });
      
      setLinks(sortedLinks);
    } catch (error) {
      console.error('링크 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 링크 (최대 10개)
  const filteredLinks = links
    .filter(link => selectedCategory === 'all' || link.category === selectedCategory)
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-resort-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">링크를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-6">
        <span className="text-2xl">📚</span>
        <p className="text-gray-500 text-sm mt-2">아직 등록된 링크가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 카테고리 필터 */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">카테고리:</span>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as LinkCategory | 'all')}
          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-resort-500"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500">
          ({filteredLinks.length}개)
        </span>
      </div>

      {/* 링크 목록 */}
      {filteredLinks.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">선택한 카테고리에 링크가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLinks.map((link) => (
            <div 
              key={link.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
              onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
            >
              {/* 링크 아이콘 */}
              <div className="flex-shrink-0">
                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-resort-600 transition-colors" />
              </div>
              
              {/* 링크 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {link.title}
                  </h3>
                  {link.isRecommended && (
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  )}
                </div>
                <p className="text-xs text-gray-600 line-clamp-1">
                  {link.description}
                </p>
              </div>
              
              {/* 클릭 수 */}
              <div className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-500">
                <Eye className="w-3 h-3" />
                <span>{link.clickCount || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsefulLinksPreviewWithFilter;

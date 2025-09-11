import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { UsefulLink, LinkCategory } from '../types';
import { ExternalLink, Star, Eye, Tag, Globe, BookOpen, Home, Briefcase, Coffee, Heart } from 'lucide-react';

const UsefulLinks: React.FC = () => {
  const [links, setLinks] = useState<UsefulLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<LinkCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 카테고리 정보
  const categories = [
    { id: 'all', label: '전체', icon: Globe, color: 'bg-gray-100 text-gray-800' },
    { id: 'blog', label: '블로그', icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
    { id: 'cafe', label: '카페/커뮤니티', icon: Coffee, color: 'bg-green-100 text-green-800' },
    { id: 'resort_info', label: '리조트 정보', icon: Home, color: 'bg-purple-100 text-purple-800' },
    { id: 'lifestyle', label: '생활 정보', icon: Heart, color: 'bg-pink-100 text-pink-800' },
    { id: 'job_tips', label: '취업 팁', icon: Briefcase, color: 'bg-yellow-100 text-yellow-800' },
    { id: 'accommodation', label: '숙박 정보', icon: Home, color: 'bg-indigo-100 text-indigo-800' }
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
        where('status', '==', 'active')
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

  // 링크 클릭 처리
  const handleLinkClick = async (linkId: string, url: string) => {
    try {
      // 클릭 수 증가
      await updateDoc(doc(db, 'usefulLinks', linkId), {
        clickCount: increment(1)
      });
      
      // 새 탭에서 링크 열기
      window.open(url, '_blank', 'noopener,noreferrer');
      
      // 로컬 상태 업데이트
      setLinks(prev => prev.map(link => 
        link.id === linkId 
          ? { ...link, clickCount: link.clickCount + 1 }
          : link
      ));
    } catch (error) {
      console.error('클릭 수 업데이트 실패:', error);
      // 클릭 수 업데이트 실패해도 링크는 열기
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // 필터링된 링크
  const filteredLinks = links.filter(link => {
    const matchesCategory = selectedCategory === 'all' || link.category === selectedCategory;
    const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // 추천 링크와 일반 링크 분리
  const recommendedLinks = filteredLinks.filter(link => link.isRecommended);
  const regularLinks = filteredLinks.filter(link => !link.isRecommended);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-resort-600 mx-auto mb-2"></div>
          <p className="text-gray-600">유용한 링크를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="링크 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
            />
          </div>
          
          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id as LinkCategory | 'all')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? category.color
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 추천 링크 */}
      {recommendedLinks.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">추천 링크</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedLinks.map((link) => (
              <LinkCard key={link.id} link={link} onLinkClick={handleLinkClick} />
            ))}
          </div>
        </div>
      )}

      {/* 일반 링크 */}
      {regularLinks.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">유용한 링크</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularLinks.map((link) => (
              <LinkCard key={link.id} link={link} onLinkClick={handleLinkClick} />
            ))}
          </div>
        </div>
      )}

      {/* 링크가 없는 경우 */}
      {filteredLinks.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">검색 조건에 맞는 링크가 없습니다.</p>
        </div>
      )}
    </div>
  );
};

// 링크 카드 컴포넌트
interface LinkCardProps {
  link: UsefulLink;
  onLinkClick: (linkId: string, url: string) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({ link, onLinkClick }) => {
  const categoryInfo = {
    blog: { label: '블로그', color: 'bg-blue-100 text-blue-800' },
    cafe: { label: '카페', color: 'bg-green-100 text-green-800' },
    resort_info: { label: '리조트', color: 'bg-purple-100 text-purple-800' },
    lifestyle: { label: '생활', color: 'bg-pink-100 text-pink-800' },
    job_tips: { label: '취업팁', color: 'bg-yellow-100 text-yellow-800' },
    accommodation: { label: '숙박', color: 'bg-indigo-100 text-indigo-800' }
  };

  const category = categoryInfo[link.category];

  return (
    <div 
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onLinkClick(link.id, link.url)}
    >
      {/* 카테고리 태그 */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
          {category.label}
        </span>
        {link.isRecommended && (
          <Star className="h-4 w-4 text-yellow-500" />
        )}
      </div>

      {/* 링크 제목 */}
      <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-resort-600 transition-colors">
        {link.title}
      </h4>

      {/* 링크 설명 */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {link.description}
      </p>

      {/* 태그 */}
      {link.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {link.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              <Tag className="h-3 w-3" />
              {tag}
            </span>
          ))}
          {link.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{link.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* 링크 정보 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {link.clickCount}회 조회
        </div>
        <div className="flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          외부 링크
        </div>
      </div>
    </div>
  );
};

export default UsefulLinks;

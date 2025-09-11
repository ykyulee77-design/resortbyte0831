import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { UsefulLink } from '../types';
import { ExternalLink, Star, Eye } from 'lucide-react';

const UsefulLinksPreview: React.FC = () => {
  const [links, setLinks] = useState<UsefulLink[]>([]);
  const [loading, setLoading] = useState(true);

  // 링크 로드 (최대 6개)
  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      setLoading(true);
      const linksQuery = query(
        collection(db, 'usefulLinks'),
        where('status', '==', 'active'),
        orderBy('isRecommended', 'desc'),
        orderBy('clickCount', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(linksQuery);
      const linksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UsefulLink[];
      setLinks(linksData);
    } catch (error) {
      console.error('링크 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="space-y-3">
      {links.map((link) => (
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
  );
};

export default UsefulLinksPreview;

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Star, Eye, ExternalLink, Trash2, Edit, Plus, Filter, Search, Calendar, User, MessageCircle } from 'lucide-react';

interface MediaItem {
  id: string;
  description: string;
  resort: string;
  userId: string;
  createdAt: any;
  fileName: string;
  fileUrl: string;
  fileType: string;
  user?: {
    displayName: string;
    email: string;
  };
}

interface ReviewItem {
  id: string;
  content: string;
  resort: string;
  userId: string;
  date: any;
  overallRating: number;
  accommodationRating?: number;
  comments?: any[];
  user?: string;
}

interface UsefulLink {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  isRecommended: boolean;
  clickCount: number;
  status: string;
  createdAt: any;
  createdBy: string;
}

const ResortLifeManagement: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'media' | 'reviews' | 'links'>('media');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [links, setLinks] = useState<UsefulLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [activeSection]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSection === 'media') {
        await loadMedia();
      } else if (activeSection === 'reviews') {
        await loadReviews();
      } else if (activeSection === 'links') {
        await loadLinks();
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMedia = async () => {
    const mediaQuery = query(
      collection(db, 'media'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(mediaQuery);
    const mediaData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MediaItem[];
    setMedia(mediaData);
  };

  const loadReviews = async () => {
    try {
      // createdAt과 date 필드 모두 시도
      const reviewsQuery = query(
        collection(db, 'reviews'),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(reviewsQuery);
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReviewItem[];
      setReviews(reviewsData);
    } catch (error) {
      console.error('후기 로드 실패:', error);
      // orderBy 실패 시 단순 조회
      try {
        const snapshot = await getDocs(collection(db, 'reviews'));
        const reviewsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ReviewItem[];
        setReviews(reviewsData);
      } catch (fallbackError) {
        console.error('후기 fallback 로드 실패:', fallbackError);
        setReviews([]);
      }
    }
  };

  const loadLinks = async () => {
    const linksQuery = query(
      collection(db, 'usefulLinks'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(linksQuery);
    const linksData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UsefulLink[];
    setLinks(linksData);
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm('이 미디어를 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'media', id));
      setMedia(media.filter(item => item.id !== id));
    } catch (error) {
      console.error('미디어 삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('이 후기를 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      setReviews(reviews.filter(item => item.id !== id));
    } catch (error) {
      console.error('후기 삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm('이 링크를 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'usefulLinks', id));
      setLinks(links.filter(item => item.id !== id));
    } catch (error) {
      console.error('링크 삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const toggleLinkRecommendation = async (id: string, isRecommended: boolean) => {
    try {
      await updateDoc(doc(db, 'usefulLinks', id), {
        isRecommended: !isRecommended
      });
      setLinks(links.map(link => 
        link.id === id ? { ...link, isRecommended: !isRecommended } : link
      ));
    } catch (error) {
      console.error('추천 상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const filteredData = () => {
    let data: any[] = [];
    
    if (activeSection === 'media') {
      data = media.filter(item => 
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.resort.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (activeSection === 'reviews') {
      data = reviews.filter(item => 
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.resort.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (activeSection === 'links') {
      data = links.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             item.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
      });
    }
    
    return data;
  };

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

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">리조트바이트 생활 관리</h2>
        <p className="text-gray-600">숏츠, 후기, 유용한 링크를 관리할 수 있습니다.</p>
      </div>

      {/* 섹션 탭 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'media', label: '숏츠', count: media.length },
              { id: 'reviews', label: '후기', count: reviews.length },
              { id: 'links', label: '유용한 링크', count: links.length }
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeSection === section.id
                    ? 'border-resort-500 text-resort-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {section.label} ({section.count})
              </button>
            ))}
          </nav>
        </div>

        {/* 검색 및 필터 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`${activeSection === 'media' ? '숏츠' : activeSection === 'reviews' ? '후기' : '링크'} 검색...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {activeSection === 'links' && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-resort-500"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* 데이터 목록 */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-resort-600 mx-auto mb-2"></div>
                <p className="text-gray-600">데이터를 불러오는 중...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredData().length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">데이터가 없습니다.</p>
                </div>
              ) : (
                filteredData().map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    {activeSection === 'media' && (
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {item.fileType?.startsWith('image') ? (
                            <img 
                              src={item.fileUrl} 
                              alt={item.description}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs">🎥</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 line-clamp-2">{item.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>리조트: {item.resort}</span>
                            <span>작성자: {item.user?.displayName || '알 수 없음'}</span>
                            <span>작성일: {item.createdAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteMedia(item.id)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {activeSection === 'reviews' && (
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium">{item.overallRating}</span>
                            </div>
                            {item.accommodationRating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-green-400 fill-current" />
                                <span className="text-sm font-medium">{item.accommodationRating}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-900 line-clamp-2">{item.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>리조트: {item.resort}</span>
                            <span>작성자: {item.user || '알 수 없음'}</span>
                            <span>작성일: {item.date?.toDate?.()?.toLocaleDateString() || '날짜 없음'}</span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {item.comments?.length || 0}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteReview(item.id)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {activeSection === 'links' && (
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <ExternalLink className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h3>
                            {item.isRecommended && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-1">{item.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>카테고리: {categories.find(c => c.id === item.category)?.label || item.category}</span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {item.clickCount || 0}
                            </span>
                            <span>상태: {item.status}</span>
                            <span>작성일: {item.createdAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleLinkRecommendation(item.id, item.isRecommended)}
                            className={`p-2 rounded ${
                              item.isRecommended 
                                ? 'text-yellow-600 hover:text-yellow-800' 
                                : 'text-gray-400 hover:text-yellow-600'
                            }`}
                            title={item.isRecommended ? '추천 해제' : '추천 설정'}
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLink(item.id)}
                            className="text-red-600 hover:text-red-800 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResortLifeManagement;

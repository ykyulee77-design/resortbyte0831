import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { UsefulLink, LinkCategory, LinkStatus } from '../../types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Star, 
  Eye, 
  Tag, 
  Globe,
  BookOpen,
  Home,
  Briefcase,
  Coffee,
  Heart,
  Save,
  X
} from 'lucide-react';

const LinkManagement: React.FC = () => {
  const { user } = useAuth();
  const [links, setLinks] = useState<UsefulLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLink, setEditingLink] = useState<UsefulLink | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    category: 'blog' as LinkCategory,
    status: 'active' as LinkStatus,
    imageUrl: '',
    tags: '',
    isRecommended: false
  });

  // 카테고리 정보
  const categories = [
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
    } catch (error) {
      console.error('링크 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      description: '',
      category: 'blog',
      status: 'active',
      imageUrl: '',
      tags: '',
      isRecommended: false
    });
    setEditingLink(null);
  };

  // 링크 추가/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const linkData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        clickCount: editingLink ? editingLink.clickCount : 0,
        addedBy: user.uid,
        updatedAt: serverTimestamp()
      };

      if (editingLink) {
        // 수정
        await updateDoc(doc(db, 'usefulLinks', editingLink.id), linkData);
        alert('링크가 수정되었습니다.');
      } else {
        // 추가
        await addDoc(collection(db, 'usefulLinks'), {
          ...linkData,
          createdAt: serverTimestamp()
        });
        alert('링크가 추가되었습니다.');
      }

      resetForm();
      setShowAddModal(false);
      loadLinks();
    } catch (error) {
      console.error('링크 저장 실패:', error);
      alert('링크 저장에 실패했습니다.');
    }
  };

  // 링크 삭제
  const handleDelete = async (linkId: string) => {
    if (!confirm('이 링크를 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'usefulLinks', linkId));
      alert('링크가 삭제되었습니다.');
      loadLinks();
    } catch (error) {
      console.error('링크 삭제 실패:', error);
      alert('링크 삭제에 실패했습니다.');
    }
  };

  // 편집 모드 시작
  const handleEdit = (link: UsefulLink) => {
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description,
      category: link.category,
      status: link.status,
      imageUrl: link.imageUrl || '',
      tags: link.tags.join(', '),
      isRecommended: link.isRecommended
    });
    setEditingLink(link);
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-resort-600 mx-auto mb-2"></div>
          <p className="text-gray-600">링크 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-resort-600" />
              유용한 링크 관리
            </h2>
            <p className="text-gray-600 mt-1">리조트바이트 사용자들에게 유용한 링크를 관리하세요.</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-resort-600 text-white rounded-lg hover:bg-resort-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            링크 추가
          </button>
        </div>
      </div>

      {/* 링크 목록 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">링크 목록 ({links.length}개)</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {links.length === 0 ? (
            <div className="p-8 text-center">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">등록된 링크가 없습니다.</p>
            </div>
          ) : (
            links.map((link) => {
              const category = categories.find(cat => cat.id === link.category);
              return (
                <div key={link.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{link.title}</h4>
                        {link.isRecommended && (
                          <Star className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          category?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {category?.label || link.category}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          link.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {link.status === 'active' ? '활성' : '비활성'}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{link.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <ExternalLink className="w-4 h-4" />
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-resort-600 hover:text-resort-700"
                          >
                            {link.url}
                          </a>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {link.clickCount}회 조회
                        </div>
                        {link.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="w-4 h-4" />
                            {link.tags.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(link)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="수정"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 링크 추가/수정 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingLink ? '링크 수정' : '링크 추가'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명 *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as LinkCategory})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태 *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as LinkStatus})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
                    required
                  >
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이미지 URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">태그 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="예: 리조트, 취업, 생활"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-resort-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRecommended"
                  checked={formData.isRecommended}
                  onChange={(e) => setFormData({...formData, isRecommended: e.target.checked})}
                  className="h-4 w-4 text-resort-600 focus:ring-resort-500 border-gray-300 rounded"
                />
                <label htmlFor="isRecommended" className="ml-2 block text-sm text-gray-900">
                  추천 링크로 설정
                </label>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-resort-600 text-white rounded-lg hover:bg-resort-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingLink ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkManagement;

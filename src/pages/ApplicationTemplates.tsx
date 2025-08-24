import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { ApplicationTemplate } from '../types';
import { useAuth } from '../contexts/AuthContext';

const ApplicationTemplates: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ApplicationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ApplicationTemplate | null>(null);

  // 폼 데이터
  const [templateName, setTemplateName] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    if (!user) return;

    try {
      const q = query(collection(db, 'applicationTemplates'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const templatesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ApplicationTemplate[];
      
      setTemplates(templatesData);
    } catch (error) {
      console.error('템플릿을 가져오는 중 오류 발생:', error);
      alert('템플릿을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleCreateTemplate = async () => {
    if (!user || !templateName.trim() || !coverLetter.trim()) {
      alert('템플릿 이름과 자기소개서는 필수입니다.');
      return;
    }

    try {
      await addDoc(collection(db, 'applicationTemplates'), {
        userId: user.uid,
        name: templateName,
        coverLetter,
        experience,
        education,
        skills,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setShowCreateModal(false);
      resetForm();
      fetchTemplates();
      alert('템플릿이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('템플릿 저장 중 오류 발생:', error);
      alert('템플릿 저장 중 오류가 발생했습니다.');
    }
  };

  const handleEditTemplate = async () => {
    if (!editingTemplate || !templateName.trim() || !coverLetter.trim()) {
      alert('템플릿 이름과 자기소개서는 필수입니다.');
      return;
    }

    try {
      await updateDoc(doc(db, 'applicationTemplates', editingTemplate.id), {
        name: templateName,
        coverLetter,
        experience,
        education,
        skills,
        updatedAt: new Date(),
      });

      setShowEditModal(false);
      setEditingTemplate(null);
      resetForm();
      fetchTemplates();
      alert('템플릿이 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('템플릿 수정 중 오류 발생:', error);
      alert('템플릿 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('정말로 이 템플릿을 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'applicationTemplates', templateId));
      fetchTemplates();
      alert('템플릿이 삭제되었습니다.');
    } catch (error) {
      console.error('템플릿 삭제 중 오류 발생:', error);
      alert('템플릿 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEditClick = (template: ApplicationTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setCoverLetter(template.coverLetter);
    setExperience(template.experience);
    setEducation(template.education);
    setSkills(template.skills);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setTemplateName('');
    setCoverLetter('');
    setExperience('');
    setEducation('');
    setSkills([]);
    setNewSkill('');
  };

  const handleCreateClick = () => {
    resetForm();
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">템플릿을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">자기소개서 템플릿 관리</h1>
            <div className="flex gap-4">
              <button
                onClick={handleCreateClick}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                새 템플릿 만들기
              </button>
              <button
                onClick={() => navigate('/jobseeker')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                뒤로가기
              </button>
            </div>
          </div>
          
          <p className="text-gray-600">
            자주 사용하는 자기소개서 내용을 템플릿으로 저장하여 빠르게 재사용할 수 있습니다.
          </p>
        </div>

        {/* 템플릿 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">{template.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(template)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">자기소개서</p>
                  <p className="text-gray-700 text-sm line-clamp-3">{template.coverLetter}</p>
                </div>
                
                {template.experience && (
                  <div>
                    <p className="text-sm text-gray-500">경력사항</p>
                    <p className="text-gray-700 text-sm line-clamp-2">{template.experience}</p>
                  </div>
                )}
                
                {template.education && (
                  <div>
                    <p className="text-sm text-gray-500">학력사항</p>
                    <p className="text-gray-700 text-sm line-clamp-2">{template.education}</p>
                  </div>
                )}
                
                {template.skills.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">보유 기술</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                      {template.skills.length > 3 && (
                        <span className="text-gray-500 text-xs">+{template.skills.length - 3}개 더</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  생성일: {template.createdAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">템플릿이 없습니다</h3>
            <p className="text-gray-500 mb-4">첫 번째 자기소개서 템플릿을 만들어보세요!</p>
            <button
              onClick={handleCreateClick}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              템플릿 만들기
            </button>
          </div>
        )}
      </div>

      {/* 템플릿 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">새 자기소개서 템플릿 만들기</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  템플릿 이름 *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="템플릿 이름을 입력하세요"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  자기소개서 *
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="자기소개서를 작성해주세요..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  경력사항
                </label>
                <textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="관련 경력사항을 작성해주세요..."
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  학력사항
                </label>
                <textarea
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="학력사항을 작성해주세요..."
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  보유 기술
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="기술을 입력하세요"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
                  >
                    추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                취소
              </button>
              <button
                onClick={handleCreateTemplate}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 템플릿 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">자기소개서 템플릿 수정</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  템플릿 이름 *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="템플릿 이름을 입력하세요"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  자기소개서 *
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="자기소개서를 작성해주세요..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  경력사항
                </label>
                <textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="관련 경력사항을 작성해주세요..."
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  학력사항
                </label>
                <textarea
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="학력사항을 작성해주세요..."
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  보유 기술
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="기술을 입력하세요"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
                  >
                    추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                취소
              </button>
              <button
                onClick={handleEditTemplate}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                수정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationTemplates; 
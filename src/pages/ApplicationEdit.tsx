import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Application, JobPost } from '../types';

const ApplicationEdit: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [jobPost, setJobPost] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 폼 데이터
  const [coverLetter, setCoverLetter] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [hourlyWage, setHourlyWage] = useState<number>(0);
  const [availableStartDate, setAvailableStartDate] = useState('');
  const [message, setMessage] = useState('');
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    const fetchApplication = async () => {
      if (!applicationId) return;

      try {
        const applicationDoc = await getDoc(doc(db, 'applications', applicationId));
        if (!applicationDoc.exists()) {
          alert('지원서를 찾을 수 없습니다.');
          navigate('/jobseeker');
          return;
        }

        const applicationData = { id: applicationDoc.id, ...applicationDoc.data() } as Application;
        setApplication(applicationData);

        // 공고 정보 가져오기
        const jobPostDoc = await getDoc(doc(db, 'jobPosts', applicationData.jobPostId));
        if (jobPostDoc.exists()) {
          setJobPost({ id: jobPostDoc.id, ...jobPostDoc.data() } as JobPost);
        }

        // 폼 데이터 설정
        setCoverLetter(applicationData.coverLetter || '');
        setExperience(applicationData.experience || '');
        setEducation(applicationData.education || '');
        setSkills(applicationData.skills || []);
        setHourlyWage(applicationData.hourlyWage || 0);
        setAvailableStartDate(applicationData.availableStartDate ? 
          applicationData.availableStartDate.toISOString().split('T')[0] : '');
        setMessage(applicationData.message || '');
      } catch (error) {
        console.error('지원서 정보를 가져오는 중 오류 발생:', error);
        alert('지원서 정보를 가져오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [applicationId, navigate]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    setSaving(true);

    try {
             const updateData: Partial<Application> = {
         coverLetter,
         experience,
         education,
         skills,
         hourlyWage: hourlyWage || undefined,
         availableStartDate: availableStartDate ? new Date(availableStartDate) : undefined,
         message,
         updatedAt: new Date(),
       };

      await updateDoc(doc(db, 'applications', application.id), updateData);

      alert('지원서가 성공적으로 수정되었습니다.');
              navigate('/jobseeker');
    } catch (error) {
      console.error('지원서 수정 중 오류 발생:', error);
      alert('지원서 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">지원서 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!application || !jobPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">지원서를 찾을 수 없습니다</h2>
          <button
            onClick={() => navigate('/jobseeker')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 이미 승인/거절된 지원서는 수정 불가
  if (application.status !== 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">수정할 수 없는 지원서입니다</h2>
          <p className="text-gray-600 mb-4">
            {application.status === 'accepted' ? '승인된' : '거절된'} 지원서는 수정할 수 없습니다.
          </p>
          <button
            onClick={() => navigate('/jobseeker')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">지원서 수정</h1>
            <button
              onClick={() => navigate('/jobseeker')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              뒤로가기
            </button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">공고 정보</h2>
            <p className="text-blue-700"><strong>제목:</strong> {jobPost.title}</p>
            <p className="text-blue-700"><strong>위치:</strong> {jobPost.location}</p>
            <p className="text-blue-700">
              <strong>급여:</strong> {jobPost.salary.min.toLocaleString()} - {jobPost.salary.max.toLocaleString()} {jobPost.salary.type}
            </p>
          </div>
        </div>

        {/* 수정 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">지원서 내용 수정</h2>
          
          {/* 자기소개서 */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              자기소개서 *
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="자기소개서를 작성해주세요..."
              className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 경력사항 */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              경력사항
            </label>
            <textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="관련 경력사항을 작성해주세요..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 학력사항 */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              학력사항
            </label>
            <textarea
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="학력사항을 작성해주세요..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 보유 기술 */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
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

          {/* 희망 시급 */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              희망 시급 (원/시간)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={hourlyWage || ''}
                onChange={(e) => setHourlyWage(Number(e.target.value))}
                min="10000"
                step="1000"
                placeholder="희망 시급을 입력하세요"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">원/시간</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">최소 10,000원부터 1,000원 단위로 입력 가능</p>
          </div>

          {/* 입사 가능일 */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              입사 가능일
            </label>
            <input
              type="date"
              value={availableStartDate}
              onChange={(e) => setAvailableStartDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 추가 메시지 */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              추가 메시지
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="추가로 전달하고 싶은 내용이 있다면 작성해주세요..."
              className="w-full h-24 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/jobseeker')}
              className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
            >
              {saving ? '저장 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationEdit; 
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Resume } from '../types';
import { User, Phone, Calendar, Briefcase, Award, FileText, Save, Edit3, Clock } from 'lucide-react';
import UnifiedScheduleGrid from './UnifiedScheduleGrid';

interface ResumeFormProps {
  onResumeUpdate?: (resume: Resume) => void;
  readOnly?: boolean;
}

// 이력서에서 표시 가능한 필드들만 정의
type DisplayableResumeField = 'phone' | 'birth' | 'jobType' | 'career' | 'intro' | 'hourlyWage' | 'preferredTimeType' | 'certs';

const ResumeForm: React.FC<ResumeFormProps> = ({ onResumeUpdate, readOnly = false }) => {
  const getDayIndexFromString = (day: string): number => {
    const dayMap: { [key: string]: number } = {
      'sunday': 6, 'monday': 0, 'tuesday': 1, 'wednesday': 2,
      'thursday': 3, 'friday': 4, 'saturday': 5,
    };
    return dayMap[day] || 0;
  };
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resume, setResume] = useState<Resume>({
    ...user?.resume,
    hourlyWage: user?.resume?.hourlyWage || 10000,
  });


  const handleInputChange = (field: keyof Resume, value: any) => {
    setResume(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    try {
      setSaving(true);
      await updateDoc(doc(db, 'users', user.uid), {
        resume: {
          ...resume,
          updatedAt: serverTimestamp(),
        },
      });

      setIsEditing(false);
      if (onResumeUpdate) {
        onResumeUpdate(resume);
      }
    } catch (error) {
      console.error('이력서 저장 실패:', error);
      alert('이력서 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setResume({
      ...user?.resume,
      hourlyWage: user?.resume?.hourlyWage || 10000,
    });
    setIsEditing(false);
  };

  // 안전한 값 표시 함수
  const getDisplayValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return value.toString();
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? '예' : '아니오';
    return '';
  };

  const renderField = (field: DisplayableResumeField, label: string, type = 'text', placeholder?: string, required = false) => {
    const value = resume[field];
    const displayValue = getDisplayValue(value);
    const isFilled = displayValue && displayValue.trim() !== '';

    if (!isEditing) {
      return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            {required && <span className="text-red-500 ml-1">*</span>}
          </div>
          <div className="flex items-center">
            {isFilled ? (
              <span className="text-sm text-gray-900">{displayValue}</span>
            ) : (
              <span className="text-sm text-gray-400">미입력</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {type === 'textarea' ? (
          <textarea
            value={displayValue}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        ) : type === 'select' ? (
          <select
            value={displayValue}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">선택하세요</option>
            {field === 'jobType' && (
              <>
                <option value="서빙">서빙</option>
                <option value="주방">주방</option>
                <option value="청소">청소</option>
                <option value="관리">관리</option>
                <option value="안내">안내</option>
                <option value="레크리에이션">레크리에이션</option>
                <option value="프론트">프론트</option>
                <option value="하우스키핑">하우스키핑</option>
                <option value="보안">보안</option>
                <option value="운전">운전</option>
                <option value="정원관리">정원관리</option>
                <option value="수영장관리">수영장관리</option>
                <option value="골프장관리">골프장관리</option>
                <option value="스키장관리">스키장관리</option>
                <option value="기타">기타</option>
              </>
            )}
            {field === 'preferredTimeType' && (
              <>
                <option value="general">시간대 무관</option>
                <option value="specific">특정 시간대 선호</option>
              </>
            )}
          </select>
        ) : (
          <input
            type={type}
            value={displayValue}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-blue-100 bg-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">이력서</h3>
              
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={handleCancel}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
              </>
            ) : !readOnly ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                등록/수정
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* 이력서 내용 */}
      <div className="p-6 space-y-6">
        {/* 기본 정보 */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4" />
            기본 정보
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('phone', '연락처', 'tel', '010-0000-0000', true)}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                 생년월일
                <span className="text-red-500 ml-1">*</span>
              </label>
              {!isEditing ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700">생년월일</span>
                    <span className="text-red-500 ml-1">*</span>
                  </div>
                  <div className="flex items-center">
                    {resume.birth ? (
                      <span className="text-sm text-gray-900">{getDisplayValue(resume.birth)}</span>
                    ) : (
                      <span className="text-sm text-gray-400">미입력</span>
                    )}
                  </div>
                </div>
              ) : (
                <input
                  type="date"
                  value={getDisplayValue(resume.birth) || '2010-01-01'}
                  onChange={(e) => handleInputChange('birth', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
          </div>
        </div>

        {/* 직무 정보 */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            직무 정보
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                 희망 직무
                <span className="text-red-500 ml-1">*</span>
              </label>
              {!isEditing ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700">희망 직무</span>
                    <span className="text-red-500 ml-1">*</span>
                  </div>
                  <div className="flex items-center">
                    {resume.jobType ? (
                      <span className="text-sm text-gray-900">{getDisplayValue(resume.jobType)}</span>
                    ) : (
                      <span className="text-sm text-gray-400">미입력</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {[
                    '서빙', '주방', '청소', '관리', '안내', '레크리에이션', '프론트', 
                    '하우스키핑', '보안', '운전', '정원관리', '수영장관리', '골프장관리', '스키장관리', '기타',
                  ].map((job) => {
                    const currentJobTypes = Array.isArray(resume.jobType) ? resume.jobType : 
                      (resume.jobType ? [resume.jobType] : []);
                    const isSelected = currentJobTypes.includes(job);
                     
                    return (
                      <label key={job} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleInputChange('jobType', [...currentJobTypes, job]);
                            } else {
                              handleInputChange('jobType', currentJobTypes.filter(j => j !== job));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{job}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            {renderField('career', '경력', 'text', '예: 2년', false)}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                 희망 시급 (원)
                <span className="text-red-500 ml-1">*</span>
              </label>
              {!isEditing ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700">희망 시급 (원)</span>
                    <span className="text-red-500 ml-1">*</span>
                  </div>
                  <div className="flex items-center">
                    {resume.hourlyWage ? (
                      <span className="text-sm text-gray-900">{getDisplayValue(resume.hourlyWage)}원</span>
                    ) : (
                      <span className="text-sm text-gray-400">미입력</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const currentWage = resume.hourlyWage || 10000;
                      if (currentWage > 10000) {
                        handleInputChange('hourlyWage', currentWage - 1000);
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                      -
                  </button>
                  <div className="flex-1 text-center px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                    <span className="text-sm font-medium text-gray-900">
                      {(resume.hourlyWage || 10000).toLocaleString()}원
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentWage = resume.hourlyWage || 10000;
                      if (currentWage < 30000) {
                        handleInputChange('hourlyWage', currentWage + 1000);
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                      +
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 선호 시간 */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            선호 시간
          </h4>
          <div className="grid grid-cols-1 gap-4">
            {renderField('preferredTimeType', '시간대 선호도', 'select', '', true)}
            {resume.preferredTimeType === 'specific' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">
                    선호하는 근무시간을 선택해주세요.
                  </p>
                </div>
                <UnifiedScheduleGrid
                  selectedTimeSlots={resume.preferredTimeSlots || []}
                  onChange={(timeSlots) => handleInputChange('preferredTimeSlots', timeSlots)}
                  mode={isEditing ? 'edit' : 'view'}
                  title="선호 근무시간"
                  description="선호하는 근무시간을 선택하세요"
                  showStatistics={true}
                  showActions={false}
                  readOnly={!isEditing}
                  jobseekerView={true}
                />
                {isEditing && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">
                         선택된 시간대: {resume.preferredTimeSlots?.length || 0}개
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (resume.preferredTimeSlots && resume.preferredTimeSlots.length > 0) {
                            alert(`선택된 시간대: ${resume.preferredTimeSlots.length}개\n\n${resume.preferredTimeSlots.map(slot => {
                              const days = ['월', '화', '수', '목', '금', '토', '일'];
                              const start = slot.start || 0;
                              const end = slot.end || 0;
                              const startTime = `${start.toString().padStart(2, '0')}:00`;
                              const endTime = `${end.toString().padStart(2, '0')}:00`;
                              const dayIndex = typeof slot.day === 'number' ? slot.day : getDayIndexFromString(slot.day);
                              return `${days[dayIndex]} ${startTime}-${endTime}`;
                            }).join('\n')}`);
                          } else {
                            alert('선택된 시간대가 없습니다.');
                          }
                        }}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                         확인
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('preferredTimeSlots', [])}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                         초기화
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 자기소개 */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            자기소개
          </h4>
          {renderField('intro', '자기소개', 'textarea', '자신을 소개해주세요...', false)}
        </div>

        {/* 자격증 및 특기 */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
            <Award className="w-4 h-4" />
            자격증 및 특기
          </h4>
          {renderField('certs', '자격증/특기 (쉼표로 구분)', 'text', '예: 서빙자격증, 요리자격증', false)}
        </div>

        
      </div>
    </div>
  );
};

export default ResumeForm;

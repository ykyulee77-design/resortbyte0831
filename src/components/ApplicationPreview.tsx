import React from 'react';
import { User, MapPin, Calendar, DollarSign, Clock, Phone, Mail, GraduationCap, Briefcase, FileText, Clock as ClockIcon } from 'lucide-react';
import { JobPost, Resume, Application } from '../types';

interface ApplicationPreviewProps {
  jobPost: JobPost;
  resume: Resume;
  application: Partial<Application>;
  user: any;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit: () => void;
  isSubmitting?: boolean;
}

const ApplicationPreview: React.FC<ApplicationPreviewProps> = ({
  jobPost,
  resume,
  application,
  user,
  onConfirm,
  onCancel,
  onEdit,
  isSubmitting = false,
}) => {

  const formatDate = (date: Date | string) => {
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('ko-KR');
    }
    return date.toLocaleDateString('ko-KR');
  };

  const formatWage = (wage: number) => {
    return wage.toLocaleString() + '원';
  };

  const getJobTypeText = (jobType: string | string[] | undefined) => {
    if (!jobType) return '미입력';
    if (Array.isArray(jobType)) {
      return jobType.join(', ');
    }
    return jobType;
  };

  const getPreferredTimeText = (preferredTimeType: string | undefined, preferredTimeSlots: any[] | undefined) => {
    if (!preferredTimeType) return '미입력';
    if (preferredTimeType === 'general') return '시간대에 상관없이 근무 가능';
    if (preferredTimeType === 'specific' && preferredTimeSlots && preferredTimeSlots.length > 0) {
      return `선호 시간대: ${preferredTimeSlots.length}개 선택됨`;
    }
    return '선호 시간대 설정됨';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-sm text-gray-500">지원서 작성</span>
                </div>
                <div className="text-gray-300">→</div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <span className="text-sm font-medium text-green-600">지원서 미리보기</span>
                </div>
                <div className="text-gray-300">→</div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-300 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <span className="text-sm text-gray-500">최종 지원</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">지원서 미리보기</h2>
              <p className="text-sm text-gray-600 mt-1">아래 내용이 고용주에게 전송됩니다. 확인 후 최종 지원해주세요.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                수정하기
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={onConfirm}
                disabled={isSubmitting}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                  isSubmitting
                    ? 'text-gray-400 bg-gray-300 cursor-not-allowed'
                    : 'text-white bg-green-600 hover:bg-green-700'
                }`}
              >
                {isSubmitting ? '지원 중...' : '최종 지원하기'}
              </button>
            </div>
          </div>
        </div>

        {/* 지원서 내용 */}
        <div className="p-6 space-y-8">
          {/* 공고 정보 */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              지원 공고 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">{jobPost.title}</h4>
                <p className="text-sm text-blue-700 mb-2">{jobPost.description}</p>
                <div className="flex items-center text-sm text-blue-600 mb-1">
                  <MapPin className="w-4 h-4 mr-2" />
                  {jobPost.location}
                </div>
                <div className="flex items-center text-sm text-blue-600 mb-1">
                  <DollarSign className="w-4 h-4 mr-2" />
                  {jobPost.salary?.min?.toLocaleString()}원 ~ {jobPost.salary?.max?.toLocaleString()}원
                </div>
                <div className="flex items-center text-sm text-blue-600">
                  <User className="w-4 h-4 mr-2" />
                  {jobPost.employerName}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">선택한 근무타입</h4>
                {application.selectedWorkTypeIds && application.selectedWorkTypeIds.length > 0 ? (
                  <div className="space-y-2">
                    {application.selectedWorkTypeIds.map((workTypeId) => {
                      if (workTypeId === 'any') {
                        return (
                          <div key={workTypeId} className="bg-blue-100 rounded-md px-3 py-2">
                            <div className="font-medium text-blue-800">무관 (어떤 근무타입이든 가능)</div>
                            <div className="text-sm text-blue-600">모든 근무타입에 지원 가능합니다</div>
                          </div>
                        );
                      }
                      
                      const workType = jobPost.workTypes?.find(wt => wt.id === workTypeId);
                      return (
                        <div key={workTypeId} className="bg-blue-100 rounded-md px-3 py-2">
                          <div className="font-medium text-blue-800">{workType?.name}</div>
                          <div className="text-sm text-blue-600">{workType?.description}</div>
                          {workType?.hourlyWage && (
                            <div className="text-sm text-blue-600">
                              시급: {formatWage(workType.hourlyWage)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-blue-600">선택된 근무타입이 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          {/* 지원자 기본 정보 */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              지원자 기본 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-3">개인 정보</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-20">이름:</span>
                    <span className="text-gray-900">{user?.displayName || '미입력'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-20">이메일:</span>
                    <span className="text-gray-900">{user?.email || '미입력'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-20">전화번호:</span>
                    <span className="text-gray-900">{resume.phone || '미입력'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-20">생년월일:</span>
                    <span className="text-gray-900">{resume.birth || '미입력'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-3">직무 정보</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-20">희망 직무:</span>
                    <span className="text-gray-900">{getJobTypeText(resume.jobType)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-20">경력:</span>
                    <span className="text-gray-900">{resume.career || '미입력'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-20">희망 시급:</span>
                    <span className="text-gray-900">{resume.hourlyWage ? formatWage(resume.hourlyWage) : '미입력'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-20">가능 시작일:</span>
                    <span className="text-gray-900">{resume.availableStartDate ? formatDate(resume.availableStartDate) : '미입력'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 학력 및 자격 */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              학력 및 자격
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">최종 학력</h4>
                <p className="text-gray-900">{resume.education || '미입력'}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">자격증/특기</h4>
                <p className="text-gray-900">
                  {resume.certs && resume.certs.length > 0 ? resume.certs.join(', ') : '미입력'}
                </p>
              </div>
            </div>
          </div>

          {/* 선호 근무시간 */}
          {resume.preferredTimeType && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ClockIcon className="w-5 h-5" />
                선호 근무시간
              </h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <span className="font-medium text-gray-700 w-24">선호 타입:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    resume.preferredTimeType === 'general' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {resume.preferredTimeType === 'general' ? '일반' : '선호시간 있음'}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="font-medium text-gray-700 w-24">상세:</span>
                  <span className="text-gray-900">{getPreferredTimeText(resume.preferredTimeType, resume.preferredTimeSlots)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 자기소개 */}
          {resume.intro && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                자기소개
              </h3>
              <p className="text-gray-900 whitespace-pre-wrap">{resume.intro}</p>
            </div>
          )}

          {/* 지원 동기 */}
          {application.coverLetter && (
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                지원 동기
              </h3>
              <p className="text-green-900 whitespace-pre-wrap">{application.coverLetter}</p>
            </div>
          )}

          {/* 지원 메타정보 */}
          <div className="bg-yellow-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              지원 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <span className="font-medium text-yellow-800 w-20">지원일:</span>
                  <span className="text-yellow-900">{new Date().toLocaleDateString('ko-KR')}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="font-medium text-yellow-800 w-20">지원 시간:</span>
                  <span className="text-yellow-900">{new Date().toLocaleTimeString('ko-KR')}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="font-medium text-yellow-800 w-20">지원 상태:</span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    미리보기
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <span className="font-medium text-yellow-800 w-20">평가 노출:</span>
                  <span className="text-yellow-900">{resume.showEvaluations ? '예' : '아니오'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="font-medium text-yellow-800 w-20">선택 근무타입:</span>
                  <span className="text-yellow-900">{application.selectedWorkTypeIds?.length || 0}개</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="font-medium text-yellow-800 w-20">이력서 완성도:</span>
                  <span className="text-yellow-900">
                    {resume.phone && resume.birth && resume.jobType && resume.hourlyWage && resume.preferredTimeType ? '완성' : '미완성'}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-100 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>안내:</strong> 위 내용이 고용주에게 전송됩니다. 수정이 필요한 경우 '수정하기' 버튼을 클릭하세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationPreview;

import React, { useState } from 'react';
import { Application } from '../types';

interface InterviewNoteModalProps {
  application: Application;
  onSave: (interviewData: {
    note: string;
    contactInfo: string;
    interviewDate: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const InterviewNoteModal: React.FC<InterviewNoteModalProps> = ({ 
  application, 
  onSave, 
  onCancel 
}) => {
  const [interviewNote, setInterviewNote] = useState(application.employerFeedback || '');
  const [contactInfo, setContactInfo] = useState(() => {
    // 기존 면접 노트에 저장된 연락처가 있으면 우선 사용
    if (application.interviewContactInfo) return application.interviewContactInfo;
    
    // 지원서에서 연락처 정보 추출 (여러 소스에서 확인)
    if (application.phone) return application.phone;
    if (application.email) return application.email;
    
    // 지원자의 resume 정보에서 연락처 추출
    if (application.resume?.phone) return application.resume.phone;
    
    // 지원자 기본 정보에서 이메일 추출
    if (application.email) return application.email;
    
    return '';
  });
  const [interviewDate, setInterviewDate] = useState(application.interviewDate || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      note: interviewNote,
      contactInfo: contactInfo,
      interviewDate: interviewDate,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">면접 노트 - {application.jobseekerName}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              지원자 연락처 
              <span className="text-xs text-gray-500 ml-1">(지원서에서 자동 추출)</span>
            </label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="전화번호 또는 이메일"
            />
            {!contactInfo && (
              <p className="text-xs text-red-500 mt-1">
                지원서에 연락처 정보가 없습니다. 수동으로 입력해주세요.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">면접일자</label>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">면접 노트</label>
            <textarea
              value={interviewNote}
              onChange={(e) => setInterviewNote(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="면접 내용, 평가, 인상 등을 자유롭게 작성해주세요..."
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewNoteModal;

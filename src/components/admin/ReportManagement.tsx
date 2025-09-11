import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Report, ReportStatus } from '../../types';
import { Flag, CheckCircle, XCircle, Eye, Clock, AlertTriangle, User, FileText } from 'lucide-react';

const ReportManagement: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adminMemo, setAdminMemo] = useState('');

  // 신고 목록 로드
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const reportsQuery = query(
        collection(db, 'reports'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(reportsQuery);
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];
      setReports(reportsData);
    } catch (error) {
      console.error('신고 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 신고 처리
  const handleReportAction = async (reportId: string, action: 'approve' | 'dismiss') => {
    if (!user) return;

    setProcessing(true);
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'resolved' as ReportStatus,
        resolvedAt: serverTimestamp(),
        resolvedBy: user.uid,
        action,
        adminMemo: adminMemo.trim() || null
      });

      // 목록 새로고침
      await loadReports();
      
      // 조용히 처리 완료
      setAdminMemo('');
      setShowDetailModal(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('신고 처리 실패:', error);
      alert('신고 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  // 신고 상세 보기
  const handleViewDetail = (report: Report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  // 필터링된 신고 목록
  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  // 통계 계산
  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    resolved: reports.filter(r => r.status === 'resolved').length
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: { [key: string]: string } = {
      spam: '스팸/도배',
      fake: '가짜 정보',
      inappropriate: '부적절한 내용',
      scam: '사기/피싱',
      other: '기타'
    };
    return reasonMap[reason] || reason;
  };

  const getTargetTypeLabel = (type: string) => {
    return type === 'jobPost' ? '공고' : '사용자';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          대기중
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          처리완료
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
          <p className="text-gray-600">신고 목록을 불러오는 중...</p>
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
              <Flag className="w-5 h-5 text-red-600" />
              신고 관리
            </h2>
            <p className="text-gray-600 mt-1">사용자 신고를 검토하고 처리하세요.</p>
          </div>
          <button
            onClick={loadReports}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Clock className="w-4 h-4" />
            새로고침
          </button>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Flag className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 신고</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">처리 대기</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">처리 완료</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">필터:</span>
          <div className="flex gap-2">
            {[
              { key: 'all', label: '전체' },
              { key: 'pending', label: '처리 대기' },
              { key: 'resolved', label: '처리 완료' }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption.key
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 신고 목록 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">신고 목록</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredReports.length === 0 ? (
            <div className="p-8 text-center">
              <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">신고가 없습니다.</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {report.targetType === 'jobPost' ? (
                        <FileText className="w-4 h-4 text-blue-600" />
                      ) : (
                        <User className="w-4 h-4 text-green-600" />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {getTargetTypeLabel(report.targetType)} 신고
                      </span>
                      {getStatusBadge(report.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">신고자:</span>
                        <span className="ml-2 text-gray-900">{report.reporterName || '익명'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">대상:</span>
                        <span className="ml-2 text-gray-900">{report.targetName || '알 수 없음'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">사유:</span>
                        <span className="ml-2 text-gray-900">{getReasonLabel(report.reason)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <span className="text-gray-500 text-sm">신고 내용:</span>
                      <p className="text-gray-900 text-sm mt-1 line-clamp-2">
                        {report.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleViewDetail(report)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="상세 보기"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleReportAction(report.id, 'approve')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="신고 승인"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReportAction(report.id, 'dismiss')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="신고 기각"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 신고 상세 모달 */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">신고 상세 정보</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">신고자</label>
                  <p className="text-sm text-gray-900">{selectedReport.reporterName || '익명'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">신고 대상</label>
                  <p className="text-sm text-gray-900">{selectedReport.targetName || '알 수 없음'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">대상 타입</label>
                  <p className="text-sm text-gray-900">{getTargetTypeLabel(selectedReport.targetType)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">신고 사유</label>
                  <p className="text-sm text-gray-900">{getReasonLabel(selectedReport.reason)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">신고 상태</label>
                  <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">신고 일시</label>
                  <p className="text-sm text-gray-900">
                    {selectedReport.createdAt?.toDate?.()?.toLocaleString() || '알 수 없음'}
                  </p>
                </div>
              </div>
              
              {/* 신고 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">신고 내용</label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedReport.description}
                  </p>
                </div>
              </div>
              
              {/* 처리 결과 */}
              {selectedReport.status === 'resolved' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">처리 결과</label>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-800">
                      {selectedReport.resolvedAt?.toDate?.()?.toLocaleString() || '알 수 없음'}에 처리 완료
                    </p>
                    {selectedReport.adminMemo && (
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">관리자 메모</label>
                        <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                          {selectedReport.adminMemo}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* 액션 버튼 */}
            {selectedReport.status === 'pending' && (
              <div className="p-6 border-t space-y-4">
                {/* 관리자 메모 입력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    관리자 메모 (선택사항)
                  </label>
                  <textarea
                    value={adminMemo}
                    onChange={(e) => setAdminMemo(e.target.value)}
                    placeholder="신고 처리에 대한 메모를 입력하세요..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={3}
                    disabled={processing}
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={processing}
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => handleReportAction(selectedReport.id, 'dismiss')}
                    className="px-4 py-2 text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                    disabled={processing}
                  >
                    {processing ? '처리 중...' : '신고 기각'}
                  </button>
                  <button
                    onClick={() => handleReportAction(selectedReport.id, 'approve')}
                    className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    disabled={processing}
                  >
                    {processing ? '처리 중...' : '신고 승인'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagement;

import React, { useState } from 'react';
import { runFullMigration, migrateCompanyDataFromUsers, migrateCompanyDataFromCompanyInfo } from '../utils/migrateCompanyData';

const MigrationPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMigration = async (type: 'full' | 'users' | 'companyInfo') => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let migrationResult;
      
      switch (type) {
        case 'full':
          migrationResult = await runFullMigration();
          break;
        case 'users':
          migrationResult = await migrateCompanyDataFromUsers();
          break;
        case 'companyInfo':
          migrationResult = await migrateCompanyDataFromCompanyInfo();
          break;
      }
      
      setResult(migrationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '마이그레이션 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            데이터 마이그레이션
          </h1>
          
          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              기존 users 컬렉션과 companyInfo 컬렉션의 회사 정보를 companies 컬렉션으로 마이그레이션합니다.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">⚠️ 주의사항</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 마이그레이션은 한 번만 실행해야 합니다</li>
                <li>• 마이그레이션 중에는 다른 작업을 하지 마세요</li>
                <li>• 마이그레이션 후에는 기존 회사 정보가 제거됩니다</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => handleMigration('full')}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              전체 마이그레이션
            </button>
            
            <button
              onClick={() => handleMigration('users')}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Users 컬렉션만
            </button>
            
            <button
              onClick={() => handleMigration('companyInfo')}
              disabled={loading}
              className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CompanyInfo 컬렉션만
            </button>
          </div>

          {loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800">마이그레이션 진행 중...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <h3 className="text-sm font-medium text-red-800 mb-2">❌ 오류</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-green-800 mb-2">✅ 마이그레이션 완료</h3>
              <div className="text-sm text-green-700 space-y-1">
                {result.success && (
                  <>
                    {result.users && (
                      <p>• Users 컬렉션: {result.users.migrated}명 마이그레이션, {result.users.skipped}명 스킵</p>
                    )}
                    {result.companyInfo && (
                      <p>• CompanyInfo 컬렉션: {result.companyInfo.migrated}개 마이그레이션, {result.companyInfo.skipped}개 스킵</p>
                    )}
                    {!result.users && !result.companyInfo && (
                      <>
                        <p>• 마이그레이션된 항목: {result.migrated}개</p>
                        <p>• 스킵된 항목: {result.skipped}개</p>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">마이그레이션 내용</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900">1. Users 컬렉션 마이그레이션</h4>
                <p>• employer 역할 사용자의 회사 정보를 companies 컬렉션으로 이동</p>
                <p>• users 컬렉션에서는 회사 정보 제거하고 companyId만 유지</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">2. CompanyInfo 컬렉션 마이그레이션</h4>
                <p>• companyInfo 컬렉션의 모든 회사 정보를 companies 컬렉션으로 이동</p>
                <p>• users 컬렉션에 companyId 추가</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">3. 결과</h4>
                <p>• 모든 회사 정보가 companies 컬렉션에 통합</p>
                <p>• users 컬렉션은 개인 정보만 저장</p>
                <p>• 데이터 중복 제거 및 효율성 향상</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrationPage;

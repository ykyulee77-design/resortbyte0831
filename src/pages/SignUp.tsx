import React from 'react';
import { Link } from 'react-router-dom';
import { Building, User, Home, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';

const SignUp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              리조트바이트에 오신 것을 환영합니다! 🎉
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              어떤 역할로 가입하시나요?
            </p>
            <p className="mt-1 text-sm text-gray-500">
              역할에 따라 맞춤형 회원가입 과정을 제공합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            {/* 크루 (구직자) 카드 */}
            <Link
              to="/signup/crew"
              className="group relative bg-white p-8 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">크루 (구직자)</h3>
                <p className="mt-2 text-sm text-gray-600">
                  리조트에서 일할 기회를 찾고 있어요
                </p>
                <div className="mt-4 space-y-2 text-xs text-gray-500">
                  <p>• 간편한 이력서 작성</p>
                  <p>• 맞춤형 일자리 추천</p>
                  <p>• 리조트 후기 및 정보</p>
                </div>
                <div className="mt-6 flex items-center justify-center text-blue-600 group-hover:text-blue-700">
                  <span className="text-sm font-medium">크루로 가입하기</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            </Link>

            {/* 리조트 (채용자) 카드 */}
            <Link
              to="/signup/resort"
              className="group relative bg-white p-8 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                  <Building className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">리조트 (고용주)</h3>
                <p className="mt-2 text-sm text-gray-600">
                  우수한 크루를 찾고 계시는군요
                </p>
                <div className="mt-4 space-y-2 text-xs text-gray-500">
                  <p>• 간편한 공고 등록</p>
                  <p>• 검증된 크루 매칭</p>
                  <p>• 효율적인 지원자 관리</p>
                </div>
                <div className="mt-6 flex items-center justify-center text-green-600 group-hover:text-green-700">
                  <span className="text-sm font-medium">리조트로 가입하기</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            </Link>
          </div>

          <div className="text-center">
            <div className="pt-6">
              <Link 
                to="/" 
                className="inline-flex items-center text-sm text-gray-600 hover:text-resort-600 transition-colors"
              >
                <Home className="w-4 h-4 mr-1" />
                홈페이지로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
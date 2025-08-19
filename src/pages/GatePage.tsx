import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Users, 
  Clock, 
  Home, 
  Star, 
  Award, 
  TrendingUp,
  Heart,
  ArrowRight
} from 'lucide-react';

const GatePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8">
              <span className="text-blue-600">리조트</span>
              <span className="text-green-600">바이트</span>
            </h1>
                         <p className="text-2xl md:text-3xl text-gray-600 max-w-5xl mx-auto leading-relaxed mb-12">
               지역 리조트와 크루를 연결하는 <span className="font-semibold text-blue-600">스마트한 구인구직 플랫폼이에요</span>
             </p>
            
                                     <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/register?type=employer"
                className="inline-flex items-center px-10 py-4 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl text-lg"
              >
                구인자 등록
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center px-10 py-4 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl text-lg"
              >
                구직자 등록
              </Link>
              <Link
                to="/home"
                className="inline-flex items-center px-10 py-4 bg-gray-600 text-white font-semibold rounded-full hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl text-lg"
              >
                들러 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 문제 해결 Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              우리가 해결하는 문제
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              지역 리조트의 인력 부족과 크루의 새로운 일자리 욕구를 연결해요
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-8">구인자의 고민</h3>
              <div className="space-y-8">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">성수기 인력 부족</h4>
                  <p className="text-gray-600 text-lg leading-relaxed">성수기와 성수일에 필요한 유연한 근무인력을 구하기 어려워요</p>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">영업 편차 대응</h4>
                  <p className="text-gray-600 text-lg leading-relaxed">성수기와 비수기의 영업 편차에 따른 스케줄 근무를 개선해야 해요</p>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">전문성 부족</h4>
                  <p className="text-gray-600 text-lg leading-relaxed">서비스업 경험자와 전문 인력이 부족해요</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-8">구직자의 니즈</h3>
              <div className="space-y-8">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">원격근무 불안</h4>
                  <p className="text-gray-600 text-lg leading-relaxed">도심을 벗어난 원격지 근무에 대한 정보가 부족하고 불안해요</p>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">숙식 정보 필요</h4>
                  <p className="text-gray-600 text-lg leading-relaxed">근무 외적인 기숙사, 식사 등 생활 정보가 필요해요</p>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">문화·레저 체험</h4>
                  <p className="text-gray-600 text-lg leading-relaxed">리조트 지역의 문화와 레저 생활에 대한 정보가 필요해요</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 핵심 가치 Section */}
      <section className="py-24 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              리조트바이트의 핵심 가치
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              지역 리조트와 크루를 연결하는 5가지 핵심 가치예요
            </p>
          </div>

          <div className="space-y-16">
            <div className="flex items-start gap-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">지역 리조트 전문 플랫폼</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  전국 리조트 지역의 맞춤형 구인구직 정보를 제공해서 
                  지역 특성에 맞는 최적의 매칭을 지원해요.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">다양한 근무타입 매칭</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  주간/야간, 주중/주말, 시즌제 등 다양한 근무타입을 통해 
                  구인자와 구직자의 생산성을 동시에 높여줘요.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Home className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">기숙사 및 식사 제공</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  기숙사와 식사 정보를 제공해서 원격지 생활의 부담을 줄이고 
                  안전하고 편안한 근무 환경을 보장해요.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">근무 체험 공유</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  실제 근무자들의 체험담과 평가를 통해 
                  신뢰성 있는 정보를 제공하고 투명한 매칭을 지원해요.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Award className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">서비스 전문직 인증</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  서비스업 경험과 전문성을 인증하는 시스템을 통해 
                  합리적인 보상체계를 구축해요.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">지속적 성장</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  지역 경제 활성화와 크루의 새로운 일자리 기회를 창출해서 
                  지속 가능한 성장을 추구해요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 이용방법 Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              간단한 이용방법
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              3단계로 쉽게 시작하는 리조트바이트예요
            </p>
          </div>

          <div className="space-y-16">
            <div className="flex items-start gap-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-4xl font-bold text-blue-600">1</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">회원가입</h3>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  구인자 또는 구직자로 회원가입하고 
                  기본 정보를 입력해요.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-4xl font-bold text-green-600">2</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">정보 등록</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  구인자는 공고를, 구직자는 이력서를 등록해서 
                  상세한 정보를 제공해요.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-4xl font-bold text-purple-600">3</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">매칭 및 지원</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  스마트 매칭을 통해 최적의 상대를 찾고 
                  지원서를 작성해서 연결돼요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-white mb-8">
            지금 바로 시작하세요!
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
            지역 리조트와 크루를 연결하는 새로운 일자리 플랫폼에서 
            당신의 새로운 기회를 찾아보세요!
          </p>
          
                     <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
             <Link
               to="/register?type=employer"
               className="inline-flex items-center px-10 py-4 bg-white text-blue-600 font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl text-lg"
             >
               구인자 시작하기
             </Link>
             <Link
               to="/signup"
               className="inline-flex items-center px-10 py-4 bg-white text-green-600 font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl text-lg"
             >
               구직자 시작하기
             </Link>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">리조트바이트</h3>
          <p className="text-gray-400 text-lg mb-8">
            지역 리조트와 크루를 연결하는 
            스마트한 구인구직 플랫폼이에요
          </p>
          <div className="border-t border-gray-800 pt-8 text-sm text-gray-400">
            <p>&copy; 2024 리조트바이트. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GatePage;

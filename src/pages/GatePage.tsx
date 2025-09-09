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
  ArrowRight,
} from 'lucide-react';

const GatePage: React.FC = () => {
  const [expanded, setExpanded] = React.useState(false);

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
                리조트 등록
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center px-10 py-4 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl text-lg"
              >
                크루 등록
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
              <h3 className="text-3xl font-bold text-gray-900 mb-8">리조트의 고민</h3>
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
              <h3 className="text-3xl font-bold text-gray-900 mb-8">크루의 니즈</h3>
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
                  리조트 또는 크루로 회원가입하고 
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
                  리조트는 공고를, 크루는 이력서를 등록해서 
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
               리조트 시작하기
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center px-10 py-4 bg-white text-green-600 font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl text-lg"
            >
               크루 시작하기
            </Link>
          </div>
        </div>
      </section>

      {/* Essay Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="relative">
            <div
              className="text-gray-800 leading-6 md:leading-7 text-lg md:text-xl space-y-4"
              style={{
                display: (expanded ? 'block' : '-webkit-box') as any,
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: (expanded ? 'unset' : 5) as unknown as number,
                overflow: 'hidden',
              }}
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  사람을 구하지 못하는 시대, 그리고 인력을 줄이라는 시대
                </h3>
                
                <p>
                  오랫만에 만난 리조트 총지배인의 얼굴에는 미묘한 웃음과 한숨이 동시에 섞여 있었다.
                </p>
                
                <p>
                  "장사 잘 되지?"라는 나의 상투적인 인사에 그는 곧바로 "사람을 못 구해서 큰일이에요. 본사에서는 또 인력을 줄이라고 난리예요"라며 한탄을 내뱉었다.
                </p>
                
                <p>
                  그의 말은 단순한 하소연이 아니라, 오늘날 우리 호텔·리조트 산업이 안고 있는 구조적 모순을 드러내고 있었다.
                </p>
                
                <p>
                  직원이 필요한데도 채용할 수 없고, 또 남는 인력이 있다고 본사는 줄이라고 한다.
                </p>
                
                <p>
                  겉으로는 두 개의 문제 같지만, 사실상 하나의 동전 양면처럼 얽혀 있는 현실이다.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xl font-semibold text-gray-800 mb-2">
                  첫째는 사람을 구하기 어려운 문제다.
                </h4>
                
                <p>
                  젊은 인구는 줄고, 그나마 있는 인력은 도시로 몰려든다.
                </p>
                
                <p>
                  지방의 호텔과 리조트는 갈수록 고령화된 노동시장 속에서 외면받고 있다.
                </p>
                
                <p>
                  숙식 문제, 타지 생활의 막연한 불안, 그리고 '지방 근무는 힘들다'는 고정관념이 노동자를 가로막는다.
                </p>
                
                <p>
                  결국 일할 사람은 없고, 기업은 채용을 포기하거나 울며 겨자 먹기로 비숙련 인력에 의존한다.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xl font-semibold text-gray-800 mb-2">
                  둘째는 인력을 줄이라는 압박이다.
                </h4>
                
                <p>
                  성수기에는 사람이 부족하지만, 비수기에는 오히려 인력이 남아돈다.
                </p>
                
                <p>
                  과거처럼 뚜렷한 계절성만이 아니라 주중·주말의 수요 변동이 커져, 정규직과 비정규직의 단순한 구도로는 대응하기 어려운 상황이 되었다.
                </p>
                
                <p>
                  그럼에도 불구하고 여전히 오래된 스케줄에 매달리며, 고객의 생활 패턴 변화에 걸맞은 유연한 인력 운용은 뒷전이다.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xl font-semibold text-gray-800 mb-2">
                  이 문제의 해법은 분명하다.
                </h4>
                
                <p>
                  지방 근무를 '기피'가 아니라 '기회'로 바꾸는 일, 그리고 일하는 시간 자체를 다시 설계하는 일이다.
                </p>
                
                <p>
                  숙식 지원, 지역 경험 프로그램, 레저 혜택 등으로 지방 근무의 매력을 높이고, 구직자와 기업을 정교하게 연결하는 온라인 매칭 플랫폼을 구축해야 한다.
                </p>
                
                <p>
                  또한 기업은 고객의 변화된 이용 행태를 반영해 근무시간을 재설계하고, 직원이 원하는 시간과 회사가 필요한 시간을 맞물리게 해야 한다.
                </p>
              </div>

              <div className="space-y-2">
                <p>
                  이것은 단순히 비용을 줄이는 문제가 아니다.
                </p>
                
                <p>
                  사람을 구하지 못해 한숨 쉬는 현장과, 인력을 줄이라고 목소리 높이는 본사 사이의 모순을 풀어내는 길이다.
                </p>
                
                <p>
                  그리고 동시에, 서비스업이 지속가능성을 확보하기 위한 가장 기본적인 과제다.
                </p>
              </div>

              <div className="space-y-2">
                <p>
                  결국 문제는 사람이 아니라 시스템이다.
                </p>
                
                <p>
                  사람을 탓하기 전에, 우리가 만들어온 일자리의 구조와 문화를 돌아보아야 한다.
                </p>
                
                <p>
                  그때서야 우리는 "사람이 없어 힘들다"는 탄식과 "인력을 줄이라"는 명령 사이의 간극을 좁힐 수 있을 것이다.
                </p>
              </div>

              <div className="text-right text-gray-600 italic mt-4">
                - 어떤 블로그에서 -
              </div>
            </div>

            {!expanded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {expanded ? '접기' : '더보기'}
            </button>
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

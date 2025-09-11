import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building, Sparkles } from 'lucide-react';

const DormGate: React.FC = () => {
  const location = useLocation();
  const employerRedirect = encodeURIComponent('/employer-dashboard');
  const crewShortsRedirect = encodeURIComponent('/reviews/media/new');
  const crewReviewRedirect = encodeURIComponent('/reviews/new');
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="text-blue-600">리조트</span>
              <span className="text-green-600">바이트</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              리조트 일자리, 이제 다르게 생각해보세요. <span className="font-semibold text-blue-600">우리의 첫번째는 기숙사 이야기부터 시작합니다.</span>
            </p>

            {/* Story paragraphs restored */}
            <div className="mt-10 text-left max-w-3xl mx-auto space-y-3 text-gray-700 text-base leading-relaxed">
              <p>
                <strong>리조트바이트</strong>는 단순한 구인구직 사이트가 아니에요. 우리는 리조트 노동시장의 새로운 생태계를 만들고 있어요.
                일하고 싶은 사람과 일자리를 연결하는 것뿐만 아니라, <span className="text-emerald-700 font-medium">지방 근무의 매력을 키우고, 효율적인 근무시간을 재설계</span>하는 것이 목표예요.
              </p>
              <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-r-lg">
                <p className="text-emerald-800 font-medium mb-2">🎯 우리가 해결하고 싶은 것들:</p>
                <ul className="text-emerald-700 text-sm space-y-1">
                  <li>• 개인이 일하고 싶은 공간 ↔ 기업이 필요로 하는 공간 연결</li>
                  <li>• 개인이 일하고 싶은 시간 ↔ 기업이 필요로 하는 시간 연결</li>
                  <li>• 지방 근무의 불편요소와 유인요소에 대한 정보와 해결책 제시</li>
                </ul>
              </div>
              <p>
                그런데 이런 큰 그림을 그리기 전에, <span className="text-emerald-700 font-medium">가장 중요한 것부터 시작해야겠더라고요.</span> 바로 <strong>숙식 문제</strong>입니다.
                리조트에서 일하는 사람들에게 가장 큰 고민이니까요.
              </p>
              <p>
                그래서 우리는 기숙사 정보 교환부터 시작해요. 실제 사진, 위치, 편의시설, 규칙까지... 솔직한 후기와 댓글로 신뢰를 쌓고, 더 나은 매칭으로 이어지게 하는 거죠 😊
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
              <a href="/accommodations" className="block rounded-2xl bg-white/70 backdrop-blur border border-gray-200 p-6 hover:bg-white hover:shadow-lg transition-all">
                <div className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span>🗺️</span> 기숙사부터 살펴보기
                </div>
                <div className="mt-2 text-sm md:text-base text-gray-600">사진, 위치, 편의시설, 규칙… 살면서 알게 되는 것들을 미리 알아요.</div>
                <div className="mt-3 inline-flex items-center gap-1 text-emerald-700 text-xs bg-emerald-50 px-2 py-1 rounded-full">실사용자 후기와 코멘트 포함</div>
              </a>
              <a href="/resort-life" className="block rounded-2xl bg-white/70 backdrop-blur border border-gray-200 p-6 hover:bg-white hover:shadow-lg transition-all">
                <div className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span>🎬</span> 현장 분위기 먼저 느껴보기
                </div>
                <div className="mt-2 text-sm md:text-base text-gray-600">짧은 숏츠, 솔직한 후기, 생활 가이드. ‘어떤 느낌인지’부터 확인해요.</div>
                <div className="mt-3 inline-flex items-center gap-1 text-indigo-700 text-xs bg-indigo-50 px-2 py-1 rounded-full">부담 없이 스크롤만 해도 충분해요</div>
              </a>
            </div>

            {/* 참여 섹션 CTA as Cards */}
            <div className="mt-12 text-center">
              <p className="text-base md:text-lg text-gray-700 mb-4">
                회원등록하고 시작해요 — 리조트는 기숙사 정보를, 크루는 현장 분위기를 채워요.
              </p>
              <p className="text-sm md:text-base text-gray-500 mb-6">이것을 채우면서 비로소 시작합니다.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                {/* 리조트 카드 */}
                <a href={`/signup?role=employer&redirect=${employerRedirect}`} className="group block rounded-3xl border-2 border-blue-200 p-6 bg-gradient-to-br from-blue-50/80 to-blue-100/60 hover:from-blue-50 hover:to-blue-100 hover:border-blue-300 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">리조트용</span>
                  </div>
                  <div className="mt-3 text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" /> 기숙사 등록하기
                  </div>
                  <div className="mt-2 text-sm md:text-base text-gray-600">사진·위치·편의시설·규칙을 등록해주시면 크루의 선택이 쉬워져요.</div>
                  <div className="mt-3 inline-flex items-center gap-1 text-blue-700 text-xs bg-blue-50 px-2 py-1 rounded-full">대시보드로 이동하여 등록</div>
                </a>
                {/* 크루 카드 */}
                <a href={`/signup?redirect=${crewShortsRedirect}`} className="group block rounded-3xl border-2 border-green-200 p-6 bg-gradient-to-br from-green-50/80 to-green-100/60 hover:from-green-50 hover:to-green-100 hover:border-green-300 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">크루용</span>
                  </div>
                  <div className="mt-3 text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-600" /> 후기 숏츠 리뷰 작성하기
                  </div>
                  <div className="mt-2 text-sm md:text-base text-gray-600">짧은 숏츠·후기로 현장의 공기와 리듬을 공유해요. 다음 크루에게 큰 도움!</div>
                  <div className="mt-3 inline-flex items-center gap-1 text-green-700 text-xs bg-green-50 px-2 py-1 rounded-full">업로드 페이지로 이동하여 참여</div>
                </a>
              </div>
            </div>

            {/* 소개로 이동 버튼 */}
            <div className="mt-10">
              <Link to="/gate" className="inline-flex items-center px-10 py-4 bg-gray-700 text-white font-semibold rounded-full hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl text-lg">
                우리가 만들고 싶은 시장 이야기 듣기
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DormGate;

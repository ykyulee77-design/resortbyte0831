import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, HelpCircle, Send } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ: React.FC = () => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [suggestionForm, setSuggestionForm] = useState({
    name: '',
    email: '',
    type: 'question', // 'question' | 'suggestion'
    title: '',
    content: ''
  });
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<string>('');

     const faqData: FAQItem[] = [
     // 회원가입 관련
     {
       id: 'signup-1',
       question: '리조트바이트 회원가입은 어떻게 하나요?',
       answer: '홈페이지 상단의 "리조트 시작" 또는 "크루 시작" 버튼을 클릭하여 회원가입을 진행할 수 있습니다. 리조트는 기숙사 정보를 등록할 수 있고, 크루는 일자리를 찾을 수 있습니다.',
       category: 'signup'
     },
     {
       id: 'signup-2',
       question: '리조트와 크루 중 어떤 회원으로 가입해야 하나요?',
       answer: '리조트 운영자라면 "리조트"로, 일자리를 찾는 분이라면 "크루"로 가입하시면 됩니다. 리조트는 기숙사 정보를 등록하고 인력을 모집할 수 있고, 크루는 다양한 일자리를 찾고 지원할 수 있습니다.',
       category: 'signup'
     },
     {
       id: 'signup-3',
       question: '회원가입 시 필요한 정보는 무엇인가요?',
       answer: '기본 정보(이름, 이메일, 비밀번호)와 함께, 리조트의 경우 회사명과 주소, 크루의 경우 개인정보가 필요합니다. 모든 정보는 안전하게 보호됩니다.',
       category: 'signup'
     },
     {
       id: 'signup-4',
       question: '회원가입 후 바로 이용할 수 있나요?',
       answer: '네, 회원가입 완료 후 바로 모든 서비스를 이용하실 수 있습니다. 이메일 인증이나 추가 승인 절차는 없습니다.',
       category: 'signup'
     },
     {
       id: 'signup-5',
       question: '회원 정보를 변경하고 싶어요',
       answer: '마이페이지의 "프로필 설정"에서 언제든지 개인정보를 수정할 수 있습니다. 변경사항은 즉시 반영됩니다.',
       category: 'signup'
     },

         // 기숙사 관련
     {
       id: 'accommodation-1',
       question: '기숙사 정보는 어떻게 등록하나요?',
       answer: '리조트로 로그인 후 대시보드에서 "기숙사 정보 관리" 메뉴를 통해 기숙사 정보를 등록할 수 있습니다. 기숙사 유형, 시설, 가격, 이미지 등을 상세히 입력해주세요.',
       category: 'accommodation'
     },
     {
       id: 'accommodation-2',
       question: '기숙사 정보를 등록하면 어떤 장점이 있나요?',
       answer: '기숙사 정보를 등록하면 크루 지원률이 3배 높아집니다! 크루들이 기숙사 정보를 미리 확인하고 안전하게 근무할 수 있어서 더 많은 지원을 받을 수 있습니다.',
       category: 'accommodation'
     },
     {
       id: 'accommodation-3',
       question: '기숙사 정보는 언제든 수정할 수 있나요?',
       answer: '네, 언제든지 수정 가능합니다. 대시보드의 기숙사 정보 관리에서 정보를 업데이트할 수 있으며, 변경사항은 즉시 반영됩니다.',
       category: 'accommodation'
     },
     {
       id: 'accommodation-4',
       question: '기숙사 정보를 비공개로 설정할 수 있나요?',
       answer: '네, 기숙사 정보 등록 시 공개/비공개 설정을 선택할 수 있습니다. 비공개로 설정하면 크루들에게 정보가 보이지 않습니다.',
       category: 'accommodation'
     },
     {
       id: 'accommodation-5',
       question: '기숙사 이미지는 몇 장까지 등록할 수 있나요?',
       answer: '기숙사당 최대 10장까지 이미지를 등록할 수 있습니다. 다양한 각도에서 촬영한 사진을 등록하면 크루들이 더 잘 이해할 수 있습니다.',
       category: 'accommodation'
     },
     {
       id: 'accommodation-6',
       question: '기숙사 정보를 삭제하고 싶어요',
       answer: '대시보드의 기숙사 정보 관리에서 삭제할 수 있습니다. 삭제 시 복구가 불가능하니 신중하게 결정해주세요.',
       category: 'accommodation'
     },

         // 지원/채용 관련
     {
       id: 'application-1',
       question: '일자리에 지원하는 방법은 무엇인가요?',
       answer: '원하는 일자리를 찾은 후 "지원하기" 버튼을 클릭하여 지원서를 작성하세요. 개인정보, 경력사항, 희망근무조건 등을 입력하면 됩니다.',
       category: 'application'
     },
     {
       id: 'application-2',
       question: '지원서는 언제까지 수정할 수 있나요?',
       answer: '리조트에서 검토하기 전까지는 언제든지 수정 가능합니다. 마이페이지의 "내 지원서"에서 수정할 수 있습니다.',
       category: 'application'
     },
     {
       id: 'application-3',
       question: '지원 결과는 어떻게 확인하나요?',
       answer: '지원 결과는 이메일과 앱 내 알림으로 받을 수 있습니다. 마이페이지에서도 지원 현황을 실시간으로 확인할 수 있습니다.',
       category: 'application'
     },
     {
       id: 'application-4',
       question: '한 번에 여러 일자리에 지원할 수 있나요?',
       answer: '네, 원하는 만큼 여러 일자리에 동시에 지원할 수 있습니다. 각 지원은 독립적으로 관리되며, 서로 영향을 주지 않습니다.',
       category: 'application'
     },
     {
       id: 'application-5',
       question: '지원을 취소하고 싶어요',
       answer: '마이페이지의 "내 지원서"에서 지원 취소가 가능합니다. 단, 리조트에서 이미 검토를 시작한 경우에는 취소가 제한될 수 있습니다.',
       category: 'application'
     },
     {
       id: 'application-6',
       question: '지원서 작성 시 어떤 정보가 필요한가요?',
       answer: '기본 개인정보, 경력사항, 희망근무조건, 자기소개서, 첨부파일(이력서, 포트폴리오 등)을 작성하시면 됩니다.',
       category: 'application'
     },
     {
       id: 'application-7',
       question: '리조트에서 지원자를 어떻게 선별하나요?',
       answer: '리조트는 지원자의 경력, 희망조건, 자기소개서 등을 종합적으로 검토하여 적합한 크루를 선별합니다. 기숙사 정보를 등록한 리조트가 우선적으로 검토됩니다.',
       category: 'application'
     },

                   // 결제/환불 관련
      {
        id: 'payment-1',
        question: '서비스 이용료는 어떻게 되나요?',
        answer: '현재 리조트바이트는 서비스 테스트 기간을 겸하여 무료로 이용하실 수 있습니다. 정식 서비스 출시 후에는 이용료 정책이 변경될 수 있으며, 사전에 공지드리겠습니다.',
        category: 'payment'
      },
     {
       id: 'payment-2',
       question: '환불 정책은 어떻게 되나요?',
       answer: '서비스 이용 중 문제가 발생한 경우, 고객센터로 문의해주시면 검토 후 적절한 조치를 취해드립니다.',
       category: 'payment'
     },
     {
       id: 'payment-3',
       question: '프리미엄 서비스는 무엇인가요?',
       answer: '프리미엄 서비스는 우선 노출, 상세 분석 리포트, 맞춤형 매칭 등 고급 기능을 제공합니다. 정식 서비스 출시 시 상세 안내를 드리겠습니다.',
       category: 'payment'
     },
     {
       id: 'payment-4',
       question: '결제 방법은 어떤 것이 있나요?',
       answer: '신용카드, 계좌이체, 간편결제(카카오페이, 네이버페이 등)를 지원할 예정입니다. 정식 서비스 출시 시 구체적인 결제 방법을 안내드리겠습니다.',
       category: 'payment'
     },

         // 개인정보/보안 관련
     {
       id: 'privacy-1',
       question: '개인정보는 안전하게 보호되나요?',
       answer: '네, 모든 개인정보는 암호화되어 안전하게 보호됩니다. 개인정보처리방침을 준수하여 최소한의 정보만 수집하고 있습니다.',
       category: 'privacy'
     },
     {
       id: 'privacy-2',
       question: '회원탈퇴는 어떻게 하나요?',
       answer: '마이페이지의 설정에서 회원탈퇴를 진행할 수 있습니다. 탈퇴 시 모든 개인정보가 완전히 삭제됩니다.',
       category: 'privacy'
     },
     {
       id: 'privacy-3',
       question: '개인정보처리방침은 어디서 확인할 수 있나요?',
       answer: '홈페이지 하단의 "개인정보처리방침" 링크에서 자세한 내용을 확인할 수 있습니다.',
       category: 'privacy'
     },
     {
       id: 'privacy-4',
       question: '비밀번호를 변경하고 싶어요',
       answer: '마이페이지의 "보안 설정"에서 언제든지 비밀번호를 변경할 수 있습니다. 안전한 비밀번호 사용을 권장합니다.',
       category: 'privacy'
     },
     {
       id: 'privacy-5',
       question: '내 정보가 다른 사용자에게 보이나요?',
       answer: '개인정보는 본인과 해당 리조트(지원 시)에게만 제공됩니다. 다른 사용자에게는 노출되지 않습니다.',
       category: 'privacy'
     },

         // 기술적 문제
     {
       id: 'technical-1',
       question: '로그인이 안 될 때는 어떻게 하나요?',
       answer: '비밀번호를 잊어버린 경우 "비밀번호 찾기"를 이용하거나, 계속 문제가 발생하면 고객센터로 문의해주세요.',
       category: 'technical'
     },
     {
       id: 'technical-2',
       question: '사이트가 느리거나 오류가 발생할 때는?',
       answer: '브라우저 캐시를 삭제하거나 다른 브라우저로 접속해보세요. 지속적인 문제는 고객센터로 문의해주시면 도움을 드립니다.',
       category: 'technical'
     },
     {
       id: 'technical-3',
       question: '모바일에서도 이용할 수 있나요?',
       answer: '네, 모바일 브라우저에서도 모든 기능을 이용할 수 있습니다. 반응형 웹으로 제작되어 모바일에 최적화되어 있습니다.',
       category: 'technical'
     },
     {
       id: 'technical-4',
       question: '이미지 업로드가 안 될 때는?',
       answer: '이미지 크기는 10MB 이하, JPG, PNG, GIF 형식을 지원합니다. 파일 크기나 형식을 확인해보세요.',
       category: 'technical'
     },
     {
       id: 'technical-5',
       question: '알림을 받지 못하고 있어요',
       answer: '브라우저의 알림 권한을 확인해주세요. 설정에서 알림을 차단한 경우 알림을 받을 수 없습니다.',
       category: 'technical'
     },
     {
       id: 'technical-6',
       question: '지원하는 브라우저는 무엇인가요?',
       answer: 'Chrome, Firefox, Safari, Edge 등 최신 브라우저를 지원합니다. Internet Explorer는 지원하지 않습니다.',
       category: 'technical'
     }
  ];

  const categories = [
    { id: 'all', name: '전체', count: faqData.length },
    { id: 'signup', name: '회원가입', count: faqData.filter(item => item.category === 'signup').length },
    { id: 'accommodation', name: '기숙사', count: faqData.filter(item => item.category === 'accommodation').length },
    { id: 'application', name: '지원/채용', count: faqData.filter(item => item.category === 'application').length },
    { id: 'payment', name: '결제/환불', count: faqData.filter(item => item.category === 'payment').length },
    { id: 'privacy', name: '개인정보', count: faqData.filter(item => item.category === 'privacy').length },
    { id: 'technical', name: '기술지원', count: faqData.filter(item => item.category === 'technical').length }
  ];

  const filteredFAQ = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };



  const handleSuggestionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSuggestionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, type, title, content } = suggestionForm;
    const subject = type === 'question' ? '궁금한 점 문의' : '서비스 제안';
    const mailtoLink = `mailto:support@resortbyte.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`이름: ${name}\n이메일: ${email}\n유형: ${type === 'question' ? '궁금한 점' : '서비스 제안'}\n제목: ${title}\n\n내용:\n${content}`)}`;
    window.location.href = mailtoLink;
  };

  const handleGuideClick = (guideType: string) => {
    setSelectedGuide(guideType);
    setShowGuideModal(true);
  };

  const getGuideContent = (guideType: string) => {
    switch (guideType) {
      case 'resort':
        return {
          title: '리조트 등록 가이드',
          steps: [
            {
              step: 1,
              title: '회원가입',
              description: '홈페이지에서 "리조트 시작" 버튼을 클릭하여 회원가입을 진행합니다.',
              details: '• 기본 정보 입력 (이름, 이메일, 비밀번호)\n• 회사명과 주소 정보 입력\n• 약관 동의 후 가입 완료'
            },
            {
              step: 2,
              title: '회사 정보 등록',
              description: '대시보드에서 회사 소개, 복리후생, 회사 이미지 등을 등록합니다.',
              details: '• 회사 소개글 작성\n• 복리후생 정보 입력\n• 회사 이미지 업로드 (최대 10장)'
            },
            {
              step: 3,
              title: '기숙사 정보 등록',
              description: '기숙사 정보를 상세히 등록하여 크루 지원률을 높입니다.',
              details: '• 기숙사 유형 선택 (1인실, 2인실, 4인실 등)\n• 시설 정보 입력 (화장실, 주방, 세탁기 등)\n• 월세/관리비 정보 입력\n• 기숙사 이미지 업로드\n• 공개/비공개 설정'
            },
            {
              step: 4,
              title: '일자리 공고 등록',
              description: '모집할 일자리 정보를 등록합니다.',
              details: '• 직종 및 업무 내용 입력\n• 근무 조건 (시급, 근무시간, 근무일)\n• 자격 요건 및 우대사항\n• 근무지 주소 및 교통편'
            }
          ],
          tips: [
            '기숙사 정보를 등록하면 크루 지원률이 3배 높아집니다!',
            '상세한 회사 소개와 이미지를 등록하면 크루들이 더 신뢰합니다.',
            '정확한 근무 조건을 명시하면 지원자와의 매칭률이 높아집니다.'
          ]
        };
      case 'crew':
        return {
          title: '크루 지원 가이드',
          steps: [
            {
              step: 1,
              title: '회원가입',
              description: '홈페이지에서 "크루 시작" 버튼을 클릭하여 회원가입을 진행합니다.',
              details: '• 기본 정보 입력 (이름, 이메일, 비밀번호)\n• 개인정보 입력\n• 약관 동의 후 가입 완료'
            },
            {
              step: 2,
              title: '프로필 작성',
              description: '마이페이지에서 개인 프로필을 작성합니다.',
              details: '• 경력사항 입력\n• 희망근무조건 설정\n• 자기소개서 작성\n• 이력서/포트폴리오 첨부'
            },
            {
              step: 3,
              title: '일자리 검색',
              description: '홈페이지에서 원하는 일자리를 검색합니다.',
              details: '• 지역, 직종, 근무조건으로 필터링\n• 기숙사 정보 확인\n• 리조트 정보 및 후기 확인'
            },
            {
              step: 4,
              title: '지원서 작성 및 제출',
              description: '원하는 일자리에 지원서를 작성하여 제출합니다.',
              details: '• 개인정보 확인\n• 경력사항 및 자기소개서 작성\n• 희망근무조건 재확인\n• 지원서 제출'
            },
            {
              step: 5,
              title: '지원 결과 확인',
              description: '지원 결과를 확인하고 다음 단계를 진행합니다.',
              details: '• 이메일 및 앱 내 알림 확인\n• 마이페이지에서 지원 현황 확인\n• 합격 시 근무 일정 조율'
            }
          ],
          tips: [
            '기숙사 정보가 있는 리조트를 우선적으로 고려해보세요.',
            '정확한 희망근무조건을 설정하면 매칭률이 높아집니다.',
            '상세한 자기소개서를 작성하면 합격 확률이 높아집니다.'
          ]
        };
      case 'accommodation':
        return {
          title: '기숙사 등록 가이드',
          steps: [
            {
              step: 1,
              title: '기숙사 정보 입력',
              description: '대시보드의 "기숙사 정보 관리"에서 기본 정보를 입력합니다.',
              details: '• 기숙사명 및 주소 입력\n• 기숙사 유형 선택 (1인실, 2인실, 4인실 등)\n• 수용 인원 및 현재 거주자 수 입력'
            },
            {
              step: 2,
              title: '시설 정보 등록',
              description: '기숙사 내 시설 정보를 상세히 등록합니다.',
              details: '• 화장실 (개별/공용)\n• 주방 시설 (전자레인지, 냉장고, 가스레인지)\n• 세탁 시설 (세탁기, 건조기)\n• 인터넷/WiFi\n• 주차 시설'
            },
            {
              step: 3,
              title: '비용 정보 입력',
              description: '기숙사 이용 비용을 명확히 입력합니다.',
              details: '• 월세 금액\n• 관리비 (전기, 수도, 가스, 인터넷)\n• 보증금\n• 입주비용'
            },
            {
              step: 4,
              title: '이미지 업로드',
              description: '기숙사 내외부 사진을 업로드합니다.',
              details: '• 외관 사진\n• 내부 시설 사진 (각 유형별)\n• 공용 시설 사진\n• 주변 환경 사진\n• 최대 10장까지 업로드 가능'
            },
            {
              step: 5,
              title: '공개 설정',
              description: '기숙사 정보의 공개 여부를 설정합니다.',
              details: '• 공개: 모든 크루에게 정보 표시\n• 비공개: 크루에게 정보 숨김\n• 언제든지 설정 변경 가능'
            }
          ],
          tips: [
            '기숙사 정보를 등록하면 크루 지원률이 3배 높아집니다!',
            '정확하고 상세한 정보를 입력하면 크루들의 신뢰도가 높아집니다.',
            '다양한 각도에서 촬영한 사진을 등록하면 크루들이 더 잘 이해할 수 있습니다.',
            '정기적으로 정보를 업데이트하여 최신 상태를 유지하세요.'
          ]
        };
      default:
        return { title: '', steps: [], tips: [] };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            자주 묻는 질문
          </h1>
          <p className="text-xl text-gray-600">
            리조트바이트 이용에 궁금한 점을 찾아보세요
          </p>
        </div>

        {/* 카테고리 필터 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-resort-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* FAQ 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredFAQ.map((item) => (
            <div key={item.id} className="border-b border-gray-100 last:border-b-0">
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <span className="font-medium text-gray-900 pr-4">
                  {item.question}
                </span>
                {openItems.includes(item.id) ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openItems.includes(item.id) && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

                 {/* 추가 문의 섹션 */}
         <div className="mt-12 bg-gradient-to-r from-resort-50 to-blue-50 rounded-xl p-8">
           <div className="text-center mb-6">
             <h2 className="text-2xl font-bold text-gray-900 mb-4">
               더 궁금한 점이 있으신가요?
             </h2>
             <p className="text-gray-600">
               FAQ에서 답을 찾지 못하셨다면 언제든 문의해주세요
             </p>
           </div>

                                                                       {!showSuggestionForm ? (
               <div className="flex flex-wrap gap-4 justify-center">
                 <button
                   onClick={() => setShowSuggestionForm(true)}
                   className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                 >
                   <MessageCircle className="w-4 h-4 mr-2" />
                   궁금한 점과 제안
                 </button>
               </div>
                          ) : (
              <form onSubmit={handleSuggestionSubmit} className="max-w-2xl mx-auto bg-white rounded-lg p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="suggestion-name" className="block text-sm font-medium text-gray-700 mb-1">
                      이름 *
                    </label>
                    <input
                      type="text"
                      id="suggestion-name"
                      name="name"
                      value={suggestionForm.name}
                      onChange={handleSuggestionInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                  <div>
                    <label htmlFor="suggestion-email" className="block text-sm font-medium text-gray-700 mb-1">
                      답변받을 이메일 *
                    </label>
                    <input
                      type="email"
                      id="suggestion-email"
                      name="email"
                      value={suggestionForm.email}
                      onChange={handleSuggestionInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="이메일을 입력하세요"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="suggestion-type" className="block text-sm font-medium text-gray-700 mb-1">
                    유형 *
                  </label>
                  <select
                    id="suggestion-type"
                    name="type"
                    value={suggestionForm.type}
                    onChange={handleSuggestionInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="question">궁금한 점</option>
                    <option value="suggestion">서비스 제안</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="suggestion-title" className="block text-sm font-medium text-gray-700 mb-1">
                    제목 *
                  </label>
                  <input
                    type="text"
                    id="suggestion-title"
                    name="title"
                    value={suggestionForm.title}
                    onChange={handleSuggestionInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="제목을 입력하세요"
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="suggestion-content" className="block text-sm font-medium text-gray-700 mb-1">
                    내용 *
                  </label>
                  <textarea
                    id="suggestion-content"
                    name="content"
                    value={suggestionForm.content}
                    onChange={handleSuggestionInputChange}
                    required
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="궁금한 점이나 제안사항을 자세히 입력해주세요"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowSuggestionForm(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    보내기
                  </button>
                </div>
              </form>
            )}
         </div>

        {/* 빠른 가이드 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-resort-100 rounded-lg flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6 text-resort-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              리조트 등록 가이드
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              리조트 등록부터 기숙사 정보 입력까지 단계별로 안내해드립니다.
            </p>
                         <button 
               onClick={() => handleGuideClick('resort')}
               className="text-resort-600 text-sm font-medium hover:text-resort-700"
             >
               가이드 보기 →
             </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              크루 지원 가이드
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              일자리 찾기부터 지원서 작성까지 상세한 가이드를 제공합니다.
            </p>
                         <button 
               onClick={() => handleGuideClick('crew')}
               className="text-green-600 text-sm font-medium hover:text-green-700"
             >
               가이드 보기 →
             </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              기숙사 등록 가이드
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              기숙사 정보 등록 방법과 효과적인 운영 팁을 알려드립니다.
            </p>
                         <button 
               onClick={() => handleGuideClick('accommodation')}
               className="text-purple-600 text-sm font-medium hover:text-purple-700"
             >
               가이드 보기 →
             </button>
          </div>
                 </div>

         {/* 가이드 모달 */}
         {showGuideModal && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
               <div className="p-6 border-b border-gray-200">
                 <div className="flex items-center justify-between">
                   <h2 className="text-2xl font-bold text-gray-900">
                     {getGuideContent(selectedGuide).title}
                   </h2>
                   <button
                     onClick={() => setShowGuideModal(false)}
                     className="text-gray-400 hover:text-gray-600 transition-colors"
                   >
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </button>
                 </div>
               </div>
               
               <div className="p-6">
                 <div className="space-y-8">
                   {/* 단계별 가이드 */}
                   <div>
                     <h3 className="text-xl font-semibold text-gray-900 mb-6">단계별 가이드</h3>
                     <div className="space-y-6">
                       {getGuideContent(selectedGuide).steps.map((step, index) => (
                         <div key={index} className="flex gap-4">
                           <div className="flex-shrink-0 w-8 h-8 bg-resort-500 text-white rounded-full flex items-center justify-center font-semibold">
                             {step.step}
                           </div>
                           <div className="flex-1">
                             <h4 className="text-lg font-medium text-gray-900 mb-2">{step.title}</h4>
                             <p className="text-gray-600 mb-3">{step.description}</p>
                             <div className="bg-gray-50 rounded-lg p-4">
                               <p className="text-sm text-gray-700 whitespace-pre-line">{step.details}</p>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>

                   {/* 유용한 팁 */}
                   <div>
                     <h3 className="text-xl font-semibold text-gray-900 mb-4">유용한 팁</h3>
                     <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                       <ul className="space-y-2">
                         {getGuideContent(selectedGuide).tips.map((tip, index) => (
                           <li key={index} className="flex items-start gap-2">
                             <span className="text-yellow-600 mt-1">💡</span>
                             <span className="text-gray-700">{tip}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="p-6 border-t border-gray-200 bg-gray-50">
                 <div className="flex justify-end">
                   <button
                     onClick={() => setShowGuideModal(false)}
                     className="px-6 py-2 bg-resort-500 text-white rounded-lg hover:bg-resort-600 transition-colors"
                   >
                     확인
                   </button>
                 </div>
               </div>
             </div>
           </div>
         )}
       </div>
     </div>
   );
 };

export default FAQ;

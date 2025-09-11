import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UsefulLink } from '../types';

export const addSampleLinks = async () => {
  const sampleLinks: any[] = [
    {
      title: '리조트 취업 가이드',
      url: 'https://example.com/resort-job-guide',
      description: '리조트 업계 취업을 위한 완벽한 가이드와 팁을 제공합니다.',
      category: 'job_tips',
      status: 'active',
      tags: ['취업', '리조트', '가이드', '팁'],
      clickCount: 0,
      isRecommended: true,
      addedBy: 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      title: '리조트 생활 블로그',
      url: 'https://example.com/resort-life-blog',
      description: '리조트에서 일하는 사람들의 생생한 경험담과 생활 이야기',
      category: 'blog',
      status: 'active',
      tags: ['리조트', '생활', '경험담', '블로그'],
      clickCount: 0,
      isRecommended: true,
      addedBy: 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      title: '리조트 직원 커뮤니티',
      url: 'https://example.com/resort-community',
      description: '리조트 직원들이 모여 정보를 공유하고 소통하는 커뮤니티',
      category: 'cafe',
      status: 'active',
      tags: ['커뮤니티', '소통', '정보공유', '리조트'],
      clickCount: 0,
      isRecommended: true,
      addedBy: 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      title: '제주 리조트 정보',
      url: 'https://example.com/jeju-resort-info',
      description: '제주도 리조트들의 상세 정보와 리뷰를 확인할 수 있습니다.',
      category: 'resort_info',
      status: 'active',
      tags: ['제주', '리조트', '정보', '리뷰'],
      clickCount: 0,
      isRecommended: false,
      addedBy: 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      title: '리조트 숙박 가이드',
      url: 'https://example.com/resort-accommodation',
      description: '리조트 근무자들을 위한 숙박 시설 정보와 추천',
      category: 'accommodation',
      status: 'active',
      tags: ['숙박', '기숙사', '리조트', '추천'],
      clickCount: 0,
      isRecommended: false,
      addedBy: 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      title: '리조트 생활 꿀팁',
      url: 'https://example.com/resort-life-tips',
      description: '리조트에서 생활하면서 알아두면 좋은 실용적인 팁들',
      category: 'lifestyle',
      status: 'active',
      tags: ['생활', '꿀팁', '리조트', '실용'],
      clickCount: 0,
      isRecommended: false,
      addedBy: 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      title: '리조트 업계 뉴스',
      url: 'https://example.com/resort-news',
      description: '리조트 업계의 최신 뉴스와 트렌드를 확인하세요',
      category: 'resort_info',
      status: 'active',
      tags: ['뉴스', '트렌드', '업계', '리조트'],
      clickCount: 0,
      isRecommended: false,
      addedBy: 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      title: '리조트 면접 준비',
      url: 'https://example.com/resort-interview',
      description: '리조트 면접을 위한 체크리스트와 예상 질문들',
      category: 'job_tips',
      status: 'active',
      tags: ['면접', '준비', '체크리스트', '질문'],
      clickCount: 0,
      isRecommended: false,
      addedBy: 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ];

  try {
    console.log('샘플 링크 데이터 추가 시작...');
    
    for (const link of sampleLinks) {
      await addDoc(collection(db, 'usefulLinks'), link);
      console.log('링크 추가됨:', link.title);
    }
    
    console.log('모든 샘플 링크 데이터가 성공적으로 추가되었습니다.');
    return { success: true, message: '샘플 링크가 추가되었습니다.' };
  } catch (error) {
    console.error('샘플 링크 추가 실패:', error);
    return { success: false, message: '샘플 링크 추가에 실패했습니다.' };
  }
};

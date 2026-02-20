export type GreetingCategory = 'formal' | 'casual' | 'seasonal' | 'religious' | 'humorous';

export interface GreetingExample {
  text: string;
  category: GreetingCategory;
}

export const GREETING_EXAMPLES: GreetingExample[] = [
  // 격식 (4)
  {
    text: '평생을 함께할 반려자를 만났습니다.\n저희 두 사람이 사랑과 믿음으로\n한 가정을 이루게 되었습니다.\n오셔서 축복해 주시면 감사하겠습니다.',
    category: 'formal',
  },
  {
    text: '서로가 마주보며 다져온 사랑을\n이제 함께 한 곳을 바라보며\n걸어갈 수 있는 큰 사랑으로 키우고자 합니다.\n저희 두 사람의 앞날을 축복해 주십시오.',
    category: 'formal',
  },
  {
    text: '두 사람이 사랑으로 만나\n진실과 이해로 하나를 이루어\n믿음과 신의로 가정을 이루려 합니다.\n오셔서 두 사람의 앞날을 축복해 주십시오.',
    category: 'formal',
  },
  {
    text: '살아가면서 서로에게 기댈 수 있는\n가장 편안한 사람을 만났습니다.\n함께하는 첫걸음에 소중한 분들을 모시고 싶습니다.\n부디 오셔서 축복해 주십시오.',
    category: 'formal',
  },

  // 캐주얼 (4)
  {
    text: '좋은 사람을 만났습니다.\n함께라면 어디든 갈 수 있을 것 같은,\n그런 사람입니다.\n저희의 시작을 함께 축하해 주세요.',
    category: 'casual',
  },
  {
    text: '오래 기다려온 순간이 왔습니다.\n서로의 손을 잡고\n같은 길을 걸어가기로 했습니다.\n따뜻한 마음으로 함께해 주세요.',
    category: 'casual',
  },
  {
    text: '웃을 때도, 울 때도\n곁에 있어 주고 싶은 사람을 만났습니다.\n저희 두 사람의 새 출발을\n가까이서 축하해 주시면 감사하겠습니다.',
    category: 'casual',
  },
  {
    text: '매일이 설레는 사람을 만났습니다.\n이 설렘을 평생 함께하려 합니다.\n소중한 분들과 기쁨을 나누고 싶습니다.',
    category: 'casual',
  },

  // 계절 (4)
  {
    text: '봄꽃이 피어나듯\n저희 두 사람의 사랑도\n아름답게 피어나려 합니다.\n따스한 봄날, 함께 축복해 주세요.',
    category: 'seasonal',
  },
  {
    text: '여름의 싱그러운 햇살처럼\n눈부신 사랑을 시작합니다.\n저희의 새로운 계절에\n함께해 주시면 감사하겠습니다.',
    category: 'seasonal',
  },
  {
    text: '가을의 깊어가는 하늘 아래\n서로에게 한 걸음 더 가까이 다가가\n평생을 약속하려 합니다.\n고운 단풍처럼 물드는 저희의 시작을 함께해 주세요.',
    category: 'seasonal',
  },
  {
    text: '하얀 눈처럼 순수한 마음으로\n서로를 아끼며 살겠습니다.\n겨울의 따뜻한 이야기가 되어줄\n저희의 시작에 함께해 주세요.',
    category: 'seasonal',
  },

  // 종교 (3)
  {
    text: '하나님의 은혜 속에서 만난 두 사람이\n주님의 사랑 안에서 하나 되려 합니다.\n축복으로 함께해 주시면 감사하겠습니다.',
    category: 'religious',
  },
  {
    text: '부처님의 자비로운 인연으로 만나\n서로를 비추는 등불이 되어\n한 길을 걸어가고자 합니다.\n귀한 걸음으로 축하해 주세요.',
    category: 'religious',
  },
  {
    text: '하느님 앞에서 영원한 사랑을 약속하는\n거룩한 혼배 미사에 여러분을 초대합니다.\n함께 기도해 주시면 감사하겠습니다.',
    category: 'religious',
  },

  // 유머 (2)
  {
    text: '드디어 결혼합니다.\n믿기지 않으시죠? 저희도요.\n그래도 확실한 건, 함께라서 행복하다는 겁니다.\n와서 직접 확인해 주세요!',
    category: 'humorous',
  },
  {
    text: '연애 때는 몰랐는데\n이 사람 없이는 밥이 안 넘어갑니다.\n평생 같이 밥 먹기로 했습니다.\n맛있는 식사와 함께 축하해 주세요!',
    category: 'humorous',
  },
];

/** 기존 컴포넌트 드롭인 대체용 flat 배열 */
export const GREETING_EXAMPLE_TEXTS = GREETING_EXAMPLES.map((e) => e.text);

import type { AnimalId, EvolutionStage, ShopItem } from "./types";

/** 1바퀴 = 1 마일리지 (학교 운동장 기준) */
export const MILEAGE_PER_LAP = 1;

/** 진화는 누적 마일리지 50마다 1단계 */
export const EVOLUTION_STEP = 50;

export interface AnimalDef {
  id: AnimalId;
  name: string;
  stages: [string, string, string];
  colors: {
    body: string;
    belly: string;
    accent: string;
    dark: string;
  };
}

export const ANIMALS: AnimalDef[] = [
  {
    id: "dog",
    name: "강아지",
    stages: ["보송한 강아지", "용감한 강아지", "늠름한 강아지"],
    colors: { body: "#E8B07A", belly: "#FFF6EA", accent: "#C4844A", dark: "#5C3B2E" },
  },
  {
    id: "cat",
    name: "고양이",
    stages: ["말랑한 아기고양이", "살금 고양이", "우아한 고양이"],
    colors: { body: "#F3C7A5", belly: "#FFF9F4", accent: "#E7A0C4", dark: "#4A342C" },
  },
  {
    id: "rabbit",
    name: "토끼",
    stages: ["쫑긋 아기토끼", "깡총 토끼", "별빛 토끼"],
    colors: { body: "#F7F3EE", belly: "#FFE4EE", accent: "#F3B7C8", dark: "#6A4E46" },
  },
  {
    id: "hamster",
    name: "햄스터",
    stages: ["통통 아기햄스터", "야무진 햄스터", "황금 햄스터"],
    colors: { body: "#F0C56E", belly: "#FFF3D4", accent: "#E39A45", dark: "#5A3B28" },
  },
  {
    id: "hedgehog",
    name: "고슴도치",
    stages: ["콩알 아기고슴도치", "반짝 고슴도치", "용기 고슴도치"],
    colors: { body: "#F2D2B8", belly: "#FFF8F2", accent: "#A67C52", dark: "#5C4030" },
  },
  {
    id: "lizard",
    name: "도마뱀",
    stages: ["꼬물 아기도마뱀", "재빠른 도마뱀", "신비한 도마뱀"],
    colors: { body: "#7DCEA0", belly: "#E9F8EF", accent: "#2E8B57", dark: "#1E4D36" },
  },
  {
    id: "capybara",
    name: "카피바라",
    stages: ["몽실 아기카피바라", "느긋한 카피바라", "포근한 카피바라"],
    colors: { body: "#C4A574", belly: "#F3E6CF", accent: "#8D6B43", dark: "#4E3928" },
  },
  {
    id: "panda",
    name: "판다",
    stages: ["둥실 아기판다", "복실 판다", "행복 판다"],
    colors: { body: "#F7F7F7", belly: "#FFFFFF", accent: "#2C2C2C", dark: "#1A1A1A" },
  },
  {
    id: "fox",
    name: "여우",
    stages: ["살금 아기여우", "영리한 여우", "달빛 여우"],
    colors: { body: "#E8873A", belly: "#FFF4EA", accent: "#F6C9A4", dark: "#5C3317" },
  },
  {
    id: "penguin",
    name: "펭귄",
    stages: ["뒤뚱 아기펭귄", "씩씩한 펭귄", "왕관 펭귄"],
    colors: { body: "#2F3E50", belly: "#F7F7F7", accent: "#F2C14E", dark: "#1B2836" },
  },
];

export const ANIMAL_IDS = ANIMALS.map((animal) => animal.id);

export function isAnimalId(value: unknown): value is AnimalId {
  return typeof value === "string" && ANIMAL_IDS.includes(value as AnimalId);
}

export function getAnimal(id: AnimalId) {
  return ANIMALS.find((animal) => animal.id === id) ?? ANIMALS[0];
}

export function stageFromMileage(mileage: number): EvolutionStage {
  if (mileage >= EVOLUTION_STEP * 2) return 3;
  if (mileage >= EVOLUTION_STEP) return 2;
  return 1;
}

export function stageName(animal: AnimalId, stage: EvolutionStage) {
  return getAnimal(animal).stages[stage - 1];
}

export function nextEvolutionAt(mileage: number): number | null {
  const stage = stageFromMileage(mileage);
  if (stage === 3) return null;
  return stage * EVOLUTION_STEP;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "cloth-scarf-yellow",
    category: "clothes",
    name: "노란 목도리",
    price: 6,
    blurb: "목을 포근하게 감싸 주는 머플러",
    emoji: "🧣",
    colors: { primary: "#F4C95D", secondary: "#E09F3E" },
  },
  {
    id: "cloth-ribbon-red",
    category: "clothes",
    name: "빨간 리본",
    price: 8,
    blurb: "머리에 다는 동그란 리본",
    emoji: "🎀",
    colors: { primary: "#E85D75", secondary: "#F7B2C1" },
  },
  {
    id: "cloth-hood-blue",
    category: "clothes",
    name: "파란 후드",
    price: 12,
    blurb: "귀가 쏙 들어가는 후드티",
    emoji: "🧢",
    colors: { primary: "#4C78D0", secondary: "#D6E2FF" },
  },
  {
    id: "cloth-cape-star",
    category: "clothes",
    name: "별 망토",
    price: 16,
    blurb: "달리면 별이 따라오는 망토",
    emoji: "✨",
    colors: { primary: "#5C4DDB", secondary: "#F4E27A" },
  },
  {
    id: "cloth-vest-flower",
    category: "clothes",
    name: "꽃무늬 조끼",
    price: 10,
    blurb: "작은 꽃이 수놓인 조끼",
    emoji: "🌸",
    colors: { primary: "#F4A7C5", secondary: "#7BC67E" },
  },
  {
    id: "cloth-scarf-rainbow",
    category: "clothes",
    name: "무지개 스카프",
    price: 9,
    blurb: "일곱 빛깔이 도는 스카프",
    emoji: "🌈",
    colors: { primary: "#7BDFF2", secondary: "#F2C14E" },
  },
  {
    id: "cloth-crown",
    category: "clothes",
    name: "작은 왕관",
    price: 20,
    blurb: "운동장 왕자의 작은 왕관",
    emoji: "👑",
    colors: { primary: "#F2C14E", secondary: "#E07A3D" },
  },
  {
    id: "cloth-sunglasses",
    category: "clothes",
    name: "동글 선글라스",
    price: 7,
    blurb: "햇살 러닝용 선글라스",
    emoji: "🕶️",
    colors: { primary: "#2B2B2B", secondary: "#7EC8E3" },
  },
  {
    id: "cloth-hat-flower",
    category: "clothes",
    name: "꽃 모자",
    price: 11,
    blurb: "데이지 한 송이가 달린 모자",
    emoji: "👒",
    colors: { primary: "#F7E7B4", secondary: "#F28B82" },
  },
  {
    id: "cloth-vest-check",
    category: "clothes",
    name: "체크 조끼",
    price: 13,
    blurb: "초록 체크무늬 러닝 조끼",
    emoji: "🟩",
    colors: { primary: "#2F9E8F", secondary: "#F4F7F2" },
  },
  {
    id: "food-carrot",
    category: "food",
    name: "당근 한 줌",
    price: 4,
    blurb: "아삭한 당근 세 개",
    emoji: "🥕",
    colors: { primary: "#F08A3E" },
  },
  {
    id: "food-salmon",
    category: "food",
    name: "연어 한 토막",
    price: 8,
    blurb: "촉촉한 연어 살코기",
    emoji: "🐟",
    colors: { primary: "#F07A7A" },
  },
  {
    id: "food-apple",
    category: "food",
    name: "빨간 사과",
    price: 4,
    blurb: "한 입 크기 사과",
    emoji: "🍎",
    colors: { primary: "#E4574D" },
  },
  {
    id: "food-sweet-potato",
    category: "food",
    name: "구운 고구마",
    price: 5,
    blurb: "따뜻하게 구운 고구마",
    emoji: "🍠",
    colors: { primary: "#D9894B" },
  },
  {
    id: "food-milk",
    category: "food",
    name: "따뜻한 우유",
    price: 6,
    blurb: "한 잔의 따뜻한 우유",
    emoji: "🥛",
    colors: { primary: "#F7F3EA" },
  },
  {
    id: "food-fish",
    category: "food",
    name: "생선구이",
    price: 9,
    blurb: "노릇하게 구운 생선",
    emoji: "🍤",
    colors: { primary: "#E8A87C" },
  },
  {
    id: "food-lettuce",
    category: "food",
    name: "상추 샐러드",
    price: 4,
    blurb: "싱싱한 잎채소",
    emoji: "🥬",
    colors: { primary: "#7BC67E" },
  },
  {
    id: "food-banana",
    category: "food",
    name: "바나나",
    price: 5,
    blurb: "달콤한 바나나 한 개",
    emoji: "🍌",
    colors: { primary: "#F2D15A" },
  },
  {
    id: "food-cheese",
    category: "food",
    name: "치즈 한 장",
    price: 7,
    blurb: "노란 슬라이스 치즈",
    emoji: "🧀",
    colors: { primary: "#F2C14E" },
  },
  {
    id: "food-chicken",
    category: "food",
    name: "닭가슴살",
    price: 8,
    blurb: "담백한 단백질 한 접시",
    emoji: "🍗",
    colors: { primary: "#E7B08A" },
  },
  {
    id: "snack-jelly",
    category: "snack",
    name: "딸기 젤리",
    price: 5,
    blurb: "말랑한 딸기 젤리",
    emoji: "🍓",
    colors: { primary: "#F2849B" },
  },
  {
    id: "snack-biscuit",
    category: "snack",
    name: "버터 비스킷",
    price: 5,
    blurb: "바삭한 버터 비스킷",
    emoji: "🍪",
    colors: { primary: "#E6C48A" },
  },
  {
    id: "snack-cake",
    category: "snack",
    name: "딸기 케이크",
    price: 12,
    blurb: "생크림 딸기 케이크 한 조각",
    emoji: "🍰",
    colors: { primary: "#F7C1D0" },
  },
  {
    id: "snack-icecream",
    category: "snack",
    name: "바닐라 아이스크림",
    price: 8,
    blurb: "녹기 전에 주는 아이스크림",
    emoji: "🍦",
    colors: { primary: "#F7F1E3" },
  },
  {
    id: "snack-macaron",
    category: "snack",
    name: "마카롱",
    price: 9,
    blurb: "파스텔 마카롱 두 개",
    emoji: "🧁",
    colors: { primary: "#E7B7D8" },
  },
  {
    id: "snack-cookie",
    category: "snack",
    name: "초코칩 쿠키",
    price: 6,
    blurb: "초코칩이 박힌 쿠키",
    emoji: "🍫",
    colors: { primary: "#C48A54" },
  },
  {
    id: "snack-pudding",
    category: "snack",
    name: "바나나 푸딩",
    price: 7,
    blurb: "부드러운 바나나 푸딩",
    emoji: "🍮",
    colors: { primary: "#F2D27A" },
  },
  {
    id: "snack-candy",
    category: "snack",
    name: "과일 사탕",
    price: 4,
    blurb: "알록달록 과일 사탕",
    emoji: "🍬",
    colors: { primary: "#F28B82" },
  },
  {
    id: "snack-honey",
    category: "snack",
    name: "꿀떡",
    price: 6,
    blurb: "달콤한 꿀이 든 떡",
    emoji: "🍯",
    colors: { primary: "#F2B84B" },
  },
  {
    id: "offer-porridge",
    category: "food",
    name: "따뜻한 죽",
    price: 5,
    blurb: "한 그릇의 부드러운 죽",
    emoji: "🍚",
    settleId: "food-sweet-potato",
    colors: { primary: "#F6E7C1" },
  },
  {
    id: "offer-egg",
    category: "food",
    name: "달걀 프라이",
    price: 4,
    blurb: "노른자가 반짝이는 달걀",
    emoji: "🍳",
    settleId: "food-carrot",
    colors: { primary: "#F2C14E" },
  },
  {
    id: "offer-corn",
    category: "food",
    name: "삶은 옥수수",
    price: 4,
    blurb: "노란 알이 톡톡한 옥수수",
    emoji: "🌽",
    settleId: "food-apple",
    colors: { primary: "#F2D15A" },
  },
  {
    id: "offer-blueberry",
    category: "food",
    name: "블루베리",
    price: 6,
    blurb: "새콤한 블루베리 한 줌",
    emoji: "🫐",
    settleId: "food-milk",
    colors: { primary: "#6C63C6" },
  },
  {
    id: "offer-soup",
    category: "food",
    name: "따뜻한 국",
    price: 5,
    blurb: "김이 모락모락 나는 국",
    emoji: "🥣",
    settleId: "food-banana",
    colors: { primary: "#E7C89A" },
  },
  {
    id: "offer-tofu",
    category: "food",
    name: "고소한 두부",
    price: 7,
    blurb: "부드럽고 고소한 한 모",
    emoji: "🫘",
    settleId: "food-cheese",
    colors: { primary: "#F4E6C8" },
  },
  {
    id: "offer-chestnut",
    category: "food",
    name: "군밤",
    price: 8,
    blurb: "따뜻하게 구운 밤",
    emoji: "🌰",
    settleId: "food-chicken",
    colors: { primary: "#A56B3C" },
  },
  {
    id: "offer-watermelon",
    category: "food",
    name: "수박 한 조각",
    price: 4,
    blurb: "시원한 수박",
    emoji: "🍉",
    settleId: "food-lettuce",
    colors: { primary: "#E85D75" },
  },
  {
    id: "offer-donut",
    category: "snack",
    name: "설탕 도넛",
    price: 5,
    blurb: "동그란 설탕 도넛",
    emoji: "🍩",
    settleId: "snack-jelly",
    colors: { primary: "#E7B08A" },
  },
  {
    id: "offer-popcorn",
    category: "snack",
    name: "팝콘",
    price: 5,
    blurb: "바삭한 팝콘 한 봉지",
    emoji: "🍿",
    settleId: "snack-biscuit",
    colors: { primary: "#F6E3A1" },
  },
  {
    id: "offer-bun",
    category: "snack",
    name: "따뜻한 찐빵",
    price: 6,
    blurb: "김이 나는 찐빵",
    emoji: "🥟",
    settleId: "snack-cookie",
    colors: { primary: "#F3D2A2" },
  },
  {
    id: "offer-tangerine",
    category: "snack",
    name: "겨울 귤",
    price: 4,
    blurb: "새콤달콤한 귤 두 개",
    emoji: "🍊",
    settleId: "snack-candy",
    colors: { primary: "#F08A3E" },
  },
  {
    id: "offer-hotteok",
    category: "snack",
    name: "꿀 호떡",
    price: 6,
    blurb: "꿀이 졸졸 나오는 호떡",
    emoji: "🥞",
    settleId: "snack-honey",
    colors: { primary: "#E6B15A" },
  },
  {
    id: "offer-choco-milk",
    category: "snack",
    name: "초코 우유",
    price: 7,
    blurb: "달콤한 초코 우유 한 잔",
    emoji: "🍫",
    settleId: "snack-pudding",
    colors: { primary: "#C48A54" },
  },
  {
    id: "care-pet",
    category: "care",
    name: "쓰다듬기",
    price: 4,
    blurb: "머리를 살살 쓰다듬어 주기",
    emoji: "🤲",
    settleId: "snack-candy",
    colors: { primary: "#F7C1D0" },
  },
  {
    id: "care-walk",
    category: "care",
    name: "산책하기",
    price: 5,
    blurb: "운동장 한 켠을 함께 걷기",
    emoji: "🚶",
    settleId: "snack-biscuit",
    colors: { primary: "#8FCB9B" },
  },
  {
    id: "care-bath",
    category: "care",
    name: "씻기기",
    price: 5,
    blurb: "거품으로 깨끗이 씻기기",
    emoji: "🫧",
    settleId: "snack-jelly",
    colors: { primary: "#B7E4F2" },
  },
  {
    id: "care-brush",
    category: "care",
    name: "빗질하기",
    price: 6,
    blurb: "털을 살살 빗어 주기",
    emoji: "🪮",
    settleId: "snack-cookie",
    colors: { primary: "#F2D7A1" },
  },
  {
    id: "care-hug",
    category: "care",
    name: "안아주기",
    price: 6,
    blurb: "꼭 안아 주기",
    emoji: "🤗",
    settleId: "snack-honey",
    colors: { primary: "#F4A7C5" },
  },
  {
    id: "care-play",
    category: "care",
    name: "같이 놀기",
    price: 7,
    blurb: "공놀이로 함께 뛰어놀기",
    emoji: "🎾",
    settleId: "snack-pudding",
    colors: { primary: "#C6E27A" },
  },
  {
    id: "care-song",
    category: "care",
    name: "노래 불러주기",
    price: 9,
    blurb: "작은 노래를 들려주기",
    emoji: "🎵",
    settleId: "snack-macaron",
    colors: { primary: "#D7C4F2" },
  },
  {
    id: "care-blanket",
    category: "care",
    name: "이불 덮어주기",
    price: 8,
    blurb: "포근한 이불을 덮어 주기",
    emoji: "🛏️",
    settleId: "snack-icecream",
    colors: { primary: "#E7D7C4" },
  },
];

export function getItem(id: string | null | undefined) {
  if (!id) return undefined;
  return SHOP_ITEMS.find((item) => item.id === id);
}

export const CARE_GAIN = 18;

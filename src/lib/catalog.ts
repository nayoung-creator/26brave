import type { ShopItem } from "./types";

/** 1바퀴 = 1 마일리지 (학교 운동장 기준) */
export const MILEAGE_PER_LAP = 1;

export const SHOP_ITEMS: ShopItem[] = [
  // Faces
  {
    id: "face-basic-boy",
    category: "face",
    name: "기본 얼굴",
    price: 0,
    gender: "boy",
    colors: { primary: "#F6C79B", secondary: "#2B2B2B" },
    starter: true,
  },
  {
    id: "face-basic-girl",
    category: "face",
    name: "기본 얼굴",
    price: 0,
    gender: "girl",
    colors: { primary: "#F8C8A8", secondary: "#2B2B2B" },
    starter: true,
  },
  {
    id: "face-smile",
    category: "face",
    name: "활짝 미소",
    price: 8,
    gender: "any",
    colors: { primary: "#F4B183", secondary: "#E4572E" },
  },
  {
    id: "face-cool",
    category: "face",
    name: "멋진 표정",
    price: 12,
    gender: "any",
    colors: { primary: "#E8B089", secondary: "#1F6F8B" },
  },
  {
    id: "face-cheer",
    category: "face",
    name: "응원 표정",
    price: 15,
    gender: "any",
    colors: { primary: "#F2C6A0", secondary: "#F4A261" },
  },

  // Hair
  {
    id: "hair-short-boy",
    category: "hair",
    name: "단정 숏컷",
    price: 0,
    gender: "boy",
    colors: { primary: "#3A2A1F" },
    starter: true,
  },
  {
    id: "hair-bob-girl",
    category: "hair",
    name: "단발 보브",
    price: 0,
    gender: "girl",
    colors: { primary: "#4A3428" },
    starter: true,
  },
  {
    id: "hair-spiky",
    category: "hair",
    name: "스파이키",
    price: 10,
    gender: "boy",
    colors: { primary: "#1F1A17" },
  },
  {
    id: "hair-curl",
    category: "hair",
    name: "곱슬 머리",
    price: 10,
    gender: "girl",
    colors: { primary: "#6B3E26" },
  },
  {
    id: "hair-blue",
    category: "hair",
    name: "하늘빛 염색",
    price: 18,
    gender: "any",
    colors: { primary: "#3D8BDB" },
  },
  {
    id: "hair-orange",
    category: "hair",
    name: "햇살 오렌지",
    price: 20,
    gender: "any",
    colors: { primary: "#E07A3D" },
  },

  // Outfits
  {
    id: "outfit-pe-boy",
    category: "outfit",
    name: "체육복",
    price: 0,
    gender: "boy",
    colors: { primary: "#2F9E8F", secondary: "#FFFFFF" },
    starter: true,
  },
  {
    id: "outfit-pe-girl",
    category: "outfit",
    name: "체육복",
    price: 0,
    gender: "girl",
    colors: { primary: "#3AAFA9", secondary: "#FFFFFF" },
    starter: true,
  },
  {
    id: "outfit-hoodie",
    category: "outfit",
    name: "러닝 후디",
    price: 14,
    gender: "any",
    colors: { primary: "#E76F51", secondary: "#264653" },
  },
  {
    id: "outfit-track",
    category: "outfit",
    name: "트랙 수트",
    price: 18,
    gender: "any",
    colors: { primary: "#264653", secondary: "#2A9D8F" },
  },
  {
    id: "outfit-hero",
    category: "outfit",
    name: "히어로 저지",
    price: 25,
    gender: "any",
    colors: { primary: "#E9C46A", secondary: "#E76F51" },
  },

  // Shoes
  {
    id: "shoes-basic-boy",
    category: "shoes",
    name: "기본 운동화",
    price: 0,
    gender: "boy",
    colors: { primary: "#FFFFFF", secondary: "#2F9E8F" },
    starter: true,
  },
  {
    id: "shoes-basic-girl",
    category: "shoes",
    name: "기본 운동화",
    price: 0,
    gender: "girl",
    colors: { primary: "#FFFFFF", secondary: "#3AAFA9" },
    starter: true,
  },
  {
    id: "shoes-speed",
    category: "shoes",
    name: "스피드 러너",
    price: 12,
    gender: "any",
    colors: { primary: "#E76F51", secondary: "#264653" },
  },
  {
    id: "shoes-cloud",
    category: "shoes",
    name: "구름 스니커",
    price: 16,
    gender: "any",
    colors: { primary: "#A8DADC", secondary: "#457B9D" },
  },
  {
    id: "shoes-gold",
    category: "shoes",
    name: "골든 트랙",
    price: 22,
    gender: "any",
    colors: { primary: "#E9C46A", secondary: "#1D3557" },
  },
];

export function starterItemsForGender(gender: "boy" | "girl") {
  return SHOP_ITEMS.filter(
    (item) =>
      item.starter &&
      (item.gender === gender || item.gender === "any"),
  );
}

export function getItem(id: string) {
  return SHOP_ITEMS.find((item) => item.id === id);
}

export function defaultEquipped(gender: "boy" | "girl") {
  const starters = starterItemsForGender(gender);
  const pick = (category: ShopItem["category"]) =>
    starters.find((item) => item.category === category)!.id;

  return {
    face: pick("face"),
    hair: pick("hair"),
    outfit: pick("outfit"),
    shoes: pick("shoes"),
  };
}

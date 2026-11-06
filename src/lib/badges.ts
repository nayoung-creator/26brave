import type { CompanionView, EvolutionStage, PublicUser } from "./types";

export type BadgeMotif = "lap" | "mileage" | "meal" | "snack" | "care" | "full" | "joy";

export interface GrowthBadge {
  id: string;
  name: string;
  detail: string;
  image: string;
  motif?: BadgeMotif;
  /** When set, the badge shows this stage of the friend's animal. */
  animalStage?: EvolutionStage;
  isEarned: (user: PublicUser) => boolean;
}

export function accountMileage(user: PublicUser) {
  return user.mileage + (user.mileageEver ?? 0);
}

/** Badge progress belongs to one growth friend, not the whole account. */
export function badgeStatsFor(user: PublicUser, friend?: CompanionView | null): PublicUser {
  if (friend) {
    return {
      ...user,
      animal: friend.animal,
      animalLabel: friend.animalLabel,
      stage: friend.stage,
      stageName: friend.stageName,
      totalLaps: friend.laps ?? 0,
      mileage: friend.mileage,
      fullness: friend.fullness,
      happiness: friend.happiness,
      mealsFed: friend.mealsFed,
      snacksFed: friend.snacksFed,
      caresFed: friend.caresFed,
      wasFull: friend.fullness >= 100,
      wasHappy: friend.happiness >= 100,
      mileageEver: 0,
      mealsEver: 0,
      snacksEver: 0,
      caresEver: 0,
    };
  }
  return {
    ...user,
    totalLaps: user.companionLaps ?? user.totalLaps,
    wasFull: user.fullness >= 100,
    wasHappy: user.happiness >= 100,
    mileageEver: 0,
    mealsEver: 0,
    snacksEver: 0,
    caresEver: 0,
  };
}

export const GROWTH_BADGES: GrowthBadge[] = [
  {
    id: "first-step",
    name: "첫 발걸음",
    detail: "이 친구와 1바퀴",
    image: "/badges/badge-first-step.jpg",
    isEarned: (user) => user.totalLaps >= 1,
  },
  {
    id: "explorer",
    name: "운동장 탐험가",
    detail: "이 친구와 10바퀴",
    image: "/badges/badge-explorer.jpg",
    isEarned: (user) => user.totalLaps >= 10,
  },
  {
    id: "runner",
    name: "꾸준한 러너",
    detail: "이 친구와 30바퀴",
    image: "/badges/badge-runner.jpg",
    animalStage: 1,
    isEarned: (user) => user.totalLaps >= 30,
  },
  {
    id: "mileage-seed",
    name: "마일리지 씨앗",
    detail: "이 친구 20 마일리지",
    image: "/badges/badge-mileage-seed.jpg",
    isEarned: (user) => user.mileage >= 20,
  },
  {
    id: "first-evolve",
    name: "첫 진화",
    detail: "이 친구 50 마일리지",
    image: "/badges/badge-first-evolve.jpg",
    animalStage: 2,
    isEarned: (user) => user.mileage >= 50,
  },
  {
    id: "full-evolve",
    name: "완전 진화",
    detail: "이 친구 100 마일리지",
    image: "/badges/badge-full-evolve.jpg",
    animalStage: 3,
    isEarned: (user) => user.mileage >= 100,
  },
  {
    id: "first-meal",
    name: "첫 먹이",
    detail: "먹이 1회",
    image: "/badges/badge-first-meal.jpg",
    isEarned: (user) => user.mealsFed >= 1,
  },
  {
    id: "meals",
    name: "밥 잘 주는 친구",
    detail: "먹이 3회",
    image: "/badges/badge-meals.jpg",
    isEarned: (user) => user.mealsFed >= 3,
  },
  {
    id: "feast",
    name: "든든한 밥상",
    detail: "먹이 6회",
    image: "/badges/badge-feast.jpg",
    isEarned: (user) => user.mealsFed >= 6,
  },
  {
    id: "first-snack",
    name: "첫 간식",
    detail: "간식 1회",
    image: "/badges/badge-first-snack.jpg",
    isEarned: (user) => user.snacksFed >= 1,
  },
  {
    id: "snack",
    name: "간식 요정",
    detail: "간식 3회",
    image: "/badges/badge-snack.jpg",
    isEarned: (user) => user.snacksFed >= 3,
  },
  {
    id: "kind",
    name: "다정한 친구",
    detail: "간식 6회",
    image: "/badges/badge-kind.jpg",
    isEarned: (user) => user.snacksFed >= 6,
  },
  {
    id: "first-care",
    name: "첫 돌봄",
    detail: "돌봄 1회",
    image: "/badges/badge-first-care.jpg",
    isEarned: (user) => (user.caresFed ?? 0) >= 1,
  },
  {
    id: "care",
    name: "살뜰한 돌봄",
    detail: "돌봄 5회",
    image: "/badges/badge-care.jpg",
    isEarned: (user) => (user.caresFed ?? 0) >= 5,
  },
  {
    id: "full-belly",
    name: "배부른 친구",
    detail: "포만감 100",
    image: "/badges/badge-full-belly.jpg",
    isEarned: (user) => user.fullness >= 100,
  },
  {
    id: "full-joy",
    name: "행복한 친구",
    detail: "행복지수 100",
    image: "/badges/badge-full-joy.jpg",
    isEarned: (user) => user.happiness >= 100,
  },
];

export function growthBadgesFor(user: PublicUser) {
  return GROWTH_BADGES.map((badge) => ({
    ...badge,
    earned: badge.isEarned(user),
  }));
}

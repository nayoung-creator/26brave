import type { EvolutionStage, PublicUser } from "./types";

export type BadgeMotif = "lap" | "mileage" | "meal" | "snack" | "care" | "full" | "joy";

export interface GrowthBadge {
  id: string;
  name: string;
  detail: string;
  image: string;
  motif?: BadgeMotif;
  /** When set, the badge shows this stage of the signed-in account's animal. */
  animalStage?: EvolutionStage;
  isEarned: (user: PublicUser) => boolean;
}

function everMileage(user: PublicUser) {
  return user.mileage + (user.mileageEver ?? 0);
}

function everMeals(user: PublicUser) {
  return user.mealsFed + (user.mealsEver ?? 0);
}

function everSnacks(user: PublicUser) {
  return user.snacksFed + (user.snacksEver ?? 0);
}

function everCares(user: PublicUser) {
  return (user.caresFed ?? 0) + (user.caresEver ?? 0);
}

export const GROWTH_BADGES: GrowthBadge[] = [
  {
    id: "first-step",
    name: "첫 발걸음",
    detail: "누적 1바퀴",
    image: "/badges/badge-first-step.jpg",
    isEarned: (user) => user.totalLaps >= 1,
  },
  {
    id: "explorer",
    name: "운동장 탐험가",
    detail: "누적 10바퀴",
    image: "/badges/badge-explorer.jpg",
    isEarned: (user) => user.totalLaps >= 10,
  },
  {
    id: "runner",
    name: "꾸준한 러너",
    detail: "누적 30바퀴",
    image: "/badges/badge-runner.jpg",
    animalStage: 1,
    isEarned: (user) => user.totalLaps >= 30,
  },
  {
    id: "mileage-seed",
    name: "마일리지 씨앗",
    detail: "누적 20 마일리지",
    image: "",
    motif: "mileage",
    isEarned: (user) => everMileage(user) >= 20,
  },
  {
    id: "first-evolve",
    name: "첫 진화",
    detail: "누적 50 마일리지",
    image: "/badges/badge-first-evolve.jpg",
    animalStage: 2,
    isEarned: (user) => everMileage(user) >= 50,
  },
  {
    id: "full-evolve",
    name: "완전 진화",
    detail: "누적 100 마일리지",
    image: "/badges/badge-full-evolve.jpg",
    animalStage: 3,
    isEarned: (user) => everMileage(user) >= 100,
  },
  {
    id: "first-meal",
    name: "첫 먹이",
    detail: "먹이 1회",
    image: "",
    motif: "meal",
    isEarned: (user) => everMeals(user) >= 1,
  },
  {
    id: "meals",
    name: "밥 잘 주는 친구",
    detail: "먹이 3회",
    image: "/badges/badge-meals.jpg",
    isEarned: (user) => everMeals(user) >= 3,
  },
  {
    id: "feast",
    name: "든든한 밥상",
    detail: "먹이 6회",
    image: "",
    motif: "meal",
    isEarned: (user) => everMeals(user) >= 6,
  },
  {
    id: "first-snack",
    name: "첫 간식",
    detail: "간식 1회",
    image: "",
    motif: "snack",
    isEarned: (user) => everSnacks(user) >= 1,
  },
  {
    id: "snack",
    name: "간식 요정",
    detail: "간식 3회",
    image: "/badges/badge-snack.jpg",
    isEarned: (user) => everSnacks(user) >= 3,
  },
  {
    id: "kind",
    name: "다정한 친구",
    detail: "간식 6회",
    image: "/badges/badge-kind.jpg",
    isEarned: (user) => everSnacks(user) >= 6,
  },
  {
    id: "first-care",
    name: "첫 돌봄",
    detail: "돌봄 1회",
    image: "",
    motif: "care",
    isEarned: (user) => everCares(user) >= 1,
  },
  {
    id: "care",
    name: "살뜰한 돌봄",
    detail: "돌봄 3회",
    image: "",
    motif: "care",
    isEarned: (user) => everCares(user) >= 3,
  },
  {
    id: "full-belly",
    name: "배부른 친구",
    detail: "포만감 100",
    image: "",
    motif: "full",
    isEarned: (user) => user.wasFull === true || user.fullness >= 100,
  },
  {
    id: "full-joy",
    name: "행복한 친구",
    detail: "행복지수 100",
    image: "",
    motif: "joy",
    isEarned: (user) => user.wasHappy === true || user.happiness >= 100,
  },
];

export function growthBadgesFor(user: PublicUser) {
  return GROWTH_BADGES.map((badge) => ({
    ...badge,
    earned: badge.isEarned(user),
  }));
}

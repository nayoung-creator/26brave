import type { PublicUser } from "./types";

export interface GrowthBadge {
  id: string;
  name: string;
  detail: string;
  image: string;
  isEarned: (user: PublicUser) => boolean;
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
    isEarned: (user) => user.totalLaps >= 30,
  },
  {
    id: "first-evolve",
    name: "첫 진화",
    detail: "누적 50 마일리지",
    image: "/badges/badge-first-evolve.jpg",
    isEarned: (user) => user.mileage >= 50,
  },
  {
    id: "full-evolve",
    name: "완전 진화",
    detail: "누적 100 마일리지",
    image: "/badges/badge-full-evolve.jpg",
    isEarned: (user) => user.mileage >= 100,
  },
  {
    id: "meals",
    name: "밥 잘 주는 친구",
    detail: "먹이 3회",
    image: "/badges/badge-meals.jpg",
    isEarned: (user) => user.mealsFed >= 3,
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
    detail: "간식·돌봄 6회",
    image: "/badges/badge-kind.jpg",
    isEarned: (user) => user.snacksFed >= 6,
  },
];

export function growthBadgesFor(user: PublicUser) {
  return GROWTH_BADGES.map((badge) => ({
    ...badge,
    earned: badge.isEarned(user),
  }));
}

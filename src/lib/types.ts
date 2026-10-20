export type Role = "participant" | "admin";

export type Grade =
  | "유치원"
  | "1학년"
  | "2학년"
  | "3학년"
  | "4학년"
  | "5학년"
  | "6학년"
  | "교직원";

export type AnimalId =
  | "dog"
  | "cat"
  | "rabbit"
  | "hamster"
  | "hedgehog"
  | "lizard"
  | "capybara"
  | "panda"
  | "fox"
  | "penguin";

export type EvolutionStage = 1 | 2 | 3;

export type ItemCategory = "clothes" | "food" | "snack";

export interface ShopItem {
  id: string;
  category: ItemCategory;
  name: string;
  price: number;
  blurb: string;
  emoji: string;
  colors: {
    primary: string;
    secondary?: string;
  };
}

export interface LapRecord {
  id: string;
  userId: string;
  laps: number;
  mileage: number;
  recordedAt: string;
  note?: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  passwordPlain: string;
  role: Role;
  grade: Grade;
  animal: AnimalId;
  mileage: number;
  spentMileage: number;
  ownedClothesIds: string[];
  equippedClothesId: string | null;
  fullness: number;
  happiness: number;
  mealsFed: number;
  snacksFed: number;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
}

export interface Database {
  users: User[];
  sessions: Session[];
  laps: LapRecord[];
}

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  grade: Grade;
  animal: AnimalId;
  animalLabel: string;
  stage: EvolutionStage;
  stageName: string;
  mileage: number;
  spentMileage: number;
  availableMileage: number;
  ownedClothesIds: string[];
  equippedClothesId: string | null;
  fullness: number;
  happiness: number;
  mealsFed: number;
  snacksFed: number;
  createdAt: string;
  todayLaps: number;
  monthLaps: number;
  totalLaps: number;
  nextEvolutionAt: number | null;
}

export interface AdminUserView extends PublicUser {
  passwordPlain: string;
}

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

export type Gender = "boy" | "girl";

export type ItemCategory = "face" | "hair" | "outfit" | "shoes";

export interface ShopItem {
  id: string;
  category: ItemCategory;
  name: string;
  price: number;
  gender: Gender | "any";
  colors: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
  starter?: boolean;
}

export interface EquippedItems {
  face: string;
  hair: string;
  outfit: string;
  shoes: string;
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
  gender: Gender;
  mileage: number;
  spentMileage: number;
  ownedItemIds: string[];
  equipped: EquippedItems;
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
  gender: Gender;
  mileage: number;
  spentMileage: number;
  availableMileage: number;
  ownedItemIds: string[];
  equipped: EquippedItems;
  createdAt: string;
  todayLaps: number;
  monthLaps: number;
  totalLaps: number;
}

export interface AdminUserView extends PublicUser {
  passwordPlain: string;
}

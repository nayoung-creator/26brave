import { getCurrentUser, jsonError, toPublicUser } from "@/lib/auth";
import { CARE_GAIN, SHOP_ITEMS, getItem } from "@/lib/catalog";
import { updateDb } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("로그인이 필요합니다.", 401);
  return Response.json({
    items: SHOP_ITEMS,
    user: await toPublicUser(user),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("로그인이 필요합니다.", 401);

  const body = await req.json();
  const action = String(body.action ?? "");
  const itemId = String(body.itemId ?? "");
  const item = getItem(itemId);

  try {
    if (action === "buy") {
      if (!item || item.category !== "clothes") {
        return jsonError("옷만 보관할 수 있습니다.");
      }
      const { result } = await updateDb((db) => {
        const target = db.users.find((u) => u.id === user.id);
        if (!target) throw new Error("USER_NOT_FOUND");
        if (target.ownedClothesIds.includes(itemId)) throw new Error("ALREADY_OWNED");
        const available = target.mileage - target.spentMileage;
        if (available < item.price) throw new Error("NOT_ENOUGH");
        target.spentMileage += item.price;
        target.ownedClothesIds.push(itemId);
        target.equippedClothesId = itemId;
        return target;
      });
      return Response.json({ user: await toPublicUser(result) });
    }

    if (action === "equip") {
      if (!item || item.category !== "clothes") {
        return jsonError("옷만 입힐 수 있습니다.");
      }
      const { result } = await updateDb((db) => {
        const target = db.users.find((u) => u.id === user.id);
        if (!target) throw new Error("USER_NOT_FOUND");
        if (!target.ownedClothesIds.includes(itemId)) throw new Error("NOT_OWNED");
        target.equippedClothesId =
          target.equippedClothesId === itemId ? null : itemId;
        return target;
      });
      return Response.json({ user: await toPublicUser(result) });
    }

    if (action === "feed") {
      if (!item || (item.category !== "food" && item.category !== "snack")) {
        return jsonError("먹이 또는 간식만 줄 수 있습니다.");
      }
      const { result } = await updateDb((db) => {
        const target = db.users.find((u) => u.id === user.id);
        if (!target) throw new Error("USER_NOT_FOUND");
        const available = target.mileage - target.spentMileage;
        if (available < item.price) throw new Error("NOT_ENOUGH");
        target.spentMileage += item.price;
        if (item.category === "food") {
          target.fullness = Math.min(100, target.fullness + CARE_GAIN);
          target.mealsFed += 1;
        } else {
          target.happiness = Math.min(100, target.happiness + CARE_GAIN);
          target.snacksFed += 1;
        }
        return target;
      });
      return Response.json({ user: await toPublicUser(result) });
    }

    return jsonError("알 수 없는 요청입니다.");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ALREADY_OWNED") {
        return jsonError("이미 가지고 있는 옷입니다.");
      }
      if (error.message === "NOT_ENOUGH") {
        return jsonError("마일리지가 부족합니다. 운동장을 더 달려 보세요!");
      }
      if (error.message === "NOT_OWNED") {
        return jsonError("아직 구매하지 않은 옷입니다.");
      }
    }
    return jsonError("상점 처리에 실패했습니다.", 500);
  }
}

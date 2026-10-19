import { getCurrentUser, jsonError, toPublicUser } from "@/lib/auth";
import { SHOP_ITEMS, getItem } from "@/lib/catalog";
import { updateDb } from "@/lib/store";
import type { ItemCategory } from "@/lib/types";

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

  try {
    if (action === "buy") {
      const itemId = String(body.itemId ?? "");
      const item = getItem(itemId);
      if (!item) return jsonError("아이템을 찾을 수 없습니다.");
      if (item.gender !== "any" && item.gender !== user.gender) {
        return jsonError("내 성별에 맞는 아이템만 구매할 수 있습니다.");
      }

      const { result } = await updateDb((db) => {
        const target = db.users.find((u) => u.id === user.id);
        if (!target) throw new Error("USER_NOT_FOUND");
        if (target.ownedItemIds.includes(itemId)) {
          throw new Error("ALREADY_OWNED");
        }
        const available = target.mileage - target.spentMileage;
        if (available < item.price) throw new Error("NOT_ENOUGH");
        target.spentMileage += item.price;
        target.ownedItemIds.push(itemId);
        return target;
      });
      return Response.json({ user: await toPublicUser(result) });
    }

    if (action === "equip") {
      const category = body.category as ItemCategory;
      const itemId = String(body.itemId ?? "");
      const item = getItem(itemId);
      if (!item || item.category !== category) {
        return jsonError("잘못된 아이템입니다.");
      }

      const { result } = await updateDb((db) => {
        const target = db.users.find((u) => u.id === user.id);
        if (!target) throw new Error("USER_NOT_FOUND");
        if (!target.ownedItemIds.includes(itemId)) {
          throw new Error("NOT_OWNED");
        }
        target.equipped[category] = itemId;
        return target;
      });
      return Response.json({ user: await toPublicUser(result) });
    }

    if (action === "setGender") {
      const gender = body.gender === "girl" ? "girl" : "boy";
      const { result } = await updateDb((db) => {
        const target = db.users.find((u) => u.id === user.id);
        if (!target) throw new Error("USER_NOT_FOUND");
        target.gender = gender;
        return target;
      });
      return Response.json({ user: await toPublicUser(result) });
    }

    return jsonError("알 수 없는 요청입니다.");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ALREADY_OWNED") {
        return jsonError("이미 보유한 아이템입니다.");
      }
      if (error.message === "NOT_ENOUGH") {
        return jsonError("마일리지가 부족합니다. 운동장 바퀴를 더 달려 보세요!");
      }
      if (error.message === "NOT_OWNED") {
        return jsonError("보유하지 않은 아이템입니다.");
      }
    }
    return jsonError("상점 처리에 실패했습니다.", 500);
  }
}

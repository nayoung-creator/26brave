export function GrowthBadgeImage({
  src,
  name,
  earned,
  size,
}: {
  src: string;
  name: string;
  earned: boolean;
  size: "header" | "card";
}) {
  const frame =
    size === "header"
      ? "h-9 w-9 md:h-12 md:w-12"
      : "mx-auto h-24 w-24 sm:h-28 sm:w-28";
  return (
    <img
      src={src}
      alt={size === "header" ? name : ""}
      title={`${name}${earned ? "" : " · 도전 중"}`}
      width={size === "header" ? 48 : 112}
      height={size === "header" ? 48 : 112}
      draggable={false}
      className={`${frame} rounded-full object-cover shadow-sm ring-1 ring-[#ead7b8] ${
        earned ? "" : "grayscale"
      }`}
    />
  );
}

export function getPhotoTitle(title: string | null | undefined): string {
  const normalized = title?.trim();
  return normalized ? normalized : "未命名照片";
}

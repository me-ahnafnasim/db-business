import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";

const LAST_CLEANUP_KEY = "nobosole.images.last-cleanup.v1";
const DISK_CACHE_HOUSEKEEPING_MS = 30 * 24 * 60 * 60 * 1000;

export async function maintainImageDiskCache() {
  const now = Date.now();
  const lastCleanup = Number(await AsyncStorage.getItem(LAST_CLEANUP_KEY) || 0);
  if (lastCleanup > 0 && now - lastCleanup < DISK_CACHE_HOUSEKEEPING_MS) return;

  if (lastCleanup > 0) await Image.clearDiskCache();
  await AsyncStorage.setItem(LAST_CLEANUP_KEY, String(now));
}

export async function prefetchImages(urls) {
  const uniqueUrls = [...new Set((urls || []).filter((url) => /^https:\/\//.test(url)))];
  if (!uniqueUrls.length) return true;
  return Image.prefetch(uniqueUrls, "memory-disk");
}

export const imageCachePolicy = Object.freeze({
  diskHousekeepingMs: DISK_CACHE_HOUSEKEEPING_MS,
  cachePolicy: "memory-disk",
});

import { Platform } from "react-native";

let storage;

// SecureStore caps a single value at 2048 bytes. A Supabase session — access token, refresh
// token and the full user object — routinely exceeds that, and the platform's response is a
// console warning plus a value that "may not be stored successfully". The failure is silent
// and the symptom is remote: the user is signed out on every cold start.
//
// So values are split across numbered keys with a small header under the original key. The
// header is what makes reads unambiguous — without it there is no way to tell a chunked
// value from a short one that merely happens to start with a digit.
const CHUNK_LIMIT = 1800; // under 2048, leaving room for UTF-8 expansion at the split point
const CHUNK_HEADER = "__chunked__:";

// SecureStore keys must match [A-Za-z0-9._-]; Supabase's `sb-<ref>-auth-token` already does,
// and the suffix keeps to the same alphabet.
const chunkKey = (key, index) => `${key}.${index}`;

function byteLength(value) {
  // The 2048 limit is bytes, not characters. Bangla is 3 bytes per character in UTF-8, so
  // measuring length would under-count by a factor of three on the very locale that matters.
  return Buffer.byteLength(value, "utf8");
}

// Splits on BYTE budget while never cutting a character in half.
function splitByBytes(value, limit) {
  const parts = [];
  let current = "";
  let currentBytes = 0;
  for (const char of value) {
    const size = Buffer.byteLength(char, "utf8");
    if (currentBytes + size > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
    }
    current += char;
    currentBytes += size;
  }
  if (current) parts.push(current);
  return parts;
}

function getStorage() {
  if (storage) return storage;

  if (Platform.OS === "web") {
    storage = {
      getItem: (key) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
    };
  } else {
    const legacyStorage = require("@react-native-async-storage/async-storage").default;
    const SecureStore = require("expo-secure-store");

    async function clearChunks(key) {
      // Walks until the first gap. Chunks are always written contiguously from 0, so the
      // first miss is the end — no count needs to be trusted or stored twice.
      for (let index = 0; ; index += 1) {
        const part = await SecureStore.getItemAsync(chunkKey(key, index));
        if (part === null) return;
        await SecureStore.deleteItemAsync(chunkKey(key, index));
      }
    }

    storage = {
      async getItem(key) {
        const stored = await SecureStore.getItemAsync(key);

        if (stored !== null && stored.startsWith(CHUNK_HEADER)) {
          const count = Number(stored.slice(CHUNK_HEADER.length));
          const parts = [];
          for (let index = 0; index < count; index += 1) {
            const part = await SecureStore.getItemAsync(chunkKey(key, index));
            // A missing chunk means a half-written value; treat the whole thing as absent
            // rather than handing back a truncated session that will fail to parse.
            if (part === null) return null;
            parts.push(part);
          }
          return parts.join("");
        }

        if (stored !== null) return stored;

        // Preserve existing sessions during the first upgrade from AsyncStorage.
        const legacyValue = await legacyStorage.getItem(key);
        if (legacyValue !== null) {
          await this.setItem(key, legacyValue);
          await legacyStorage.removeItem(key);
        }
        return legacyValue;
      },

      async setItem(key, value) {
        // Always clear any previous chunks first: a value that shrinks below the limit would
        // otherwise leave orphans behind, and a shorter chunked value would leave a stale
        // tail that the next read would happily append.
        await clearChunks(key);

        if (byteLength(value) <= CHUNK_LIMIT) {
          await SecureStore.setItemAsync(key, value);
        } else {
          const parts = splitByBytes(value, CHUNK_LIMIT);
          for (let index = 0; index < parts.length; index += 1) {
            await SecureStore.setItemAsync(chunkKey(key, index), parts[index]);
          }
          // Header written last, so an interrupted write leaves no header and the read path
          // sees the key as absent rather than as a value with missing chunks.
          await SecureStore.setItemAsync(key, `${CHUNK_HEADER}${parts.length}`);
        }

        await legacyStorage.removeItem(key);
      },

      async removeItem(key) {
        await clearChunks(key);
        await Promise.all([
          SecureStore.deleteItemAsync(key),
          legacyStorage.removeItem(key),
        ]);
      },
    };
  }

  return storage;
}

export default getStorage;

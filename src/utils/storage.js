import { Platform } from "react-native";

let storage;

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

    storage = {
      async getItem(key) {
        const secureValue = await SecureStore.getItemAsync(key);
        if (secureValue !== null) return secureValue;

        // Preserve existing sessions during the first upgrade from AsyncStorage.
        const legacyValue = await legacyStorage.getItem(key);
        if (legacyValue !== null) {
          await SecureStore.setItemAsync(key, legacyValue);
          await legacyStorage.removeItem(key);
        }
        return legacyValue;
      },
      async setItem(key, value) {
        await SecureStore.setItemAsync(key, value);
        await legacyStorage.removeItem(key);
      },
      async removeItem(key) {
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

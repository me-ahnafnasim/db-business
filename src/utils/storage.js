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
    storage = require("@react-native-async-storage/async-storage").default;
  }

  return storage;
}

export default getStorage;

import { SafeAreaProvider } from "react-native-safe-area-context";

import MainTabs from "./src/screens/MainTabs";
import { ThemeProvider } from "./src/theme/ThemeProvider";

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MainTabs />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

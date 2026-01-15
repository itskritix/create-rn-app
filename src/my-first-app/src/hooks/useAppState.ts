import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

interface UseAppStateOptions {
  onForeground?: () => void;
  onBackground?: () => void;
}

export function useAppState(options?: UseAppStateOptions) {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const prevState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      // App came to foreground
      if (prevState.current.match(/inactive|background/) && nextState === "active") {
        options?.onForeground?.();
      }

      // App went to background
      if (prevState.current === "active" && nextState.match(/inactive|background/)) {
        options?.onBackground?.();
      }

      prevState.current = nextState;
      setAppState(nextState);
    });

    return () => subscription.remove();
  }, [options]);

  return {
    appState,
    isActive: appState === "active",
    isBackground: appState === "background",
    isInactive: appState === "inactive",
  };
}

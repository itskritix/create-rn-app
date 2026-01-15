import { useState, useEffect } from "react";
import Superwall from "@superwall/react-native-superwall";

export function useSuperwall() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const status = await Superwall.getSubscriptionStatus();
      setIsSubscribed(status === "active");
    } catch (error) {
      console.error("Subscription check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const showPaywall = async (placement: string = "default") => {
    try {
      await Superwall.register(placement);
      // Re-check subscription after paywall closes
      await checkSubscription();
    } catch (error) {
      console.error("Paywall error:", error);
    }
  };

  const restorePurchases = async () => {
    try {
      await Superwall.restorePurchases();
      await checkSubscription();
    } catch (error) {
      console.error("Restore failed:", error);
    }
  };

  return {
    isSubscribed,
    loading,
    showPaywall,
    restorePurchases,
    refresh: checkSubscription,
  };
}

import Superwall from "@superwall/react-native-superwall";

const SUPERWALL_API_KEY = "YOUR_SUPERWALL_API_KEY";

export async function initSuperwall() {
  await Superwall.configure(SUPERWALL_API_KEY);
}

export async function showPaywall(placementId: string = "default") {
  try {
    await Superwall.register(placementId);
  } catch (error) {
    console.error("Paywall error:", error);
  }
}

export async function checkSubscription(): Promise<boolean> {
  const status = await Superwall.getSubscriptionStatus();
  return status === "active";
}

export { Superwall };

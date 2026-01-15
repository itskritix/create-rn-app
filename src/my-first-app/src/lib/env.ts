import Constants from "expo-constants";

type Environment = "development" | "staging" | "production";

interface EnvConfig {
  API_URL: string;
  ENV: Environment;
  IS_DEV: boolean;
  IS_PROD: boolean;
}

function getEnvironment(): Environment {
  // Check Expo's release channel or app variant
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel;

  if (releaseChannel === "production" || releaseChannel === "prod") {
    return "production";
  }
  if (releaseChannel === "staging") {
    return "staging";
  }

  // Default to development
  return "development";
}

function getConfig(): EnvConfig {
  const ENV = getEnvironment();

  // Configure per environment
  const configs: Record<Environment, Omit<EnvConfig, "ENV" | "IS_DEV" | "IS_PROD">> = {
    development: {
      API_URL: "https://api.dev.example.com",
    },
    staging: {
      API_URL: "https://api.staging.example.com",
    },
    production: {
      API_URL: "https://api.example.com",
    },
  };

  return {
    ...configs[ENV],
    ENV,
    IS_DEV: ENV === "development",
    IS_PROD: ENV === "production",
  };
}

export const env = getConfig();

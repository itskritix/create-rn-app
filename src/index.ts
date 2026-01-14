#!/usr/bin/env node
import { program } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_REPO = "itskritix/react-native-template";

interface ProjectOptions {
  firebase: boolean;
  superwall: boolean;
}

async function main() {
  console.clear();

  p.intro(pc.bgCyan(pc.black(" create-rn-app ")));

  // Get project name
  const projectName = await p.text({
    message: "What is your project name?",
    placeholder: "my-app",
    validate: (value) => {
      if (!value) return "Project name is required";
      if (!/^[a-z0-9-_]+$/i.test(value))
        return "Project name can only contain letters, numbers, dashes and underscores";
      if (fs.existsSync(value)) return `Directory "${value}" already exists`;
      return undefined;
    },
  });

  if (p.isCancel(projectName)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  // Get options
  const options = await p.group(
    {
      firebase: () =>
        p.confirm({
          message: "Add Firebase? (Auth, Firestore, Analytics)",
          initialValue: false,
        }),
      superwall: () =>
        p.confirm({
          message: "Add Superwall? (Paywalls + In-App Purchases)",
          initialValue: false,
        }),
    },
    {
      onCancel: () => {
        p.cancel("Operation cancelled.");
        process.exit(0);
      },
    }
  );

  const s = p.spinner();

  // Step 1: Clone base template
  s.start("Cloning base template...");
  try {
    execSync(`npx degit ${TEMPLATE_REPO} ${projectName}`, { stdio: "pipe" });
    s.stop("Base template cloned");
  } catch (error) {
    s.stop("Failed to clone template");
    p.cancel("Could not clone template. Check your internet connection.");
    process.exit(1);
  }

  const projectPath = path.resolve(process.cwd(), projectName);

  // Step 2: Add Firebase if selected
  if (options.firebase) {
    s.start("Adding Firebase...");
    await addFirebase(projectPath);
    s.stop("Firebase added");
  }

  // Step 3: Add Superwall if selected
  if (options.superwall) {
    s.start("Adding Superwall...");
    await addSuperwall(projectPath);
    s.stop("Superwall added");
  }

  // Step 4: Update package.json with project name
  s.start("Configuring project...");
  await updatePackageJson(projectPath, projectName);
  await updateAppJson(projectPath, projectName);
  s.stop("Project configured");

  // Step 5: Install dependencies
  s.start("Installing dependencies...");
  try {
    execSync("pnpm install", { cwd: projectPath, stdio: "pipe" });
    s.stop("Dependencies installed");
  } catch {
    s.stop("Dependency installation failed");
    p.log.warn("Run 'pnpm install' manually in the project directory");
  }

  // Done!
  p.note(
    `cd ${projectName}\npnpm start`,
    "Next steps"
  );

  p.outro(pc.green("Happy coding! 🚀"));
}

async function addFirebase(projectPath: string) {
  // Add Firebase dependencies to package.json
  const pkgPath = path.join(projectPath, "package.json");
  const pkg = await fs.readJson(pkgPath);

  pkg.dependencies = {
    ...pkg.dependencies,
    "@react-native-firebase/app": "^21.6.1",
    "@react-native-firebase/auth": "^21.6.1",
    "@react-native-firebase/firestore": "^21.6.1",
    "@react-native-firebase/analytics": "^21.6.1",
  };

  await fs.writeJson(pkgPath, pkg, { spaces: 2 });

  // Create Firebase config file
  const firebaseConfig = `import { initializeApp, getApps } from "@react-native-firebase/app";

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

export function initFirebase() {
  if (getApps().length === 0) {
    initializeApp(firebaseConfig);
  }
}

export { firebaseConfig };
`;

  await fs.writeFile(
    path.join(projectPath, "src/lib/firebase.ts"),
    firebaseConfig
  );

  // Create Firebase auth hook
  const firebaseAuthHook = `import { useState, useEffect } from "react";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";

export function useFirebaseAuth() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    return auth().signInWithEmailAndPassword(email, password);
  };

  const signUp = async (email: string, password: string) => {
    return auth().createUserWithEmailAndPassword(email, password);
  };

  const signOut = async () => {
    return auth().signOut();
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };
}
`;

  await fs.writeFile(
    path.join(projectPath, "src/hooks/useFirebaseAuth.ts"),
    firebaseAuthHook
  );

  // Create Firestore hook
  const firestoreHook = `import firestore from "@react-native-firebase/firestore";

export function useFirestore() {
  const getDoc = async <T>(collection: string, docId: string): Promise<T | null> => {
    const doc = await firestore().collection(collection).doc(docId).get();
    return doc.exists ? (doc.data() as T) : null;
  };

  const setDoc = async <T extends object>(
    collection: string,
    docId: string,
    data: T
  ) => {
    await firestore().collection(collection).doc(docId).set(data);
  };

  const addDoc = async <T extends object>(collection: string, data: T) => {
    const ref = await firestore().collection(collection).add(data);
    return ref.id;
  };

  const deleteDoc = async (collection: string, docId: string) => {
    await firestore().collection(collection).doc(docId).delete();
  };

  const query = <T>(collection: string) => {
    return firestore().collection(collection) as FirebaseFirestoreTypes.CollectionReference<T>;
  };

  return { getDoc, setDoc, addDoc, deleteDoc, query };
}

import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
`;

  await fs.writeFile(
    path.join(projectPath, "src/hooks/useFirestore.ts"),
    firestoreHook
  );

  // Update app.json with Firebase plugin
  const appJsonPath = path.join(projectPath, "app.json");
  const appJson = await fs.readJson(appJsonPath);

  appJson.expo.plugins = [
    ...(appJson.expo.plugins || []),
    "@react-native-firebase/app",
    "@react-native-firebase/auth",
  ];

  await fs.writeJson(appJsonPath, appJson, { spaces: 2 });
}

async function addSuperwall(projectPath: string) {
  // Add Superwall dependencies
  const pkgPath = path.join(projectPath, "package.json");
  const pkg = await fs.readJson(pkgPath);

  pkg.dependencies = {
    ...pkg.dependencies,
    "@superwall/react-native-superwall": "^1.0.0",
  };

  await fs.writeJson(pkgPath, pkg, { spaces: 2 });

  // Create Superwall config
  const superwallConfig = `import Superwall from "@superwall/react-native-superwall";

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
`;

  await fs.writeFile(
    path.join(projectPath, "src/lib/superwall.ts"),
    superwallConfig
  );

  // Create Superwall hook
  const superwallHook = `import { useState, useEffect } from "react";
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
`;

  await fs.writeFile(
    path.join(projectPath, "src/hooks/useSuperwall.ts"),
    superwallHook
  );

  // Update app.json
  const appJsonPath = path.join(projectPath, "app.json");
  const appJson = await fs.readJson(appJsonPath);

  appJson.expo.plugins = [
    ...(appJson.expo.plugins || []),
    "@superwall/react-native-superwall",
  ];

  await fs.writeJson(appJsonPath, appJson, { spaces: 2 });
}

async function updatePackageJson(projectPath: string, projectName: string) {
  const pkgPath = path.join(projectPath, "package.json");
  const pkg = await fs.readJson(pkgPath);
  pkg.name = projectName;
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}

async function updateAppJson(projectPath: string, projectName: string) {
  const appJsonPath = path.join(projectPath, "app.json");
  const appJson = await fs.readJson(appJsonPath);

  const slug = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const bundleId = `com.yourcompany.${slug.replace(/-/g, "")}`;

  appJson.expo.name = projectName;
  appJson.expo.slug = slug;
  appJson.expo.scheme = slug;
  appJson.expo.ios.bundleIdentifier = bundleId;
  appJson.expo.android.package = bundleId;

  await fs.writeJson(appJsonPath, appJson, { spaces: 2 });
}

// Run CLI
program
  .name("create-rn-app")
  .description("Create a new React Native app with Firebase and Superwall")
  .version("1.0.0")
  .action(main);

program.parse();

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

type DatabaseOption = "none" | "firebase" | "supabase";

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

  // Get database option
  const database = await p.select({
    message: "Select a backend/database:",
    options: [
      { value: "none", label: "None", hint: "Add later" },
      { value: "firebase", label: "Firebase", hint: "Auth, Firestore, Analytics" },
      { value: "supabase", label: "Supabase", hint: "Auth, Database, Realtime" },
    ],
  });

  if (p.isCancel(database)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  // Get paywall option
  const superwall = await p.confirm({
    message: "Add Superwall? (Paywalls + In-App Purchases)",
    initialValue: false,
  });

  if (p.isCancel(superwall)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const s = p.spinner();

  // Step 1: Clone base template
  s.start("Cloning base template...");
  try {
    execSync(
      `git clone --depth 1 https://github.com/${TEMPLATE_REPO}.git ${projectName}`,
      { stdio: "pipe" }
    );
    // Remove .git folder for fresh start
    await fs.remove(path.join(process.cwd(), projectName, ".git"));
    s.stop("Base template cloned");
  } catch (error) {
    s.stop("Failed to clone template");
    p.cancel("Could not clone template. Check your internet connection.");
    process.exit(1);
  }

  const projectPath = path.resolve(process.cwd(), projectName);

  // Step 2: Add database if selected
  if (database === "firebase") {
    s.start("Adding Firebase...");
    await addFirebase(projectPath);
    s.stop("Firebase added");
  } else if (database === "supabase") {
    s.start("Adding Supabase...");
    await addSupabase(projectPath);
    s.stop("Supabase added");
  }

  // Step 3: Add Superwall if selected
  if (superwall) {
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
  p.note(`cd ${projectName}\npnpm start`, "Next steps");

  p.outro(pc.green("Happy coding!"));
}

async function addFirebase(projectPath: string) {
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
  const firestoreHook = `import firestore, { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";

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

async function addSupabase(projectPath: string) {
  const pkgPath = path.join(projectPath, "package.json");
  const pkg = await fs.readJson(pkgPath);

  pkg.dependencies = {
    ...pkg.dependencies,
    "@supabase/supabase-js": "^2.49.1",
  };

  await fs.writeJson(pkgPath, pkg, { spaces: 2 });

  // Create Supabase client
  const supabaseClient = `import { createClient } from "@supabase/supabase-js";
import { getToken, setToken, deleteToken } from "./storage";

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: async (key) => {
        if (key.includes("token")) {
          return getToken();
        }
        return null;
      },
      setItem: async (key, value) => {
        if (key.includes("token")) {
          await setToken(value);
        }
      },
      removeItem: async (key) => {
        if (key.includes("token")) {
          await deleteToken();
        }
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
`;

  await fs.writeFile(
    path.join(projectPath, "src/lib/supabase.ts"),
    supabaseClient
  );

  // Create Supabase auth hook
  const supabaseAuthHook = `import { useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };
}
`;

  await fs.writeFile(
    path.join(projectPath, "src/hooks/useSupabaseAuth.ts"),
    supabaseAuthHook
  );

  // Create Supabase database hook
  const supabaseDbHook = `import { supabase } from "../lib/supabase";

export function useSupabaseDb() {
  const getDoc = async <T>(table: string, id: string): Promise<T | null> => {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as T;
  };

  const getDocs = async <T>(table: string): Promise<T[]> => {
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw error;
    return data as T[];
  };

  const insertDoc = async <T extends object>(table: string, data: T) => {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return result;
  };

  const updateDoc = async <T extends object>(
    table: string,
    id: string,
    data: Partial<T>
  ) => {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return result;
  };

  const deleteDoc = async (table: string, id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
  };

  return { getDoc, getDocs, insertDoc, updateDoc, deleteDoc };
}
`;

  await fs.writeFile(
    path.join(projectPath, "src/hooks/useSupabaseDb.ts"),
    supabaseDbHook
  );
}

async function addSuperwall(projectPath: string) {
  const pkgPath = path.join(projectPath, "package.json");
  const pkg = await fs.readJson(pkgPath);

  pkg.dependencies = {
    ...pkg.dependencies,
    "@superwall/react-native-superwall": "^1.0.0",
  };

  await fs.writeJson(pkgPath, pkg, { spaces: 2 });

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
  .description("Create a new React Native app with Firebase/Supabase and Superwall")
  .version("1.0.0")
  .action(main);

program.parse();

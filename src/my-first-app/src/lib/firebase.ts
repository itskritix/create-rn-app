import { initializeApp, getApps } from "@react-native-firebase/app";

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

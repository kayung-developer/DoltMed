import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// Use 'export const' to create a named export for 'app'
export const app = initializeApp(firebaseConfig);

// Use 'export const' to create a named export for 'messaging'
export const messaging = getMessaging(app);

// We no longer need a default export
// export default app;
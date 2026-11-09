import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return undefined;
    }

    return onAuthStateChanged(auth, async (nextUser) => {
      if (nextUser) setLoading(true);
      setUser(nextUser);
      if (!nextUser) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await getDoc(doc(db, "users", nextUser.uid));
        setRole(profile.exists() ? profile.data().role || "customer" : "customer");
      } catch (error) {
        console.error("Could not load the signed-in user's profile.", error);
        setRole("customer");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const login = useCallback(async (email, password) => {
    if (!auth) throw new Error("Firebase is not configured. Add your Firebase values to .env.");
    const result = await signInWithEmailAndPassword(auth, email, password);
    if (!db) throw new Error("Firebase Firestore is not configured.");
    const profile = await getDoc(doc(db, "users", result.user.uid));
    const userRole = profile.exists() ? profile.data().role || "customer" : "customer";
    setUser(result.user);
    setRole(userRole);
    setLoading(false);
    return { user: result.user, role: userRole };
  }, []);

  const signup = useCallback(async ({ name, email, phone, password }) => {
    if (!auth || !db) throw new Error("Firebase is not configured. Add your Firebase values to .env.");
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await setDoc(doc(db, "users", result.user.uid), {
      uid: result.user.uid,
      name,
      email,
      phone,
      role: "customer",
      createdAt: new Date().toISOString(),
    });
    setUser(result.user);
    setRole("customer");
    setLoading(false);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!auth) throw new Error("Firebase is not configured. Add your Firebase values to .env.");
    await sendPasswordResetEmail(auth, email);
  }, []);

  const value = useMemo(
    () => ({ user, role, loading, login, signup, logout, resetPassword }),
    [user, role, loading, login, signup, logout, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}

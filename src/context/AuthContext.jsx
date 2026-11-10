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
import { auth, getFirebaseFirestore, isFirebaseConfigured } from "../firebase.js";
import validateNigerianPhone from "../utils/validateNigerianPhone.js";

const AuthContext = createContext(null);
const PROFILE_CACHE_KEY = "tehilla-auth-profile";

function readCachedProfile() {
  try {
    const profile = JSON.parse(window.localStorage.getItem(PROFILE_CACHE_KEY) || "null");
    if (
      profile &&
      typeof profile.uid === "string" &&
      typeof profile.name === "string" &&
      typeof profile.role === "string"
    ) {
      return profile;
    }
  } catch (error) {
    console.warn("Could not read the cached user profile.", error);
  }
  return null;
}

function cacheProfile(profile) {
  try {
    window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.warn("Could not cache the user profile.", error);
  }
}

function clearCachedProfile() {
  try {
    window.localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch (error) {
    console.warn("Could not clear the cached user profile.", error);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cachedProfile, setCachedProfile] = useState(readCachedProfile);
  const [role, setRole] = useState(() => cachedProfile?.role || null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [roleLoading, setRoleLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setRoleLoading(false);
      return undefined;
    }

    let firstAuthStateReceived = false;
    let profileRequest = 0;
    const authTimeout = window.setTimeout(() => {
      if (firstAuthStateReceived) return;
      profileRequest += 1;
      setUser(null);
      setRole(null);
      setCachedProfile(null);
      setRoleLoading(false);
      setLoading(false);
      clearCachedProfile();
    }, 2000);

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        if (!firstAuthStateReceived) {
          firstAuthStateReceived = true;
          window.clearTimeout(authTimeout);
        }
        const requestId = ++profileRequest;
        setLoading(false);

        if (!nextUser) {
          setUser(null);
          setRole(null);
          setCachedProfile(null);
          setRoleLoading(false);
          clearCachedProfile();
          return;
        }

        const cached = cachedProfile?.uid === nextUser.uid ? cachedProfile : null;
        const name = nextUser.displayName || nextUser.email || "there";
        setUser(nextUser);
        setRole(cached?.role || null);
        setCachedProfile({ uid: nextUser.uid, name, role: cached?.role || "" });
        setRoleLoading(true);

        Promise.all([
          getFirebaseFirestore(),
          import("firebase/firestore"),
        ])
          .then(([database, { doc, getDoc }]) => {
            if (!database) throw new Error("Firebase Firestore is not configured.");
            return getDoc(doc(database, "users", nextUser.uid));
          })
          .then((profile) => {
            if (requestId !== profileRequest) return;
            const userRole = profile.exists() ? profile.data().role || "customer" : "customer";
            const profileName = profile.exists() ? profile.data().name : null;
            const confirmedProfile = {
              uid: nextUser.uid,
              name: typeof profileName === "string" && profileName ? profileName : name,
              role: userRole,
            };
            setRole(userRole);
            setCachedProfile(confirmedProfile);
            cacheProfile(confirmedProfile);
          })
          .catch((error) => {
            if (requestId !== profileRequest) return;
            console.error("Could not load the signed-in user's profile.", error);
            setRole("customer");
          })
          .finally(() => {
            if (requestId === profileRequest) setRoleLoading(false);
          });
      },
      (error) => {
        firstAuthStateReceived = true;
        window.clearTimeout(authTimeout);
        console.error("Could not check the signed-in user's session.", error);
        setUser(null);
        setRole(null);
        setCachedProfile(null);
        setRoleLoading(false);
        setLoading(false);
        clearCachedProfile();
      },
    );

    return () => {
      window.clearTimeout(authTimeout);
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    if (!auth) throw new Error("Firebase is not configured. Add your Firebase values to .env.");
    const result = await signInWithEmailAndPassword(auth, email, password);
    setUser(result.user);
    setRole(null);
    setRoleLoading(true);
    setLoading(false);
    return { user: result.user };
  }, []);

  const signup = useCallback(async ({ name, email, phone, password }) => {
    if (!auth) throw new Error("Firebase is not configured. Add your Firebase values to .env.");
    const phoneValidation = validateNigerianPhone(phone);
    if (!phoneValidation.valid) throw new Error(phoneValidation.error);
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    const [database, { doc, setDoc }] = await Promise.all([
      getFirebaseFirestore(),
      import("firebase/firestore"),
    ]);
    if (!database) throw new Error("Firebase Firestore is not configured.");
    await setDoc(doc(database, "users", result.user.uid), {
      uid: result.user.uid,
      name,
      email,
      phone: phoneValidation.normalized,
      role: "customer",
      createdAt: new Date().toISOString(),
    });
    setUser(result.user);
    setRole("customer");
    setCachedProfile({ uid: result.user.uid, name, role: "customer" });
    cacheProfile({ uid: result.user.uid, name, role: "customer" });
    setLoading(false);
    setRoleLoading(false);
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
    () => ({ user, role, cachedProfile, loading, roleLoading, login, signup, logout, resetPassword }),
    [user, role, cachedProfile, loading, roleLoading, login, signup, logout, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}

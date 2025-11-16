import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendEmailVerification
} from 'firebase/auth';
import { app } from '../firebase'; // Your initialized Firebase app
import { authService } from '../services/api'; // Our backend service
import api from '../services/api';
import toast from 'react-hot-toast';

// Initialize the Context with a default shape for better autocompletion and type-safety
const AuthContext = createContext({
    user: null, // DortMed user profile from our backend
    firebaseUser: null, // Raw Firebase auth object
    isAuthenticated: false, // Is the user fully authenticated with our backend?
    loading: true, // Is the context initializing?
    loginWithFirebaseAndVerify: () => Promise.reject(),
    logout: () => {},
    registerAndSetupProfile: () => Promise.reject(),
    refreshUser: () => Promise.resolve(),
});

export const AuthProvider = ({ children }) => {
    // This state will store our detailed user profile from the DortMed database
    const [user, setUser] = useState(null);
    // This state stores the raw Firebase user object (for things like email verification status)
    const [firebaseUser, setFirebaseUser] = useState(null);
    // This loading state is primarily for the initial authentication check on app load
    const [loading, setLoading] = useState(true);

    const auth = getAuth(app);

    // Derived state: A user is considered fully authenticated only if we have their profile from our backend.
    const isAuthenticated = !!user;

    // A stable logout function
    const logout = useCallback(() => {
        signOut(auth).then(() => {
            // Clear all local state and storage
            localStorage.removeItem('access_token'); // Kept for consistency, though Firebase handles its own storage
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
            setFirebaseUser(null);
            toast.success("Logged out successfully.");
            // Full page reload to login is the cleanest way to reset all application state.
            window.location.href = '/login';
        });
    }, [auth]);

    // A stable function to fetch the user profile from our backend
    const fetchDortMedUserProfile = useCallback(async () => {
        try {
            const response = await authService.getCurrentUser();
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
            return response.data;
        } catch (error) {
            console.error("DortMed profile not found or token invalid. Logging out.");
            // This is a critical failure. The user exists in Firebase but not our system,
            // or the token is somehow invalid. Logging out is the safest action.
            logout();
            return null;
        }
    }, [logout]);

    // This is the core listener that keeps the user session in sync.
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setLoading(true);
            if (fbUser) {
                // If user's email is not verified, we don't consider them logged in.
                if (!fbUser.emailVerified) {
                    toast.error("Please verify your email to log in.");
                    signOut(auth); // Force sign out
                    setUser(null);
                    setFirebaseUser(null);
                    setLoading(false);
                    return;
                }

                setFirebaseUser(fbUser);
                const idToken = await fbUser.getIdToken();
                api.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;

                await fetchDortMedUserProfile();
            } else {
                // No Firebase user
                setUser(null);
                setFirebaseUser(null);
                delete api.defaults.headers.common['Authorization'];
            }
            setLoading(false);
        });

        // Cleanup the listener on component unmount
        return () => unsubscribe();
    }, [auth, fetchDortMedUserProfile]);

    const loginWithFirebaseAndVerify = async (email, password, otp = null) => {
        // Step 1: Sign in to Firebase to verify the password.
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Step 2: Get the fresh Firebase ID Token.
        const idToken = await userCredential.user.getIdToken(true);

        // Step 3: Create a payload for our backend's 2FA check.
        const backendLoginPayload = new URLSearchParams();
        if (otp) {
            backendLoginPayload.append('otp', otp);
        }

        // Step 4: Call our backend's verification endpoint with the Firebase token.
        // This endpoint will perform the OTP check if `is_tfa_enabled` is true for the user.
        await api.post('/auth/verify-login', backendLoginPayload, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${idToken}`
            }
        });

        // If this call succeeds, the onAuthStateChanged listener will automatically
        // fetch the user's profile and handle the final authenticated state.
    };

    const registerAndSetupProfile = async (role, profileData, userData) => {
        // Step 1: Create user in Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        const fbUser = userCredential.user;

        // Step 2: Send verification email
        await sendEmailVerification(fbUser);
        toast.success("Verification email sent! Please check your inbox and verify your account before logging in.");

        // Step 3: Get ID token and send to our backend to create the profile in our DB
        const idToken = await fbUser.getIdToken();
        api.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;

        const setupData = { role: role, profile: profileData };
        await authService.setupProfile(setupData);

        // Step 4: Sign out the new user, forcing them to verify their email before they can log in.
        await signOut(auth);
    };

    // Memoize the context value to prevent unnecessary re-renders of consuming components
    const value = useMemo(() => ({
        user,
        firebaseUser,
        isAuthenticated,
        loading,
        loginWithFirebaseAndVerify,
        logout,
        registerAndSetupProfile,
        refreshUser: fetchDortMedUserProfile,
    }), [user, firebaseUser, isAuthenticated, loading, fetchDortMedUserProfile, logout]);

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Custom hook to easily consume the context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
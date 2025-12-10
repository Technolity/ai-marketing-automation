"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";

const AuthContext = createContext({
    user: null,
    session: null,
    isAdmin: false,
    loading: false,
    switchUser: () => { },
    signOut: () => { },
});

export function AuthProvider({ children }) {
    return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
}

function ClerkAuthProvider({ children }) {
    const { user: clerkUser, isLoaded } = useUser();
    const { signOut: clerkSignOut } = useClerk();
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminChecked, setAdminChecked] = useState(false);

    // Map Clerk user to our AuthContext shape
    const user = clerkUser ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        user_metadata: {
            full_name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
                clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0],
            avatar_url: clerkUser.imageUrl
        }
    } : null;

    const session = clerkUser ? {
        user,
        access_token: 'clerk-managed',
        expires_at: Date.now() + 86400000 // Clerk handles expiry
    } : null;

    // Fetch admin status from DATABASE (not Clerk metadata)
    useEffect(() => {
        if (clerkUser && isLoaded && !adminChecked) {
            checkAdminStatus();
        }
        if (!clerkUser && isLoaded) {
            setIsAdmin(false);
            setAdminChecked(true);
        }
    }, [clerkUser, isLoaded]);

    const checkAdminStatus = async () => {
        try {
            const res = await fetch('/api/admin/verify');
            const data = await res.json();
            setIsAdmin(data.isAdmin === true);
        } catch (error) {
            console.error('Admin check error:', error);
            setIsAdmin(false);
        } finally {
            setAdminChecked(true);
        }
    };

    // Sign out function
    const signOut = async () => {
        await clerkSignOut();
        setIsAdmin(false);
        setAdminChecked(false);
        window.location.href = '/';
    };

    // Disabled in Clerk mode
    const switchUser = () => {
        console.warn('switchUser is not available in Clerk mode');
    };

    const value = {
        user,
        session,
        isAdmin,
        loading: !isLoaded || !adminChecked,
        switchUser,
        signOut
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

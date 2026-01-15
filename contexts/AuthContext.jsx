"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";

const AuthContext = createContext({
    user: null,
    session: null,
    isAdmin: false,
    loading: false,
    licenseAccepted: true, // Default to true to avoid flash
    isProfileComplete: true,
    switchUser: () => { },
    signOut: () => { },
    acceptLicense: () => { },
    refreshProfile: () => { },
});

export function AuthProvider({ children }) {
    return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
}

function ClerkAuthProvider({ children }) {
    const { user: clerkUser, isLoaded } = useUser();
    const { signOut: clerkSignOut } = useClerk();
    const [isAdmin, setIsAdmin] = useState(false);
    const [userSynced, setUserSynced] = useState(false);
    const [licenseAccepted, setLicenseAccepted] = useState(true); // Default true to avoid flash
    const [isProfileComplete, setIsProfileComplete] = useState(true); // Default true to avoid flash

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

    // Sync user to Supabase and fetch admin status on login
    useEffect(() => {
        if (clerkUser && isLoaded && !userSynced) {
            syncUserAndCheckAdmin();
        }
        if (!clerkUser && isLoaded) {
            setIsAdmin(false);
            setUserSynced(false);
        }
    }, [clerkUser, isLoaded]);

    const syncUserAndCheckAdmin = async () => {
        try {
            console.log('[AuthContext] Syncing user to database...');

            // First, sync user to Supabase
            const syncRes = await fetch('/api/users/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: clerkUser.primaryEmailAddress?.emailAddress,
                    fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
                })
            });

            const syncData = await syncRes.json();
            if (syncData.success) {
                console.log('[AuthContext] User synced successfully:', syncData.message);
            } else {
                console.error('[AuthContext] User sync failed:', syncData.error);
            }

            // Then check admin status
            const adminRes = await fetch('/api/admin/verify');
            const adminData = await adminRes.json();
            setIsAdmin(adminData.isAdmin === true);

            console.log('[AuthContext] Admin status:', adminData.isAdmin);

            // Set profile completeness from sync response
            if (syncData.isProfileComplete !== undefined) {
                setIsProfileComplete(syncData.isProfileComplete);
                console.log('[AuthContext] Profile complete:', syncData.isProfileComplete);
            }

            // Check license acceptance status
            try {
                const licenseRes = await fetch('/api/users/accept-license');
                const licenseData = await licenseRes.json();
                setLicenseAccepted(licenseData.licenseAccepted === true);
                console.log('[AuthContext] License accepted:', licenseData.licenseAccepted);
            } catch (licenseError) {
                console.error('[AuthContext] License check error:', licenseError);
                setLicenseAccepted(false); // Assume not accepted on error
            }
        } catch (error) {
            console.error('[AuthContext] Sync/admin check error:', error);
            setIsAdmin(false);
        } finally {
            setUserSynced(true);
        }
    };

    // Sign out function
    const signOut = async () => {
        await clerkSignOut();
        setIsAdmin(false);
        setIsProfileComplete(false);
        setUserSynced(false);
        window.location.href = '/';
    };

    // Disabled in Clerk mode
    const switchUser = () => {
        console.warn('switchUser is not available in Clerk mode');
    };

    // Accept license function
    const acceptLicense = async () => {
        try {
            const res = await fetch('/api/users/accept-license', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                setLicenseAccepted(true);
                console.log('[AuthContext] License accepted successfully');
            }
        } catch (error) {
            console.error('[AuthContext] Error accepting license:', error);
        }
    };

    // Refresh profile function (for manual re-sync)
    const refreshProfile = async () => {
        if (clerkUser) {
            await syncUserAndCheckAdmin();
        }
    };

    const value = {
        user,
        session,
        isAdmin,
        loading: !isLoaded || (clerkUser && !userSynced),
        authLoading: !isLoaded || (clerkUser && !userSynced),
        licenseAccepted,
        isProfileComplete,
        switchUser,
        signOut,
        acceptLicense,
        refreshProfile
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

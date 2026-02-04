"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";

const AuthContext = createContext({
    user: null,
    session: null,
    isAdmin: false,
    loading: false,
    licenseAccepted: true,
    isProfileComplete: true,
    // Team/Workspace context
    role: 'owner',
    isTeamMember: false,
    activeWorkspaceId: null,
    workspaceOwnerId: null,
    workspaceName: null,
    // Functions
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
    const [licenseAccepted, setLicenseAccepted] = useState(true);
    const [isProfileComplete, setIsProfileComplete] = useState(true);

    // Team/Workspace state
    const [role, setRole] = useState('owner');
    const [workspaceOwnerId, setWorkspaceOwnerId] = useState(null);
    const [workspaceName, setWorkspaceName] = useState(null);

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
        expires_at: Date.now() + 86400000
    } : null;

    // Computed values
    const isTeamMember = role === 'team_member';
    const activeWorkspaceId = isTeamMember && workspaceOwnerId ? workspaceOwnerId : user?.id;

    // Sync user to Supabase and fetch admin status on login
    useEffect(() => {
        if (clerkUser && isLoaded && !userSynced) {
            syncUserAndCheckAdmin();
        }
        if (!clerkUser && isLoaded) {
            setIsAdmin(false);
            setUserSynced(false);
            setRole('owner');
            setWorkspaceOwnerId(null);
            setWorkspaceName(null);
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

                // Set role and workspace from sync response
                if (syncData.role) {
                    setRole(syncData.role);
                    console.log('[AuthContext] User role:', syncData.role);
                }
                if (syncData.roleOwnerId) {
                    setWorkspaceOwnerId(syncData.roleOwnerId);
                    console.log('[AuthContext] Workspace owner:', syncData.roleOwnerId);

                    // Fetch owner's business name for team members
                    if (syncData.role === 'team_member') {
                        try {
                            const profileRes = await fetch('/api/user/profile');
                            const profileData = await profileRes.json();
                            if (profileData.owner_business_name) {
                                setWorkspaceName(profileData.owner_business_name);
                                console.log('[AuthContext] Workspace name:', profileData.owner_business_name);
                            }
                        } catch (profileError) {
                            console.error('[AuthContext] Failed to fetch workspace name:', profileError);
                        }
                    }
                }
            } else {
                console.error('[AuthContext] User sync failed:', syncData.error);
            }

            // Then check admin status
            const adminRes = await fetch('/api/admin/verify');
            const adminData = await adminRes.json();
            setIsAdmin(adminData.isAdmin === true);

            console.log('[AuthContext] Admin status:', adminData.isAdmin);

            // Set profile completeness from sync response
            // Team members skip onboarding automatically
            if (syncData.role === 'team_member') {
                setIsProfileComplete(true);
                console.log('[AuthContext] Team member - skipping onboarding');
            } else if (syncData.isProfileComplete !== undefined) {
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
                setLicenseAccepted(false);
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
        setRole('owner');
        setWorkspaceOwnerId(null);
        setWorkspaceName(null);
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
        userId: user?.id,
        session,
        isAdmin,
        loading: !isLoaded || (clerkUser && !userSynced),
        authLoading: !isLoaded || (clerkUser && !userSynced),
        licenseAccepted,
        isProfileComplete,
        // Team/Workspace context
        role,
        isTeamMember,
        activeWorkspaceId,
        workspaceOwnerId,
        workspaceName,
        // Functions
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

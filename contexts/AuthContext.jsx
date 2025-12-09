"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const AuthContext = createContext({
    user: null,
    session: null,
    isAdmin: false,
    loading: true,
    signOut: async () => { },
});

// Cache for admin status
const adminCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }) {
    const supabase = createClientComponentClient();
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const hasInitialized = useRef(false);

    // Check admin status
    const checkAdminStatus = useCallback(async (userId) => {
        if (!userId) return false;

        const cached = adminCache.get(userId);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.isAdmin;
        }

        try {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('is_admin')
                .eq('id', userId)
                .single();

            const adminStatus = profile?.is_admin || false;
            adminCache.set(userId, { isAdmin: adminStatus, timestamp: Date.now() });
            return adminStatus;
        } catch (error) {
            console.error('Admin check error:', error);
            return false;
        }
    }, [supabase]);

    // Sign out
    const signOut = useCallback(async () => {
        try {
            if (user?.id) adminCache.delete(user.id);
            await supabase.auth.signOut();
        } catch (e) {
            console.warn('Sign out error:', e);
        }
        setUser(null);
        setSession(null);
        setIsAdmin(false);
    }, [supabase, user]);

    // Initialize auth
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        let mounted = true;

        // Failsafe: Set loading to false after 2 seconds no matter what
        const timeoutId = setTimeout(() => {
            if (mounted && loading) {
                console.warn('AuthContext: Timeout - forcing loading to false');
                setLoading(false);
            }
        }, 2000);

        const initAuth = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();

                if (!mounted) return;

                if (currentSession?.user) {
                    setSession(currentSession);
                    setUser(currentSession.user);
                    const adminStatus = await checkAdminStatus(currentSession.user.id);
                    if (mounted) setIsAdmin(adminStatus);
                }
            } catch (error) {
                console.error('Auth init error:', error);
            } finally {
                if (mounted) setLoading(false);
                clearTimeout(timeoutId);
            }
        };

        initAuth();

        // Auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                if (!mounted) return;

                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setSession(null);
                    setIsAdmin(false);
                    adminCache.clear();
                } else if (event === 'SIGNED_IN' && newSession?.user) {
                    setSession(newSession);
                    setUser(newSession.user);
                    const adminStatus = await checkAdminStatus(newSession.user.id);
                    if (mounted) setIsAdmin(adminStatus);
                } else if (event === 'TOKEN_REFRESHED' && newSession) {
                    setSession(newSession);
                }
                if (mounted) setLoading(false);
            }
        );

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [supabase, checkAdminStatus, loading]);

    return (
        <AuthContext.Provider value={{
            user,
            session,
            isAdmin,
            loading,
            signOut
        }}>
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

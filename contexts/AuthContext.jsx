"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

const AuthContext = createContext({
    user: null,
    session: null,
    isAdmin: false,
    loading: true,
    signOut: async () => { },
});

// Cache for admin status to avoid repeated DB queries
const adminCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }) {
    const supabase = createClientComponentClient();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const adminCheckInProgress = useRef(false);

    // Check admin status with caching
    const checkAdminStatus = useCallback(async (userId) => {
        if (adminCheckInProgress.current) return false;

        // Check cache first
        const cached = adminCache.get(userId);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.isAdmin;
        }

        adminCheckInProgress.current = true;

        try {
            const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('is_admin')
                .eq('id', userId)
                .single();

            const adminStatus = profile?.is_admin || false;

            // Cache the result
            adminCache.set(userId, {
                isAdmin: adminStatus,
                timestamp: Date.now()
            });

            return adminStatus;
        } catch (error) {
            console.error('Admin check error:', error);
            return false;
        } finally {
            adminCheckInProgress.current = false;
        }
    }, [supabase]);

    // Sign out function
    const signOut = useCallback(async () => {
        try {
            await supabase.auth.signOut();
            // Clear admin cache on sign out
            if (user?.id) {
                adminCache.delete(user.id);
            }
        } catch (e) {
            console.warn('Sign out error:', e);
        }
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        router.push("/");
    }, [supabase, router, user]);

    // Initialize auth on mount (optimized)
    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();

                if (!mounted) return;

                if (currentSession?.user) {
                    setSession(currentSession);
                    setUser(currentSession.user);

                    // Check admin status with caching
                    const adminStatus = await checkAdminStatus(currentSession.user.id);
                    if (mounted) {
                        setIsAdmin(adminStatus);
                    }
                }
            } catch (error) {
                console.error('Auth init error:', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes (optimized)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                if (!mounted) return;

                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setSession(null);
                    setIsAdmin(false);
                    if (newSession?.user?.id) {
                        adminCache.delete(newSession.user.id);
                    }
                } else if (event === 'SIGNED_IN' && newSession?.user) {
                    setSession(newSession);
                    setUser(newSession.user);

                    // Check admin status with caching
                    const adminStatus = await checkAdminStatus(newSession.user.id);
                    if (mounted) {
                        setIsAdmin(adminStatus);
                    }
                } else if (event === 'TOKEN_REFRESHED' && newSession) {
                    // Just update session, don't re-check admin status
                    setSession(newSession);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [supabase, checkAdminStatus]);

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

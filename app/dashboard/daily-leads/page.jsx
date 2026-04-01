"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";
import GeneratorView from "@/components/dashboard/daily-leads/GeneratorView";
import HistoryList from "@/components/dashboard/daily-leads/HistoryList";
import SocialConnections from "@/components/social/SocialConnections";

export default function DailyLeadsPage() {
  const searchParams = useSearchParams();
  const [metrics, setMetrics] = useState(null);
  const [posts, setPosts] = useState([]);
  const [quota, setQuota] = useState(null);
  const [funnels, setFunnels] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [socialConnected, setSocialConnected] = useState([]);

  // Handle OAuth redirect result toasts
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error     = searchParams.get("error");
    const message   = searchParams.get("message");
    const username  = searchParams.get("username");
    const account   = searchParams.get("account");

    if (connected === "x") {
      const displayName = username ? `@${username}` : "X account";
      toast.success(`${displayName} connected successfully!`);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (connected === "meta") {
      const displayName = account || "Instagram & Facebook";
      toast.success(`${displayName} connected successfully!`);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      const errorMessages = {
        invalid_state:        "Connection failed: security check failed. Please try again.",
        token_exchange_failed: "Failed to connect account. Please try again.",
        connection_failed:    "Failed to connect account. Please try again.",
        x_auth_denied:        "You cancelled the X authorization. Please try again.",
        x_auth_failed:        `X connection failed: ${message || "Unknown error"}`,
        meta_auth_denied:     "You cancelled the Meta authorization. Please try again.",
        meta_auth_failed:     `Meta connection failed: ${message || "Unknown error"}`,
        meta_no_instagram:    message || "No Instagram Business account found.",
      };
      toast.error(errorMessages[error] || "Failed to connect account.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  const loadData = useCallback(async () => {
    try {
      const [postsRes, funnelsRes] = await Promise.all([
        fetchWithAuth("/api/daily-leads/posts"),
        fetchWithAuth("/api/user/funnels"),
      ]);

      if (postsRes.ok) {
        const data = await postsRes.json();
        setMetrics(data.metrics);
        setPosts(data.posts || []);
        setQuota(data.quota || null);
      }

      if (funnelsRes.ok) {
        const data = await funnelsRes.json();
        setFunnels((data.funnels || []).filter((funnel) => funnel.vault_generated));
      }
    } catch (err) {
      console.error("[DailyLeads Page]", err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePostCreated = useCallback(
    (newPost, nextQuota) => {
      if (newPost) {
        setPosts((prev) => [newPost, ...prev.filter((post) => post.id !== newPost.id)]);
      }
      if (nextQuota) {
        setQuota(nextQuota);
      }
      loadData();
    },
    [loadData]
  );

  const handlePostChanged = useCallback(
    (updatedPost) => {
      if (updatedPost) {
        setPosts((prev) =>
          prev.map((post) => (post.id === updatedPost.id ? { ...post, ...updatedPost } : post))
        );
      }
      loadData();
    },
    [loadData]
  );

  return (
    <div className="pb-10">
      {/* Unified surface */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-subtle bg-grayDark">
        {/* Page header */}
        <div className="px-6 pb-5 pt-5 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl space-y-1.5">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full border border-cyan/20 bg-cyan/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-cyan/80">
                  Daily Leads
                </span>
                <span className="rounded-full border border-subtle px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-gray-600">
                  Social Creative Studio
                </span>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-white">
                Turn vault strategy into a sharp daily post.
              </h2>
              <p className="text-sm leading-relaxed text-gray-500">
                Select a funnel, describe your image, and generate a post with caption and smart
                link.
              </p>

              {/* Social connections status */}
              <div className="space-y-3 pt-3">
                <div>
                  <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-gray-600">
                    Connect Social Accounts
                  </p>
                  <SocialConnections onStatusChange={setSocialConnected} />
                </div>
              </div>
            </div>

            {/* Quota inline */}
            <div className="min-w-[160px] shrink-0">
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-gray-600">
                Daily Quota
              </p>
              {quota ? (
                <>
                  <p className="text-2xl font-bold leading-none tabular-nums text-white">
                    {quota.remaining}
                    <span className="ml-1 text-sm font-normal text-gray-600">/ {quota.limit}</span>
                  </p>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${quota.remaining > 3
                        ? "bg-cyan"
                        : quota.remaining > 0
                          ? "bg-amber-400"
                          : "bg-red-500"
                        }`}
                      style={{ width: `${(quota.remaining / quota.limit) * 100}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="h-8 w-24 animate-pulse rounded-lg bg-white/5" />
              )}
            </div>
          </div>
        </div>

        {/* Metrics strip */}
        <div className="border-t border-white/5">
          <div className="grid grid-cols-3 gap-1 bg-white/5">
            {[
              { label: "Generated", value: metrics?.totalGenerated, helper: "Library total" },
              { label: "Published", value: metrics?.totalPublished, helper: "Social assets" },
              { label: "Clicks", value: metrics?.totalClicks, helper: "Smart-link traffic" },
            ].map(({ label, value, helper }) => (
              <div key={label} className="bg-grayDark px-6 py-4">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
                  {label}
                </p>
                {loadingData ? (
                  <div className="mt-2 h-6 w-12 animate-pulse bg-white/5" />
                ) : (
                  <p className="mt-1 text-xl font-black tracking-tighter tabular-nums text-white">
                    {(value ?? 0).toLocaleString()}
                  </p>
                )}
                <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-gray-700">
                  {helper}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <GeneratorView
        funnels={funnels}
        initialQuota={quota}
        onPostCreated={handlePostCreated}
        onPostChanged={handlePostChanged}
      />

      <div className="overflow-hidden border border-white/5 bg-[#111112]">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Post History</h3>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-gray-600">
              Active archive management
            </p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] tabular-nums text-gray-600">
            {posts.length} entries
          </span>
        </div>

        <HistoryList
          posts={posts}
          loading={loadingData}
          onRefresh={loadData}
          onPostChanged={handlePostChanged}
        />
      </div>
    </div>
  );
}

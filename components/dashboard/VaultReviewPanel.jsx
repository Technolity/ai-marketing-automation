"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const TOTAL_VAULT_SECTIONS = 16;

function formatApprovalState(business, approvals) {
  const businessCoreCount = approvals?.businessCoreApprovals?.length || 0;
  const funnelAssetsCount = approvals?.funnelAssetsApprovals?.length || 0;
  const scriptsCount = approvals?.scriptsApprovals?.length || 0;
  const approvalTotal = approvals
    ? businessCoreCount + funnelAssetsCount + scriptsCount
    : business.approved_count || 0;

  const mediaMissing = approvals
    ? business.vault_generated && !approvals.funnelAssetsApprovals?.includes("media")
    : false;
  const builderReady = Boolean(approvals?.phase2Complete || business.deployed_at);
  const fullyApproved = approvalTotal >= TOTAL_VAULT_SECTIONS;

  let label = "Setup required";
  let tone = "text-amber-300 border-amber-400/20 bg-amber-400/10";

  if (business.deployed_at) {
    label = "Live";
    tone = "text-emerald-300 border-emerald-500/20 bg-emerald-500/10";
  } else if (fullyApproved) {
    label = "Ready to publish";
    tone = "text-cyan border-cyan/20 bg-cyan/10";
  } else if (business.vault_generated) {
    label = "Awaiting approval";
    tone = "text-blue-200 border-blue-400/20 bg-blue-400/10";
  }

  return {
    approvalTotal,
    builderReady,
    businessCoreCount,
    funnelAssetsCount,
    fullyApproved,
    label,
    mediaMissing,
    scriptsCount,
    tone,
  };
}

export default function VaultReviewPanel({
  businesses = [],
  builderLocationId = "",
  onOpenVault,
}) {
  const [loading, setLoading] = useState(true);
  const [approvalsByFunnel, setApprovalsByFunnel] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function loadApprovals() {
      if (!businesses.length) {
        setApprovalsByFunnel({});
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const entries = await Promise.all(
          businesses.map(async (business) => {
            try {
              const res = await fetchWithAuth(`/api/os/approvals?funnel_id=${business.id}`);
              if (!res.ok) {
                return [business.id, null];
              }
              const data = await res.json();
              return [business.id, data];
            } catch (error) {
              console.error("[VaultReviewPanel] approvals fetch failed", error);
              return [business.id, null];
            }
          })
        );

        if (!cancelled) {
          setApprovalsByFunnel(Object.fromEntries(entries));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadApprovals();

    return () => {
      cancelled = true;
    };
  }, [businesses]);

  const reviewRows = useMemo(() => {
    return businesses
      .map((business) => {
        const approvals = approvalsByFunnel[business.id];
        return {
          ...business,
          review: formatApprovalState(business, approvals),
        };
      })
      .sort((left, right) => {
        if (left.review.mediaMissing !== right.review.mediaMissing) {
          return left.review.mediaMissing ? -1 : 1;
        }
        if (left.review.builderReady !== right.review.builderReady) {
          return left.review.builderReady ? 1 : -1;
        }
        return right.review.approvalTotal - left.review.approvalTotal;
      });
  }, [approvalsByFunnel, businesses]);

  if (loading) {
    return (
      <div className="rounded-[26px] border border-white/8 bg-[#121214] p-10 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan" />
        <p className="mt-4 text-base text-gray-500">Loading vault review data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[26px] border border-white/8 bg-[#121214] p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-white">Approval overview</h3>
            <p className="mt-2 max-w-2xl text-base leading-6 text-gray-500">
              Review each engine at a glance, see how much of the Vault is approved, and jump
              straight into the asset flow that needs attention.
            </p>
          </div>
          <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">
            {reviewRows.length} engines
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {reviewRows.map((business) => (
            <div
              key={business.id}
              className="rounded-[20px] border border-white/8 bg-[#17181a] p-6 transition-colors hover:border-cyan/20"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate text-xl font-semibold text-white">{business.funnel_name}</h4>
                    <span
                      className={`rounded-full border px-3 py-1.5 text-sm font-bold uppercase tracking-[0.16em] ${business.review.tone}`}
                    >
                      {business.review.label}
                    </span>
                  </div>
                  <p className="mt-3 text-base text-gray-500">
                    {business.review.approvalTotal} / {TOTAL_VAULT_SECTIONS} sections approved
                    across business core, funnel assets, and scripts.
                  </p>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/6">
                    <div
                      className="h-full rounded-full bg-cyan transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (business.review.approvalTotal / TOTAL_VAULT_SECTIONS) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  {business.review.mediaMissing && (
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-sm font-bold uppercase tracking-[0.16em] text-amber-300">
                      Media missing
                    </span>
                  )}
                  {business.review.builderReady && (
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-sm font-bold uppercase tracking-[0.16em] text-emerald-300">
                      Builder-ready
                    </span>
                  )}
                  <button
                    onClick={() => onOpenVault?.(business.id)}
                    className="inline-flex items-center gap-2 h-12 px-5 text-base font-semibold rounded-[14px] border border-white/10 bg-black/20 text-white transition-colors hover:border-cyan/20 hover:text-cyan"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Open vault
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {builderLocationId && (
          <div className="mt-6">
            <a
              href={`https://app.tedos.ai/v2/location/${builderLocationId}/funnels-websites/funnels`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan/20 bg-cyan/10 px-5 py-3 text-base font-semibold text-cyan transition-colors hover:bg-cyan/16"
            >
              Open Builder
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        )}
      </section>
    </div>
  );
}

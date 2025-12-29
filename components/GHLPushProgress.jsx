"use client";
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Image,
  Palette,
  Clock,
  TrendingUp,
  Zap,
  Shield,
  Send,
  Cpu,
  Database
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * GHL Push Progress Component - Premium Edition
 * High-end visualization of GHL deployment status
 */
export default function GHLPushProgress({
  operationId,
  isActive = false,
  onComplete
}) {
  const [operation, setOperation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [streamItems, setStreamItems] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    pushed: true,
    updated: false,
    failed: false,
    nonMatched: false
  });

  // Poll for operation status
  useEffect(() => {
    if (!operationId || !isActive) return;

    if (operation?.status === 'completed' || operation?.status === 'failed' || operation?.status === 'partial') {
      return;
    }

    const pollInterval = setInterval(async () => {
      await fetchOperationStatus();
    }, 2000);

    fetchOperationStatus();

    return () => clearInterval(pollInterval);
  }, [operationId, isActive, operation?.status]);

  const fetchOperationStatus = async () => {
    if (!operationId) return;

    try {
      const res = await fetch(`/api/ghl/push-complete?operationId=${operationId}`);
      const data = await res.json();

      if (data.operation) {
        setOperation(data.operation);

        // Add to data stream if new items found
        const allItems = [
          ...(data.operation.custom_values_pushed?.created || []),
          ...(data.operation.custom_values_pushed?.updated || [])
        ];

        if (allItems.length > streamItems.length) {
          const newItems = allItems.slice(streamItems.length).map(item => ({
            id: Math.random().toString(36).substr(2, 9),
            key: typeof item === 'string' ? item : item.key,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }));
          setStreamItems(prev => [...newItems, ...prev].slice(0, 10));
        }

        const isFinished = data.operation.status === 'completed' ||
          data.operation.status === 'failed' ||
          data.operation.status === 'partial';

        if (isFinished) {
          // Delay a bit for the user to see the 100% state
          setTimeout(() => {
            onComplete?.(data.operation);
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error fetching operation status:', error);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!operation) {
    return (
      <div className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-2xl p-12 text-center overflow-hidden relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-2 border-cyan/20 border-t-cyan rounded-full mx-auto mb-6"
        />
        <p className="text-gray-400 font-medium">Initializing Secure Channel...</p>
        <div className="absolute inset-0 bg-gradient-to-t from-cyan/5 to-transparent pointer-events-none" />
      </div>
    );
  }

  const isInProgress = operation.status === 'in_progress';
  const isCompleted = operation.status === 'completed';
  const isPartial = operation.status === 'partial';
  const isFailed = operation.status === 'failed';
  const isDone = isCompleted || isPartial || isFailed;

  const progress = operation.total_items > 0 ? Math.round((operation.completed_items / operation.total_items) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* Top Matrix Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Status Card */}
        <div className="lg:col-span-2 bg-[#0c0c0d] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
          {/* Animated Glow Backdrop */}
          <div className={`absolute -inset-24 opacity-20 blur-3xl transition-colors duration-1000 ${isCompleted ? 'bg-green-500' : isInProgress ? 'bg-cyan' : 'bg-red-500'
            }`} />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isCompleted ? 'bg-green-500 text-black' : 'bg-cyan/20 text-cyan'
                }`}>
                {isInProgress ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">
                  {isInProgress ? 'DEPLOYING ASSETS' : isCompleted ? 'ASSETS DEPLOYED' : 'DEPLOYMENT FAILED'}
                </h3>
                <p className="text-gray-400 text-sm font-mono">ID: {operationId.substring(0, 16)}...</p>
              </div>
            </div>

            {/* Progress Visual */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-4">
                <div className="space-y-1">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Global Progress</span>
                  <div className="text-4xl font-black text-white flex items-baseline gap-2">
                    {progress}<span className="text-lg text-cyan">%</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Integrity</span>
                  <div className="flex items-center gap-2 text-green-400 font-mono text-sm">
                    <Shield className="w-4 h-4" />
                    100% SECURE
                  </div>
                </div>
              </div>

              <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", bounce: 0, duration: 1 }}
                  className="h-full bg-gradient-to-r from-cyan via-blue-500 to-indigo-600 rounded-full relative"
                >
                  <div className="absolute top-0 right-0 w-8 h-full bg-white opacity-20 blur-sm" />
                </motion.div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <StatItem label="Total" value={operation.total_items} />
              <StatItem label="Success" value={operation.completed_items} color="text-cyan" />
              <StatItem label="Failed" value={operation.failed_items || 0} color="text-red-500" />
              <StatItem label="Time" value={operation.duration_ms ? `${(operation.duration_ms / 1000).toFixed(1)}s` : '-'} />
            </div>
          </div>
        </div>

        {/* Live Stream Card */}
        <div className="bg-[#0c0c0d] border border-white/5 rounded-3xl p-6 flex flex-col h-full">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan" />
            Live Data Stream
          </h4>
          <div className="flex-1 font-mono text-[10px] space-y-2 overflow-hidden relative">
            <AnimatePresence>
              {streamItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-2 text-gray-400 border-l-2 border-cyan/30 pl-2 py-1"
                >
                  <span className="text-cyan/50">[{item.time}]</span>
                  <span className="text-white truncate">PUSH::{item.key}</span>
                  <Send className="w-3 h-3 text-green-500 ml-auto flex-shrink-0" />
                </motion.div>
              ))}
            </AnimatePresence>
            {!isInProgress && streamItems.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-600 italic">
                No active stream
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Sections */}
      <div className="space-y-4">
        {/* Pushed Values */}
        <DetailSection
          title="Created Value Entries"
          count={operation.custom_values_pushed?.created?.length || 0}
          items={operation.custom_values_pushed?.created || []}
          expanded={expandedSections.pushed}
          onToggle={() => toggleSection('pushed')}
          icon={<Database className="w-4 h-4" />}
          color="cyan"
          onCopy={copyToClipboard}
        />

        {/* Updated Values */}
        <DetailSection
          title="Updated Value Entries"
          count={operation.custom_values_pushed?.updated?.length || 0}
          items={operation.custom_values_pushed?.updated || []}
          expanded={expandedSections.updated}
          onToggle={() => toggleSection('updated')}
          icon={<TrendingUp className="w-4 h-4" />}
          color="blue"
          onCopy={copyToClipboard}
        />

        {/* Failed Values */}
        {operation.failed_items > 0 && (
          <DetailSection
            title="Failed Deployments"
            count={operation.failed_items}
            items={operation.custom_values_pushed?.failed || []}
            expanded={expandedSections.failed}
            onToggle={() => toggleSection('failed')}
            icon={<XCircle className="w-4 h-4" />}
            color="red"
            isError
          />
        )}
      </div>

    </div>
  );
}

function StatItem({ label, value, color = "text-white" }) {
  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
      <p className="text-[10px] uppercase font-bold text-gray-500 tracking-tighter mb-1">{label}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function DetailSection({ title, count, items, expanded, onToggle, icon, color, isError, onCopy }) {
  if (count === 0) return null;

  return (
    <div className="bg-[#0c0c0d] border border-white/5 rounded-3xl overflow-hidden transition-all duration-500">
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isError ? 'bg-red-500/20 text-red-500' : `bg-${color}-500/20 text-${color}`
            }`}>
            {icon}
          </div>
          <div>
            <h4 className="font-bold text-white text-left">{title}</h4>
            <p className="text-xs text-gray-500 text-left">{count} assets processed</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-6 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {items.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between group">
                  <div className="flex-1 truncate mr-4">
                    <p className="text-xs font-mono text-cyan truncate mb-1">{(typeof item === 'string' ? item : item.key)}</p>
                    <p className="text-[10px] text-gray-500 truncate">{(typeof item === 'string' ? 'Deployed' : (item.value || item.error))}</p>
                  </div>
                  {onCopy && (
                    <button
                      onClick={() => onCopy(typeof item === 'string' ? item : item.value)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-lg transition-all"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

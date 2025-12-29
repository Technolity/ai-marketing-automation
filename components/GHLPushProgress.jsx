"use client";
import { useState, useEffect } from 'react';
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
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * GHL Push Progress Component
 * Displays real-time progress and detailed results of GHL push operations
 */
export default function GHLPushProgress({
  operationId,
  isActive = false,
  onComplete
}) {
  const [operation, setOperation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    pushed: true,
    updated: false,
    failed: false,
    nonMatched: false
  });

  // Poll for operation status when active
  useEffect(() => {
    if (!operationId || !isActive) return;

    // Don't poll if already completed
    if (operation?.status === 'completed' || operation?.status === 'failed' || operation?.status === 'partial') {
      return;
    }

    const pollInterval = setInterval(async () => {
      await fetchOperationStatus();
    }, 2000); // Poll every 2 seconds

    fetchOperationStatus(); // Initial fetch

    return () => clearInterval(pollInterval);
  }, [operationId, isActive, operation?.status]);

  // CSS fetching removed - colors now pushed as custom values

  const fetchOperationStatus = async () => {
    if (!operationId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/ghl/push-complete?operationId=${operationId}`);
      const data = await res.json();

      if (data.operation) {
        setOperation(data.operation);

        // Call onComplete when operation finishes
        if (data.operation.status === 'completed' || data.operation.status === 'failed') {
          onComplete?.(data.operation);
        }
      }
    } catch (error) {
      console.error('Error fetching operation status:', error);
      toast.error('Failed to fetch operation status');
    } finally {
      setLoading(false);
    }
  };

  // fetchCSSCode removed - colors now pushed as custom values

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
      <div className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg p-6">
        <div className="flex items-center justify-center gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading operation details...</span>
        </div>
      </div>
    );
  }

  const isInProgress = operation.status === 'in_progress';
  const isCompleted = operation.status === 'completed';
  const isFailed = operation.status === 'failed';
  const isPartial = operation.status === 'partial';

  const progress = operation.total_items > 0
    ? Math.round((operation.completed_items / operation.total_items) * 100)
    : 0;

  // Handle both old format (pushed) and new format (created)
  const rawCreatedValues = operation.custom_values_pushed?.created || operation.custom_values_pushed?.pushed || [];
  const rawUpdatedValues = operation.custom_values_pushed?.updated || [];
  const rawFailedValues = operation.custom_values_pushed?.failed || [];
  const nonMatchedValues = operation.custom_values_pushed?.nonMatched || [];

  // Normalize values - they might be strings (just keys) or objects {key, value}
  const normalizeValues = (arr) => arr.map(item =>
    typeof item === 'string' ? { key: item, value: '(value pushed)' } : item
  );

  const pushedValues = normalizeValues(rawCreatedValues);
  const updatedValues = normalizeValues(rawUpdatedValues);
  const failedValues = rawFailedValues.map(item =>
    typeof item === 'string' ? { key: item, error: 'Unknown error' } : item
  );

  const duration = operation.duration_ms
    ? `${(operation.duration_ms / 1000).toFixed(1)}s`
    : 'In progress...';

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className={`border rounded-lg p-6 ${isCompleted ? 'bg-green-500/10 border-green-500/30' :
        isFailed ? 'bg-red-500/10 border-red-500/30' :
          isPartial ? 'bg-yellow-500/10 border-yellow-500/30' :
            'bg-blue-500/10 border-blue-500/30'
        }`}>
        <div className="flex items-start gap-3">
          {isInProgress && <Loader2 className="w-6 h-6 text-blue-500 animate-spin flex-shrink-0 mt-1" />}
          {isCompleted && <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />}
          {isFailed && <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />}
          {isPartial && <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />}

          <div className="flex-1">
            <h3 className={`text-lg font-bold mb-2 ${isCompleted ? 'text-green-500' :
              isFailed ? 'text-red-500' :
                isPartial ? 'text-yellow-500' :
                  'text-blue-500'
              }`}>
              {isInProgress && 'Pushing to Funnels...'}
              {isCompleted && 'Successfully Pushed to Funnels!'}
              {isFailed && 'Push Operation Failed'}
              {isPartial && 'Partial Success'}
            </h3>

            {/* Progress Bar */}
            {isInProgress && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-300">
                    {operation.completed_items} / {operation.total_items} values
                  </span>
                  <span className="text-blue-400 font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-black/30 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Total</p>
                <p className="text-2xl font-bold">{operation.total_items}</p>
              </div>
              <div className="bg-green-500/20 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Pushed</p>
                <p className="text-2xl font-bold text-green-400">{pushedValues.length}</p>
              </div>
              <div className="bg-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Updated</p>
                <p className="text-2xl font-bold text-blue-400">{updatedValues.length}</p>
              </div>
              <div className="bg-red-500/20 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Failed</p>
                <p className="text-2xl font-bold text-red-400">{failedValues.length}</p>
              </div>
              <div className="bg-yellow-500/20 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Duration</p>
                <p className="text-xl font-bold text-yellow-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {duration}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pushed Values */}
      {pushedValues.length > 0 && (
        <CollapsibleSection
          title={`Pushed Values (${pushedValues.length})`}
          icon={<CheckCircle className="w-5 h-5 text-green-400" />}
          isExpanded={expandedSections.pushed}
          onToggle={() => toggleSection('pushed')}
          color="green"
        >
          <div className="space-y-2">
            {pushedValues.map((item, i) => (
              <ValueCard key={i} item={item} type="pushed" onCopy={copyToClipboard} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Updated Values */}
      {updatedValues.length > 0 && (
        <CollapsibleSection
          title={`Updated Values (${updatedValues.length})`}
          icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
          isExpanded={expandedSections.updated}
          onToggle={() => toggleSection('updated')}
          color="blue"
        >
          <div className="space-y-2">
            {updatedValues.map((item, i) => (
              <ValueCard key={i} item={item} type="updated" onCopy={copyToClipboard} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Failed Values */}
      {failedValues.length > 0 && (
        <CollapsibleSection
          title={`Failed Values (${failedValues.length})`}
          icon={<XCircle className="w-5 h-5 text-red-400" />}
          isExpanded={expandedSections.failed}
          onToggle={() => toggleSection('failed')}
          color="red"
        >
          <div className="space-y-2">
            {failedValues.map((item, i) => (
              <div key={i} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm text-red-400 font-mono">{item.key}</code>
                  <XCircle className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-sm text-gray-400 mb-1">Error: {item.error}</p>
                {item.status && (
                  <p className="text-xs text-gray-500">Status Code: {item.status}</p>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Non-Matched Values */}
      {nonMatchedValues.length > 0 && (
        <CollapsibleSection
          title={`Non-Matched Values (${nonMatchedValues.length})`}
          icon={<AlertCircle className="w-5 h-5 text-yellow-400" />}
          isExpanded={expandedSections.nonMatched}
          onToggle={() => toggleSection('nonMatched')}
          color="yellow"
        >
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-3">
            <p className="text-sm text-yellow-200">
              These values were generated but don't match any fields in your Funnels snapshot template.
              You may need to manually add these custom values to your funnel template.
            </p>
          </div>
          <div className="space-y-2">
            {nonMatchedValues.map((item, i) => (
              <ValueCard key={i} item={item} type="nonMatched" onCopy={copyToClipboard} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* CSS Code section removed - colors now pushed as custom values */}

      {/* Errors */}
      {operation.errors && operation.errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            Operation Errors
          </h4>
          <div className="space-y-2">
            {operation.errors.map((err, i) => {
              // Handle different error formats: string, {message}, {key, error}, etc.
              const errorMessage = typeof err === 'string'
                ? err
                : err.message || err.error || JSON.stringify(err);
              const errorKey = err.key || null;

              return (
                <div key={i} className="bg-black/30 rounded p-3">
                  {errorKey && (
                    <code className="text-xs text-red-400 font-mono mb-1 block">{errorKey}</code>
                  )}
                  <p className="text-sm text-gray-300">{errorMessage}</p>
                  {err.details && (
                    <p className="text-xs text-gray-500 mt-1">{err.details}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warnings */}
      {operation.warnings && operation.warnings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Warnings
          </h4>
          <div className="space-y-2">
            {operation.warnings.map((warning, i) => {
              const warningText = typeof warning === 'string'
                ? warning
                : warning.message || JSON.stringify(warning);
              return (
                <div key={i} className="bg-black/30 rounded p-3">
                  <p className="text-sm text-gray-300">{warningText}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {isCompleted && (
        <div className="bg-cyan/10 border border-cyan/30 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3 text-cyan">Next Steps</h3>
          <ol className="space-y-2 text-sm text-gray-300">
            <li className="flex gap-3">
              <span className="text-cyan font-bold">1.</span>
              <span>Go to your Funnels dashboard and open your funnel</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan font-bold">2.</span>
              <span>Verify that custom values are populated in your pages using merge tags like <code className="bg-black/50 px-1">{'{{custom_values.key_name}}'}</code></span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan font-bold">3.</span>
              <span>Copy the generated CSS code above and paste it into Settings → Custom CSS</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan font-bold">4.</span>
              <span>If any values failed or are non-matched, you may need to add them manually or update your snapshot template</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan font-bold">5.</span>
              <span>Preview your funnel to see all changes in action!</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

/**
 * Collapsible Section Component
 */
function CollapsibleSection({ title, icon, isExpanded, onToggle, color, children }) {
  const colorClasses = {
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400'
  };

  return (
    <div className={`border rounded-lg ${colorClasses[color]}`}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-black/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-current border-opacity-30">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Value Card Component
 */
function ValueCard({ item, type, onCopy }) {
  // Handle different value formats: 'value' for created, 'newValue' for updated
  const value = item.value || item.newValue || '';

  const getValueType = (key, val) => {
    if (!val) return 'text';
    if (key.includes('image') || key.includes('_url')) return 'image';
    if (key.includes('color') || /^#[0-9A-Fa-f]{6}$/.test(val)) return 'color';
    if (val.length > 100) return 'long_text';
    return 'text';
  };

  const valueType = getValueType(item.key || '', value);

  const bgColor = type === 'pushed' ? 'bg-green-500/10 border-green-500/30' :
    type === 'updated' ? 'bg-blue-500/10 border-blue-500/30' :
      'bg-yellow-500/10 border-yellow-500/30';

  return (
    <div className={`${bgColor} border rounded-lg p-3`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          {valueType === 'image' && <Image className="w-4 h-4 text-green-400 flex-shrink-0" />}
          {valueType === 'color' && <Palette className="w-4 h-4 text-purple-400 flex-shrink-0" />}
          {valueType === 'text' && <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />}
          {valueType === 'long_text' && <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />}

          <code className="text-sm font-mono break-all">{item.key}</code>
        </div>

        <button
          onClick={() => onCopy(value)}
          className="ml-2 p-1 hover:bg-black/30 rounded transition-colors flex-shrink-0"
          title="Copy value"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>

      <div className="text-sm text-gray-400">
        {valueType === 'image' ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan hover:underline break-all"
          >
            {value}
          </a>
        ) : valueType === 'color' ? (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-gray-600"
              style={{ backgroundColor: value }}
            />
            <span>{value}</span>
          </div>
        ) : (
          <p className={valueType === 'long_text' ? 'line-clamp-2' : 'truncate'}>
            {value}
          </p>
        )}
      </div>

      {type === 'nonMatched' && (
        <div className="mt-2 text-xs text-yellow-200 bg-black/30 rounded p-2">
          Not in Funnels snapshot - may need manual addition
        </div>
      )}
    </div>
  );
}

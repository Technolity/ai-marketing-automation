export const SLOT_INDICES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const PLAN_SLOT_LIMITS = {
  starter: 1,
  growth: 3,
  scale: 10,
  admin: 10,
};

function slotsForPlan(planTier) {
  const limit = PLAN_SLOT_LIMITS[planTier] ?? PLAN_SLOT_LIMITS.starter;
  return SLOT_INDICES.slice(0, limit);
}

export function buildSlotDisplayOptions({
  planTier = 'starter',
  isAdmin = false,
  allowedSlots,
  assignableSlots,
  takenSlots = [],
  provisionedSlots,
  currentAssignment = null,
} = {}) {
  const effectiveAllowedSlots = isAdmin ? SLOT_INDICES : (allowedSlots?.length ? allowedSlots : slotsForPlan(planTier));
  const allowedSet = new Set(effectiveAllowedSlots);
  const effectiveAssignableSlots = isAdmin ? SLOT_INDICES : (assignableSlots?.length ? assignableSlots : [...allowedSet]);
  const assignableSet = new Set(effectiveAssignableSlots);
  const takenSet = new Set(takenSlots);
  const provisionedSet = new Set(provisionedSlots?.length ? provisionedSlots : []);

  return SLOT_INDICES.map((slotIndex) => {
    const isCurrentAssignment = slotIndex === currentAssignment;
    const isAllowedByPlan = allowedSet.has(slotIndex);
    const isTakenByOther = takenSet.has(slotIndex);
    const isProvisioned = provisionedSet.size === 0 ? true : provisionedSet.has(slotIndex);
    const isSelectable = isCurrentAssignment || (isAllowedByPlan && assignableSet.has(slotIndex) && !isTakenByOther);

    let lockReason = null;
    if (!isAllowedByPlan) {
      lockReason = 'upgrade';
    } else if (isTakenByOther) {
      lockReason = 'taken';
    } else if (!assignableSet.has(slotIndex) && !isCurrentAssignment) {
      lockReason = 'unavailable';
    }

    return {
      slotIndex,
      prefix: `${String(slotIndex).padStart(2, '0')}_`,
      isAllowedByPlan,
      isTakenByOther,
      isCurrentAssignment,
      isProvisioned,
      isSelectable,
      lockReason,
      disabledLabel: getSlotDisabledLabel(lockReason),
    };
  });
}

function getSlotDisabledLabel(lockReason) {
  switch (lockReason) {
    case 'upgrade':
      return 'Upgrade to unlock';
    case 'taken':
      return 'Taken by another funnel';
    case 'unavailable':
      return 'Unavailable';
    default:
      return null;
  }
}

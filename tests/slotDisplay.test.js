import { describe, expect, it } from 'vitest';
import { buildSlotDisplayOptions } from '@/lib/ghl/slotDisplay';

describe('buildSlotDisplayOptions', () => {
  it('shows every slot while locking slots outside the starter plan', () => {
    const slots = buildSlotDisplayOptions({
      planTier: 'starter',
      allowedSlots: [3],
      assignableSlots: [3],
      takenSlots: [],
    });

    expect(slots).toHaveLength(10);
    expect(slots.map((slot) => slot.slotIndex)).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(slots[0]).toMatchObject({
      slotIndex: 3,
      isAllowedByPlan: true,
      isSelectable: true,
      lockReason: null,
    });
    expect(slots[1]).toMatchObject({
      slotIndex: 4,
      isAllowedByPlan: false,
      isSelectable: false,
      lockReason: 'upgrade',
    });
  });

  it('marks taken plan slots separately from upgrade-locked slots', () => {
    const slots = buildSlotDisplayOptions({
      planTier: 'growth',
      allowedSlots: [3, 4, 5],
      assignableSlots: [3, 5],
      takenSlots: [4],
    });

    expect(slots.find((slot) => slot.slotIndex === 4)).toMatchObject({
      isAllowedByPlan: true,
      isTakenByOther: true,
      isSelectable: false,
      lockReason: 'taken',
    });
    expect(slots.find((slot) => slot.slotIndex === 6)).toMatchObject({
      isAllowedByPlan: false,
      isTakenByOther: false,
      isSelectable: false,
      lockReason: 'upgrade',
    });
  });

  it('unlocks the first three slots for growth when API slot arrays are absent', () => {
    const slots = buildSlotDisplayOptions({ planTier: 'growth' });

    expect(slots.filter((slot) => slot.isSelectable).map((slot) => slot.slotIndex)).toEqual([3, 4, 5]);
    expect(slots.find((slot) => slot.slotIndex === 6)).toMatchObject({
      isAllowedByPlan: false,
      isSelectable: false,
      lockReason: 'upgrade',
    });
  });

  it('unlocks every slot for admin accounts', () => {
    const slots = buildSlotDisplayOptions({ planTier: 'admin' });

    expect(slots.filter((slot) => slot.isSelectable).map((slot) => slot.slotIndex)).toEqual([
      3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(slots.every((slot) => slot.lockReason === null)).toBe(true);
  });

  it('lets an admin flag override a stale starter allowed slot payload', () => {
    const slots = buildSlotDisplayOptions({
      planTier: 'starter',
      isAdmin: true,
      allowedSlots: [3],
      assignableSlots: [3],
    });

    expect(slots.filter((slot) => slot.isSelectable).map((slot) => slot.slotIndex)).toEqual([
      3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });
});

/**
 * Business Name Placeholder Replacer
 *
 * Replaces business-name fallback placeholders ('your company', 'Your Business',
 * 'The Business', '[Business Name]', '{businessName}', etc.) with the real
 * business name throughout already-generated vault content.
 *
 * Modeled on lib/vault/freeGiftReplacer.js (recursive object walker).
 *
 * IMPORTANT (anti-patterns avoided):
 * - Never regex over a stringified whole vault blob — recurse the object instead.
 * - Never partial-word replace — phrase literals use word boundaries; bracket/brace
 *   tokens are exact-token replacements so unrelated text isn't mangled.
 */

/**
 * Escape special regex characters in a string.
 * @param {string} string
 * @returns {string}
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Authoritative list of business-name fallback placeholders confirmed in
 * lib/prompts/ (contextHelper.js, funnelCopy.js, appointmentReminders.js,
 * emails-old.js, bio.js, fullContextPrompts.js, setterScript.js).
 *
 * Each entry:
 *  - literal: the placeholder text (for logging / reference)
 *  - boundary: when true, wrap with \b...\b so only whole phrases match (phrases
 *    made of word characters). When false, the literal already has non-word
 *    delimiters (brackets/braces) and is matched as an exact token.
 *
 * Order matters: more specific phrases first (e.g. '[Your Business Name]' before
 * '[Business Name]') so a longer placeholder is consumed before its substring.
 */
const BUSINESS_NAME_PLACEHOLDERS = [
    { literal: '[Your Business Name]', boundary: false },
    { literal: '[Business Name]', boundary: false },
    { literal: '{businessName}', boundary: false },
    { literal: 'Your Business', boundary: true },
    { literal: 'your company', boundary: true },
    { literal: 'Your Company', boundary: true },
    { literal: 'The Business', boundary: true }
];

/**
 * Replace all known business-name placeholders in a string.
 * @param {string} str
 * @param {string} businessName
 * @returns {{ value: string, count: number }}
 */
function replaceInString(str, businessName) {
    let value = str;
    let count = 0;

    for (const { literal, boundary } of BUSINESS_NAME_PLACEHOLDERS) {
        const escaped = escapeRegex(literal);
        // Word-boundary for plain phrases; exact-token for bracket/brace placeholders.
        const pattern = boundary ? `\\b${escaped}\\b` : escaped;
        const regex = new RegExp(pattern, 'g');
        const matches = value.match(regex);
        if (matches && matches.length > 0) {
            count += matches.length;
            value = value.replace(regex, businessName);
        }
    }

    return { value, count };
}

/**
 * Recursively replace business-name placeholders in any content shape.
 *
 * @param {string|object|array} content - Content to process
 * @param {string} businessName - The real business name
 * @returns {{ content: any, replacementsCount: number }}
 */
export function replaceBusinessNamePlaceholder(content, businessName) {
    // No-op if no real name provided
    if (!businessName || typeof businessName !== 'string' || !businessName.trim()) {
        return { content, replacementsCount: 0 };
    }

    const name = businessName.trim();

    if (typeof content === 'string') {
        const { value, count } = replaceInString(content, name);
        return { content: value, replacementsCount: count };
    }

    if (Array.isArray(content)) {
        let total = 0;
        const next = content.map((item) => {
            const r = replaceBusinessNamePlaceholder(item, name);
            total += r.replacementsCount;
            return r.content;
        });
        return { content: next, replacementsCount: total };
    }

    if (content && typeof content === 'object') {
        let total = 0;
        const next = {};
        for (const [key, value] of Object.entries(content)) {
            const r = replaceBusinessNamePlaceholder(value, name);
            total += r.replacementsCount;
            next[key] = r.content;
        }
        return { content: next, replacementsCount: total };
    }

    // Primitives (number, boolean, null, undefined) — return as-is
    return { content, replacementsCount: 0 };
}

/**
 * Apply business-name replacement across a full vault data blob / section.
 *
 * @param {object} vaultData - Section content or a map of sections
 * @param {string} businessName - The real business name
 * @returns {{ content: any, replacementsCount: number }}
 */
export function applyBusinessNameReplacement(vaultData, businessName) {
    if (vaultData === null || vaultData === undefined) {
        return { content: vaultData, replacementsCount: 0 };
    }
    return replaceBusinessNamePlaceholder(vaultData, businessName);
}

export const BUSINESS_NAME_PLACEHOLDER_LITERALS = BUSINESS_NAME_PLACEHOLDERS.map((p) => p.literal);

const businessNameReplacer = {
    replaceBusinessNamePlaceholder,
    applyBusinessNameReplacement,
    BUSINESS_NAME_PLACEHOLDER_LITERALS
};

export default businessNameReplacer;

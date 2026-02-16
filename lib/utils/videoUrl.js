/**
 * YouTube URL to Embed URL converter utility.
 * Converts various YouTube URL formats to embed-compatible URLs
 * for use in GHL funnel page iframes.
 */

/**
 * Extract video ID from various YouTube URL formats.
 * Returns null if URL is not a recognized YouTube URL.
 *
 * Supported formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - URLs with extra params (&t=30s, &list=..., &si=...)
 */
export function extractYouTubeVideoId(url) {
    if (!url || typeof url !== 'string') return null;

    const trimmed = url.trim();
    if (!trimmed) return null;

    try {
        const urlObj = new URL(trimmed);
        const hostname = urlObj.hostname.replace(/^www\./, '').replace(/^m\./, '');

        // youtube.com/watch?v=ID
        if (hostname === 'youtube.com' && urlObj.pathname === '/watch') {
            return urlObj.searchParams.get('v') || null;
        }

        // youtube.com/embed/ID
        if (hostname === 'youtube.com' && urlObj.pathname.startsWith('/embed/')) {
            const id = urlObj.pathname.split('/embed/')[1]?.split('/')[0];
            return id || null;
        }

        // youtube.com/shorts/ID
        if (hostname === 'youtube.com' && urlObj.pathname.startsWith('/shorts/')) {
            const id = urlObj.pathname.split('/shorts/')[1]?.split('/')[0];
            return id || null;
        }

        // youtu.be/ID
        if (hostname === 'youtu.be') {
            const id = urlObj.pathname.slice(1).split('/')[0];
            return id || null;
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Convert any YouTube URL to embed format.
 * Non-YouTube URLs (Vimeo, Wistia, direct video links, etc.) are returned as-is.
 * Empty/falsy inputs return empty string.
 */
export function toEmbedUrl(url) {
    if (!url || typeof url !== 'string') return '';

    const trimmed = url.trim();
    if (!trimmed) return '';

    const videoId = extractYouTubeVideoId(trimmed);

    // Not a YouTube URL — return as-is
    if (!videoId) return trimmed;

    return `https://www.youtube.com/embed/${videoId}`;
}

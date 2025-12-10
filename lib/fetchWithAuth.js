/**
 * Fetch wrapper for Clerk authentication
 * Relies on Clerk's automatic cookie handling for same-origin requests
 * @param {string} url - API endpoint
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export function fetchWithAuth(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    return fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Ensure cookies are sent with requests
    });
}

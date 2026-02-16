/**
 * YouTube URL to Embed URL Converter Test Suite
 * Tests for toEmbedUrl() and extractYouTubeVideoId() utilities
 */

import { describe, it, expect } from 'vitest';
import { toEmbedUrl, extractYouTubeVideoId } from '@/lib/utils/videoUrl';

const TEST_VIDEO_ID = 'dQw4w9WgXcQ';
const EXPECTED_EMBED = `https://www.youtube.com/embed/${TEST_VIDEO_ID}`;

describe('extractYouTubeVideoId', () => {
    it('extracts ID from standard watch URL', () => {
        expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(TEST_VIDEO_ID);
    });

    it('extracts ID from watch URL without www', () => {
        expect(extractYouTubeVideoId('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(TEST_VIDEO_ID);
    });

    it('extracts ID from mobile URL', () => {
        expect(extractYouTubeVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(TEST_VIDEO_ID);
    });

    it('extracts ID from youtu.be short URL', () => {
        expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe(TEST_VIDEO_ID);
    });

    it('extracts ID from shorts URL', () => {
        expect(extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(TEST_VIDEO_ID);
    });

    it('extracts ID from embed URL', () => {
        expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(TEST_VIDEO_ID);
    });

    it('extracts ID from URL with extra query params', () => {
        expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s&list=PLtest')).toBe(TEST_VIDEO_ID);
    });

    it('extracts ID from youtu.be with query params', () => {
        expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?si=abc123&t=10')).toBe(TEST_VIDEO_ID);
    });

    it('returns null for Vimeo URL', () => {
        expect(extractYouTubeVideoId('https://vimeo.com/123456789')).toBeNull();
    });

    it('returns null for Wistia URL', () => {
        expect(extractYouTubeVideoId('https://fast.wistia.com/medias/abc123')).toBeNull();
    });

    it('returns null for direct video URL', () => {
        expect(extractYouTubeVideoId('https://example.com/video.mp4')).toBeNull();
    });

    it('returns null for empty string', () => {
        expect(extractYouTubeVideoId('')).toBeNull();
    });

    it('returns null for null', () => {
        expect(extractYouTubeVideoId(null)).toBeNull();
    });

    it('returns null for undefined', () => {
        expect(extractYouTubeVideoId(undefined)).toBeNull();
    });

    it('returns null for invalid URL', () => {
        expect(extractYouTubeVideoId('not-a-url')).toBeNull();
    });
});

describe('toEmbedUrl', () => {
    it('converts standard watch URL to embed', () => {
        expect(toEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(EXPECTED_EMBED);
    });

    it('converts watch URL without www to embed', () => {
        expect(toEmbedUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(EXPECTED_EMBED);
    });

    it('converts mobile watch URL to embed', () => {
        expect(toEmbedUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(EXPECTED_EMBED);
    });

    it('converts youtu.be short URL to embed', () => {
        expect(toEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(EXPECTED_EMBED);
    });

    it('converts shorts URL to embed', () => {
        expect(toEmbedUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(EXPECTED_EMBED);
    });

    it('passes through already-embed URL', () => {
        expect(toEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(EXPECTED_EMBED);
    });

    it('strips extra query params and converts', () => {
        expect(toEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s&list=PLtest')).toBe(EXPECTED_EMBED);
    });

    it('passes through Vimeo URL unchanged', () => {
        const vimeoUrl = 'https://vimeo.com/123456789';
        expect(toEmbedUrl(vimeoUrl)).toBe(vimeoUrl);
    });

    it('passes through Wistia URL unchanged', () => {
        const wistiaUrl = 'https://fast.wistia.com/medias/abc123';
        expect(toEmbedUrl(wistiaUrl)).toBe(wistiaUrl);
    });

    it('passes through Cloudinary URL unchanged', () => {
        const cloudinaryUrl = 'https://res.cloudinary.com/demo/video/upload/dog.mp4';
        expect(toEmbedUrl(cloudinaryUrl)).toBe(cloudinaryUrl);
    });

    it('passes through direct video URL unchanged', () => {
        const directUrl = 'https://example.com/video.mp4';
        expect(toEmbedUrl(directUrl)).toBe(directUrl);
    });

    it('returns empty string for empty input', () => {
        expect(toEmbedUrl('')).toBe('');
    });

    it('returns empty string for null', () => {
        expect(toEmbedUrl(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(toEmbedUrl(undefined)).toBe('');
    });

    it('trims whitespace before processing', () => {
        expect(toEmbedUrl('  https://www.youtube.com/watch?v=dQw4w9WgXcQ  ')).toBe(EXPECTED_EMBED);
    });

    it('handles HTTP URLs (not just HTTPS)', () => {
        expect(toEmbedUrl('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(EXPECTED_EMBED);
    });
});

/**
 * Direct Media Library Mapper
 * Maps media URLs from Media Library section to GHL custom values without AI
 * Handles logos, images, videos, mockups, profile pics
 */

/**
 * Maps media library content to GHL custom value media fields
 * @param {object} mediaContent - The media section from vault content
 * @returns {object} - Key-value pairs for GHL media custom values
 */
export function mapMediaToGHLValues(mediaContent) {
    const result = {};

    console.log('[MediaMapper] Starting media library mapping...');
    console.log('[MediaMapper] Available media fields:', Object.keys(mediaContent || {}));

    // If no media content provided, return empty
    if (!mediaContent || typeof mediaContent !== 'object') {
        console.log('[MediaMapper] No media content provided');
        return result;
    }

    // Logo mapping (reused across multiple pages)
    if (mediaContent.logo || mediaContent.logoUrl || mediaContent.logo_url) {
        const logoUrl = mediaContent.logo || mediaContent.logoUrl || mediaContent.logo_url;
        result['02_optin_logo_image'] = logoUrl;
        result['02_vsl_logo_image'] = logoUrl; // Reused on VSL page
        result['02_booking_logo_image'] = logoUrl; // Reused on booking page
        result['02_thankyou_logo_image'] = logoUrl; // Reused on thank you page
        console.log('[MediaMapper] ✓ Logo mapped to 4 pages:', logoUrl);
    }

    // Optin page mockup/hero image
    if (mediaContent.mockup || mediaContent.mockupImage || mediaContent.optin_mockup || mediaContent.product_mockup) {
        const mockupUrl = mediaContent.mockup || mediaContent.mockupImage || mediaContent.optin_mockup || mediaContent.product_mockup;
        result['02_optin_mockup_image'] = mockupUrl;
        console.log('[MediaMapper] ✓ Optin mockup image:', mockupUrl);
    }

    // VSL video
    if (mediaContent.vslVideo || mediaContent.vsl_video || mediaContent.mainVideo || mediaContent.main_vsl) {
        const vslVideoUrl = mediaContent.vslVideo || mediaContent.vsl_video || mediaContent.mainVideo || mediaContent.main_vsl;
        result['02_vsl_video'] = vslVideoUrl;
        console.log('[MediaMapper] ✓ VSL video:', vslVideoUrl);
    }

    // Thank You page video
    if (mediaContent.thankYouVideo || mediaContent.thankyou_video || mediaContent.confirmationVideo) {
        const tyVideoUrl = mediaContent.thankYouVideo || mediaContent.thankyou_video || mediaContent.confirmationVideo;
        result['02_thankyou_page_video'] = tyVideoUrl;
        console.log('[MediaMapper] ✓ Thank You video:', tyVideoUrl);
    }

    // Bio photo
    if (mediaContent.bioPhoto || mediaContent.bio_photo || mediaContent.profilePhoto || mediaContent.bio_author) {
        const bioPhotoUrl = mediaContent.bioPhoto || mediaContent.bio_photo || mediaContent.profilePhoto || mediaContent.bio_author;
        result['02_vsl_bio_photo_text'] = bioPhotoUrl;
        console.log('[MediaMapper] ✓ Bio photo:', bioPhotoUrl);
    }

    // Testimonial profile pictures (4 pics)
    const testimonialPics = [
        { field: 'testimonial1Photo', altField: 'testimonial_1_photo', ghlKey: '02_vsl_testimonials_profile_pic_1' },
        { field: 'testimonial2Photo', altField: 'testimonial_2_photo', ghlKey: '02_vsl_testimonials_profile_pic_2' },
        { field: 'testimonial3Photo', altField: 'testimonial_3_photo', ghlKey: '02_vsl_testimonials_profile_pic_3' },
        { field: 'testimonial4Photo', altField: 'testimonial_4_photo', ghlKey: '02_vsl_testimonials_profile_pic_4' }
    ];

    let testimonialsMapped = 0;
    for (const pic of testimonialPics) {
        // Try multiple field name variations
        const photoUrl = mediaContent[pic.field] ||
            (pic.altField && mediaContent[pic.altField]) ||
            mediaContent[pic.field.toLowerCase()] ||
            mediaContent[`testimonial_${pic.field.match(/\d+/)?.[0]}_photo`] ||
            mediaContent[`testimonialPhoto${pic.field.match(/\d+/)?.[0]}`];

        if (photoUrl) {
            result[pic.ghlKey] = photoUrl;
            testimonialsMapped++;
            console.log(`[MediaMapper] ✓ Testimonial ${pic.field.match(/\d+/)?.[0]} photo: ${photoUrl}`);
        }
    }

    // Fallback: If testimonial photos not found individually, check for array
    if (testimonialsMapped === 0 && mediaContent.testimonialPhotos && Array.isArray(mediaContent.testimonialPhotos)) {
        mediaContent.testimonialPhotos.slice(0, 4).forEach((photoUrl, index) => {
            if (photoUrl) {
                result[`02_vsl_testimonials_profile_pic_${index + 1}`] = photoUrl;
                testimonialsMapped++;
                console.log(`[MediaMapper] ✓ Testimonial ${index + 1} photo (from array): ${photoUrl}`);
            }
        });
    }

    const mappedCount = Object.keys(result).length;
    console.log(`[MediaMapper] Complete: ${mappedCount} media values mapped`);

    return result;
}

/**
 * Validates media library content
 * @param {object} mediaContent - The media section from vault content
 * @returns {object} - Validation result with warnings
 */
export function validateMediaContent(mediaContent) {
    const warnings = [];
    const stats = {
        hasLogo: false,
        hasMockup: false,
        hasVslVideo: false,
        hasThankYouVideo: false,
        hasBioPhoto: false,
        testimonialPhotos: 0
    };

    if (!mediaContent || typeof mediaContent !== 'object') {
        warnings.push({ issue: 'No media content provided' });
        return { stats, warnings };
    }

    // Check for essential media
    stats.hasLogo = !!(mediaContent.logo || mediaContent.logoUrl || mediaContent.logo_url);
    stats.hasMockup = !!(mediaContent.mockup || mediaContent.mockupImage || mediaContent.optin_mockup);
    stats.hasVslVideo = !!(mediaContent.vslVideo || mediaContent.vsl_video || mediaContent.mainVideo);
    stats.hasThankYouVideo = !!(mediaContent.thankYouVideo || mediaContent.thankyou_video || mediaContent.confirmationVideo);
    stats.hasBioPhoto = !!(mediaContent.bioPhoto || mediaContent.bio_photo || mediaContent.profilePhoto);

    // Count testimonial photos
    const testimonialFields = [
        'testimonial1Photo', 'testimonial2Photo', 'testimonial3Photo', 'testimonial4Photo'
    ];
    testimonialFields.forEach(field => {
        if (mediaContent[field] || mediaContent[field.toLowerCase()]) {
            stats.testimonialPhotos++;
        }
    });

    // Check for testimonial photos array
    if (stats.testimonialPhotos === 0 && mediaContent.testimonialPhotos && Array.isArray(mediaContent.testimonialPhotos)) {
        stats.testimonialPhotos = mediaContent.testimonialPhotos.filter(url => url).length;
    }

    // Generate warnings
    if (!stats.hasLogo) {
        warnings.push({ issue: 'Missing logo image' });
    }

    if (!stats.hasVslVideo) {
        warnings.push({ issue: 'Missing VSL video URL' });
    }

    if (stats.testimonialPhotos < 4) {
        warnings.push({ issue: `Only ${stats.testimonialPhotos} testimonial photos found (expected 4)` });
    }

    return { stats, warnings };
}

export default {
    mapMediaToGHLValues,
    validateMediaContent
};

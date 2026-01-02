import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { mapSessionToCustomValues, getSessionImages } from '@/lib/ghl/customValueMapper';

/**
 * GET /api/ghl/available-values
 * Fetches all available custom values for a session, organized by category
 * Used by the selective push UI to show users what values can be pushed
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        // Fetch session data
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('saved_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Fetch generated images
        const images = await getSessionImages(sessionId);

        // Generate all custom values
        const allValues = mapSessionToCustomValues(session, images);

        // Categorize values based on key prefixes
        const categories = {
            optin: {
                name: '🎯 Optin Page',
                description: 'Lead capture page elements',
                values: {}
            },
            vsl_hero: {
                name: '🎬 VSL Hero Section',
                description: 'Video sales letter hero area',
                values: {}
            },
            vsl_process: {
                name: '📋 VSL Process Section',
                description: 'How it works steps',
                values: {}
            },
            vsl_testimonial: {
                name: '⭐ VSL Testimonials',
                description: 'Social proof section',
                values: {}
            },
            vsl_bio: {
                name: '👤 VSL Bio Section',
                description: 'About the founder/expert',
                values: {}
            },
            vsl_cta: {
                name: '🚀 VSL Call-to-Action',
                description: 'Main conversion section',
                values: {}
            },
            vsl_faq: {
                name: '❓ VSL FAQ Section',
                description: 'Frequently asked questions',
                values: {}
            },
            questionnaire: {
                name: '📝 Questionnaire Page',
                description: 'Application/survey form',
                values: {}
            },
            thankyou: {
                name: '✅ Thank You Page',
                description: 'Post-conversion page',
                values: {}
            },
            booking: {
                name: '📅 Booking Page',
                description: 'Calendar scheduling',
                values: {}
            },
            company: {
                name: '🏢 Company Info',
                description: 'Footer and contact details',
                values: {}
            },
            email: {
                name: '📧 Email Sequence',
                description: 'Automated email content',
                values: {}
            },
            survey: {
                name: '📊 Survey Styling',
                description: 'Survey UI colors',
                values: {}
            },
            video: {
                name: '🎥 Video URLs',
                description: 'Video content links',
                values: {}
            },
            other: {
                name: '📄 Other Values',
                description: 'Miscellaneous settings',
                values: {}
            }
        };

        // Sort values into categories based on key prefix
        Object.entries(allValues).forEach(([key, value]) => {
            const lowerKey = key.toLowerCase();

            if (lowerKey.startsWith('optin_')) {
                categories.optin.values[key] = value;
            } else if (lowerKey.startsWith('vsl_hero') || lowerKey === 'vsl_hero_acknowledgement_pill') {
                categories.vsl_hero.values[key] = value;
            } else if (lowerKey.startsWith('vsl_process') || lowerKey.includes('process_description')) {
                categories.vsl_process.values[key] = value;
            } else if (lowerKey.startsWith('vsl_testimonial')) {
                categories.vsl_testimonial.values[key] = value;
            } else if (lowerKey.startsWith('vsl_bio')) {
                categories.vsl_bio.values[key] = value;
            } else if (lowerKey.startsWith('vsl_cta')) {
                categories.vsl_cta.values[key] = value;
            } else if (lowerKey.startsWith('vsl_faq')) {
                categories.vsl_faq.values[key] = value;
            } else if (lowerKey.startsWith('questionnaire') || lowerKey.startsWith('question_')) {
                categories.questionnaire.values[key] = value;
            } else if (lowerKey.startsWith('thankyou')) {
                categories.thankyou.values[key] = value;
            } else if (lowerKey.startsWith('booking')) {
                categories.booking.values[key] = value;
            } else if (lowerKey.startsWith('company_') || lowerKey.startsWith('footer')) {
                categories.company.values[key] = value;
            } else if (lowerKey.includes('email')) {
                categories.email.values[key] = value;
            } else if (lowerKey.startsWith('survey')) {
                categories.survey.values[key] = value;
            } else if (lowerKey.includes('video') || lowerKey === 'test_video') {
                categories.video.values[key] = value;
            } else {
                categories.other.values[key] = value;
            }
        });

        // Remove empty categories and add counts
        const filteredCategories = {};
        Object.entries(categories).forEach(([catKey, cat]) => {
            const count = Object.keys(cat.values).length;
            if (count > 0) {
                filteredCategories[catKey] = {
                    ...cat,
                    count
                };
            }
        });

        // Calculate totals
        const totalValues = Object.keys(allValues).length;
        const totalImages = images.length;

        return NextResponse.json({
            success: true,
            sessionId,
            totalValues,
            totalImages,
            categories: filteredCategories,
            allKeys: Object.keys(allValues),
            imageSlots: {
                logo: {
                    label: 'Business Logo',
                    key: 'optin_logo_image',
                    currentValue: allValues['optin_logo_image'] || null
                },
                bio_author: {
                    label: 'Bio / Author Photo',
                    key: 'vsl_bio_image',
                    currentValue: allValues['vsl_bio_image'] || null
                },
                product_mockup: {
                    label: 'Product Mockup',
                    key: 'optin_mockup_image',
                    currentValue: allValues['optin_mockup_image'] || null
                }
            }
        });

    } catch (error) {
        console.error('Available values error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

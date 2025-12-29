import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

/**
 * POST /api/voice-model/upload
 * 
 * Upload user content (video transcript, email, post, copy, note)
 * for TheirDNA™ voice style extraction.
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { contentType, title, rawContent, fileUrl } = body;

        // Validate content type
        const validTypes = ['video', 'email', 'post', 'copy', 'note'];
        if (!contentType || !validTypes.includes(contentType)) {
            return NextResponse.json({
                error: 'Invalid content type. Must be: video, email, post, copy, or note'
            }, { status: 400 });
        }

        // Validate content
        if (!rawContent || rawContent.trim().length < 50) {
            return NextResponse.json({
                error: 'Content must be at least 50 characters'
            }, { status: 400 });
        }

        // Check limits (5 of each type)
        const { count, error: countError } = await supabaseAdmin
            .from('user_voice_content')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('content_type', contentType);

        if (countError) {
            console.error('[VoiceUpload] Count error:', countError);
        } else if (count >= 5) {
            return NextResponse.json({
                error: `You can only upload 5 ${contentType}s. Please delete one to upload more.`,
                limit: 5,
                current: count
            }, { status: 400 });
        }

        // Insert the content
        const { data, error } = await supabaseAdmin
            .from('user_voice_content')
            .insert({
                user_id: userId,
                content_type: contentType,
                title: title || `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} ${new Date().toLocaleDateString()}`,
                raw_content: rawContent.trim(),
                file_url: fileUrl || null,
                word_count: rawContent.trim().split(/\s+/).length,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('[VoiceUpload] Insert error:', error);
            return NextResponse.json({
                error: 'Failed to save content',
                details: error.message
            }, { status: 500 });
        }

        // Update counts in voice profile
        await updateVoiceProfileCounts(userId);

        console.log(`[VoiceUpload] User ${userId} uploaded ${contentType}: ${data.id}`);

        return NextResponse.json({
            success: true,
            content: data,
            message: `${contentType} uploaded successfully. It will be analyzed shortly.`
        });

    } catch (error) {
        console.error('[VoiceUpload] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * GET /api/voice-model/upload
 * 
 * Get user's uploaded voice content
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const contentType = searchParams.get('type');

        let query = supabaseAdmin
            .from('user_voice_content')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (contentType) {
            query = query.eq('content_type', contentType);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[VoiceUpload] Fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
        }

        // Group by type with counts
        const byType = {
            video: data.filter(c => c.content_type === 'video'),
            email: data.filter(c => c.content_type === 'email'),
            post: data.filter(c => c.content_type === 'post'),
            copy: data.filter(c => c.content_type === 'copy'),
            note: data.filter(c => c.content_type === 'note')
        };

        const counts = {
            video: byType.video.length,
            email: byType.email.length,
            post: byType.post.length,
            copy: byType.copy.length,
            note: byType.note.length,
            total: data.length
        };

        return NextResponse.json({
            content: data,
            byType,
            counts,
            limits: {
                perType: 5,
                total: 25
            }
        });

    } catch (error) {
        console.error('[VoiceUpload] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/voice-model/upload
 * 
 * Delete a specific voice content item
 */
export async function DELETE(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const contentId = searchParams.get('id');

        if (!contentId) {
            return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
        }

        // Delete the content (cascade will handle embeddings)
        const { error } = await supabaseAdmin
            .from('user_voice_content')
            .delete()
            .eq('id', contentId)
            .eq('user_id', userId);

        if (error) {
            console.error('[VoiceUpload] Delete error:', error);
            return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
        }

        // Update counts
        await updateVoiceProfileCounts(userId);

        return NextResponse.json({ success: true, message: 'Content deleted' });

    } catch (error) {
        console.error('[VoiceUpload] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * Helper: Update voice profile counts
 */
async function updateVoiceProfileCounts(userId) {
    try {
        const { data: counts } = await supabaseAdmin
            .from('user_voice_content')
            .select('content_type')
            .eq('user_id', userId);

        if (!counts) return;

        const byType = {
            videos_count: counts.filter(c => c.content_type === 'video').length,
            emails_count: counts.filter(c => c.content_type === 'email').length,
            posts_count: counts.filter(c => c.content_type === 'post').length,
            copy_count: counts.filter(c => c.content_type === 'copy').length,
            notes_count: counts.filter(c => c.content_type === 'note').length,
            total_samples: counts.length
        };

        await supabaseAdmin
            .from('user_voice_profile')
            .upsert({
                user_id: userId,
                ...byType,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

    } catch (error) {
        console.error('[VoiceUpload] Profile update error:', error);
    }
}

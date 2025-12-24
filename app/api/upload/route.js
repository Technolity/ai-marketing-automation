import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// File upload configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const fileType = formData.get('type'); // 'image' or 'video'

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = fileType === 'video' 
            ? ALLOWED_VIDEO_TYPES 
            : ALLOWED_IMAGE_TYPES;

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { 
                    error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
                    receivedType: file.type
                },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { 
                    error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
                    fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`
                },
                { status: 400 }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}_${originalName}`;

        // Ensure upload directory exists
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = join(uploadDir, fileName);
        
        await writeFile(filePath, buffer);

        // Return public URL
        const publicUrl = `/uploads/${fileName}`;
        const fullUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${publicUrl}`;

        console.log('[Upload] File saved:', {
            fileName,
            type: file.type,
            size: `${(file.size / 1024).toFixed(2)}KB`,
            url: fullUrl
        });

        return NextResponse.json({
            success: true,
            fileName,
            fileType: file.type,
            fileSize: file.size,
            url: publicUrl,
            fullUrl
        });

    } catch (error) {
        console.error('[Upload] Error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to upload file',
                details: error.message 
            },
            { status: 500 }
        );
    }
}

// GET endpoint to check upload status
export async function GET() {
    return NextResponse.json({
        status: 'Upload endpoint ready',
        maxFileSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
        allowedImageTypes: ALLOWED_IMAGE_TYPES,
        allowedVideoTypes: ALLOWED_VIDEO_TYPES
    });
}


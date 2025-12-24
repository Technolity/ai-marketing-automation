import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// File upload configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
    try {
        // Check if Cloudinary is configured
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
            return NextResponse.json(
                { 
                    error: 'Cloudinary not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file.',
                    hint: 'Get free credentials at cloudinary.com'
                },
                { status: 500 }
            );
        }

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

        // Convert file to buffer for Cloudinary upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        const uploadResponse = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: fileType === 'video' ? 'video' : 'image',
                    folder: 'ai-marketing-uploads',
                    public_id: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
                    overwrite: false,
                    // For images, optimize
                    ...(fileType === 'image' && {
                        transformation: [
                            { quality: 'auto', fetch_format: 'auto' }
                        ]
                    })
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            uploadStream.end(buffer);
        });

        const publicUrl = uploadResponse.secure_url;

        console.log('[Upload] File uploaded to Cloudinary:', {
            fileName: file.name,
            type: file.type,
            size: `${(file.size / 1024).toFixed(2)}KB`,
            cloudinaryUrl: publicUrl,
            publicId: uploadResponse.public_id
        });

        return NextResponse.json({
            success: true,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            url: publicUrl,
            fullUrl: publicUrl, // Cloudinary URL is always publicly accessible
            cloudinaryPublicId: uploadResponse.public_id,
            cdnProvider: 'cloudinary'
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
    const isConfigured = Boolean(
        process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET
    );

    return NextResponse.json({
        status: isConfigured ? 'Upload endpoint ready (Cloudinary)' : 'Cloudinary not configured',
        cloudinaryConfigured: isConfigured,
        maxFileSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
        allowedImageTypes: ALLOWED_IMAGE_TYPES,
        allowedVideoTypes: ALLOWED_VIDEO_TYPES,
        cdnProvider: 'Cloudinary',
        ...(isConfigured && {
            cloudName: process.env.CLOUDINARY_CLOUD_NAME
        })
    });
}


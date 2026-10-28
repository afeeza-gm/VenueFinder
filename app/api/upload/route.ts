import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let imagePayload: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mime = file.type || 'image/jpeg';
      imagePayload = `data:${mime};base64,${buffer.toString('base64')}`;
    } else {
      const body = await req.json();
      imagePayload = body.image || body.file || body.url || null;
    }

    if (!imagePayload) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    const result = await uploadImageToCloudinary(imagePayload, 'venuefinder/venues');

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error: any) {
    console.error('Cloudinary API upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image to Cloudinary' },
      { status: 500 }
    );
  }
}

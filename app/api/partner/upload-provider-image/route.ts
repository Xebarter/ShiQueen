import { NextRequest, NextResponse } from 'next/server';
import { uploadProviderLogoServer } from '@/lib/firebase/storage-server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization token.' }, { status: 401 });
    }

    const idToken = authHeader.slice('Bearer '.length);
    const formData = await request.formData();
    const file = formData.get('file');
    const providerId = formData.get('providerId');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    if (typeof providerId !== 'string' || !providerId.trim()) {
      return NextResponse.json({ error: 'Provider ID is required.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const downloadUrl = await uploadProviderLogoServer(
      idToken,
      providerId.trim(),
      file.name,
      file.type || 'application/octet-stream',
      buffer
    );

    return NextResponse.json({ url: downloadUrl });
  } catch (error) {
    console.error('[SheQueen] upload-provider-image:', error);
    const message = error instanceof Error ? error.message : 'Upload failed.';
    const status =
      message.includes('sign-in') ||
      message.includes('only upload') ||
      message.includes('Admin access')
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

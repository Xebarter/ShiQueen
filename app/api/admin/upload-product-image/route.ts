import { NextRequest, NextResponse } from 'next/server';
import { uploadProductImageServer } from '@/lib/firebase/storage-server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization token.' }, { status: 401 });
    }

    const idToken = authHeader.slice('Bearer '.length);
    const formData = await request.formData();
    const file = formData.get('file');
    const productId = formData.get('productId');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    if (typeof productId !== 'string' || !productId.trim()) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const downloadUrl = await uploadProductImageServer(
      idToken,
      productId.trim(),
      file.name,
      file.type || 'application/octet-stream',
      buffer
    );

    return NextResponse.json({ url: downloadUrl });
  } catch (error) {
    console.error('[SheQueen] upload-product-image:', error);
    const message = error instanceof Error ? error.message : 'Upload failed.';
    const status = message.includes('sign-in') || message.includes('Admin access') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filePath = join(process.cwd(), 'public', 'uploads', params.filename);
    const fileBuffer = await readFile(filePath);

    const ext = params.filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === 'jpg' || ext === 'jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === 'png') {
      contentType = 'image/png';
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return new NextResponse('File not found', { status: 404 });
    }
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

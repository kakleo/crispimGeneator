import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Resolve any special hosting link formats (Google Drive, Dropbox) into raw stream links
function prepareTargetUrl(rawUrl: string): string {
  let clean = rawUrl.trim().replace(/^["']+|["']+$/g, '');

  // Google Drive share links -> lh3 direct image stream
  const driveFileMatch = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }
  const driveIdMatch = clean.match(/drive\.google\.com\/.*?[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveIdMatch && driveIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}`;
  }

  // Dropbox links -> raw=1 direct stream
  if (clean.includes('dropbox.com')) {
    clean = clean.replace(/([?&])dl=0\b/, '$1raw=1');
    if (!clean.includes('raw=1')) {
      clean += clean.includes('?') ? '&raw=1' : '?raw=1';
    }
    return clean;
  }

  return clean;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  const targetUrl = prepareTargetUrl(rawUrl);

  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    return NextResponse.json({ error: 'Invalid URL scheme. Must start with http:// or https://' }, { status: 400 });
  }

  try {
    const parsedTarget = new URL(targetUrl);

    // Fetch remote image with browser headers and same-origin Referer to bypass WordPress hotlink protection
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: `${parsedTarget.origin}/`,
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      // If Google Drive lh3 fails, try uc export fallback
      if (targetUrl.includes('lh3.googleusercontent.com/d/')) {
        const id = targetUrl.split('lh3.googleusercontent.com/d/')[1];
        if (id) {
          const fallbackRes = await fetch(`https://drive.google.com/uc?export=download&id=${id}`, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            },
            redirect: 'follow',
          });
          if (fallbackRes.ok) {
            const buf = await fallbackRes.arrayBuffer();
            const ct = fallbackRes.headers.get('content-type') || 'image/jpeg';
            return new Response(buf, {
              status: 200,
              headers: {
                'Content-Type': ct,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
              },
            });
          }
        }
      }

      return NextResponse.json(
        { error: `Upstream image fetch failed with status ${res.status} ${res.statusText}` },
        { status: res.status }
      );
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error: any) {
    console.error('Image proxy error for URL:', targetUrl, error);
    return NextResponse.json(
      { error: error?.message || 'Failed to proxy remote image' },
      { status: 502 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

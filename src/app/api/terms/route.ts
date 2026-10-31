import { NextRequest, NextResponse } from 'next/server';
import {
  getTermsMarkdown,
  getTermsHtmlAsync,
  saveTermsMarkdown,
  resetTermsToDefault,
} from '@/lib/terms';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const markdown = await getTermsMarkdown();
    const html = await getTermsHtmlAsync();

    return NextResponse.json({
      success: true,
      markdown,
      html,
    });
  } catch (error: any) {
    console.error('[API Terms GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch terms' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { markdown, action } = body;

    if (action === 'reset') {
      await resetTermsToDefault();
      const updatedMarkdown = await getTermsMarkdown();
      const updatedHtml = await getTermsHtmlAsync();

      return NextResponse.json({
        success: true,
        message: 'Terms & Conditions reset to default template',
        markdown: updatedMarkdown,
        html: updatedHtml,
      });
    }

    if (typeof markdown !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid markdown payload' },
        { status: 400 }
      );
    }

    await saveTermsMarkdown(markdown);
    const updatedHtml = await getTermsHtmlAsync();

    return NextResponse.json({
      success: true,
      message: 'Terms of Service saved successfully and reflected dynamically in preview and PDF',
      markdown,
      html: updatedHtml,
    });
  } catch (error: any) {
    console.error('[API Terms POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to save terms' },
      { status: 500 }
    );
  }
}

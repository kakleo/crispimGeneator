import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

export function getTermsHtml(variant: string = 'standard'): string {
  try {
    const termsPath = path.resolve(process.cwd(), 'content', 'terms.md');
    if (fs.existsSync(termsPath)) {
      const markdown = fs.readFileSync(termsPath, 'utf-8');
      return marked.parse(markdown) as string;
    }
  } catch (err) {
    console.error('Error reading terms markdown file:', err);
  }

  return `
    <h1>Terms & Conditions</h1>
    <p>Standard terms of service apply. For full details, please contact Nusa Flores Travel.</p>
  `;
}

import sanitizeHtml from 'sanitize-html';

export function sanitizeCustomHtml(dirty?: string): string {
  if (!dirty || typeof dirty !== 'string') return '';

  return sanitizeHtml(dirty, {
    allowedTags: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'br', 'span', 'div', 'table', 'thead', 'tbody', 'tr',
      'th', 'td', 'blockquote', 'hr'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      span: ['class', 'style'],
      div: ['class', 'style'],
      p: ['class', 'style'],
      table: ['class', 'style'],
      th: ['class', 'style'],
      td: ['class', 'style']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  });
}

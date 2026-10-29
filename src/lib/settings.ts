// Company and Brand Configuration
// Stored as constants in the Astro application (excluding from the Google Sheet)

export interface SiteSettings {
  company_name: string;
  website: string;
  whatsapp: string;
  instagram: string;
  logo_url: string;
  primary_green: string;
  accent_blue: string;
  exclude_red: string;
}

export const SITE_SETTINGS: SiteSettings = {
  company_name: 'Nusa Flores Travel',
  website: 'tourfloreskomodo.com',
  whatsapp: '+62 821-4473-7881',
  instagram: 'nusaflorestravel',
  logo_url: '/logo.png', // Default to logo.png
  primary_green: '#78c24e',
  accent_blue: '#1db8ee',
  exclude_red: '#cc0000',
};

// Helper to get site settings with environment variable overrides if provided
export function getSiteSettings(): SiteSettings {
  return {
    company_name: process.env.COMPANY_NAME || SITE_SETTINGS.company_name,
    website: process.env.COMPANY_WEBSITE || SITE_SETTINGS.website,
    whatsapp: process.env.COMPANY_WHATSAPP || SITE_SETTINGS.whatsapp,
    instagram: process.env.COMPANY_INSTAGRAM || SITE_SETTINGS.instagram,
    logo_url: process.env.COMPANY_LOGO_URL || SITE_SETTINGS.logo_url,
    primary_green: process.env.COLOR_PRIMARY_GREEN || SITE_SETTINGS.primary_green,
    accent_blue: process.env.COLOR_ACCENT_BLUE || SITE_SETTINGS.accent_blue,
    exclude_red: process.env.COLOR_EXCLUDE_RED || SITE_SETTINGS.exclude_red,
  };
}

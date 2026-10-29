import React from 'react';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/settings';
import { ArrowLeft, Building2, Palette, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const settings = getSiteSettings();

  return (
    <div className="bg-zinc-50 text-zinc-900 min-h-screen">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-zinc-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="h-9 flex items-center justify-center">
              <img src="/logo.png" alt="Nusa Flores Travel" className="max-h-9 max-w-[130px] object-contain" />
            </Link>
            <div className="border-l border-zinc-200 pl-3">
              <h1 className="font-semibold text-sm text-zinc-900 tracking-tight leading-none">Branding & Settings</h1>
              <p className="text-xs text-zinc-500 mt-1">Application constants excluded from Google Sheets</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-xs transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <form action="/api/logout" method="POST">
              <button
                type="submit"
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 px-2 py-1.5 rounded-md hover:bg-zinc-100 transition cursor-pointer"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Active Company Information</h2>
          <p className="text-sm text-zinc-500 mt-1">
            These settings are stored as code constants in{' '}
            <code className="text-zinc-800 bg-zinc-200/70 px-1.5 py-0.5 rounded text-xs font-mono">
              src/lib/settings.ts
            </code>{' '}
            so your Google Sheet remains a clean, single-sheet database for tour proposals only.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Info Card */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4 pb-3 border-b border-zinc-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Company & Contact Info</span>
            </h3>

            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-[11px] uppercase font-semibold text-zinc-400 tracking-wider">Company Name</dt>
                <dd className="text-zinc-900 font-medium text-sm mt-0.5">{settings.company_name}</dd>
              </div>

              <div>
                <dt className="text-[11px] uppercase font-semibold text-zinc-400 tracking-wider">Official Website</dt>
                <dd className="text-zinc-900 font-medium text-sm mt-0.5">
                  <a
                    href={`https://${settings.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{settings.website}</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
                </dd>
              </div>

              <div>
                <dt className="text-[11px] uppercase font-semibold text-zinc-400 tracking-wider">WhatsApp Contact</dt>
                <dd className="text-zinc-900 font-medium text-sm mt-0.5">{settings.whatsapp}</dd>
              </div>

              <div>
                <dt className="text-[11px] uppercase font-semibold text-zinc-400 tracking-wider">Instagram Handle</dt>
                <dd className="text-zinc-900 font-medium text-sm mt-0.5">@{settings.instagram}</dd>
              </div>

              <div>
                <dt className="text-[11px] uppercase font-semibold text-zinc-400 tracking-wider">Custom Logo URL</dt>
                <dd className="text-zinc-900 font-medium text-xs mt-0.5 font-mono">
                  {settings.logo_url || '/logo.png (Default)'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Colors & Brand Visuals */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-4 pb-3 border-b border-zinc-100 flex items-center gap-2">
                <Palette className="w-4 h-4 text-teal-600" />
                <span>Brand Colors</span>
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-6 h-6 rounded-md shadow-xs border border-zinc-300"
                      style={{ backgroundColor: settings.primary_green }}
                    ></span>
                    <span className="text-xs font-medium text-zinc-900">Primary Green (Footer & Inclusions)</span>
                  </div>
                  <span className="font-mono text-xs text-zinc-500">{settings.primary_green}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-6 h-6 rounded-md shadow-xs border border-zinc-300"
                      style={{ backgroundColor: settings.accent_blue }}
                    ></span>
                    <span className="text-xs font-medium text-zinc-900">Accent Blue (Day Banners)</span>
                  </div>
                  <span className="font-mono text-xs text-zinc-500">{settings.accent_blue}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-6 h-6 rounded-md shadow-xs border border-zinc-300"
                      style={{ backgroundColor: settings.exclude_red }}
                    ></span>
                    <span className="text-xs font-medium text-zinc-900">Exclude Red (Exclusion Badges)</span>
                  </div>
                  <span className="font-mono text-xs text-zinc-500">{settings.exclude_red}</span>
                </div>
              </div>
            </div>

            {/* Live Footer Preview Box */}
            <div>
              <span className="block text-[11px] uppercase font-semibold text-zinc-400 tracking-wider mb-2">
                Live Footer Preview
              </span>
              <div className="rounded-lg overflow-hidden border border-zinc-200 shadow-xs">
                <div className="h-10 bg-[#00897b] flex justify-center items-center gap-6 text-xs text-white">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 fill-none stroke-white stroke-[1.6]" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9.5"></circle>
                      <path d="M2.5 12h19M12 2.5c3 3 3 16 0 19M12 2.5c-3 3-3 16 0 19"></path>
                    </svg>
                    <span>{settings.website}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 fill-none stroke-white stroke-[1.6]" viewBox="0 0 24 24">
                      <path d="M4 20l1.3-4.2A8.5 8.5 0 1 1 8.4 18.8z"></path>
                      <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2z"></path>
                    </svg>
                    <span>{settings.whatsapp}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 fill-none stroke-white stroke-[1.6]" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="5"></rect>
                      <circle cx="12" cy="12" r="4"></circle>
                      <circle cx="17.2" cy="6.8" r=".6"></circle>
                    </svg>
                    <span>{settings.instagram}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Code Constant Reference */}
        <div className="mt-8 bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
          <h3 className="text-sm font-semibold text-zinc-900 mb-1">
            Source Code Constant (
            <code className="text-xs text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded font-mono">
              src/lib/settings.ts
            </code>
            )
          </h3>
          <p className="text-xs text-zinc-500 mb-4">
            To modify these values in code, simply edit{' '}
            <code className="font-mono text-zinc-700">src/lib/settings.ts</code>, or set environment variables in your{' '}
            <code className="font-mono text-zinc-700">.env</code> file.
          </p>
          <pre className="bg-zinc-900 p-4 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-zinc-800">
{`export const SITE_SETTINGS: SiteSettings = {
  company_name: '${settings.company_name}',
  website: '${settings.website}',
  whatsapp: '${settings.whatsapp}',
  instagram: '${settings.instagram}',
  logo_url: '${settings.logo_url}',
  primary_green: '${settings.primary_green}',
  accent_blue: '${settings.accent_blue}',
  exclude_red: '${settings.exclude_red}',
};`}
          </pre>
        </div>
      </main>
    </div>
  );
}

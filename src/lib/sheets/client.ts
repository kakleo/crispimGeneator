import fs from 'fs';
import path from 'path';
import type { SheetData, RawRow } from '../schema/types';
import { sheetCache } from './cache';
import { DEFAULT_FIXTURES } from './fixtures';

const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby6PZ6tShZMo6hKsR9tXIP1TTRD4b5uqr5sTQ1mFT1nDRlysOlZVp3uKKx0L3CetZh8/exec';

function getAppsScriptUrl(): string {
  if (process.env.GOOGLE_APPS_SCRIPT_URL && process.env.GOOGLE_APPS_SCRIPT_URL.trim()) {
    return process.env.GOOGLE_APPS_SCRIPT_URL.trim();
  }

  // Fallback: dynamically read .env from disk so updates are picked up immediately
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/GOOGLE_APPS_SCRIPT_URL\s*=\s*["']?([^"'\r\n]+)["']?/);
      if (match && match[1]) {
        process.env.GOOGLE_APPS_SCRIPT_URL = match[1].trim();
        return match[1].trim();
      }
    }
  } catch (e) {
    // ignore
  }

  return DEFAULT_APPS_SCRIPT_URL;
}

const TAB_PROPOSALS = process.env.TAB_PROPOSALS || 'Proposals';
const TAB_ITINERARY = process.env.TAB_ITINERARY || 'Itinerary';
const TAB_PRICING = process.env.TAB_PRICING || 'Pricing';
const TAB_INCLUSIONS = process.env.TAB_INCLUSIONS || 'Inclusions';
const TAB_SETTINGS = process.env.TAB_SETTINGS || 'Settings';

function rowsToObjects(values?: any[][] | null): RawRow[] {
  if (!values || values.length === 0) return [];
  const headers = values[0].map((h: any) => String(h || '').trim());
  const rows: RawRow[] = [];

  for (let i = 1; i < values.length; i++) {
    const rowValues = values[i];
    const rowObj: RawRow = {};
    let hasAnyData = false;

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (!header) continue;
      const cellValue = rowValues[j] !== undefined ? rowValues[j] : '';
      rowObj[header] = cellValue;
      if (cellValue !== '') hasAnyData = true;
    }

    if (hasAnyData) {
      rows.push(rowObj);
    }
  }

  return rows;
}

export async function fetchSheetData(forceRefresh: boolean = false): Promise<{
  data: SheetData;
  isStale: boolean;
  lastUpdated: string;
}> {
  if (!forceRefresh) {
    const cached = sheetCache.get();
    if (cached) {
      return cached;
    }
  }

  const appsScriptUrl = getAppsScriptUrl();

  // 1. Google Apps Script Web App Provider (simpler setup without GCP project/service account)
  if (appsScriptUrl) {
    try {
      const res = await fetch(appsScriptUrl, {
        redirect: 'follow',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!res.ok) {
        throw new Error(`Google Apps Script returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.error) {
        throw new Error(`Google Apps Script error: ${json.error}`);
      }

      const sheetData: SheetData = {
        proposals: Array.isArray(json.proposals) ? json.proposals : [],
        itinerary: Array.isArray(json.itinerary) ? json.itinerary : [],
        pricing: Array.isArray(json.pricing) ? json.pricing : [],
        inclusions: Array.isArray(json.inclusions) ? json.inclusions : [],
        settings: Array.isArray(json.settings) ? json.settings : [],
      };

      sheetCache.set(sheetData);

      return {
        data: sheetData,
        isStale: false,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching from Google Apps Script Web App:', error);

      // FR-5: Serve stale cache if available
      const stale = sheetCache.getStaleBackup();
      if (stale) {
        return stale;
      }

      return {
        data: DEFAULT_FIXTURES,
        isStale: true,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  // 2. Official Google Sheets API Service Account Provider
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (clientEmail && privateKey && spreadsheetId) {
    try {
      const { google } = await import('googleapis');
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      const sheets = google.sheets({ version: 'v4', auth });

      const ranges = [
        `${TAB_PROPOSALS}!A:Z`,
        `${TAB_ITINERARY}!A:Z`,
        `${TAB_PRICING}!A:Z`,
        `${TAB_INCLUSIONS}!A:Z`,
        `${TAB_SETTINGS}!A:Z`,
      ];

      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
      });

      const valueRanges = response.data.valueRanges || [];

      const sheetData: SheetData = {
        proposals: rowsToObjects(valueRanges[0]?.values),
        itinerary: rowsToObjects(valueRanges[1]?.values),
        pricing: rowsToObjects(valueRanges[2]?.values),
        inclusions: rowsToObjects(valueRanges[3]?.values),
        settings: rowsToObjects(valueRanges[4]?.values),
      };

      sheetCache.set(sheetData);

      return {
        data: sheetData,
        isStale: false,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching data from Google Sheets API:', error);

      const stale = sheetCache.getStaleBackup();
      if (stale) {
        return stale;
      }

      return {
        data: DEFAULT_FIXTURES,
        isStale: true,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  // 3. Built-in default fixtures (when no credentials configured yet)
  sheetCache.set(DEFAULT_FIXTURES);
  return {
    data: DEFAULT_FIXTURES,
    isStale: false,
    lastUpdated: new Date().toISOString(),
  };
}

export async function checkSheetsHealth(): Promise<{ ok: boolean; message: string; mode: string }> {
  // If using Google Apps Script Web App
  const appsScriptUrl = getAppsScriptUrl();
  if (appsScriptUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(appsScriptUrl, {
        redirect: 'follow',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return {
          ok: true,
          message: 'Google Apps Script Web App connected successfully',
          mode: 'apps-script',
        };
      }
      return {
        ok: false,
        message: `Google Apps Script returned HTTP ${res.status}`,
        mode: 'apps-script',
      };
    } catch (err: any) {
      return {
        ok: false,
        message: err?.message || 'Google Apps Script connection error',
        mode: 'apps-script',
      };
    }
  }

  // If using Google Service Account
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (clientEmail && privateKey && spreadsheetId) {
    try {
      const { google } = await import('googleapis');
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'properties.title',
      });

      return { ok: true, message: 'Google Sheets API connected successfully', mode: 'service-account' };
    } catch (err: any) {
      return { ok: false, message: err?.message || 'Google Sheets API connection failed', mode: 'error' };
    }
  }

  // Fixture mode
  return {
    ok: true,
    message: 'Running with local fixtures (no Google Sheet or Apps Script URL configured)',
    mode: 'fixture',
  };
}

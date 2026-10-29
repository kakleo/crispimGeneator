// Automated Verification Test for Tour Proposal Generator
import http from 'http';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body.toString('utf-8'),
          rawBody: body,
        });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function runTests() {
  console.log(`Testing server at 127.0.0.1:${PORT}`);
  console.log('--- TEST 1: Health check (/health) ---');
  const healthRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/health',
    method: 'GET',
  });
  console.log('Status:', healthRes.statusCode);
  console.log('Body:', healthRes.body);
  if (healthRes.statusCode !== 200) throw new Error('Health check failed');

  console.log('\n--- TEST 2: Unauthenticated / redirect ---');
  const unauthRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/',
    method: 'GET',
  });
  console.log('Status:', unauthRes.statusCode);
  console.log('Location:', unauthRes.headers.location);
  if (unauthRes.statusCode !== 302 || !unauthRes.headers.location.includes('/login')) {
    throw new Error('Unauthenticated redirect failed');
  }

  console.log('\n--- TEST 3: Login with invalid credentials ---');
  const badLoginRes = await request(
    {
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    JSON.stringify({ username: 'admin', password: 'wrongpassword' })
  );
  console.log('Status:', badLoginRes.statusCode);
  console.log('Body:', badLoginRes.body);
  if (badLoginRes.statusCode !== 401 || !badLoginRes.body.includes('Incorrect username or password')) {
    throw new Error('Bad login check failed');
  }

  console.log('\n--- TEST 4: Login with valid credentials (admin / admin123) ---');
  const goodLoginRes = await request(
    {
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    JSON.stringify({ username: 'admin', password: 'admin123', next: '/' })
  );
  console.log('Status:', goodLoginRes.statusCode);
  console.log('Body:', goodLoginRes.body);
  const cookieHeader = goodLoginRes.headers['set-cookie'];
  console.log('Set-Cookie:', cookieHeader);
  if (goodLoginRes.statusCode !== 200 || !cookieHeader) {
    throw new Error('Good login failed');
  }

  const sessionCookie = cookieHeader[0].split(';')[0];
  console.log('Extracted cookie:', sessionCookie);

  console.log('\n--- TEST 5: Authenticated Dashboard (/) ---');
  const dashRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/',
    method: 'GET',
    headers: { Cookie: sessionCookie },
  });
  console.log('Status:', dashRes.statusCode);
  const hasFlores = dashRes.body.includes('FLORES OVERLAND TOUR 4 DAYS');
  console.log('Contains Flores Overland Proposal:', hasFlores);
  if (dashRes.statusCode !== 200 || !hasFlores) {
    throw new Error('Dashboard render failed');
  }

  console.log('\n--- TEST 6: Proposal Preview (/p/flores-overland-4d) ---');
  const previewRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/p/flores-overland-4d',
    method: 'GET',
    headers: { Cookie: sessionCookie },
  });
  console.log('Status:', previewRes.statusCode);
  const hasItinerary = previewRes.body.includes('Journey to Moni');
  const hasPricing = previewRes.body.includes('PRICE INFORMATION');
  const hasInclusions =
    previewRes.body.includes('INCLUDE &amp; EXCLUDE') ||
    previewRes.body.includes('INCLUDE & EXCLUDE') ||
    previewRes.body.includes('include-exclude-section');
  const hasTerms = previewRes.body.includes('Terms') || previewRes.body.includes('terms-section');
  console.log('Contains Itinerary:', hasItinerary);
  console.log('Contains Pricing:', hasPricing);
  console.log('Contains Inclusions:', hasInclusions);
  console.log('Contains Terms:', hasTerms);
  if (previewRes.statusCode !== 200 || !hasItinerary || !hasPricing || !hasInclusions || !hasTerms) {
    throw new Error('Preview proposal render failed');
  }

  console.log('\n--- TEST 7: PDF Generation (/p/flores-overland-4d/pdf) ---');
  console.log('Launching headless Chromium print-to-PDF test...');
  const pdfRes = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/p/flores-overland-4d/pdf',
    method: 'GET',
    headers: { Cookie: sessionCookie },
  });
  console.log('Status:', pdfRes.statusCode);
  console.log('Content-Type:', pdfRes.headers['content-type']);
  console.log('Content-Disposition:', pdfRes.headers['content-disposition']);
  console.log('PDF byte size:', pdfRes.rawBody.length);
  const isPdf = pdfRes.rawBody.slice(0, 4).toString() === '%PDF';
  console.log('Valid PDF Magic Bytes (%PDF):', isPdf);

  console.log('PDF response body:', pdfRes.body);
  if (pdfRes.statusCode !== 200 || !isPdf || pdfRes.rawBody.length < 5000) {
    throw new Error('PDF Generation failed');
  }

  console.log('\n=== ALL 7 ACCEPTANCE TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});

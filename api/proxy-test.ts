// Simple test endpoint to verify API routes are working
export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test if we can call the image proxy
    const testImageUrl = 'https://httpbin.org/image/png';
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(testImageUrl)}`;
    
    // Get the base URL
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    
    console.log('Testing proxy at:', `${baseUrl}${proxyUrl}`);
    
    const proxyResponse = await fetch(`${baseUrl}${proxyUrl}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (test-client)'
      }
    });
    
    const result: any = {
      timestamp: new Date().toISOString(),
      apiStatus: '✅ API endpoints working',
      proxyTest: {
        url: proxyUrl,
        status: proxyResponse.status,
        statusText: proxyResponse.statusText,
        contentType: proxyResponse.headers.get('content-type'),
        isWorking: proxyResponse.ok && proxyResponse.headers.get('content-type')?.startsWith('image/')
      },
      instructions: {
        message: 'If proxyTest.isWorking is true, the image proxy is fixed!',
        nextStep: 'Try generating a new banner to test the complete flow'
      }
    };
    
    // Add error details if proxy failed
    if (!result.proxyTest.isWorking) {
      try {
        const errorText = await proxyResponse.text();
        result.proxyTest.errorPreview = errorText.substring(0, 300);
        
        if (errorText.includes('module.exports')) {
          result.proxyTest.issue = 'API endpoint still returning source code - may need server restart';
        } else if (errorText.includes('404') || errorText.includes('not found')) {
          result.proxyTest.issue = 'Proxy endpoint not found - check API routes';
        } else {
          result.proxyTest.issue = 'Unknown proxy error';
        }
      } catch (e) {
        result.proxyTest.issue = 'Could not read proxy error response';
      }
    }
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('Proxy test error:', error);
    res.status(500).json({
      error: 'Proxy test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 
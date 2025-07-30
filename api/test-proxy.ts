// Test endpoint to verify image proxy functionality
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
    // Test with a simple image URL (you can replace with your Flux URL)
    const testUrl = req.query.url || 'https://httpbin.org/image/png';
    
    console.log('Testing proxy with URL:', testUrl);
    
    // Test the proxy
    const proxyResponse = await fetch(`${req.headers.origin || 'http://localhost:8080'}/api/image-proxy?url=${encodeURIComponent(testUrl)}`);
    
    const result: any = {
      proxyUrl: `/api/image-proxy?url=${encodeURIComponent(testUrl)}`,
      testUrl: testUrl,
      proxyStatus: proxyResponse.status,
      proxyStatusText: proxyResponse.statusText,
      contentType: proxyResponse.headers.get('content-type'),
      contentLength: proxyResponse.headers.get('content-length'),
      isImage: proxyResponse.headers.get('content-type')?.startsWith('image/'),
      headers: Object.fromEntries(proxyResponse.headers.entries())
    };
    
    if (proxyResponse.ok && result.isImage) {
      result.status = '✅ Proxy working correctly';
    } else {
      result.status = '❌ Proxy not working';
      
      // Try to get error details
      try {
        const errorText = await proxyResponse.text();
        result.errorPreview = errorText.substring(0, 300);
      } catch (e) {
        result.errorPreview = 'Could not read error response';
      }
    }
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('Test proxy error:', error);
    res.status(500).json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 
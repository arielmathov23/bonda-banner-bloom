module.exports = async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'Missing URL parameter' });
    }

    // Validate that the URL is from allowed domains
    const allowedDomains = [
      'delivery-eu1.bfl.ai',
      'delivery-us1.bfl.ai',
      'api.bfl.ai',
      'openai.com',
      'supabase.co'
    ];
    
    const urlObj = new URL(url as string);
    const isAllowed = allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
    
    if (!isAllowed) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }

    console.log('Proxying image request to:', url);
    
    // Fetch the image
    const imageResponse = await fetch(url as string);
    
    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageResponse.status, imageResponse.statusText);
      return res.status(imageResponse.status).json({ 
        error: `Failed to fetch image: ${imageResponse.statusText}` 
      });
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', imageBuffer.byteLength);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send the image
    res.status(200).send(Buffer.from(imageBuffer));
    
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 
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

    console.log('🖼️ Proxying image request to:', url);
    
    // Fetch the image with proper headers
    const imageResponse = await fetch(url as string, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)',
        'Accept': 'image/png,image/jpeg,image/*,*/*',
        'Accept-Encoding': 'identity' // Prevent compression issues
      }
    });
    
    console.log('🖼️ Image response details:', {
      status: imageResponse.status,
      statusText: imageResponse.statusText,
      contentType: imageResponse.headers.get('content-type'),
      contentLength: imageResponse.headers.get('content-length'),
      headers: Object.fromEntries(imageResponse.headers.entries())
    });
    
    if (!imageResponse.ok) {
      console.error('❌ Failed to fetch image:', imageResponse.status, imageResponse.statusText);
      return res.status(imageResponse.status).json({ 
        error: `Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`,
        url: url,
        details: 'Image may have expired or be inaccessible'
      });
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer();
    const originalContentType = imageResponse.headers.get('content-type');
    
    console.log('🖼️ Image data retrieved:', {
      bufferSize: imageBuffer.byteLength,
      originalContentType: originalContentType,
      isImageType: originalContentType?.startsWith('image/')
    });
    
    // Validate that we got actual image data
    if (!originalContentType?.startsWith('image/')) {
      console.error('❌ Response is not an image:', {
        contentType: originalContentType,
        size: imageBuffer.byteLength,
        url: url
      });
      
      // Try to extract error message from HTML response
      let errorMessage = 'Unknown error';
      try {
        const textResponse = new TextDecoder().decode(imageBuffer.slice(0, 1000));
        if (textResponse.includes('error') || textResponse.includes('expired')) {
          errorMessage = 'Image URL has expired or is invalid';
        }
        console.log('🔍 Response preview:', textResponse.substring(0, 200));
      } catch (e) {
        // Ignore decode errors
      }
      
      return res.status(400).json({
        error: 'Invalid image response',
        details: errorMessage,
        contentType: originalContentType,
        url: url
      });
    }
    
    // Force correct content type for images
    const contentType = originalContentType.startsWith('image/') ? originalContentType : 'image/png';
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', imageBuffer.byteLength);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    console.log('✅ Serving image:', {
      finalContentType: contentType,
      size: imageBuffer.byteLength
    });
    
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
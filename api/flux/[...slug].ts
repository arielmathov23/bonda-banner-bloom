import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-key');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get the API key from environment variables
  const apiKey = process.env.VITE_FLUX_API_KEY || process.env.FLUX_API_KEY;
  
  if (!apiKey) {
    console.error('Flux API key not found in environment variables');
    return res.status(500).json({ 
      error: 'Flux API key not configured',
      details: 'API key not found in environment variables' 
    });
  }

  // Determine the target URL based on the request path
  const { slug } = req.query;
  const path = Array.isArray(slug) ? slug.join('/') : slug || '';
  
  // Handle different Flux API endpoints
  let targetUrl = '';
  if (path.startsWith('flux-pro-1.1')) {
    targetUrl = 'https://api.bfl.ai/v1/flux-pro-1.1';
  } else if (path.startsWith('get_result')) {
    targetUrl = `https://api.bfl.ai/v1/get_result${req.url?.includes('?') ? '?' + req.url.split('?')[1] : ''}`;
  } else if (path.includes('result')) {
    // Handle polling URLs that come from the Flux API response
    const resultId = path.split('/').pop();
    targetUrl = `https://api.bfl.ai/v1/get_result?id=${resultId}`;
  } else {
    // Default to the base URL with the path
    targetUrl = `https://api.bfl.ai/v1/${path}`;
  }

  console.log(`Proxying request to: ${targetUrl}`);
  console.log(`Method: ${req.method}`);

  try {
    // Prepare headers for the Flux API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-key': apiKey,
    };

    // Prepare the request options
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    // Add body for POST requests
    if (req.method === 'POST' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    // Make the request to the Flux API
    const response = await fetch(targetUrl, fetchOptions);
    
    // Get the response data
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Flux API error:', response.status, response.statusText, data);
      return res.status(response.status).json({
        error: 'Flux API error',
        status: response.status,
        statusText: response.statusText,
        details: data
      });
    }

    // Forward the successful response
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
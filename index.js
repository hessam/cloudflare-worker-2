addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Fetch the original response
  const response = await fetch(request);
  
  // Clone response to modify headers
  const newResponse = new Response(response.body, response);
  
  // ONLY add cache headers - NO HTML modifications
  if (request.url.match(/\.(png|jpg|jpeg|gif|ico|svg|webp)(\?.*)?$/)) {
    // Images: 1 year cache
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    newResponse.headers.set('Expires', new Date(Date.now() + 31536000000).toUTCString());
  } else if (request.url.match(/\.(css|js|woff|woff2|ttf|eot)(\?.*)?$/)) {
    // CSS/JS/Fonts: 1 month cache
    newResponse.headers.set('Cache-Control', 'public, max-age=2592000');
    newResponse.headers.set('Expires', new Date(Date.now() + 2592000000).toUTCString());
  }
  // HTML: 1 hour cache
  else if (request.url.includes('seyahatmarket.com') && !request.url.includes('wp-admin')) {
    newResponse.headers.set('Cache-Control', 'public, max-age=3600');
    newResponse.headers.set('Expires', new Date(Date.now() + 3600000).toUTCString());
  }
  
  // Return response WITHOUT any HTML modifications
  return newResponse;
}

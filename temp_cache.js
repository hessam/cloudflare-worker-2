// Add cache headers for static assets
if (request.url.match(/\.(png|jpg|jpeg|gif|ico|svg|webp)(\?.*)?$/)) {
  // Images: 1 year cache
  newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  newResponse.headers.set('Expires', new Date(Date.now() + 31536000000).toUTCString());
} else if (request.url.match(/\.(css|js|woff|woff2|ttf|eot)(\?.*)?$/)) {
  // CSS/JS/Fonts: 1 month cache
  newResponse.headers.set('Cache-Control', 'public, max-age=2592000');
  newResponse.headers.set('Expires', new Date(Date.now() + 2592000000).toUTCString());
}

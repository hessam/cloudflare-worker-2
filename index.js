export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ============================================
    // ASSET CACHING (Images, CSS, JS, Fonts)
    // ============================================
    const assetExtensions = /\.(jpg|jpeg|png|gif|webp|svg|css|js|woff|woff2|ttf|eot|ico|mp4|pdf)$/i;
    const isAsset = assetExtensions.test(url.pathname);

    if (isAsset) {
      const cache = caches.default;
      let response = await cache.match(request);

      if (!response) {
        response = await fetch(request);
        response = new Response(response.body, response);

        const extension = url.pathname.split('.').pop().toLowerCase();
        let maxAge;

        switch (extension) {
          case 'webp':
          case 'jpg':
          case 'jpeg':
          case 'png':
          case 'gif':
          case 'svg':
            maxAge = 31536000; // 1 year
            break;
          case 'woff':
          case 'woff2':
          case 'ttf':
          case 'eot':
            maxAge = 31536000; // 1 year
            break;
          case 'css':
          case 'js':
            maxAge = 2592000; // 30 days
            break;
          default:
            maxAge = 86400; // 1 day
        }

        response.headers.set('Cache-Control', `public, max-age=${maxAge}, immutable`);
        response.headers.set('CDN-Cache-Control', `public, max-age=${maxAge}`);

        ctx.waitUntil(cache.put(request, response.clone()));
      }

      return response;
    }

    // ============================================
    // HTML OPTIMIZATION - ALWAYS PROCESS
    // ============================================

    // Create a cache key that ignores query strings for HTML
    const cacheUrl = new URL(request.url);
    cacheUrl.search = ''; // Remove query strings for cache key
    const cacheKey = new Request(cacheUrl.toString(), request);
    const cache = caches.default;

    // Try to get from cache first
    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      // Add header to show it's from cache
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Worker-Cache', 'HIT');
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }

    // Fetch from origin
    let response = await fetch(request);

    // Only process HTML responses with 200 status
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('html') || response.status !== 200) {
      return response;
    }

    // ============================================
    // EXCLUDE WORDPRESS ADMIN AND BACKEND PAGES
    // ============================================
    const requestUrl = new URL(request.url);
    const adminPaths = [
      '/wp-admin',
      '/wp-login.php',
      '/wp-cron.php',
      '/xmlrpc.php',
      '/wp-json',
      '/wp-includes'
    ];

    // Check if this is an admin/backend path
    const isAdminPath = adminPaths.some(path => requestUrl.pathname.startsWith(path));
    if (isAdminPath) {
      return response; // Return unchanged
    }

    // Also exclude HTML responses for plugin/theme directories that might contain admin pages
    if (contentType.includes('text/html') &&
        (requestUrl.pathname.includes('/wp-content/plugins/') ||
         requestUrl.pathname.includes('/wp-content/themes/'))) {
      return response; // Don't modify plugin/theme HTML
    }

    let html = await response.text();

    // ============================================
    // CRITICAL: ADD PRECONNECT HINTS AT TOP OF <head>
    // ============================================
    const preconnectHints = `
  <!-- Critical Resource Hints -->
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="dns-prefetch" href="//www.googletagmanager.com">
  <link rel="dns-prefetch" href="//www.google-analytics.com">
  <link rel="dns-prefetch" href="//connect.facebook.net">
  <link rel="dns-prefetch" href="//static.cloudflareinsights.com">`;

    html = html.replace(/<head>/i, '<head>' + preconnectHints);

    // ============================================
    // FIX GOOGLE FONTS - CRITICAL!
    // ============================================

    // Replace ALL Google Fonts stylesheet links with optimized version
    html = html.replace(
      /<link([^>]*href=["']https:\/\/fonts\.googleapis\.com\/css[^"']*["'][^>]*)>/gi,
      (match, attrs) => {
        const hrefMatch = attrs.match(/href=["']([^"']+)["']/);
        const href = hrefMatch ? hrefMatch[1] : '';

        // Use preload + async loading pattern
        return `<!-- Font Optimized by Worker -->
<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${href}"></noscript>`;
      }
    );

    // Also handle any @import in style tags
    html = html.replace(
      /@import\s+url\(['"]?https:\/\/fonts\.googleapis\.com\/css[^'")]+['"]?\);?/gi,
      '/* Font import removed by worker - using preload instead */'
    );

    // ============================================
    // DEFER CSS FILES (Breakdance, WooCommerce, etc.)
    // ============================================

    // Defer post-specific CSS files
    html = html.replace(
      /<link([^>]*href=["'][^"']*\/css\/post-\d+\.css[^"']*["'][^>]*)>/gi,
      (match, attrs) => {
        const hrefMatch = attrs.match(/href=["']([^"']+)["']/);
        const href = hrefMatch ? hrefMatch[1] : '';
        return `<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${href}"></noscript>`;
      }
    );

    // Defer WooCommerce blocks CSS
    html = html.replace(
      /<link([^>]*href=["'][^"']*wc-blocks\.css[^"']*["'][^>]*)>/gi,
      (match, attrs) => {
        const hrefMatch = attrs.match(/href=["']([^"']+)["']/);
        const href = hrefMatch ? hrefMatch[1] : '';
        return `<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${href}"></noscript>`;
      }
    );

    // ============================================
    // OPTIMIZE IMAGES - DYNAMIC LCP DETECTION
    // ============================================

    // Function to identify LCP (Largest Contentful Paint) candidates
    function identifyLCPCandidates(html) {
      const lcpCandidates = [];

      // Method 1: First image in main content or hero section
      const mainContentMatch = html.match(/<main[^>]*>[\s\S]*?<\/main>/i) ||
                              html.match(/<div[^>]*class="[^"]*hero[^"]*"[^>]*>[\s\S]*?<\/div>/i) ||
                              html.match(/<section[^>]*class="[^"]*hero[^"]*"[^>]*>[\s\S]*?<\/section>/i);

      if (mainContentMatch) {
        const firstImgInMain = mainContentMatch[0].match(/<img[^>]+src="([^"]+)"/i);
        if (firstImgInMain) {
          lcpCandidates.push(firstImgInMain[1]);
        }
      }

      // Method 2: Images with specific classes or in specific positions
      const knownLCPImages = [
        'Reservation-768x960',
        'Vize-768x959',
        'background.webp',
        'Schengen-Vizesi',
        'cropped-Seyahat_Market'
      ];

      // Method 3: First few images in the page (top 3)
      const allImages = [];
      const imgRegex = /<img[^>]+src="([^"]+)"/gi;
      let match;
      let count = 0;
      while ((match = imgRegex.exec(html)) !== null && count < 3) {
        allImages.push(match[1]);
        count++;
      }

      // Combine all candidates, prioritizing known LCP images
      const allCandidates = [...new Set([...lcpCandidates, ...knownLCPImages, ...allImages.slice(0, 2)])];

      return allCandidates.slice(0, 5); // Limit to 5 candidates
    }

    const lcpImageUrls = identifyLCPCandidates(html);

    // Apply fetchpriority="high" to LCP candidates
    lcpImageUrls.forEach(imageUrl => {
      const urlRegex = new RegExp(`(<img[^>]*src="[^"]*${imageUrl}[^"]*"[^>]*>)`, 'gi');
      html = html.replace(urlRegex, (match) => {
        // Add fetchpriority if not present
        if (!match.includes('fetchpriority')) {
          // Remove loading="lazy" if present, then add fetchpriority
          let result = match.replace(/\s*loading="lazy"/gi, '');
          // Replace the closing > with attributes + >
          return result.slice(0, -1) + ' fetchpriority="high" loading="eager">';
        }
        return match;
      });
    });

    // Apply lazy loading to other images (not LCP candidates)
    html = html.replace(/(<img[^>]*src="[^"]*"[^>]*)>/gi, (match) => {
      // Skip if already has loading attribute or is an LCP candidate
      if (match.includes('loading=') || match.includes('fetchpriority="high"')) {
        return match;
      }

      // Add lazy loading to other images
      return match.slice(0, -1) + ' loading="lazy">';
    });

    // ============================================
    // DEFER JAVASCRIPT
    // ============================================

    // Defer jQuery Migrate
    html = html.replace(
      /<script([^>]*src=["'][^"']*jquery-migrate[^"']*["'][^>]*)><\/script>/gi,
      '<script$1 defer></script>'
    );

    // Defer jQuery UI scripts
    html = html.replace(
      /<script([^>]*src=["'][^"']*jquery-ui\/[^"']*\.js[^"']*["'][^>]*)><\/script>/gi,
      '<script$1 defer></script>'
    );

    // ============================================
    // PRELOAD CRITICAL FONTS
    // ============================================

    // Add font preloads right after opening <head>
    const fontPreloads = `
  <link rel="preload" as="font" type="font/woff2" href="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2" crossorigin>`;

    html = html.replace(
      preconnectHints,
      preconnectHints + fontPreloads
    );

    // ============================================
    // CLEANUP
    // ============================================

    // Remove admin bar CSS
    html = html.replace(
      /<link[^>]*wp-admin\/css\/[^>]*admin-bar[^>]*>/gi,
      '<!-- Admin bar removed by worker -->'
    );

    // ============================================
    // BUILD RESPONSE WITH PROPER HEADERS
    // ============================================

    const headers = new Headers({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=7200',
      'CDN-Cache-Control': 'public, max-age=7200',
      'X-Optimized-By': 'Cloudflare-Worker-v2.1',
      'X-Worker-Cache': 'MISS',
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Accept-Encoding'
    });

    // Copy important headers from origin
    const headersToKeep = [
      'content-security-policy',
      'strict-transport-security',
      'x-frame-options'
    ];

    headersToKeep.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    });

    const optimizedResponse = new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });

    // Store in cache for 1 hour
    ctx.waitUntil(cache.put(cacheKey, optimizedResponse.clone()));

    return optimizedResponse;
  }
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Add cache headers for better performance
  const response = await fetch(request);
  
  // Clone response to modify headers
  const newResponse = new Response(response.body, response);
  
  // Add cache headers for static assets
  if (request.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)(\?.*)?$/)) {
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    newResponse.headers.set('Expires', new Date(Date.now() + 31536000000).toUTCString());
  }
  
  // Add cache headers for HTML pages
  else if (request.url.includes('seyahatmarket.com') && !request.url.includes('wp-admin')) {
    newResponse.headers.set('Cache-Control', 'public, max-age=3600');
    newResponse.headers.set('Expires', new Date(Date.now() + 3600000).toUTCString());
  }
  
  const cookies = request.headers.get("Cookie") || "";
  return new HTMLRewriter()
    .on("head", new HeadOptimizer(cookies))
    .transform(newResponse);
}

class HeadOptimizer {
  constructor(cookies) {
    this.resourceOptimizer = new ResourceOptimizer();
    this.cookies = cookies;
    this.elementsToRemove = new Set([
      // Admin CSS (already working, kept for reference)
      ...(this.cookies.includes("wordpress_logged_in") ? [] : [
        'link[id="wpcode-admin-bar-css-css"]',
        'link[id="dashicons-css"]',
        'link[id="admin-bar-css"]'
      ]),
      // Templates (simplified selectors)
      'script[id="freeze-table-template"]',
      'script[id="tmpl-wcpt-product-form-loading-modal"]',
      'script[id="tmpl-wcpt-cart-checkbox-trigger"]',
      // Redundant DNS prefetch
      'link[href="//code.jquery.com"][rel="dns-prefetch"]'
    ]);
  }

  element(element) {
    const tagName = element.tagName.toLowerCase();
    const id = element.getAttribute("id");
    const src = element.getAttribute("src");
    const href = element.getAttribute("href");
    const rel = element.getAttribute("rel");

    // Add preload hints for critical resources
    if (tagName === "link" && rel === "stylesheet" && href && this.resourceOptimizer.isCritical(href)) {
      this.resourceOptimizer.addPreloadHint(href, "style");
    }
    if (tagName === "script" && src && this.resourceOptimizer.isCritical(src)) {
      this.resourceOptimizer.addPreloadHint(src, "script");
    }

    // Construct selector for matching
    let selector = tagName;
    if (id) selector += `[id="${id}"]`;
    if (src) selector += `[src*="${src}"]`;
    if (href && rel) selector += `[href*="${href}"][rel="${rel}"]`;

    // Remove specified elements
    if (this.elementsToRemove.has(selector)) {
      element.remove();
      return;
    }

    // Mark inline <style> tags for removal (content captured by StyleContentHandler)
    if (tagName === "style" && (!id || !id.includes("wp-fonts"))) {
      element.remove();
    }

    // Add defer to inline scripts (exclude GTM)
    if (tagName === "script" && !src && !element.textContent.includes("gtm.js")) {
      element.setAttribute("defer", "");
    }
  }

  after() {
    // Inject preload hints at the end of head
    if (this.resourceOptimizer.preloadHints.length > 0) {
      return new Response(this.resourceOptimizer.injectPreloadHints(), {
        headers: { "content-type": "text/html" }
      });
    }
  }
}



class ResourceOptimizer {
  constructor() {
    this.preloadHints = [];
    this.criticalResources = new Set([
      'wp-content/themes/',  // Theme CSS/JS
      'wp-includes/css/',    // Core WordPress CSS
      'wp-content/plugins/elementor/', // Elementor critical resources
    ]);
  }

  addPreloadHint(href, as, type = 'preload') {
    if (href && !this.preloadHints.some(h => h.href === href)) {
      this.preloadHints.push({ href, as, type });
    }
  }

  isCritical(href) {
    return Array.from(this.criticalResources).some(critical => href && href.includes(critical));
  }

  injectPreloadHints() {
    return this.preloadHints.map(hint => 
      `<link rel="${hint.type}" href="${hint.href}" as="${hint.as}"${hint.type === 'preload' ? ' crossorigin' : ''}>`
    ).join('\n');
  }
}

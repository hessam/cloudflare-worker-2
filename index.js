addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const response = await fetch(request);
  const cookies = request.headers.get("Cookie") || "";
  return new HTMLRewriter()
    .on("head", new HeadOptimizer(cookies))
    .transform(response);

}

class HeadOptimizer {
  constructor(cookies) {
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

    // Remove specified elements
    const selector = tagName + (id ? `[id="${id}"]` : "") + (src ? `[src="${src}"]` : "") + (href ? `[href="${href}"][rel="${rel}"]` : "");
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
}

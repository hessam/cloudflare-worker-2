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
    this.stylesToMerge = [];
  }

  element(element) {
    const tagName = element.tagName.toLowerCase();
    const id = element.getAttribute("id");
    const src = element.getAttribute("src");
    const href = element.getAttribute("href");
    const rel = element.getAttribute("rel");

    // Generate a precise selector
    let selector = tagName;
    if (id) selector += `[id="${id}"]`;
    if (src) selector += `[src="${src}"]`;
    if (href && rel) selector += `[href="${href}"][rel="${rel}"]`;

    // Remove specified elements
    if (this.elementsToRemove.has(selector)) {
      element.remove();
      return;
    }

    // Merge inline <style> tags (exclude wp-fonts)
    if (tagName === "style" && (!id || !id.includes("wp-fonts"))) {
      const content = element.getInnerHTML ? element.getInnerHTML() : element.textContent;
      if (content) this.stylesToMerge.push(content);
      element.remove();
    }

    // Add defer to inline scripts (exclude GTM)
    if (tagName === "script" && !src && !element.textContent.includes("gtm.js")) {
      element.setAttribute("defer", "");
    }
  }

  // Inject merged styles at the end of <head>
  after() {
    if (this.stylesToMerge.length > 0) {
      return new Response(`<style>${this.stylesToMerge.join("\n")}</style>`, {
        headers: { "content-type": "text/html" }
      });
    }
  }
}

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

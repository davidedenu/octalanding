export default {
  async fetch(request, env) {
    if (!env.ASSETS) {
      return new Response("Asset binding not available", { status: 500 });
    }

    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) {
      return response;
    }

    const url = new URL(request.url);
    url.pathname = "/index.html";
    return env.ASSETS.fetch(new Request(url, request));
  }
};

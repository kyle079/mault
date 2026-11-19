interface RequestTarget {
  fetch(request: Request): Promise<Response>;
}

export function routeRequest(
  request: Request,
  assets: RequestTarget,
  getApi: () => RequestTarget,
): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== "/api" && !url.pathname.startsWith("/api/")) {
    return assets.fetch(request);
  }
  url.pathname = url.pathname.slice(4) || "/";
  return getApi().fetch(new Request(url, request));
}

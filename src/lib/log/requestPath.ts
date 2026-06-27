const serverFnPrefix = "/_serverFn/";

// TanStack Start encodes server-function calls as /_serverFn/<base64>, where the
// base64 decodes to { file, export }. Rendered raw, that's a 200-char blob per
// request. Decode it to a readable `serverFn:<name>` instead.
export function prettyRequestPath(pathname: string): string {
  if (!pathname.startsWith(serverFnPrefix)) return pathname;

  const segment = pathname.slice(serverFnPrefix.length);
  try {
    // In the Workers runtime the segment arrives percent-encoded; decode it before
    // atob. Also normalise URL-safe base64 (-/_ -> +//) so atob doesn't reject it.
    const base64 = decodeURIComponent(segment).replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(base64)) as { file?: string; export?: string };
    const name = serverFnName(decoded.export);
    return name ? `serverFn:${name}` : "serverFn";
  } catch {
    return "serverFn";
  }
}

// Exports look like `getSession_createServerFn_handler` — strip the framework suffix.
function serverFnName(exportName: string | undefined): string | undefined {
  if (!exportName) return undefined;
  return exportName.replace(/_createServerFn_handler$/, "");
}

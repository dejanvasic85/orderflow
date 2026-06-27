import { prettyRequestPath } from "./requestPath";

describe("prettyRequestPath", () => {
  it("leaves a normal pathname untouched", () => {
    expect(prettyRequestPath("/auth/confirm")).toBe("/auth/confirm");
  });

  it("decodes a server-fn blob to serverFn:<name>", () => {
    const encoded = btoa(
      JSON.stringify({
        file: "/src/lib/auth/auth.functions.ts?tss-serverfn-split",
        export: "getSession_createServerFn_handler",
      }),
    );

    expect(prettyRequestPath(`/_serverFn/${encoded}`)).toBe("serverFn:getSession");
  });

  it("decodes a percent-encoded blob (as it arrives in the Workers runtime)", () => {
    const base64 = btoa(
      JSON.stringify({
        file: "/src/lib/products/products.functions.ts?tss-serverfn-split",
        export: "listProducts_createServerFn_handler",
      }),
    );
    const percentEncoded = encodeURIComponent(base64);

    expect(prettyRequestPath(`/_serverFn/${percentEncoded}`)).toBe("serverFn:listProducts");
  });

  it("falls back to serverFn when the blob is not decodable", () => {
    expect(prettyRequestPath("/_serverFn/not-valid-base64-json")).toBe("serverFn");
  });

  it("falls back to serverFn when the export name is missing", () => {
    const encoded = btoa(JSON.stringify({ file: "/src/x.ts" }));

    expect(prettyRequestPath(`/_serverFn/${encoded}`)).toBe("serverFn");
  });
});

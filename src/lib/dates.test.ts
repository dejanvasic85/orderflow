import { formatRelativeTime } from "./dates";

const now = new Date("2026-06-20T12:00:00Z");

describe("formatRelativeTime", () => {
  it("returns 'just now' for times under a minute ago", () => {
    const iso = new Date(now.getTime() - 30_000).toISOString();
    expect(formatRelativeTime(iso, now)).toBe("just now");
  });

  it("returns minutes ago for times under an hour", () => {
    const iso = new Date(now.getTime() - 15 * 60_000).toISOString();
    expect(formatRelativeTime(iso, now)).toBe("15m ago");
  });

  it("returns hours ago for times under a day", () => {
    const iso = new Date(now.getTime() - 3 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso, now)).toBe("3h ago");
  });

  it("returns days ago for times under 30 days", () => {
    const iso = new Date(now.getTime() - 5 * 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso, now)).toBe("5d ago");
  });

  it("returns months ago for times over 30 days", () => {
    const iso = new Date(now.getTime() - 65 * 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso, now)).toBe("2mo ago");
  });
});

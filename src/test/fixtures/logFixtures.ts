// The shared fake logger used across service tests. Matches the Logger shape
// consumed by the service `deps.log`.
export function makeFakeLog() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

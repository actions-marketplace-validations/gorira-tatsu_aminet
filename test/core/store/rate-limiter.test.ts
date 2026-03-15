import { describe, expect, test } from "vitest";
import { TokenBucket } from "../../../src/utils/rate-limiter.js";

describe("TokenBucket", () => {
  test("allows burst up to maxTokens", async () => {
    const bucket = new TokenBucket(3, 10);
    // Should not throw or delay significantly
    const start = Date.now();
    await bucket.acquire();
    await bucket.acquire();
    await bucket.acquire();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  test("throttles when tokens exhausted", async () => {
    const bucket = new TokenBucket(1, 10); // 1 token, refill at 10/sec
    await bucket.acquire(); // Use the one token
    const start = Date.now();
    await bucket.acquire(); // Should wait ~100ms
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(50); // At least some delay
    expect(elapsed).toBeLessThan(500);
  });
});

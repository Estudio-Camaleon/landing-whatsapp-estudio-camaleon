import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "../api/_lib/auth";

describe("Auth", () => {
  beforeAll(() => {
    process.env.ADMIN_PASSWORD = "test-secret";
  });

  it("signToken returns a token with two parts", async () => {
    const token = await signToken({ user: "admin", exp: Date.now() + 3600000 });
    expect(token).toBeTruthy();
    expect(token.split(".")).toHaveLength(2);
  });

  it("verifyToken returns payload for valid token", async () => {
    const payload = { user: "admin", exp: Date.now() + 3600000 };
    const token = await signToken(payload);
    const result = await verifyToken(token);
    expect(result).not.toBeNull();
    expect(result.user).toBe("admin");
  });

  it("verifyToken returns null for expired token", async () => {
    const payload = { user: "admin", exp: Date.now() - 1000 };
    const token = await signToken(payload);
    const result = await verifyToken(token);
    expect(result).toBeNull();
  });

  it("verifyToken returns null for tampered token", async () => {
    const token = "ZmFrZQ==.invalidsignature";
    const result = await verifyToken(token);
    expect(result).toBeNull();
  });
});

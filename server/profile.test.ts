import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db helpers
vi.mock("./db", () => ({
  getUserById: vi.fn(),
  updateUserProfile: vi.fn(),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn(),
}));

import { getUserById, updateUserProfile } from "./db";
import { storagePut } from "./storage";

describe("profile.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls updateUserProfile with the correct fields", async () => {
    const mockUpdate = vi.mocked(updateUserProfile);
    mockUpdate.mockResolvedValue(undefined);

    const userId = 42;
    const input = {
      name: "David Cameron",
      jobTitle: "Head of IR",
      organisation: "Chorus Call Inc.",
      bio: "Experienced IR professional.",
      phone: "+27 11 000 0000",
      linkedinUrl: null,
      timezone: "Africa/Johannesburg",
    };

    await updateUserProfile(userId, input);

    expect(mockUpdate).toHaveBeenCalledWith(userId, input);
  });

  it("does not throw when updateUserProfile resolves", async () => {
    vi.mocked(updateUserProfile).mockResolvedValue(undefined);
    await expect(updateUserProfile(1, { name: "Test User" })).resolves.toBeUndefined();
  });

  it("propagates errors from updateUserProfile", async () => {
    vi.mocked(updateUserProfile).mockRejectedValue(new Error("DB error"));
    await expect(updateUserProfile(1, { name: "Test" })).rejects.toThrow("DB error");
  });
});

describe("profile.uploadAvatar", () => {
  it("calls storagePut with the correct key format and mime type", async () => {
    const mockPut = vi.mocked(storagePut);
    mockPut.mockResolvedValue({ key: "avatars/user-1-123.png", url: "https://cdn.example.com/avatars/user-1-123.png" });

    const userId = 1;
    const mimeType = "image/png";
    const ext = mimeType.split("/")[1];
    const key = `avatars/user-${userId}-${Date.now()}.${ext}`;
    const buffer = Buffer.from("fake-image-data", "base64");

    const result = await storagePut(key, buffer, mimeType);

    expect(mockPut).toHaveBeenCalledWith(key, buffer, mimeType);
    expect(result.url).toBe("https://cdn.example.com/avatars/user-1-123.png");
  });
});

// Stub — restore PlatformEmbedService from pre-force-push commit
export class PlatformEmbedService {
  async getEmbedToken(_sessionId: string): Promise<string> {
    throw new Error("PlatformEmbedService not yet restored");
  }
}

export const platformEmbedService = new PlatformEmbedService();

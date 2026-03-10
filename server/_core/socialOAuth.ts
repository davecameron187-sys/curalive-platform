export type SocialPlatform = "linkedin" | "twitter" | "facebook" | "instagram" | "tiktok";

export interface OAuthConfig {
  name: string;
  displayName: string;
  color: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnvKey: string;
  clientSecretEnvKey: string;
  profileUrl?: string;
  charLimit: number;
  supportsImages: boolean;
  supportsVideo: boolean;
  supportsScheduling: boolean;
}

export const OAUTH_CONFIGS: Record<SocialPlatform, OAuthConfig> = {
  linkedin: {
    name: "linkedin",
    displayName: "LinkedIn",
    color: "#0A66C2",
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: ["r_liteprofile", "r_emailaddress", "w_member_social", "r_organization_social", "w_organization_social"],
    clientIdEnvKey: "LINKEDIN_CLIENT_ID",
    clientSecretEnvKey: "LINKEDIN_CLIENT_SECRET",
    profileUrl: "https://api.linkedin.com/v2/me",
    charLimit: 3000,
    supportsImages: true,
    supportsVideo: true,
    supportsScheduling: false,
  },
  twitter: {
    name: "twitter",
    displayName: "X (Twitter)",
    color: "#000000",
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    clientIdEnvKey: "TWITTER_CLIENT_ID",
    clientSecretEnvKey: "TWITTER_CLIENT_SECRET",
    profileUrl: "https://api.twitter.com/2/users/me",
    charLimit: 280,
    supportsImages: true,
    supportsVideo: true,
    supportsScheduling: false,
  },
  facebook: {
    name: "facebook",
    displayName: "Facebook",
    color: "#1877F2",
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "publish_to_groups"],
    clientIdEnvKey: "FACEBOOK_APP_ID",
    clientSecretEnvKey: "FACEBOOK_APP_SECRET",
    profileUrl: "https://graph.facebook.com/me",
    charLimit: 63206,
    supportsImages: true,
    supportsVideo: true,
    supportsScheduling: true,
  },
  instagram: {
    name: "instagram",
    displayName: "Instagram",
    color: "#E1306C",
    authUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    scopes: ["user_profile", "user_media", "instagram_content_publish"],
    clientIdEnvKey: "INSTAGRAM_APP_ID",
    clientSecretEnvKey: "INSTAGRAM_APP_SECRET",
    profileUrl: "https://graph.instagram.com/me",
    charLimit: 2200,
    supportsImages: true,
    supportsVideo: true,
    supportsScheduling: false,
  },
  tiktok: {
    name: "tiktok",
    displayName: "TikTok",
    color: "#FF0050",
    authUrl: "https://www.tiktok.com/v2/auth/authorize",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: ["user.info.basic", "video.upload", "video.list"],
    clientIdEnvKey: "TIKTOK_CLIENT_KEY",
    clientSecretEnvKey: "TIKTOK_CLIENT_SECRET",
    profileUrl: "https://open.tiktokapis.com/v2/user/info/",
    charLimit: 2200,
    supportsImages: false,
    supportsVideo: true,
    supportsScheduling: false,
  },
};

export function getPlatformConfig(platform: SocialPlatform): OAuthConfig {
  return OAUTH_CONFIGS[platform];
}

export function isPlatformConfigured(platform: SocialPlatform): boolean {
  const config = OAUTH_CONFIGS[platform];
  return !!(process.env[config.clientIdEnvKey] && process.env[config.clientSecretEnvKey]);
}

export function getConfiguredPlatforms(): SocialPlatform[] {
  return (Object.keys(OAUTH_CONFIGS) as SocialPlatform[]).filter(isPlatformConfigured);
}

export function buildOAuthUrl(platform: SocialPlatform, redirectUri: string, state: string): string {
  const config = OAUTH_CONFIGS[platform];
  const clientId = process.env[config.clientIdEnvKey];
  if (!clientId) throw new Error(`${platform} OAuth not configured — set ${config.clientIdEnvKey}`);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state,
  });
  return `${config.authUrl}?${params.toString()}`;
}

export function truncateForPlatform(content: string, platform: SocialPlatform): string {
  const limit = OAUTH_CONFIGS[platform].charLimit;
  if (content.length <= limit) return content;
  return content.slice(0, limit - 3) + "...";
}

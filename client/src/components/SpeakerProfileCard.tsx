/**
 * SpeakerProfileCard — displays the host/operator profile on event registration pages.
 * Shows avatar, name, job title, organisation, bio, and LinkedIn link.
 */
import { Linkedin, Building2, User } from "lucide-react";

interface SpeakerProfile {
  name?: string | null;
  jobTitle?: string | null;
  organisation?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  linkedinUrl?: string | null;
}

interface SpeakerProfileCardProps {
  profile: SpeakerProfile;
  label?: string; // e.g. "Hosted by" or "Your presenter"
}

export default function SpeakerProfileCard({ profile, label = "Hosted by" }: SpeakerProfileCardProps) {
  const { name, jobTitle, organisation, bio, avatarUrl, linkedinUrl } = profile;

  // Don't render if there's no meaningful content
  if (!name && !organisation) return null;

  const initials = (name ?? "?")
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      {/* Label */}
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>

      {/* Avatar + name row */}
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name ?? "Host"}
            className="w-14 h-14 rounded-full object-cover border border-border shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-primary">{initials}</span>
          </div>
        )}
        <div className="min-w-0">
          {name && (
            <p className="font-semibold text-foreground truncate">{name}</p>
          )}
          {jobTitle && (
            <p className="text-sm text-muted-foreground truncate">{jobTitle}</p>
          )}
          {organisation && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Building2 className="w-3 h-3 shrink-0" />
              <span className="truncate">{organisation}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{bio}</p>
      )}

      {/* LinkedIn */}
      {linkedinUrl && (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <Linkedin className="w-3.5 h-3.5" />
          LinkedIn Profile
        </a>
      )}
    </div>
  );
}

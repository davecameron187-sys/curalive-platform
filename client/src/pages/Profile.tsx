/**
 * Profile.tsx — Operator Profile Customisation
 * Allows any logged-in user to update their display name, job title, organisation,
 * bio, avatar, phone, LinkedIn URL, and timezone.
 */
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  User, Camera, Save, ArrowLeft, Loader2, Building2,
  Phone, Linkedin, Globe, FileText, CheckCircle2, AlertCircle
} from "lucide-react";

const TIMEZONES = [
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Africa/Lagos",
  "Africa/Nairobi",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Zurich",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
];

export default function Profile() {
  const [, navigate] = useLocation();
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuth();

  const { data: profile, isLoading: profileLoading, refetch } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [form, setForm] = useState({
    name: "",
    jobTitle: "",
    organisation: "",
    bio: "",
    phone: "",
    linkedinUrl: "",
    timezone: "Africa/Johannesburg",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form once profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        jobTitle: profile.jobTitle ?? "",
        organisation: profile.organisation ?? "",
        bio: profile.bio ?? "",
        phone: profile.phone ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        timezone: profile.timezone ?? "Africa/Johannesburg",
      });
      if (profile.avatarUrl) setAvatarPreview(profile.avatarUrl);
    }
  }, [profile]);

  const updateProfile = trpc.profile.update.useMutation();
  const uploadAvatar = trpc.profile.uploadAvatar.useMutation();
  const utils = trpc.useUtils();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar must be under 5 MB");
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!isAuthenticated) return;
    setSaving(true);
    setSaved(false);
    try {
      // Upload avatar first if changed
      if (avatarFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            const result = e.target?.result as string;
            resolve(result.split(",")[1]); // strip data:image/...;base64,
          };
          reader.onerror = reject;
          reader.readAsDataURL(avatarFile);
        });
        await uploadAvatar.mutateAsync({
          base64,
          mimeType: avatarFile.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
        });
      }

      // Save profile fields
      await updateProfile.mutateAsync({
        name: form.name || undefined,
        jobTitle: form.jobTitle || null,
        organisation: form.organisation || null,
        bio: form.bio || null,
        phone: form.phone || null,
        linkedinUrl: form.linkedinUrl || null,
        timezone: form.timezone || null,
      });

      await refetch();
      utils.profile.get.invalidate();
      setSaved(true);
      setAvatarFile(null);
      toast.success("Profile saved successfully");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // Auth guard
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Login Required</h1>
          <p className="text-muted-foreground text-sm mb-6">Please log in to view and edit your profile.</p>
          <a href={getLoginUrl()} className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
            Login to Continue
          </a>
        </div>
      </div>
    );
  }

  const initials = (form.name || authUser?.name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const roleBadgeColor = profile?.role === "admin" ? "bg-red-900/40 text-red-300 border border-red-800/40" :
    profile?.role === "operator" ? "bg-indigo-900/40 text-indigo-300 border border-indigo-800/40" :
    "bg-slate-700/60 text-slate-300 border border-slate-600/40";

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> Home
            </button>
            <span className="text-border">|</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-bold leading-tight">Profile Settings</h1>
                <p className="text-[10px] text-muted-foreground leading-tight">Customise your operator profile</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </header>

      <div className="container py-10 max-w-3xl">
        <div className="grid md:grid-cols-3 gap-8">

          {/* Left — Avatar & role */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-border bg-card flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-muted-foreground">{initials}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-primary hover:underline"
            >
              Change photo
            </button>
            <div className="text-center">
              <div className="font-semibold text-sm">{form.name || authUser?.name || "—"}</div>
              {form.jobTitle && <div className="text-xs text-muted-foreground mt-0.5">{form.jobTitle}</div>}
              {form.organisation && <div className="text-xs text-muted-foreground">{form.organisation}</div>}
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleBadgeColor}`}>
              {profile?.role === "admin" ? "Admin" : profile?.role === "operator" ? "Operator" : "User"}
            </span>
            {profile?.email && (
              <div className="text-xs text-muted-foreground text-center break-all">{profile.email}</div>
            )}
          </div>

          {/* Right — Form */}
          <div className="md:col-span-2 space-y-5">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Display Name <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Job Title + Organisation */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Job Title</label>
                <input
                  type="text"
                  value={form.jobTitle}
                  onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))}
                  placeholder="e.g. Head of IR"
                  className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Organisation</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={form.organisation}
                    onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))}
                    placeholder="Company name"
                    className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Bio <span className="text-muted-foreground font-normal normal-case">(max 1000 chars)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-muted-foreground" />
                <textarea
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value.slice(0, 1000) }))}
                  placeholder="A short bio that appears on event pages and reports…"
                  rows={3}
                  className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{form.bio.length}/1000</span>
              </div>
            </div>

            {/* Phone + LinkedIn */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+27 11 000 0000"
                    className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">LinkedIn URL</label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="url"
                    value={form.linkedinUrl}
                    onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))}
                    placeholder="https://linkedin.com/in/…"
                    className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Timezone</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <select
                  value={form.timezone}
                  onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                  className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Save button (mobile) */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 md:hidden"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

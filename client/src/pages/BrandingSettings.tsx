import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  Palette,
  Globe,
  Settings,
  Copy,
  Check,
  Eye,
  Save,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface BrandingConfig {
  companyName: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  domain?: string;
  customDomain?: string;
  faviconUrl?: string;
  emailTemplate: "default" | "custom";
  eventPageTemplate: "minimal" | "standard" | "premium";
  whiteLabel: boolean;
  agencyName?: string;
  agencyLogo?: string;
}

/**
 * BrandingSettings Page
 * 
 * Custom branding and white-label configuration for agencies
 * and enterprise customers.
 */
export default function BrandingSettings() {
  const [branding, setBranding] = useState<BrandingConfig>({
    companyName: "CuraLive",
    primaryColor: "#FF1744",
    secondaryColor: "#1F2937",
    accentColor: "#00BCD4",
    domain: "curalive-platform.replit.app",
    eventPageTemplate: "premium",
    whiteLabel: false,
    emailTemplate: "default",
  });

  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleColorChange = (key: keyof BrandingConfig, value: string) => {
    setBranding((prev) => ({ ...prev, [key]: value }));
  };

  const handleInputChange = (key: keyof BrandingConfig, value: string | boolean) => {
    setBranding((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBranding((prev) => ({
          ...prev,
          logo: event.target?.result as string,
        }));
        toast.success("Logo uploaded");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(branding.domain || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    toast.success("Branding settings saved");
  };

  const handleReset = () => {
    setBranding({
      companyName: "CuraLive",
      primaryColor: "#FF1744",
      secondaryColor: "#1F2937",
      accentColor: "#00BCD4",
      domain: "curalive-platform.replit.app",
      eventPageTemplate: "premium",
      whiteLabel: false,
      emailTemplate: "default",
    });
    toast.success("Settings reset to defaults");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Branding & White-Label Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize your event pages, emails, and domain branding
        </p>
      </div>

      {/* Preview Toggle */}
      <div className="flex justify-end">
        <Button
          variant={previewMode ? "default" : "outline"}
          onClick={() => setPreviewMode(!previewMode)}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          {previewMode ? "Hide Preview" : "Show Preview"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Info */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Company Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Company Name
                </label>
                <Input
                  value={branding.companyName}
                  onChange={(e) =>
                    handleInputChange("companyName", e.target.value)
                  }
                  placeholder="Your Company Name"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Logo</label>
                <div className="flex items-center gap-4">
                  {branding.logo && (
                    <img
                      src={branding.logo}
                      alt="Logo"
                      className="h-12 w-12 rounded object-contain"
                    />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 border border-border rounded cursor-pointer hover:bg-secondary transition-colors">
                    <Upload className="h-4 w-4" />
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Favicon URL
                </label>
                <Input
                  value={branding.faviconUrl || ""}
                  onChange={(e) =>
                    handleInputChange("faviconUrl", e.target.value)
                  }
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
            </div>
          </Card>

          {/* Color Scheme */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Color Scheme
            </h2>

            <div className="space-y-4">
              {[
                { key: "primaryColor", label: "Primary Color" },
                { key: "secondaryColor", label: "Secondary Color" },
                { key: "accentColor", label: "Accent Color" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-sm font-medium mb-2 block">{label}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding[key as keyof BrandingConfig] as string}
                      onChange={(e) =>
                        handleColorChange(
                          key as keyof BrandingConfig,
                          e.target.value
                        )
                      }
                      className="h-10 w-20 rounded cursor-pointer"
                    />
                    <Input
                      value={branding[key as keyof BrandingConfig] as string}
                      onChange={(e) =>
                        handleColorChange(
                          key as keyof BrandingConfig,
                          e.target.value
                        )
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Domain & Hosting */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Domain & Hosting
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Auto-Generated Domain
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={branding.domain || ""}
                    readOnly
                    className="bg-secondary"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyDomain}
                    className="flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Custom Domain (Optional)
                </label>
                <Input
                  value={branding.customDomain || ""}
                  onChange={(e) =>
                    handleInputChange("customDomain", e.target.value)
                  }
                  placeholder="events.yourcompany.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Configure DNS records to point to our servers
                </p>
              </div>
            </div>
          </Card>

          {/* Templates */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Templates</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Event Page Template
                </label>
                <select
                  value={branding.eventPageTemplate}
                  onChange={(e) =>
                    handleInputChange(
                      "eventPageTemplate",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-border rounded bg-background"
                >
                  <option value="minimal">Minimal (Clean & Simple)</option>
                  <option value="standard">Standard (Balanced)</option>
                  <option value="premium">Premium (Full Featured)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Email Template
                </label>
                <select
                  value={branding.emailTemplate}
                  onChange={(e) =>
                    handleInputChange("emailTemplate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-border rounded bg-background"
                >
                  <option value="default">Default Template</option>
                  <option value="custom">Custom Template</option>
                </select>
              </div>
            </div>
          </Card>

          {/* White-Label */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4">White-Label Options</h2>

            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 border border-border rounded cursor-pointer hover:bg-secondary/50 transition-colors">
                <input
                  type="checkbox"
                  checked={branding.whiteLabel}
                  onChange={(e) =>
                    handleInputChange("whiteLabel", e.target.checked)
                  }
                  className="w-4 h-4 rounded"
                />
                <div>
                  <p className="font-medium text-sm">Enable White-Label Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Remove CuraLive branding from event pages
                  </p>
                </div>
              </label>

              {branding.whiteLabel && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Agency Name
                    </label>
                    <Input
                      value={branding.agencyName || ""}
                      onChange={(e) =>
                        handleInputChange("agencyName", e.target.value)
                      }
                      placeholder="Your Agency Name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Agency Logo
                    </label>
                    <div className="flex items-center gap-4">
                      {branding.agencyLogo && (
                        <img
                          src={branding.agencyLogo}
                          alt="Agency Logo"
                          className="h-12 w-12 rounded object-contain"
                        />
                      )}
                      <label className="flex items-center gap-2 px-4 py-2 border border-border rounded cursor-pointer hover:bg-secondary transition-colors">
                        <Upload className="h-4 w-4" />
                        Upload Logo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setBranding((prev) => ({
                                  ...prev,
                                  agencyLogo: event.target?.result as string,
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        </div>

        {/* Preview Panel */}
        {previewMode && (
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h3 className="font-semibold mb-4">Preview</h3>

              <div
                className="rounded border border-border p-4 space-y-4"
                style={{
                  backgroundColor: branding.secondaryColor,
                  color: "white",
                }}
              >
                {branding.logo && (
                  <img
                    src={branding.logo}
                    alt="Logo"
                    className="h-8 w-auto"
                  />
                )}

                <h4 className="font-bold text-lg">{branding.companyName}</h4>

                <div className="space-y-2">
                  <button
                    className="w-full py-2 rounded font-medium transition-opacity hover:opacity-90"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    Primary Button
                  </button>

                  <button
                    className="w-full py-2 rounded font-medium transition-opacity hover:opacity-90"
                    style={{ backgroundColor: branding.accentColor }}
                  >
                    Accent Button
                  </button>
                </div>

                <div className="pt-4 border-t border-white/20 text-sm">
                  <p className="opacity-75">
                    This is a preview of your branding. Your event pages will
                    use these colors and logos.
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-secondary rounded text-sm">
                <p className="font-medium mb-2">Domain:</p>
                <p className="text-muted-foreground break-all">
                  {branding.customDomain || branding.domain}
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

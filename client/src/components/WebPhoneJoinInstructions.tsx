import React, { useState } from "react";
import { Phone, Globe, Headphones, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export interface JoinConfig {
  webPhoneUrl: string;
  dialInNumbers?: { country: string; number: string; toll: boolean }[];
  sipUri?: string;
  accessCode?: string;
  eventName: string;
  scheduledTime?: string;
}

export interface WebPhoneJoinInstructionsProps {
  config: JoinConfig;
  compact?: boolean;
}

export function WebPhoneJoinInstructions({ config, compact = false }: WebPhoneJoinInstructionsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      size="sm"
      variant="ghost"
      className="h-8 w-8 p-0"
      onClick={() => copyToClipboard(text, field)}
    >
      {copiedField === field ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4 text-muted-foreground" />
      )}
    </Button>
  );

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Join via WebPhone</span>
          </div>
          <Badge className="bg-blue-600 text-white">Recommended</Badge>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-muted px-3 py-2 rounded font-mono truncate">
            {config.webPhoneUrl}
          </code>
          <CopyButton text={config.webPhoneUrl} field="webphone-url" />
          <Button size="sm" variant="outline" asChild>
            <a href={config.webPhoneUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
        {config.accessCode && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>Access Code:</span>
            <code className="font-mono bg-muted px-2 py-1 rounded">{config.accessCode}</code>
            <CopyButton text={config.accessCode} field="access-code" />
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <h3 className="font-semibold text-lg">{config.eventName}</h3>
        {config.scheduledTime && (
          <p className="text-sm text-muted-foreground mt-1">{config.scheduledTime}</p>
        )}
      </div>

      <Tabs defaultValue="webphone" className="p-4">
        <TabsList className="w-full">
          <TabsTrigger value="webphone" className="flex-1 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            WebPhone
          </TabsTrigger>
          <TabsTrigger value="dialin" className="flex-1 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Dial-In
          </TabsTrigger>
          <TabsTrigger value="sip" className="flex-1 flex items-center gap-2">
            <Headphones className="w-4 h-4" />
            SIP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webphone" className="mt-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-blue-600 text-white">Recommended</Badge>
            <span className="text-xs text-muted-foreground">Best quality, no software needed</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">WebPhone Link</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono truncate">
                  {config.webPhoneUrl}
                </code>
                <CopyButton text={config.webPhoneUrl} field="webphone-url-full" />
              </div>
            </div>

            {config.accessCode && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Access Code</label>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-3 py-2 rounded font-mono">
                    {config.accessCode}
                  </code>
                  <CopyButton text={config.accessCode} field="access-code-full" />
                </div>
              </div>
            )}

            <Button className="w-full" asChild>
              <a href={config.webPhoneUrl} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4 mr-2" />
                Join via WebPhone
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="dialin" className="mt-4 space-y-4">
          {config.dialInNumbers && config.dialInNumbers.length > 0 ? (
            <div className="space-y-2">
              {config.dialInNumbers.map((num, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="text-sm font-medium">{num.country}</span>
                    {!num.toll && (
                      <Badge variant="outline" className="ml-2 text-xs">Toll-Free</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono">{num.number}</code>
                    <CopyButton text={num.number} field={`dialin-${idx}`} />
                  </div>
                </div>
              ))}
              {config.accessCode && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Access Code</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-semibold">{config.accessCode}</code>
                      <CopyButton text={config.accessCode} field="dialin-access" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No dial-in numbers available for this event
            </p>
          )}
        </TabsContent>

        <TabsContent value="sip" className="mt-4 space-y-4">
          {config.sipUri ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">SIP URI</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono truncate">
                    {config.sipUri}
                  </code>
                  <CopyButton text={config.sipUri} field="sip-uri" />
                </div>
              </div>
              {config.accessCode && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Access Code</label>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-3 py-2 rounded font-mono">
                      {config.accessCode}
                    </code>
                    <CopyButton text={config.accessCode} field="sip-access" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              SIP connection not available for this event
            </p>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}

export default WebPhoneJoinInstructions;

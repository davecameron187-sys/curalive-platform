/**
 * WebPhone Join Instructions Component
 * Displays WebPhone dial-in details and alternative join methods
 * Primary join method for CuraLive events
 */

import React, { useState } from "react";
import { Phone, Copy, CheckCircle, Smartphone, Video, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface WebPhoneJoinDetails {
  dialInNumber: string;
  sipUri: string;
  accessCode?: string;
  eventName: string;
  eventTime: string;
}

export interface WebPhoneJoinInstructionsProps {
  details: WebPhoneJoinDetails;
  alternativeMethods?: {
    teams?: string;
    zoom?: string;
    webex?: string;
  };
  onCopyDialIn?: () => void;
  onCopySipUri?: () => void;
}

const CopyButton: React.FC<{
  text: string;
  onCopy?: () => void;
}> = ({ text, onCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleCopy}
      className="ml-2"
    >
      {copied ? (
        <>
          <CheckCircle className="w-3 h-3 mr-1" /> Copied!
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 mr-1" /> Copy
        </>
      )}
    </Button>
  );
};

export const WebPhoneJoinInstructions: React.FC<WebPhoneJoinInstructionsProps> = ({
  details,
  alternativeMethods,
  onCopyDialIn,
  onCopySipUri,
}) => {
  return (
    <div className="space-y-6">
      {/* Primary: WebPhone */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Join via WebPhone (Recommended)</h3>
            <p className="text-sm text-muted-foreground">
              Direct voice connection — no software required
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Dial-in Number */}
          <div className="bg-background rounded-lg p-4 border border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Dial-In Number
            </p>
            <div className="flex items-center justify-between">
              <p className="font-mono text-lg font-bold">{details.dialInNumber}</p>
              <CopyButton text={details.dialInNumber} onCopy={onCopyDialIn} />
            </div>
          </div>

          {/* SIP URI */}
          <div className="bg-background rounded-lg p-4 border border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              SIP URI (Direct Connection)
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-sm break-all">{details.sipUri}</p>
              <CopyButton text={details.sipUri} onCopy={onCopySipUri} />
            </div>
          </div>

          {/* Access Code */}
          {details.accessCode && (
            <div className="bg-background rounded-lg p-4 border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Access Code
              </p>
              <div className="flex items-center justify-between">
                <p className="font-mono text-lg font-bold tracking-widest">
                  {details.accessCode}
                </p>
                <CopyButton text={details.accessCode} />
              </div>
            </div>
          )}

          {/* Event Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Event:</span>
              <span className="font-medium">{details.eventName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time:</span>
              <span className="font-medium">{details.eventTime}</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm text-blue-900">How to Join:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Call the dial-in number from any phone</li>
              <li>When prompted, enter the access code</li>
              <li>You'll be connected to the event instantly</li>
              <li>No software installation required</li>
            </ol>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Crystal Clear Audio</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>No Download Needed</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Works Anywhere</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Auto-Admit</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Alternative Methods */}
      {(alternativeMethods?.teams || alternativeMethods?.zoom || alternativeMethods?.webex) && (
        <div>
          <h3 className="font-semibold mb-3 text-sm">Alternative Join Methods</h3>
          <Tabs defaultValue="teams" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {alternativeMethods.teams && <TabsTrigger value="teams">Teams</TabsTrigger>}
              {alternativeMethods.zoom && <TabsTrigger value="zoom">Zoom</TabsTrigger>}
              {alternativeMethods.webex && <TabsTrigger value="webex">Webex</TabsTrigger>}
            </TabsList>

            {alternativeMethods.teams && (
              <TabsContent value="teams">
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="w-4 h-4 text-purple-600" />
                    <h4 className="font-semibold text-sm">Microsoft Teams</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Join via Microsoft Teams meeting link
                  </p>
                  <div className="bg-muted rounded p-3 mb-3">
                    <p className="font-mono text-xs break-all">{alternativeMethods.teams}</p>
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <a href={alternativeMethods.teams} target="_blank" rel="noopener noreferrer">
                      Open in Teams
                    </a>
                  </Button>
                </Card>
              </TabsContent>
            )}

            {alternativeMethods.zoom && (
              <TabsContent value="zoom">
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-sm">Zoom</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Join via Zoom meeting link
                  </p>
                  <div className="bg-muted rounded p-3 mb-3">
                    <p className="font-mono text-xs break-all">{alternativeMethods.zoom}</p>
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <a href={alternativeMethods.zoom} target="_blank" rel="noopener noreferrer">
                      Open in Zoom
                    </a>
                  </Button>
                </Card>
              </TabsContent>
            )}

            {alternativeMethods.webex && (
              <TabsContent value="webex">
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold text-sm">Cisco Webex</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Join via Cisco Webex meeting link
                  </p>
                  <div className="bg-muted rounded p-3 mb-3">
                    <p className="font-mono text-xs break-all">{alternativeMethods.webex}</p>
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <a href={alternativeMethods.webex} target="_blank" rel="noopener noreferrer">
                      Open in Webex
                    </a>
                  </Button>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}

      {/* Support Info */}
      <Card className="p-4 bg-muted/50">
        <p className="text-xs text-muted-foreground">
          <strong>Need help?</strong> Contact support@curalive.com or call our support line during business hours.
        </p>
      </Card>
    </div>
  );
};

export default WebPhoneJoinInstructions;

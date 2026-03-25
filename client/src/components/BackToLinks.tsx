import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Zap } from "lucide-react";

export default function BackToLinks() {
  const [location, navigate] = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setVisible(params.get("from") === "operator-links");
  }, [location]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-primary/10 border-b border-primary/30 backdrop-blur-md">
      <button
        onClick={() => navigate("/operator-links")}
        className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Operator Links
      </button>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Zap className="w-3 h-3 text-primary" />
        <span>CuraLive Demo</span>
      </div>
    </div>
  );
}

import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Legacy /billing route — redirects to the new enterprise billing dashboard.
 */
export default function Billing() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/admin/billing", { replace: true });
  }, [navigate]);
  return null;
}

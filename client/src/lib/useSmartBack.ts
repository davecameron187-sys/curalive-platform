import { useLocation } from "wouter";

export function useSmartBack(defaultPath: string = "/") {
  const [, navigate] = useLocation();
  return () => {
    const params = new URLSearchParams(window.location.search);
    navigate(params.get("from") === "operator-links" ? "/operator-links" : defaultPath);
  };
}

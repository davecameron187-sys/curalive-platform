/**
 * Language Selector Component
 * Multi-language support with RTL handling
 */
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, LanguageCode } from "@/i18n/config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
}

export function LanguageSelector({
  className = "",
  showLabel = true,
}: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (newLanguage: LanguageCode) => {
    i18n.changeLanguage(newLanguage);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <Globe className="w-5 h-5 text-slate-400" />
      )}
      <Select
        value={i18n.language as LanguageCode}
        onValueChange={handleLanguageChange}
      >
        <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600">
          <SelectValue placeholder={t("kiosk.language")} />
        </SelectTrigger>
        <SelectContent className="bg-slate-700 border-slate-600">
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, config]) => (
            <SelectItem
              key={code}
              value={code}
              className="text-slate-100 hover:bg-slate-600 focus:bg-slate-600"
            >
              <span className="flex items-center gap-2">
                <span>{config.nativeName}</span>
                <span className="text-xs text-slate-400">({config.name})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Language Selector Button Component (for quick access)
 */
export function LanguageSelectorButton() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as LanguageCode;
  const currentConfig = SUPPORTED_LANGUAGES[currentLang];

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium transition-colors touch-target">
        <Globe className="w-4 h-4" />
        <span>{currentConfig.nativeName}</span>
      </button>

      {/* Dropdown menu */}
      <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-50">
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, config]) => (
          <button
            key={code}
            onClick={() => i18n.changeLanguage(code as LanguageCode)}
            className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
              currentLang === code
                ? "bg-slate-600 text-slate-100 font-semibold"
                : "text-slate-300 hover:bg-slate-600"
            }`}
          >
            {config.nativeName}
            <span className="text-xs text-slate-400 ml-2">({config.name})</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Hook for using translation in components
 */
export function useKioskTranslation() {
  const { t, i18n } = useTranslation();
  const isRTL = SUPPORTED_LANGUAGES[i18n.language as LanguageCode]?.rtl || false;

  return {
    t,
    i18n,
    isRTL,
    currentLanguage: i18n.language as LanguageCode,
  };
}

/**
 * ModeratorConsole Updates — Integrate useAblyToken hook
 * 
 * Add this to the top of ModeratorConsole.tsx component:
 */

import { useAblyToken } from "@/_core/hooks/useAblyToken";

// Inside the ModeratorConsole component, add:
export default function ModeratorConsole() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { token, clientId, isLoading: tokenLoading, error: tokenError, isExpired } = useAblyToken();
  
  // ... rest of component

  // Add token status indicator to UI:
  return (
    <div>
      {/* Token Status Indicator */}
      {tokenError && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-2 rounded mb-4">
          <p className="text-sm">⚠️ Connection error: {tokenError.message}</p>
        </div>
      )}
      
      {isExpired && (
        <div className="bg-yellow-900/20 border border-yellow-500 text-yellow-400 px-4 py-2 rounded mb-4">
          <p className="text-sm">🔄 Reconnecting...</p>
        </div>
      )}

      {/* Rest of component UI */}
    </div>
  );
}

import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "../lib/trpc";
import { useBrandConfig } from "../hooks/useBrandConfig";

export default function PresenterScreen() {
  const [, params] = useRoute("/presenter/:token");
  const token = params?.token;

  const { data: tokenData, isLoading } = trpc.partners.validateToken.useQuery(
    { token: token ?? "" },
    { enabled: !!token }
  );

  const brand = useBrandConfig(tokenData?.partnerId);

  const { data: queue } = trpc.speakerQueue.getPresenterQueue.useQuery(
    { sessionId: tokenData?.sessionId ?? 0, token: token ?? "" },
    { enabled: !!tokenData?.sessionId && !!token, refetchInterval: 3000 }
  );

  const pendingQuestions = (queue || []).filter((q: any) => q.status === "pending" || q.status === "queued");
  const currentQuestion = pendingQuestions[0];
  const upNext = pendingQuestions.slice(1, 4);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse text-lg">Loading presenter view...</div>
      </div>
    );
  }

  if (!tokenData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400">This presenter link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col" style={{ fontFamily: brand.fontFamily || "Inter, system-ui, sans-serif" }}>
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-800" style={{ background: brand.primaryColor }}>
        <div className="flex items-center gap-3">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.displayName} className="h-6" />
          ) : (
            <span className="text-sm font-semibold opacity-75">{brand.displayName}</span>
          )}
          <span className="text-sm opacity-50">Presenter View</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">LIVE</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        {currentQuestion ? (
          <div className="w-full max-w-4xl">
            <p className="text-sm text-gray-400 mb-4 uppercase tracking-wider">Current Question</p>
            <div className="bg-gray-900 rounded-2xl p-10 border border-gray-700">
              <p className="text-3xl font-medium leading-relaxed mb-6">
                {currentQuestion.question_text}
              </p>
              {currentQuestion.asker_name && (
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-lg">{currentQuestion.asker_name}</span>
                  {currentQuestion.asker_firm && (
                    <span className="text-lg opacity-75">· {currentQuestion.asker_firm}</span>
                  )}
                </div>
              )}
              {currentQuestion.ai_suggested_answer && (
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Suggested Talking Points</p>
                  <p className="text-lg text-gray-300 leading-relaxed">{currentQuestion.ai_suggested_answer}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-6 opacity-20">?</div>
            <h2 className="text-2xl font-semibold text-gray-400">No questions queued</h2>
            <p className="text-gray-500 mt-2">Questions will appear here when approved by the operator.</p>
          </div>
        )}

        {upNext.length > 0 && (
          <div className="w-full max-w-4xl mt-10">
            <p className="text-sm text-gray-400 mb-3 uppercase tracking-wider">Up Next</p>
            <div className="space-y-3">
              {upNext.map((q: any, i: number) => (
                <div key={q.id || i} className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 flex items-start gap-4">
                  <span className="text-gray-500 font-mono text-sm mt-1">{i + 2}.</span>
                  <div>
                    <p className="text-lg text-gray-200">{q.question_text}</p>
                    {q.asker_name && (
                      <p className="text-sm text-gray-500 mt-1">{q.asker_name}{q.asker_firm ? ` · ${q.asker_firm}` : ""}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="px-8 py-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
        <span>{pendingQuestions.length} question{pendingQuestions.length !== 1 ? "s" : ""} remaining</span>
        <span>Powered by {brand.displayName}</span>
      </footer>
    </div>
  );
}

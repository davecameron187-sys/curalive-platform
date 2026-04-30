import re

# ── CustomerDashboard.tsx ──────────────────────────────────────────────────────

with open('client/src/pages/CustomerDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Add getNarrativeDeltas query hook after customerSuppression line
old = '  const customerSuppression = customerSuppressionQuery.data ?? { totalAssessed: 0, totalSurfaced: 0, totalSuppressed: 0 };'
new = '''  const customerSuppression = customerSuppressionQuery.data ?? { totalAssessed: 0, totalSurfaced: 0, totalSuppressed: 0 };
  const deltasQuery = trpc.customerDashboard.getNarrativeDeltas.useQuery(
    { sessionId: selectedSessionId ?? "" },
    { enabled: !!selectedSessionId, refetchInterval: 15000 }
  );
  const deltasData = deltasQuery.data ?? { surfaced: [], totalAssessed: 0, totalSurfaced: 0 };'''

content = content.replace(old, new)

# 2. Add delta panel above Intelligence Feed header
old_feed = '              {/* Feed */}\n              <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">\n                Intelligence Feed\n              </div>'

new_feed = '''              {/* Narrative Delta Panel */}
              {selectedSessionId && (
                <div className="mb-6 border border-gray-800 rounded-lg bg-gray-950 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Narrative Intelligence</div>
                    <div className="text-xs text-gray-600">
                      {deltasData.totalAssessed} assessed · {deltasData.totalSurfaced} surfaced
                    </div>
                  </div>
                  {deltasQuery.isLoading && (
                    <div className="text-xs text-gray-600">Analysing session...</div>
                  )}
                  {!deltasQuery.isLoading && deltasData.surfaced.length === 0 && (
                    <div className="text-xs text-gray-500 italic">
                      Narrative stable — no deviation from disclosed position observed.
                    </div>
                  )}
                  {deltasData.surfaced.map((delta: any, i: number) => (
                    <div key={i} className={"mb-2 last:mb-0 flex items-start gap-3 p-3 rounded-lg bg-gray-900 border border-gray-800"}>
                      <div className={"text-xs font-bold px-2 py-0.5 rounded shrink-0 " + (
                        delta.priority === "P0" ? "bg-red-900/50 text-red-400 border border-red-700" :
                        delta.priority === "P1" ? "bg-orange-900/50 text-orange-400 border border-orange-700" :
                        delta.priority === "P2" ? "bg-yellow-900/50 text-yellow-400 border border-yellow-700" :
                        "bg-gray-800 text-gray-400 border border-gray-700"
                      )}>{delta.priority}</div>
                      <div className="text-sm text-gray-200 leading-relaxed">{delta.deltaText}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* Feed */}
              <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">
                Intelligence Feed
              </div>'''

content = content.replace(old_feed, new_feed)

with open('client/src/pages/CustomerDashboard.tsx', 'w') as f:
    f.write(content)

print("CustomerDashboard.tsx patched")

# Verify
lines = content.split('\n')
for i, line in enumerate(lines, 1):
    if 'getNarrativeDeltas' in line or 'Narrative Intelligence' in line or 'deltasData' in line:
        print(f"  line {i}: {line.strip()[:80]}")

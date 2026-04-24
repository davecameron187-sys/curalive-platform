#!/bin/bash
echo "================================================================"
echo "CURALIVE SESSION CONTEXT — $(date '+%Y-%m-%d %H:%M')"
echo "================================================================"
echo ""
echo "=== PERMANENT BRIEF (blueprint, rules, architecture) ==="
cat CLAUDE_BRIEF.md
echo ""
echo "=== LAST 5 COMMITS ==="
git log --oneline -5
echo ""
echo "=== LAST SESSION (current state) ==="
awk '/^## SESSION:|^## PHASE 3 ALIGNMENT/{block=""} {block=block"\n"$0} END{print block}' SESSION_LOG.md
echo ""
echo "================================================================"
echo "CLAUDE: Read everything above. Confirm phase, commit, and"
echo "today's single objective before touching any code."
echo "================================================================"

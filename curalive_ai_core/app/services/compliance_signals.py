from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.schemas.event_ingest import CanonicalEventModel


FORWARD_LOOKING_PATTERNS = [
    r"\bwe\s+expect\b",
    r"\bwe\s+anticipate\b",
    r"\bwe\s+project\b",
    r"\bwe\s+forecast\b",
    r"\bwe\s+believe\b",
    r"\bour\s+guidance\b",
    r"\bour\s+outlook\b",
    r"\bgoing\s+forward\b",
    r"\bin\s+the\s+coming\b",
    r"\bnext\s+quarter\b",
    r"\bnext\s+year\b",
    r"\bby\s+year\s+end\b",
    r"\bby\s+(?:FY|fy|H[12])\b",
    r"\btarget(?:ing|ed|s)?\b",
    r"\bremain\s+committed\b",
    r"\bwe\s+aim\b",
    r"\bwe\s+intend\b",
    r"\bwe\s+plan\b",
    r"\bwill\s+(?:achieve|deliver|reach|grow|expand|improve|increase)\b",
    r"\bshould\s+(?:see|result|drive|lead)\b",
    r"\bpoised\s+to\b",
    r"\bon\s+track\s+to\b",
]

HEDGING_PATTERNS = [
    r"\bsubject\s+to\b",
    r"\bprovided\s+that\b",
    r"\bbarring\s+unforeseen\b",
    r"\bpending\s+(?:regulatory|board|approval)\b",
    r"\bno\s+guarantee\b",
    r"\bno\s+assurance\b",
    r"\bmay\s+not\b",
    r"\bcannot\s+(?:assure|guarantee|predict)\b",
    r"\buncertain(?:ty|ties)?\b",
    r"\bmaterial(?:ly)?\s+(?:adverse|different)\b",
    r"\brisk\s+factors?\b",
    r"\bforward.looking\s+statements?\b",
    r"\bactual\s+results\s+may\s+differ\b",
    r"\bapproximate(?:ly)?\b",
    r"\bin\s+the\s+region\s+of\b",
]

REGULATORY_TRIGGER_PATTERNS = [
    r"\bSEC\b",
    r"\bFSCA\b",
    r"\bJSE\b",
    r"\bCIPC\b",
    r"\bKing\s+IV\b",
    r"\bIFRS\b",
    r"\bGAAP\b",
    r"\bSOX\b",
    r"\bregulat(?:ory|ion|or)\b",
    r"\bcompliance\b",
    r"\bfiduciary\b",
    r"\bdisclosure\b",
    r"\bmaterial\s+information\b",
    r"\binsider\b",
    r"\bprice.sensitive\b",
    r"\bclosed\s+period\b",
    r"\bmarket\s+abuse\b",
    r"\bwhistleblow(?:er|ing)\b",
    r"\baudit\s+(?:committee|finding|opinion)\b",
    r"\brestatement\b",
]


@dataclass
class ComplianceFlag:
    segment_index: int
    speaker_id: str
    speaker_name: str | None
    text: str
    flag_type: str
    matched_pattern: str
    severity: str
    start_time: float | None


@dataclass
class ComplianceSummary:
    total_forward_looking: int = 0
    total_hedging: int = 0
    total_regulatory_triggers: int = 0
    speakers_with_flags: list[str] = field(default_factory=list)


@dataclass
class ComplianceSignalResult:
    module: str = "compliance_signals"
    total_flags: int = 0
    risk_level: str = "low"
    flags: list[ComplianceFlag] = field(default_factory=list)
    summary: ComplianceSummary = field(default_factory=ComplianceSummary)


def _find_matches(text: str, patterns: list[str]) -> list[str]:
    found = []
    lower = text.lower()
    for pat in patterns:
        if re.search(pat, lower):
            found.append(pat)
    return found


def _severity_for_type(flag_type: str) -> str:
    if flag_type == "regulatory_trigger":
        return "high"
    if flag_type == "forward_looking_statement":
        return "medium"
    return "low"


class ComplianceSignalService:
    def analyze(self, canonical: CanonicalEventModel) -> ComplianceSignalResult:
        if not canonical.segments:
            return ComplianceSignalResult()

        flags: list[ComplianceFlag] = []
        fwd_count = 0
        hedge_count = 0
        reg_count = 0
        speakers_flagged: set[str] = set()

        for idx, seg in enumerate(canonical.segments):
            fwd_matches = _find_matches(seg.text, FORWARD_LOOKING_PATTERNS)
            hedge_matches = _find_matches(seg.text, HEDGING_PATTERNS)
            reg_matches = _find_matches(seg.text, REGULATORY_TRIGGER_PATTERNS)

            for m in fwd_matches:
                fwd_count += 1
                speakers_flagged.add(seg.speaker_id)
                flags.append(ComplianceFlag(
                    segment_index=idx,
                    speaker_id=seg.speaker_id,
                    speaker_name=seg.speaker_name,
                    text=seg.text,
                    flag_type="forward_looking_statement",
                    matched_pattern=m,
                    severity="medium",
                    start_time=seg.start_time,
                ))

            for m in hedge_matches:
                hedge_count += 1
                speakers_flagged.add(seg.speaker_id)
                flags.append(ComplianceFlag(
                    segment_index=idx,
                    speaker_id=seg.speaker_id,
                    speaker_name=seg.speaker_name,
                    text=seg.text,
                    flag_type="hedging_language",
                    matched_pattern=m,
                    severity="low",
                    start_time=seg.start_time,
                ))

            for m in reg_matches:
                reg_count += 1
                speakers_flagged.add(seg.speaker_id)
                flags.append(ComplianceFlag(
                    segment_index=idx,
                    speaker_id=seg.speaker_id,
                    speaker_name=seg.speaker_name,
                    text=seg.text,
                    flag_type="regulatory_trigger",
                    matched_pattern=m,
                    severity="high",
                    start_time=seg.start_time,
                ))

        total = len(flags)
        if reg_count > 0:
            risk = "high"
        elif fwd_count > 3 or total > 5:
            risk = "medium"
        else:
            risk = "low"

        return ComplianceSignalResult(
            total_flags=total,
            risk_level=risk,
            flags=flags,
            summary=ComplianceSummary(
                total_forward_looking=fwd_count,
                total_hedging=hedge_count,
                total_regulatory_triggers=reg_count,
                speakers_with_flags=sorted(speakers_flagged),
            ),
        )

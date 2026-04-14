from dataclasses import dataclass


@dataclass
class AnalysisResult:
    module: str
    payload: dict


class SentimentService:
    def analyze(self, canonical_event_model: dict) -> AnalysisResult:
        return AnalysisResult(module="sentiment", payload={"summary": "stub", "score": 0.0})


class EngagementService:
    def analyze(self, canonical_event_model: dict) -> AnalysisResult:
        return AnalysisResult(module="engagement", payload={"summary": "stub", "score": 0.0})


class ComplianceSignalService:
    def analyze(self, canonical_event_model: dict) -> AnalysisResult:
        return AnalysisResult(module="compliance", payload={"flags": []})


class CommitmentExtractionService:
    def analyze(self, canonical_event_model: dict) -> AnalysisResult:
        return AnalysisResult(module="commitments", payload={"commitments": []})

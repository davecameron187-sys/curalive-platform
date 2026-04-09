from collections.abc import Iterable


class CanonicalEventBuilder:
    """Transforms heterogeneous provider payloads into a canonical event model."""

    def build(self, raw_payload: dict) -> dict:
        return {
            "session": {
                "session_id": raw_payload.get("session_id"),
                "started_at": raw_payload.get("started_at"),
                "ended_at": raw_payload.get("ended_at"),
                "source_platform": raw_payload.get("source_platform"),
            },
            "participants": raw_payload.get("participants", []),
            "utterances": raw_payload.get("utterances", []),
            "questions": raw_payload.get("questions", []),
            "metadata": raw_payload.get("metadata", {}),
        }

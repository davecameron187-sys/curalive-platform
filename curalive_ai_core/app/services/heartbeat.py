class IntelligenceExchangeLayer:
    """Heartbeat scaffold for cross-service propagation."""

    def propagate(self, source_module: str, payload: dict, destinations: list[str]) -> dict:
        return {
            "source_module": source_module,
            "destinations": destinations,
            "status": "propagated",
            "payload": payload,
        }


class InstitutionalKnowledgeProfileService:
    def update_profile(self, organisation_id: str, inputs: dict) -> dict:
        return {
            "organisation_id": organisation_id,
            "updated": True,
            "dimensions": list(inputs.keys()),
        }

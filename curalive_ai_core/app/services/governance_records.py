class GovernanceRecordService:
    def generate(self, event_context: dict, intelligence_outputs: dict) -> dict:
        return {
            "status": "draft",
            "minutes": [],
            "resolutions": [],
            "actions": [],
        }

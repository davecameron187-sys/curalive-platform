# CuraLive AI Core

Production-style FastAPI backend skeleton for the CuraLive intelligence layer.

## What is included
- Canonical event model
- Event ingestion API
- Analysis job orchestration stubs
- Commitment extraction scaffolding
- Compliance signal scaffolding
- Heartbeat / cross-service propagation scaffolding
- Governance record scaffolding
- PostgreSQL-ready SQLAlchemy models

## Quick start
```bash
cp .env.example .env
pip install -e .
uvicorn app.main:app --reload
```

## First modules to implement
1. Canonical event ingestion
2. Sentiment + engagement analysis
3. Compliance signal detection
4. Commitment extraction
5. Drift detection
6. Stakeholder intelligence
7. Governance record generation
8. Heartbeat propagation

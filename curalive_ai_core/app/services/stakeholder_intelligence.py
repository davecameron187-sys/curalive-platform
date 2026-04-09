from __future__ import annotations

import re
from dataclasses import dataclass, field

SENTIMENT_POSITIVE = [
    r"\b(?:strong|growth|outperform|buy|upgrade|optimistic|positive|confident|bullish|beat|exceeded)\b",
]
SENTIMENT_NEGATIVE = [
    r"\b(?:weak|decline|underperform|sell|downgrade|pessimistic|negative|concerned|bearish|miss|disappointed)\b",
]
SENTIMENT_NEUTRAL = [
    r"\b(?:hold|maintain|neutral|stable|steady|inline|in line|meets expectations)\b",
]

TOPIC_PATTERNS = {
    "revenue": r"\b(?:revenue|sales|top.?line|income)\b",
    "margins": r"\b(?:margin|ebitda|operating profit|gross profit|net margin)\b",
    "guidance": r"\b(?:guidance|outlook|forecast|target|projection)\b",
    "compliance": r"\b(?:compliance|regulatory|regulation|ifrs|gaap|governance)\b",
    "expansion": r"\b(?:expansion|new market|acquisition|growth strategy|geographic)\b",
    "risk": r"\b(?:risk|headwind|volatility|uncertainty|challenge|threat)\b",
    "dividend": r"\b(?:dividend|payout|distribution|capital return|buyback)\b",
    "leadership": r"\b(?:ceo|cfo|management|board|executive|leadership|succession)\b",
    "esg": r"\b(?:esg|sustainability|environmental|social|governance|carbon|climate)\b",
    "debt": r"\b(?:debt|leverage|balance sheet|liquidity|cash flow|gearing)\b",
}


@dataclass
class SignalAnalysis:
    sentiment: str
    sentiment_score: float
    topics: list[str]


def analyse_signal_content(content: str) -> SignalAnalysis:
    lower = content.lower()

    pos_count = sum(len(re.findall(p, lower)) for p in SENTIMENT_POSITIVE)
    neg_count = sum(len(re.findall(p, lower)) for p in SENTIMENT_NEGATIVE)
    neu_count = sum(len(re.findall(p, lower)) for p in SENTIMENT_NEUTRAL)

    total = pos_count + neg_count + neu_count
    if total == 0:
        sentiment = "neutral"
        score = 0.0
    else:
        score = (pos_count - neg_count) / total
        if score > 0.2:
            sentiment = "positive"
        elif score < -0.2:
            sentiment = "negative"
        elif pos_count > 0 and neg_count > 0:
            sentiment = "mixed"
        else:
            sentiment = "neutral"

    score = round(max(-1.0, min(1.0, score)), 2)

    topics: list[str] = []
    for topic, pattern in TOPIC_PATTERNS.items():
        if re.search(pattern, lower, re.IGNORECASE):
            topics.append(topic)

    return SignalAnalysis(sentiment=sentiment, sentiment_score=score, topics=topics)

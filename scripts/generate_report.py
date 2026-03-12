import asyncio
import json
import sys
import os

from emergentintegrations.llm.chat import LlmChat, UserMessage

PILLAR_NAMES = {
    'p1': 'Commercial Baseline', 'p2': 'ICP & Buyer Urgency',
    'p3': 'Positioning & Competitive Clarity', 'p4': 'Sales System Repeatability',
    'p5': 'Pipeline Generation', 'p6': 'Revconomics', 'p7': 'Strategic Constraints',
    'p8': 'Organisational Alignment & Capability', 'p9': 'Systems Readiness & AI Transformation',
}

async def generate_report(data):
    api_key = data.get('api_key', os.environ.get('EMERGENT_LLM_KEY', ''))
    scores = data.get('scores', {})
    screener = data.get('screener_responses', {})
    diagnostic = data.get('diagnostic_responses', {})
    company = screener.get('q4', 'Unknown Company')
    industry = screener.get('q5', 'Unknown Industry')

    chat = LlmChat(
        api_key=api_key,
        session_id=f"report-{data.get('project_id', 'default')}",
        system_message="""You are a senior B2B revenue growth diagnostic expert. You produce executive-quality diagnostic reports for CEO/board-level audiences. Your analysis is sharp, data-driven, and actionable. You write in a professional consulting tone — direct, insightful, and strategic. Always return valid JSON."""
    ).with_model("anthropic", "claude-4-sonnet-20250514")

    pillar_scores = scores.get('pillarScores', {})
    rad_score = scores.get('radScore', 0)
    maturity = scores.get('maturityBand', 'Unknown')
    constraint = scores.get('primaryConstraint', {})
    raps = scores.get('raps', {})

    pillar_summary = "\n".join([
        f"- {PILLAR_NAMES.get(pid, pid)}: Score {ps.get('score', 0)}/100 (avg {ps.get('avg', 0)}/5)"
        for pid, ps in pillar_scores.items()
    ])

    qualitative_p3 = diagnostic.get('p3_q12', 'Not provided')
    qualitative_p7 = diagnostic.get('p7_q6', 'Not provided')
    qualitative_p8 = diagnostic.get('p8_q13', 'Not provided')
    qualitative_p9 = diagnostic.get('p9_q13', 'Not provided')
    positioning = screener.get('q12', 'Not provided')
    competitors = screener.get('q13', 'Not provided')
    markets = screener.get('q6', 'Not provided')

    prompt = f"""Generate a comprehensive diagnostic report for {company} ({industry}).

COMPANY DATA:
- Revenue Range: {screener.get('q7', 'N/A')}
- Sales Staff: {screener.get('q8', 'N/A')}
- Marketing Budget: {screener.get('q9', 'N/A')}
- Sales Model: {screener.get('q10', 'N/A')}
- GTM Channels: {screener.get('q11', 'N/A')}
- Positioning: {positioning}
- Competitors: {competitors}
- Deal Size: {screener.get('q14', 'N/A')}
- Sales Cycle: {screener.get('q15', 'N/A')}
- Pipeline Coverage: {screener.get('q16', 'N/A')}
- Win Rate: {screener.get('q17', 'N/A')}
- Revenue Target: ${screener.get('q18', '0')}
- Revenue Invoiced: ${screener.get('q19', '0')}
- Markets: {markets}

SCORES:
- RAD Growth System Score: {rad_score}/100
- Maturity Band: {maturity}
- Primary Growth Constraint: {constraint.get('name', 'N/A')} (score: {constraint.get('score', 0)})

PILLAR SCORES:
{pillar_summary}

QUALITATIVE RESPONSES:
- Positioning Challenge (P3-Q12): {qualitative_p3}
- Strategic Constraint (P7-Q6): {qualitative_p7}
- Organisational Alignment (P8-Q13): {qualitative_p8}
- Systems & AI Readiness (P9-Q13): {qualitative_p9}

RAPS DATA:
- RAPS Score: {raps.get('score', 0)}%
- Revenue Remaining: ${raps.get('revenueRemaining', 0):,.0f}
- Months Remaining: {raps.get('monthsRemaining', 0)}
- Pipeline Coverage: {raps.get('pipelineCoverage', 0)}x
- Win Rate: {raps.get('winRate', 0)*100:.0f}%

Return a JSON object with these exact keys. Each narrative should be 2-4 sentences. Action items should be specific and actionable (3-5 per phase):

{{
  "executive_summary": "2-3 paragraph executive summary of the diagnostic results",
  "pillar_narratives": {{
    "p1": "narrative for Commercial Baseline",
    "p2": "narrative for ICP & Buyer Urgency",
    "p3": "narrative for Positioning & Competitive Clarity",
    "p4": "narrative for Sales System Repeatability",
    "p5": "narrative for Pipeline Generation",
    "p6": "narrative for Revconomics",
    "p7": "narrative for Strategic Constraints",
    "p8": "narrative for Organisational Alignment & Capability",
    "p9": "narrative for Systems Readiness & AI Transformation"
  }},
  "positioning_assessment": "2-3 paragraphs on positioning potency based on the positioning statement, competitors, and P3 scores",
  "strategic_moat_score": <number 1-10>,
  "strategic_moat_narrative": "1-2 paragraphs on strategic moat strength",
  "raps_narrative": "2 paragraphs explaining the RAPS score and what it means for revenue achievement",
  "raps_improvement_scenario": "1 paragraph describing a specific improvement scenario",
  "action_plan": {{
    "phase1_title": "Critical Fixes (0-30 Days)",
    "phase1_items": ["action 1", "action 2", "action 3"],
    "phase2_title": "Important Improvements (30-60 Days)",
    "phase2_items": ["action 1", "action 2", "action 3"],
    "phase3_title": "Consolidation & Growth (60-90 Days)",
    "phase3_items": ["action 1", "action 2", "action 3"]
  }}
}}

IMPORTANT: Return ONLY the JSON object, no markdown code blocks or extra text."""

    response = await chat.send_message(UserMessage(text=prompt))

    # Parse the response as JSON
    try:
        # Remove any markdown code blocks if present
        text = response.strip()
        if text.startswith('```'):
            text = text.split('\n', 1)[1] if '\n' in text else text[3:]
        if text.endswith('```'):
            text = text[:-3]
        if text.startswith('json'):
            text = text[4:]
        report = json.loads(text.strip())
    except json.JSONDecodeError:
        # If JSON parsing fails, create a structured response from the text
        report = {
            "executive_summary": response[:500] if len(response) > 500 else response,
            "pillar_narratives": {pid: f"Score: {ps.get('score', 0)}/100" for pid, ps in pillar_scores.items()},
            "positioning_assessment": "Analysis pending.",
            "strategic_moat_score": 5,
            "strategic_moat_narrative": "Assessment pending.",
            "raps_narrative": f"RAPS Score: {raps.get('score', 0)}%",
            "raps_improvement_scenario": "Improvement scenarios available upon full analysis.",
            "action_plan": {
                "phase1_title": "Critical Fixes (0-30 Days)",
                "phase1_items": ["Review and address red-zone pillar items"],
                "phase2_title": "Important Improvements (30-60 Days)",
                "phase2_items": ["Address amber-zone items before they deteriorate"],
                "phase3_title": "Consolidation & Growth (60-90 Days)",
                "phase3_items": ["Strengthen green-zone items for resilience"]
            }
        }

    return report


async def generate_market_report(data):
    api_key = data.get('api_key', os.environ.get('EMERGENT_LLM_KEY', ''))
    markets = data.get('markets', '')
    industry = data.get('industry', 'Technology')
    company = data.get('company', 'the company')

    if not markets or markets == 'Not provided':
        markets = 'United States'

    # Parse markets (could be comma-separated string or list)
    if isinstance(markets, str):
        country_list = [c.strip() for c in markets.split(',') if c.strip()]
    else:
        country_list = markets

    # Limit to first 3 countries
    country_list = country_list[:3]

    chat = LlmChat(
        api_key=api_key,
        session_id=f"market-{data.get('project_id', 'default')}",
        system_message="You are a market research analyst specializing in B2B market intelligence. Provide data-driven market assessments. Return only valid JSON."
    ).with_model("anthropic", "claude-4-sonnet-20250514")

    prompt = f"""Generate a market opportunity report for {company} in the {industry} sector for these markets: {', '.join(country_list)}.

For EACH country, provide analysis across 5 macro dimensions. Return JSON:

{{
  "countries": [
    {{
      "name": "Country Name",
      "dimensions": [
        {{"name": "Economic Environment", "findings": ["finding 1", "finding 2", "finding 3"]}},
        {{"name": "Political & Regulatory", "findings": ["finding 1", "finding 2", "finding 3"]}},
        {{"name": "Geopolitical Factors", "findings": ["finding 1", "finding 2", "finding 3"]}},
        {{"name": "Socio-economic Trends", "findings": ["finding 1", "finding 2", "finding 3"]}},
        {{"name": "Industry Growth Outlook", "findings": ["finding 1", "finding 2", "finding 3"]}}
      ],
      "growth_propensity": "High|Medium-High|Medium|Low",
      "key_drivers": "2-3 sentence summary of key growth drivers",
      "risks": "2-3 sentence summary of key risks",
      "strategic_implications": "2-3 sentence strategic recommendation"
    }}
  ]
}}

Return ONLY JSON, no markdown blocks."""

    response = await chat.send_message(UserMessage(text=prompt))

    try:
        text = response.strip()
        if text.startswith('```'):
            text = text.split('\n', 1)[1] if '\n' in text else text[3:]
        if text.endswith('```'):
            text = text[:-3]
        if text.startswith('json'):
            text = text[4:]
        return json.loads(text.strip())
    except json.JSONDecodeError:
        return {"countries": [{"name": c, "dimensions": [], "growth_propensity": "Medium", "key_drivers": "Data pending", "risks": "Data pending", "strategic_implications": "Analysis pending"} for c in country_list]}


async def main():
    data = json.load(sys.stdin)
    action = data.get('action', 'report')

    if action == 'report':
        result = await generate_report(data)
    elif action == 'market':
        result = await generate_market_report(data)
    else:
        result = {"error": "Unknown action"}

    print(json.dumps(result))


if __name__ == '__main__':
    asyncio.run(main())

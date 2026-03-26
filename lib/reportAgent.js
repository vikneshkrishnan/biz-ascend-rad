import Anthropic from '@anthropic-ai/sdk'
import { CAUSAL_LINKAGES, BANNED_PHRASES, CONSTRAINT_TYPE_MAP, CLUSTER_DEFINITIONS } from '@/lib/constants'

const PILLAR_NAMES = {
  p1: 'Commercial Baseline', p2: 'ICP & Buyer Urgency',
  p3: 'Positioning & Competitive Clarity', p4: 'Sales System Repeatability',
  p5: 'Pipeline Generation', p6: 'Revenue Economics', p7: 'Strategic Constraints',
  p8: 'Organisational Alignment & Capability', p9: 'Systems Readiness & AI Transformation',
}

const SYSTEM_PROMPT = `You are a senior B2B revenue growth diagnostic expert producing executive-quality reports for CEO/board-level audiences. Your tone is direct, insight-led, and commercially specific. Never use boilerplate. Every sentence must be grounded in the company's data. Banned phrases: 'In today's competitive landscape', 'It is worth noting', 'As we can see', 'Moving forward', 'In conclusion', 'Needless to say', 'It goes without saying', 'At the end of the day'. Always lead with the conclusion, then support with evidence.`

const MODEL = 'claude-sonnet-4-6'

// --- Structured output schemas ---

const EXECUTIVE_SUMMARY_SCHEMA = {
  name: 'executive_summary',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['paragraphs', 'headline_results_description', 'overall_diagnosis', 'what_is_broken', 'secondary_findings', 'positioning_assessment_bullets', 'bottom_line', 'section_takeaway', 'data_source'],
    properties: {
      paragraphs: { type: 'array', items: { type: 'string' } },
      headline_results_description: { type: 'string', description: '3-5 word descriptor matching band severity, e.g. "Growth System Underpowered"' },
      overall_diagnosis: { type: 'array', items: { type: 'string' }, description: '3-4 bullets summarising the diagnostic pattern. Must reference specific pillar scores.' },
      what_is_broken: { type: 'array', items: { type: 'string' }, description: '3-5 bullets on primary constraint. Must include specific scores, deal sizes, and quantified gaps.' },
      secondary_findings: { type: 'array', items: { type: 'string' }, description: '3-5 bullets on secondary constraint pillars and their causal interactions.' },
      positioning_assessment_bullets: { type: 'array', items: { type: 'string' }, description: '1-3 bullets critiquing the positioning statement against competitors and market.' },
      bottom_line: { type: 'array', items: { type: 'string' }, description: '3 bullets: RAPS score and band, revenue at risk amount, single highest-leverage 30-day action.' },
      section_takeaway: { type: 'array', items: { type: 'string' }, description: 'Exactly 2 paragraphs. First: synthesise findings. Second: implication or path forward.' },
      data_source: { type: 'string' },
    },
  },
}

const PILLAR_NARRATIVE_SCHEMA = {
  name: 'pillar_narrative',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['narrative', 'strength_points', 'critical_friction_points', 'respondentSignal', 'positioning_critique', 'what_this_score_means', 'assessment', 'strength_points_narrative', 'section_takeaway', 'data_source'],
    properties: {
      narrative: { type: 'string' },
      strength_points: { type: 'array', items: { type: 'string' } },
      critical_friction_points: { type: 'array', items: { type: 'string' } },
      respondentSignal: { type: ['string', 'null'] },
      positioning_critique: { type: ['string', 'null'] },
      what_this_score_means: { type: 'string', description: 'One paragraph explaining what this pillar score means for the company.' },
      assessment: { type: 'string', description: 'Full synthesis paragraph assessing this pillar.' },
      strength_points_narrative: { type: 'string', description: 'Narrative paragraph about questions scoring 4 or 5. If none, explain what it means.' },
      section_takeaway: { type: 'array', items: { type: 'string' }, description: 'Exactly 2 paragraphs. First: synthesise the section findings. Second: state the implication or path forward.' },
      data_source: { type: 'string' },
    },
  },
}

const COMPETITIVE_POSITIONING_SCHEMA = {
  name: 'competitive_positioning',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['introduction', 'comparative_company_facts', 'company_facts_assessment', 'growth_evidence_signals', 'evidence_signals_assessment', 'positioning_statements', 'positioning_analysis', 'recommended_positioning_direction', 'growth_based_assessment', 'growth_assessment_narrative', 'section_takeaway', 'data_source'],
    properties: {
      introduction: { type: 'string', description: 'Opening paragraph introducing the competitive positioning analysis.' },
      comparative_company_facts: {
        type: 'object', additionalProperties: false, required: ['column_headers', 'rows', 'sources_line'],
        properties: {
          column_headers: { type: 'array', items: { type: 'string' }, description: 'Headers for the comparison table. First is the field label, rest are company names (target + competitors).' },
          rows: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['field', 'values'], properties: { field: { type: 'string', description: 'Row label (e.g. Founded, Revenue, Employees, Industry, HQ).' }, values: { type: 'array', items: { type: 'string' }, description: 'One value per column_header (excluding the field label column).' } } }, description: 'At least 5 rows comparing key company facts.' },
          sources_line: { type: 'string', description: 'Italic sources attribution line e.g. "Sources: SGX filings, company annual reports (FY2024/FY2025), company websites."' },
        },
      },
      company_facts_assessment: { type: 'string', description: 'Narrative assessment of what the comparative company facts reveal about competitive dynamics.' },
      growth_evidence_signals: {
        type: 'object', additionalProperties: false, required: ['column_headers', 'rows', 'sources_line'],
        properties: {
          column_headers: { type: 'array', items: { type: 'string' }, description: 'Headers for growth evidence table. First is the signal label, rest are company names.' },
          rows: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['field', 'values'], properties: { field: { type: 'string', description: 'Growth signal name (e.g. Hiring velocity, Funding rounds, Product launches).' }, values: { type: 'array', items: { type: 'string' }, description: 'One value per company column.' } } }, description: 'At least 4 rows of growth evidence signals.' },
          sources_line: { type: 'string', description: 'Italic sources attribution line e.g. "Sources: SGX filings, company annual reports, investor presentations, company websites, PitchBook."' },
        },
      },
      evidence_signals_assessment: { type: 'string', description: 'Narrative assessment of growth evidence signals and competitive trajectory.' },
      positioning_statements: {
        type: 'array',
        items: { type: 'object', additionalProperties: false, required: ['company_name', 'statement', 'source_ref'], properties: { company_name: { type: 'string' }, statement: { type: 'string', description: 'The company positioning statement or value proposition.' }, source_ref: { type: 'string', description: 'Where the statement was sourced from (e.g. website, pitch deck).' } } },
        description: 'Positioning statements for the target company and each competitor. At least 2 entries.',
      },
      positioning_analysis: { type: 'string', description: 'Detailed analysis comparing the positioning statements — strengths, weaknesses, overlaps, and gaps.' },
      recommended_positioning_direction: {
        type: 'object', additionalProperties: false, required: ['guidance', 'example_statement', 'caveat'],
        properties: {
          guidance: { type: 'string', description: 'Strategic guidance on how to reposition.' },
          example_statement: { type: 'string', description: 'An example improved positioning statement.' },
          caveat: { type: 'string', description: 'Important caveats or conditions for this recommendation.' },
        },
      },
      growth_based_assessment: {
        type: 'object', additionalProperties: false, required: ['column_headers', 'dimensions'],
        properties: {
          column_headers: { type: 'array', items: { type: 'string' }, description: 'Company names as column headers for the scoring table.' },
          dimensions: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['dimension', 'scores'], properties: { dimension: { type: 'string', description: 'Scoring dimension (e.g. Revenue Scale, Profitability Strength, Positioning Clarity).' }, scores: { type: 'array', items: { type: 'integer' }, description: 'Score (1-5) for each company. Must match column_headers length.' } } }, description: 'Exactly 8 scoring dimensions.' },
        },
      },
      growth_assessment_narrative: { type: 'string', description: 'Narrative interpreting the growth-based assessment scores.' },
      section_takeaway: {
        type: 'object', additionalProperties: false, required: ['paragraphs'],
        properties: { paragraphs: { type: 'array', items: { type: 'string' }, description: 'Exactly 2 paragraphs. First: synthesise the competitive positioning findings. Second: state the implication or path forward.' } },
      },
      data_source: { type: 'string' },
    },
  },
}

const SCORECARD_EXPLANATION_SCHEMA = {
  name: 'scorecard_explanation',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['bullets', 'data_source'],
    properties: {
      bullets: { type: 'array', items: { type: 'string' } },
      data_source: { type: 'string' },
    },
  },
}

const RAPS_NARRATIVE_SCHEMA = {
  name: 'raps_narrative',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['narrative', 'why_factors', 'must_improve', 'scenarios_narrative', 'raps_narrative_bullets', 'scenario_analysis', 'section_takeaway', 'data_source'],
    properties: {
      narrative: { type: 'string' },
      why_factors: { type: 'array', items: { type: 'string' } },
      must_improve: { type: 'array', items: { type: 'string' } },
      scenarios_narrative: { type: 'string' },
      raps_narrative_bullets: { type: 'array', items: { type: 'string' }, description: '5-6 bullets: target, YTD, remaining, conversion reality, revenue at risk.' },
      scenario_analysis: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['scenario', 'win_rate', 'pipeline_coverage', 'projected_raps', 'probability'],
          properties: {
            scenario: { type: 'string' },
            win_rate: { type: 'string' },
            pipeline_coverage: { type: 'string' },
            projected_raps: { type: 'string' },
            probability: { type: 'string' },
          },
        },
        description: '3 rows: current state, quick wins, full optimisation.',
      },
      section_takeaway: { type: 'array', items: { type: 'string' }, description: 'Exactly 2 paragraphs. First: synthesise the section findings. Second: state the implication or path forward.' },
      data_source: { type: 'string' },
    },
  },
}

const ACTION_ITEM_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['action', 'pillar', 'ideal_owner', 'deliverable', 'metric'],
  properties: {
    action: { type: 'string' },
    pillar: { type: 'string' },
    ideal_owner: { type: 'string' },
    deliverable: { type: 'string' },
    metric: { type: 'string' },
  },
}

const ACTION_ROADMAP_SCHEMA = {
  name: 'action_roadmap',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['phase1_title', 'phase1_items', 'phase2_title', 'phase2_items', 'phase3_title', 'phase3_items', 'introduction', 'roadmap_rationale', 'qualitative_coverage_table', 'section_takeaway', 'data_source'],
    properties: {
      phase1_title: { type: 'string' },
      phase1_items: { type: 'array', items: ACTION_ITEM_SCHEMA },
      phase2_title: { type: 'string' },
      phase2_items: { type: 'array', items: ACTION_ITEM_SCHEMA },
      phase3_title: { type: 'string' },
      phase3_items: { type: 'array', items: ACTION_ITEM_SCHEMA },
      introduction: { type: 'string' },
      roadmap_rationale: { type: 'array', items: { type: 'string' }, description: '4-5 bullets: phase-by-phase rationale + expected revenue impact.' },
      qualitative_coverage_table: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['question_ref', 'question_text', 'submitted_response', 'corrective_action'],
          properties: {
            question_ref: { type: 'string' },
            question_text: { type: 'string' },
            submitted_response: { type: 'string' },
            corrective_action: { type: 'string' },
          },
        },
        description: 'Maps each of the 5 qualitative responses to a corrective action in the roadmap.',
      },
      section_takeaway: { type: 'array', items: { type: 'string' }, description: 'Exactly 2 paragraphs. First: synthesise the section findings. Second: state the implication or path forward.' },
      data_source: { type: 'string' },
    },
  },
}

const CROSS_PILLAR_SCHEMA = {
  name: 'cross_pillar_interaction',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['causal_links', 'reinforcing_loops', 'narrative', 'introduction', 'primary_causal_chain', 'reinforcing_loop', 'intervention_sequence', 'section_takeaway', 'data_source'],
    properties: {
      causal_links: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['from_pillar', 'to_pillar', 'mechanism', 'severity'],
          properties: {
            from_pillar: { type: 'string' },
            to_pillar: { type: 'string' },
            mechanism: { type: 'string' },
            severity: { type: 'string' },
          },
        },
      },
      reinforcing_loops: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['pillars', 'description'],
          properties: {
            pillars: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' },
          },
        },
      },
      narrative: { type: 'string' },
      introduction: { type: 'string', description: 'Opening paragraph.' },
      primary_causal_chain: {
        type: 'object',
        additionalProperties: false,
        required: ['nodes', 'explanation_bullets'],
        properties: {
          nodes: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['pillar_label', 'connector_label'],
              properties: {
                pillar_label: { type: 'string' },
                connector_label: { type: 'string' },
              },
            },
          },
          explanation_bullets: { type: 'array', items: { type: 'string' }, description: '5 bullets: root cause, first-order, second-order, cascade, why this entry point.' },
        },
      },
      reinforcing_loop: {
        type: 'object',
        additionalProperties: false,
        required: ['nodes', 'explanation_bullets'],
        properties: {
          nodes: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['pillar_id', 'label', 'sub_label'],
              properties: {
                pillar_id: { type: 'string' },
                label: { type: 'string' },
                sub_label: { type: 'string' },
              },
            },
          },
          explanation_bullets: { type: 'array', items: { type: 'string' } },
        },
      },
      intervention_sequence: {
        type: 'object',
        additionalProperties: false,
        required: ['steps', 'explanation_bullets'],
        properties: {
          steps: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['step_number', 'title', 'subtitle', 'timeline'],
              properties: {
                step_number: { type: 'integer' },
                title: { type: 'string' },
                subtitle: { type: 'string' },
                timeline: { type: 'string' },
              },
            },
          },
          explanation_bullets: { type: 'array', items: { type: 'string' } },
        },
      },
      section_takeaway: { type: 'array', items: { type: 'string' }, description: 'Exactly 2 paragraphs. First: synthesise the section findings. Second: state the implication or path forward.' },
      data_source: { type: 'string' },
    },
  },
}

const STRATEGIC_SIGNALS_SCHEMA = {
  name: 'strategic_signals',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['signals', 'narrative', 'diagnostic_awareness', 'section_takeaway', 'data_source'],
    properties: {
      signals: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['pillar', 'type', 'title', 'description', 'implication', 'signal_type'],
          properties: {
            pillar: { type: 'string' },
            type: { type: 'string' },
            title: { type: 'string', description: 'Short descriptive title e.g. "Execution vs Strategy Gap"' },
            description: { type: 'string' },
            implication: { type: 'string' },
            signal_type: { type: 'string' },
          },
        },
      },
      narrative: { type: 'string' },
      diagnostic_awareness: { type: 'string' },
      section_takeaway: { type: 'array', items: { type: 'string' }, description: 'Exactly 2 paragraphs. First: synthesise the section findings. Second: state the implication or path forward.' },
      data_source: { type: 'string' },
    },
  },
}

const ORG_SYSTEMS_SCHEMA = {
  name: 'org_systems_readiness',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['parts', 'cluster_analysis', 'narrative', 'introduction', 'readiness_paradox', 'ai_readiness', 'summary', 'section_takeaway', 'data_source'],
    properties: {
      parts: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'content'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
          },
        },
      },
      cluster_analysis: {
        type: 'object',
        additionalProperties: false,
        required: ['org_alignment_score', 'systems_readiness_score', 'ai_readiness_index'],
        properties: {
          org_alignment_score: { type: 'number' },
          systems_readiness_score: { type: 'number' },
          ai_readiness_index: { type: ['number', 'null'] },
        },
      },
      narrative: { type: 'string' },
      introduction: { type: 'string', description: 'Opening paragraph introducing the org & systems readiness assessment.' },
      readiness_paradox: { type: 'string', description: 'Joint implication paragraph about the readiness paradox.' },
      ai_readiness: { type: 'string', description: 'AI readiness status narrative.' },
      summary: { type: 'string', description: 'Summary takeaway paragraph.' },
      section_takeaway: { type: 'array', items: { type: 'string' }, description: 'Exactly 2 paragraphs. First: synthesise the section findings. Second: state the implication or path forward.' },
      data_source: { type: 'string' },
    },
  },
}

const ADVISORY_WORKSTREAM_SCHEMA = {
  name: 'advisory_workstream',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['recommended_engagement', 'focus_areas', 'expected_outcomes', 'engagement_framework', 'raps_connection', 'sequence_logic', 'advisory_rationale', 'section_takeaway', 'data_source'],
    properties: {
      recommended_engagement: { type: 'string' },
      focus_areas: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['focus_area', 'scope', 'timeline', 'ideal_owner', 'outcome'],
          properties: {
            focus_area: { type: 'string' },
            scope: { type: 'string' },
            timeline: { type: 'string' },
            ideal_owner: { type: 'string' },
            outcome: { type: 'string' },
          },
        },
      },
      expected_outcomes: { type: 'array', items: { type: 'string' } },
      engagement_framework: { type: 'string' },
      raps_connection: { type: 'array', items: { type: 'string' } },
      sequence_logic: { type: 'string' },
      advisory_rationale: { type: 'string', description: 'Why this sequence of growth areas.' },
      section_takeaway: { type: 'array', items: { type: 'string' }, description: 'Exactly 2 paragraphs. First: synthesise the section findings. Second: state the implication or path forward.' },
      data_source: { type: 'string' },
    },
  },
}

const CLOSING_OBSERVATION_SCHEMA = {
  name: 'closing_observation',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['closing_narrative', 'paragraphs', 'section_takeaway', 'data_source'],
    properties: {
      closing_narrative: { type: 'string' },
      paragraphs: { type: 'array', items: { type: 'string' }, description: '3-4 closing paragraphs. Final synthesis of the full diagnostic.' },
      section_takeaway: { type: 'array', items: { type: 'string' }, description: 'Exactly 2 paragraphs. First: synthesise the section findings. Second: state the implication or path forward.' },
      data_source: { type: 'string' },
    },
  },
}

const CONSTRAINT_ANALYSIS_SCHEMA = {
  name: 'constraint_analysis',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['diagnosis', 'score_context', 'key_friction_points', 'revenue_impact', 'cascade_effect', 'recommended_focus', 'revenue_impact_estimation', 'constraint_type', 'what_good_looks_like', 'friction_points_table', 'cascade_diagram', 'section_takeaway', 'data_source'],
    properties: {
      diagnosis: { type: 'string' },
      score_context: { type: 'string' },
      key_friction_points: { type: 'array', items: { type: 'string' } },
      revenue_impact: { type: 'array', items: { type: 'string' } },
      cascade_effect: { type: 'array', items: { type: 'string' } },
      recommended_focus: { type: 'string' },
      revenue_impact_estimation: { type: 'string' },
      constraint_type: { type: 'string' },
      what_good_looks_like: { type: 'array', items: { type: 'string' }, description: '4-6 bullets describing what 80%+ looks like for this pillar.' },
      friction_points_table: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['friction_point', 'impact', 'root_cause'],
          properties: {
            friction_point: { type: 'string' },
            impact: { type: 'string' },
            root_cause: { type: 'string' },
          },
        },
        description: '2-5 rows for a friction points table with 3 columns.',
      },
      cascade_diagram: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['label', 'connector_label'],
          properties: {
            label: { type: 'string' },
            connector_label: { type: 'string', description: 'Arrow label to next node. Empty for last.' },
          },
        },
        description: '4 nodes for cascade diagram: primary constraint -> secondary -> tertiary -> revenue outcome',
      },
      section_takeaway: { type: 'array', items: { type: 'string' }, description: 'Exactly 2 paragraphs. First: synthesise the section findings. Second: state the implication or path forward.' },
      data_source: { type: 'string' },
    },
  },
}

function parseJsonResponse(text) {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.split('\n').slice(1).join('\n')
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }
  if (cleaned.startsWith('json')) {
    cleaned = cleaned.slice(4)
  }
  cleaned = cleaned.trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1))
    }
    throw new SyntaxError(`No valid JSON found in response: ${cleaned.slice(0, 80)}...`)
  }
}

function buildContext(data) {
  const scores = data.scores || {}
  const screener = data.screener_responses || {}
  const diagnostic = data.diagnostic_responses || {}
  const company = screener.q4 || 'Unknown Company'
  const industry = screener.q5 || 'Unknown Industry'

  const pillarScores = scores.pillarScores || {}
  const radScore = scores.radScore || 0
  const maturity = scores.maturityBand || 'Unknown'
  const constraint = scores.primaryConstraint || {}
  const constraints = scores.constraints || []
  const growthLeaks = scores.growthLeaks || []
  const raps = scores.raps || {}

  const pillarSummary = Object.entries(pillarScores)
    .map(([pid, ps]) => `- ${PILLAR_NAMES[pid] || pid}: Score ${ps.score || 0}/100 (avg ${ps.avg || 0}/5)`)
    .join('\n')

  const winRate = raps.winRate ? (raps.winRate * 100).toFixed(0) : '0'
  const revenueRemaining = raps.revenueRemaining ? Number(raps.revenueRemaining).toLocaleString() : '0'
  const openPipeline = raps.openPipeline ? Number(raps.openPipeline).toLocaleString() : '0'
  const expectedConvertible = raps.expectedConvertible ? Number(Math.round(raps.expectedConvertible)).toLocaleString() : '0'
  const requiredMonthly = raps.requiredMonthlyRevenue ? Number(Math.round(raps.requiredMonthlyRevenue)).toLocaleString() : '0'

  const qualitativeP3 = diagnostic.p3_q12 || 'Not provided'
  const qualitativeP3b = diagnostic.p3_q13 || 'Not provided'
  const qualitativeP7 = diagnostic.p7_q6 || 'Not provided'
  const qualitativeP8 = diagnostic.p8_q13 || 'Not provided'
  const qualitativeP9 = diagnostic.p9_q13 || 'Not provided'
  const positioning = screener.q12 || 'Not provided'
  const competitors = screener.q13 || 'Not provided'
  const markets = screener.q6 || 'Not provided'

  const dataBlock = `COMPANY: ${company} (${industry})

COMPANY DATA:
- Revenue Range: ${screener.q7 || 'N/A'}
- Sales Staff: ${screener.q8 || 'N/A'}
- Marketing Budget: ${screener.q9 || 'N/A'}
- Sales Model: ${screener.q10 || 'N/A'}
- GTM Channels: ${screener.q11 || 'N/A'}
- Positioning Statement: ${positioning}
- Competitors: ${competitors}
- Deal Size: ${screener.q14 || 'N/A'}
- Sales Cycle: ${screener.q15 || 'N/A'}
- Open Pipeline: $${openPipeline}
- Win Rate: ${screener.q17 || 'N/A'}
- Revenue Target: $${screener.q18 || '0'}
- Revenue Invoiced: $${screener.q19 || '0'}
- Markets: ${markets}

SCORES:
- RAD Growth System Score: ${radScore}/100
- Maturity Band: ${maturity}
- Primary Growth Constraint: ${constraint.name || 'N/A'} (score: ${constraint.score || 0})

PILLAR SCORES:
${pillarSummary}

QUALITATIVE RESPONSES:
- Positioning Challenge (P3-Q12): ${qualitativeP3}
- Differentiated Value vs Customers (P3-Q13): ${qualitativeP3b}
- Strategic Constraint (P7-Q6): ${qualitativeP7}
- Organisational Alignment (P8-Q13): ${qualitativeP8}
- Systems & AI Readiness (P9-Q13): ${qualitativeP9}

RAPS DATA:
- RAPS Score: ${raps.score || 0}/100 — ${raps.label || 'N/A'}
- Revenue Remaining: $${revenueRemaining}
- Required Monthly Revenue: $${requiredMonthly}
- Months Remaining: ${raps.monthsRemaining || 0}
- Open Pipeline Value: $${openPipeline}
- Expected Convertible Revenue: $${expectedConvertible}
- Coverage Ratio: ${raps.coverageRatio || 0} (${raps.coverageRating || 'N/A'})
- Win Rate: ${winRate}%
- Base Probability: ${raps.baseProbability || 0}
- RAD Modifier: ${raps.radModifierValue > 0 ? '+' : ''}${raps.radModifierValue || 0}`

  // Build per-pillar question-level detail for narratives
  const pillarQuestionDetails = {}
  for (const pid of Object.keys(PILLAR_NAMES)) {
    const questions = []
    for (const [key, val] of Object.entries(diagnostic)) {
      if (key.startsWith(pid + '_') && typeof val === 'number') {
        questions.push({ id: key, score: val })
      }
    }
    pillarQuestionDetails[pid] = questions
  }

  const isHighPerformer = radScore > 75

  return {
    company, industry, scores, screener, diagnostic,
    pillarScores, radScore, maturity, constraint, constraints, growthLeaks,
    raps, dataBlock, pillarQuestionDetails, positioning, competitors,
    qualitativeP3, qualitativeP3b, qualitativeP7, qualitativeP8, qualitativeP9,
    isHighPerformer, markets,
  }
}

async function callSection(client, sectionName, userPrompt, ctx, schema, maxTokens = 4096) {
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      output_config: { format: { type: 'json_schema', schema: schema.schema } },
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: ctx.dataBlock,
              cache_control: { type: 'ephemeral' },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
    })
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('')
    return JSON.parse(text)
  } catch (err) {
    console.error(`[reportAgent] Section "${sectionName}" failed:`, err.message)
    return null
  }
}

async function generateExecutiveSummary(client, ctx) {
  // C2: Get 2 lowest-scoring questions in constraint pillar
  const constraintQuestions = ctx.pillarQuestionDetails[ctx.constraint.id] || []
  const lowestConstraintQs = [...constraintQuestions].sort((a, b) => a.score - b.score).slice(0, 2)
  const lowestQsText = lowestConstraintQs.map(q => `${q.id}: ${q.score}/5`).join(', ') || 'N/A'

  // Get secondary constraints for secondary_findings
  const secondaryConstraints = ctx.constraints.slice(1, 4).map(c => `${c.name} (${c.id}: ${c.score}/100)`).join(', ') || 'N/A'

  const prompt = `Generate an executive summary for ${ctx.company}.

Requirements:
- "paragraphs": Exactly 4 paragraphs, 250-350 words total
  - Paragraph 1: Overall RAD score (${ctx.radScore}/100), maturity band (${ctx.maturity}), and what this means for the business. Explicitly state the RAPS score: ${ctx.raps.score || 0}/100 (${ctx.raps.label || 'N/A'})
  - Paragraph 2: Top 3 operational strengths with specific evidence from pillar scores
  - Paragraph 3: Primary constraint (${ctx.constraint.name || 'N/A'}, score ${ctx.constraint.score || 0}) and its downstream impact. Reference the 2 lowest-scoring questions in this pillar: ${lowestQsText}
  - Paragraph 4: Revenue risk (using RAPS data) and the single highest-leverage action to address the primary constraint

- "headline_results_description": A 3-5 word descriptor matching band severity (e.g. "Growth System Underpowered", "Revenue Engine Stalling", "Scaling Without Foundation")

- "overall_diagnosis": 3-4 bullets summarising the diagnostic pattern. Each bullet MUST reference specific pillar scores.

- "what_is_broken": 3-5 bullets on the primary constraint (${ctx.constraint.name || 'N/A'}, score ${ctx.constraint.score || 0}). MUST include specific scores, deal sizes, and quantified gaps.

- "secondary_findings": 3-5 bullets on secondary constraint pillars (${secondaryConstraints}) and their causal interactions with the primary constraint.

- "positioning_assessment_bullets": 1-3 bullets critiquing the positioning statement ("${ctx.positioning}") against competitors (${ctx.competitors}) and market.

- "bottom_line": Exactly 3 bullets:
  1. RAPS score (${ctx.raps.score || 0}/100) and band (${ctx.raps.label || 'N/A'})
  2. Revenue at risk amount (based on gap between expected convertible revenue and remaining target)
  3. Single highest-leverage 30-day action

- "section_takeaway": Exactly 2 paragraphs. First: synthesise findings across all sub-sections. Second: state the implication or path forward.

Cross-reference these qualitative responses where relevant:
- Positioning Challenge (P3): "${ctx.qualitativeP3}"
- Differentiated Value (P3): "${ctx.qualitativeP3b}"
- Strategic Constraint (P7): "${ctx.qualitativeP7}"
- Organisational Alignment (P8): "${ctx.qualitativeP8}"
- Systems & AI Readiness (P9): "${ctx.qualitativeP9}"

Return JSON with all fields: paragraphs, headline_results_description, overall_diagnosis, what_is_broken, secondary_findings, positioning_assessment_bullets, bottom_line, section_takeaway, data_source ("ai_synthesis").`

  return await callSection(client, 'executive_summary', prompt, ctx, EXECUTIVE_SUMMARY_SCHEMA)
}

async function generateScorecardExplanation(client, ctx) {
  const pillarSummary = Object.entries(ctx.pillarScores)
    .map(([pid, ps]) => `${PILLAR_NAMES[pid] || pid}: ${ps.score || 0}/100`)
    .join(', ')

  const prompt = `Generate 4-6 bullet points explaining what the Executive Scorecard radar chart reveals for ${ctx.company}.

Pillar scores: ${pillarSummary}
Overall RAD Score: ${ctx.radScore}/100 (${ctx.maturity})

Each bullet should be 1-2 sentences. Cover:
- Strongest pillar(s) and what that strength means commercially
- Weakest pillar(s) and the risk they represent
- Notable asymmetries or clusters in the radar shape (e.g. strong on strategy but weak on execution)
- Overall shape interpretation — is it balanced, lopsided, spiked?

Be specific — reference actual pillar names and scores. No generic statements.

Return JSON:
{
  "bullets": ["bullet 1", "bullet 2", ...],
  "data_source": "ai_synthesis"
}`

  return await callSection(client, 'scorecard_explanation', prompt, ctx, SCORECARD_EXPLANATION_SCHEMA)
}

async function generatePillarNarrative(client, ctx, pillarId) {
  const pillarName = PILLAR_NAMES[pillarId]
  const ps = ctx.pillarScores[pillarId] || {}
  const questions = ctx.pillarQuestionDetails[pillarId] || []
  const strengths = questions.filter(q => q.score >= 4).map(q => `${q.id}: ${q.score}/5`)
  const frictions = questions.filter(q => q.score <= 2).map(q => `${q.id}: ${q.score}/5`)

  const qualPillars = { p3: ctx.qualitativeP3, p7: ctx.qualitativeP7, p8: ctx.qualitativeP8, p9: ctx.qualitativeP9 }
  const qualNote = qualPillars[pillarId]
    ? `\nQualitative response for this pillar: "${qualPillars[pillarId]}"`
    : ''

  const p3CritiqueNote = pillarId === 'p3'
    ? `\n- positioning_critique: Generate a focused 100-150 word critique of the current positioning statement: "${ctx.positioning}". Analyse what is wrong, what is missing, and why it fails to differentiate. This is separate from the general narrative.`
    : ''

  const prompt = `Generate a diagnostic narrative for pillar "${pillarName}" (${pillarId}).

Pillar score: ${ps.score || 0}/100 (avg ${ps.avg || 0}/5, ${ps.count || 0} questions)
Questions scoring >= 4 (strengths): ${strengths.length > 0 ? strengths.join(', ') : 'None'}
Questions scoring <= 2 (friction points): ${frictions.length > 0 ? frictions.join(', ') : 'None'}${qualNote}

Requirements:
- 200-350 words
- Score context and maturity interpretation for this pillar
- Operational strengths (reference specific high-scoring areas)
- Friction points (reference specific low-scoring areas and their business impact)
${['p3', 'p7', 'p8', 'p9'].includes(pillarId) ? '- Respondent signal: cross-reference the qualitative response against the quantitative scores — note alignment or tension' : ''}${p3CritiqueNote}

Additional v2.0 fields:
- "what_this_score_means": One paragraph explaining what this pillar score (${ps.score || 0}/100) means for the company in practical commercial terms.
- "assessment": A full synthesis paragraph assessing this pillar — what is working, what is not, and the net effect on revenue growth.
- "strength_points_narrative": A narrative paragraph about questions scoring 4 or 5 (${strengths.length > 0 ? strengths.join(', ') : 'None'}). If none scored 4+, explain what the absence of strengths means for this pillar.
- "section_takeaway": Exactly 2 paragraphs. First: synthesise the section findings. Second: state the implication or path forward.

Return JSON:
{
  "narrative": "full narrative text",
  "strength_points": ["strength 1", "strength 2"],
  "critical_friction_points": ["friction 1", "friction 2"],
  "respondentSignal": "signal analysis or null if not applicable",
  "positioning_critique": ${pillarId === 'p3' ? '"positioning critique text"' : 'null'},
  "what_this_score_means": "one paragraph on what this score means",
  "assessment": "full synthesis paragraph",
  "strength_points_narrative": "narrative about high-scoring questions",
  "section_takeaway": ["synthesis paragraph", "implication paragraph"],
  "data_source": "diagnostic_scores"
}`

  return await callSection(client, `pillar_${pillarId}`, prompt, ctx, PILLAR_NARRATIVE_SCHEMA)
}

async function generateConstraintAnalysis(client, ctx) {
  const constraintPillars = ctx.constraints.slice(0, 3)
  const constraintDetail = constraintPillars.map(c => {
    const questions = ctx.pillarQuestionDetails[c.id] || []
    const frictions = questions.filter(q => q.score <= 2).map(q => `${q.id}: ${q.score}/5`)
    return `- ${c.name} (${c.id}): score ${c.score}/100, friction points: ${frictions.join(', ') || 'None'}`
  }).join('\n')

  const constraintTypeInfo = CONSTRAINT_TYPE_MAP[ctx.constraint.id] || {}
  const isOptimisation = (ctx.constraint.score || 0) > 75
  const framingNote = isOptimisation
    ? '\nIMPORTANT: The constraint pillar scores above 75%. Reframe this as an "Optimisation Opportunity" rather than a constraint. Focus on fine-tuning and acceleration rather than fixing.'
    : ''

  const revenueImpactRubric = {
    p3: 'Addressing positioning gaps typically improves win rate by 5-10 percentage points, directly increasing pipeline-to-revenue conversion.',
    p5: 'Resolving pipeline constraints typically closes the coverage gap by 20-40%, adding proportional expected convertible revenue.',
    p4: 'Fixing sales system repeatability typically reduces cycle length by 15-25% and improves conversion rates.',
    p2: 'Sharpening ICP targeting typically improves qualified lead rates by 10-15% and shortens sales cycles.',
    p1: 'Strengthening commercial baseline improves forecast accuracy and revenue predictability by 15-25%.',
    p6: 'Improving revenue economics typically improves CAC:LTV ratio and unit economics margins.',
    p7: 'Removing strategic constraints accelerates resource reallocation and initiative completion.',
    p8: 'Resolving org alignment issues typically improves initiative completion rate by 25% and execution speed.',
    p9: 'Improving systems readiness typically reduces manual process overhead by 30-50%.',
  }

  const prompt = `Analyse the primary growth constraint for ${ctx.company}.

Primary constraint: ${ctx.constraint.name || 'N/A'} (score: ${ctx.constraint.score || 0}/100)
Constraint type: ${constraintTypeInfo.type || 'unknown'}
All constraints:
${constraintDetail || 'No constraints identified'}

RAD Score: ${ctx.radScore}/100, Maturity: ${ctx.maturity}${framingNote}

Requirements:
- diagnosis: One sharp sentence describing what this constraint means for the business (max 30 words)
- score_context: What this score level indicates about operational maturity in this area (1-2 sentences)
- key_friction_points: 3-5 specific operational friction points causing this constraint, grounded in question-level scores
- revenue_impact: 3-4 concrete business consequences of this constraint (revenue, pipeline, deal velocity, etc.)
- cascade_effect: 2-3 effects on other pillars (e.g. "Weak positioning erodes pipeline quality in P5")
- recommended_focus: One sentence describing the single most impactful action to address this constraint
- revenue_impact_estimation: Estimate the revenue impact of addressing this constraint. Rubric: ${revenueImpactRubric[ctx.constraint.id] || 'General improvement expected across growth metrics.'}
- constraint_type: "${constraintTypeInfo.type || 'general'}"

Additional v2.0 fields:
- "what_good_looks_like": 4-6 bullets describing what an 80%+ score looks like for the ${ctx.constraint.name || 'primary constraint'} pillar. Be specific about operational behaviours, metrics, and capabilities.
- "friction_points_table": 2-5 rows, each with friction_point, impact, and root_cause columns. Ground each in actual question-level data.
- "cascade_diagram": Exactly 4 nodes showing the cascade: primary constraint -> secondary effect -> tertiary effect -> revenue outcome. Each node has a "label" and "connector_label" (arrow text to next node; empty string for the last node).
- "section_takeaway": Exactly 2 paragraphs. First: synthesise the constraint findings. Second: state the implication or path forward.

Return JSON with all fields: diagnosis, score_context, key_friction_points, revenue_impact, cascade_effect, recommended_focus, revenue_impact_estimation, constraint_type, what_good_looks_like, friction_points_table, cascade_diagram, section_takeaway, data_source ("ai_synthesis").`

  return await callSection(client, 'constraint_analysis', prompt, ctx, CONSTRAINT_ANALYSIS_SCHEMA)
}

async function generateCompetitivePositioning(client, ctx) {
  const prompt = `Produce a comprehensive competitive positioning analysis for ${ctx.company}.

Company positioning statement: "${ctx.positioning}"
Named competitors: ${ctx.competitors}
P3 pillar score (Market Positioning): ${(ctx.pillarScores.p3 || {}).score || 0}/100
Qualitative positioning challenge: "${ctx.qualitativeP3}"
Differentiated value: "${ctx.qualitativeP3b}"

You must produce ALL of the following:

1. **introduction**: An opening paragraph setting the stage for the competitive positioning analysis.

2. **comparative_company_facts**: A comparison table with column_headers (first header is "Attribute", then company names — ${ctx.company} first, then each competitor) and rows. Each row has a "field" (e.g. Founded, Revenue Range, Employee Count, Primary Industry, Headquarters, Key Product/Service) and "values" (one per company). Provide at least 5 rows. Use best available inference from the screener data; if unknown, write "Not disclosed".

3. **company_facts_assessment**: A paragraph interpreting what the comparative facts reveal — relative scale, maturity, resource asymmetries.

4. **growth_evidence_signals**: Another table (same column_headers pattern) with rows for growth signals: Hiring Velocity, Funding Activity, Product Launch Cadence, Geographic Expansion, Partnership Activity. At least 4 rows. Use directional language (e.g. "Moderate — 2 hires/month", "High — Series B closed").

5. **evidence_signals_assessment**: A paragraph interpreting the growth signals — who is accelerating, decelerating, or pivoting.

6. **positioning_statements**: An array of objects, one per company (${ctx.company} + competitors). Each has company_name, statement (their positioning/value proposition as best inferred), and source_ref (e.g. "Inferred from screener responses", "Company website").

7. **positioning_analysis**: A detailed paragraph analysing the positioning statements — where they overlap, where gaps exist, which is strongest/weakest and why.

8. **recommended_positioning_direction**: An object with:
   - guidance: strategic direction for ${ctx.company} to differentiate
   - example_statement: a concrete improved positioning statement
   - caveat: conditions or risks attached to this recommendation

9. **growth_based_assessment**: A scoring table with column_headers (company names) and dimensions. Each dimension has a name and integer scores (1-5) per company. Use exactly these 8 dimensions: Revenue Scale, Profitability Strength, Positioning Clarity, Technology Investment Depth, AI Readiness, Customer Confidence, Market Visibility, Delivery Capability. Score using: 1 = Weak, 2 = Developing, 3 = Competitive, 4 = Strong, 5 = Leading.

10. **growth_assessment_narrative**: A paragraph interpreting the scoring patterns — who leads overall, where ${ctx.company} has advantage or deficit.

11. **section_takeaway**: An object with "paragraphs" — exactly 2 paragraphs. First: synthesise the competitive positioning findings. Second: state the strategic implication or recommended path forward.

12. **data_source**: "screener_data"

Return valid JSON matching the schema exactly.`

  return await callSection(client, 'competitive_positioning', prompt, ctx, COMPETITIVE_POSITIONING_SCHEMA, 8192)
}

async function generateRAPSNarrative(client, ctx) {
  const raps = ctx.raps
  const constraintTypeInfo = CONSTRAINT_TYPE_MAP[ctx.constraint.id] || {}
  const isHighRaps = (raps.score || 0) > 75
  const rapsFraming = isHighRaps
    ? '\nIMPORTANT: RAPS score is above 75. Frame scenarios as "How to Protect & Extend" rather than improvement scenarios. Focus on defending current position and extending advantage.'
    : ''

  const prompt = `Generate a RAPS (Revenue Achievement Probability Score) narrative for ${ctx.company}.

RAPS Score: ${raps.score || 0}/100 — ${raps.label || 'N/A'}
Coverage Ratio: ${raps.coverageRatio || 0} (${raps.coverageRating || 'N/A'})
Revenue Remaining: $${raps.revenueRemaining ? Number(raps.revenueRemaining).toLocaleString() : '0'}
Expected Convertible: $${raps.expectedConvertible ? Number(Math.round(raps.expectedConvertible)).toLocaleString() : '0'}
Months Remaining: ${raps.monthsRemaining || 0}
Revenue Target: $${ctx.screener.q18 || '0'}
Revenue Invoiced YTD: $${ctx.screener.q19 || '0'}

Primary constraint: ${ctx.constraint.name || 'N/A'} (${ctx.constraint.id || 'N/A'})
Constraint type: ${constraintTypeInfo.type || 'general'}
Constraint impact metric: ${constraintTypeInfo.metric || 'general improvement'}${rapsFraming}

Requirements:
- 150-250 words narrative explaining score drivers
- 3 scenarios calibrated to the primary constraint type:
  * Conservative (quick wins): e.g., for positioning constraint -> win rate +5pp; for pipeline -> coverage +15%
  * Moderate (systematic fix): full constraint-specific improvements applied
  * Aggressive (transformation): constraint removed + adjacent pillars improved
- 3-5 why_factors explaining key RAPS score drivers
- 3-5 must_improve items

Additional v2.0 fields:
- "raps_narrative_bullets": 5-6 bullets covering: revenue target, YTD invoiced, remaining to target, conversion reality (pipeline vs needed), revenue at risk amount.
- "scenario_analysis": Exactly 3 rows as structured objects:
  1. Current State: current win_rate, pipeline_coverage, projected_raps, probability
  2. Quick Wins: improved metrics with conservative assumptions
  3. Full Optimisation: best-case metrics with full constraint removal
  Each row: { scenario, win_rate, pipeline_coverage, projected_raps, probability }
- "section_takeaway": Exactly 2 paragraphs. First: synthesise the RAPS findings. Second: state the implication or path forward.

Return JSON with all fields: narrative, why_factors, must_improve, scenarios_narrative, raps_narrative_bullets, scenario_analysis, section_takeaway, data_source ("raps_calculation").`

  return await callSection(client, 'raps_narrative', prompt, ctx, RAPS_NARRATIVE_SCHEMA)
}

async function generateActionRoadmap(client, ctx) {
  const constraintList = ctx.constraints.map(c => `${c.name} (${c.id}: ${c.score})`).join(', ')
  const p8Score = ctx.pillarScores.p8?.score || 0

  // Build question-level score summary for grounding
  const questionScoreSummary = Object.entries(ctx.pillarQuestionDetails)
    .map(([pid, questions]) => {
      const lowQs = questions.filter(q => q.score <= 2).map(q => `${q.id}=${q.score}`)
      return lowQs.length > 0 ? `${PILLAR_NAMES[pid]}: ${lowQs.join(', ')}` : null
    })
    .filter(Boolean)
    .join('\n')

  const isAcceleration = ctx.isHighPerformer
  const planTitle = isAcceleration ? 'Acceleration Plan' : '30-60-90 Day Action Roadmap'
  const framingNote = isAcceleration
    ? '\nIMPORTANT: RAD score is above 75%. Frame this as an "Acceleration Plan" focused on extending strengths and capturing opportunities, not fixing problems.'
    : ''

  const prompt = `Generate a ${planTitle} for ${ctx.company}.

Constraints (sorted by severity): ${constraintList || 'None identified'}
Primary constraint: ${ctx.constraint.name || 'N/A'} (${ctx.constraint.score || 0})
RAD Score: ${ctx.radScore}/100
P8 (Organisational Alignment) Score: ${p8Score}/100 — calibrate the ambition and pace of actions accordingly. ${p8Score < 50 ? 'Low org alignment means actions should be simpler and more focused.' : p8Score >= 80 ? 'High org alignment supports ambitious, multi-stream initiatives.' : 'Moderate org alignment — balance ambition with execution capacity.'}${framingNote}

Question-level friction points (scored 1-2 out of 5):
${questionScoreSummary || 'No critical friction points detected.'}

Qualitative responses (for qualitative_coverage_table):
- P3-Q12 Positioning Challenge: "${ctx.qualitativeP3}"
- P3-Q13 Differentiated Value: "${ctx.qualitativeP3b}"
- P7-Q6 Strategic Constraint: "${ctx.qualitativeP7}"
- P8-Q13 Organisational Alignment: "${ctx.qualitativeP8}"
- P9-Q13 Systems & AI Readiness: "${ctx.qualitativeP9}"

Requirements:
- 3 phases: ${isAcceleration ? 'Quick Wins (0-30 days), Strategic Expansion (30-60 days), Scale & Optimise (60-90 days)' : 'Critical Fixes (0-30 days), Important Improvements (30-60 days), Consolidation & Growth (60-90 days)'}
- 4-5 items per phase (12-15 total)
- Each item must have: action, pillar (e.g. 'p4'), ideal_owner (role title), deliverable (specific output), metric (measurable outcome)
- Actions must be specific and commercially grounded, not generic advice

Additional v2.0 fields:
- "introduction": Opening paragraph explaining the roadmap strategy and how it maps to the constraint profile.
- "roadmap_rationale": 4-5 bullets explaining phase-by-phase rationale and expected revenue impact of each phase.
- "qualitative_coverage_table": Exactly 5 rows mapping each qualitative response (P3-Q12, P3-Q13, P7-Q6, P8-Q13, P9-Q13) to a corrective action in the roadmap. Each row: { question_ref, question_text, submitted_response, corrective_action }.
- "section_takeaway": Exactly 2 paragraphs. First: synthesise the roadmap findings. Second: state the implication or path forward.

Return JSON with all fields: phase1_title, phase1_items, phase2_title, phase2_items, phase3_title, phase3_items, introduction, roadmap_rationale, qualitative_coverage_table, section_takeaway, data_source ("ai_synthesis").`

  return await callSection(client, 'action_roadmap', prompt, ctx, ACTION_ROADMAP_SCHEMA, 16384)
}

async function generateCrossPillarInteraction(client, ctx) {
  // I2: Pre-compute active predefined linkages
  const activeLinkages = CAUSAL_LINKAGES.filter(link => {
    const fromScore = ctx.pillarScores[link.from]?.score || 100
    return fromScore < 65 || link.to === 'all'
  }).map(link => {
    const fromScore = ctx.pillarScores[link.from]?.score || 0
    const toScore = link.to === 'all' ? 'N/A' : (ctx.pillarScores[link.to]?.score || 0)
    return `${PILLAR_NAMES[link.from]} (${fromScore}) → ${link.to === 'all' ? 'All pillars' : PILLAR_NAMES[link.to]} (${toScore}): ${link.label}`
  })

  // Detect reinforcing loops: both pillars < 50%
  const reinforcingPairs = CAUSAL_LINKAGES.filter(link => {
    if (link.to === 'all') return false
    const fromScore = ctx.pillarScores[link.from]?.score || 100
    const toScore = ctx.pillarScores[link.to]?.score || 100
    return fromScore < 50 && toScore < 50
  }).map(link => `${PILLAR_NAMES[link.from]} ↔ ${PILLAR_NAMES[link.to]}`)

  const prompt = `Analyse cross-pillar interactions for ${ctx.company}.

The following predefined causal linkages are ACTIVE based on scores (from_pillar < 65%):
${activeLinkages.length > 0 ? activeLinkages.join('\n') : 'No active causal linkages detected — all source pillars score above 65%.'}

Reinforcing loops detected (both pillars < 50%):
${reinforcingPairs.length > 0 ? reinforcingPairs.join('\n') : 'No reinforcing loops detected.'}

Primary constraint: ${ctx.constraint.name || 'N/A'} (${ctx.constraint.id || 'N/A'}, score: ${ctx.constraint.score || 0})

Requirements:
- Use the predefined linkages above as the primary structure — elaborate on the mechanism for each active linkage
- Detect additional reinforcing loops where multiple weak pillars compound each other
- Identify virtuous cycles where strong pillars support each other
- Each causal link should reference specific pillar scores as evidence

Additional v2.0 fields:
- "introduction": Opening paragraph explaining the cross-pillar dynamics and why they matter for this company.
- "primary_causal_chain": An object with:
  * "nodes": Exactly 3 nodes showing the primary causal chain (pillar_label, connector_label). The connector_label is the arrow text to the next node.
  * "explanation_bullets": Exactly 5 bullets. CRITICAL FORMAT: Each bullet MUST begin with a bold label followed by a colon, then 1-3 sentences of concise explanation. Keep each bullet under 50 words. Format:
    - "Root cause -- P{n}: {Pillar Name} ({score}%, {Band}): concise explanation"
    - "First-order consequence -- P{n}: {Pillar Name} ({score}%, {Band}): concise explanation"
    - "Second-order consequence -- P{n}: {Pillar Name} ({score}%, {Band}): concise explanation"
    - "Cascade effect: Each step degrades the next. Brief chain description."
    - "Why P{n} is the highest-leverage entry point: concise reason"
- "reinforcing_loop": An object with:
  * "nodes": Exactly 4 nodes in the reinforcing loop (pillar_id e.g. "p3", label, sub_label for each). pillar_id must reference the most relevant pillar (p1-p9).
  * "explanation_bullets": At least 5 bullets. CRITICAL FORMAT: Each bullet MUST begin with a short bold label (2-5 words) followed by a colon, then 1-2 sentences of explanation. Keep each bullet under 40 words. Format examples:
    - "Weak Positioning (P3, 45.5%): Sales conversations fail to articulate differentiated value vs. competitors."
    - "No Feedback Loop: Without process data, there is no signal to refine messaging or positioning."
    - "Self-sustaining nature: The loop is mathematically self-reinforcing."
    - "The unlock: Implementing a sales methodology creates the data flow required to refine positioning."
    DO NOT write long paragraphs. Each bullet is a concise insight, not a full analysis.
- "intervention_sequence": An object with:
  * "steps": Exactly 4 steps (step_number, title, subtitle, timeline).
  * "explanation_bullets": At least 4 bullets. CRITICAL FORMAT: Each bullet MUST begin with a bold label followed by a colon, then 1-3 sentences. Keep each bullet under 50 words. Format: "{Title} -- {Description} ({timeline}): concise explanation". Example: "Fix P4 -- Implement a Sales Methodology (30-60 days): Define deal stages, qualification criteria (e.g. MEDDIC), and pipeline governance rules. This is a process fix, not a technology fix."
- "section_takeaway": Exactly 2 paragraphs. First: synthesise the cross-pillar findings. Second: state the implication or path forward.

Return JSON with all fields: causal_links, reinforcing_loops, narrative, introduction, primary_causal_chain, reinforcing_loop, intervention_sequence, section_takeaway, data_source ("ai_synthesis").`

  return await callSection(client, 'cross_pillar_interaction', prompt, ctx, CROSS_PILLAR_SCHEMA)
}

async function generateStrategicSignals(client, ctx) {
  const prompt = `Analyse strategic signals for ${ctx.company} by cross-referencing qualitative responses against quantitative scores.

Qualitative responses available:
- P3 Positioning Challenge: "${ctx.qualitativeP3}" (P3 score: ${ctx.pillarScores.p3?.score || 0}/100)
- P3 Differentiated Value: "${ctx.qualitativeP3b}"
- P7 Strategic Constraint: "${ctx.qualitativeP7}" (P7 score: ${ctx.pillarScores.p7?.score || 0}/100)
- P8 Organisational Alignment: "${ctx.qualitativeP8}" (P8 score: ${ctx.pillarScores.p8?.score || 0}/100)
- P9 Systems & AI Readiness: "${ctx.qualitativeP9}" (P9 score: ${ctx.pillarScores.p9?.score || 0}/100)

Requirements:
- For EACH qualitative response, assign an explicit signal_type:
  * "Aligned" — respondent's description matches the quantitative score pattern
  * "Partially Aligned" — respondent shows some awareness but misses key issues
  * "Misaligned" — respondent's description contradicts or is blind to the quantitative evidence
- Each signal should note the tension or alignment and its strategic implication
- diagnostic_awareness: One sentence overall assessment of how self-aware the respondent is about their growth system gaps
- section_takeaway: Exactly 2 paragraphs. First: synthesise the strategic signal findings. Second: state the implication or path forward.

Return JSON:
{
  "signals": [
    {"pillar": "p3", "type": "alignment|misalignment", "title": "short descriptive title", "description": "what the signal reveals", "implication": "strategic consequence", "signal_type": "Aligned|Partially Aligned|Misaligned"}
  ],
  "narrative": "1-2 paragraph synthesis of signal patterns",
  "diagnostic_awareness": "one-sentence assessment of respondent self-awareness",
  "section_takeaway": ["synthesis paragraph", "implication paragraph"],
  "data_source": "qualitative_responses"
}`

  return await callSection(client, 'strategic_signals', prompt, ctx, STRATEGIC_SIGNALS_SCHEMA)
}

async function generateOrgSystemsReadiness(client, ctx) {
  const p8Score = (ctx.pillarScores.p8 || {}).score || 0
  const p9Score = (ctx.pillarScores.p9 || {}).score || 0
  const p8Questions = ctx.pillarQuestionDetails.p8 || []
  const p9Questions = ctx.pillarQuestionDetails.p9 || []

  // AI readiness cluster: p9_q7 through p9_q11 per spec
  const aiQuestions = p9Questions.filter(q => ['p9_q7', 'p9_q8', 'p9_q9', 'p9_q10', 'p9_q11'].includes(q.id))
  const aiReadinessAvg = aiQuestions.length > 0
    ? (aiQuestions.reduce((s, q) => s + q.score, 0) / aiQuestions.length).toFixed(1)
    : 'N/A'

  const prompt = `Generate an Organisational & Systems Readiness assessment for ${ctx.company}.

P8 (Organisational Alignment) score: ${p8Score}/100
P9 (Systems Readiness & AI Transformation) score: ${p9Score}/100
AI Readiness Index (avg of p9_q7 through p9_q11): ${aiReadinessAvg}/5
P8 question scores: ${p8Questions.map(q => `${q.id}=${q.score}`).join(', ') || 'N/A'}
P9 question scores: ${p9Questions.map(q => `${q.id}=${q.score}`).join(', ') || 'N/A'}
Qualitative P8: "${ctx.qualitativeP8}"
Qualitative P9: "${ctx.qualitativeP9}"

Requirements:
- 375-500 words total, 4 parts:
  * Part 1: Organisational alignment assessment (P8 analysis)
  * Part 2: Systems readiness assessment (P9 analysis)
  * Part 3: AI transformation readiness (using AI readiness index from p9_q9, p9_q10, p9_q11)
  * Part 4: Combined execution readiness — can this organisation execute the action roadmap?
- Include cluster score analysis where question groups reveal patterns

Additional v2.0 fields:
- "introduction": Opening paragraph introducing the org & systems readiness assessment and its importance for execution.
- "readiness_paradox": A paragraph describing the joint implication of P8 (${p8Score}) and P9 (${p9Score}) scores — where the organisation wants to go vs. where its infrastructure can take it.
- "ai_readiness": A paragraph on AI readiness status based on the AI Readiness Index (${aiReadinessAvg}/5) — what it means for automation and scaling.
- "summary": A summary takeaway paragraph tying org alignment, systems readiness, and AI readiness together.
- "section_takeaway": Exactly 2 paragraphs. First: synthesise the org & systems findings. Second: state the implication or path forward.

Return JSON:
{
  "parts": [
    {"title": "Organisational Alignment", "content": "part 1 text"},
    {"title": "Systems Readiness", "content": "part 2 text"},
    {"title": "AI Transformation Readiness", "content": "part 3 text"},
    {"title": "Combined Execution Readiness", "content": "part 4 text"}
  ],
  "cluster_analysis": {
    "org_alignment_score": ${p8Score},
    "systems_readiness_score": ${p9Score},
    "ai_readiness_index": ${aiReadinessAvg === 'N/A' ? 'null' : aiReadinessAvg}
  },
  "narrative": "combined narrative joining all 4 parts",
  "introduction": "opening paragraph",
  "readiness_paradox": "paradox paragraph",
  "ai_readiness": "AI readiness narrative",
  "summary": "summary takeaway",
  "section_takeaway": ["synthesis paragraph", "implication paragraph"],
  "data_source": "diagnostic_scores"
}`

  return await callSection(client, 'org_systems_readiness', prompt, ctx, ORG_SYSTEMS_SCHEMA)
}

async function generateAdvisoryWorkstream(client, ctx) {
  const constraintList = ctx.constraints.map(c => `${c.name} (score: ${c.score})`).join(', ')
  const prompt = `Recommend an advisory workstream for ${ctx.company}.

RAD Score: ${ctx.radScore}/100 (${ctx.maturity})
RAPS Score: ${ctx.raps.score || 0}/100 (${ctx.raps.label || 'N/A'})
Constraints: ${constraintList || 'None'}
Primary constraint: ${ctx.constraint.name || 'N/A'} (${ctx.constraint.score || 0})

Requirements:
- Constraint-severity anchored: the engagement type and intensity should match the severity of constraints
- Named engagement framework (e.g., "90-Day Revenue Architecture Sprint", "Growth System Diagnostic & Fix", etc.)
- 2-3 expected outcomes with measurable targets
- Engagement framework description
- raps_connection: For each focus area, explain how it connects to RAPS improvement
- sequence_logic: A narrative explaining WHY the workstreams are sequenced in this order

v2.0 focus_areas format — each focus area is now a structured object:
- "focus_areas": At least 3 objects, each with: focus_area (name), scope (what it covers), timeline (when), ideal_owner (who owns it), outcome (expected result).
- "advisory_rationale": A narrative paragraph explaining why this particular sequence of growth areas was chosen and how they build on each other.
- "section_takeaway": Exactly 2 paragraphs. First: synthesise the advisory findings. Second: state the implication or path forward.

Return JSON:
{
  "recommended_engagement": "named engagement type",
  "focus_areas": [
    {"focus_area": "area name", "scope": "what it covers", "timeline": "when", "ideal_owner": "who", "outcome": "expected result"}
  ],
  "expected_outcomes": ["outcome 1", "outcome 2"],
  "engagement_framework": "description of the engagement structure and approach",
  "raps_connection": ["connection for area 1", "connection for area 2", "connection for area 3"],
  "sequence_logic": "narrative explaining workstream sequencing",
  "advisory_rationale": "why this sequence of growth areas",
  "section_takeaway": ["synthesis paragraph", "implication paragraph"],
  "data_source": "ai_synthesis"
}`

  return await callSection(client, 'advisory_workstream', prompt, ctx, ADVISORY_WORKSTREAM_SCHEMA)
}

async function generateClosingObservation(client, ctx) {
  const prompt = `Generate a closing observation for the diagnostic report for ${ctx.company}.

RAD Score: ${ctx.radScore}/100 (${ctx.maturity})
Primary constraint: ${ctx.constraint.name || 'N/A'}
RAPS Score: ${ctx.raps.score || 0}/100 (${ctx.raps.label || 'N/A'})

Requirements:
- 150-200 words
- "closing_narrative": Full closing text as a single string (backward compatibility)
- "paragraphs": 3-4 closing paragraphs as an array:
  * Paragraph 1: Restate the company's overall position — score, band, and what it means in commercial terms
  * Paragraph 2: Key opportunity that opens up if the primary constraint is addressed
  * Paragraph 3: Direct call to action — what the company should do next
  * Optional paragraph 4: Forward-looking statement about potential
- Tone: confident, forward-looking, commercially specific
- "section_takeaway": Exactly 2 paragraphs. First: synthesise the closing findings. Second: state the final implication or call to action.

Return JSON:
{
  "closing_narrative": "full closing text as single string",
  "paragraphs": ["paragraph 1", "paragraph 2", "paragraph 3"],
  "section_takeaway": ["synthesis paragraph", "implication paragraph"],
  "data_source": "ai_synthesis"
}`

  return await callSection(client, 'closing_observation', prompt, ctx, CLOSING_OBSERVATION_SCHEMA)
}

// C3: Diagnostic Overview Interpretation
const DIAGNOSTIC_INTERPRETATION_SCHEMA = {
  name: 'diagnostic_interpretation',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['interpretation', 'section_takeaway', 'data_source'],
    properties: {
      interpretation: { type: 'string' },
      section_takeaway: { type: 'array', items: { type: 'string' }, description: 'Exactly 2 paragraphs. First: synthesise the section findings. Second: state the implication or path forward.' },
      data_source: { type: 'string' },
    },
  },
}

async function generateDiagnosticInterpretation(client, ctx) {
  const pillarSummary = Object.entries(ctx.pillarScores)
    .map(([pid, ps]) => `${PILLAR_NAMES[pid]}: ${ps.score || 0}/100`)
    .join(', ')

  const prompt = `Generate a diagnostic overview interpretation for ${ctx.company}.

RAD Score: ${ctx.radScore}/100 (${ctx.maturity})
Pillar scores: ${pillarSummary}
Primary constraint: ${ctx.constraint.name || 'N/A'} (${ctx.constraint.score || 0})

Requirements:
- 150-200 words, 2-3 paragraphs
- Interpret the overall score pattern — what does the shape of scores tell us?
- Highlight the most significant gap between strongest and weakest pillars
- Connect the pattern to commercial implications
- Include a section_takeaway with exactly 2 paragraphs: first synthesising findings, second stating implications.

Return JSON:
{
  "interpretation": "full interpretation text",
  "section_takeaway": ["synthesis paragraph", "implication paragraph"],
  "data_source": "diagnostic_scores"
}`

  return await callSection(client, 'diagnostic_interpretation', prompt, ctx, DIAGNOSTIC_INTERPRETATION_SCHEMA)
}

// I1: Company Snapshot Metric Interpretations
const SNAPSHOT_INTERPRETATIONS_SCHEMA = {
  name: 'snapshot_interpretations',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['interpretations', 'section_takeaway', 'data_source'],
    properties: {
      interpretations: {
        type: 'object',
        additionalProperties: false,
        required: ['revenue_band', 'sales_team', 'marketing_budget', 'sales_model', 'deal_size', 'sales_cycle', 'win_rate', 'revenue_target', 'revenue_invoiced'],
        properties: {
          revenue_band: { type: 'string' },
          sales_team: { type: 'string' },
          marketing_budget: { type: 'string' },
          sales_model: { type: 'string' },
          deal_size: { type: 'string' },
          sales_cycle: { type: 'string' },
          win_rate: { type: 'string' },
          revenue_target: { type: 'string' },
          revenue_invoiced: { type: 'string' },
        },
      },
      section_takeaway: { type: 'array', items: { type: 'string' }, description: 'Exactly 2 paragraphs. First: synthesise the section findings. Second: state the implication or path forward.' },
      data_source: { type: 'string' },
    },
  },
}

async function generateSnapshotInterpretations(client, ctx) {
  const sr = ctx.screener
  const prompt = `Generate brief AI interpretations (3-8 words each) for the following company metrics for ${ctx.company}:

- Revenue Band: ${sr.q7 || 'N/A'}
- Sales Team Size: ${sr.q8 || 'N/A'}
- Marketing Budget: ${sr.q9 || 'N/A'}
- Sales Model: ${sr.q10 || 'N/A'}
- Average Deal Size: ${sr.q14 || 'N/A'}
- Average Sales Cycle: ${sr.q15 || 'N/A'}
- Win Rate: ${sr.q17 || 'N/A'}
- Revenue Target: $${sr.q18 || '0'}
- Revenue Invoiced YTD: $${sr.q19 || '0'}

Each interpretation should be a short, commercially insightful phrase (3-8 words) that puts the metric in context. Examples:
- "$1.2M/month required — aggressive pace"
- "Below-average for segment"
- "Healthy conversion indicator"
- "Lean team for revenue target"

Also include a section_takeaway with exactly 2 paragraphs: first synthesising the snapshot findings, second stating the implications for the diagnostic.

Return JSON:
{
  "interpretations": {
    "revenue_band": "...",
    "sales_team": "...",
    "marketing_budget": "...",
    "sales_model": "...",
    "deal_size": "...",
    "sales_cycle": "...",
    "win_rate": "...",
    "revenue_target": "...",
    "revenue_invoiced": "..."
  },
  "section_takeaway": ["synthesis paragraph", "implication paragraph"],
  "data_source": "screener_data"
}`

  return await callSection(client, 'snapshot_interpretations', prompt, ctx, SNAPSHOT_INTERPRETATIONS_SCHEMA)
}

// s14: Expected Outcomes Schema
const EXPECTED_OUTCOMES_SCHEMA = {
  name: 'expected_outcomes',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['introduction', 'priority_tiers', 'execution_discipline', 'raps_context', 'revenue_confidence_scenarios', 'closing_summary', 'section_takeaway', 'data_source'],
    properties: {
      introduction: { type: 'string' },
      priority_tiers: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['tier', 'actions', 'rationale'],
          properties: {
            tier: { type: 'string' },
            actions: { type: 'string' },
            rationale: { type: 'string' },
          },
        },
      },
      execution_discipline: { type: 'string' },
      raps_context: { type: 'string', description: 'Paragraph explaining what projected RAPS means.' },
      revenue_confidence_scenarios: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['scenario', 'description', 'projected_raps', 'projected_increase'],
          properties: {
            scenario: { type: 'string' },
            description: { type: 'string' },
            projected_raps: { type: 'string' },
            projected_increase: { type: 'string' },
          },
        },
      },
      closing_summary: { type: 'string' },
      section_takeaway: { type: 'array', items: { type: 'string' }, description: 'Exactly 2 paragraphs. First: synthesise the section findings. Second: state the implication or path forward.' },
      data_source: { type: 'string' },
    },
  },
}

async function generateExpectedOutcomes(client, ctx) {
  const raps = ctx.raps
  const constraintList = ctx.constraints.slice(0, 3).map(c => `${c.name} (${c.id}: ${c.score}/100)`).join(', ')

  const prompt = `Generate an Expected Outcomes section for ${ctx.company}'s diagnostic report.

RAD Score: ${ctx.radScore}/100 (${ctx.maturity})
RAPS Score: ${raps.score || 0}/100 (${raps.label || 'N/A'})
Revenue Target: $${ctx.screener.q18 || '0'}
Revenue Invoiced YTD: $${ctx.screener.q19 || '0'}
Revenue Remaining: $${raps.revenueRemaining ? Number(raps.revenueRemaining).toLocaleString() : '0'}
Expected Convertible Revenue: $${raps.expectedConvertible ? Number(Math.round(raps.expectedConvertible)).toLocaleString() : '0'}
Coverage Ratio: ${raps.coverageRatio || 0} (${raps.coverageRating || 'N/A'})
Primary constraint: ${ctx.constraint.name || 'N/A'} (${ctx.constraint.score || 0})
Top constraints: ${constraintList || 'None'}

Requirements:
- "introduction": Opening paragraph setting up expected outcomes based on the diagnostic findings and current trajectory.
- "priority_tiers": Exactly 4 tiers, each with tier (name/label), actions (key actions in this tier), rationale (why this tier matters). Example tiers: Immediate (Week 1-2), Short-term (Month 1), Medium-term (Month 2-3), Sustained (Month 3+).
- "execution_discipline": A paragraph on the execution discipline required — what cadence, governance, and accountability looks like for this company.
- "raps_context": A paragraph explaining what the current projected RAPS (${raps.score || 0}/100) means for revenue achievement and what moving it by 10-20 points would translate to in dollar terms.
- "revenue_confidence_scenarios": Exactly 4 scenarios: No Action, Partial Execution, Full Execution, Accelerated Execution. Each with scenario name, description, projected_raps (score), projected_increase (revenue improvement estimate).
- "closing_summary": A closing paragraph summarising the expected outcomes and reinforcing urgency.
- "section_takeaway": Exactly 2 paragraphs. First: synthesise the expected outcomes. Second: state the implication or path forward.

Return JSON with all required fields and data_source "ai_synthesis".`

  return await callSection(client, 'expected_outcomes', prompt, ctx, EXPECTED_OUTCOMES_SCHEMA)
}

// E2: Banned phrase cleaning
function cleanBannedPhrases(text) {
  if (!text || typeof text !== 'string') return text
  let cleaned = text
  for (const phrase of BANNED_PHRASES) {
    const regex = new RegExp(phrase, 'gi')
    cleaned = cleaned.replace(regex, '')
  }
  // Clean up double spaces and leading/trailing whitespace
  return cleaned.replace(/\s{2,}/g, ' ').trim()
}

function cleanReportText(obj) {
  if (typeof obj === 'string') return cleanBannedPhrases(obj)
  if (Array.isArray(obj)) return obj.map(item => cleanReportText(item))
  if (obj && typeof obj === 'object') {
    const cleaned = {}
    for (const [key, val] of Object.entries(obj)) {
      cleaned[key] = cleanReportText(val)
    }
    return cleaned
  }
  return obj
}

function buildFinalReport(results, ctx) {
  const raps = ctx.raps

  // Executive summary — join paragraphs or use fallback
  const execSummary = results.executive_summary
  const executiveSummaryText = execSummary?.paragraphs
    ? execSummary.paragraphs.join('\n\n')
    : 'Executive summary generation failed.'

  // Pillar narratives — extract narrative strings for backward compat
  const pillarNarratives = {}
  for (const pid of Object.keys(PILLAR_NAMES)) {
    const pn = results.pillar_narratives?.[pid]
    pillarNarratives[pid] = pn?.narrative || `Narrative for ${PILLAR_NAMES[pid]} could not be generated.`
  }

  // Competitive positioning
  const cc = results.competitive_positioning || {}

  // RAPS
  const rapsResult = results.raps || {}

  // Action plan — preserve backward compat shape, add new fields
  const ap = results.action_plan || {}

  // Growth constraint map from cross-pillar interaction
  const cpi = results.cross_pillar_interaction || {}
  const growthConstraintMap = {
    primary_constraint: ctx.constraint.name || 'N/A',
    causal_chain: cpi.causal_links
      ? cpi.causal_links.map(l => `${PILLAR_NAMES[l.from_pillar] || l.from_pillar} → ${PILLAR_NAMES[l.to_pillar] || l.to_pillar}: ${l.mechanism}`)
      : [],
    downstream_impacts: cpi.reinforcing_loops
      ? cpi.reinforcing_loops.map(l => l.description)
      : [],
  }

  // Org & systems readiness — backward compat string + new structured data
  const osr = results.org_systems_readiness || {}
  const orgSystemsReadinessText = osr.narrative || 'Org & systems readiness analysis could not be generated.'

  // Advisory workstream
  const aw = results.advisory_workstream || {}

  // Priority actions summary — derive from action plan
  const phase1Items = ap.phase1_items || []
  const phase2Items = ap.phase2_items || []
  const phase3Items = ap.phase3_items || []
  const highPillars = Object.entries(ctx.pillarScores)
    .filter(([, ps]) => (ps.score || 0) >= 80)
    .map(([pid]) => `Protect ${PILLAR_NAMES[pid]} (${ctx.pillarScores[pid].score}/100)`)

  // Closing observation
  const co = results.closing_observation || {}

  // Strategic moat — derive from competitive clarity overall score
  const moatScore = cc.overall_score || 5
  const moatNarrative = cc.positioning_critique
    ? `${cc.positioning_critique}\n\n${cc.white_space_insight || ''}`
    : 'Strategic moat analysis could not be generated.'

  // Revenue waterfall — computed from RAPS data directly
  const target = Number(ctx.screener.q18) || 0
  const invoiced = Number(ctx.screener.q19) || 0
  const remaining = Math.max(0, target - invoiced)
  const pipeline = raps.openPipeline || 0
  const expectedConv = raps.expectedConvertible || 0
  const gap = remaining - expectedConv

  // Expected outcomes
  const eo = results.expected_outcomes || {}

  return {
    // Backward-compatible keys
    executive_summary: executiveSummaryText,
    pillar_narratives: pillarNarratives,
    positioning_assessment: cc.positioning_critique
      ? `${cc.positioning_critique}\n\nRecommended positioning: ${cc.positioning_rewrite || ''}`
      : 'Positioning assessment could not be generated.',
    strategic_moat_score: moatScore,
    strategic_moat_narrative: moatNarrative,
    raps_narrative: rapsResult.narrative || 'RAPS narrative could not be generated.',
    raps_why_factors: rapsResult.why_factors || [],
    raps_must_improve: rapsResult.must_improve || [],
    raps_improvement_scenario: {
      current: { score: raps.score || 0, label: raps.label || 'N/A' },
      improved: { score: Math.min(100, (raps.score || 0) + 15), label: 'Moderate', assumptions: 'Win rate +5pp, pipeline +25%' },
    },
    action_plan: {
      phase1_title: ap.phase1_title || 'Critical Fixes (0-30 Days)',
      phase1_items: phase1Items,
      phase2_title: ap.phase2_title || 'Important Improvements (30-60 Days)',
      phase2_items: phase2Items,
      phase3_title: ap.phase3_title || 'Consolidation & Growth (60-90 Days)',
      phase3_items: phase3Items,
      introduction: ap.introduction || null,
      roadmap_rationale: ap.roadmap_rationale || [],
      qualitative_coverage_table: ap.qualitative_coverage_table || [],
      section_takeaway: ap.section_takeaway || [],
    },
    company_snapshot: {
      company: ctx.company,
      industry: ctx.industry,
      revenue_range: ctx.screener.q7 || 'N/A',
      sales_staff: ctx.screener.q8 || 'N/A',
      sales_model: ctx.screener.q10 || 'N/A',
      markets: ctx.screener.q6 || 'N/A',
      deal_size: ctx.screener.q14 || 'N/A',
      sales_cycle: ctx.screener.q15 || 'N/A',
    },
    growth_constraint_map: growthConstraintMap,
    org_systems_readiness: orgSystemsReadinessText,
    advisory_workstream: {
      recommended_engagement: aw.recommended_engagement || 'N/A',
      focus_areas: aw.focus_areas || [],
      expected_outcomes: aw.expected_outcomes || [],
      engagement_framework: aw.engagement_framework || null,
      raps_connection: aw.raps_connection || [],
      sequence_logic: aw.sequence_logic || null,
      advisory_rationale: aw.advisory_rationale || null,
      section_takeaway: aw.section_takeaway || [],
    },
    priority_actions_summary: {
      fix_first: phase1Items.map(i => i.action || i),
      fix_next: phase2Items.map(i => i.action || i),
      stabilise: phase3Items.map(i => i.action || i),
      protect: highPillars,
    },
    competitive_positioning: {
      introduction: cc.introduction || null,
      comparative_company_facts: cc.comparative_company_facts || null,
      company_facts_assessment: cc.company_facts_assessment || null,
      growth_evidence_signals: cc.growth_evidence_signals || null,
      evidence_signals_assessment: cc.evidence_signals_assessment || null,
      positioning_statements: cc.positioning_statements || [],
      positioning_analysis: cc.positioning_analysis || null,
      recommended_positioning_direction: cc.recommended_positioning_direction || null,
      growth_based_assessment: cc.growth_based_assessment || null,
      growth_assessment_narrative: cc.growth_assessment_narrative || null,
      section_takeaway: cc.section_takeaway || {},
    },
    revenue_waterfall: {
      target, invoiced, remaining, pipeline, expected_convertible: expectedConv, gap,
    },

    // New sections
    cross_pillar_interaction: {
      causal_links: cpi.causal_links || [],
      reinforcing_loops: cpi.reinforcing_loops || [],
      narrative: cpi.narrative || null,
      introduction: cpi.introduction || null,
      primary_causal_chain: cpi.primary_causal_chain || null,
      reinforcing_loop: cpi.reinforcing_loop || null,
      intervention_sequence: cpi.intervention_sequence || null,
      section_takeaway: cpi.section_takeaway || [],
      data_source: cpi.data_source || 'ai_synthesis',
    },
    strategic_signals: results.strategic_signals
      ? { ...results.strategic_signals, section_takeaway: results.strategic_signals.section_takeaway || [] }
      : { signals: [], narrative: null, diagnostic_awareness: null, section_takeaway: [], data_source: 'qualitative_responses' },
    org_systems_readiness_detailed: {
      parts: osr.parts || [],
      cluster_analysis: osr.cluster_analysis || {},
      narrative: osr.narrative || null,
      introduction: osr.introduction || null,
      readiness_paradox: osr.readiness_paradox || null,
      ai_readiness: osr.ai_readiness || null,
      summary: osr.summary || null,
      section_takeaway: osr.section_takeaway || [],
      data_source: osr.data_source || 'diagnostic_scores',
    },
    closing_observation: co.closing_narrative || null,
    closing_observation_v2: {
      paragraphs: co.paragraphs || [],
      section_takeaway: co.section_takeaway || [],
    },

    // Pillar-level structured data (new, in addition to narrative strings)
    pillar_details: Object.fromEntries(
      Object.keys(PILLAR_NAMES).map(pid => {
        const pn = results.pillar_narratives?.[pid] || {}
        return [pid, {
          strength_points: pn.strength_points || [],
          critical_friction_points: pn.critical_friction_points || [],
          respondentSignal: pn.respondentSignal || null,
          positioning_critique: pn.positioning_critique || null,
          what_this_score_means: pn.what_this_score_means || null,
          assessment: pn.assessment || null,
          strength_points_narrative: pn.strength_points_narrative || null,
          section_takeaway: pn.section_takeaway || [],
        }]
      })
    ),

    // Constraint analysis (structured)
    constraint_analysis: results.constraint_analysis || null,

    // RAPS scenarios narrative (new)
    raps_scenarios_narrative: rapsResult.scenarios_narrative || null,

    // RAPS v2.0 structured data
    raps_narrative_bullets: rapsResult.raps_narrative_bullets || [],
    raps_scenario_analysis: rapsResult.scenario_analysis || [],
    raps_section_takeaway: rapsResult.section_takeaway || [],

    // Scorecard explanation bullets
    scorecard_explanation: results.scorecard_explanation?.bullets || [],

    // C3: Diagnostic interpretation
    diagnostic_interpretation: results.diagnostic_interpretation?.interpretation || null,
    diagnostic_interpretation_takeaway: results.diagnostic_interpretation?.section_takeaway || [],

    // I1: Snapshot interpretations
    snapshot_interpretations: results.snapshot_interpretations?.interpretations || null,
    snapshot_interpretations_takeaway: results.snapshot_interpretations?.section_takeaway || [],

    // s14: Expected outcomes
    expected_outcomes: eo || null,

    // v2.0 Executive summary structured sub-sections
    executive_summary_v2: execSummary ? {
      headline_results_description: execSummary.headline_results_description || null,
      overall_diagnosis: execSummary.overall_diagnosis || [],
      what_is_broken: execSummary.what_is_broken || [],
      secondary_findings: execSummary.secondary_findings || [],
      positioning_assessment_bullets: execSummary.positioning_assessment_bullets || [],
      bottom_line: execSummary.bottom_line || [],
      section_takeaway: execSummary.section_takeaway || [],
    } : null,

    // E5: High-performer flag
    isHighPerformer: ctx.isHighPerformer,
  }
}

export function runQAChecks(report) {
  const warnings = []
  const errors = []

  // 1. Specificity: exec summary must reference at least 2 pillar names
  if (report.executive_summary) {
    const pillarRefs = Object.values(PILLAR_NAMES).filter(name => report.executive_summary.includes(name))
    if (pillarRefs.length < 2) warnings.push(`Executive summary references only ${pillarRefs.length} pillar names (expected >= 2)`)
  }

  // 2. Score references: exec summary must contain the RAD score
  if (report.executive_summary && report.isHighPerformer !== undefined) {
    const hasScore = /\d{1,3}\/100/.test(report.executive_summary)
    if (!hasScore) warnings.push('Executive summary does not contain a score reference (X/100)')
  }

  // 3. RAPS arithmetic
  if (report.raps_improvement_scenario?.current && report.raps_improvement_scenario?.improved) {
    if (report.raps_improvement_scenario.improved.score <= report.raps_improvement_scenario.current.score) {
      warnings.push('RAPS improvement scenario shows no improvement over current score')
    }
  }

  // 4. Word count
  if (report.executive_summary) {
    const wordCount = report.executive_summary.split(/\s+/).length
    if (wordCount < 200) warnings.push(`Executive summary is only ${wordCount} words (expected 250-350)`)
    if (wordCount > 400) warnings.push(`Executive summary is ${wordCount} words (expected 250-350)`)
  }

  // 5. Banned phrases
  const textFields = [
    report.executive_summary,
    report.raps_narrative,
    report.closing_observation,
    ...(report.constraint_analysis ? [report.constraint_analysis.diagnosis, report.constraint_analysis.recommended_focus] : []),
    ...Object.values(report.pillar_narratives || {}),
  ].filter(Boolean)

  for (const text of textFields) {
    for (const phrase of BANNED_PHRASES) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        warnings.push(`Banned phrase "${phrase}" found in report text`)
      }
    }
  }

  // 6. Constraint reference
  if (report.constraint_analysis && !report.constraint_analysis.diagnosis) {
    errors.push('Constraint analysis missing diagnosis')
  }

  // 7. Pillar coverage
  const narrativeCount = Object.keys(report.pillar_narratives || {}).length
  if (narrativeCount < 9) errors.push(`Only ${narrativeCount}/9 pillar narratives generated`)

  // 8. Closing observation
  if (!report.closing_observation) warnings.push('Closing observation is missing')

  // 9. Action plan phases
  if (report.action_plan) {
    if (!report.action_plan.phase1_items?.length) warnings.push('Action plan phase 1 has no items')
    if (!report.action_plan.phase2_items?.length) warnings.push('Action plan phase 2 has no items')
    if (!report.action_plan.phase3_items?.length) warnings.push('Action plan phase 3 has no items')
  }

  // 10. Cross-pillar links
  if (report.cross_pillar_interaction?.causal_links?.length < 2) {
    warnings.push('Cross-pillar interaction has fewer than 2 causal links')
  }

  // 11. v2.0 section_takeaway checks
  if (report.executive_summary_v2 && (!report.executive_summary_v2.section_takeaway || report.executive_summary_v2.section_takeaway.length !== 2)) {
    warnings.push('Executive summary v2 missing section_takeaway (expected 2 paragraphs)')
  }
  if (report.constraint_analysis && (!report.constraint_analysis.section_takeaway || report.constraint_analysis.section_takeaway.length !== 2)) {
    warnings.push('Constraint analysis missing section_takeaway (expected 2 paragraphs)')
  }

  const passed = errors.length === 0
  if (warnings.length > 0) console.warn('[QA] Warnings:', warnings)
  if (errors.length > 0) console.error('[QA] Errors:', errors)

  return { passed, warnings, errors }
}

export async function generateDiagnosticReport(data) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const ctx = buildContext(data)

  // All sections only depend on ctx, not on each other — run everything in parallel
  const [
    executive_summary,
    scorecard_explanation,
    pillarResults,
    constraint_analysis,
    competitive_positioning,
    cross_pillar_interaction,
    raps,
    strategic_signals,
    org_systems_readiness,
    action_plan,
    advisory_workstream,
    closing_observation,
    diagnostic_interpretation,
    snapshot_interpretations,
    expected_outcomes,
  ] = await Promise.all([
    generateExecutiveSummary(client, ctx),
    generateScorecardExplanation(client, ctx),
    Promise.all(
      ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9'].map(pid =>
        generatePillarNarrative(client, ctx, pid).then(r => [pid, r])
      )
    ),
    generateConstraintAnalysis(client, ctx),
    generateCompetitivePositioning(client, ctx),
    generateCrossPillarInteraction(client, ctx),
    generateRAPSNarrative(client, ctx),
    generateStrategicSignals(client, ctx),
    generateOrgSystemsReadiness(client, ctx),
    generateActionRoadmap(client, ctx),
    generateAdvisoryWorkstream(client, ctx),
    generateClosingObservation(client, ctx),
    generateDiagnosticInterpretation(client, ctx),
    generateSnapshotInterpretations(client, ctx),
    generateExpectedOutcomes(client, ctx),
  ])

  const results = {
    executive_summary,
    scorecard_explanation,
    pillar_narratives: Object.fromEntries(pillarResults),
    constraint_analysis,
    competitive_positioning,
    cross_pillar_interaction,
    raps,
    strategic_signals,
    org_systems_readiness,
    action_plan,
    advisory_workstream,
    closing_observation,
    diagnostic_interpretation,
    snapshot_interpretations,
    expected_outcomes,
  }

  // E2: Clean banned phrases from all AI-generated text
  const report = cleanReportText(buildFinalReport(results, ctx))

  // E3: QA validation layer
  report.qa_results = runQAChecks(report)

  return report
}

export async function generateMarketReport(data) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let markets = data.markets || ''
  const industry = data.industry || 'Technology'
  const company = data.company || 'the company'

  if (!markets || markets === 'Not provided') {
    markets = 'United States'
  }

  const countryList = Array.isArray(markets)
    ? markets.slice(0, 3)
    : markets.split(',').map(c => c.trim()).filter(Boolean).slice(0, 3)

  const prompt = `Research and generate a market opportunity report for ${company} in the ${industry} sector for these markets: ${countryList.join(', ')}.

Use web search to find current, real market data for each country. For EACH market, provide:
1. A market designation (e.g. "Primary Market", "Secondary Market", "Exploratory Market")
2. An economic data table with key metrics (GDP, GDP growth rate, population, inflation, unemployment, ease of doing business)
3. A sector data table with industry-specific metrics (market size, growth rate, digital adoption rate, key verticals, competitive density)
4. Narrative bullet-point analysis across 5 categories: economic conditions, political environment, geopolitical factors, socio-economic trends, and industry growth signals (at least 3 bullets each)
5. A growth propensity assessment with position, drivers, risk summary, and strategic implications`

  const marketSchema = {
    type: 'object',
    properties: {
      countries: {
        type: 'array',
        description: 'Array of market analyses, one per country (max 3)',
        items: {
          type: 'object',
          properties: {
            market_name: { type: 'string', description: 'Country or market name' },
            market_designation: { type: 'string', description: 'e.g. "Primary Market", "Secondary Market", "Exploratory Market"' },
            economic_data_table: {
              type: 'array',
              description: 'Key economic metrics table with at least 5 rows (e.g. GDP, GDP growth, population, inflation, unemployment)',
              items: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  value: { type: 'string' },
                },
                required: ['metric', 'value'],
                additionalProperties: false,
              },
            },
            sector_data_table: {
              type: 'array',
              description: 'Industry-specific metrics table with at least 4 rows (e.g. market size, growth rate, digital adoption, competitive density)',
              items: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  value: { type: 'string' },
                },
                required: ['metric', 'value'],
                additionalProperties: false,
              },
            },
            economic_narrative: {
              type: 'object',
              properties: {
                bullets: {
                  type: 'array',
                  description: 'At least 3 bullet points on economic conditions, outlook, and business environment',
                  items: { type: 'string' },
                },
              },
              required: ['bullets'],
              additionalProperties: false,
            },
            political_environment: {
              type: 'object',
              properties: {
                bullets: {
                  type: 'array',
                  description: 'At least 3 bullet points on regulatory landscape, trade policies, and political stability',
                  items: { type: 'string' },
                },
              },
              required: ['bullets'],
              additionalProperties: false,
            },
            geopolitical_factors: {
              type: 'object',
              properties: {
                bullets: {
                  type: 'array',
                  description: 'At least 3 bullet points on geopolitical risks, alliances, and trade relationships',
                  items: { type: 'string' },
                },
              },
              required: ['bullets'],
              additionalProperties: false,
            },
            socio_economic_trends: {
              type: 'object',
              properties: {
                bullets: {
                  type: 'array',
                  description: 'At least 3 bullet points on workforce trends, digital adoption, and socio-economic shifts',
                  items: { type: 'string' },
                },
              },
              required: ['bullets'],
              additionalProperties: false,
            },
            industry_growth_signals: {
              type: 'object',
              properties: {
                bullets: {
                  type: 'array',
                  description: 'At least 3 bullet points on sector-specific growth indicators and market signals',
                  items: { type: 'string' },
                },
              },
              required: ['bullets'],
              additionalProperties: false,
            },
            growth_propensity: {
              type: 'object',
              properties: {
                position: { type: 'string', description: 'Overall growth position: High, Medium-High, Medium, or Low' },
                drivers: {
                  type: 'array',
                  description: 'At least 3 key growth drivers',
                  items: { type: 'string' },
                },
                risk: { type: 'string', description: 'Primary risk summary (2-3 sentences)' },
                strategic_implications: { type: 'string', description: 'Strategic recommendation specific to the company and industry (2-3 sentences)' },
              },
              required: ['position', 'drivers', 'risk', 'strategic_implications'],
              additionalProperties: false,
            },
          },
          required: ['market_name', 'market_designation', 'economic_data_table', 'sector_data_table', 'economic_narrative', 'political_environment', 'geopolitical_factors', 'socio_economic_trends', 'industry_growth_signals', 'growth_propensity'],
          additionalProperties: false,
        },
      },
      source_urls: {
        type: 'array',
        description: 'Source URLs used for research',
        items: { type: 'string' },
      },
    },
    required: ['countries', 'source_urls'],
    additionalProperties: false,
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 12000,
      system: [{ type: 'text', text: `You are a market research analyst specialising in B2B market opportunity assessments for the ${industry} sector. Use REAL, current data — not placeholder or estimated data. Each bullet should be a specific, sourced fact. Growth propensity must be justified by the data. Strategic implications should be specific to ${company}'s industry (${industry}).` }],
      messages: [{ role: 'user', content: prompt }],
      tool_choice: { type: 'tool', name: 'structuredOutput' },
      tools: [{
        name: 'structuredOutput',
        description: 'Return the market intelligence report in structured format',
        input_schema: marketSchema,
      }],
    })
    const toolBlock = response.content.find(b => b.type === 'tool_use')
    if (toolBlock) return toolBlock.input
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('')
    return parseJsonResponse(text)
  } catch (err) {
    console.error('[reportAgent] Market report failed:', err.message)
    return { countries: [], source_urls: [] }
  }
}

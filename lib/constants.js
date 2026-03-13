export const INDUSTRIES = [
  'SaaS / Software Platforms', 'Artificial Intelligence', 'Cybersecurity', 'Fintech',
  'Healthcare Technology', 'Manufacturing', 'Industrial Automation', 'Energy / Utilities',
  'Logistics & Supply Chain', 'E-commerce Platforms', 'Professional Services', 'Consulting',
  'Financial Services', 'Insurance', 'Pharmaceuticals', 'Biotechnology', 'Construction',
  'Real Estate', 'Hospitality', 'Education / EdTech', 'Telecommunications',
  'Media & Marketing Technology', 'Retail', 'Consumer Goods', 'Food & Beverage',
  'Agriculture / AgriTech', 'Transportation', 'Aerospace & Defence',
  'Environmental / Sustainability', 'Government / Public Sector', 'Other (specify)'
]

export const DESIGNATIONS = [
  'CEO/Founder', 'COO', 'CRO/Head of Sales', 'CMO/Head of Marketing', 'Business Unit Leader', 'Other'
]

export const REVENUE_RANGES = ['<$5M', '$5–20M', '$20–50M', '$50–100M', '$100M+']
export const SALES_STAFF = ['1–5', '6–10', '11–20', '20+']
export const MARKETING_BUDGET = ['<$100k', '$100–500k', '$500k–1M', '$1M+']
export const SALES_MODELS = ['Direct Sales', 'Partner-Channel Sales', 'Hybrid']
export const GTM_CHANNELS = ['Cold outreach', 'Paid advertising', 'Content/inbound marketing', 'Events/trade shows', 'Partnerships/channel', 'Networking/referrals', 'Others']
export const DEAL_SIZES = ['<$5k', '$5k–$25k', '$25k–$100k', '$100k–$500k', '$500k+']
export const SALES_CYCLES = ['<1 month', '1–3 months', '3–6 months', '6–12 months', '12+ months']
export const PIPELINE_VALUES = ['<1× monthly revenue target', '1–2×', '2–3×', '3–5×', '5×+']
export const WIN_RATES = ['<10%', '10–20%', '20–30%', '30–40%', '40%+']
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export const FREE_EMAIL_DOMAINS = ['gmail.com','yahoo.com','hotmail.com','outlook.com','aol.com','icloud.com','protonmail.com']

export const SCREENER_SECTIONS = [
  {
    title: 'Respondent Details', questions: [
      { id: 'q1', label: 'Respondent Name', type: 'text', required: true },
      { id: 'q2', label: 'Designation', type: 'radio', options: ['CEO/Founder','COO','CRO/Head of Sales','CMO/Head of Marketing','Business Unit Leader','Other'], required: true },
      { id: 'q3', label: 'Email Address', type: 'email', required: true, companyEmail: true },
    ]
  },
  {
    title: 'Company Context', questions: [
      { id: 'q4', label: 'Company Name', type: 'text', required: true },
      { id: 'q5', label: 'Industry / Sector', type: 'select', options: 'INDUSTRIES', required: true },
      { id: 'q6', label: 'Primary Markets', type: 'multiselect', required: true },
      { id: 'q7', label: 'Annual Revenue Range', type: 'radio', options: ['<$5M','$5–20M','$20–50M','$50–100M','$100M+'], required: true },
      { id: 'q8', label: 'Number of Sales Staff', type: 'radio', options: ['1–5','6–10','11–20','20+'], required: true },
      { id: 'q9', label: 'Annual Marketing Budget Range', type: 'radio', options: ['<$100k','$100–500k','$500k–1M','$1M+'], required: true },
    ]
  },
  {
    title: 'Sales Model', questions: [
      { id: 'q10', label: 'Primary Sales Model', type: 'radio', options: ['Direct Sales','Partner-Channel Sales','Hybrid'], required: true, note: 'This drives conditional branching in the diagnostic.' },
    ]
  },
  {
    title: 'Go-To-Market Context', questions: [
      { id: 'q11', label: 'Primary GTM Channels', type: 'checkbox', options: ['Cold outreach','Paid advertising','Content/inbound marketing','Events/trade shows','Partnerships/channel','Networking/referrals','Others'], required: true },
    ]
  },
  {
    title: 'Positioning Inputs', questions: [
      { id: 'q12', label: 'Positioning Statement', type: 'textarea', required: true, placeholder: 'In one sentence, describe how your company is different from competitors' },
      { id: 'q13', label: 'Top 3 Competitors', type: 'textarea', required: true },
      { id: 'q14', label: 'Average Deal Size', type: 'radio', options: ['<$5k','$5k–$25k','$25k–$100k','$100k–$500k','$500k+'], required: true },
      { id: 'q15', label: 'Average Sales Cycle Length', type: 'radio', options: ['<1 month','1–3 months','3–6 months','6–12 months','12+ months'], required: true },
    ]
  },
  {
    title: 'Pipeline Context', questions: [
      { id: 'q16', label: 'Approximate Monthly Pipeline Value', type: 'radio', options: ['<1× monthly revenue target','1–2×','2–3×','3–5×','5×+'], required: true },
      { id: 'q17', label: 'Average Win Rate', type: 'radio', options: ['<10%','10–20%','20–30%','30–40%','40%+'], required: true },
    ]
  },
  {
    title: 'Revenue Target Inputs', questions: [
      { id: 'q18', label: 'Current FY Revenue Target', type: 'currency', required: true, placeholder: '$10,000,000' },
      { id: 'q19', label: 'Revenue Already Invoiced This FY', type: 'currency', required: true, placeholder: '$6,500,000' },
      { id: 'q20', label: 'Fiscal Year End Month', type: 'select', options: 'MONTHS', required: true },
    ]
  },
]

export const DIAGNOSTIC_PILLARS = [
  {
    id: 'p1', name: 'Commercial Baseline', weight: 0.12,
    questions: [
      { id: 'p1_q1', text: 'How well-defined is your annual revenue plan with specific targets and timelines?', type: 'scored', options: [{l:'No formal plan',s:1},{l:'High-level ideas only',s:2},{l:'Basic plan without detail',s:3},{l:'Documented plan with quarterly targets',s:4},{l:'Detailed plan with monthly KPIs and reviews',s:5}] },
      { id: 'p1_q2', text: 'How clearly are revenue targets owned by specific individuals or teams?', type: 'scored', options: [{l:'No ownership assigned',s:1},{l:'Vague accountability',s:2},{l:'Some roles assigned',s:3},{l:'Clear ownership with tracking',s:4},{l:'Full accountability with incentives tied to targets',s:5}] },
      { id: 'p1_q3', text: 'How accurate have your revenue forecasts been over the past 12 months?', type: 'scored', options: [{l:'No forecasting done',s:1},{l:'Forecasts are rarely accurate',s:2},{l:'Sometimes within range',s:3},{l:'Usually accurate within 15%',s:4},{l:'Consistently accurate within 5%',s:5}] },
      { id: 'p1_q4', text: 'How diversified are your revenue sources across customers and segments?', type: 'scored', options: [{l:'Heavily dependent on 1-2 clients',s:1},{l:'Top 3 clients = 70%+ revenue',s:2},{l:'Moderate concentration',s:3},{l:'Reasonably diversified',s:4},{l:'Well diversified across segments',s:5}] },
      { id: 'p1_q5', text: 'How well is your sales team capacity planned to meet revenue targets?', type: 'scored', options: [{l:'No capacity planning',s:1},{l:'Reactive hiring only',s:2},{l:'Basic headcount planning',s:3},{l:'Capacity modeled against targets',s:4},{l:'Data-driven capacity with ramp models',s:5}] },
      { id: 'p1_q6', text: 'How frequently do you review and report on revenue performance?', type: 'scored', options: [{l:'Rarely or never',s:1},{l:'Quarterly at best',s:2},{l:'Monthly reviews',s:3},{l:'Weekly pipeline and revenue reviews',s:4},{l:'Real-time dashboards with weekly leadership reviews',s:5}] },
      { id: 'p1_q7', text: 'How clear is your growth trajectory for the next 2-3 years?', type: 'scored', options: [{l:'No long-term vision',s:1},{l:'Vague aspirations only',s:2},{l:'General direction defined',s:3},{l:'Clear strategy with milestones',s:4},{l:'Detailed multi-year plan with scenarios',s:5}] },
    ]
  },
  {
    id: 'p2', name: 'ICP & Buyer Urgency', weight: 0.11,
    questions: [
      { id: 'p2_q1', text: 'How clearly defined is your Ideal Customer Profile (ICP)?', type: 'scored', options: [{l:'No ICP defined',s:1},{l:'Informal understanding only',s:2},{l:'Basic ICP documented',s:3},{l:'Detailed ICP with firmographics and behaviors',s:4},{l:'Data-validated ICP regularly updated',s:5}] },
      { id: 'p2_q2', text: 'How well-documented are your buyer personas with pain points and motivations?', type: 'scored', options: [{l:'No buyer personas',s:1},{l:'Anecdotal understanding',s:2},{l:'Basic personas created',s:3},{l:'Detailed personas based on research',s:4},{l:'Validated personas with buying journey mapped',s:5}] },
      { id: 'p2_q3', text: 'How strong is the urgency-problem fit for your target buyers?', type: 'scored', options: [{l:'Problem is nice-to-solve',s:1},{l:'Some urgency exists',s:2},{l:'Moderate urgency acknowledged',s:3},{l:'High urgency — buyers actively seeking solutions',s:4},{l:'Critical problem — buyers compelled to act now',s:5}] },
      { id: 'p2_q4', text: 'How well have you prioritized and segmented your target market?', type: 'scored', options: [{l:'No segmentation',s:1},{l:'Basic industry grouping',s:2},{l:'Multiple segments identified',s:3},{l:'Segments prioritized by opportunity',s:4},{l:'Data-driven prioritization with TAM/SAM analysis',s:5}] },
      { id: 'p2_q5', text: 'How well do you understand the buying committee structure in your target accounts?', type: 'scored', options: [{l:'No understanding',s:1},{l:'Know the main contact only',s:2},{l:'Aware of key stakeholders',s:3},{l:'Committee roles mapped',s:4},{l:'Full committee engagement strategy documented',s:5}] },
      { id: 'p2_q6', text: 'How effectively do you identify and act on buyer intent signals?', type: 'scored', options: [{l:'No intent tracking',s:1},{l:'Reactive to inbound only',s:2},{l:'Some intent signals monitored',s:3},{l:'Systematic intent tracking in place',s:4},{l:'Advanced intent data driving prioritized outreach',s:5}] },
      { id: 'p2_q7', text: 'How rigorous are your lead and opportunity qualification criteria?', type: 'scored', options: [{l:'No qualification criteria',s:1},{l:'Ad hoc qualification',s:2},{l:'Basic criteria defined',s:3},{l:'Formal framework (BANT/MEDDIC) applied',s:4},{l:'Strict qualification enforced with disqualification protocols',s:5}] },
    ]
  },
  {
    id: 'p3', name: 'Positioning & Competitive Clarity', weight: 0.15,
    questions: [
      { id: 'p3_q1', text: 'How clear and compelling is your value proposition?', type: 'scored', options: [{l:'No clear value prop',s:1},{l:'Generic or unclear messaging',s:2},{l:'Reasonably clear but not differentiated',s:3},{l:'Strong and resonates with buyers',s:4},{l:'Exceptional — consistently wins competitive deals',s:5}] },
      { id: 'p3_q2', text: 'How effectively are you differentiated from your top competitors?', type: 'scored', options: [{l:'No clear differentiation',s:1},{l:'Minor differences only',s:2},{l:'Some differentiation but not consistently communicated',s:3},{l:'Clear differentiation well-understood by team',s:4},{l:'Strong moat — competitors struggle to replicate',s:5}] },
      { id: 'p3_q3', text: 'How well-defined is your market positioning statement?', type: 'scored', options: [{l:'No positioning statement',s:1},{l:'Informal or inconsistent',s:2},{l:'Documented but not widely used',s:3},{l:'Clear positioning used across sales and marketing',s:4},{l:'Strategic positioning driving all GTM decisions',s:5}] },
      { id: 'p3_q4', text: 'How consistent is your brand messaging across all channels?', type: 'scored', options: [{l:'Inconsistent or absent',s:1},{l:'Varies by channel and person',s:2},{l:'Somewhat consistent',s:3},{l:'Mostly consistent with brand guidelines',s:4},{l:'Fully consistent with enforced brand standards',s:5}] },
      { id: 'p3_q5', text: 'How strong are your customer proof points (case studies, testimonials)?', type: 'scored', options: [{l:'No proof points',s:1},{l:'Few anecdotal references',s:2},{l:'Some case studies exist',s:3},{l:'Good library of proof points',s:4},{l:'Compelling proof points for each segment/use case',s:5}] },
      { id: 'p3_q6', text: 'How systematically do you gather and use competitive intelligence?', type: 'scored', options: [{l:'No competitive tracking',s:1},{l:'Ad hoc awareness only',s:2},{l:'Basic competitive files maintained',s:3},{l:'Regular competitive analysis and battle cards',s:4},{l:'Real-time competitive intelligence program',s:5}] },
      { id: 'p3_q7', text: 'How well-defined is your pricing strategy relative to the market?', type: 'scored', options: [{l:'No pricing strategy',s:1},{l:'Pricing is ad hoc',s:2},{l:'Basic pricing model exists',s:3},{l:'Value-based pricing aligned to market',s:4},{l:'Optimized pricing with competitive positioning',s:5}] },
      { id: 'p3_q8', text: 'How well does your messaging resonate with target buyers?', type: 'scored', options: [{l:'Poor resonance',s:1},{l:'Occasionally resonates',s:2},{l:'Moderate resonance',s:3},{l:'Strong resonance validated by feedback',s:4},{l:'Exceptional — buyers quote our messaging',s:5}] },
      { id: 'p3_q9', text: 'How established is your content authority in your market?', type: 'scored', options: [{l:'No content presence',s:1},{l:'Minimal content output',s:2},{l:'Regular content but limited reach',s:3},{l:'Recognized content authority in niche',s:4},{l:'Industry thought leader with wide influence',s:5}] },
      { id: 'p3_q10', text: 'How strong is your thought leadership presence?', type: 'scored', options: [{l:'No thought leadership',s:1},{l:'Occasional articles or posts',s:2},{l:'Regular thought leadership content',s:3},{l:'Recognized voice in the industry',s:4},{l:'Definitive authority sought by media and peers',s:5}] },
      { id: 'p3_q11', text: 'How well do you own or define a category in your market?', type: 'scored', options: [{l:'No category presence',s:1},{l:'Competing in crowded space',s:2},{l:'Carving a niche',s:3},{l:'Strong category presence',s:4},{l:'Category creator or definer',s:5}] },
      { id: 'p3_q12', text: 'What is the single biggest positioning or competitive challenge you face?', type: 'qualitative' },
    ]
  },
  {
    id: 'p4', name: 'Sales System Repeatability', weight: 0.15,
    questions: [
      { id: 'p4_q1', text: 'How well-documented is your end-to-end sales process?', type: 'scored', options: [{l:'No documented process',s:1},{l:'Tribal knowledge only',s:2},{l:'Partially documented',s:3},{l:'Fully documented and accessible',s:4},{l:'Documented, trained, and continuously improved',s:5}] },
      { id: 'p4_q2', text: 'How clearly defined are the stages in your sales pipeline?', type: 'scored', options: [{l:'No defined stages',s:1},{l:'Loose stage definitions',s:2},{l:'Stages defined but inconsistently used',s:3},{l:'Clear stages with entry/exit criteria',s:4},{l:'Stages enforced with CRM automation',s:5}] },
      { id: 'p4_q3', text: 'How consistently is your sales methodology applied across the team?', type: 'scored', options: [{l:'No methodology',s:1},{l:'Individual approaches vary',s:2},{l:'Some common practices',s:3},{l:'Methodology trained and mostly followed',s:4},{l:'Methodology embedded in tools and processes',s:5}] },
      { id: 'p4_q4', text: 'How effectively is your CRM utilized for pipeline management?', type: 'scored', options: [{l:'No CRM or not used',s:1},{l:'CRM exists but poorly adopted',s:2},{l:'Basic CRM usage',s:3},{l:'CRM well-adopted with clean data',s:4},{l:'CRM is system of record driving all decisions',s:5}] },
      { id: 'p4_q5', text: 'How comprehensive is your sales enablement program?', type: 'scored', options: [{l:'No enablement program',s:1},{l:'Ad hoc training only',s:2},{l:'Basic onboarding exists',s:3},{l:'Structured enablement with content library',s:4},{l:'Continuous enablement program with coaching',s:5}] },
      { id: 'p4_q6', text: 'How smooth is the handoff process between marketing leads and sales?', type: 'scored', options: [{l:'No defined handoff',s:1},{l:'Chaotic and inconsistent',s:2},{l:'Basic handoff process',s:3},{l:'Clear SLA and handoff criteria',s:4},{l:'Automated handoff with feedback loops',s:5}] },
      { id: 'p4_q7', text: 'How standardized are your proposals, demos, and presentations?', type: 'scored', options: [{l:'Every rep does their own thing',s:1},{l:'Some templates exist',s:2},{l:'Standard templates loosely followed',s:3},{l:'Standardized with customization framework',s:4},{l:'Polished, tested, and consistently branded',s:5}] },
      { id: 'p4_q8', text: 'How well-developed is your objection handling framework?', type: 'scored', options: [{l:'No framework',s:1},{l:'Individual approaches',s:2},{l:'Common objections listed',s:3},{l:'Objection playbook used in training',s:4},{l:'Tested responses with win-rate data',s:5}] },
      { id: 'p4_q9', text: 'How regularly are deal reviews conducted?', type: 'scored', options: [{l:'No deal reviews',s:1},{l:'Occasional ad hoc reviews',s:2},{l:'Monthly pipeline reviews',s:3},{l:'Weekly structured deal reviews',s:4},{l:'Real-time deal coaching with data-driven reviews',s:5}] },
      { id: 'p4_q10', text: 'Conditional question', type: 'conditional', variants: {
        'Direct Sales': { text: 'How consistently are deals qualified before committing sales effort?', options: [{l:'No qualification process',s:1},{l:'Informal gut-feel qualification',s:2},{l:'Basic checklist used sometimes',s:3},{l:'Formal qualification applied to most deals',s:4},{l:'Rigorous qualification gate before every pursuit',s:5}] },
        'Partner-Channel Sales': { text: 'How structured and predictable is your partner/channel sales process?', options: [{l:'No partner process',s:1},{l:'Ad hoc partner relationships',s:2},{l:'Basic partner program',s:3},{l:'Structured partner tiers and enablement',s:4},{l:'Optimized partner ecosystem with predictable revenue',s:5}] },
        'Hybrid': { text: 'How clearly are responsibilities defined between direct sales and partner/channel teams when closing deals?', options: [{l:'No clear boundaries',s:1},{l:'Frequent conflicts',s:2},{l:'Basic guidelines exist',s:3},{l:'Clear rules of engagement',s:4},{l:'Optimized collaboration model with shared incentives',s:5}] },
      }},
      { id: 'p4_q11', text: 'How effective is your sales hiring and onboarding process?', type: 'scored', options: [{l:'No structured process',s:1},{l:'Hire and hope approach',s:2},{l:'Basic onboarding program',s:3},{l:'Structured hiring profile and onboarding plan',s:4},{l:'Data-driven hiring with accelerated ramp program',s:5}] },
    ]
  },
  {
    id: 'p5', name: 'Pipeline Generation', weight: 0.10,
    questions: [
      { id: 'p5_q1', text: 'How well-defined is your pipeline generation strategy?', type: 'scored', options: [{l:'No pipeline strategy',s:1},{l:'Rely on inbound/referrals only',s:2},{l:'Basic outbound + inbound mix',s:3},{l:'Multi-channel strategy with targets',s:4},{l:'Data-driven pipeline engine with predictable output',s:5}] },
      { id: 'p5_q2', text: 'How well-aligned are marketing and sales on pipeline goals?', type: 'scored', options: [{l:'No alignment',s:1},{l:'Occasional coordination',s:2},{l:'Shared awareness of goals',s:3},{l:'Aligned targets with regular syncs',s:4},{l:'Fully integrated with shared metrics and accountability',s:5}] },
      { id: 'p5_q3', text: 'How effective is your lead scoring and prioritization?', type: 'scored', options: [{l:'No lead scoring',s:1},{l:'Basic hot/warm/cold labels',s:2},{l:'Simple scoring model',s:3},{l:'Data-informed scoring with regular tuning',s:4},{l:'Predictive scoring driving all prioritization',s:5}] },
      { id: 'p5_q4', text: 'How effective is your multi-channel outreach approach?', type: 'scored', options: [{l:'Single channel only',s:1},{l:'Two channels loosely used',s:2},{l:'Multiple channels in use',s:3},{l:'Orchestrated multi-channel sequences',s:4},{l:'Optimized omni-channel with attribution tracking',s:5}] },
      { id: 'p5_q5', text: 'How well do you track and optimize pipeline velocity?', type: 'scored', options: [{l:'No velocity tracking',s:1},{l:'Aware of rough timelines',s:2},{l:'Basic stage duration tracked',s:3},{l:'Velocity metrics reviewed regularly',s:4},{l:'Velocity optimized across all stages with benchmarks',s:5}] },
      { id: 'p5_q6', text: 'Conditional question', type: 'conditional', variants: {
        'Direct Sales': { text: 'How effective are your inbound and outbound activities at generating new pipeline?', options: [{l:'Ineffective or non-existent',s:1},{l:'Sporadic results',s:2},{l:'Moderate effectiveness',s:3},{l:'Consistently generating qualified pipeline',s:4},{l:'High-performance engine exceeding targets',s:5}] },
        'Partner-Channel Sales': { text: 'How effective are your partners or channel ecosystem at generating qualified pipeline?', options: [{l:'Partners generate no pipeline',s:1},{l:'Occasional partner-sourced deals',s:2},{l:'Some partner-generated pipeline',s:3},{l:'Partners consistently contribute pipeline',s:4},{l:'Partner ecosystem is primary pipeline engine',s:5}] },
        'Hybrid': { text: 'How effective are your direct sales and partner/channel ecosystem at generating pipeline?', options: [{l:'Neither channel is effective',s:1},{l:'One channel marginally effective',s:2},{l:'Both channels generate some pipeline',s:3},{l:'Both channels consistently contributing',s:4},{l:'Optimized dual-engine with balanced contribution',s:5}] },
      }},
    ]
  },
  {
    id: 'p6', name: 'Revconomics', weight: 0.07,
    questions: [
      { id: 'p6_q1', text: 'How well do you track and understand your Customer Acquisition Cost (CAC)?', type: 'scored', options: [{l:'No CAC tracking',s:1},{l:'Rough estimates only',s:2},{l:'Basic CAC calculated',s:3},{l:'CAC tracked by channel and segment',s:4},{l:'Optimized CAC with payback period targets',s:5}] },
      { id: 'p6_q2', text: 'How well do you understand Customer Lifetime Value (LTV)?', type: 'scored', options: [{l:'No LTV understanding',s:1},{l:'Rough idea of average deal value',s:2},{l:'Basic LTV calculated',s:3},{l:'LTV modeled with retention and expansion',s:4},{l:'LTV/CAC ratio drives investment decisions',s:5}] },
      { id: 'p6_q3', text: 'How clear are your unit economics for each product/service?', type: 'scored', options: [{l:'No unit economics tracked',s:1},{l:'Revenue tracked but costs unclear',s:2},{l:'Basic margin understanding',s:3},{l:'Clear unit economics by offering',s:4},{l:'Optimized unit economics driving pricing decisions',s:5}] },
      { id: 'p6_q4', text: 'How predictable is your monthly/quarterly revenue?', type: 'scored', options: [{l:'Highly unpredictable',s:1},{l:'Lumpy and uncertain',s:2},{l:'Some recurring base',s:3},{l:'Mostly predictable with reliable pipeline',s:4},{l:'Highly predictable with strong recurring base',s:5}] },
      { id: 'p6_q5', text: 'How well do you manage customer churn and retention?', type: 'scored', options: [{l:'No churn tracking',s:1},{l:'Aware churn is an issue',s:2},{l:'Basic churn metrics tracked',s:3},{l:'Active retention programs in place',s:4},{l:'Best-in-class retention with expansion revenue',s:5}] },
    ]
  },
  {
    id: 'p7', name: 'Strategic Constraints', weight: 0.08,
    questions: [
      { id: 'p7_q1', text: 'How well are resources allocated to your highest-priority growth initiatives?', type: 'scored', options: [{l:'No clear prioritization',s:1},{l:'Spread thin across too many initiatives',s:2},{l:'Some prioritization',s:3},{l:'Resources focused on top 3 priorities',s:4},{l:'Rigorous prioritization with resource allocation framework',s:5}] },
      { id: 'p7_q2', text: 'How ready is your technology stack to support growth?', type: 'scored', options: [{l:'Outdated or missing key tools',s:1},{l:'Basic tools with many gaps',s:2},{l:'Adequate stack with some limitations',s:3},{l:'Modern stack supporting current needs',s:4},{l:'Scalable, integrated stack ready for 3x growth',s:5}] },
      { id: 'p7_q3', text: 'How well-aligned are cross-functional teams on growth priorities?', type: 'scored', options: [{l:'Siloed departments',s:1},{l:'Occasional cross-functional meetings',s:2},{l:'Some shared goals',s:3},{l:'Regular cross-functional planning',s:4},{l:'Fully aligned with shared OKRs and metrics',s:5}] },
      { id: 'p7_q4', text: 'How well have you identified and addressed scalability bottlenecks?', type: 'scored', options: [{l:'Unaware of bottlenecks',s:1},{l:'Aware but not addressing',s:2},{l:'Some bottlenecks being worked on',s:3},{l:'Key bottlenecks identified with mitigation plans',s:4},{l:'Proactively identifying and removing bottlenecks',s:5}] },
      { id: 'p7_q5', text: 'How effectively do you manage strategic risks to your growth plan?', type: 'scored', options: [{l:'No risk management',s:1},{l:'Reactive risk handling',s:2},{l:'Basic risk awareness',s:3},{l:'Risk register with mitigation plans',s:4},{l:'Proactive risk management with contingency planning',s:5}] },
      { id: 'p7_q6', text: 'What is the single biggest strategic constraint limiting your growth right now?', type: 'qualitative' },
    ]
  },
  {
    id: 'p8', name: 'Organisational Alignment & Capability', weight: 0.10,
    questions: [
      { id: 'p8_q1', text: 'Leadership is aligned on the company\'s top growth priorities.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p8_q2', text: 'Leaders are aligned on the main operational or capability changes needed to support growth.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p8_q3', text: 'Sales, marketing, delivery, and operational teams are working toward shared commercial goals.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p8_q4', text: 'Roles, responsibilities, and decision ownership across key growth functions are clear.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p8_q5', text: 'Growth initiatives are translated into practical actions across teams.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p8_q6', text: 'Managers are able to drive accountability and follow-through consistently.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p8_q7', text: 'Internal communication supports execution rather than creating confusion or delay.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p8_q8', text: 'Core operating processes support execution consistency across teams.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p8_q9', text: 'The company has enough capability in place to support its next phase of growth.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p8_q10', text: 'Capability gaps are recognised and addressed through hiring, training, or external support.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p8_q11', text: 'The company is open to change and able to adopt improved ways of working.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p8_q12', text: 'People across the business are reasonably ready to adopt new systems, automation, or AI-enabled ways of working.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p8_q13', text: 'What is the biggest people, alignment, or execution issue currently slowing growth?', type: 'qualitative' },
    ]
  },
  {
    id: 'p9', name: 'Systems Readiness & AI Transformation', weight: 0.12,
    questions: [
      { id: 'p9_q1', text: 'Our core systems give leadership reliable visibility into performance, pipeline, and execution.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p9_q2', text: 'Our main business tools and systems work together well enough to support efficiency and decision-making.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p9_q3', text: 'Important workflows are not overly dependent on manual work, duplicate effort, or disconnected tools.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p9_q4', text: 'Key commercial and operational data is accessible, trusted, and usable across the business.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p9_q5', text: 'Data quality is strong enough to support reporting, automation, and analysis.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p9_q6', text: 'The business has a clear source of truth for critical data, with consistent definitions and standards where needed.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p9_q7', text: 'The company understands the need for clear governance when adopting AI in business processes.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p9_q8', text: 'The company has at least a basic approach to identifying and managing risks linked to AI use cases.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p9_q9', text: 'The company has identified practical AI or automation use cases that could create business value.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p9_q10', text: 'The business has assessed which use cases are worth prioritising based on relevance, value, and feasibility.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p9_q11', text: 'The company\'s current data and technology infrastructure is sufficient to support better automation, analytics, or AI-enabled workflows.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p9_q12', text: 'Our current systems are not a major blocker to growth, efficiency, or transformation.', type: 'scored', options: [{l:'Strongly disagree',s:1},{l:'Disagree',s:2},{l:'Partly in place',s:3},{l:'Mostly in place',s:4},{l:'Strongly agree',s:5}] },
      { id: 'p9_q13', text: 'What is the biggest systems, data, or AI-readiness issue currently slowing the business down?', type: 'qualitative' },
    ]
  },
]

export const MATURITY_BANDS = [
  { min: 80, max: 100, label: 'Growth Engine Strong', color: 'green' },
  { min: 65, max: 79, label: 'Growth System Constrained', color: 'lime' },
  { min: 50, max: 64, label: 'Growth System Underpowered', color: 'orange' },
  { min: 0, max: 49, label: 'Growth System At Risk', color: 'red' },
]

export const PILLAR_NAMES = {
  p1: 'Commercial Baseline', p2: 'ICP & Buyer Urgency',
  p3: 'Positioning & Competitive Clarity', p4: 'Sales System Repeatability',
  p5: 'Pipeline Generation', p6: 'Revconomics', p7: 'Strategic Constraints',
  p8: 'Organisational Alignment & Capability', p9: 'Systems Readiness & AI Transformation',
}

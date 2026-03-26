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

export const QUESTIONNAIRE_BASE_URL = 'https://biz-ascend-rad.vercel.app'

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
      { id: 'q16', label: 'Total Open Pipeline Value', type: 'currency', required: true, placeholder: '$2,500,000' },
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
      { id: 'p1_q1', text: 'How specific is your company\'s annual revenue or Go-To-Market plan?', type: 'scored', options: [{l:'No written revenue plan exists — targets are informal or absent',s:1},{l:'A top-line revenue number exists but without breakdown by segment, product, or quarter',s:2},{l:'Revenue plan exists with quarterly targets, but lacks clear assumptions or segment detail',s:3},{l:'Documented plan with quarterly targets broken down by segment or product, with named owners',s:4},{l:'Detailed plan with monthly targets by segment, with documented assumptions, milestones, and regular review cadence',s:5}] },
      { id: 'p1_q2', text: 'How clearly are revenue targets owned by specific individuals or teams?', type: 'scored', options: [{l:'No ownership assigned',s:1},{l:'Vague accountability',s:2},{l:'Some roles assigned',s:3},{l:'Clear ownership with tracking',s:4},{l:'Full accountability with incentives tied to targets',s:5}] },
      { id: 'p1_q3', text: 'How accurate are your revenue forecasts against your annual revenue targets?', type: 'scored', options: [{l:'We don\'t produce formal revenue forecasts',s:1},{l:'Forecasts exist but typically miss by more than 30%',s:2},{l:'Forecasts are directionally right but miss by 15–30% in most quarters',s:3},{l:'Forecasts are usually accurate within 10–15% of actual results',s:4},{l:'Forecasts are consistently accurate within 10%, with variance tracked and explained',s:5}] },
      { id: 'p1_q4', text: 'How diversified are your revenue sources across customers and segments?', type: 'scored', options: [{l:'More than 70% of revenue comes from 1–3 accounts',s:1},{l:'50–70% of revenue is concentrated in a small number of accounts',s:2},{l:'30–50% — moderate concentration with some diversification',s:3},{l:'15–30% — reasonably diversified across multiple accounts',s:4},{l:'Less than 15% from any single cluster — well diversified',s:5}] },
      { id: 'p1_q5', text: 'How clearly can you demonstrate that your current sales team capacity is sufficient to hit this year\'s revenue target?', type: 'scored', options: [{l:'We have not mapped sales capacity to revenue targets',s:1},{l:'We know roughly how many salespeople we need but haven\'t modelled it against target',s:2},{l:'Basic capacity plan exists linking headcount to target, but doesn\'t account for ramp time or attrition',s:3},{l:'Capacity model is in place with quota coverage ratios, ramp timelines, and hiring plan aligned to target',s:4},{l:'Capacity model is actively managed with real-time quota attainment tracking, ramp curves, and scenario planning for attrition',s:5}] },
      { id: 'p1_q6', text: 'How frequently do you review your pipeline and revenue performance?', type: 'scored', options: [{l:'No regular revenue or pipeline reviews take place',s:1},{l:'Revenue is reviewed quarterly, but pipeline health is not systematically included',s:2},{l:'Monthly reviews that cover both revenue actuals and pipeline status',s:3},{l:'Weekly structured reviews covering revenue, pipeline, forecast accuracy, and deal progression',s:4},{l:'Weekly leadership reviews with real-time dashboards, plus triggered reviews when pipeline or forecast deviate from plan',s:5}] },
      { id: 'p1_q7', text: 'How clear is your growth strategy for the next 2–3 years?', type: 'scored', options: [{l:'No long-term vision',s:1},{l:'Vague aspirations only',s:2},{l:'General direction defined',s:3},{l:'Clear strategy with milestones',s:4},{l:'Detailed multi-year plan with scenarios',s:5}] },
    ]
  },
  {
    id: 'p2', name: 'ICP & Buyer Urgency', weight: 0.11,
    questions: [
      { id: 'p2_q1', text: 'How clearly defined is your Ideal Customer Profile (ICP)?', type: 'scored', options: [{l:'No written ICP — we sell to anyone who shows interest',s:1},{l:'A general sense of our target customer exists but it\'s not documented or shared across the team',s:2},{l:'ICP is documented with basic criteria (industry, company size, geography) but not validated against win/loss data',s:3},{l:'ICP is documented with firmographics, buying triggers, and disqualification criteria — and used actively by sales and marketing',s:4},{l:'ICP is data-validated, reviewed quarterly, and directly governs strategic decisions — including which markets to enter, which deals to walk away from, and where to allocate budget',s:5}] },
      { id: 'p2_q2', text: 'How well do you understand the specific problems your target customers are trying to solve?', type: 'scored', options: [{l:'We have not clearly identified the core problems our customers are trying to solve',s:1},{l:'We have a general sense of customer problems based on internal assumptions, but haven\'t validated them externally',s:2},{l:'We understand key customer problems based on some customer conversations, but haven\'t systematically researched or documented them',s:3},{l:'Customer problems are well-documented, validated through structured interviews or research, and inform our sales messaging',s:4},{l:'We have deep, evidence-based understanding of customer problems, including how they rank priorities, what triggers buying, and what the cost of inaction is',s:5}] },
      { id: 'p2_q3', text: 'How strongly do target buyers confirm that the problem you solve is a current priority when you engage them?', type: 'scored', options: [{l:'Most prospects don\'t recognise the problem as something they need to solve right now',s:1},{l:'Some prospects acknowledge the problem, but it rarely ranks as a top-3 priority for them',s:2},{l:'Prospects generally agree the problem matters, but often defer action or deprioritise it against other initiatives',s:3},{l:'Most prospects confirm the problem is an active priority and are already exploring solutions when they engage with us',s:4},{l:'Prospects consistently arrive with budget allocated and a timeline to solve this problem — we are responding to existing demand, not creating it',s:5}] },
      { id: 'p2_q4', text: 'How well have you prioritized and segmented your target segments?', type: 'scored', options: [{l:'No market segmentation — we pursue all opportunities equally regardless of fit',s:1},{l:'We group prospects by basic categories (industry or size) but don\'t prioritise between them',s:2},{l:'Multiple segments are identified and we have a rough sense of which are more attractive, but no formal prioritisation framework',s:3},{l:'Segments are clearly prioritised by criteria such as deal size, win rate, or strategic fit — and sales effort is allocated accordingly',s:4},{l:'Segmentation is data-driven with TAM/SAM analysis, and actively governs territory planning, campaign targeting, and resource allocation',s:5}] },
      { id: 'p2_q5', text: 'How well do you understand the buying committee structure in your target accounts?', type: 'scored', options: [{l:'We typically engage with one contact per account and don\'t map the broader decision-making group',s:1},{l:'We know there are multiple stakeholders involved but rely on our main contact to navigate internally',s:2},{l:'We identify key stakeholders (economic buyer, technical evaluator, end user) but don\'t systematically engage all of them',s:3},{l:'Buying committee roles are mapped for most deals, and our sales process includes steps to engage each stakeholder',s:4},{l:'We have a documented buying committee engagement strategy with tailored messaging for each role, and deliberately build relationships with multiple stakeholders in every deal above a defined size',s:5}] },
      { id: 'p2_q6', text: 'How regularly do you review and update your ICP based on actual results?', type: 'scored', options: [{l:'Our ICP or target customer definition has never been formally reviewed since it was first created',s:1},{l:'We revisit it occasionally, but only when something goes obviously wrong (e.g., a string of lost deals)',s:2},{l:'We review our ICP roughly once a year, but updates are based on gut feel rather than data',s:3},{l:'ICP is reviewed at least every 6 months using win/loss data and pipeline analysis to validate or adjust targeting',s:4},{l:'ICP is continuously refined based on conversion data, customer feedback, and market shifts — with changes reflected in targeting and messaging within 30 days',s:5}] },
      { id: 'p2_q7', text: 'How well does your outbound messaging speak to the specific pain points of your ICP?', type: 'scored', options: [{l:'Our messaging is generic and not tailored to any specific customer pain point or segment',s:1},{l:'Messaging references customer challenges in general terms, but doesn\'t address specific pain points by segment',s:2},{l:'Messaging is somewhat relevant to our ICP\'s pain points, but was developed based on internal assumptions rather than customer language',s:3},{l:'Messaging directly addresses the top pain points our ICP cares about, using language validated through customer conversations or testing',s:4},{l:'Messaging is segment-specific, rooted in validated customer pain language, and regularly refined based on response rates and deal conversion data',s:5}] },
    ]
  },
  {
    id: 'p3', name: 'Positioning & Competitive Clarity', weight: 0.15,
    questions: [
      { id: 'p3_q1', text: 'How clear and compelling is your value proposition?', type: 'scored', options: [{l:'We cannot clearly articulate what value we deliver or why a customer should choose us',s:1},{l:'We have a general value statement, but it could apply to most competitors in our space',s:2},{l:'Our value proposition is documented and reasonably clear, but not consistently used or tested with buyers',s:3},{l:'Value proposition is specific, differentiated, and actively used across sales and marketing — buyers confirm it resonates',s:4},{l:'Value proposition is sharp enough that prospects can repeat it back to us, and it consistently shifts competitive conversations in our favour',s:5}] },
      { id: 'p3_q2', text: 'How effectively are you differentiated from your top competitors?', type: 'scored', options: [{l:'We frequently lose deals on positioning — prospects see us as interchangeable with competitors',s:1},{l:'We can articulate differences, but prospects often don\'t find them compelling enough to choose us',s:2},{l:'Differentiation holds in some competitive situations but not consistently — it depends on the rep or the deal',s:3},{l:'In most competitive deals, prospects can clearly see why we\'re different and our differentiation influences their decision',s:4},{l:'Our differentiation is strong enough that we regularly win deals even at a price premium, and competitors struggle to position against us',s:5}] },
      { id: 'p3_q3', text: 'How consistently does everyone in your company describe what you do, who you serve, and why it matters — in the same way?', type: 'scored', options: [{l:'There is no consistent way to describe our company — different people say different things',s:1},{l:'Leadership has a general narrative, but sales, marketing, and delivery teams each describe the company differently',s:2},{l:'A core narrative exists and most people are aware of it, but it\'s not enforced or embedded in materials',s:3},{l:'A clear, documented positioning narrative is used consistently across sales decks, website, outreach, and proposals',s:4},{l:'Positioning is embedded in every customer touchpoint, reinforced in training, and updated when market conditions change',s:5}] },
      { id: 'p3_q4', text: 'How consistent is your brand messaging across all channels?', type: 'scored', options: [{l:'Inconsistent or absent',s:1},{l:'Varies by channel and person',s:2},{l:'Somewhat consistent',s:3},{l:'Mostly consistent with brand guidelines',s:4},{l:'Fully consistent with enforced brand standards',s:5}] },
      { id: 'p3_q5', text: 'How strong are your customer proof points (case studies, testimonials)?', type: 'scored', options: [{l:'We have no formal case studies, testimonials, or documented customer success stories',s:1},{l:'A few customer references exist but they\'re anecdotal and not packaged for sales use',s:2},{l:'Some case studies or testimonials exist, but they don\'t cover our key segments or use cases',s:3},{l:'We have a library of proof points covering our main segments, and sales actively uses them in deals',s:4},{l:'Proof points are segment-specific, include measurable outcomes, and are systematically updated — new wins are documented within 60 days',s:5}] },
      { id: 'p3_q6', text: 'How systematically do you gather and use competitive intelligence?', type: 'scored', options: [{l:'We don\'t actively track what competitors are doing or how they position themselves',s:1},{l:'We\'re aware of key competitors but only gather intelligence reactively (e.g., when we lose a deal)',s:2},{l:'Basic competitive information is maintained (e.g., a comparison spreadsheet) but it\'s not regularly updated or used in sales',s:3},{l:'Competitive analysis is updated regularly, comparison guides exist for top competitors, and sales is trained on how to position against them',s:4},{l:'Competitive intelligence is systematic — including win/loss analysis, positioning monitoring, and real-time updates to sales materials when competitors change their approach',s:5}] },
      { id: 'p3_q7', text: 'How well-defined is your pricing strategy relative to the market?', type: 'scored', options: [{l:'Pricing is inconsistent — we negotiate each deal individually with no clear framework',s:1},{l:'We have a general price list, but discounting is frequent and not governed by clear rules',s:2},{l:'A pricing model exists with some structure, but it\'s not clearly tied to the value delivered or competitive positioning',s:3},{l:'Pricing is value-based, aligned to market positioning, with clear rules on when and how much to discount',s:4},{l:'Pricing strategy is optimised with segment-specific packaging, tested price points, and clear rules that connect pricing to differentiation and margins',s:5}] },
      { id: 'p3_q8', text: 'How well can you demonstrate that your messaging resonates with target buyers — through data, feedback, or conversion results?', type: 'scored', options: [{l:'We have no evidence that our messaging resonates — it\'s based on internal opinion only',s:1},{l:'We occasionally hear positive feedback from buyers, but it\'s anecdotal and not tracked',s:2},{l:'Some evidence exists (e.g., buyer comments, response rates) but we don\'t systematically measure messaging effectiveness',s:3},{l:'We regularly test and measure messaging effectiveness through response rates, win/loss feedback, or buyer surveys',s:4},{l:'Messaging is continuously optimised using testing, conversion data, and structured buyer feedback — with changes deployed based on results',s:5}] },
      { id: 'p3_q9', text: 'How intentionally are you investing in building content authority in your market?', type: 'scored', options: [{l:'We produce little to no content and have no plan to build authority in our space',s:1},{l:'We publish content occasionally, but it\'s ad hoc — there\'s no strategy or consistent cadence',s:2},{l:'We have a basic content plan and publish regularly, but it\'s not clearly tied to our positioning or target buyer needs',s:3},{l:'Content is strategically planned to reinforce our positioning, addresses our ICP\'s key concerns, and is published on a consistent schedule',s:4},{l:'Content strategy is a core part of our go-to-market — we invest dedicated resources, measure engagement, and use content to drive pipeline and establish credibility in our category',s:5}] },
      { id: 'p3_q10', text: 'How actively are your leaders investing in building thought leadership and industry visibility?', type: 'scored', options: [{l:'Our leadership team has no public presence or involvement in industry conversations',s:1},{l:'Leaders occasionally attend or speak at events, but there\'s no deliberate thought leadership strategy',s:2},{l:'Some leadership visibility exists (articles, speaking, social media) but it\'s sporadic and not tied to business objectives',s:3},{l:'Leaders regularly publish, speak, or contribute to industry conversations as part of a deliberate strategy to build credibility',s:4},{l:'Thought leadership is a strategic priority — leaders are recognised voices in the industry, and their visibility directly supports pipeline and brand authority',s:5}] },
      { id: 'p3_q11', text: 'How well do you own or define a category in your market?', type: 'scored', options: [{l:'We cannot clearly name the category we compete in, or buyers wouldn\'t place us in a recognisable category',s:1},{l:'We compete in a defined category but have no distinct position within it — we look like one of many',s:2},{l:'We\'ve identified a niche or sub-category where we can compete, but haven\'t established ownership of it',s:3},{l:'We have a clear category position that buyers recognise, and our positioning is distinct within that category',s:4},{l:'We are seen as defining or leading our category — buyers associate the problem space with our brand',s:5}] },
      { id: 'p3_q12', text: 'What is the single biggest competitive challenge you face?', type: 'qualitative' },
      { id: 'p3_q13', text: 'What is your differentiated value that makes you win against your competitors?', type: 'qualitative' },
    ]
  },
  {
    id: 'p4', name: 'Sales System Repeatability', weight: 0.15,
    questions: [
      { id: 'p4_q1', text: 'How well-documented is your end-to-end sales process?', type: 'scored', options: [{l:'No documented sales process exists — each rep sells their own way',s:1},{l:'Senior reps know the process informally, but nothing is written down or shared with the team',s:2},{l:'Sales process is partially documented but not complete or consistently followed',s:3},{l:'End-to-end sales process is fully documented, accessible to the team, and used as the basis for deal management',s:4},{l:'Sales process is documented, embedded in training, and continuously improved based on win/loss analysis and pipeline data',s:5}] },
      { id: 'p4_q2', text: 'How clearly defined are the stages in your sales pipeline?', type: 'scored', options: [{l:'No pipeline stages are defined — deals are tracked informally or not at all',s:1},{l:'Some stage names exist but the team interprets them differently',s:2},{l:'Pipeline stages are defined and documented, but deals move between stages inconsistently',s:3},{l:'Clear pipeline stages with specific criteria for when a deal moves from one stage to the next, used consistently by the team',s:4},{l:'Pipeline stages are enforced in the CRM with clear progression criteria, and stage accuracy is regularly audited',s:5}] },
      { id: 'p4_q3', text: 'How consistently does your sales team follow the same process when running deals?', type: 'scored', options: [{l:'Every salesperson runs deals their own way — there\'s no common process',s:1},{l:'A few common practices exist informally, but most reps rely on their own methods',s:2},{l:'The team generally follows a similar process, but there\'s no formal structure or accountability around it',s:3},{l:'A clear, shared sales process is trained and followed by most of the team, with managers reinforcing it',s:4},{l:'The sales process is standardised, embedded in tools and reviews, and managers coach to it consistently',s:5}] },
      { id: 'p4_q4', text: 'How effectively is your CRM utilized for pipeline management?', type: 'scored', options: [{l:'We don\'t use a CRM, or it exists but sales doesn\'t use it for deal management',s:1},{l:'CRM is in place but data is inconsistent — many deals are missing or outdated',s:2},{l:'Most deals are in the CRM, but data quality varies and managers can\'t fully rely on it for pipeline reporting',s:3},{l:'CRM is well-adopted with clean data — pipeline reports are trusted and used in weekly reviews',s:4},{l:'CRM is the single source of truth for all deal and pipeline data, and it drives forecasting, reporting, and coaching decisions',s:5}] },
      { id: 'p4_q5', text: 'How well-equipped is your sales team with the training, tools, and content they need to sell effectively?', type: 'scored', options: [{l:'Sales reps are largely left to figure things out on their own — no structured support exists',s:1},{l:'Some training materials or tools exist, but they\'re outdated or hard to find',s:2},{l:'Basic onboarding and a set of sales materials exist, but ongoing training and support are inconsistent',s:3},{l:'Reps have access to structured training, up-to-date sales content, and tools that support their daily workflow',s:4},{l:'Sales team is continuously supported with coaching, regularly updated content, and tools that are integrated into how they sell',s:5}] },
      { id: 'p4_q6', text: 'How smooth is the handoff process between marketing leads and sales?', type: 'scored', options: [{l:'There is no defined process for passing leads from marketing to sales',s:1},{l:'Leads are passed over informally, but there are no clear criteria for when a lead is ready for sales',s:2},{l:'A basic handoff process exists, but it\'s not consistently followed and leads sometimes fall through the cracks',s:3},{l:'Clear criteria exist for when marketing passes a lead to sales, with agreed timelines for follow-up',s:4},{l:'Handoff is automated with clear criteria, agreed response times, and a feedback loop so marketing knows what happened to each lead',s:5}] },
      { id: 'p4_q7', text: 'How standardized are your proposals, demos, and presentations?', type: 'scored', options: [{l:'Every rep creates their own proposals, demos, and presentations from scratch',s:1},{l:'Some templates exist but reps often ignore them or heavily modify them',s:2},{l:'Standard templates are available and loosely followed, but quality varies between reps',s:3},{l:'Proposals, demos, and presentations follow a standard format with clear guidelines on what to customise per deal',s:4},{l:'All customer-facing materials are polished, consistently branded, and regularly updated — reps spend time customising content, not creating it',s:5}] },
      { id: 'p4_q8', text: 'How well-prepared is your sales team to handle the most common reasons prospects hesitate or say no?', type: 'scored', options: [{l:'Reps handle pushback on their own — there\'s no shared guidance on how to respond to common objections',s:1},{l:'A few common objections are known informally, but responses vary by rep',s:2},{l:'The most common objections are documented, but reps aren\'t consistently trained on how to handle them',s:3},{l:'A clear set of objection responses exists, is used in training, and reps are coached on handling pushback effectively',s:4},{l:'Objection handling is data-driven — we know which objections cost us the most deals and have tested responses that improve conversion',s:5}] },
      { id: 'p4_q9', text: 'How regularly are pipeline reviews conducted?', type: 'scored', options: [{l:'Pipeline reviews don\'t happen — reps manage deals without structured oversight',s:1},{l:'Pipeline are reviewed occasionally, usually only when a rep asks for help or a deal is at risk',s:2},{l:'Pipeline reviews happen monthly, but individual deal coaching is inconsistent',s:3},{l:'Structured deal reviews happen weekly, with managers actively coaching reps on their top opportunities',s:4},{l:'Deal reviews are a core discipline — weekly coaching sessions are data-driven, and stalled or at-risk deals are flagged and acted on immediately',s:5}] },
      { id: 'p4_q10', text: 'Conditional question', type: 'conditional', variants: {
        'Direct Sales': { text: 'How consistently are deals qualified before committing sales effort?', options: [{l:'No qualification criteria exist — reps pursue any deal that comes in',s:1},{l:'Qualification is informal and depends on individual judgment',s:2},{l:'Basic qualification criteria exist but are only applied sometimes',s:3},{l:'Clear qualification criteria are applied before committing sales effort to most deals',s:4},{l:'Qualification is a required gate — deals that don\'t meet criteria are disqualified and removed from the pipeline',s:5}] },
        'Partner-Channel Sales': { text: 'How structured and predictable is your partner/channel sales process?', options: [{l:'No structured partner sales process exists — partner activity is unpredictable',s:1},{l:'We have some partner relationships but they\'re managed informally with no consistent process',s:2},{l:'A basic partner program exists with some structure, but partner contribution to pipeline is inconsistent',s:3},{l:'Partner program is structured with clear tiers, enablement support, and regular engagement — partners contribute pipeline reliably',s:4},{l:'Partner ecosystem is optimised with predictable revenue contribution, joint planning, and shared performance metrics',s:5}] },
        'Hybrid': { text: 'How clearly are responsibilities defined between direct sales and partner/channel teams when closing deals?', options: [{l:'No clear rules exist for how direct and partner teams work together — conflicts are common',s:1},{l:'Some informal understanding exists but there are frequent overlaps and disputes over deal ownership',s:2},{l:'Basic guidelines exist for which deals go direct vs partner, but they\'re not consistently enforced',s:3},{l:'Clear rules of engagement are defined and followed, with agreed processes for deal registration and conflict resolution',s:4},{l:'Direct and partner teams operate as a coordinated system with shared incentives, joint account planning, and clear accountability',s:5}] },
      }},
      { id: 'p4_q11', text: 'How effective is your sales hiring and onboarding process?', type: 'scored', options: [{l:'No structured approach to hiring or onboarding salespeople — it\'s ad hoc every time',s:1},{l:'We hire based on availability and gut feel, and new reps are expected to learn on the job',s:2},{l:'A basic onboarding program exists, but there\'s no defined hiring profile and ramp time is long',s:3},{l:'We have a clear ideal sales hire profile and a structured onboarding plan with defined milestones',s:4},{l:'Hiring and onboarding are data-driven — we know what a successful rep looks like, have a structured ramp program, and track time-to-productivity',s:5}] },
    ]
  },
  {
    id: 'p5', name: 'Pipeline Generation', weight: 0.10,
    questions: [
      { id: 'p5_q1', text: 'How well-setup is your pipeline generation system?', type: 'scored', options: [{l:'No pipeline generation system exists — new business comes in unpredictably',s:1},{l:'We rely primarily on referrals or inbound enquiries with no proactive outreach plan',s:2},{l:'A basic mix of outbound and inbound activity exists, but it\'s not tied to specific pipeline targets',s:3},{l:'Multi-channel pipeline system is in place with clear targets per channel and regular performance tracking',s:4},{l:'Pipeline generation is a managed engine — targets are set by channel and segment, performance is tracked weekly, and the mix is adjusted based on what\'s working',s:5}] },
      { id: 'p5_q2', text: 'How well-aligned are marketing and sales on pipeline goals?', type: 'scored', options: [{l:'Marketing and sales operate independently with no shared pipeline goals',s:1},{l:'There\'s some awareness of each other\'s targets, but no formal coordination on pipeline',s:2},{l:'Marketing and sales share a general understanding of pipeline goals, but don\'t plan or report against them together',s:3},{l:'Aligned pipeline targets are in place, with regular joint reviews to track marketing\'s contribution to sales pipeline',s:4},{l:'Fully integrated — marketing and sales share pipeline metrics, jointly own targets, and have mutual accountability for pipeline outcomes',s:5}] },
      { id: 'p5_q3', text: 'How effectively do you prioritise which leads and opportunities to pursue first?', type: 'scored', options: [{l:'No prioritisation — all leads are treated equally regardless of fit or readiness',s:1},{l:'Reps use their own judgment to decide what to pursue, with no shared criteria',s:2},{l:'Some basic prioritisation exists (e.g., by deal size or source) but it\'s not consistently applied',s:3},{l:'Clear prioritisation criteria are in place and used by the team — higher-fit opportunities get faster and more focused attention',s:4},{l:'Prioritisation is systematic and data-informed — we know which lead types convert best and allocate effort accordingly, with regular review of what\'s working',s:5}] },
      { id: 'p5_q4', text: 'How effective is your multi-channel outreach system in lead generation?', type: 'scored', options: [{l:'We rely on a single channel to generate pipeline (e.g., only referrals, or only cold email)',s:1},{l:'We use two or three channels but they\'re not coordinated — each runs independently',s:2},{l:'Multiple channels are in use and there\'s some coordination, but no clear view of which channels produce the best results',s:3},{l:'Outreach is coordinated across channels with a deliberate sequence, and we track which channels generate the most qualified pipeline',s:4},{l:'Our outreach approach is optimised across channels — we know exactly which combinations work best for each segment and continuously adjust the mix',s:5}] },
      { id: 'p5_q5', text: 'How well do you track how fast deals move through your pipeline and where they get stuck?', type: 'scored', options: [{l:'We don\'t track how long deals spend in each stage or where they stall',s:1},{l:'We have a rough sense of how long deals take, but don\'t measure it formally',s:2},{l:'We track basic deal timelines (e.g., average sales cycle length) but don\'t analyse where deals slow down by stage',s:3},{l:'We track deal movement by stage, know where deals tend to stall, and review this data regularly',s:4},{l:'Pipeline speed is actively managed — we have benchmarks for each stage, flag deals that exceed them, and take action to accelerate or remove stalled opportunities',s:5}] },
      { id: 'p5_q6', text: 'Conditional question', type: 'conditional', variants: {
        'Direct Sales': { text: 'How effective are your inbound and outbound activities at generating new pipeline leads?', options: [{l:'Inbound and outbound activities are minimal or non-existent — pipeline generation is opportunistic',s:1},{l:'Some inbound and outbound activity exists but results are sporadic and unpredictable',s:2},{l:'Both inbound and outbound generate some pipeline, but output is inconsistent month-to-month',s:3},{l:'Inbound and outbound are both consistently generating qualified pipeline against clear targets',s:4},{l:'Pipeline generation engine exceeds targets — both inbound and outbound are optimised, measured, and continuously improved',s:5}] },
        'Partner-Channel Sales': { text: 'How effective are your partners or channel ecosystem at generating qualified pipeline leads?', options: [{l:'Partners do not generate any meaningful pipeline for the business',s:1},{l:'Some partners occasionally source deals, but it\'s not a reliable or managed pipeline source',s:2},{l:'A few partners generate pipeline, but contribution is inconsistent and hard to predict',s:3},{l:'Partners consistently contribute qualified pipeline as a managed and measured part of the pipeline strategy',s:4},{l:'Partner ecosystem is a primary pipeline engine — with clear enablement, joint targets, and predictable contribution to revenue',s:5}] },
        'Hybrid': { text: 'How effective are your direct sales and partner/channel ecosystem at generating pipeline leads?', options: [{l:'Neither direct sales nor partner channels are generating pipeline effectively',s:1},{l:'One channel generates some pipeline but the other is underperforming significantly',s:2},{l:'Both direct and partner channels generate some pipeline, but contribution is uneven and uncoordinated',s:3},{l:'Both channels consistently contribute to pipeline with clear targets and regular coordination between them',s:4},{l:'Direct and partner pipeline engines are optimised and balanced — each has clear targets, both contribute predictably, and the mix is actively managed',s:5}] },
      }},
    ]
  },
  {
    id: 'p6', name: 'Revenue Economics', weight: 0.07,
    questions: [
      { id: 'p6_q1', text: 'How well do you track and understand your Customer Acquisition Cost (CAC)?', type: 'scored', options: [{l:'We don\'t track how much it costs to acquire a new customer',s:1},{l:'We have a rough idea of our acquisition cost but it\'s based on estimates, not actual data',s:2},{l:'We calculate our customer acquisition cost periodically, but don\'t break it down by channel or segment',s:3},{l:'Our customer acquisition cost is tracked regularly by channel and segment, and informs where we invest',s:4},{l:'Our acquisition cost is optimised — we know the cost and payback period for each channel and segment, and use it to guide spending decisions',s:5}] },
      { id: 'p6_q2', text: 'How well do you understand Customer Lifetime Value (LTV)?', type: 'scored', options: [{l:'We don\'t track or estimate how much revenue a customer generates over their lifetime with us',s:1},{l:'We have a rough sense of average deal value, but don\'t factor in retention, renewals, or expansion',s:2},{l:'We have a basic calculation of customer lifetime value, but it\'s not regularly updated or used in decisions',s:3},{l:'Customer lifetime value is modelled with retention and expansion data, and reviewed regularly',s:4},{l:'The ratio of customer lifetime value to acquisition cost is a key metric that drives investment, pricing, and growth decisions',s:5}] },
      { id: 'p6_q3', text: 'How clear are your unit economics for each product/service?', type: 'scored', options: [{l:'We don\'t track the profitability of individual products or services',s:1},{l:'We track revenue by product or service, but don\'t have a clear picture of the costs and margins for each',s:2},{l:'We have a basic understanding of margins by product or service, but it\'s not detailed or regularly reviewed',s:3},{l:'Margins are clearly understood by product or service, and inform pricing and investment decisions',s:4},{l:'Profitability is tracked and optimised by offering — we know exactly which products and services generate the best returns and price accordingly',s:5}] },
      { id: 'p6_q4', text: 'How predictable is your monthly/quarterly revenue?', type: 'scored', options: [{l:'Revenue is highly unpredictable — we can\'t reliably forecast what\'s coming in next month or quarter',s:1},{l:'Revenue is lumpy and inconsistent — some months are strong, others are very weak, with no clear pattern',s:2},{l:'Some revenue is recurring or predictable, but a significant portion depends on new deals closing on time',s:3},{l:'Revenue is mostly predictable — we have a solid recurring base and pipeline gives reasonable visibility into upcoming quarters',s:4},{l:'Revenue is highly predictable with a strong recurring base, reliable pipeline, and accurate short-term forecasting',s:5}] },
      { id: 'p6_q5', text: 'How well do you manage customer churn and retention?', type: 'scored', options: [{l:'We don\'t track customer churn or have any structured approach to retention',s:1},{l:'We\'re aware that churn is happening but don\'t measure it consistently or act on it proactively',s:2},{l:'Basic churn metrics are tracked (e.g., number of lost customers) but there\'s no structured retention strategy',s:3},{l:'Active retention programs are in place — we monitor churn signals, engage at-risk customers, and measure retention performance',s:4},{l:'Retention is a strategic priority — churn is low, we proactively expand existing accounts, and expansion revenue is a meaningful part of our growth',s:5}] },
    ]
  },
  {
    id: 'p7', name: 'Strategic Constraints', weight: 0.08,
    questions: [
      { id: 'p7_q1', text: 'How well are resources allocated to your highest-priority growth initiatives?', type: 'scored', options: [{l:'No clear growth priorities exist — resources are allocated reactively or spread across too many initiatives',s:1},{l:'Some growth priorities have been identified, but resources (people, budget, time) are spread too thin to make real progress',s:2},{l:'A few priorities are agreed, and some resources are allocated to them, but competing demands often pull focus away',s:3},{l:'Top growth priorities are clearly defined, with dedicated resources assigned and protected from distraction',s:4},{l:'Resource allocation is disciplined — priorities are ranked, resourced, reviewed regularly, and lower-priority work is actively deprioritised or stopped',s:5}] },
      { id: 'p7_q2', text: 'How ready is your technology stack to support growth?', type: 'scored', options: [{l:'Key tools are missing or outdated — the technology stack is a barrier to growth',s:1},{l:'Basic tools are in place but there are significant gaps, and systems don\'t talk to each other',s:2},{l:'The stack is adequate for current needs but has limitations that will become problems as the business grows',s:3},{l:'A modern, integrated stack supports current operations and can handle reasonable growth',s:4},{l:'Technology stack is scalable and integrated — it supports current needs, can handle significant growth, and enables automation and data-driven decisions',s:5}] },
      { id: 'p7_q3', text: 'How well-aligned are cross-functional teams on growth priorities?', type: 'scored', options: [{l:'Departments operate in silos with no shared growth priorities or coordination',s:1},{l:'Some cross-functional awareness exists, but teams mostly pursue their own goals independently',s:2},{l:'Growth priorities are shared at a high level, but teams don\'t plan or execute against them together',s:3},{l:'Regular cross-functional planning happens, with shared goals and accountability across key growth functions',s:4},{l:'Teams are fully aligned — growth priorities are jointly owned, progress is tracked together, and trade-offs are made collaboratively',s:5}] },
      { id: 'p7_q4', text: 'How well have you identified and addressed scalability bottlenecks?', type: 'scored', options: [{l:'We haven\'t identified what\'s preventing the business from scaling efficiently',s:1},{l:'We\'re aware of some bottlenecks but haven\'t taken structured action to address them',s:2},{l:'Key bottlenecks have been identified and some are being worked on, but progress is slow or inconsistent',s:3},{l:'The main scalability bottlenecks are clearly identified, with action plans and owners assigned to resolve them',s:4},{l:'Bottleneck identification is proactive and ongoing — we regularly assess what could slow growth and take action before constraints become critical',s:5}] },
      { id: 'p7_q5', text: 'How effectively do you manage strategic risks to your growth plan (e.g. market, execution, financial, reputation risks etc)?', type: 'scored', options: [{l:'We don\'t formally identify or manage risks to our growth plan',s:1},{l:'We react to risks as they arise, but don\'t anticipate or plan for them in advance',s:2},{l:'We\'re aware of the main risks to growth, but haven\'t documented them or created plans to manage them',s:3},{l:'Key risks are identified and documented, with clear plans for how to respond if they materialise',s:4},{l:'Risk management is proactive — we regularly assess threats to the growth plan, have contingency plans in place, and adjust strategy when the risk landscape changes',s:5}] },
      { id: 'p7_q6', text: 'What is the single biggest strategic constraint limiting your growth right now?', type: 'qualitative' },
    ]
  },
  {
    id: 'p8', name: 'Organisational Alignment & Capability', weight: 0.10,
    questions: [
      { id: 'p8_q1', text: 'How aligned is your leadership team on the company\'s top growth priorities?', type: 'scored', options: [{l:'Leadership has no shared view on what the growth priorities are',s:1},{l:'Leaders have different opinions on priorities — alignment is discussed but not resolved',s:2},{l:'General agreement exists on priorities, but interpretations differ across leaders',s:3},{l:'Leadership is aligned on priorities, with regular reviews to maintain that alignment',s:4},{l:'Full alignment — every leader can articulate the same priorities and they are reflected in decisions and resource allocation',s:5}] },
      { id: 'p8_q2', text: 'How aligned are leaders on the main operational or capability changes needed to support growth?', type: 'scored', options: [{l:'No shared view on what changes are needed',s:1},{l:'Leaders acknowledge change is needed but disagree on what specifically should change',s:2},{l:'Some agreement on key changes, but no clear plan for how to implement them',s:3},{l:'Leaders are aligned on the changes required and have agreed plans to execute them',s:4},{l:'Full alignment on changes needed, with clear ownership, timelines, and active progress tracking',s:5}] },
      { id: 'p8_q3', text: 'How effectively are sales, marketing, delivery, and operational teams working toward shared commercial goals?', type: 'scored', options: [{l:'Teams operate in silos with no shared commercial goals',s:1},{l:'Some awareness of shared goals exists, but teams mostly pursue their own objectives',s:2},{l:'Teams share high-level goals but don\'t coordinate on how to achieve them',s:3},{l:'Teams actively collaborate toward shared goals, with regular cross-functional coordination',s:4},{l:'Fully integrated — teams plan, execute, and report against shared commercial goals with mutual accountability',s:5}] },
      { id: 'p8_q4', text: 'How clearly are roles, responsibilities, and decision ownership defined across key growth functions?', type: 'scored', options: [{l:'Roles and decision ownership are unclear — nobody knows who owns what',s:1},{l:'Some roles are defined but there are frequent gaps, overlaps, or confusion about who decides',s:2},{l:'Most roles are clear, but decision ownership is ambiguous in some areas, causing delays',s:3},{l:'Roles, responsibilities, and decision rights are clearly defined and understood across growth functions',s:4},{l:'Ownership is crystal clear — every function has defined accountability, decision rights are documented, and handoffs between teams are seamless',s:5}] },
      { id: 'p8_q5', text: 'How effectively are growth initiatives translated into practical actions with clear owners and deadlines?', type: 'scored', options: [{l:'Growth strategy exists on paper but doesn\'t get translated into specific actions',s:1},{l:'Some initiatives are actioned, but most lack clear owners, deadlines, or follow-through',s:2},{l:'Key initiatives have owners and rough timelines, but execution is inconsistent and progress is hard to track',s:3},{l:'Growth initiatives are broken down into clear actions with named owners, deadlines, and regular progress reviews',s:4},{l:'Execution is disciplined — every initiative has a clear plan, owners report on progress weekly, and blockers are escalated and resolved quickly',s:5}] },
      { id: 'p8_q6', text: 'How consistently do managers drive accountability and follow-through on commitments?', type: 'scored', options: [{l:'There is no culture of accountability — commitments are made but rarely tracked or enforced',s:1},{l:'Some managers drive follow-through, but it\'s inconsistent and depends on the individual',s:2},{l:'Accountability exists in pockets, but follow-through weakens as commitments move from leadership to teams',s:3},{l:'Managers consistently track commitments and hold their teams accountable, with regular review cadences',s:4},{l:'Accountability is embedded in the culture — missed commitments are addressed immediately, and corrective action is taken',s:5}] },
      { id: 'p8_q7', text: 'How well does internal communication support execution rather than creating confusion or delay?', type: 'scored', options: [{l:'Internal communication is chaotic — information is siloed, inconsistent, or hard to find',s:1},{l:'Communication happens but often creates confusion — different teams get different messages',s:2},{l:'Communication is generally adequate, but important decisions or changes sometimes get lost between teams',s:3},{l:'Communication is structured and reliable — teams are well-informed and key decisions reach the right people quickly',s:4},{l:'Communication actively supports execution — clear channels, regular cadences, and a culture of transparency that accelerates decision-making',s:5}] },
      { id: 'p8_q8', text: 'How well do core operating processes support consistent execution across teams?', type: 'scored', options: [{l:'No consistent operating processes exist — each team works in its own way',s:1},{l:'Some processes exist but they\'re informal, undocumented, or inconsistently followed',s:2},{l:'Key processes are documented but adherence varies across teams and individuals',s:3},{l:'Core processes are well-documented, consistently followed, and support reliable cross-team execution',s:4},{l:'Processes are optimised — they\'re regularly reviewed, improved based on feedback, and enable the business to scale without losing execution quality',s:5}] },
      { id: 'p8_q9', text: 'How well does the company\'s current capability match what\'s needed for the next phase of growth?', type: 'scored', options: [{l:'We haven\'t assessed whether current capabilities are sufficient for future growth',s:1},{l:'There\'s a general sense that gaps exist, but they haven\'t been clearly identified',s:2},{l:'Some capability gaps are known, but there\'s no clear plan to address them',s:3},{l:'Key capability gaps are identified, and plans are in place to close them through hiring, training, or external support',s:4},{l:'Capability planning is proactive — gaps are identified before they constrain growth, and the company has a track record of closing them quickly',s:5}] },
      { id: 'p8_q10', text: 'How effectively are capability gaps recognised and addressed through hiring, training, or external support?', type: 'scored', options: [{l:'Capability gaps are not formally identified or addressed',s:1},{l:'Gaps are recognised informally but responses are slow, ad hoc, or underfunded',s:2},{l:'Some gaps are being addressed, but efforts are inconsistent or not well-prioritised',s:3},{l:'A structured approach exists to identify and close capability gaps, with clear ownership and timelines',s:4},{l:'Capability development is systematic — gaps are anticipated, addressed proactively, and progress is tracked against business needs',s:5}] },
      { id: 'p8_q11', text: 'How open is the organisation to change and adopting improved ways of working?', type: 'scored', options: [{l:'The organisation resists change — new approaches are met with pushback or inertia',s:1},{l:'Some willingness to change exists at leadership level, but it doesn\'t translate to the wider team',s:2},{l:'The organisation is generally open to change, but adoption of new approaches is slow and inconsistent',s:3},{l:'Change is accepted and supported — new approaches are adopted with reasonable speed when the case is clear',s:4},{l:'The organisation actively embraces change — there\'s a culture of continuous improvement and teams proactively seek better ways to work',s:5}] },
      { id: 'p8_q12', text: 'How ready are people across the business to adopt new systems, automation, or AI-enabled ways of working?', type: 'scored', options: [{l:'There is significant resistance or anxiety about adopting new technology or AI across the business',s:1},{l:'A few individuals are enthusiastic, but most of the organisation is hesitant or unprepared',s:2},{l:'There\'s general openness to new technology, but limited understanding of how it applies to their work',s:3},{l:'Most of the team is ready and willing to adopt new tools and ways of working, with some training needed',s:4},{l:'The organisation is ready — people understand the value of automation and AI, have baseline digital skills, and actively look for ways to apply new tools',s:5}] },
      { id: 'p8_q13', text: 'What is the biggest people issue currently slowing growth?', type: 'qualitative' },
    ]
  },
  {
    id: 'p9', name: 'Systems Readiness & AI Transformation', weight: 0.12,
    questions: [
      { id: 'p9_q1', text: 'How well do your core systems give leadership reliable visibility into performance, pipeline, and execution?', type: 'scored', options: [{l:'Core systems are missing or not used — leadership has little to no visibility',s:1},{l:'Systems exist but visibility is fragmented — getting a clear picture requires significant manual effort',s:2},{l:'Systems provide some visibility, but there are gaps and the data isn\'t always current or trusted',s:3},{l:'Core systems provide reliable, up-to-date visibility into performance and pipeline for leadership',s:4},{l:'Systems deliver real-time, trusted visibility that leadership actively uses for decision-making and course correction',s:5}] },
      { id: 'p9_q2', text: 'How well do your main business tools and systems work together to support efficiency and decision-making?', type: 'scored', options: [{l:'Key tools are disconnected — data doesn\'t flow between systems and manual workarounds are required',s:1},{l:'Some integration exists, but important data still needs to be moved manually between tools',s:2},{l:'Tools work together in most areas, but there are still integration gaps that create inefficiency',s:3},{l:'Main systems are well-integrated, data flows reliably between them, and they support efficient workflows',s:4},{l:'Systems are fully integrated — they work together seamlessly, reduce manual effort, and actively support fast decision-making',s:5}] },
      { id: 'p9_q3', text: 'How dependent are your important workflows on manual work, duplicate effort, or disconnected tools?', type: 'scored', options: [{l:'Most critical workflows are highly manual, with significant duplicate effort and disconnected tools',s:1},{l:'Some workflows have been partly improved, but manual work and workarounds are still common',s:2},{l:'Key workflows are supported by tools, but there are still manual steps and integration gaps',s:3},{l:'Most important workflows are well-supported by integrated tools, with minimal manual intervention',s:4},{l:'Workflows are streamlined and largely automated — the team spends time on high-value work, not manual data entry or workarounds',s:5}] },
      { id: 'p9_q4', text: 'How accessible, trusted, and usable is your key commercial and operational data across the business?', type: 'scored', options: [{l:'Key data is scattered, inconsistent, or inaccessible — decisions are based on gut feel',s:1},{l:'Some data exists but it\'s hard to find, often outdated, and not trusted by the people who need it',s:2},{l:'Key data is accessible but quality is inconsistent — people use it with caution and often verify manually',s:3},{l:'Key business data is accessible, reasonably trusted, and used regularly for reporting and decisions',s:4},{l:'Data is a reliable asset — it\'s accessible, clean, consistent, and trusted enough to drive strategy and automation',s:5}] },
      { id: 'p9_q5', text: 'How strong is your data quality to support reliable reporting, automation, and analysis?', type: 'scored', options: [{l:'Data quality is poor — reports are unreliable and automation is not feasible',s:1},{l:'Data quality is inconsistent — some areas are usable, but others require significant cleanup before use',s:2},{l:'Data quality is adequate for basic reporting, but not reliable enough for automation or advanced analysis',s:3},{l:'Data quality is strong enough to support reliable reporting and most automation use cases',s:4},{l:'Data quality is high — it supports reporting, automation, and advanced analysis with confidence',s:5}] },
      { id: 'p9_q6', text: 'How clearly does the business have a single source of truth for critical data, with consistent definitions and standards?', type: 'scored', options: [{l:'No agreed source of truth exists — different teams use different numbers for the same metrics',s:1},{l:'Some effort has been made, but definitions are inconsistent and there\'s no single source of truth',s:2},{l:'A source of truth exists for some metrics but not all — definitions are partially standardised',s:3},{l:'A clear source of truth exists for critical metrics, with agreed definitions used across the business',s:4},{l:'All key metrics have a single source of truth with standardised definitions, and data governance is actively maintained',s:5}] },
      { id: 'p9_q7', text: 'How well does the company understand what\'s needed to adopt AI responsibly in business growth processes?', type: 'scored', options: [{l:'No consideration has been given to what responsible AI adoption requires',s:1},{l:'There\'s some awareness that AI adoption needs preparation, but no concrete understanding of what\'s involved',s:2},{l:'The company has a basic understanding of AI requirements (data quality, governance, use case clarity) but hasn\'t acted',s:3},{l:'The company understands the requirements and has taken initial steps to prepare for responsible AI adoption',s:4},{l:'The company is well-prepared — governance, data readiness, and ethical considerations are all addressed',s:5}] },
      { id: 'p9_q8', text: 'How well does the company identify and manage risks linked to AI use cases?', type: 'scored', options: [{l:'No thought has been given to AI-related risks',s:1},{l:'There\'s some awareness of AI risks, but no structured approach to identifying or managing them',s:2},{l:'Basic risk awareness exists for AI, but it\'s not formalised or regularly reviewed',s:3},{l:'AI risks are identified and managed as part of the company\'s approach to new technology adoption',s:4},{l:'AI risk management is proactive — risks are assessed for each use case, mitigations are in place, and the approach is regularly updated',s:5}] },
      { id: 'p9_q9', text: 'How effectively has the company identified practical AI or automation use cases that could create business value?', type: 'scored', options: [{l:'No AI or automation use cases have been identified',s:1},{l:'There\'s general interest in AI, but no specific use cases have been identified or evaluated',s:2},{l:'Some potential use cases have been discussed, but they haven\'t been formally assessed for value or feasibility',s:3},{l:'Practical use cases have been identified and assessed based on relevance, value, and feasibility',s:4},{l:'A clear pipeline of AI and automation use cases exists, with the highest-value opportunities prioritised and resourced',s:5}] },
      { id: 'p9_q10', text: 'How well has the business prioritised which AI or automation use cases are worth pursuing based on value and feasibility?', type: 'scored', options: [{l:'No prioritisation has been done — AI interest is general and unfocused',s:1},{l:'Some use cases have been discussed but there\'s no framework for deciding which to pursue',s:2},{l:'Use cases are loosely ranked but without clear criteria for value, feasibility, or effort',s:3},{l:'Use cases are formally prioritised using clear criteria, and the top priorities have resources allocated',s:4},{l:'Prioritisation is rigorous — use cases are assessed against business impact, feasibility, and readiness, with a clear implementation roadmap',s:5}] },
      { id: 'p9_q11', text: 'How ready is your current data and technology infrastructure to support better automation, analytics, or AI-enabled workflows?', type: 'scored', options: [{l:'Current infrastructure cannot support automation or AI — foundational work is needed first',s:1},{l:'Basic infrastructure exists but significant upgrades would be needed before automation or AI could work',s:2},{l:'Infrastructure is adequate for basic automation and analytics, but has limitations for more advanced use cases',s:3},{l:'Infrastructure is solid and can support most automation, analytics, and AI use cases with minor adjustments',s:4},{l:'Infrastructure is ready — data pipelines, integration, and processing capacity can support advanced automation and AI workflows',s:5}] },
      { id: 'p9_q12', text: 'How much are your current systems holding back growth, efficiency, or transformation?', type: 'scored', options: [{l:'Current systems are a major blocker — they actively prevent the business from growing or operating efficiently',s:1},{l:'Systems create significant friction — workarounds are common and the business is outgrowing its tools',s:2},{l:'Systems are adequate but limiting — they support today\'s needs but won\'t scale without investment',s:3},{l:'Systems are not a major constraint — they support current operations and most growth plans',s:4},{l:'Systems are an enabler — they support growth, efficiency, and transformation with minimal constraints',s:5}] },
      { id: 'p9_q13', text: 'What is the biggest systems, data, or AI-readiness issue currently slowing the business down?', type: 'qualitative' },
    ]
  },
]

export const MATURITY_BANDS = [
  { min: 80, max: 100, label: 'Strong', color: 'band-strong' },
  { min: 60, max: 79, label: 'Developing', color: 'band-developing' },
  { min: 50, max: 59, label: 'Fragile', color: 'band-fragile' },
  { min: 0, max: 49, label: 'At Risk', color: 'band-risk' },
]

export const PILLAR_NAMES = {
  p1: 'Commercial Baseline', p2: 'ICP & Buyer Urgency',
  p3: 'Positioning & Competitive Clarity', p4: 'Sales System Repeatability',
  p5: 'Pipeline Generation', p6: 'Revenue Economics', p7: 'Strategic Constraints',
  p8: 'Organisational Alignment & Capability', p9: 'Systems Readiness & AI Transformation',
}

export const PILLAR_WEIGHTS = {
  p1: 0.12, p2: 0.11, p3: 0.15, p4: 0.15, p5: 0.10,
  p6: 0.07, p7: 0.08, p8: 0.10, p9: 0.12,
}

export const RAPS_LABELS = [
  { min: 75, max: 100, label: 'Strong' },
  { min: 55, max: 74, label: 'Moderate' },
  { min: 35, max: 54, label: 'Low-Moderate' },
  { min: 0, max: 34, label: 'Low' },
]

export const STYLING_RULES = {
  band_thresholds: {
    strong: '≥80',
    developing: '60–79',
    fragile: '50–59',
    at_risk: '<50',
  },
  question_score_row_classes: {
    5: 'q-row-strong',
    4: 'q-row-developing',
    3: 'q-row-fragile',
    2: 'q-row-at-risk',
    1: 'q-row-at-risk-lo',
  },
  pillar_fill_classes: {
    gte_80: 'fill-teal',
    gte_60: 'fill-sage',
    gte_40: 'fill-gold',
    lt_40: 'fill-coral',
  },
}

export const COLOR_PALETTE = {
  deepNavy: [38, 70, 83],
  softTeal: [42, 157, 143],
  warmSage: [138, 177, 125],
  mutedGold: [233, 196, 106],
  warmCoral: [231, 111, 81],
  slateGrey: [108, 117, 125],
  warmWhite: [250, 249, 246],
  lightPearl: [240, 239, 235],
  oceanBlue: [69, 123, 157],
  darkCard: [45, 52, 54],
}

export const CLUSTER_DEFINITIONS = {
  p1: [
    { name: 'Revenue Planning', questions: ['p1_q1', 'p1_q2', 'p1_q3'] },
    { name: 'Revenue Resilience', questions: ['p1_q4', 'p1_q5'] },
    { name: 'Growth Vision', questions: ['p1_q6', 'p1_q7'] },
  ],
  p2: [
    { name: 'ICP Definition', questions: ['p2_q1', 'p2_q2', 'p2_q4'] },
    { name: 'Buyer Urgency', questions: ['p2_q3', 'p2_q5'] },
    { name: 'ICP Maintenance', questions: ['p2_q6', 'p2_q7'] },
  ],
  p3: [
    { name: 'Value Proposition & Differentiation', questions: ['p3_q1', 'p3_q2', 'p3_q3', 'p3_q4'] },
    { name: 'Proof & Competitive Intelligence', questions: ['p3_q5', 'p3_q6', 'p3_q7'] },
    { name: 'Messaging & Thought Leadership', questions: ['p3_q8', 'p3_q9', 'p3_q10', 'p3_q11'] },
  ],
  p4: [
    { name: 'Sales Process & Pipeline Structure', questions: ['p4_q1', 'p4_q2', 'p4_q3'] },
    { name: 'CRM & Sales Enablement', questions: ['p4_q4', 'p4_q5', 'p4_q6', 'p4_q7'] },
    { name: 'Deal Execution & Coaching', questions: ['p4_q8', 'p4_q9', 'p4_q10', 'p4_q11'] },
  ],
  p5: [
    { name: 'Pipeline System & Alignment', questions: ['p5_q1', 'p5_q2'] },
    { name: 'Lead Prioritisation & Outreach', questions: ['p5_q3', 'p5_q4'] },
    { name: 'Pipeline Velocity & Channel Effectiveness', questions: ['p5_q5', 'p5_q6'] },
  ],
  p6: [
    { name: 'Acquisition Economics', questions: ['p6_q1', 'p6_q2'] },
    { name: 'Unit Economics & Predictability', questions: ['p6_q3', 'p6_q4'] },
    { name: 'Retention & Expansion', questions: ['p6_q5'] },
  ],
  p7: [
    { name: 'Resource Allocation & Technology', questions: ['p7_q1', 'p7_q2'] },
    { name: 'Cross-Functional Alignment', questions: ['p7_q3', 'p7_q4'] },
    { name: 'Risk Management', questions: ['p7_q5'] },
  ],
  p8: [
    { name: 'Leadership Alignment', questions: ['p8_q1', 'p8_q2', 'p8_q3'] },
    { name: 'Roles & Execution Discipline', questions: ['p8_q4', 'p8_q5', 'p8_q6'] },
    { name: 'Communication & Operating Processes', questions: ['p8_q7', 'p8_q8'] },
    { name: 'Capability & Change Readiness', questions: ['p8_q9', 'p8_q10', 'p8_q11', 'p8_q12'] },
  ],
  p9: [
    { name: 'Systems Visibility & Integration', questions: ['p9_q1', 'p9_q2', 'p9_q3'] },
    { name: 'Data Quality & Governance', questions: ['p9_q4', 'p9_q5', 'p9_q6'] },
    { name: 'AI Readiness & Use Cases', questions: ['p9_q7', 'p9_q8', 'p9_q9', 'p9_q10'] },
    { name: 'Infrastructure Readiness', questions: ['p9_q11', 'p9_q12'] },
  ],
}

export const CONSTRAINT_SCENARIO_MAP = {
  commercial_foundation: { winRateDelta: 0.05, pipelineMultiplier: 1.15 },
  market_targeting: { winRateDelta: 0.08, pipelineMultiplier: 1.10 },
  positioning_weakness: { winRateDelta: 0.10, pipelineMultiplier: 1.05 },
  sales_system: { winRateDelta: 0.07, pipelineMultiplier: 1.20 },
  pipeline_constraint: { winRateDelta: 0.03, pipelineMultiplier: 1.35 },
  revenue_economics: { winRateDelta: 0.05, pipelineMultiplier: 1.25 },
  strategic_constraint: { winRateDelta: 0.04, pipelineMultiplier: 1.15 },
  organizational_alignment: { winRateDelta: 0.06, pipelineMultiplier: 1.10 },
  systems_readiness: { winRateDelta: 0.05, pipelineMultiplier: 1.20 },
}

export const CAUSAL_LINKAGES = [
  { from: 'p2', to: 'p3', label: 'ICP clarity drives positioning specificity' },
  { from: 'p3', to: 'p5', label: 'Weak positioning erodes pipeline quality' },
  { from: 'p3', to: 'p4', label: 'Unclear value prop undermines sales conversations' },
  { from: 'p4', to: 'p6', label: 'Sales system gaps leak revenue' },
  { from: 'p5', to: 'p6', label: 'Pipeline weakness constrains revenue economics' },
  { from: 'p1', to: 'p5', label: 'Poor commercial baseline limits pipeline targeting' },
  { from: 'p7', to: 'p4', label: 'Strategic constraints limit sales execution' },
  { from: 'p8', to: 'all', label: 'Org misalignment affects all execution pillars' },
  { from: 'p9', to: 'p8', label: 'Systems gaps create org friction' },
  { from: 'p9', to: 'p6', label: 'Data gaps reduce revenue visibility' },
]

export const MOAT_RUBRIC = [
  { min: 1, max: 2, label: 'No Moat' },
  { min: 3, max: 4, label: 'Shallow Moat' },
  { min: 5, max: 6, label: 'Emerging Moat' },
  { min: 7, max: 8, label: 'Strong Moat' },
  { min: 9, max: 10, label: 'Deep Moat' },
]

export const DATA_SOURCE_LABELS = {
  executive_summary: 'SOURCE: AI Strategic Analysis',
  company_snapshot: 'SOURCE: Screener Responses',
  diagnostic_overview: 'SOURCE: Diagnostic Responses',
  primary_constraint: 'SOURCE: Diagnostic Responses + AI Analysis',
  pillar_deep_dive: 'SOURCE: Diagnostic Responses',
  cross_pillar: 'SOURCE: AI Strategic Analysis',
  competitive_positioning: 'SOURCE: Screener Data + AI Analysis',
  raps: 'SOURCE: RAPS Calculation Engine',
  market_opportunity: 'SOURCE: AI Market Research (Web Search)',
  org_systems: 'SOURCE: Diagnostic Responses',
  strategic_signals: 'SOURCE: Qualitative Responses + AI Analysis',
  advisory_workstream: 'SOURCE: AI Strategic Analysis',
  action_roadmap: 'SOURCE: AI Strategic Analysis',
  closing: 'SOURCE: AI Strategic Analysis',
  appendix: 'SOURCE: Diagnostic Responses',
}

export const BANNED_PHRASES = [
  'robust', 'leverage', 'journey', 'unlock potential', 'low-hanging fruit',
  'it should be noted', 'needless to say', 'it goes without saying',
  'at the end of the day', "in today's competitive landscape",
  'it is worth noting', 'as we can see', 'moving forward',
  'in conclusion', 'best-in-class', 'synergy', 'paradigm shift',
  'holistic approach', 'game-changer', 'deep dive', 'circle back',
]

export const CONSTRAINT_TYPE_MAP = {
  p1: { type: 'commercial_foundation', impact: 'revenue_predictability', metric: 'forecast accuracy improvement' },
  p2: { type: 'market_targeting', impact: 'conversion_rate', metric: 'qualified lead rate +10-15%' },
  p3: { type: 'positioning', impact: 'win_rate', metric: 'win rate improvement +5-10pp' },
  p4: { type: 'sales_system', impact: 'deal_velocity', metric: 'sales cycle reduction 15-25%' },
  p5: { type: 'pipeline', impact: 'coverage_gap', metric: 'pipeline coverage +20-40%' },
  p6: { type: 'revenue_economics', impact: 'unit_economics', metric: 'CAC:LTV ratio improvement' },
  p7: { type: 'strategic', impact: 'resource_allocation', metric: 'constraint removal acceleration' },
  p8: { type: 'organizational', impact: 'execution_speed', metric: 'initiative completion rate +25%' },
  p9: { type: 'systems', impact: 'operational_efficiency', metric: 'manual process reduction 30-50%' },
}

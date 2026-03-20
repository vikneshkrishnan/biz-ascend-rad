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
    id: 'p1', name: 'Commercial Baseline', weight: 0.18,
    questions: [
      { id: 'p1_q1', text: 'Do you have a written revenue growth plan?', type: 'scored', options: [{l:'No plan',s:1},{l:'Ideas only',s:2},{l:'Rough plan written',s:3},{l:'Clear written plan',s:4},{l:'Plan tracked and updated regularly',s:5}] },
      { id: 'p1_q2', text: 'How clear is your go-to-market plan (how you win customers)?', type: 'scored', options: [{l:'No clear plan',s:1},{l:'Some ideas but unclear',s:2},{l:'Basic plan exists',s:3},{l:'Clear plan most teams follow',s:4},{l:'Clear plan used consistently across teams',s:5}] },
      { id: 'p1_q3', text: 'Do you have clear revenue targets and KPIs?', type: 'scored', options: [{l:'No targets',s:1},{l:'Rough targets',s:2},{l:'Targets exist but vague',s:3},{l:'Clear targets and KPIs',s:4},{l:'Targets tied to detailed growth plan',s:5}] },
      { id: 'p1_q4', text: 'Are leadership, sales and marketing aligned on growth goals?', type: 'scored', options: [{l:'Not aligned',s:1},{l:'Occasionally discussed',s:2},{l:'Some alignment',s:3},{l:'Mostly aligned',s:4},{l:'Fully aligned with shared targets',s:5}] },
      { id: 'p1_q5', text: 'How often does leadership review overall revenue performance and pipeline health?', type: 'scored', options: [{l:'Rarely',s:1},{l:'A few times a year',s:2},{l:'Quarterly',s:3},{l:'Monthly',s:4},{l:'Weekly or continuous',s:5}] },
      { id: 'p1_q6', text: 'Are revenue responsibilities clearly assigned to specific people or teams?', type: 'scored', options: [{l:'No ownership',s:1},{l:'Informal ownership',s:2},{l:'Some roles defined',s:3},{l:'Clear ownership',s:4},{l:'Fully accountable owners with clear targets',s:5}] },
      { id: 'p1_q7', text: 'What percentage of revenue comes from your top 3 customers?', type: 'scored', options: [{l:'> 70%',s:1},{l:'50–70%',s:2},{l:'30–50%',s:3},{l:'15–30%',s:4},{l:'< 15%',s:5}] },
    ]
  },
  {
    id: 'p2', name: 'ICP & Buyer Urgency', weight: 0.15,
    questions: [
      { id: 'p2_q1', text: 'How clearly have you defined your ideal customer?', type: 'scored', options: [{l:'No clear target customer',s:1},{l:'Broad idea of target',s:2},{l:'Some defined customer segments',s:3},{l:'Clear ideal customer defined',s:4},{l:'Ideal customer clearly defined and validated with real data',s:5}] },
      { id: 'p2_q2', text: 'How well do you understand the main problems your customers want solved?', type: 'scored', options: [{l:'Not understood',s:1},{l:'Some guesswork',s:2},{l:'Basic understanding',s:3},{l:'Clear understanding',s:4},{l:'Deep understanding proven through customer conversations or research',s:5}] },
      { id: 'p2_q3', text: 'How urgent is the problem your product or service solves for customers?', type: 'scored', options: [{l:'Problem is not urgent',s:1},{l:'Sometimes a priority',s:2},{l:'Moderately important',s:3},{l:'Important for many customers',s:4},{l:'Critical problem customers must solve',s:5}] },
      { id: 'p2_q4', text: 'Have you defined the key decision makers involved in buying your solution?', type: 'scored', options: [{l:'Not defined',s:1},{l:'Rough idea only',s:2},{l:'Some roles identified',s:3},{l:'Clear decision roles identified',s:4},{l:'Full buying group clearly mapped',s:5}] },
      { id: 'p2_q5', text: 'How often do you review and update your ideal customer definition?', type: 'scored', options: [{l:'Never reviewed',s:1},{l:'Rarely reviewed',s:2},{l:'Reviewed occasionally',s:3},{l:'Reviewed once a year',s:4},{l:'Reviewed regularly and updated when needed',s:5}] },
      { id: 'p2_q6', text: 'How well does your messaging explain the problem your customer cares about?', type: 'scored', options: [{l:'Messaging unclear',s:1},{l:'Messaging partly relevant',s:2},{l:'Messaging somewhat relevant',s:3},{l:'Messaging clearly speaks to the problem',s:4},{l:'Messaging strongly connects with customer pain and urgency',s:5}] },
      { id: 'p2_q7', text: 'How easy is it to identify companies that match your ideal customer profile?', type: 'scored', options: [{l:'Very hard to identify',s:1},{l:'Hard to identify',s:2},{l:'Possible but inconsistent',s:3},{l:'Clear indicators exist',s:4},{l:'Very easy to identify target companies',s:5}] },
    ]
  },
  {
    id: 'p3', name: 'Positioning & Competitive Clarity', weight: 0.18,
    questions: [
      { id: 'p3_q1', text: 'How clearly does your company stand out from competitors?', type: 'scored', options: [{l:'No clear difference',s:1},{l:'Small differences but unclear',s:2},{l:'Some differences explained',s:3},{l:'Clear difference from competitors',s:4},{l:'Strong and obvious difference customers recognise',s:5}] },
      { id: 'p3_q2', text: 'How easily do prospects understand what makes your company different?', type: 'scored', options: [{l:'Very confusing',s:1},{l:'Somewhat confusing',s:2},{l:'Somewhat clear',s:3},{l:'Clear for most prospects',s:4},{l:'Immediately clear to prospects',s:5}] },
      { id: 'p3_q3', text: 'How consistently is your positioning used across sales and marketing?', type: 'scored', options: [{l:'Not used',s:1},{l:'Used occasionally',s:2},{l:'Used in some materials',s:3},{l:'Used in most sales and marketing',s:4},{l:'Used consistently across all channels',s:5}] },
      { id: 'p3_q4', text: 'How often do you review how competitors position themselves?', type: 'scored', options: [{l:'Never',s:1},{l:'Rarely',s:2},{l:'Occasionally',s:3},{l:'Regularly',s:4},{l:'Continuously monitored',s:5}] },
      { id: 'p3_q5', text: 'How strong is your value proposition compared to competitors?', type: 'scored', options: [{l:'Very weak',s:1},{l:'Some value but unclear',s:2},{l:'Competitive but similar to others',s:3},{l:'Clearly stronger in some areas',s:4},{l:'Clearly stronger and hard to copy',s:5}] },
      { id: 'p3_q6', text: 'How well does your positioning match what your ideal customers care about?', type: 'scored', options: [{l:'Poor match',s:1},{l:'Weak match',s:2},{l:'Some match',s:3},{l:'Strong match',s:4},{l:'Very strong match with clear buyer pain',s:5}] },
      { id: 'p3_q7', text: 'Are you clear about the difference between your value proposition and your differentiated advantage?', type: 'scored', options: [{l:'Not clear',s:1},{l:'Slightly clear',s:2},{l:'Some understanding',s:3},{l:'Clear difference understood',s:4},{l:'Very clear and used in messaging',s:5}] },
      { id: 'p3_q8', text: 'Where do and how do we define and assess the strategic moat?', type: 'scored', options: [{l:'No clear advantage',s:1},{l:'Minor differentiation',s:2},{l:'Some competitive advantage',s:3},{l:'Clear defensible advantage',s:4},{l:'Strong moat, difficult for competitors to replace',s:5}] },
      { id: 'p3_q9', text: 'What gives your company a sustainable advantage over competitors?', type: 'scored', options: [{l:'Very easy to switch',s:1},{l:'Low switching cost',s:2},{l:'Moderate switching friction',s:3},{l:'High switching cost',s:4},{l:'Extremely difficult to switch',s:5}] },
      { id: 'p3_q10', text: 'How difficult is it for customers to switch to a competitor?', type: 'scored', options: [{l:'Unknown of commodity',s:1},{l:'Some recognition',s:2},{l:'Known in niche',s:3},{l:'Strong category authority',s:4},{l:'Market / category leader',s:5}] },
      { id: 'p3_q11', text: 'Which category do you primarily compete in?', type: 'scored', options: [{l:'We cannot clearly define our category',s:1},{l:'Category is loosely defined internally',s:2},{l:'Category exists but we are not clearly positioned in it',s:3},{l:'Clear category and positioning',s:4},{l:'Clear category and positioning',s:5}] },
      { id: 'p3_q12', text: 'What is your differentiated value compared to your competitors?', type: 'qualitative' },
    ]
  },
  {
    id: 'p4', name: 'Sales System Repeatability', weight: 0.20,
    questions: [
      { id: 'p4_q1', text: 'Do you have a written sales process that your team follows?', type: 'scored', options: [{l:'No sales process',s:1},{l:'Rough steps known but not written',s:2},{l:'Basic process written',s:3},{l:'Clear written process used by team',s:4},{l:'Detailed sales playbook used across the team',s:5}] },
      { id: 'p4_q2', text: 'How consistently does the team follow the sales process?', type: 'scored', options: [{l:'Never followed',s:1},{l:'Rarely followed',s:2},{l:'Sometimes followed',s:3},{l:'Usually followed',s:4},{l:'Always followed',s:5}] },
      { id: 'p4_q3', text: 'How consistently is your CRM used to manage sales deals?', type: 'scored', options: [{l:'Not used',s:1},{l:'Used by a few people',s:2},{l:'Used by most of the team',s:3},{l:'Used regularly by the team',s:4},{l:'Fully used and kept up to date',s:5}] },
      { id: 'p4_q4', text: 'How clearly do you qualify leads before entering them into the pipeline?', type: 'scored', options: [{l:'No qualification',s:1},{l:'Basic checks only',s:2},{l:'Some qualification steps',s:3},{l:'Clear qualification criteria',s:4},{l:'Strict qualification used before deals enter pipeline',s:5}] },
      { id: 'p4_q5', text: 'How predictable is progression from stage to stage in the sales pipeline?', type: 'scored', options: [{l:'Very unpredictable',s:1},{l:'Often unpredictable',s:2},{l:'Somewhat predictable',s:3},{l:'Mostly predictable',s:4},{l:'Very predictable',s:5}] },
      { id: 'p4_q6', text: 'Do you have a written sales playbook covering scripts, messaging and deal stages?', type: 'scored', options: [{l:'None',s:1},{l:'Some notes exist',s:2},{l:'Basic playbook exists',s:3},{l:'Clear playbook used by team',s:4},{l:'Detailed playbook regularly updated',s:5}] },
      { id: 'p4_q7', text: 'How often does the organisation review wins and losses to improve the sales process?', type: 'scored', options: [{l:'Never',s:1},{l:'Rarely',s:2},{l:'Occasionally',s:3},{l:'Regularly',s:4},{l:'After most deals',s:5}] },
      { id: 'p4_q8', text: 'How consistently are sales KPIs tracked?', type: 'scored', options: [{l:'Not tracked',s:1},{l:'Tracked occasionally',s:2},{l:'Tracked monthly',s:3},{l:'Tracked regularly',s:4},{l:'Tracked continuously',s:5}] },
      { id: 'p4_q9', text: 'Do sales teams receive structured sales training?', type: 'scored', options: [{l:'No training',s:1},{l:'Occasional ad-hoc training',s:2},{l:'Basic periodic training',s:3},{l:'Regular structured training',s:4},{l:'Ongoing training and coaching',s:5}] },
      { id: 'p4_q10', text: 'Conditional question', type: 'conditional', variants: {
        'Direct Sales': { text: 'How consistently are deals qualified before committing sales effort?', options: [{l:'Which best describes your sales motion?',s:1},{l:'Mostly custom sales process',s:2},{l:'Some repeatable steps exist',s:3},{l:'Some repeatable steps exist',s:4},{l:'Highly repeatable and documented sales motion',s:5}] },
        'Partner-Channel Sales': { text: 'How structured and predictable is your partner/channel sales process?', options: [{l:'Which best describes your sales motion?',s:1},{l:'Mostly custom sales process',s:2},{l:'Some repeatable steps exist',s:3},{l:'Some repeatable steps exist',s:4},{l:'Highly repeatable and documented sales motion',s:5}] },
        'Hybrid': { text: 'How clearly are responsibilities defined between direct sales and partner/channel teams when closing deals?', options: [{l:'Which best describes your sales motion?',s:1},{l:'Mostly custom sales process',s:2},{l:'Some repeatable steps exist',s:3},{l:'Some repeatable steps exist',s:4},{l:'Highly repeatable and documented sales motion',s:5}] },
      }},
      { id: 'p4_q11', text: 'How consistently are deals qualified before committing sales effort?', type: 'scored', options: [{l:'No qualification framework',s:1},{l:'Informal judgement',s:2},{l:'Basic qualification checklist',s:3},{l:'Formal qualification framework',s:4},{l:'Strict qualification discipline',s:5}] },
    ]
  },
  {
    id: 'p5', name: 'Pipeline Generation', weight: 0.10,
    questions: [
      { id: 'p5_q1', text: 'How consistently does your company generate new pipeline each month?', type: 'scored', options: [{l:'No consistent pipeline',s:1},{l:'Pipeline varies widely',s:2},{l:'Some consistency',s:3},{l:'Mostly consistent',s:4},{l:'Highly consistent and reliable',s:5}] },
      { id: 'p5_q2', text: 'How many different lead sources generate pipeline?', type: 'scored', options: [{l:'One main source',s:1},{l:'Two sources',s:2},{l:'Three sources',s:3},{l:'Four sources',s:4},{l:'Five or more sources',s:5}] },
      { id: 'p5_q3', text: 'How well do sales and marketing work together to generate pipeline?', type: 'scored', options: [{l:'No coordination',s:1},{l:'Occasional coordination',s:2},{l:'Some coordination',s:3},{l:'Regular coordination',s:4},{l:'Fully coordinated with shared pipeline targets',s:5}] },
      { id: 'p5_q4', text: 'How large is your pipeline compared to your revenue target?', type: 'scored', options: [{l:'Less than 1× target',s:1},{l:'1–2× target',s:2},{l:'2–3× target',s:3},{l:'3–4× target',s:4},{l:'More than 4× target',s:5}] },
      { id: 'p5_q5', text: 'How often does the company test new ways to generate leads?', type: 'scored', options: [{l:'Never',s:1},{l:'Rarely',s:2},{l:'Occasionally',s:3},{l:'Regularly',s:4},{l:'Continuously testing new channels',s:5}] },
      { id: 'p5_q6', text: 'Conditional question', type: 'conditional', variants: {
        'Direct Sales': { text: 'How effective are your inbound and outbound activities at generating new pipeline?', options: [{l:'No consistent pipeline',s:1},{l:'Occasional pipeline',s:2},{l:'Some consistency',s:3},{l:'Strong & reliable',s:4},{l:'Highly consistent & scalable',s:5}] },
        'Partner-Channel Sales': { text: 'How effective are your partners or channel ecosystem at generating qualified pipeline?', options: [{l:'No consistent pipeline',s:1},{l:'Occasional pipeline',s:2},{l:'Some consistency',s:3},{l:'Strong & reliable',s:4},{l:'Highly consistent & scalable',s:5}] },
        'Hybrid': { text: 'How effective are your direct sales and partner/channel ecosystem at generating pipeline?', options: [{l:'No consistent pipeline',s:1},{l:'Occasional pipeline',s:2},{l:'Some consistency',s:3},{l:'Strong & reliable',s:4},{l:'Highly consistent & scalable',s:5}] },
      }},
    ]
  },
  {
    id: 'p6', name: 'Revenue Economics', weight: 0.09,
    questions: [
      { id: 'p6_q1', text: 'Do you measure Customer Acquisition Cost (CAC)?', type: 'scored', options: [{l:'Not measured',s:1},{l:'Rough estimate only',s:2},{l:'Calculated occasionally',s:3},{l:'Measured regularly',s:4},{l:'Measured and used to guide spending',s:5}] },
      { id: 'p6_q2', text: 'Do you track how long it takes to close a sale (sales cycle length)?', type: 'scored', options: [{l:'Not tracked',s:1},{l:'Rough idea only',s:2},{l:'Tracked occasionally',s:3},{l:'Tracked regularly',s:4},{l:'Tracked and used to improve sales performance',s:5}] },
      { id: 'p6_q3', text: 'Do you measure Customer Lifetime Value (LTV)?', type: 'scored', options: [{l:'Not measured',s:1},{l:'Rough estimate only',s:2},{l:'Calculated occasionally',s:3},{l:'Measured regularly',s:4},{l:'Measured and used to guide strategy',s:5}] },
      { id: 'p6_q4', text: 'How clearly do you understand the return on your marketing spending?', type: 'scored', options: [{l:'No visibility',s:1},{l:'Some guesswork',s:2},{l:'Basic tracking',s:3},{l:'Clear tracking of results',s:4},{l:'Results tracked and used to improve campaigns',s:5}] },
      { id: 'p6_q5', text: 'Do you track the conversion rate from lead to closed deal?', type: 'scored', options: [{l:'Not tracked',s:1},{l:'Rough idea only',s:2},{l:'Tracked occasionally',s:3},{l:'Tracked regularly',s:4},{l:'Tracked and used to improve pipeline',s:5}] },
    ]
  },
  {
    id: 'p7', name: 'Strategic Constraints', weight: 0.10,
    questions: [
      { id: 'p7_q1', text: 'How clearly does the company identify what is blocking growth?', type: 'scored', options: [{l:'No clear growth blockers identified',s:1},{l:'Blockers occasionally discussed',s:2},{l:'Some blockers identified',s:3},{l:'Key blockers clearly identified',s:4},{l:'Blockers clearly identified and tracked',s:5}] },
      { id: 'p7_q2', text: 'How aligned is leadership on the main growth constraint the company must fix?', type: 'scored', options: [{l:'No alignment',s:1},{l:'Different views across leaders',s:2},{l:'Some agreement',s:3},{l:'Most leaders agree',s:4},{l:'Full leadership agreement',s:5}] },
      { id: 'p7_q3', text: 'How clearly are people and budgets assigned to fix growth constraints?', type: 'scored', options: [{l:'No resources assigned',s:1},{l:'Limited resources assigned',s:2},{l:'Some resources assigned',s:3},{l:'Clear resources assigned',s:4},{l:'Dedicated team and budget assigned',s:5}] },
      { id: 'p7_q4', text: 'How consistently does leadership track progress in removing growth constraints?', type: 'scored', options: [{l:'Never tracked',s:1},{l:'Rarely tracked',s:2},{l:'Tracked occasionally',s:3},{l:'Tracked regularly',s:4},{l:'Tracked continuously',s:5}] },
      { id: 'p7_q5', text: 'How structured is your market expansion strategy?', type: 'scored', options: [{l:'No expansion strategy',s:1},{l:'Opportunistic expansion',s:2},{l:'Some market analysis done',s:3},{l:'Clear expansion roadmap',s:4},{l:'Data-driven market expansion model',s:5}] },
      { id: 'p7_q6', text: 'What do you believe is the biggest factor currently limiting growth?', type: 'qualitative' },
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
  { min: 80, max: 100, label: 'Growth Engine Strong', color: 'band-strong' },
  { min: 65, max: 79, label: 'Growth System Constrained', color: 'band-constrained' },
  { min: 50, max: 64, label: 'Growth System Underpowered', color: 'band-underpowered' },
  { min: 0, max: 49, label: 'Growth System At Risk', color: 'band-risk' },
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

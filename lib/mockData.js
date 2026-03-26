// Mock data for demo mode - allows full UI preview without Supabase

// ===== ORGANIZATIONS (Multi-tenant) =====
export const DEMO_ORGANIZATIONS = [
  {
    id: 'org-001',
    name: 'Biz Ascend Consulting',
    slug: 'biz-ascend',
    logo_url: null,
    plan: 'enterprise',
    max_users: 50,
    max_projects: 500,
    features: ['ai_reports', 'pdf_export', 'email_reports', 'public_questionnaire', 'reassessments', 'multi_user'],
    created_at: '2025-01-01T10:00:00Z',
    settings: {
      branding: { primary_color: '#000000', logo_url: null },
      email: { sender_name: 'Biz Ascend RAD', reply_to: 'support@bizascend.com' }
    }
  },
  {
    id: 'org-002',
    name: 'Growth Partners Inc',
    slug: 'growth-partners',
    logo_url: null,
    plan: 'professional',
    max_users: 10,
    max_projects: 100,
    features: ['ai_reports', 'pdf_export', 'email_reports', 'public_questionnaire'],
    created_at: '2025-02-15T10:00:00Z',
    settings: {
      branding: { primary_color: '#3b82f6', logo_url: null },
      email: { sender_name: 'Growth Partners', reply_to: 'hello@growthpartners.com' }
    }
  },
  {
    id: 'org-003',
    name: 'Revenue Experts',
    slug: 'revenue-experts',
    logo_url: null,
    plan: 'starter',
    max_users: 3,
    max_projects: 20,
    features: ['ai_reports', 'pdf_export'],
    created_at: '2025-03-20T10:00:00Z',
    settings: {
      branding: { primary_color: '#10b981', logo_url: null },
      email: { sender_name: 'Revenue Experts', reply_to: 'team@revenueexperts.io' }
    }
  }
]

export const DEMO_PROFILE = {
  id: 'demo-admin-001',
  auth_id: 'demo-auth-001',
  email: 'admin@bizascend.com',
  name: 'Sarah Mitchell',
  role: 'admin',
  is_active: true,
  organization_id: 'org-001',
  organization: DEMO_ORGANIZATIONS[0],
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-06-01T10:00:00Z',
}

export const DEMO_USERS = [
  { id: 'demo-admin-001', auth_id: 'demo-auth-001', email: 'admin@bizascend.com', name: 'Sarah Mitchell', role: 'admin', is_active: true, organization_id: 'org-001', created_at: '2025-01-15T10:00:00Z' },
  { id: 'demo-user-002', auth_id: 'demo-auth-002', email: 'james@bizascend.com', name: 'James Carter', role: 'consultant', is_active: true, organization_id: 'org-001', created_at: '2025-02-20T10:00:00Z' },
  { id: 'demo-user-003', auth_id: 'demo-auth-003', email: 'maya@bizascend.com', name: 'Maya Patel', role: 'consultant', is_active: true, organization_id: 'org-001', created_at: '2025-03-10T10:00:00Z' },
  { id: 'demo-user-004', auth_id: 'demo-auth-004', email: 'alex@bizascend.com', name: 'Alex Thompson', role: 'consultant', is_active: false, organization_id: 'org-001', created_at: '2025-01-28T10:00:00Z' },
  { id: 'demo-user-005', auth_id: 'demo-auth-005', email: 'priya@bizascend.com', name: 'Priya Sharma', role: 'consultant', is_active: true, organization_id: 'org-001', created_at: '2025-04-05T10:00:00Z' },
]

const mkAssessment = (pid, num, sStatus, dStatus, scores = null) => ({
  id: `assess-${pid}-${num}`,
  project_id: pid,
  assessment_number: num,
  screener_status: sStatus,
  diagnostic_status: dStatus,
  screener_responses: sStatus !== 'not_started' ? {
    q1: 'John Smith', q2: 'CEO/Founder', q3: 'john@acmecorp.com', q4: 'Acme Corporation',
    q5: 'SaaS / Software Platforms', q6: 'United States, United Kingdom, Germany',
    q7: '$20\u201350M', q8: '11\u201320', q9: '$500k\u20131M', q10: 'Direct Sales',
    q11: ['Cold outreach', 'Content/inbound marketing', 'Events/trade shows'],
    q12: 'We provide AI-powered revenue analytics that help B2B companies predict and accelerate growth.',
    q13: 'Gong, Clari, InsightSquared',
    q14: '$25k\u2013$100k', q15: '3\u20136 months', q16: '2\u20133\u00d7', q17: '20\u201330%',
    q18: '15000000', q19: '8500000', q20: '12',
  } : {},
  diagnostic_responses: dStatus !== 'not_started' ? {
    p1_q1: 4, p1_q2: 3, p1_q3: 4, p1_q4: 3, p1_q5: 3, p1_q6: 4, p1_q7: 3,
    p2_q1: 4, p2_q2: 3, p2_q3: 4, p2_q4: 3, p2_q5: 2, p2_q6: 3, p2_q7: 4,
    p3_q1: 3, p3_q2: 3, p3_q3: 2, p3_q4: 3, p3_q5: 2, p3_q6: 2, p3_q7: 3, p3_q8: 3, p3_q9: 2, p3_q10: 2, p3_q11: 2, p3_q12: 'Our main challenge is differentiation in a crowded market with well-funded competitors.', p3_q13: 'Our platform reduces implementation time by 60% compared to competitors, enabling customers to go live in days rather than months.',
    p4_q1: 4, p4_q2: 3, p4_q3: 3, p4_q4: 4, p4_q5: 3, p4_q6: 2, p4_q7: 3, p4_q8: 3, p4_q9: 4, p4_q10: 3, p4_q11: 3,
    p5_q1: 3, p5_q2: 3, p5_q3: 2, p5_q4: 3, p5_q5: 2, p5_q6: 3,
    p6_q1: 3, p6_q2: 2, p6_q3: 3, p6_q4: 3, p6_q5: 3,
    p7_q1: 3, p7_q2: 4, p7_q3: 3, p7_q4: 2, p7_q5: 3, p7_q6: 'Our biggest constraint is limited sales headcount relative to market opportunity.',
    p8_q1: 3, p8_q2: 3, p8_q3: 3, p8_q4: 2, p8_q5: 3, p8_q6: 2, p8_q7: 3, p8_q8: 3, p8_q9: 2, p8_q10: 3, p8_q11: 3, p8_q12: 2, p8_q13: 'Follow-through becomes inconsistent once initiatives move beyond planning, especially across sales, marketing, and delivery teams.',
    p9_q1: 3, p9_q2: 3, p9_q3: 2, p9_q4: 3, p9_q5: 2, p9_q6: 2, p9_q7: 3, p9_q8: 2, p9_q9: 3, p9_q10: 2, p9_q11: 2, p9_q12: 3, p9_q13: 'Data is spread across several tools and teams, which makes reporting slower, reduces trust in the numbers, and limits automation.',
  } : {},
  scores,
  report_data: null,
  created_at: '2025-04-01T10:00:00Z',
  completed_at: scores ? '2025-04-15T10:00:00Z' : null,
})

const SCORES_ACME = {
  radScore: 56.5,
  maturityBand: 'Fragile',
  primaryConstraint: { id: 'p3', score: 48.0, name: 'Positioning & Competitive Clarity' },
  pillarScores: {
    p1: { score: 68.6, avg: 3.43, count: 7 },
    p2: { score: 65.7, avg: 3.29, count: 7 },
    p3: { score: 48.0, avg: 2.40, count: 11 },
    p4: { score: 62.2, avg: 3.11, count: 11 },
    p5: { score: 53.3, avg: 2.67, count: 6 },
    p6: { score: 56.0, avg: 2.80, count: 5 },
    p7: { score: 60.0, avg: 3.00, count: 5 },
    p8: { score: 53.3, avg: 2.67, count: 12 },
    p9: { score: 50.0, avg: 2.50, count: 12 },
  },
  raps: {
    score: 30,
    label: 'Low',
    revenueTarget: 15000000,
    revenueInvoiced: 8500000,
    revenueRemaining: 6500000,
    monthsRemaining: 6,
    requiredMonthlyRevenue: 1083333,
    openPipeline: 3125000,
    winRate: 0.25,
    salesCycle: 4.5,
    timeFactor: 0.7,
    expectedConvertible: 546875,
    coverageRatio: 0.08,
    coverageRating: 'Very Weak',
    baseProbability: 20,
    radScore: 59.3,
    radModifierValue: 0,
  },
}

const SCORES_NOVA = {
  radScore: 76.1,
  maturityBand: 'Developing',
  primaryConstraint: { id: 'p5', score: 66.7, name: 'Pipeline Generation' },
  pillarScores: {
    p1: { score: 82.9, avg: 4.14, count: 7 },
    p2: { score: 80.0, avg: 4.00, count: 7 },
    p3: { score: 76.4, avg: 3.82, count: 11 },
    p4: { score: 80.0, avg: 4.00, count: 11 },
    p5: { score: 66.7, avg: 3.33, count: 6 },
    p6: { score: 76.0, avg: 3.80, count: 5 },
    p7: { score: 80.0, avg: 4.00, count: 5 },
    p8: { score: 73.3, avg: 3.67, count: 12 },
    p9: { score: 66.7, avg: 3.33, count: 12 },
  },
  raps: { score: 80, label: 'High', revenueTarget: 8000000, revenueInvoiced: 5200000, revenueRemaining: 2800000, monthsRemaining: 4, requiredMonthlyRevenue: 700000, openPipeline: 5600000, winRate: 0.35, salesCycle: 2, timeFactor: 1.0, expectedConvertible: 1960000, coverageRatio: 0.7, coverageRating: 'Weak', baseProbability: 40, radScore: 76.1, radModifierValue: 5 },
}

export const DEMO_PROJECTS = [
  {
    id: 'proj-001', company_name: 'Acme Corporation', industry: 'SaaS / Software Platforms', status: 'completed',
    consultant_id: 'demo-user-002', consultant: { id: 'demo-user-002', name: 'James Carter', email: 'james@bizascend.com' },
    created_at: '2025-04-01T10:00:00Z', updated_at: '2025-04-15T10:00:00Z',
    latest_assessment: mkAssessment('proj-001', 3, 'completed', 'completed', SCORES_ACME),
    assessments: [
      mkAssessment('proj-001', 1, 'completed', 'completed', { ...SCORES_ACME, radScore: 42.1, maturityBand: 'Fragile', raps: { ...SCORES_ACME.raps, score: 18 } }),
      mkAssessment('proj-001', 2, 'completed', 'completed', { ...SCORES_ACME, radScore: 51.8, maturityBand: 'Fragile', raps: { ...SCORES_ACME.raps, score: 28 } }),
      mkAssessment('proj-001', 3, 'completed', 'completed', SCORES_ACME),
    ],
    questionnaire_link: { id: 'link-001', token: 'demo-token-abc', status: 'completed', url: '#/assess/demo-token-abc', created_at: '2025-04-02T10:00:00Z' },
  },
  {
    id: 'proj-002', company_name: 'Nova Health Systems', industry: 'Healthcare Technology', status: 'completed',
    consultant_id: 'demo-user-003', consultant: { id: 'demo-user-003', name: 'Maya Patel', email: 'maya@bizascend.com' },
    created_at: '2025-03-15T10:00:00Z', updated_at: '2025-05-20T10:00:00Z',
    latest_assessment: mkAssessment('proj-002', 3, 'completed', 'completed', SCORES_NOVA),
    assessments: [
      mkAssessment('proj-002', 1, 'completed', 'completed', { ...SCORES_NOVA, radScore: 62.4, maturityBand: 'Developing', raps: { ...SCORES_NOVA.raps, score: 41 } }),
      mkAssessment('proj-002', 2, 'completed', 'completed', { ...SCORES_NOVA, radScore: 71.2, maturityBand: 'Developing', raps: { ...SCORES_NOVA.raps, score: 52 } }),
      mkAssessment('proj-002', 3, 'completed', 'completed', SCORES_NOVA),
    ],
    questionnaire_link: null,
  },
  {
    id: 'proj-003', company_name: 'Quantum Dynamics', industry: 'Artificial Intelligence', status: 'in_progress',
    consultant_id: 'demo-user-002', consultant: { id: 'demo-user-002', name: 'James Carter', email: 'james@bizascend.com' },
    created_at: '2025-05-10T10:00:00Z', updated_at: '2025-06-01T10:00:00Z',
    latest_assessment: mkAssessment('proj-003', 1, 'completed', 'in_progress'),
    assessments: [mkAssessment('proj-003', 1, 'completed', 'in_progress')],
    questionnaire_link: { id: 'link-003', token: 'demo-token-qd', status: 'active', url: '#/assess/demo-token-qd', created_at: '2025-05-12T10:00:00Z' },
  },
  {
    id: 'proj-004', company_name: 'SteelBridge Manufacturing', industry: 'Manufacturing', status: 'in_progress',
    consultant_id: 'demo-user-005', consultant: { id: 'demo-user-005', name: 'Priya Sharma', email: 'priya@bizascend.com' },
    created_at: '2025-05-25T10:00:00Z', updated_at: '2025-06-05T10:00:00Z',
    latest_assessment: mkAssessment('proj-004', 1, 'in_progress', 'not_started'),
    assessments: [mkAssessment('proj-004', 1, 'in_progress', 'not_started')],
    questionnaire_link: null,
  },
  {
    id: 'proj-005', company_name: 'GreenWave Energy', industry: 'Energy / Utilities', status: 'draft',
    consultant_id: 'demo-user-003', consultant: { id: 'demo-user-003', name: 'Maya Patel', email: 'maya@bizascend.com' },
    created_at: '2025-06-01T10:00:00Z', updated_at: '2025-06-01T10:00:00Z',
    latest_assessment: mkAssessment('proj-005', 1, 'not_started', 'not_started'),
    assessments: [mkAssessment('proj-005', 1, 'not_started', 'not_started')],
    questionnaire_link: null,
  },
  {
    id: 'proj-006', company_name: 'CyberShield Security', industry: 'Cybersecurity', status: 'completed',
    consultant_id: 'demo-user-002', consultant: { id: 'demo-user-002', name: 'James Carter', email: 'james@bizascend.com' },
    created_at: '2025-02-01T10:00:00Z', updated_at: '2025-03-15T10:00:00Z',
    latest_assessment: mkAssessment('proj-006', 1, 'completed', 'completed', { ...SCORES_ACME, radScore: 81.2, maturityBand: 'Strong', primaryConstraint: { id: 'p6', score: 72.0, name: 'Revconomics' }, pillarScores: { p1: {score:88,avg:4.4,count:7}, p2: {score:85,avg:4.25,count:7}, p3: {score:80,avg:4.0,count:11}, p4: {score:84,avg:4.2,count:11}, p5: {score:78,avg:3.9,count:6}, p6: {score:72,avg:3.6,count:5}, p7: {score:82,avg:4.1,count:5}, p8: {score:80,avg:4.0,count:12}, p9: {score:76,avg:3.8,count:12} } }),
    assessments: [],
    questionnaire_link: null,
  },
  {
    id: 'proj-007', company_name: 'FintechFlow', industry: 'Fintech', status: 'archived',
    consultant_id: 'demo-user-005', consultant: { id: 'demo-user-005', name: 'Priya Sharma', email: 'priya@bizascend.com' },
    created_at: '2025-01-10T10:00:00Z', updated_at: '2025-02-28T10:00:00Z',
    latest_assessment: mkAssessment('proj-007', 1, 'completed', 'completed', { ...SCORES_ACME, radScore: 34.2, maturityBand: 'At Risk', primaryConstraint: { id: 'p1', score: 28.6, name: 'Commercial Baseline' } }),
    assessments: [],
    questionnaire_link: null,
  },
]

export const DEMO_STATS = {
  total_projects: 7,
  total_consultants: 4,
  active_diagnostics: 2,
  completed_diagnostics: 4,
  sectors: {
    'SaaS / Software Platforms': 1,
    'Healthcare Technology': 1,
    'Artificial Intelligence': 1,
    'Manufacturing': 1,
    'Energy / Utilities': 1,
    'Cybersecurity': 1,
    'Fintech': 1,
  },
}

export const DEMO_ACTIVITY = [
  { id: 'act-1', action: 'Created project: GreenWave Energy', created_at: '2025-06-01T10:00:00Z' },
  { id: 'act-2', action: 'Completed diagnostic for Nova Health Systems', created_at: '2025-05-20T10:00:00Z' },
  { id: 'act-3', action: 'Generated questionnaire link for Quantum Dynamics', created_at: '2025-05-12T10:00:00Z' },
  { id: 'act-4', action: 'Started screener for SteelBridge Manufacturing', created_at: '2025-05-25T10:00:00Z' },
  { id: 'act-5', action: 'Created consultant: Priya Sharma', created_at: '2025-04-05T10:00:00Z' },
]

// Demo API handler - returns mock data based on the path
export function demoApiFetch(path, opts = {}) {
  // DELETE /projects/:id
  if (opts.method === 'DELETE') {
    const delMatch = path.match(/^\/projects\/([^/]+)$/)
    if (delMatch) {
      const idx = DEMO_PROJECTS.findIndex(p => p.id === delMatch[1])
      if (idx !== -1) DEMO_PROJECTS.splice(idx, 1)
      return { success: true }
    }
  }

  // Auth
  if (path === '/auth/me') return DEMO_PROFILE
  // Stats
  if (path === '/admin/stats') return DEMO_STATS
  if (path.startsWith('/activity')) return { activities: DEMO_ACTIVITY }
  // Users
  if (path === '/users') return DEMO_USERS
  // Projects list
  if (path === '/projects') return DEMO_PROJECTS
  // Project detail
  const pdMatch = path.match(/^\/projects\/([^/]+)$/)
  if (pdMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === pdMatch[1])
    return p || { error: 'Not found' }
  }
  // Screener
  const scrMatch = path.match(/^\/projects\/([^/]+)\/screener$/)
  if (scrMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === scrMatch[1])
    const a = p?.latest_assessment
    return { responses: a?.screener_responses || {}, status: a?.screener_status || 'not_started', assessment_id: a?.id }
  }
  // Diagnostic
  const diagMatch = path.match(/^\/projects\/([^/]+)\/diagnostic$/)
  if (diagMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === diagMatch[1])
    const a = p?.latest_assessment
    return { responses: a?.diagnostic_responses || {}, status: a?.diagnostic_status || 'not_started', screener_responses: a?.screener_responses || {}, assessment_id: a?.id }
  }
  // Scores
  const scoresMatch = path.match(/^\/projects\/([^/]+)\/scores$/)
  if (scoresMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === scoresMatch[1])
    return p?.latest_assessment?.scores || { error: 'No scores' }
  }
  // Link
  const linkMatch = path.match(/^\/projects\/([^/]+)\/link$/)
  if (linkMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === linkMatch[1])
    return p?.questionnaire_link || { link: null }
  }
  // Assessments
  const assessMatch = path.match(/^\/projects\/([^/]+)\/assessments$/)
  if (assessMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === assessMatch[1])
    return p?.assessments || []
  }
  // Sectors
  if (path === '/admin/sectors') return DEMO_STATS.sectors

  // Report generation (demo mode returns mock report)
  const reportGenMatch = path.match(/^\/projects\/([^/]+)\/report\/generate$/)
  if (reportGenMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === reportGenMatch[1])
    if (!p?.latest_assessment?.scores) return { error: 'No scores available' }
    return DEMO_REPORT
  }

  // Get report
  const reportMatch = path.match(/^\/projects\/([^/]+)\/report$/)
  if (reportMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === reportMatch[1])
    if (!p?.latest_assessment?.scores) return { error: 'Report not generated yet' }
    return { ...DEMO_REPORT, scores: p.latest_assessment.scores, screener_responses: p.latest_assessment.screener_responses }
  }

  // PDF download (demo mode returns a mock base64 PDF placeholder)
  const pdfMatch = path.match(/^\/projects\/([^/]+)\/report\/pdf$/)
  if (pdfMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === pdfMatch[1])
    if (!p?.latest_assessment?.scores) return { error: 'Report not generated yet. Generate AI report first.' }
    // Return a minimal valid PDF (just header) as placeholder in demo mode
    // Real PDF generation happens via WeasyPrint in production
    return { 
      pdf: 'JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Pj4KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihEZW1vIFBERikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyMzQgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA1Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgozMjgKJSVFT0Y=',
      filename: `${p.company_name.replace(/\s+/g, '_')}_RAD_Report_Demo.pdf`
    }
  }

  // Organization endpoints
  if (path === '/organization') {
    return DEMO_ORGANIZATIONS[0]
  }
  
  if (path === '/organizations') {
    return DEMO_ORGANIZATIONS
  }

  // Organization settings update - handled via POST return
  if (path === '/organization/settings') {
    return { success: true, message: 'Settings updated' }
  }

  return { success: true }
}

// Demo report data
export const DEMO_REPORT = {
  executive_summary: `Acme Corporation demonstrates significant revenue growth potential with a RAD Score of 59.3/100, positioning them in the "Growth System Fragile" category. The company shows strength in Commercial Baseline (68.6) and ICP & Buyer Urgency (65.7), indicating a solid foundation for revenue operations.

However, the primary growth constraint lies in Positioning & Competitive Clarity (48.0), which directly impacts market differentiation and sales effectiveness. With a RAPS score of 37%, achieving the remaining $6.5M revenue target within 6 months will require immediate strategic intervention.

The path forward requires focusing on crystallizing market positioning, strengthening competitive differentiation, and accelerating pipeline generation to improve win rates and shorten sales cycles.`,
  pillar_narratives: {
    p1: "Commercial Baseline scores 68.6/100, reflecting a moderately mature revenue foundation. Sales staff of 11-20 personnel and established GTM channels provide adequate coverage, though optimization opportunities exist in sales process standardization.",
    p2: "ICP & Buyer Urgency at 65.7/100 indicates reasonable customer targeting clarity. Deal sizes of $25k-$100k and 3-6 month sales cycles are healthy for the SaaS segment, but buyer urgency signals could be strengthened.",
    p3: "Positioning & Competitive Clarity is the critical constraint at 48.0/100. The company struggles to differentiate against well-funded competitors like Gong, Clari, and InsightSquared, creating confusion in the market and lengthening sales cycles.",
    p4: "Sales System Repeatability scores 62.2/100, showing developing but inconsistent sales processes. The direct sales model is functional but lacks the documentation and training infrastructure needed for scale.",
    p5: "Pipeline Generation at 53.3/100 reveals significant gaps in lead generation capacity. With only 2-3x pipeline coverage, the company lacks sufficient cushion to weather normal deal slippage.",
    p6: "Revconomics scores 56.0/100, indicating concerns about unit economics sustainability. The 20-30% win rate combined with long sales cycles creates challenging CAC:LTV dynamics.",
    p7: "Strategic Constraints at 60.0/100 highlights resource limitations relative to market opportunity. Limited sales headcount constrains market penetration velocity.",
    p8: "Organisational Alignment & Capability scores 53.3/100, indicating the organisation is not yet fully disciplined enough to support faster, cleaner growth execution. Follow-through becomes inconsistent once initiatives move beyond planning, especially across sales, marketing, and delivery teams.",
    p9: "Systems Readiness & AI Transformation scores 50.0/100, revealing usable but fragmented systems. Data is spread across several tools and teams, which makes reporting slower, reduces trust in the numbers, and limits automation potential."
  },
  positioning_assessment: `Acme Corporation's positioning as "AI-powered revenue analytics that help B2B companies predict and accelerate growth" competes directly in a crowded market dominated by well-capitalized players.

The competitive landscape includes Gong (conversation intelligence), Clari (revenue operations), and InsightSquared (revenue analytics) — each with significant market presence and brand recognition. The current positioning fails to carve out a distinct territory.

To improve positioning potency, consider narrowing to a specific use case or buyer persona where the platform delivers uniquely superior outcomes. The strategic moat must be deepened through proprietary data, integrations, or methodology that cannot be easily replicated.`,
  strategic_moat_score: 5,
  strategic_moat_narrative: `The strategic moat assessment reveals moderate defensibility with a score of 5/10. While the AI-powered analytics capability provides some differentiation, it does not yet constitute a sustainable competitive advantage.

Strengthening the moat requires building proprietary benchmarking data across clients, developing unique revenue prediction algorithms, or establishing deep integrations that create switching costs. Without these investments, the competitive position remains vulnerable to well-resourced competitors.`,
  raps_narrative: `The Revenue Achievement Probability Score (RAPS) of 30/100 — Low indicates a concerning gap between targets and realistic outcomes. With $6.5M remaining to close in 6 months, a coverage ratio of just 0.08 (Very Weak), and expected convertible revenue of only $546,875, the mathematical probability of hitting target is very low.

The core challenge is inadequate pipeline volume combined with extended sales cycles. The 4.5-month average sales cycle relative to 6 months remaining yields a time-to-close factor of 0.7, further limiting conversion potential. The RAD modifier of 0 (neutral) provides no uplift to offset the weak commercial position.`,
  raps_why_factors: [
    'Coverage ratio of 0.08 is critically below the 0.6 threshold, placing the score in the Very Weak band',
    'Open pipeline of $3.1M is insufficient against $6.5M revenue remaining — expected convertible is only $547k',
    'Sales cycle of 4.5 months consumes most of the 6 months remaining, reducing time-to-close factor to 0.7',
    'Win rate of 25% is below the 30%+ threshold needed for strong conversion probability',
    'RAD score of 59.3 falls in the neutral modifier band (50-64), providing no score uplift'
  ],
  raps_must_improve: [
    'Increase open pipeline to at least $15M to achieve adequate coverage ratio above 0.6',
    'Improve win rate from 25% to 35%+ through better qualification and competitive positioning',
    'Compress average sales cycle from 4.5 months to under 3 months via deal acceleration tactics',
    'Address positioning weakness (P3 score: 48%) to strengthen competitive win rates',
    'Implement pipeline generation sprint to add $10M+ in qualified opportunities within 60 days'
  ],
  raps_improvement_scenario: {
    current: { score: 30, label: 'Low' },
    improved: { score: 55, label: 'Moderate', assumptions: 'Increasing open pipeline to $12M and improving win rate to 35% would lift expected convertible revenue to $2.94M, raising coverage ratio to 0.45 and base probability to 40. Combined with RAD improvements to 65+ (modifier +5), projected RAPS reaches 55/100 (Moderate).' }
  },
  action_plan: {
    phase1_title: "Critical Fixes (0-30 Days)",
    phase1_items: [
      "Conduct competitive positioning workshop to identify unique differentiation angle",
      "Implement win/loss analysis program for last 20 closed opportunities",
      "Launch emergency pipeline generation sprint with SDR blitz campaign",
      "Create battle cards for top 3 competitors (Gong, Clari, InsightSquared)",
      "Define and document ICP with specific buyer personas and urgency triggers"
    ],
    phase2_title: "Important Improvements (30-60 Days)",
    phase2_items: [
      "Redesign sales deck and collateral around new positioning",
      "Implement sales process standardization with stage exit criteria",
      "Deploy content marketing campaign targeting high-urgency scenarios",
      "Establish customer reference program with 5-7 referenceable accounts",
      "Launch partner channel exploration with 2-3 complementary vendors"
    ],
    phase3_title: "Consolidation & Growth (60-90 Days)",
    phase3_items: [
      "Roll out sales enablement training on new positioning and messaging",
      "Implement revenue forecasting discipline with weekly pipeline reviews",
      "Evaluate hiring plan for additional sales capacity",
      "Develop case studies demonstrating ROI for key use cases",
      "Begin building proprietary benchmarking database from customer data"
    ]
  },
  market_report: {
    countries: [
      {
        market_name: "United States",
        market_designation: "Primary Market",
        economic_data_table: [
          { metric: "GDP", value: "$27.4 trillion (2024)" },
          { metric: "GDP Growth Rate", value: "2.3% projected FY2025" },
          { metric: "Population", value: "335 million" },
          { metric: "Inflation Rate", value: "3.1%" },
          { metric: "Unemployment", value: "3.7%" },
          { metric: "Ease of Doing Business", value: "Rank #6 globally" },
        ],
        sector_data_table: [
          { metric: "B2B SaaS Market Size", value: "$195B (2024)" },
          { metric: "Revenue Intelligence Growth", value: "23% annually" },
          { metric: "Digital Adoption Rate", value: "78% enterprise" },
          { metric: "Competitive Density", value: "High — 50+ direct competitors" },
        ],
        economic_narrative: { bullets: ["GDP growth projected at 2.3% for FY2025 with resilient enterprise spending", "B2B SaaS spending continues upward trajectory despite macro headwinds", "Enterprise software budgets show resilience, driven by AI and automation priorities"] },
        political_environment: { bullets: ["Stable regulatory environment for SaaS with maturing data privacy frameworks", "Data privacy regulations (CCPA, state-level laws) manageable but evolving", "Government tech spending increasing, creating indirect demand signals"] },
        geopolitical_factors: { bullets: ["Domestic market preference strengthening amid reshoring trends", "Cloud sovereignty concerns driving local data residency requirements", "Supply chain reshoring benefiting US-based SaaS vendors"] },
        socio_economic_trends: { bullets: ["Remote work normalization driving enterprise software adoption", "Revenue operations emerging as C-suite strategic priority", "CFO influence on tech purchasing increasing, demanding ROI clarity"] },
        industry_growth_signals: { bullets: ["Revenue intelligence market growing 23% annually", "AI integration becoming table stakes for competitive positioning", "Consolidation expected among point solutions, favoring platform plays"] },
        growth_propensity: {
          position: "High",
          drivers: ["Strong enterprise digitization momentum", "Mature buyer awareness of revenue analytics value", "Accessible capital markets for growth investment"],
          risk: "Increasing competition from well-funded players and potential economic slowdown affecting software budgets. Talent acquisition challenges in key markets may constrain growth.",
          strategic_implications: "Prioritize US market penetration while establishing clear differentiation. Consider vertical specialization to reduce competitive overlap."
        },
      },
      {
        market_name: "United Kingdom",
        market_designation: "Secondary Market",
        economic_data_table: [
          { metric: "GDP", value: "$3.3 trillion (2024)" },
          { metric: "GDP Growth Rate", value: "1.1% projected" },
          { metric: "Population", value: "68 million" },
          { metric: "Inflation Rate", value: "4.0%" },
          { metric: "Unemployment", value: "4.2%" },
          { metric: "Ease of Doing Business", value: "Rank #8 globally" },
        ],
        sector_data_table: [
          { metric: "B2B SaaS Market Size", value: "$28B (2024)" },
          { metric: "Revenue Intelligence Adoption", value: "Accelerating" },
          { metric: "Digital Adoption Rate", value: "72% enterprise" },
          { metric: "Competitive Density", value: "Medium — fewer local alternatives" },
        ],
        economic_narrative: { bullets: ["Post-Brexit economic stabilization underway with improving business sentiment", "Financial services sector remains a strong buyer of analytics tools", "GBP weakness creating budget pressures but also making UK exports competitive"] },
        political_environment: { bullets: ["GDPR compliance requirements continue with UK GDPR alignment to EU standards", "Digital economy initiatives supportive of SaaS adoption", "Government backing for fintech and digital transformation programs"] },
        geopolitical_factors: { bullets: ["Transatlantic alignment remains strong, favouring US vendor adoption", "EU market access complexity for UK-based buyers post-Brexit", "Emerging trade deal opportunities creating new commercial corridors"] },
        socio_economic_trends: { bullets: ["London fintech hub driving innovation and analytics adoption", "Professional services vertical showing strong SaaS adoption patterns", "Cost efficiency pressures driving demand for revenue analytics tools"] },
        industry_growth_signals: { bullets: ["Revenue intelligence adoption accelerating across mid-market", "UK enterprises increasingly US-software friendly", "Integration with UK-specific data sources becoming important differentiator"] },
        growth_propensity: {
          position: "Medium-High",
          drivers: ["Sophisticated buyer base in financial services and professional services", "English language alignment reducing localization costs", "Similar business practices to US market"],
          risk: "Currency fluctuations impacting pricing and Brexit-related budget constraints. Competition from UK-based alternatives may intensify.",
          strategic_implications: "Develop UK-specific case studies and local partner relationships. Consider London office or dedicated UK sales resource once US base is stable."
        },
      },
      {
        market_name: "Germany",
        market_designation: "Exploratory Market",
        economic_data_table: [
          { metric: "GDP", value: "$4.5 trillion (2024)" },
          { metric: "GDP Growth Rate", value: "0.7% projected" },
          { metric: "Population", value: "84 million" },
          { metric: "Inflation Rate", value: "2.9%" },
          { metric: "Unemployment", value: "5.7%" },
          { metric: "Ease of Doing Business", value: "Rank #22 globally" },
        ],
        sector_data_table: [
          { metric: "B2B SaaS Market Size", value: "$18B (2024)" },
          { metric: "Revenue Analytics Awareness", value: "Growing" },
          { metric: "Digital Adoption Rate", value: "58% enterprise" },
          { metric: "Competitive Density", value: "Low — European vendor preference" },
        ],
        economic_narrative: { bullets: ["Manufacturing sector facing digital transformation needs amid Industry 4.0", "Mittelstand companies increasingly adopting SaaS solutions", "Economic uncertainty affecting large enterprise spending decisions"] },
        political_environment: { bullets: ["Strict data residency requirements under GDPR and national law", "German-specific compliance needs (GoBD) add complexity", "Strong worker protection laws affecting sales tool deployment"] },
        geopolitical_factors: { bullets: ["EU market gateway potential for broader European expansion", "US vendor scepticism in some enterprise segments", "Data sovereignty concerns prominent in procurement decisions"] },
        socio_economic_trends: { bullets: ["Digital transformation lagging Anglo markets but accelerating", "Relationship-based sales culture requiring local presence", "Longer evaluation and procurement cycles typical"] },
        industry_growth_signals: { bullets: ["Revenue analytics awareness growing across Mittelstand segment", "Strong preference for German-language interfaces and support", "Implementation partner ecosystem important for market entry"] },
        growth_propensity: {
          position: "Medium",
          drivers: ["Large addressable market with growing digital maturity", "Strong economy with enterprise willingness to invest in proven solutions", "EU gateway for broader continental expansion"],
          risk: "Language localization requirements and longer sales cycles increase cost of entry. Data residency compliance costs and cultural preference for European vendors present barriers.",
          strategic_implications: "Consider Germany as medium-term expansion opportunity. Would require German language capabilities and local implementation partners before entry."
        },
      }
    ]
  },
  generated_at: new Date().toISOString()
}

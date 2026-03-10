// Mock data for demo mode - allows full UI preview without Supabase
export const DEMO_PROFILE = {
  id: 'demo-admin-001',
  auth_id: 'demo-auth-001',
  email: 'admin@bizascend.com',
  name: 'Sarah Mitchell',
  role: 'admin',
  is_active: true,
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-06-01T10:00:00Z',
}

export const DEMO_USERS = [
  { id: 'demo-admin-001', auth_id: 'demo-auth-001', email: 'admin@bizascend.com', name: 'Sarah Mitchell', role: 'admin', is_active: true, created_at: '2025-01-15T10:00:00Z' },
  { id: 'demo-user-002', auth_id: 'demo-auth-002', email: 'james@bizascend.com', name: 'James Carter', role: 'consultant', is_active: true, created_at: '2025-02-20T10:00:00Z' },
  { id: 'demo-user-003', auth_id: 'demo-auth-003', email: 'maya@bizascend.com', name: 'Maya Patel', role: 'consultant', is_active: true, created_at: '2025-03-10T10:00:00Z' },
  { id: 'demo-user-004', auth_id: 'demo-auth-004', email: 'alex@bizascend.com', name: 'Alex Thompson', role: 'consultant', is_active: false, created_at: '2025-01-28T10:00:00Z' },
  { id: 'demo-user-005', auth_id: 'demo-auth-005', email: 'priya@bizascend.com', name: 'Priya Sharma', role: 'consultant', is_active: true, created_at: '2025-04-05T10:00:00Z' },
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
    p3_q1: 3, p3_q2: 3, p3_q3: 2, p3_q4: 3, p3_q5: 2, p3_q6: 2, p3_q7: 3, p3_q8: 3, p3_q9: 2, p3_q10: 2, p3_q11: 2, p3_q12: 'Our main challenge is differentiation in a crowded market with well-funded competitors.',
    p4_q1: 4, p4_q2: 3, p4_q3: 3, p4_q4: 4, p4_q5: 3, p4_q6: 2, p4_q7: 3, p4_q8: 3, p4_q9: 4, p4_q10: 3, p4_q11: 3,
    p5_q1: 3, p5_q2: 3, p5_q3: 2, p5_q4: 3, p5_q5: 2, p5_q6: 3,
    p6_q1: 3, p6_q2: 2, p6_q3: 3, p6_q4: 3, p6_q5: 3,
    p7_q1: 3, p7_q2: 4, p7_q3: 3, p7_q4: 2, p7_q5: 3, p7_q6: 'Our biggest constraint is limited sales headcount relative to market opportunity.',
  } : {},
  scores,
  report_data: null,
  created_at: '2025-04-01T10:00:00Z',
  completed_at: scores ? '2025-04-15T10:00:00Z' : null,
})

const SCORES_ACME = {
  radScore: 59.3,
  maturityBand: 'Growth System Fragile',
  primaryConstraint: { id: 'p3', score: 48.0, name: 'Positioning & Competitive Clarity' },
  pillarScores: {
    p1: { score: 68.6, avg: 3.43, count: 7 },
    p2: { score: 65.7, avg: 3.29, count: 7 },
    p3: { score: 48.0, avg: 2.40, count: 11 },
    p4: { score: 62.2, avg: 3.11, count: 11 },
    p5: { score: 53.3, avg: 2.67, count: 6 },
    p6: { score: 56.0, avg: 2.80, count: 5 },
    p7: { score: 60.0, avg: 3.00, count: 5 },
  },
  raps: {
    score: 37,
    revenueTarget: 15000000,
    revenueInvoiced: 8500000,
    revenueRemaining: 6500000,
    monthsRemaining: 6,
    pipelineCoverage: 2.5,
    winRate: 0.25,
    salesCycle: 4.5,
    timeFactor: 1,
    radModifier: 0.593,
  },
}

const SCORES_NOVA = {
  radScore: 78.5,
  maturityBand: 'Growth System Developing',
  primaryConstraint: { id: 'p5', score: 66.7, name: 'Pipeline Generation' },
  pillarScores: {
    p1: { score: 82.9, avg: 4.14, count: 7 },
    p2: { score: 80.0, avg: 4.00, count: 7 },
    p3: { score: 76.4, avg: 3.82, count: 11 },
    p4: { score: 80.0, avg: 4.00, count: 11 },
    p5: { score: 66.7, avg: 3.33, count: 6 },
    p6: { score: 76.0, avg: 3.80, count: 5 },
    p7: { score: 80.0, avg: 4.00, count: 5 },
  },
  raps: { score: 62, revenueTarget: 8000000, revenueInvoiced: 5200000, revenueRemaining: 2800000, monthsRemaining: 4, pipelineCoverage: 4, winRate: 0.35, salesCycle: 2, timeFactor: 1, radModifier: 0.785 },
}

export const DEMO_PROJECTS = [
  {
    id: 'proj-001', company_name: 'Acme Corporation', industry: 'SaaS / Software Platforms', status: 'completed',
    consultant_id: 'demo-user-002', consultant: { id: 'demo-user-002', name: 'James Carter', email: 'james@bizascend.com' },
    created_at: '2025-04-01T10:00:00Z', updated_at: '2025-04-15T10:00:00Z',
    latest_assessment: mkAssessment('proj-001', 1, 'completed', 'completed', SCORES_ACME),
    assessments: [mkAssessment('proj-001', 1, 'completed', 'completed', SCORES_ACME)],
    questionnaire_link: { id: 'link-001', token: 'demo-token-abc', status: 'completed', url: '#/assess/demo-token-abc', created_at: '2025-04-02T10:00:00Z' },
  },
  {
    id: 'proj-002', company_name: 'Nova Health Systems', industry: 'Healthcare Technology', status: 'completed',
    consultant_id: 'demo-user-003', consultant: { id: 'demo-user-003', name: 'Maya Patel', email: 'maya@bizascend.com' },
    created_at: '2025-03-15T10:00:00Z', updated_at: '2025-05-20T10:00:00Z',
    latest_assessment: mkAssessment('proj-002', 2, 'completed', 'completed', SCORES_NOVA),
    assessments: [mkAssessment('proj-002', 1, 'completed', 'completed', { ...SCORES_NOVA, radScore: 71.2, maturityBand: 'Growth System Developing' }), mkAssessment('proj-002', 2, 'completed', 'completed', SCORES_NOVA)],
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
    latest_assessment: mkAssessment('proj-006', 1, 'completed', 'completed', { ...SCORES_ACME, radScore: 82.1, maturityBand: 'Growth Engine Strong', primaryConstraint: { id: 'p6', score: 72.0, name: 'Revenue Economics' }, pillarScores: { p1: {score:88,avg:4.4,count:7}, p2: {score:85,avg:4.25,count:7}, p3: {score:80,avg:4.0,count:11}, p4: {score:84,avg:4.2,count:11}, p5: {score:78,avg:3.9,count:6}, p6: {score:72,avg:3.6,count:5}, p7: {score:82,avg:4.1,count:5} } }),
    assessments: [],
    questionnaire_link: null,
  },
  {
    id: 'proj-007', company_name: 'FintechFlow', industry: 'Fintech', status: 'archived',
    consultant_id: 'demo-user-005', consultant: { id: 'demo-user-005', name: 'Priya Sharma', email: 'priya@bizascend.com' },
    created_at: '2025-01-10T10:00:00Z', updated_at: '2025-02-28T10:00:00Z',
    latest_assessment: mkAssessment('proj-007', 1, 'completed', 'completed', { ...SCORES_ACME, radScore: 34.2, maturityBand: 'Growth System At Risk', primaryConstraint: { id: 'p1', score: 28.6, name: 'Commercial Baseline' } }),
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
export function demoApiFetch(path) {
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

  return { success: true }
}

import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { generateDiagnosticReport, generateMarketReport } from '@/lib/reportAgent'
import { calculateRAPS, calculateRAPSImprovement, parseCurrency, parseWinRate, parseSalesCycle, estimatePipelineFromLegacy } from '@/lib/rapsCalculation'
import { validatePassword } from '@/lib/passwordValidation'
import { PILLAR_WEIGHTS as DEFAULT_PILLAR_WEIGHTS, PILLAR_NAMES as PILLAR_NAME_MAP, FREE_EMAIL_DOMAINS, CLUSTER_DEFINITIONS, CONSTRAINT_SCENARIO_MAP, DIAGNOSTIC_PILLARS, STYLING_RULES } from '@/lib/constants'

const execPromise = promisify(exec)

// Helper function to run PDF generation script
async function runPdfScript(data) {
  const scriptPath = '/app/scripts/generate_pdf.py'
  const inputJson = JSON.stringify(data)
  
  try {
    const { stdout, stderr } = await execPromise(
      `echo '${inputJson.replace(/'/g, "'\\''")}' | python3 ${scriptPath}`,
      { 
        maxBuffer: 1024 * 1024 * 50, // 50MB buffer for PDF
        timeout: 60000, // 1 minute timeout
        env: { ...process.env }
      }
    )
    
    if (stderr) {
      console.error('PDF stderr:', stderr)
    }
    
    const result = JSON.parse(stdout.trim())
    return result
  } catch (error) {
    console.error('PDF script error:', error)
    throw new Error(`PDF generation failed: ${error.message}`)
  }
}

// Helper function to send email notifications
async function sendEmailNotification(data) {
  const scriptPath = '/app/scripts/email_service.py'
  const inputJson = JSON.stringify(data)
  
  try {
    const { stdout, stderr } = await execPromise(
      `echo '${inputJson.replace(/'/g, "'\\''")}' | python3 ${scriptPath}`,
      { 
        maxBuffer: 1024 * 1024, // 1MB buffer
        timeout: 30000, // 30 second timeout
        env: { ...process.env }
      }
    )
    
    if (stderr) {
      console.error('Email stderr:', stderr)
    }
    
    const result = JSON.parse(stdout.trim())
    return result
  } catch (error) {
    console.error('Email script error:', error)
    return { success: false, error: error.message }
  }
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function json(data, status = 200) {
  const res = NextResponse.json(data, { status })
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return res
}

function err(message, status = 400) { return json({ error: message }, status) }

function getBaseUrl(request) {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('host') || 'localhost:3000'
  return `${proto}://${host}`
}

async function getUser(request) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.split(' ')[1]
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return null
    let { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('auth_id', user.id).single()
    if (!profile) {
      const meta = user.user_metadata || {}
      const { data: newProfile, error: insertErr } = await supabaseAdmin.from('profiles').insert({
        auth_id: user.id,
        email: user.email,
        name: meta.name || user.email.split('@')[0],
        role: meta.role || 'consultant',
        is_active: true,
      }).select().single()
      if (insertErr || !newProfile) return null
      profile = newProfile
    }
    return { ...user, profile }
  } catch { return null }
}

async function logActivity(userId, projectId, action, details = {}) {
  try {
    await supabaseAdmin.from('activity_log').insert({ user_id: userId, project_id: projectId, action, details })
  } catch (e) { console.error('Activity log error:', e) }
}

async function logAuthEvent(eventType, email, request, details = {}) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    let userId = null
    if (details.user_id) {
      const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('auth_id', details.user_id).single()
      userId = profile?.id || null
    }
    await supabaseAdmin.from('auth_logs').insert({ email, user_id: userId, event_type: eventType, ip_address: ip, user_agent: userAgent, details })
  } catch (e) { console.error('Auth log error:', e) }
}

// Resolve anchor text for each diagnostic response
function resolveAnchors(diagnosticResponses, salesModel) {
  if (!diagnosticResponses) return {}
  const resolved = {}
  for (const [key, score] of Object.entries(diagnosticResponses)) {
    if (typeof score !== 'number') continue
    const match = key.match(/^(p\d+)_(q\d+)$/)
    if (!match) continue
    const [, pillarId, qPart] = match
    const pillarDef = DIAGNOSTIC_PILLARS.find(p => p.id === pillarId)
    if (!pillarDef) continue
    const qDef = pillarDef.questions.find(q => q.id === key)
    if (!qDef) continue

    let options
    if (qDef.type === 'conditional' && qDef.variants) {
      // Use salesModel to pick the right variant
      const variant = salesModel && qDef.variants[salesModel]
      options = variant ? variant.options : null
    } else if (qDef.type === 'scored') {
      options = qDef.options
    }

    const anchor = options ? options.find(o => o.s === score) : null
    if (!resolved[pillarId]) resolved[pillarId] = {}
    resolved[pillarId][qPart] = {
      score,
      selected_anchor: anchor ? anchor.l : `Score ${score}/5`,
    }
  }
  return resolved
}

// Scoring engine
function calculateScores(diagnosticResponses, screenerResponses, customWeights = null) {
  const pillarWeights = customWeights || DEFAULT_PILLAR_WEIGHTS
  const pillarScores = {}
  let totalWeightedScore = 0
  let lowestPillar = { id: null, score: 101, name: '' }
  const pillarNames = PILLAR_NAME_MAP
  const constraintCategories = {
    p1: 'commercial_foundation', p2: 'market_targeting', p3: 'positioning_weakness',
    p4: 'sales_system', p5: 'pipeline_constraint', p6: 'revenue_economics',
    p7: 'strategic_constraint', p8: 'organizational_alignment', p9: 'systems_readiness'
  }

  for (const [pillarId, weight] of Object.entries(pillarWeights)) {
    const responses = Object.entries(diagnosticResponses || {})
      .filter(([key]) => key.startsWith(pillarId + '_'))
      .filter(([, val]) => typeof val === 'number')
    if (responses.length === 0) { pillarScores[pillarId] = { score: 0, avg: 0, count: 0, questionRankings: [] }; continue }
    const avg = responses.reduce((sum, [, val]) => sum + val, 0) / responses.length
    const score = Math.round((avg / 5) * 100 * 10) / 10
    const pillarDef = DIAGNOSTIC_PILLARS.find(p => p.id === pillarId)
    const questionRankings = responses.sort((a, b) => a[1] - b[1]).map(([key, val]) => {
      const qDef = pillarDef?.questions.find(q => q.id === key)
      return { questionId: key, text: qDef?.text || key, score: val }
    })
    pillarScores[pillarId] = { score, avg: Math.round(avg * 100) / 100, count: responses.length, questionRankings }
    totalWeightedScore += score * weight
    if (score < lowestPillar.score) lowestPillar = { id: pillarId, score, name: pillarNames[pillarId] }
  }

  // Rank all constrained pillars (score < 65)
  const constraints = Object.entries(pillarScores)
    .filter(([, ps]) => ps.score > 0 && ps.score < 65)
    .sort((a, b) => a[1].score - b[1].score)
    .map(([pid, ps], idx) => ({
      id: pid, name: pillarNames[pid], score: ps.score,
      rank: idx + 1, category: constraintCategories[pid]
    }))

  // Growth leak detection - individual questions scoring 1 or 2
  const growthLeaks = Object.entries(diagnosticResponses || {})
    .filter(([, val]) => typeof val === 'number' && val <= 2)
    .map(([key, val]) => {
      const pillarId = key.split('_')[0]
      return { questionId: key, score: val, pillar: pillarId, pillarName: pillarNames[pillarId] }
    })
    .sort((a, b) => a.score - b.score)

  const radScore = Math.round(totalWeightedScore * 10) / 10
  let maturityBand = 'At Risk'
  if (radScore >= 80) maturityBand = 'Strong'
  else if (radScore >= 60) maturityBand = 'Developing'
  else if (radScore >= 40) maturityBand = 'Fragile'

  // Top 3 strengths (highest scoring pillars)
  const topPillars = Object.entries(pillarScores)
    .filter(([, ps]) => ps.score > 0)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 3)
    .map(([pid, ps]) => ({ id: pid, name: pillarNames[pid], score: ps.score }))

  // Operational strengths: per-pillar questions scoring 4 or 5
  const operationalStrengths = {}
  for (const [key, val] of Object.entries(diagnosticResponses || {})) {
    if (typeof val === 'number' && val >= 4) {
      const pid = key.split('_')[0]
      if (!operationalStrengths[pid]) operationalStrengths[pid] = []
      operationalStrengths[pid].push({ questionId: key, score: val })
    }
  }

  // Growth leaks grouped by pillar
  const growthLeaksByPillar = {}
  growthLeaks.forEach(gl => {
    if (!growthLeaksByPillar[gl.pillar]) growthLeaksByPillar[gl.pillar] = []
    growthLeaksByPillar[gl.pillar].push(gl)
  })

  // Cluster scores
  const clusterScores = {}
  for (const [pid, clusters] of Object.entries(CLUSTER_DEFINITIONS)) {
    clusterScores[pid] = clusters.map(cluster => {
      const qScores = cluster.questions.map(qid => diagnosticResponses?.[qid]).filter(v => typeof v === 'number')
      const avg = qScores.length > 0 ? qScores.reduce((s, v) => s + v, 0) / qScores.length : 0
      return { name: cluster.name, score: Math.round((avg / 5) * 100 * 10) / 10, avg: Math.round(avg * 100) / 100, count: qScores.length }
    })
  }

  // AI Transformation Readiness Index
  const aiReadinessQuestions = ['p9_q7', 'p9_q8', 'p9_q9', 'p9_q10', 'p9_q11']
  const aiScores = aiReadinessQuestions.map(q => diagnosticResponses?.[q]).filter(v => typeof v === 'number')
  const aiReadinessIndex = aiScores.length > 0 ? Math.round((aiScores.reduce((s, v) => s + v, 0) / aiScores.length / 5) * 100 * 10) / 10 : null

  // RAPS calculation using shared utility
  let raps = null
  let rapsImprovement = null
  let rapsScenarios = null
  if (screenerResponses) {
    const target = parseCurrency(screenerResponses.q18)
    const invoiced = parseCurrency(screenerResponses.q19)
    const fyEndMonth = parseInt(screenerResponses.q20) || 12
    const winRate = parseWinRate(screenerResponses.q17)
    const salesCycle = parseSalesCycle(screenerResponses.q15)

    // q16: currency value or legacy categorical fallback
    let openPipeline = parseCurrency(screenerResponses.q16)
    if (openPipeline === 0 && screenerResponses.q16) {
      const legacy = estimatePipelineFromLegacy(screenerResponses.q16, target)
      if (legacy !== null) openPipeline = legacy
    }

    const rapsInputs = { target, invoiced, fyEndMonth, openPipeline, winRate, salesCycle, radScore }
    raps = calculateRAPS(rapsInputs)

    // Deterministic improvement scenario: +5pp win rate, +25% pipeline
    rapsImprovement = calculateRAPSImprovement(rapsInputs, {
      winRate: Math.min(1, winRate + 0.05),
      openPipeline: openPipeline * 1.25,
    })

    // 3 RAPS scenarios based on primary constraint
    if (lowestPillar.id) {
      const category = constraintCategories[lowestPillar.id]
      const scenarioConfig = CONSTRAINT_SCENARIO_MAP[category] || { winRateDelta: 0.05, pipelineMultiplier: 1.25 }
      rapsScenarios = {
        conservative: calculateRAPSImprovement(rapsInputs, { winRate: Math.min(1, winRate + scenarioConfig.winRateDelta * 0.5), openPipeline: openPipeline * (1 + (scenarioConfig.pipelineMultiplier - 1) * 0.5) }),
        moderate: calculateRAPSImprovement(rapsInputs, { winRate: Math.min(1, winRate + scenarioConfig.winRateDelta), openPipeline: openPipeline * scenarioConfig.pipelineMultiplier }),
        aggressive: calculateRAPSImprovement(rapsInputs, { winRate: Math.min(1, winRate + scenarioConfig.winRateDelta * 1.5), openPipeline: openPipeline * (scenarioConfig.pipelineMultiplier * 1.3) }),
      }
    }
  }

  // Revenue at risk
  const revenueAtRisk = raps ? Math.max(0, raps.revenueRemaining - raps.expectedConvertible) : null

  // Structured scoring output for v2.0 schema
  const pillar_matrix = Object.entries(pillarScores).map(([id, ps]) => ({
    pillar_label: `${id.toUpperCase().replace('P', 'P')}. ${pillarNames[id]}`,
    weight_pct: `${Math.round(pillarWeights[id] * 100)}%`,
    raw_avg_display: `${ps.avg.toFixed(2)}/5.0`,
    weighted_score: ps.score,
    weighted_score_css: ps.score >= 80 ? 'ws-strong' : ps.score >= 60 ? 'ws-developing' : ps.score >= 40 ? 'ws-fragile' : 'ws-at-risk',
    band: ps.score >= 80 ? 'Strong' : ps.score >= 60 ? 'Developing' : ps.score >= 40 ? 'Fragile' : 'At Risk',
    badge_css: ps.score >= 80 ? 'badge-strong' : ps.score >= 60 ? 'badge-developing' : ps.score >= 40 ? 'badge-fragile' : 'badge-at-risk',
  }))

  const heatmap_rows = Object.entries(pillarScores).map(([id, ps]) => ({
    pillar_label: pillarNames[id],
    percentage: ps.score,
    percentage_display: `${ps.score.toFixed(1)}%`,
    fill_class: ps.score >= 80 ? 'fill-teal' : ps.score >= 60 ? 'fill-sage' : ps.score >= 40 ? 'fill-gold' : 'fill-coral',
  }))

  const overall_row = {
    weighted_score: radScore,
    weighted_score_css: radScore >= 80 ? 'ws-strong' : radScore >= 60 ? 'ws-developing' : radScore >= 40 ? 'ws-fragile' : 'ws-at-risk',
    band: maturityBand,
    badge_css: maturityBand === 'Strong' ? 'badge-strong' : maturityBand === 'Developing' ? 'badge-developing' : maturityBand === 'Fragile' ? 'badge-fragile' : 'badge-at-risk',
  }

  const radar_chart_data = {
    labels: Object.values(pillarNames),
    scores: Object.values(pillarScores).map(ps => ps.score),
    target: 80,
  }

  const score_band_css_class = maturityBand === 'Strong' ? 'band-strong' : maturityBand === 'Developing' ? 'band-developing' : maturityBand === 'Fragile' ? 'band-fragile' : 'band-at-risk'

  return { radScore, maturityBand, primaryConstraint: lowestPillar, constraints, growthLeaks, growthLeaksByPillar, pillarScores, raps, rapsImprovement, rapsScenarios, topPillars, operationalStrengths, revenueAtRisk, clusterScores, aiReadinessIndex, pillar_matrix, heatmap_rows, overall_row, radar_chart_data, score_band_css_class }
}

export async function OPTIONS() {
  return json(null, 200)
}

async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const method = request.method
  const route = '/' + path.join('/')

  try {
    // ===== ROOT =====
    if ((route === '/' || route === '/root') && method === 'GET') {
      return json({ message: 'Biz Ascend RAD API', status: 'ok' })
    }

    // ===== AUTH =====
    if (route === '/auth/me' && method === 'GET') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      return json(user.profile)
    }

    // POST /auth/login-log - Log login success/failure from client
    if (route === '/auth/login-log' && method === 'POST') {
      const body = await request.json()
      const { email, event_type, error_message } = body
      if (!email || !event_type) return err('email and event_type required')
      const validEvents = ['login_success', 'login_failure', 'signup', 'logout', 'password_reset_request', 'password_reset_complete']
      if (!validEvents.includes(event_type)) return err('Invalid event_type')
      await logAuthEvent(event_type, email, request, { error_message, user_id: body.user_id })
      return json({ logged: true })
    }

    // GET /auth/logs - Admin can view auth logs
    if (route === '/auth/logs' && method === 'GET') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      if (user.profile.role !== 'admin') return err('Forbidden', 403)
      const url = new URL(request.url)
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const { data, error: e } = await supabaseAdmin.from('auth_logs').select('*').order('created_at', { ascending: false }).limit(limit)
      if (e) throw e
      return json(data)
    }

    // GET /auth/session-timeout - Get configured session timeout
    if (route === '/auth/session-timeout' && method === 'GET') {
      const { data } = await supabaseAdmin.from('platform_settings').select('value').eq('key', 'session_timeout_minutes').single()
      return json({ timeout_minutes: data?.value || 60 })
    }

    // ===== PLATFORM SETTINGS (Admin) =====
    if (route === '/settings' && method === 'GET') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      if (user.profile.role !== 'admin') return err('Forbidden', 403)
      const { data, error: e } = await supabaseAdmin.from('platform_settings').select('*').order('key')
      if (e) throw e
      return json(data)
    }

    if (route === '/settings' && method === 'PATCH') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      if (user.profile.role !== 'admin') return err('Forbidden', 403)
      const body = await request.json()
      const { key, value } = body
      if (!key || value === undefined) return err('key and value required')
      const { data, error: e } = await supabaseAdmin.from('platform_settings').upsert({ key, value: JSON.parse(JSON.stringify(value)), updated_by: user.profile.id, updated_at: new Date().toISOString() }, { onConflict: 'key' }).select().single()
      if (e) throw e
      await logActivity(user.profile.id, null, `Updated platform setting: ${key}`)
      return json(data)
    }

    // ===== USERS (Admin) =====
    if (route === '/users' && method === 'GET') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      if (user.profile.role !== 'admin') return err('Forbidden', 403)
      const { data, error: e } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false })
      if (e) throw e
      return json(data)
    }

    if (route === '/users' && method === 'POST') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      if (user.profile.role !== 'admin') return err('Forbidden', 403)
      const body = await request.json()
      const { name, email, password, role = 'consultant' } = body
      if (!name || !email || !password) return err('Name, email, and password are required')
      const pwCheck = validatePassword(password)
      if (!pwCheck.valid) return err(`Password requirements: ${pwCheck.errors.join(', ')}`)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { name, role }
      })
      if (authError) return err(authError.message)
      await new Promise(r => setTimeout(r, 1000))
      const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('auth_id', authData.user.id).single()
      await logActivity(user.profile.id, null, `Created ${role}: ${name}`)
      return json(profile, 201)
    }

    // PATCH /users/:id
    if (path[0] === 'users' && path.length === 2 && method === 'PATCH') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      if (user.profile.role !== 'admin') return err('Forbidden', 403)
      const userId = path[1]
      const body = await request.json()
      const updates = {}
      if (body.name) updates.name = body.name
      if (body.role) updates.role = body.role
      if (body.is_active !== undefined) updates.is_active = body.is_active
      const { data, error: e } = await supabaseAdmin.from('profiles').update(updates).eq('id', userId).select().single()
      if (e) throw e
      return json(data)
    }

    // DELETE /users/:id (deactivate)
    if (path[0] === 'users' && path.length === 2 && method === 'DELETE') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      if (user.profile.role !== 'admin') return err('Forbidden', 403)
      const userId = path[1]
      const { data, error: e } = await supabaseAdmin.from('profiles').update({ is_active: false }).eq('id', userId).select().single()
      if (e) throw e
      return json(data)
    }

    // ===== PROJECTS =====
    if (route === '/projects' && method === 'GET') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      let query = supabaseAdmin.from('projects').select('*, consultant:profiles!consultant_id(id, name, email)')
      if (user.profile.role !== 'admin') query = query.eq('consultant_id', user.profile.id)
      query = query.order('created_at', { ascending: false })
      const { data, error: e } = await query
      if (e) throw e
      // Get latest assessment for each project
      const projectIds = data.map(p => p.id)
      if (projectIds.length > 0) {
        const { data: assessments } = await supabaseAdmin.from('assessments').select('*').in('project_id', projectIds).order('assessment_number', { ascending: false })
        const latestAssessments = {}
        for (const a of (assessments || [])) {
          if (!latestAssessments[a.project_id]) latestAssessments[a.project_id] = a
        }
        for (const p of data) {
          p.latest_assessment = latestAssessments[p.id] || null
          // Compute real diagnostic progress
          if (p.latest_assessment) {
            const dr = p.latest_assessment.diagnostic_responses || {}
            const answeredPillars = new Set()
            for (const key of Object.keys(dr)) {
              const match = key.match(/^(p\d+)_/)
              if (match) answeredPillars.add(match[1])
            }
            const totalPillars = 9
            p.diagnostic_progress = Math.round((answeredPillars.size / totalPillars) * 100)
          } else {
            p.diagnostic_progress = 0
          }
        }
      }
      return json(data)
    }

    if (route === '/projects' && method === 'POST') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const body = await request.json()
      const { company_name, industry, consultant_id, contact_name, contact_email, notes } = body
      if (!company_name || !industry) return err('Company name and industry are required')
      const assignTo = user.profile.role === 'admin' && consultant_id ? consultant_id : user.profile.id
      const projectId = uuidv4()
      const { data: project, error: e } = await supabaseAdmin.from('projects').insert({
        id: projectId, company_name, industry, consultant_id: assignTo, status: 'in_progress', contact_name, contact_email, notes
      }).select('*, consultant:profiles!consultant_id(id, name, email)').single()
      if (e) throw e
      // Create first assessment
      await supabaseAdmin.from('assessments').insert({ project_id: projectId, assessment_number: 1 })
      await logActivity(user.profile.id, projectId, `Created project: ${company_name}`)
      return json(project, 201)
    }

    // GET /projects/:id
    if (path[0] === 'projects' && path.length === 2 && method === 'GET') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      const { data: project, error: e } = await supabaseAdmin.from('projects').select('*, consultant:profiles!consultant_id(id, name, email)').eq('id', projectId).single()
      if (e || !project) return err('Project not found', 404)
      if (user.profile.role !== 'admin' && project.consultant_id !== user.profile.id) return err('Forbidden', 403)
      // Get assessments
      const { data: assessments } = await supabaseAdmin.from('assessments').select('*').eq('project_id', projectId).order('assessment_number', { ascending: false })
      project.assessments = assessments || []
      project.latest_assessment = assessments?.[0] || null
      // Get questionnaire link
      const { data: link } = await supabaseAdmin.from('questionnaire_links').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1).single()
      project.questionnaire_link = link || null
      return json(project)
    }

    // PATCH /projects/:id
    if (path[0] === 'projects' && path.length === 2 && method === 'PATCH') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      // Fetch current project to check archive status
      const { data: currentProject, error: fetchErr } = await supabaseAdmin.from('projects').select('*').eq('id', projectId).single()
      if (fetchErr || !currentProject) return err('Project not found', 404)
      if (currentProject.is_archived === true && user.profile.role !== 'admin') return err('Archived projects are read-only', 403)
      const body = await request.json()
      const updates = {}
      if (body.company_name) updates.company_name = body.company_name
      if (body.industry) updates.industry = body.industry
      if (body.status) updates.status = body.status
      if (body.consultant_id && user.profile.role === 'admin') updates.consultant_id = body.consultant_id
      if (body.contact_name !== undefined) updates.contact_name = body.contact_name
      if (body.contact_email !== undefined) updates.contact_email = body.contact_email
      if (body.notes !== undefined) updates.notes = body.notes
      // Handle archive flag based on status transitions
      if (body.status === 'archived') updates.is_archived = true
      if (currentProject.is_archived === true && body.status && body.status !== 'archived') updates.is_archived = false
      const { data, error: e } = await supabaseAdmin.from('projects').update(updates).eq('id', projectId).select().single()
      if (e) throw e
      await logActivity(user.profile.id, projectId, `Updated project: ${data.company_name}`, updates)
      return json(data)
    }

    // DELETE /projects/:id
    if (path[0] === 'projects' && path.length === 2 && method === 'DELETE') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      if (user.profile.role !== 'admin') return err('Forbidden', 403)
      const projectId = path[1]
      const { error: e } = await supabaseAdmin.from('projects').delete().eq('id', projectId)
      if (e) throw e
      return json({ success: true })
    }

    // ===== SCREENER =====
    // GET /projects/:id/screener
    if (path[0] === 'projects' && path.length === 3 && path[2] === 'screener' && method === 'GET') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      const { data: assessment } = await supabaseAdmin.from('assessments').select('*').eq('project_id', projectId).order('assessment_number', { ascending: false }).limit(1).single()
      if (!assessment) return err('No assessment found', 404)
      return json({ responses: assessment.screener_responses || {}, status: assessment.screener_status, assessment_id: assessment.id })
    }

    // PUT /projects/:id/screener
    if (path[0] === 'projects' && path.length === 3 && path[2] === 'screener' && method === 'PUT') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      const body = await request.json()
      const { data: assessment } = await supabaseAdmin.from('assessments').select('*').eq('project_id', projectId).order('assessment_number', { ascending: false }).limit(1).single()
      if (!assessment) return err('No assessment found', 404)
      const updates = { screener_responses: body.responses }
      if (assessment.screener_status === 'not_started') updates.screener_status = 'in_progress'
      const { data, error: e } = await supabaseAdmin.from('assessments').update(updates).eq('id', assessment.id).select().single()
      if (e) throw e
      await supabaseAdmin.from('projects').update({ status: 'in_progress' }).eq('id', projectId)
      return json({ success: true, status: data.screener_status })
    }

    // POST /projects/:id/screener/submit
    if (path[0] === 'projects' && path.length === 4 && path[2] === 'screener' && path[3] === 'submit' && method === 'POST') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      const { data: assessment } = await supabaseAdmin.from('assessments').select('*').eq('project_id', projectId).order('assessment_number', { ascending: false }).limit(1).single()
      if (!assessment) return err('No assessment found', 404)
      await supabaseAdmin.from('assessments').update({ screener_status: 'completed' }).eq('id', assessment.id)
      await supabaseAdmin.from('projects').update({ status: 'in_progress' }).eq('id', projectId)
      await logActivity(user.profile.id, projectId, 'Completed screener questionnaire')
      return json({ success: true })
    }

    // ===== DIAGNOSTIC =====
    // GET /projects/:id/diagnostic
    if (path[0] === 'projects' && path.length === 3 && path[2] === 'diagnostic' && method === 'GET') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      const { data: assessment } = await supabaseAdmin.from('assessments').select('*').eq('project_id', projectId).order('assessment_number', { ascending: false }).limit(1).single()
      if (!assessment) return err('No assessment found', 404)
      return json({ responses: assessment.diagnostic_responses || {}, status: assessment.diagnostic_status, screener_responses: assessment.screener_responses || {}, assessment_id: assessment.id })
    }

    // PUT /projects/:id/diagnostic
    if (path[0] === 'projects' && path.length === 3 && path[2] === 'diagnostic' && method === 'PUT') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      const body = await request.json()
      const { data: assessment } = await supabaseAdmin.from('assessments').select('*').eq('project_id', projectId).order('assessment_number', { ascending: false }).limit(1).single()
      if (!assessment) return err('No assessment found', 404)
      const salesModel = assessment.screener_responses?.q10 || null
      const resolved = resolveAnchors(body.responses, salesModel)
      const updates = { diagnostic_responses: body.responses, resolved_responses: resolved }
      if (assessment.diagnostic_status === 'not_started') updates.diagnostic_status = 'in_progress'
      const { data, error: e } = await supabaseAdmin.from('assessments').update(updates).eq('id', assessment.id).select().single()
      if (e) throw e
      return json({ success: true, status: data.diagnostic_status })
    }

    // POST /projects/:id/diagnostic/submit
    if (path[0] === 'projects' && path.length === 4 && path[2] === 'diagnostic' && path[3] === 'submit' && method === 'POST') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      const { data: assessment } = await supabaseAdmin.from('assessments').select('*').eq('project_id', projectId).order('assessment_number', { ascending: false }).limit(1).single()
      if (!assessment) return err('No assessment found', 404)
      // Calculate scores
      const scores = calculateScores(assessment.diagnostic_responses, assessment.screener_responses)
      await supabaseAdmin.from('assessments').update({ diagnostic_status: 'completed', scores, completed_at: new Date().toISOString() }).eq('id', assessment.id)
      await supabaseAdmin.from('projects').update({ status: 'completed' }).eq('id', projectId)
      await logActivity(user.profile.id, projectId, 'Completed diagnostic questionnaire')
      return json({ success: true, scores })
    }

    // ===== SCORES =====
    // GET /projects/:id/scores
    if (path[0] === 'projects' && path.length === 3 && path[2] === 'scores' && method === 'GET') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      const scoresUrl = new URL(request.url)
      const assessmentParam = scoresUrl.searchParams.get('assessment')
      let assessmentQuery
      if (assessmentParam) {
        assessmentQuery = supabaseAdmin.from('assessments').select('*').eq('id', assessmentParam).eq('project_id', projectId).single()
      } else {
        assessmentQuery = supabaseAdmin.from('assessments').select('*').eq('project_id', projectId).order('assessment_number', { ascending: false }).limit(1).single()
      }
      const { data: assessment } = await assessmentQuery
      if (!assessment) return err('No assessment found', 404)
      if (assessment.scores) {
        const hasRankings = Object.values(assessment.scores.pillarScores || {}).every(p => Array.isArray(p.questionRankings))
        if (hasRankings) return json(assessment.scores)
        // Recalculate to include questionRankings with text
      }
      if (assessment.diagnostic_status === 'completed') {
        const scores = calculateScores(assessment.diagnostic_responses, assessment.screener_responses)
        await supabaseAdmin.from('assessments').update({ scores }).eq('id', assessment.id)
        return json(scores)
      }
      return err('Diagnostic not yet completed', 400)
    }

    // ===== QUESTIONNAIRE LINK =====
    // POST /projects/:id/link
    if (path[0] === 'projects' && path.length === 3 && path[2] === 'link' && method === 'POST') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      const { data: assessment } = await supabaseAdmin.from('assessments').select('*').eq('project_id', projectId).order('assessment_number', { ascending: false }).limit(1).single()
      if (!assessment) return err('No assessment found', 404)
      // Expire existing links
      await supabaseAdmin.from('questionnaire_links').update({ status: 'expired' }).eq('project_id', projectId).eq('status', 'active')
      const token = uuidv4()
      // Load configurable link expiry (default 30 days)
      const { data: expirySetting } = await supabaseAdmin.from('platform_settings').select('value').eq('key', 'link_expiry_days').single()
      const expiryDays = expirySetting?.value || 30
      const expires = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
      const { data: link, error: e } = await supabaseAdmin.from('questionnaire_links').insert({
        project_id: projectId, assessment_id: assessment.id, token, status: 'active', expires_at: expires.toISOString()
      }).select().single()
      if (e) throw e
      const baseUrl = getBaseUrl(request)
      await logActivity(user.profile.id, projectId, 'Generated questionnaire link')
      return json({ ...link, url: `${baseUrl}#/assess/${token}` })
    }

    // POST /projects/:id/link/send-email - Send questionnaire link via email
    if (path[0] === 'projects' && path.length === 4 && path[2] === 'link' && path[3] === 'send-email' && method === 'POST') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      const body = await request.json()
      const { recipient_email, message } = body
      if (!recipient_email) return err('recipient_email is required')

      const { data: link } = await supabaseAdmin.from('questionnaire_links')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (!link) return err('No active questionnaire link found. Generate one first.', 404)

      const baseUrl = getBaseUrl(request)
      const linkUrl = `${baseUrl}#/assess/${link.token}`

      const { data: project } = await supabaseAdmin.from('projects').select('company_name').eq('id', projectId).single()

      const emailData = {
        type: 'questionnaire_link',
        to_email: recipient_email,
        company_name: project?.company_name || 'Company',
        link_url: linkUrl,
        consultant_name: user.profile.name || user.profile.email,
        message: message || '',
        expires_at: link.expires_at
      }

      const result = await sendEmailNotification(emailData)
      if (result.success) {
        await logActivity(user.profile.id, projectId, `Sent questionnaire link to ${recipient_email}`)
        return json({ success: true, message: `Questionnaire link sent to ${recipient_email}` })
      } else {
        return err(result.error || 'Failed to send email', 500)
      }
    }

    // GET /projects/:id/link
    if (path[0] === 'projects' && path.length === 3 && path[2] === 'link' && method === 'GET') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      const { data: link } = await supabaseAdmin.from('questionnaire_links').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1).single()
      if (!link) return json({ link: null })
      const baseUrl = getBaseUrl(request)
      return json({ ...link, url: `${baseUrl}#/assess/${link.token}` })
    }

    // DELETE /projects/:id/link
    if (path[0] === 'projects' && path.length === 3 && path[2] === 'link' && method === 'DELETE') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      await supabaseAdmin.from('questionnaire_links').update({ status: 'expired' }).eq('project_id', projectId).eq('status', 'active')
      return json({ success: true })
    }

    // ===== PUBLIC QUESTIONNAIRE =====
    // GET /assess/:token
    if (path[0] === 'assess' && path.length === 2 && method === 'GET') {
      const token = path[1]
      const { data: link } = await supabaseAdmin.from('questionnaire_links').select('*, project:projects(*), assessment:assessments(*)').eq('token', token).single()
      if (!link) return err('Invalid or expired link', 404)
      if (link.status === 'expired' || (link.expires_at && new Date(link.expires_at) < new Date())) return err('This link has expired', 410)
      if (link.status === 'completed') return json({ ...link, completed: true })
      // Track link access
      const accessUpdates = { last_accessed_at: new Date().toISOString(), access_count: (link.access_count || 0) + 1 }
      if (!link.first_accessed_at) accessUpdates.first_accessed_at = new Date().toISOString()
      await supabaseAdmin.from('questionnaire_links').update(accessUpdates).eq('id', link.id)
      return json({ token: link.token, status: link.status, progress: link.progress, project_name: link.project?.company_name, screener_responses: link.assessment?.screener_responses || {}, diagnostic_responses: link.assessment?.diagnostic_responses || {} })
    }

    // PUT /assess/:token
    if (path[0] === 'assess' && path.length === 2 && method === 'PUT') {
      const token = path[1]
      const body = await request.json()
      const { data: link } = await supabaseAdmin.from('questionnaire_links').select('*').eq('token', token).single()
      if (!link || link.status !== 'active') return err('Invalid link', 400)
      if (link.expires_at && new Date(link.expires_at) < new Date()) return err('This link has expired', 410)
      if (body.screener_responses && body.screener_responses.q3) {
        const domain = body.screener_responses.q3.split('@')[1]?.toLowerCase()
        if (domain && FREE_EMAIL_DOMAINS.includes(domain)) return err('Please use a company email address', 400)
      }
      if (body.screener_responses) {
        await supabaseAdmin.from('assessments').update({ screener_responses: body.screener_responses, screener_status: 'in_progress' }).eq('id', link.assessment_id)
      }
      if (body.diagnostic_responses) {
        // Fetch assessment to get screener_responses for salesModel
        const { data: assessForResolve } = await supabaseAdmin.from('assessments').select('screener_responses').eq('id', link.assessment_id).single()
        const salesModel = assessForResolve?.screener_responses?.q10 || null
        const resolved = resolveAnchors(body.diagnostic_responses, salesModel)
        await supabaseAdmin.from('assessments').update({ diagnostic_responses: body.diagnostic_responses, resolved_responses: resolved, diagnostic_status: 'in_progress' }).eq('id', link.assessment_id)
      }
      // Update progress and track access
      const linkUpdates = { last_accessed_at: new Date().toISOString() }
      if (body.progress) linkUpdates.progress = body.progress
      await supabaseAdmin.from('questionnaire_links').update(linkUpdates).eq('id', link.id)
      return json({ success: true })
    }

    // POST /assess/:token/submit
    if (path[0] === 'assess' && path.length === 3 && path[2] === 'submit' && method === 'POST') {
      const token = path[1]
      const { data: link } = await supabaseAdmin.from('questionnaire_links').select('*').eq('token', token).single()
      if (!link || link.status !== 'active') return err('Invalid link', 400)
      if (link.expires_at && new Date(link.expires_at) < new Date()) return err('This link has expired', 410)
      const { data: assessment } = await supabaseAdmin.from('assessments').select('*').eq('id', link.assessment_id).single()
      const scores = calculateScores(assessment.diagnostic_responses, assessment.screener_responses)
      await supabaseAdmin.from('assessments').update({ screener_status: 'completed', diagnostic_status: 'completed', scores, completed_at: new Date().toISOString() }).eq('id', link.assessment_id)
      await supabaseAdmin.from('questionnaire_links').update({ status: 'completed' }).eq('id', link.id)
      await supabaseAdmin.from('projects').update({ status: 'completed' }).eq('id', link.project_id)
      return json({ success: true, scores })
    }

    // ===== ASSESSMENTS & REASSESSMENT =====
    // GET /projects/:id/assessments
    if (path[0] === 'projects' && path.length === 3 && path[2] === 'assessments' && method === 'GET') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      const { data } = await supabaseAdmin.from('assessments').select('*').eq('project_id', projectId).order('assessment_number', { ascending: true })
      return json(data || [])
    }

    // GET /projects/:id/scores/compare - Compare scores across assessments
    if (path[0] === 'projects' && path.length === 4 && path[2] === 'scores' && path[3] === 'compare' && method === 'GET') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      const { data: assessments } = await supabaseAdmin.from('assessments')
        .select('id, assessment_number, scores, completed_at')
        .eq('project_id', projectId)
        .not('scores', 'is', null)
        .order('assessment_number', { ascending: true })
      if (!assessments || assessments.length === 0) return err('No completed assessments found', 404)

      const comparison = assessments.map((a, idx) => {
        const prev = idx > 0 ? assessments[idx - 1] : null
        const pillarDeltas = {}
        if (prev && a.scores?.pillarScores && prev.scores?.pillarScores) {
          for (const [pid, ps] of Object.entries(a.scores.pillarScores)) {
            const prevScore = prev.scores.pillarScores[pid]?.score || 0
            pillarDeltas[pid] = { current: ps.score, previous: prevScore, delta: Math.round((ps.score - prevScore) * 10) / 10 }
          }
        }
        return {
          assessment_number: a.assessment_number,
          completed_at: a.completed_at,
          radScore: a.scores?.radScore,
          radDelta: prev ? Math.round((a.scores.radScore - (prev.scores?.radScore || 0)) * 10) / 10 : null,
          maturityBand: a.scores?.maturityBand,
          pillarDeltas,
        }
      })
      return json(comparison)
    }

    // POST /projects/:id/reassess
    if (path[0] === 'projects' && path.length === 3 && path[2] === 'reassess' && method === 'POST') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      const { data: assessments } = await supabaseAdmin.from('assessments').select('*').eq('project_id', projectId).order('assessment_number', { ascending: false })
      const latestNum = assessments?.[0]?.assessment_number || 0
      const prevScreener = assessments?.[0]?.screener_responses || {}
      const { data: newAssessment, error: e } = await supabaseAdmin.from('assessments').insert({
        project_id: projectId, assessment_number: latestNum + 1, screener_responses: prevScreener, screener_status: 'completed'
      }).select().single()
      if (e) throw e
      await supabaseAdmin.from('projects').update({ status: 'in_progress' }).eq('id', projectId)
      await logActivity(user.profile.id, projectId, `Started reassessment #${latestNum + 1}`)
      return json(newAssessment, 201)
    }

    // ===== ADMIN STATS =====
    if (route === '/admin/stats' && method === 'GET') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      let projectQuery = supabaseAdmin.from('projects').select('id, status, industry, consultant_id', { count: 'exact' })
      if (user.profile.role !== 'admin') projectQuery = projectQuery.eq('consultant_id', user.profile.id)
      const { data: projects, count: totalProjects } = await projectQuery
      const { count: totalConsultants } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'consultant')
      const activeCount = projects?.filter(p => p.status === 'in_progress').length || 0
      const completedCount = projects?.filter(p => p.status === 'completed').length || 0
      // Sector distribution
      const sectors = {}
      for (const p of (projects || [])) { sectors[p.industry] = (sectors[p.industry] || 0) + 1 }
      return json({ total_projects: totalProjects || 0, total_consultants: totalConsultants || 0, active_diagnostics: activeCount, completed_diagnostics: completedCount, sectors })
    }

    // POST /admin/recalculate-scores/:projectId - Admin trigger to recalculate scores
    if (path[0] === 'admin' && path[1] === 'recalculate-scores' && path.length === 3 && method === 'POST') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      if (user.profile.role !== 'admin') return err('Forbidden', 403)
      const projectId = path[2]
      const { data: assessment } = await supabaseAdmin.from('assessments').select('*').eq('project_id', projectId).order('assessment_number', { ascending: false }).limit(1).single()
      if (!assessment) return err('No assessment found', 404)
      if (assessment.diagnostic_status !== 'completed') return err('Diagnostic not yet completed', 400)
      // Optionally load custom weights from platform_settings
      let customWeights = null
      const { data: weightsSetting } = await supabaseAdmin.from('platform_settings').select('value').eq('key', 'pillar_weights').single()
      if (weightsSetting?.value) customWeights = weightsSetting.value
      const scores = calculateScores(assessment.diagnostic_responses, assessment.screener_responses, customWeights)
      await supabaseAdmin.from('assessments').update({ scores }).eq('id', assessment.id)
      await logActivity(user.profile.id, projectId, 'Recalculated scores (admin)')
      return json(scores)
    }

    // ===== ACTIVITY LOG =====
    if (route === '/activity' && method === 'GET') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const url = new URL(request.url)
      const limit = parseInt(url.searchParams.get('limit') || '10')
      let query = supabaseAdmin.from('activity_log').select('*').order('created_at', { ascending: false }).limit(limit)
      if (user.profile.role !== 'admin') query = query.eq('user_id', user.profile.id)
      const { data } = await query
      return json({ activities: data || [] })
    }

    // ===== ORGANIZATION ENDPOINTS =====
    // GET /organization - Get current user's organization
    if (route === '/organization' && method === 'GET') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      if (user.profile.role !== 'admin') return err('Forbidden', 403)
      
      const { data: org, error: e } = await supabaseAdmin.from('organizations')
        .select('*')
        .eq('id', user.profile.organization_id)
        .single()
      
      if (e || !org) return err('Organization not found', 404)
      return json(org)
    }

    // PATCH /organization/settings - Update organization settings
    if (route === '/organization/settings' && method === 'PATCH') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      if (user.profile.role !== 'admin') return err('Forbidden', 403)
      
      const body = await request.json()
      const { settings } = body
      
      const { data: org, error: e } = await supabaseAdmin.from('organizations')
        .update({ settings })
        .eq('id', user.profile.organization_id)
        .select()
        .single()
      
      if (e) throw e
      return json(org)
    }

    // ===== REPORT GENERATION =====
    // POST /projects/:id/report/generate
    if (path[0] === 'projects' && path.length === 4 && path[2] === 'report' && path[3] === 'generate' && method === 'POST') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      const { data: assessment } = await supabaseAdmin.from('assessments').select('*').eq('project_id', projectId).order('assessment_number', { ascending: false }).limit(1).single()
      if (!assessment) return err('No assessment found', 404)
      if (assessment.diagnostic_status !== 'completed') return err('Diagnostic must be completed first', 400)

      // Generate report using Claude SDK
      const reportInput = {
        project_id: projectId,
        scores: assessment.scores || calculateScores(assessment.diagnostic_responses, assessment.screener_responses),
        screener_responses: assessment.screener_responses,
        diagnostic_responses: assessment.diagnostic_responses,
      }

      try {
        // Run diagnostic and market reports in parallel
        const [reportData, marketReport] = await Promise.all([
          generateDiagnosticReport(reportInput),
          generateMarketReport({
            project_id: projectId,
            markets: assessment.screener_responses?.q6 || 'United States',
            industry: assessment.screener_responses?.q5 || 'Technology',
            company: assessment.screener_responses?.q4 || 'the company',
          }).catch(e => { console.error('Market report error:', e); return { countries: [] } }),
        ])

        const fullReport = {
          ...reportData,
          market_report: marketReport,
          generated_at: new Date().toISOString(),
          metadata: {
            schema_version: '2.0',
            input_schema_version: '1.5',
            generated_at: new Date().toISOString(),
            model_used: 'claude-sonnet-4-20250514',
          },
          styling_rules: STYLING_RULES,
        }

        await supabaseAdmin.from('assessments').update({ report_data: fullReport, report_generated_at: new Date().toISOString() }).eq('id', assessment.id)
        await logActivity(user.profile.id, projectId, 'Generated diagnostic report')
        return json({ ...fullReport, scores: reportInput.scores, screener_responses: assessment.screener_responses, diagnostic_responses: assessment.diagnostic_responses })
      } catch (reportErr) {
        console.error('Report generation error:', reportErr)
        return err('Report generation failed: ' + reportErr.message, 500)
      }
    }

    // GET /projects/:id/report
    if (path[0] === 'projects' && path.length === 3 && path[2] === 'report' && method === 'GET') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      const { data: assessment } = await supabaseAdmin.from('assessments').select('*').eq('project_id', projectId).order('assessment_number', { ascending: false }).limit(1).single()
      if (!assessment) return err('No assessment found', 404)
      if (!assessment.report_data) return err('Report not generated yet', 404)
      return json({ ...assessment.report_data, scores: assessment.scores, screener_responses: assessment.screener_responses, diagnostic_responses: assessment.diagnostic_responses })
    }

    // GET /projects/:id/report/pdf - Generate PDF download
    if (path[0] === 'projects' && path.length === 4 && path[2] === 'report' && path[3] === 'pdf' && method === 'GET') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const projectId = path[1]
      const { data: assessment } = await supabaseAdmin.from('assessments').select('*').eq('project_id', projectId).order('assessment_number', { ascending: false }).limit(1).single()
      if (!assessment) return err('No assessment found', 404)
      if (!assessment.report_data) return err('Report not generated yet. Generate AI report first.', 404)

      const pdfData = {
        scores: assessment.scores,
        report_data: assessment.report_data,
        screener_responses: assessment.screener_responses,
        generated_at: assessment.report_data.generated_at || new Date().toISOString()
      }

      try {
        const pdfResult = await runPdfScript(pdfData)
        return json(pdfResult)
      } catch (pdfErr) {
        console.error('PDF generation error:', pdfErr)
        return err('PDF generation failed: ' + pdfErr.message, 500)
      }
    }

    // POST /notifications/send-report - Send report notification email
    if (path[0] === 'notifications' && path[1] === 'send-report' && method === 'POST') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      
      const body = await request.json()
      const { project_id, recipient_email } = body
      
      if (!project_id || !recipient_email) {
        return err('project_id and recipient_email are required', 400)
      }

      const { data: project } = await supabaseAdmin.from('projects').select('*').eq('id', project_id).single()
      if (!project) return err('Project not found', 404)

      const { data: assessment } = await supabaseAdmin.from('assessments')
        .select('*')
        .eq('project_id', project_id)
        .order('assessment_number', { ascending: false })
        .limit(1)
        .single()
      
      if (!assessment?.scores) return err('No completed assessment found', 400)

      const baseUrl = getBaseUrl(request)
      const reportUrl = `${baseUrl}#/projects/${project_id}/scores`

      const emailData = {
        type: 'report_notification',
        to_email: recipient_email,
        company_name: project.company_name,
        rad_score: assessment.scores.radScore,
        maturity_band: assessment.scores.maturityBand,
        report_url: reportUrl
      }

      const result = await sendEmailNotification(emailData)
      
      if (result.success) {
        await logActivity(user.profile.id, project_id, `Sent report notification to ${recipient_email}`)
        return json({ success: true, message: `Report notification sent to ${recipient_email}` })
      } else {
        return err(result.error || 'Failed to send email', 500)
      }
    }

    // POST /notifications/password-reset - Send password reset email
    if (path[0] === 'notifications' && path[1] === 'password-reset' && method === 'POST') {
      const body = await request.json()
      const { email } = body
      
      if (!email) {
        return err('email is required', 400)
      }

      const baseUrl = getBaseUrl(request)
      // In real implementation, this would generate a secure token
      const resetUrl = `${baseUrl}#/reset-password?token=demo-token`

      const emailData = {
        type: 'password_reset',
        to_email: email,
        reset_url: resetUrl
      }

      const result = await sendEmailNotification(emailData)
      
      if (result.success) {
        return json({ success: true, message: 'Password reset email sent' })
      } else {
        // Don't reveal if email exists or not for security
        return json({ success: true, message: 'If an account exists with this email, a reset link has been sent' })
      }
    }

    // POST /notifications/send-pdf-report - Send PDF report via email
    if (path[0] === 'notifications' && path[1] === 'send-pdf-report' && method === 'POST') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      
      const body = await request.json()
      const { project_id, recipient_email, message } = body
      
      if (!project_id || !recipient_email) {
        return err('project_id and recipient_email are required', 400)
      }

      const { data: project } = await supabaseAdmin.from('projects').select('*').eq('id', project_id).single()
      if (!project) return err('Project not found', 404)

      const { data: assessment } = await supabaseAdmin.from('assessments')
        .select('*')
        .eq('project_id', project_id)
        .order('assessment_number', { ascending: false })
        .limit(1)
        .single()
      
      if (!assessment?.scores) return err('No completed assessment found', 400)
      if (!assessment.report_data) return err('Report not generated yet. Generate AI report first.', 400)

      // Generate PDF
      const pdfData = {
        scores: assessment.scores,
        report_data: assessment.report_data,
        screener_responses: assessment.screener_responses,
        generated_at: assessment.report_data.generated_at || new Date().toISOString()
      }

      let pdfResult
      try {
        pdfResult = await runPdfScript(pdfData)
      } catch (pdfErr) {
        return err('Failed to generate PDF: ' + pdfErr.message, 500)
      }

      // Send email with PDF attachment
      const emailData = {
        type: 'pdf_report',
        to_email: recipient_email,
        company_name: project.company_name,
        rad_score: assessment.scores.radScore,
        maturity_band: assessment.scores.maturityBand,
        consultant_name: user.profile.full_name || user.profile.email,
        message: message || '',
        pdf_base64: pdfResult.pdf,
        filename: pdfResult.filename
      }

      const result = await sendEmailNotification(emailData)
      
      if (result.success) {
        await logActivity(user.profile.id, project_id, `Sent PDF report to ${recipient_email}`)
        return json({ success: true, message: `PDF report sent to ${recipient_email}` })
      } else {
        return err(result.error || 'Failed to send email', 500)
      }
    }

    return err('Route not found', 404)
  } catch (error) {
    if (error.message === 'Unauthorized') return err('Unauthorized', 401)
    if (error.message === 'Forbidden') return err('Forbidden', 403)
    console.error('API Error:', error)
    return err(error.message || 'Internal server error', 500)
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute

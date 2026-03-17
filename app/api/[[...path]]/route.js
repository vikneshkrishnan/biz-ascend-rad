import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { generateDiagnosticReport, generateMarketReport } from '@/lib/reportAgent'

const execPromise = promisify(exec)

// Helper function to run Python script for AI generation
async function runPythonScript(data) {
  const scriptPath = '/app/scripts/generate_report.py'
  const inputJson = JSON.stringify(data)
  
  try {
    const { stdout, stderr } = await execPromise(
      `echo '${inputJson.replace(/'/g, "'\\''")}' | python3 ${scriptPath}`,
      { 
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: 120000, // 2 minute timeout
        env: { ...process.env }
      }
    )
    
    if (stderr) {
      console.error('Python stderr:', stderr)
    }
    
    const result = JSON.parse(stdout.trim())
    return result
  } catch (error) {
    console.error('Python script error:', error)
    throw new Error(`Python script failed: ${error.message}`)
  }
}

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
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('auth_id', user.id).single()
    if (!profile) return null
    return { ...user, profile }
  } catch { return null }
}

async function logActivity(userId, projectId, action, details = {}) {
  try {
    await supabaseAdmin.from('activity_log').insert({ user_id: userId, project_id: projectId, action, details })
  } catch (e) { console.error('Activity log error:', e) }
}

// Scoring engine
function calculateScores(diagnosticResponses, screenerResponses) {
  const pillarWeights = { p1: 0.12, p2: 0.11, p3: 0.15, p4: 0.15, p5: 0.10, p6: 0.07, p7: 0.08, p8: 0.10, p9: 0.12 }
  const pillarScores = {}
  let totalWeightedScore = 0
  let lowestPillar = { id: null, score: 101, name: '' }
  const pillarNames = { p1: 'Commercial Baseline', p2: 'ICP & Buyer Urgency', p3: 'Positioning & Competitive Clarity', p4: 'Sales System Repeatability', p5: 'Pipeline Generation', p6: 'Revconomics', p7: 'Strategic Constraints', p8: 'Organisational Alignment & Capability', p9: 'Systems Readiness & AI Transformation' }

  for (const [pillarId, weight] of Object.entries(pillarWeights)) {
    const responses = Object.entries(diagnosticResponses || {})
      .filter(([key]) => key.startsWith(pillarId + '_'))
      .filter(([, val]) => typeof val === 'number')
    if (responses.length === 0) { pillarScores[pillarId] = { score: 0, avg: 0, count: 0 }; continue }
    const avg = responses.reduce((sum, [, val]) => sum + val, 0) / responses.length
    const score = Math.round((avg / 5) * 100 * 10) / 10
    pillarScores[pillarId] = { score, avg: Math.round(avg * 100) / 100, count: responses.length }
    totalWeightedScore += score * weight
    if (score < lowestPillar.score) lowestPillar = { id: pillarId, score, name: pillarNames[pillarId] }
  }

  const radScore = Math.round(totalWeightedScore * 10) / 10
  let maturityBand = 'Growth System At Risk'
  if (radScore >= 80) maturityBand = 'Growth Engine Strong'
  else if (radScore >= 65) maturityBand = 'Growth System Constrained'
  else if (radScore >= 50) maturityBand = 'Growth System Underpowered'

  // RAPS calculation
  let raps = null
  if (screenerResponses) {
    const target = parseFloat(String(screenerResponses.q18 || '0').replace(/[,$]/g, '')) || 0
    const invoiced = parseFloat(String(screenerResponses.q19 || '0').replace(/[,$]/g, '')) || 0
    const remaining = Math.max(0, target - invoiced)
    const fyEnd = parseInt(screenerResponses.q20) || 12
    const now = new Date()
    const curMonth = now.getMonth() + 1
    let monthsLeft = fyEnd >= curMonth ? fyEnd - curMonth : 12 - curMonth + fyEnd
    monthsLeft = Math.max(monthsLeft, 1)
    const coverageMap = { '<1\u00d7 monthly revenue target': 0.5, '1\u20132\u00d7': 1.5, '2\u20133\u00d7': 2.5, '3\u20135\u00d7': 4, '5\u00d7+': 5 }
    const winMap = { '<10%': 0.05, '10\u201320%': 0.15, '20\u201330%': 0.25, '30\u201340%': 0.35, '40%+': 0.45 }
    const cycleMap = { '<1 month': 1, '1\u20133 months': 2, '3\u20136 months': 4.5, '6\u201312 months': 9, '12+ months': 15 }
    const coverage = coverageMap[screenerResponses.q16] || 1
    const winRate = winMap[screenerResponses.q17] || 0.2
    const cycle = cycleMap[screenerResponses.q15] || 3
    const timeFactor = Math.min(1, monthsLeft / cycle)
    const base = Math.min(1, coverage * winRate * timeFactor)
    const rapsScore = Math.round(Math.min(100, Math.max(0, base * (radScore / 100) * 100)))
    raps = { score: rapsScore, revenueTarget: target, revenueInvoiced: invoiced, revenueRemaining: remaining, monthsRemaining: monthsLeft, pipelineCoverage: coverage, winRate, salesCycle: cycle, timeFactor, radModifier: radScore / 100 }
  }

  return { radScore, maturityBand, primaryConstraint: lowestPillar, pillarScores, raps }
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
        for (const p of data) p.latest_assessment = latestAssessments[p.id] || null
      }
      return json(data)
    }

    if (route === '/projects' && method === 'POST') {
      const user = await getUser(request)
      if (!user) return err('Unauthorized', 401)
      const body = await request.json()
      const { company_name, industry, consultant_id } = body
      if (!company_name || !industry) return err('Company name and industry are required')
      const assignTo = user.profile.role === 'admin' && consultant_id ? consultant_id : user.profile.id
      const projectId = uuidv4()
      const { data: project, error: e } = await supabaseAdmin.from('projects').insert({
        id: projectId, company_name, industry, consultant_id: assignTo, status: 'in_progress'
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
      const body = await request.json()
      const updates = {}
      if (body.company_name) updates.company_name = body.company_name
      if (body.industry) updates.industry = body.industry
      if (body.status) updates.status = body.status
      if (body.consultant_id && user.profile.role === 'admin') updates.consultant_id = body.consultant_id
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
      const updates = { diagnostic_responses: body.responses }
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
      const { data: assessment } = await supabaseAdmin.from('assessments').select('*').eq('project_id', projectId).order('assessment_number', { ascending: false }).limit(1).single()
      if (!assessment) return err('No assessment found', 404)
      if (assessment.scores) return json(assessment.scores)
      // Calculate if not cached
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
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      const { data: link, error: e } = await supabaseAdmin.from('questionnaire_links').insert({
        project_id: projectId, assessment_id: assessment.id, token, status: 'active', expires_at: expires.toISOString()
      }).select().single()
      if (e) throw e
      const baseUrl = getBaseUrl(request)
      await logActivity(user.profile.id, projectId, 'Generated questionnaire link')
      return json({ ...link, url: `${baseUrl}#/assess/${token}` })
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
      return json({ token: link.token, status: link.status, progress: link.progress, project_name: link.project?.company_name, screener_responses: link.assessment?.screener_responses || {}, diagnostic_responses: link.assessment?.diagnostic_responses || {} })
    }

    // PUT /assess/:token
    if (path[0] === 'assess' && path.length === 2 && method === 'PUT') {
      const token = path[1]
      const body = await request.json()
      const { data: link } = await supabaseAdmin.from('questionnaire_links').select('*').eq('token', token).single()
      if (!link || link.status !== 'active') return err('Invalid link', 400)
      const updates = {}
      if (body.screener_responses) {
        await supabaseAdmin.from('assessments').update({ screener_responses: body.screener_responses, screener_status: 'in_progress' }).eq('id', link.assessment_id)
      }
      if (body.diagnostic_responses) {
        await supabaseAdmin.from('assessments').update({ diagnostic_responses: body.diagnostic_responses, diagnostic_status: 'in_progress' }).eq('id', link.assessment_id)
      }
      if (body.progress) {
        await supabaseAdmin.from('questionnaire_links').update({ progress: body.progress }).eq('id', link.id)
      }
      return json({ success: true })
    }

    // POST /assess/:token/submit
    if (path[0] === 'assess' && path.length === 3 && path[2] === 'submit' && method === 'POST') {
      const token = path[1]
      const { data: link } = await supabaseAdmin.from('questionnaire_links').select('*').eq('token', token).single()
      if (!link || link.status !== 'active') return err('Invalid link', 400)
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
        const reportData = await generateDiagnosticReport(reportInput)

        // Also generate market report with web search
        let marketReport = { countries: [] }
        try {
          marketReport = await generateMarketReport({
            project_id: projectId,
            markets: assessment.screener_responses?.q6 || 'United States',
            industry: assessment.screener_responses?.q5 || 'Technology',
            company: assessment.screener_responses?.q4 || 'the company',
          })
        } catch (e) { console.error('Market report error:', e) }

        const fullReport = { ...reportData, market_report: marketReport, generated_at: new Date().toISOString() }

        await supabaseAdmin.from('assessments').update({ report_data: fullReport, report_generated_at: new Date().toISOString() }).eq('id', assessment.id)
        await logActivity(user.profile.id, projectId, 'Generated diagnostic report')
        return json(fullReport)
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
      return json({ ...assessment.report_data, scores: assessment.scores, screener_responses: assessment.screener_responses })
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

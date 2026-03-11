#!/usr/bin/env python3
"""
PDF Report Generator for Biz Ascend RAD
Uses WeasyPrint to generate professional presentation-grade PDF reports
"""

import json
import sys
import base64
from io import BytesIO
from weasyprint import HTML

PILLAR_NAMES = {
    'p1': 'Commercial Baseline',
    'p2': 'ICP & Buyer Urgency',
    'p3': 'Positioning & Competitive Clarity',
    'p4': 'Sales System Repeatability',
    'p5': 'Pipeline Generation',
    'p6': 'Revenue Economics',
    'p7': 'Strategic Constraints',
}

def get_band_color(score):
    if score >= 80:
        return '#22c55e'
    elif score >= 60:
        return '#f59e0b'
    elif score >= 40:
        return '#f97316'
    return '#ef4444'

def get_traffic_light(avg):
    if avg >= 4:
        return '#22c55e'
    elif avg >= 3:
        return '#f59e0b'
    return '#ef4444'

def generate_pdf(data):
    """Generate a PDF report from the provided data"""
    scores = data.get('scores', {})
    report = data.get('report_data', {})
    screener = data.get('screener_responses', {})
    company = screener.get('q4', 'Company')
    industry = screener.get('q5', 'Industry')
    
    rad_score = scores.get('radScore', 0)
    maturity_band = scores.get('maturityBand', 'Unknown')
    constraint = scores.get('primaryConstraint', {})
    pillar_scores = scores.get('pillarScores', {})
    raps = scores.get('raps', {})
    
    band_color = get_band_color(rad_score)
    
    # Build pillar rows
    pillar_rows = ''
    for pid, pdata in pillar_scores.items():
        is_primary = constraint.get('id') == pid
        pillar_name = PILLAR_NAMES.get(pid, pid)
        score = pdata.get('score', 0)
        avg = pdata.get('avg', 0)
        color = get_traffic_light(avg)
        highlight = 'background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444;' if is_primary else ''
        constraint_badge = '<span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; margin-left: 8px;">PRIMARY CONSTRAINT</span>' if is_primary else ''
        
        narrative = report.get('pillar_narratives', {}).get(pid, '')
        narrative_html = f'<p style="margin-top: 12px; font-size: 12px; color: #6b7280; line-height: 1.6;">{narrative}</p>' if narrative else ''
        
        pillar_rows += f'''
        <div style="padding: 16px; margin-bottom: 12px; border: 1px solid #e5e7eb; border-radius: 8px; {highlight}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: {color}; margin-right: 12px;"></div>
                    <span style="font-weight: 600;">{pillar_name}</span>
                    {constraint_badge}
                </div>
                <span style="font-weight: 700; font-size: 18px;">{score}</span>
            </div>
            <div style="width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                <div style="width: {score}%; height: 100%; background: {color}; border-radius: 4px;"></div>
            </div>
            {narrative_html}
        </div>
        '''
    
    # Build action plan
    action_plan = report.get('action_plan', {})
    action_html = ''
    if action_plan:
        phases = [
            ('phase1_title', 'phase1_items', '#fef2f2', '#dc2626'),
            ('phase2_title', 'phase2_items', '#fffbeb', '#d97706'),
            ('phase3_title', 'phase3_items', '#f0fdf4', '#16a34a'),
        ]
        for title_key, items_key, bg, color in phases:
            title = action_plan.get(title_key, '')
            items = action_plan.get(items_key, [])
            if title and items:
                items_html = ''.join([f'<li style="margin-bottom: 6px;">{item}</li>' for item in items])
                action_html += f'''
                <div style="flex: 1; padding: 16px; background: {bg}; border-radius: 8px; margin-right: 12px;">
                    <h4 style="color: {color}; margin: 0 0 12px 0; font-size: 14px;">{title}</h4>
                    <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #374151;">{items_html}</ul>
                </div>
                '''
    
    # Constraint HTML
    constraint_html = ''
    if constraint.get('name'):
        constraint_html = f'''
            <div class="constraint-box">
                <p style="color: #6b7280; margin: 0; font-size: 12px;">Primary Growth Constraint</p>
                <p style="color: #dc2626; font-weight: 600; margin: 4px 0 0;">{constraint.get('name', 'N/A')}</p>
            </div>
        '''
    
    # Positioning HTML
    positioning_html = ''
    if report.get('positioning_assessment'):
        moat_score = report.get('strategic_moat_score', 'N/A')
        moat_narrative = report.get('strategic_moat_narrative', '')
        positioning_html = f'''
        <div class="section">
            <h2 class="section-title">Positioning Assessment</h2>
            <div class="narrative-box">{report.get('positioning_assessment', '')}</div>
            <div style="margin-top: 16px; padding: 16px; background: #f0fdf4; border-radius: 8px;">
                <p style="margin: 0;"><strong>Strategic Moat Score:</strong> {moat_score}/10</p>
                <p style="margin: 8px 0 0; font-size: 13px; color: #374151;">{moat_narrative}</p>
            </div>
        </div>
        '''
    
    # RAPS HTML
    raps_html = ''
    if raps:
        raps_score = raps.get('score', 0)
        raps_target = raps.get('revenueTarget', 0)
        raps_invoiced = raps.get('revenueInvoiced', 0)
        raps_remaining = raps.get('revenueRemaining', 0)
        months_remaining = raps.get('monthsRemaining', 0)
        raps_narrative = report.get('raps_narrative', '')
        raps_improvement = report.get('raps_improvement_scenario', '')
        
        raps_narrative_html = f'<div class="narrative-box" style="margin-top: 16px;">{raps_narrative}</div>' if raps_narrative else ''
        raps_improvement_html = f'<div style="margin-top: 12px; padding: 16px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #22c55e;"><strong style="color: #16a34a;">Improvement Scenario:</strong> {raps_improvement}</div>' if raps_improvement else ''
        
        raps_html = f'''
        <div class="section" style="page-break-before: always;">
            <h2 class="section-title">Revenue Achievement Probability (RAPS)</h2>
            <div style="text-align: center; padding: 24px; background: #f9fafb; border-radius: 12px;">
                <p style="font-size: 48px; font-weight: 700; color: #f97316; margin: 0;">{raps_score}%</p>
                <p style="color: #6b7280;">Probability of achieving revenue target</p>
            </div>
            <div class="raps-grid">
                <div class="raps-item">
                    <div class="raps-value">${raps_target:,.0f}</div>
                    <div class="raps-label">Revenue Target</div>
                </div>
                <div class="raps-item">
                    <div class="raps-value">${raps_invoiced:,.0f}</div>
                    <div class="raps-label">Already Invoiced</div>
                </div>
                <div class="raps-item">
                    <div class="raps-value">${raps_remaining:,.0f}</div>
                    <div class="raps-label">Remaining</div>
                </div>
                <div class="raps-item">
                    <div class="raps-value">{months_remaining}</div>
                    <div class="raps-label">Months Left</div>
                </div>
            </div>
            {raps_narrative_html}
            {raps_improvement_html}
        </div>
        '''
    
    # Action plan HTML
    action_section_html = ''
    if action_html:
        action_section_html = f'''
        <div class="section" style="page-break-before: always;">
            <h2 class="section-title">30-60-90 Day Action Plan</h2>
            <div class="action-grid">{action_html}</div>
        </div>
        '''
    
    html_content = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page {{
                size: A4;
                margin: 1.5cm;
            }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #1f2937;
                line-height: 1.5;
                font-size: 14px;
            }}
            .header {{
                text-align: center;
                padding: 32px 0;
                border-bottom: 2px solid #f97316;
                margin-bottom: 32px;
            }}
            .logo {{
                width: 48px;
                height: 48px;
                background: #f97316;
                border-radius: 12px;
                margin: 0 auto 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }}
            .title {{
                font-size: 28px;
                font-weight: 700;
                margin: 0;
                color: #1f2937;
            }}
            .subtitle {{
                color: #6b7280;
                margin-top: 8px;
            }}
            .score-card {{
                text-align: center;
                padding: 32px;
                background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
                border-radius: 16px;
                margin-bottom: 32px;
                border-top: 4px solid {band_color};
            }}
            .rad-score {{
                font-size: 72px;
                font-weight: 700;
                color: #f97316;
                margin: 0;
            }}
            .maturity-badge {{
                display: inline-block;
                background: {band_color};
                color: white;
                padding: 8px 24px;
                border-radius: 24px;
                font-weight: 600;
                margin-top: 16px;
            }}
            .constraint-box {{
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 16px;
                margin-top: 16px;
                display: inline-block;
            }}
            .section {{
                margin-bottom: 32px;
                page-break-inside: avoid;
            }}
            .section-title {{
                font-size: 18px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 16px;
                padding-bottom: 8px;
                border-bottom: 2px solid #f97316;
            }}
            .narrative-box {{
                background: #f9fafb;
                border-radius: 8px;
                padding: 20px;
                line-height: 1.8;
            }}
            .raps-grid {{
                display: flex;
                gap: 12px;
                margin-top: 16px;
            }}
            .raps-item {{
                flex: 1;
                text-align: center;
                padding: 16px;
                background: #f9fafb;
                border-radius: 8px;
            }}
            .raps-value {{
                font-size: 24px;
                font-weight: 700;
                color: #f97316;
            }}
            .raps-label {{
                font-size: 11px;
                color: #6b7280;
                margin-top: 4px;
            }}
            .action-grid {{
                display: flex;
                gap: 12px;
            }}
            .footer {{
                text-align: center;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
                color: #9ca3af;
                font-size: 11px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
            </div>
            <h1 class="title">Biz Ascend RAD&trade;</h1>
            <p class="subtitle">Revenue Acceleration Diagnostic Report</p>
            <p style="margin-top: 24px; font-size: 20px; font-weight: 600;">{company}</p>
            <p style="color: #6b7280;">{industry}</p>
        </div>
        
        <div class="score-card">
            <p style="color: #6b7280; margin: 0;">RAD Growth System Score</p>
            <p class="rad-score">{rad_score}</p>
            <div class="maturity-badge">{maturity_band}</div>
            {constraint_html}
        </div>
        
        <div class="section">
            <h2 class="section-title">Executive Summary</h2>
            <div class="narrative-box">{report.get('executive_summary', 'No executive summary available.')}</div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Diagnostic Overview</h2>
            {pillar_rows}
        </div>
        
        {positioning_html}
        {raps_html}
        {action_section_html}
        
        <div class="footer">
            <p>Generated by Biz Ascend RAD&trade; | Powered by Claude AI</p>
            <p>Report generated on {data.get('generated_at', 'N/A')}</p>
        </div>
    </body>
    </html>
    '''
    
    # Generate PDF
    pdf_buffer = BytesIO()
    HTML(string=html_content).write_pdf(pdf_buffer)
    pdf_buffer.seek(0)
    
    # Return base64 encoded PDF
    pdf_base64 = base64.b64encode(pdf_buffer.read()).decode('utf-8')
    return {'pdf': pdf_base64, 'filename': f'{company.replace(" ", "_")}_RAD_Report.pdf'}


def main():
    data = json.load(sys.stdin)
    result = generate_pdf(data)
    print(json.dumps(result))


if __name__ == '__main__':
    main()

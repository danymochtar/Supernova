import type { TalentVocationId } from '@/lib/numerology/talents';

export interface ParsedResumeRole {
  title: string;
  company: string | null;
  /** ISO YYYY-MM-DD or null. Day = 01 if only month/year known. */
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  /** 1-2 sentence summary lifted from bullets. Optional. */
  summary: string | null;
  /** One of the 7 TalentVocationId values, picked by the model. */
  vocation: TalentVocationId;
}

export interface ParsedResume {
  roles: ParsedResumeRole[];
}

export const RESUME_SYSTEM_PROMPT = `You extract structured work experience from a PDF résumé.

Output STRICT JSON only — no commentary, no markdown fence. Schema:

{
  "roles": [
    {
      "title": "string",
      "company": "string|null",
      "startDate": "YYYY-MM-DD|null",
      "endDate": "YYYY-MM-DD|null",
      "current": true|false,
      "summary": "string|null",
      "vocation": "business" | "medicineEducation" | "legalPolitics" | "artsDesign" | "salesPr" | "scienceEngineering" | "agriculture"
    }
  ]
}

Formatting:
- Order roles most-recent first.
- Use day=01 when only month/year are given.
- "current": true if endDate is "Present"/"Now"/missing for the latest role.
- Summary: 1-2 short sentences capturing what the role actually did. Lift from bullets, condense. Skip if there are no useful bullets.
- Skip pure education entries (school, university). Skip pure volunteering unless professional.
- Cap at 12 roles.

═══ VOCATION CLASSIFICATION — read carefully ═══

CLASSIFY BY ROLE FUNCTION, NOT TITLE KEYWORDS. Many tech-sounding titles describe business or sales roles, and getting this right matters.

The 7 buckets:
- business: management, leadership, P&L, team-of-N ownership, strategy, consulting, finance, banking, executive, ops, hiring, people management, revenue ownership, MBA roles
- medicineEducation: doctor, nurse, therapist, teacher, professor, trainer, counselor, healthcare practitioner
- legalPolitics: lawyer, paralegal, judge, politician, advocate, regulator, policy, government
- salesPr: sales, marketing, advertising, PR, growth, brand, account exec, pre-sales, customer-facing pipeline / quota / deal-closing roles, partner ecosystem growth
- artsDesign: designer, writer, performer, photographer, filmmaker, illustrator, musician — IC creative roles
- scienceEngineering: HANDS-ON technical work — software engineer, data engineer/scientist, researcher, devops, IT operator, technician, ML engineer, programmer who actually ships code or designs systems
- agriculture: farming, gardening, horticulture, environmental, nature work

DISAMBIGUATION FOR TECH-TITLED ROLES (the common trap):

A title with "Architect" / "Engineer" / "Specialist" / "Lead" is NOT automatically scienceEngineering. Look at WHAT THE ROLE DOES, not its label.

- "Solution Architect" / "Solution Lead" / "Solution Specialist" doing pre-sales, customer pitches, RFPs, designing solutions FOR DEALS → salesPr or business (depending on if they own pipeline / team)
- "Solution Architect" who actually builds + maintains systems, writes IaC, no commercial KPIs → scienceEngineering
- "Sales Engineer" / "Pre-Sales Engineer" / "Technical Account Manager" / "Customer Success Engineer" → salesPr
- "Engineering Manager" / "Tech Lead" doing people management, hiring, OKRs, headcount, performance reviews → business
- "Engineering Manager" who is a hands-on player-coach with no people management → scienceEngineering
- "VP / Director / Head of Engineering" / "CTO" → business
- "Product Manager" → business (closer to strategy/ownership) unless purely a designer-PM (artsDesign)

SIGNAL OVERRIDES — if these appear in the description, they override title keywords:

→ business signals: revenue, quota attainment %, KPI attainment %, P&L, hiring, "managing a team of N", "led a team of N", customer logos, upselling, partner growth, deal value, pipeline, GP (gross profit), account expansion, business development, strategy ownership, OKRs, headcount, "owned the X market/region", "drove X% growth"
→ salesPr signals: pipeline, quota, "concurrent opportunities", customer-facing pre-sales, partner co-sell, RFP, account exec activities, "exceeded quota", "growth %", pitched / closed / won deals, customer acquisition, brand campaigns, lead generation, marketing programs
→ scienceEngineering signals: shipped code, built feature, designed system (technical, no commercial outcome), implemented algorithm, deployed / scaled infra, debugged, refactored, migrated platform technically, programming language names ("Python/Go/Kubernetes/React"), ML/AI model building, data pipelines, technical research

If a role mixes technical AND commercial signals (very common in tech-sales), classify by what the role is MEASURED ON:
- Measured on revenue / KPI attainment / customer logos / partner activation → business or salesPr (pick whichever is closer; "led a team" → business, "individual contributor pipeline" → salesPr)
- Measured on system uptime / shipped features / latency reduction → scienceEngineering

Worked examples:
- "Azure Solution Lead. Leading Azure pre-sales architecture and solution sales… managing a team of Solution Architects. Achieved 341% FY26 attainment, delivered USD 1M+ in services GP, won 8 new customer logos." → business (team management + revenue + logos = business outcomes; "Solution" is just industry vertical)
- "Senior Solution Specialist – Microsoft Azure. Owned the Malaysia SMB Azure sales pipeline, 200+ concurrent opportunities, exceeded quota with 144% KPI attainment. Led pre-sales architecture guidance." → salesPr (IC pipeline + quota = sales outcome)
- "Solution Architect – Huawei Cloud. Achieved 217% partner activation KPI, contributed to 24% APAC SMB revenue growth through upselling and partner co-sell." → business (partner activation KPI + revenue growth + upselling = business outcomes)
- "Software Engineer at Stripe. Shipped a new payments retry service in Go, reduced failed-charge rate by 12%, owned the on-call rotation." → scienceEngineering (ships code, technical metric)

Output: JSON object only.`;

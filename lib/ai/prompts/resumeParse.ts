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

Rules:
- Order roles most-recent first.
- Use day=01 when only month/year are given.
- "current": true if endDate is "Present"/"Now"/missing for the latest role.
- Summary: 1-2 short sentences capturing what the role actually did. Lift from bullets, condense. Skip if there are no useful bullets.
- "vocation": pick the BEST single fit from the 7 fields based on title + summary:
  - business: management, ops, consulting, finance, banking, strategy, executive, MBA roles
  - medicineEducation: doctor, nurse, therapist, teacher, professor, trainer, counselor, healthcare
  - legalPolitics: lawyer, paralegal, judge, politician, advocate, regulator, policy, government
  - artsDesign: designer, writer, performer, photographer, filmmaker, illustrator, musician
  - salesPr: sales, marketing, advertising, PR, growth, brand, account exec
  - scienceEngineering: software engineer, data, researcher, scientist, engineer, devops, IT, architect, technician
  - agriculture: farming, gardening, horticulture, environmental, nature work
- If a role doesn't cleanly fit, pick the closest. Never invent extra fields. Never include education-only entries (school, university) — only employment / internship / freelance roles count.
- Skip purely volunteering rows unless they look professional.
- Cap at 12 roles.

Output: JSON object only.`;

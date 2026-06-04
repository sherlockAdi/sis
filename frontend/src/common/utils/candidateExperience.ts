export type CandidateExperienceEntry = {
  country?: string;
  organization: string;
  role: string;
  from: string;
  to: string;
};

export type CandidateExperienceValue = {
  national: CandidateExperienceEntry[];
  international: CandidateExperienceEntry[];
};

export const emptyExperience: CandidateExperienceValue = {
  national: [],
  international: [],
};

function cleanEntry(entry: Partial<CandidateExperienceEntry>): CandidateExperienceEntry | null {
  const out: CandidateExperienceEntry = {
    country: String(entry.country ?? "").trim(),
    organization: String(entry.organization ?? "").trim(),
    role: String(entry.role ?? "").trim(),
    from: String(entry.from ?? "").trim(),
    to: String(entry.to ?? "").trim(),
  };
  if (!out.country) delete out.country;
  if (!out.organization && !out.role && !out.from && !out.to && !out.country) return null;
  return out;
}

function cleanEntries(value: unknown, keepBlank = false): CandidateExperienceEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const cleaned = cleanEntry(entry as Partial<CandidateExperienceEntry>);
      if (cleaned || !keepBlank) return cleaned;
      return {
        country: String((entry as Partial<CandidateExperienceEntry>).country ?? "").trim() || undefined,
        organization: "",
        role: "",
        from: "",
        to: "",
      };
    })
    .filter((entry): entry is CandidateExperienceEntry => Boolean(entry));
}

export function parseCandidateExperience(value: string | null | undefined): CandidateExperienceValue {
  const raw = String(value ?? "").trim();
  if (!raw) return emptyExperience;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return {
        national: cleanEntries((parsed as any).national, true),
        international: cleanEntries((parsed as any).international, true),
      };
    }
  } catch {
    // Legacy plain text is handled below.
  }

  return {
    national: [{ organization: "", role: raw, from: "", to: "" }],
    international: [],
  };
}

export function serializeCandidateExperience(value: CandidateExperienceValue): string | null {
  const payload: CandidateExperienceValue = {
    national: cleanEntries(value.national),
    international: cleanEntries(value.international),
  };
  if (!payload.national.length && !payload.international.length) return null;
  return JSON.stringify(payload);
}

export function serializeCandidateExperienceDraft(value: CandidateExperienceValue): string {
  return JSON.stringify({
    national: Array.isArray(value.national) ? value.national : [],
    international: Array.isArray(value.international) ? value.international : [],
  });
}

function formatDate(value: string): string {
  const [year, month, day] = String(value ?? "").split("-");
  if (!year || !month || !day) return value;
  return `${day}-${month}-${year}`;
}

export function formatCandidateExperience(value: string | null | undefined): string {
  const parsed = parseCandidateExperience(value);
  const lines: string[] = [];

  const append = (label: string, entries: CandidateExperienceEntry[]) => {
    if (!entries.length) return;
    lines.push(label);
    for (const entry of entries) {
      const title = [entry.country, entry.organization, entry.role].filter(Boolean).join(" | ");
      const dates = [formatDate(entry.from), formatDate(entry.to)].filter(Boolean).join(" - ");
      lines.push(dates ? `${title} (${dates})` : title || "Experience");
    }
  };

  append("National", parsed.national);
  append("International", parsed.international);
  return lines.join("\n") || "-";
}

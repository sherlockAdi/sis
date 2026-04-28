export type CandidateProfileLike = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  passport_number?: string | null;
  country_id?: number | null;
  state_id?: number | null;
  city_id?: number | null;
  father_name?: string | null;
  address1?: string | null;
  pincode?: string | null;
  dob?: string | null;
  gender?: string | null;
  skills?: string | null;
  education?: string | null;
  experience?: string | null;
  industry_type?: string | null;
  resume_file_path?: string | null;
  passport_expiry_date?: string | null;
  passport_file_path?: string | null;
  aadhar_number?: string | null;
  aadhar_file_path?: string | null;
  pan_number?: string | null;
  pan_file_path?: string | null;
  voter_id_number?: string | null;
  voter_id_file_path?: string | null;
  profile_photo_file_path?: string | null;
  languages_known?: string | null;
};

const REQUIRED_FIELDS: Array<{ key: keyof CandidateProfileLike; label: string; kind?: "text" | "number" }> = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "phone", label: "Mobile" },
  { key: "email", label: "Email" },
  { key: "passport_number", label: "Passport Number" },
  { key: "country_id", label: "Country", kind: "number" },
  { key: "state_id", label: "State", kind: "number" },
  { key: "city_id", label: "City", kind: "number" },
  { key: "father_name", label: "Father's Name" },
  { key: "address1", label: "Address 1" },
  { key: "pincode", label: "Pincode" },
  { key: "dob", label: "Date of Birth" },
  { key: "gender", label: "Gender" },
  { key: "skills", label: "Skills" },
  { key: "education", label: "Education" },
  { key: "experience", label: "Experience" },
  { key: "industry_type", label: "Industry Type" },
  { key: "resume_file_path", label: "Resume Upload" },
  { key: "passport_expiry_date", label: "Passport Expiry Date" },
  { key: "passport_file_path", label: "Passport Upload" },
  { key: "aadhar_number", label: "Aadhar Number" },
  { key: "aadhar_file_path", label: "Aadhar Upload" },
  { key: "pan_number", label: "PAN Number" },
  { key: "pan_file_path", label: "PAN Upload" },
  { key: "voter_id_number", label: "Voter ID Number" },
  { key: "voter_id_file_path", label: "Voter ID Upload" },
  { key: "profile_photo_file_path", label: "Profile Photo" },
  { key: "languages_known", label: "Languages Known" },
];

function hasValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  const s = String(value).trim();
  if (!s) return false;
  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.length > 0;
    } catch {
      // fall through to plain string handling
    }
  }
  return s.length > 0;
}

export function getCandidateProfileMissingFields(candidate: CandidateProfileLike | null | undefined): string[] {
  if (!candidate) return REQUIRED_FIELDS.map((f) => f.label);
  const missing: string[] = [];
  for (const field of REQUIRED_FIELDS) {
    if (!hasValue(candidate[field.key])) missing.push(field.label);
  }
  return missing;
}

export function isCandidateProfileComplete(candidate: CandidateProfileLike | null | undefined): boolean {
  return getCandidateProfileMissingFields(candidate).length === 0;
}

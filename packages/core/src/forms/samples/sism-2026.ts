// The SISM 2026 registration forms as they exist today (features/registration/schema.ts and RegistrationForm.tsx),
// written in the definition format. Raw input: run it through formDefinitionSchema before use.
// The attendee form serves Forum Access and Self-Funded; the invitation form serves Invitation Letter.

// Copies of GENDERS and HEARD_FROM in features/registration/schema.ts (core must not import from the website); sism-2026.test.ts checks they match.
export const GENDERS = ["Female", "Male", "Another gender", "Prefer not to say"] as const;
export const HEARD_FROM = ["Social Media", "Google", "Word of Mouth", "Refer a Friend", "Past Participant", "Other"] as const;

const opts = (list: readonly string[]) => list.map((v) => ({ value: v, label: v }));

const terms = {
  key: "terms",
  type: "consent",
  label: "I agree to the",
  link: { text: "Terms and Conditions", href: "/terms-conditions" },
  required: true,
  errorMessage: "You need to agree to the Terms and Conditions",
} as const;

const fullName = {
  key: "fullName", type: "text", label: "Full name", required: true, minLength: 2, maxLength: 120, maps: "fullName",
  pattern: "^[^<>]*$", patternMessage: "Name must not contain < or >",
} as const;

export const attendeeFormSource = {
  formatVersion: 1,
  steps: [{
    id: "details",
    title: "Your details",
    fields: [
      fullName,
      { key: "email", type: "email", label: "Email address", required: true, maps: "email" },
      { key: "nationality", type: "country", label: "Nationality", required: true, maps: "nationality" },
      { key: "countryOfResidence", type: "country", label: "Country of residence", required: true, maps: "countryOfResidence" },
      { key: "whatsapp", type: "phone", label: "WhatsApp number", help: "Include country code, e.g. +60 12 345 6789", required: true, maps: "whatsapp" },
      { key: "gender", type: "select", label: "Gender", required: true, maps: "gender", options: opts(GENDERS) },
      { key: "heardFrom", type: "select", label: "How did you hear about this event?", options: opts(HEARD_FROM) },
      terms,
    ],
  }],
};

export const invitationFormSource = {
  formatVersion: 1,
  steps: [{
    id: "details",
    title: "Your details",
    fields: [
      fullName,
      { key: "email", type: "email", label: "Email address", required: true, maps: "email" },
      { key: "contactNumber", type: "phone", label: "Contact number", help: "Include country code, e.g. +60 12 345 6789", required: true },
      {
        key: "passportNumber", type: "text", label: "Passport number", required: true, sensitive: true, uppercase: true,
        help: "6 to 12 letters and digits (e.g. A12345678). Not stored after your letter is issued.",
        minLength: 6, maxLength: 12, pattern: "^[A-Z0-9]{6,12}$", patternMessage: "Passport numbers are 6 to 12 letters and digits",
      },
      { key: "nationality", type: "country", label: "Nationality", required: true, maps: "nationality" },
      terms,
    ],
  }],
};

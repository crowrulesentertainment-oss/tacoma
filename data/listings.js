
/*
 * CrowRules Community Hub — shared directory data
 * Public information only. No personal or sensitive data.
 *
 * Rules:
 * - Do not claim an entry is verified unless it has been reviewed.
 * - Keep lastChecked null until a human has actually checked it.
 * - Use null for unknown contact or accessibility information.
 * - Link to official sources whenever possible.
 */

window.CROW_RULES_LISTINGS = [
  {
    id: "wa211",
    name: "Washington 211",
    category: "resources",
    categoryLabel: "Resources & Assistance",
    serviceArea: "Washington State; check for Pierce County services",
    website: "https://wa211.org/",
    contact: {
      phone: null,
      email: null,
      address: null
    },
    accessibility: {
      status: "not-confirmed",
      notes: null
    },
    lastChecked: null,
    status: "starter",
    description:
      "A starting point for finding community services and assistance across Washington.",
    tags: ["community support", "referrals", "assistance"],
    notes: "Confirm program availability and eligibility with the provider."
  },
  {
    id: "city-of-tacoma",
    name: "City of Tacoma",
    category: "government",
    categoryLabel: "Government & Public Services",
    serviceArea: "Tacoma, Washington",
    website: "https://www.cityoftacoma.org/",
    contact: {
      phone: null,
      email: null,
      address: null
    },
    accessibility: {
      status: "not-confirmed",
      notes: null
    },
    lastChecked: null,
    status: "starter",
    description:
      "Official city website for municipal information and public services.",
    tags: ["government", "public services", "Tacoma"],
    notes: "Use the official website to locate the relevant city department."
  },
  {
    id: "pierce-county",
    name: "Pierce County",
    category: "government",
    categoryLabel: "Government & Public Services",
    serviceArea: "Pierce County, Washington",
    website: "https://www.piercecountywa.gov/",
    contact: {
      phone: null,
      email: null,
      address: null
    },
    accessibility: {
      status: "not-confirmed",
      notes: null
    },
    lastChecked: null,
    status: "starter",
    description:
      "Official county website for government information and public services.",
    tags: ["government", "county services", "Pierce County"],
    notes: "Confirm specific services and office details with the county."
  },
  {
    id: "tacoma-public-library",
    name: "Tacoma Public Library",
    category: "education",
    categoryLabel: "Schools & Education",
    serviceArea: "Tacoma, Washington",
    website: "https://www.tacomalibrary.org/",
    contact: {
      phone: null,
      email: null,
      address: null
    },
    accessibility: {
      status: "not-confirmed",
      notes: null
    },
    lastChecked: null,
    status: "starter",
    description:
      "Library system website for locations, collections, programs, and events.",
    tags: ["library", "learning", "community programs"],
    notes: "Check the official site for current branch hours and program details."
  },
  {
    id: "tacoma-community-college",
    name: "Tacoma Community College",
    category: "education",
    categoryLabel: "Schools & Education",
    serviceArea: "Tacoma and surrounding communities",
    website: "https://www.tacomacc.edu/",
    contact: {
      phone: null,
      email: null,
      address: null
    },
    accessibility: {
      status: "not-confirmed",
      notes: null
    },
    lastChecked: null,
    status: "starter",
    description:
      "College website for academic programs, admissions, and student services.",
    tags: ["college", "education", "career training"],
    notes: "Check the official site for program availability and admissions information."
  },
  {
    id: "worksource-washington",
    name: "WorkSource Washington",
    category: "jobs",
    categoryLabel: "Jobs & Careers",
    serviceArea: "Washington State; check for local Pierce County services",
    website: "https://worksourcewa.com/",
    contact: {
      phone: null,
      email: null,
      address: null
    },
    accessibility: {
      status: "not-confirmed",
      notes: null
    },
    lastChecked: null,
    status: "starter",
    description:
      "Starting point for workforce resources, employment services, and career exploration.",
    tags: ["jobs", "employment", "career services"],
    notes: "Confirm local office details and available services through the official site."
  }
];

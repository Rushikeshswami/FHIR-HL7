// FHIR 5-Day Learn + Sat Revision + Sun Project Curriculum
// All challenges are validated 100% client-side.

export const CURRICULUM = [
  // ============================== DAY 1 — MON ==============================
  {
    day: 1, dayLabel: 'Mon', kind: 'learn',
    title: 'FHIR Foundations + Data Type Grammar',
    tagline: 'REST + Resources + the 5 complex types that touch every payload.',
    concepts: [
      'FHIR = Fast Healthcare Interoperability Resources. R4 (4.0.1) is the production baseline; R5 is normative for many resources.',
      'Atomic unit = Resource → resourceType + id + meta + typed elements. Wire formats: JSON (default), XML, RDF.',
      'RESTful verbs: GET (read/search), POST (create), PUT (update by id), PATCH (partial), DELETE.',
      'Endpoints: /Patient/123, /Observation?subject=Patient/123&code=8480-6, /Patient/_history/2, /metadata (CapabilityStatement).',
      'Bundle types: searchset, transaction, batch, document, message, collection. transaction = ACID; batch = independent ops.',
      'Complex types you will write daily: CodeableConcept, Coding, Identifier, Reference, Period, Quantity, HumanName, Address.',
      'CodeableConcept = { coding[]: { system, code, display }, text }. Multi-system crosswalks live in coding[].',
      'Reference: { reference: "Patient/123", display? }. Use urn:uuid:xxx inside transaction Bundles.',
      'Quantity: { value, unit, system: "http://unitsofmeasure.org", code } — UCUM is mandatory.',
    ],
    accordions: [
      { title: 'HTTP verb → FHIR interaction map', body: [
        'read   → GET   [base]/[Type]/[id]',
        'vread  → GET   [base]/[Type]/[id]/_history/[vid]',
        'update → PUT   [base]/[Type]/[id]   (full replace; body has id)',
        'patch  → PATCH [base]/[Type]/[id]   (JSON Patch / FHIRPath Patch)',
        'delete → DELETE [base]/[Type]/[id]',
        'create → POST  [base]/[Type]',
        'search → GET   [base]/[Type]?param=value',
        'caps   → GET   [base]/metadata',
        'txn    → POST  [base]   (Bundle.type=transaction)',
      ]},
      { title: 'Identifier vs id — never confuse', body: [
        'Resource.id = technical, server-assigned. One per resource. Appears in URL /Type/{id}.',
        'Resource.identifier = business identifier (MRN, NPI, SSN) from an external authority. system+value mandatory.',
        'Search by identifier: GET /Patient?identifier=http://hospital.org/mrn|998877',
      ]},
      { title: 'CodeableConcept anatomy', body: [
        'system: canonical URL (http://loinc.org, http://snomed.info/sct, http://www.nlm.nih.gov/research/umls/rxnorm)',
        'code: terminology code (8480-6, 44054006)',
        'display: human label',
        'text: fallback when terminology unavailable',
        'Multiple codings allowed for cross-walks (LOINC + SNOMED + ICD-10).',
      ]},
      { title: 'UCUM Quantity examples', body: [
        'BP    → { value: 120, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" }',
        'Weight→ { value: 72.5, unit: "kg",  system: "http://unitsofmeasure.org", code: "kg" }',
        'Rate  → { value: 76,  unit: "/min", system: "http://unitsofmeasure.org", code: "/min" }',
        'Glucose→ code "mmol/L" or "mg/dL"',
      ]},
    ],
    payloads: [
      { label: 'Minimal Patient (R4)', json: {
        resourceType: 'Patient', id: 'pat-001',
        identifier: [{ system: 'http://hospital.smarthealthit.org', value: 'MRN-998877' }],
        active: true, name: [{ use: 'official', family: 'Iyer', given: ['Anand'] }],
        gender: 'male', birthDate: '1989-04-12',
      }},
      { label: 'CodeableConcept multi-system (T2DM)', json: {
        coding: [
          { system: 'http://snomed.info/sct', code: '44054006', display: 'Diabetes mellitus type 2' },
          { system: 'http://hl7.org/fhir/sid/icd-10-cm', code: 'E11.9', display: 'Type 2 DM w/o complications' },
        ], text: 'Type 2 Diabetes Mellitus',
      }},
    ],
    challenges: [
      {
        id: 'd1c1', title: 'Write a minimal Patient',
        prompt: 'Build a FHIR R4 Patient JSON for female "Priya Nair", born 1992-08-19, identifier MRN-554433 from system http://example.org/mrn. Must include resourceType, identifier (system+value), name (family+given), gender, birthDate.',
        validator: {
          type: 'json',
          requiredKeys: ['resourceType', 'identifier', 'name', 'gender', 'birthDate'],
          equals: { resourceType: 'Patient', gender: 'female', birthDate: '1992-08-19' },
          regex: [
            { path: 'identifier.0.system', pattern: 'example\\.org/mrn' },
            { path: 'identifier.0.value', pattern: '^MRN-554433$' },
            { path: 'name.0.family', pattern: '^Nair$' },
          ],
          containsAny: [{ path: 'name.0.given', any: ['Priya'] }],
        },
        template: {
          resourceType: 'Patient',
          identifier: [{ system: 'http://example.org/mrn', value: 'MRN-554433' }],
          name: [{ use: 'official', family: 'Nair', given: ['Priya'] }],
          gender: 'female', birthDate: '1992-08-19',
        },
        notes: ['identifier and name are ARRAYS even for one entry.', 'gender code: male|female|other|unknown.', 'birthDate: YYYY-MM-DD'],
      },
      {
        id: 'd1c2', title: 'CodeableConcept for Hypertension',
        prompt: 'Build a single CodeableConcept for "Essential (primary) hypertension" with TWO codings — LOINC 59621-6 + ICD-10-CM I10 — plus text "Hypertension".',
        validator: {
          type: 'json',
          requiredKeys: ['coding', 'text'],
          regex: [{ path: 'text', pattern: 'Hypertension' }],
          codingMatch: [
            { system: 'http://loinc.org', code: '59621-6' },
            { system: 'http://hl7.org/fhir/sid/icd-10-cm', code: 'I10' },
          ],
        },
        template: {
          coding: [
            { system: 'http://loinc.org', code: '59621-6', display: 'Blood pressure systolic and diastolic' },
            { system: 'http://hl7.org/fhir/sid/icd-10-cm', code: 'I10', display: 'Essential (primary) hypertension' },
          ], text: 'Hypertension',
        },
        notes: ['coding is ARRAY — list multiple terminologies.', 'system must be canonical URI.', 'text is the human fallback.'],
      },
    ],
  },

  // ============================== DAY 2 — TUE ==============================
  {
    day: 2, dayLabel: 'Tue', kind: 'learn',
    title: 'Maturity Levels + Patient / Practitioner / Organization',
    tagline: 'The admin spine. FMM tells you what is safe to depend on.',
    concepts: [
      'FHIR Maturity Model (FMM 0–5): 0=Draft, 1=Trial Use, 2=Tested multi-impl, 3=Multi-Connectathon, 4=5+ independent impls, 5=Normative (BC guaranteed).',
      'R4 maturity snapshot: Patient FMM5, Observation FMM5, AllergyIntolerance FMM4, Condition FMM3, Practitioner FMM3, Encounter FMM2, CarePlan FMM2.',
      'Admin spine: Patient, Practitioner, Organization, Location, HealthcareService, PractitionerRole.',
      'PractitionerRole binds Practitioner ⇄ Organization with specialty + location + period. Use it when context matters in workflow.',
      'Patient must-haves: identifier (MRN), name, gender, birthDate. US Core adds race/ethnicity/birthsex extensions (mandatory).',
      'Practitioner identifier system for NPI: http://hl7.org/fhir/sid/us-npi',
      'Organization identifier for NPI-org: same us-npi system; type[] uses http://terminology.hl7.org/CodeSystem/organization-type.',
    ],
    accordions: [
      { title: 'Patient — high-yield fields', body: [
        'identifier[*], active, name[*], telecom[*] (phone|email|fax|sms), gender, birthDate',
        'deceasedBoolean | deceasedDateTime, address[*], maritalStatus (CodeableConcept)',
        'communication[*].language, generalPractitioner[*] (Reference), managingOrganization (Reference Organization)',
        'US Core adds extensions: us-core-race, us-core-ethnicity, us-core-birthsex',
      ]},
      { title: 'Practitioner vs PractitionerRole', body: [
        'Practitioner = the HUMAN. name, NPI in identifier, qualification[] (license info).',
        'PractitionerRole = THIS practitioner AT THIS org doing THIS specialty during THIS period.',
        'Always reference PractitionerRole when org/location/specialty matters.',
      ]},
      { title: 'Organization fields', body: [
        'identifier (NPI-org, tax id), active, type[] (CodeableConcept), name, alias[]',
        'telecom[], address[], partOf (Reference Organization), contact[], endpoint[]',
      ]},
      { title: 'Maturity quick-lookup (R4)', body: [
        'Patient FMM 5 · Observation FMM 5 · AllergyIntolerance FMM 4',
        'Condition FMM 3 · MedicationRequest FMM 3 · Practitioner FMM 3 · Organization FMM 3',
        'Encounter FMM 2 · CarePlan FMM 2',
      ]},
    ],
    payloads: [
      { label: 'Practitioner with NPI + qualification', json: {
        resourceType: 'Practitioner', id: 'prac-9001',
        identifier: [{ system: 'http://hl7.org/fhir/sid/us-npi', value: '1234567893' }],
        active: true,
        name: [{ family: 'Sharma', given: ['Neha'], prefix: ['Dr.'] }],
        telecom: [{ system: 'email', value: 'neha.sharma@clinic.org', use: 'work' }],
        qualification: [{ code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0360', code: 'MD', display: 'Doctor of Medicine' }] }, period: { start: '2014-06-01' } }],
      }},
    ],
    challenges: [
      {
        id: 'd2c1', title: 'Practitioner with NPI + MD qualification',
        prompt: 'Build a Practitioner for "Dr. Ravi Menon", NPI 1987654321 (system http://hl7.org/fhir/sid/us-npi), active=true, work email ravi.menon@hospital.org, qualification code MD from system http://terminology.hl7.org/CodeSystem/v2-0360.',
        validator: {
          type: 'json',
          requiredKeys: ['resourceType', 'identifier', 'name', 'active', 'qualification'],
          equals: { resourceType: 'Practitioner', active: true },
          regex: [
            { path: 'identifier.0.system', pattern: 'us-npi' },
            { path: 'identifier.0.value', pattern: '^1987654321$' },
            { path: 'name.0.family', pattern: '^Menon$' },
          ],
          codingMatch: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0360', code: 'MD' }],
        },
        template: {
          resourceType: 'Practitioner', active: true,
          identifier: [{ system: 'http://hl7.org/fhir/sid/us-npi', value: '1987654321' }],
          name: [{ family: 'Menon', given: ['Ravi'], prefix: ['Dr.'] }],
          telecom: [{ system: 'email', value: 'ravi.menon@hospital.org', use: 'work' }],
          qualification: [{ code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0360', code: 'MD' }] } }],
        },
        notes: ['NPI canonical: http://hl7.org/fhir/sid/us-npi', 'qualification.code is CodeableConcept (wrap in coding[]).'],
      },
      {
        id: 'd2c2', title: 'Organization (hospital department)',
        prompt: 'Build an Organization "Apollo Cardiology Department", active=true, type code "dept" from system http://terminology.hl7.org/CodeSystem/organization-type, identifier system http://apollo.org/org value APL-CARD-01.',
        validator: {
          type: 'json',
          requiredKeys: ['resourceType', 'active', 'type', 'name', 'identifier'],
          equals: { resourceType: 'Organization', active: true },
          regex: [
            { path: 'name', pattern: 'Apollo' },
            { path: 'identifier.0.value', pattern: '^APL-CARD-01$' },
          ],
          codingMatch: [{ system: 'http://terminology.hl7.org/CodeSystem/organization-type', code: 'dept' }],
        },
        template: {
          resourceType: 'Organization', active: true,
          identifier: [{ system: 'http://apollo.org/org', value: 'APL-CARD-01' }],
          type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/organization-type', code: 'dept', display: 'Hospital Department' }] }],
          name: 'Apollo Cardiology Department',
        },
        notes: ['type is ARRAY of CodeableConcept.', 'organization-type ValueSet codes: prov, dept, team, govt, ins, pay, edu, reli, crs, cg, bus, other.'],
      },
    ],
  },

  // ============================== DAY 3 — WED ==============================
  {
    day: 3, dayLabel: 'Wed', kind: 'learn',
    title: 'Clinical Core: Encounter + Observation',
    tagline: 'The two resources behind 80% of real-world traffic.',
    concepts: [
      'Encounter status: planned|arrived|triaged|in-progress|onleave|finished|cancelled. class is Coding (NOT CodeableConcept).',
      'Encounter.class system: http://terminology.hl7.org/CodeSystem/v3-ActCode → AMB, EMER, IMP, ACUTE, NONAC, OBSENC, PRENC, HH, VR.',
      'Observation must-have: status, code (CodeableConcept), subject. US Core adds category + effective[x].',
      'effective[x] polymorphic: effectiveDateTime | effectivePeriod | effectiveTiming | effectiveInstant.',
      'value[x] polymorphic: valueQuantity | valueCodeableConcept | valueString | valueBoolean | valueInteger | valueRange | valueRatio | valuePeriod.',
      'BP is the canonical component[] use-case — ONE Observation with TWO components (8480-6 systolic, 8462-4 diastolic).',
      'category system: http://terminology.hl7.org/CodeSystem/observation-category → vital-signs, laboratory, social-history, imaging, procedure, survey, exam, therapy, activity.',
    ],
    accordions: [
      { title: 'Encounter.class v3-ActCode quick map', body: [
        'AMB   — ambulatory (outpatient)',
        'EMER  — emergency',
        'IMP   — inpatient',
        'ACUTE — inpatient acute',
        'NONAC — inpatient non-acute',
        'OBSENC— observation encounter',
        'PRENC — pre-admission',
        'SS    — short stay',
        'VR    — virtual',
        'HH    — home health',
      ]},
      { title: 'Vital sign LOINC cheat sheet', body: [
        '85354-9 BP panel · 8480-6 Systolic · 8462-4 Diastolic',
        '8867-4  Heart rate · 9279-1  Respiratory rate',
        '8310-5  Temperature · 29463-7 Weight · 8302-2 Height',
        '39156-5 BMI · 2708-6 SpO2',
      ]},
      { title: 'Observation rules of thumb', body: [
        'Single value → valueQuantity at root.',
        'Inseparable paired values (BP, ratios) → component[] with own code+value.',
        'Repeating panel members (CBC, lipid panel) → DiagnosticReport.result[] references Observations.',
      ]},
    ],
    payloads: [
      { label: 'Encounter (outpatient finished)', json: {
        resourceType: 'Encounter', id: 'enc-001', status: 'finished',
        class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
        subject: { reference: 'Patient/pat-001' },
        participant: [{ individual: { reference: 'Practitioner/prac-9001' } }],
        period: { start: '2025-06-15T09:00:00+05:30', end: '2025-06-15T09:45:00+05:30' },
      }},
      { label: 'BP Observation with component[]', json: {
        resourceType: 'Observation', status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
        code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }] },
        subject: { reference: 'Patient/pat-001' },
        effectiveDateTime: '2025-06-15T09:30:00+05:30',
        component: [
          { code: { coding: [{ system: 'http://loinc.org', code: '8480-6' }] }, valueQuantity: { value: 128, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } },
          { code: { coding: [{ system: 'http://loinc.org', code: '8462-4' }] }, valueQuantity: { value: 82,  unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } },
        ],
      }},
    ],
    challenges: [
      {
        id: 'd3c1', title: 'Ambulatory finished Encounter',
        prompt: 'Build an Encounter, status=finished, class=AMB (v3-ActCode), subject=Patient/pat-555, period start 2025-06-20T10:00:00Z end 2025-06-20T10:30:00Z.',
        validator: {
          type: 'json',
          requiredKeys: ['resourceType', 'status', 'class', 'subject', 'period'],
          equals: { resourceType: 'Encounter', status: 'finished' },
          regex: [
            { path: 'subject.reference', pattern: '^Patient/pat-555$' },
            { path: 'period.start', pattern: '^2025-06-20T10:00:00Z$' },
            { path: 'period.end', pattern: '^2025-06-20T10:30:00Z$' },
            { path: 'class.system', pattern: 'v3-ActCode' },
            { path: 'class.code', pattern: '^AMB$' },
          ],
        },
        template: {
          resourceType: 'Encounter', status: 'finished',
          class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
          subject: { reference: 'Patient/pat-555' },
          period: { start: '2025-06-20T10:00:00Z', end: '2025-06-20T10:30:00Z' },
        },
        notes: ['class is a SINGLE Coding object (no coding[] wrapper).', 'period.start and period.end are dateTime.'],
      },
      {
        id: 'd3c2', title: 'Heart rate Observation',
        prompt: 'Observation: heart rate 76 /min for Patient/pat-555, status=final, category=vital-signs, LOINC 8867-4, effectiveDateTime=2025-06-20T10:15:00Z, UCUM code "/min".',
        validator: {
          type: 'json',
          requiredKeys: ['resourceType', 'status', 'category', 'code', 'subject', 'effectiveDateTime'],
          equals: { resourceType: 'Observation', status: 'final', effectiveDateTime: '2025-06-20T10:15:00Z' },
          regex: [{ path: 'subject.reference', pattern: '^Patient/pat-555$' }],
          codingMatch: [
            { system: 'http://loinc.org', code: '8867-4' },
            { system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' },
          ],
          quantityMatch: { path: 'valueQuantity', value: 76, code: '/min' },
        },
        template: {
          resourceType: 'Observation', status: 'final',
          category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
          code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
          subject: { reference: 'Patient/pat-555' },
          effectiveDateTime: '2025-06-20T10:15:00Z',
          valueQuantity: { value: 76, unit: '/min', system: 'http://unitsofmeasure.org', code: '/min' },
        },
        notes: ['UCUM beats-per-min code is literally "/min".', 'category code must be "vital-signs" exact.'],
      },
      {
        id: 'd3c3', title: 'BP with component[] pattern',
        prompt: 'Build a BP Observation: 132/86 mmHg, Patient/pat-555, status=final, panel code LOINC 85354-9. Components: 8480-6 systolic + 8462-4 diastolic, UCUM mm[Hg].',
        validator: {
          type: 'json',
          requiredKeys: ['resourceType', 'status', 'code', 'subject', 'component'],
          equals: { resourceType: 'Observation', status: 'final' },
          codingMatch: [
            { system: 'http://loinc.org', code: '85354-9' },
            { system: 'http://loinc.org', code: '8480-6' },
            { system: 'http://loinc.org', code: '8462-4' },
          ],
          regex: [{ path: 'subject.reference', pattern: '^Patient/pat-555$' }],
          componentMatch: [
            { code: '8480-6', value: 132, ucum: 'mm[Hg]' },
            { code: '8462-4', value: 86,  ucum: 'mm[Hg]' },
          ],
        },
        template: {
          resourceType: 'Observation', status: 'final',
          code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }] },
          subject: { reference: 'Patient/pat-555' },
          component: [
            { code: { coding: [{ system: 'http://loinc.org', code: '8480-6' }] }, valueQuantity: { value: 132, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } },
            { code: { coding: [{ system: 'http://loinc.org', code: '8462-4' }] }, valueQuantity: { value: 86,  unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } },
          ],
        },
        notes: ['component is ARRAY — each element has its own code + valueQuantity.', 'Top-level code is the PANEL (85354-9).'],
      },
    ],
  },

  // ============================== DAY 4 — THU ==============================
  {
    day: 4, dayLabel: 'Thu', kind: 'learn',
    title: 'Condition + MedicationRequest + AllergyIntolerance',
    tagline: 'Diagnosis + therapy + safety. The triad behind every chart.',
    concepts: [
      'Condition: clinicalStatus (active|recurrence|relapse|inactive|remission|resolved), verificationStatus (unconfirmed|provisional|differential|confirmed|refuted|entered-in-error).',
      'Condition.category system: http://terminology.hl7.org/CodeSystem/condition-category → problem-list-item, encounter-diagnosis.',
      'Condition.code → SNOMED CT preferred (http://snomed.info/sct), ICD-10-CM acceptable (http://hl7.org/fhir/sid/icd-10-cm).',
      'MedicationRequest: status (active|on-hold|cancelled|completed|stopped|draft), intent (proposal|plan|order|original-order|reflex-order|filler-order|instance-order|option).',
      'MedicationRequest.medication → medicationCodeableConcept (RxNorm) OR medicationReference (Reference Medication).',
      'RxNorm canonical: http://www.nlm.nih.gov/research/umls/rxnorm',
      'AllergyIntolerance: type=allergy|intolerance, category=food|medication|environment|biologic, criticality=low|high|unable-to-assess.',
      'reaction[].severity (mild|moderate|severe) is independent of top-level criticality.',
    ],
    accordions: [
      { title: 'Condition status state machine', body: [
        'clinicalStatus = LIFECYCLE (is the disease active now?)',
        'verificationStatus = CERTAINTY (do we believe the diagnosis?)',
        'Confirmed active T2DM → clinicalStatus=active + verificationStatus=confirmed',
        'Ruled out problem → verificationStatus=refuted',
        'Both are CodeableConcept — wrap codes in coding[].',
      ]},
      { title: 'dosageInstruction breakdown', body: [
        'text — free-text human readable',
        'timing.repeat: { frequency, period, periodUnit } → "BID" = frequency=2, period=1, periodUnit="d"',
        'route — CodeableConcept (oral 26643006, IV 47625008, IM 78421000, SC 34206005)',
        'doseAndRate.doseQuantity → { value, unit, system, code }',
        'asNeededBoolean — PRN flag',
      ]},
      { title: 'AllergyIntolerance system URLs', body: [
        'clinicalStatus system: http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
        'verificationStatus system: http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
        'Substance code: SNOMED CT or RxNorm',
      ]},
    ],
    payloads: [
      { label: 'MedicationRequest — Metformin 500mg BID PO', json: {
        resourceType: 'MedicationRequest', status: 'active', intent: 'order',
        medicationCodeableConcept: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '860975', display: 'Metformin hydrochloride 500 MG Oral Tablet' }] },
        subject: { reference: 'Patient/pat-001' },
        authoredOn: '2025-06-12',
        dosageInstruction: [{
          text: '500 mg orally twice daily',
          timing: { repeat: { frequency: 2, period: 1, periodUnit: 'd' } },
          route: { coding: [{ system: 'http://snomed.info/sct', code: '26643006', display: 'Oral route' }] },
          doseAndRate: [{ doseQuantity: { value: 500, unit: 'mg', system: 'http://unitsofmeasure.org', code: 'mg' } }],
        }],
      }},
    ],
    challenges: [
      {
        id: 'd4c1', title: 'Condition: confirmed active Hypertension',
        prompt: 'Condition: clinicalStatus=active, verificationStatus=confirmed, SNOMED 38341003 (Hypertensive disorder), Patient/pat-777, onsetDateTime=2023-04-10, category=problem-list-item.',
        validator: {
          type: 'json',
          requiredKeys: ['resourceType', 'clinicalStatus', 'verificationStatus', 'code', 'subject'],
          equals: { resourceType: 'Condition' },
          regex: [
            { path: 'subject.reference', pattern: '^Patient/pat-777$' },
            { path: 'onsetDateTime', pattern: '^2023-04-10$' },
          ],
          codingMatch: [
            { system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' },
            { system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' },
            { system: 'http://snomed.info/sct', code: '38341003' },
            { system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'problem-list-item' },
          ],
        },
        template: {
          resourceType: 'Condition',
          clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
          verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' }] },
          category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'problem-list-item' }] }],
          code: { coding: [{ system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertensive disorder' }] },
          subject: { reference: 'Patient/pat-777' },
          onsetDateTime: '2023-04-10',
        },
        notes: ['clinicalStatus and verificationStatus are CodeableConcepts.', 'category is ARRAY.'],
      },
      {
        id: 'd4c2', title: 'MedicationRequest: Lisinopril 10mg OD',
        prompt: 'MedicationRequest: status=active, intent=order, RxNorm 314076 (Lisinopril 10 MG Oral Tablet), Patient/pat-777, authoredOn=2025-06-20, dosage "10 mg orally once daily" with timing freq=1 period=1 periodUnit=d, oral route SNOMED 26643006, dose 10 mg.',
        validator: {
          type: 'json',
          requiredKeys: ['resourceType', 'status', 'intent', 'subject', 'dosageInstruction'],
          equals: { resourceType: 'MedicationRequest', status: 'active', intent: 'order', authoredOn: '2025-06-20' },
          regex: [{ path: 'subject.reference', pattern: '^Patient/pat-777$' }],
          codingMatch: [
            { system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '314076' },
            { system: 'http://snomed.info/sct', code: '26643006' },
          ],
        },
        template: {
          resourceType: 'MedicationRequest', status: 'active', intent: 'order', authoredOn: '2025-06-20',
          medicationCodeableConcept: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '314076', display: 'Lisinopril 10 MG Oral Tablet' }] },
          subject: { reference: 'Patient/pat-777' },
          dosageInstruction: [{
            text: '10 mg orally once daily',
            timing: { repeat: { frequency: 1, period: 1, periodUnit: 'd' } },
            route: { coding: [{ system: 'http://snomed.info/sct', code: '26643006', display: 'Oral route' }] },
            doseAndRate: [{ doseQuantity: { value: 10, unit: 'mg', system: 'http://unitsofmeasure.org', code: 'mg' } }],
          }],
        },
        notes: ['intent=order means signed by prescriber.', 'authoredOn is date type (YYYY-MM-DD).'],
      },
      {
        id: 'd4c3', title: 'AllergyIntolerance: Penicillin (high criticality)',
        prompt: 'AllergyIntolerance: clinicalStatus=active, verificationStatus=confirmed, type=allergy, category includes "medication", criticality=high, substance code SNOMED 387517004 (Paracetamol-no wait) → use Penicillin V SNOMED 7980 (system http://snomed.info/sct), patient=Patient/pat-777.',
        validator: {
          type: 'json',
          requiredKeys: ['resourceType', 'clinicalStatus', 'verificationStatus', 'type', 'category', 'criticality', 'code', 'patient'],
          equals: { resourceType: 'AllergyIntolerance', type: 'allergy', criticality: 'high' },
          regex: [{ path: 'patient.reference', pattern: '^Patient/pat-777$' }],
          containsAny: [{ path: 'category', any: ['medication'] }],
          codingMatch: [
            { system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' },
            { system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', code: 'confirmed' },
            { system: 'http://snomed.info/sct', code: '7980' },
          ],
        },
        template: {
          resourceType: 'AllergyIntolerance',
          clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }] },
          verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', code: 'confirmed' }] },
          type: 'allergy', category: ['medication'], criticality: 'high',
          code: { coding: [{ system: 'http://snomed.info/sct', code: '7980', display: 'Penicillin V' }] },
          patient: { reference: 'Patient/pat-777' },
        },
        notes: ['category is array of code strings (NOT CodeableConcept).', 'patient is the reference (not "subject") for AllergyIntolerance.'],
      },
    ],
  },

  // ============================== DAY 5 — FRI ==============================
  {
    day: 5, dayLabel: 'Fri', kind: 'learn',
    title: 'Search, US Core Profiles, SMART on FHIR + Bulk Data',
    tagline: 'Production toolbox: query, conform, auth, scale.',
    concepts: [
      'Search params per resource → string, token (system|code), reference, date, quantity, uri, composite.',
      'Modifiers: :exact, :contains, :missing, :not, :in, :not-in, :below, :above, :identifier.',
      'Token search with system: code=http://loinc.org|8867-4   (pipe separates system from code)',
      'Date prefixes: eq|ne|gt|lt|ge|le|sa|eb|ap   →  date=ge2025-01-01',
      'Chained: /Observation?subject.identifier=http://hospital.org/mrn|998877',
      '_include / _revinclude pull related resources into searchset Bundle.',
      'US Core (HL7 USA Realm) is ONC-mandated baseline. v6.1+ aligned with USCDI v3.',
      'SMART on FHIR = OAuth2/OIDC profile. Standalone Launch (auth code + PKCE) for user apps; Backend Services (signed JWT) for system-to-system.',
      'Bulk Data $export → async kickoff (202 + Content-Location), poll status, fetch NDJSON files per resource type.',
      'OperationOutcome is returned on 4xx/5xx — issue[].severity + code + diagnostics + location[].',
    ],
    accordions: [
      { title: 'US Core (v6+) must-support resources', body: [
        'Patient, Practitioner, PractitionerRole, Organization, Location',
        'Encounter, Condition, Procedure, ServiceRequest',
        'Observation: Lab / Vital Signs / Smoking Status / SDOH / Pregnancy / Sexual Orientation',
        'Immunization, AllergyIntolerance, MedicationRequest, Medication',
        'CarePlan, CareTeam, Goal, DocumentReference, DiagnosticReport',
        'Provenance, RelatedPerson, QuestionnaireResponse, Coverage',
        'Mandatory Patient extensions: us-core-race, us-core-ethnicity, us-core-birthsex',
      ]},
      { title: 'SMART Standalone Launch (Auth Code + PKCE)', body: [
        '1. GET /.well-known/smart-configuration → authorization_endpoint + token_endpoint',
        '2. Browser → /authorize?response_type=code&client_id=...&redirect_uri=...&scope=...&state=...&aud=<fhir-base>&code_challenge=...&code_challenge_method=S256',
        '3. User consents → 302 redirect_uri?code=...&state=...',
        '4. POST /token grant_type=authorization_code, code, redirect_uri, client_id, code_verifier',
        '5. Receive access_token (+ id_token + refresh_token + patient context)',
        '6. Bearer-auth every FHIR request',
      ]},
      { title: 'Bulk Data $export kickoff', body: [
        '1. POST /token (backend-services JWT) → access_token (scope system/*.read)',
        '2. GET [base]/Patient/$export?_type=Patient,Observation&_since=2025-01-01',
        '   Headers: Prefer: respond-async + Accept: application/fhir+json + Authorization: Bearer ...',
        '3. 202 + Content-Location: <statusUrl>',
        '4. Poll statusUrl until 200 with output[] manifest (url + type)',
        '5. GET each output URL → NDJSON streams',
        '6. DELETE statusUrl to cleanup',
      ]},
      { title: 'Extension pattern', body: [
        'Simple:   extension: [{ url: "...us-core-birthsex", valueCode: "F" }]',
        'Complex:  extension: [{ url: "...us-core-race", extension: [{ url: "ombCategory", valueCoding: {...} }, { url: "text", valueString: "Asian" }] }]',
        'Canonical URL is the identity; valueX matches declared type.',
      ]},
    ],
    payloads: [
      { label: 'OperationOutcome (4xx response)', json: {
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'invariant', diagnostics: 'Patient.identifier.system must be a valid URI', location: ['Patient.identifier[0].system'] }],
      }},
      { label: 'US Core Patient with mandatory extensions', json: {
        resourceType: 'Patient',
        extension: [
          { url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race', extension: [
            { url: 'ombCategory', valueCoding: { system: 'urn:oid:2.16.840.1.113883.6.238', code: '2028-9', display: 'Asian' } },
            { url: 'text', valueString: 'Asian' },
          ]},
          { url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex', valueCode: 'F' },
        ],
        identifier: [{ system: 'http://hospital.org/mrn', value: '998877' }],
        name: [{ family: 'Doe', given: ['Jane'] }],
        gender: 'female', birthDate: '1985-03-22',
      }},
    ],
    challenges: [
      {
        id: 'd5c1', title: 'FHIR search URL',
        prompt: 'Write the FULL FHIR search URL (string only) to fetch Observations for Patient pat-555 with LOINC 8867-4 dated on/after 2025-01-01, AND _include the linked Patient. Base: https://api.example.org/fhir',
        validator: {
          type: 'text',
          regexAll: [
            '^https://api\\.example\\.org/fhir/Observation\\?',
            'subject=Patient/pat-555',
            'code=(http://loinc\\.org\\|)?8867-4',
            'date=ge2025-01-01',
            '_include=Observation:(subject|patient)',
          ],
        },
        template: 'https://api.example.org/fhir/Observation?subject=Patient/pat-555&code=http://loinc.org|8867-4&date=ge2025-01-01&_include=Observation:subject',
        notes: ['Token search: code=system|code (pipe separator).', 'Date prefix ge = greater or equal.', '_include format: ResourceType:searchParam'],
      },
      {
        id: 'd5c2', title: 'OperationOutcome (missing birthDate)',
        prompt: 'OperationOutcome JSON with one issue: severity=error, code=required, diagnostics text containing "missing", location array containing "Patient.birthDate".',
        validator: {
          type: 'json',
          requiredKeys: ['resourceType', 'issue'],
          equals: { resourceType: 'OperationOutcome' },
          regex: [
            { path: 'issue.0.severity', pattern: '^error$' },
            { path: 'issue.0.code', pattern: '^required$' },
            { path: 'issue.0.diagnostics', pattern: 'missing' },
            { path: 'issue.0.location.0', pattern: '^Patient\\.birthDate$' },
          ],
        },
        template: { resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'required', diagnostics: 'Patient.birthDate is missing', location: ['Patient.birthDate'] }] },
        notes: ['issue is ARRAY.', 'severity: fatal | error | warning | information', 'code: required | invariant | structure | value | code-invalid | not-supported | conflict'],
      },
      {
        id: 'd5c3', title: 'US Core Patient with race + birthsex',
        prompt: 'Build a Patient with us-core-race extension (ombCategory coding 2028-9 system urn:oid:2.16.840.1.113883.6.238, text "Asian") AND us-core-birthsex extension valueCode="F". gender=female, identifier system http://hospital.org/mrn value 998877.',
        validator: {
          type: 'json',
          requiredKeys: ['resourceType', 'extension', 'identifier', 'gender'],
          equals: { resourceType: 'Patient', gender: 'female' },
          regex: [
            { path: 'identifier.0.value', pattern: '^998877$' },
          ],
          extensionUrls: [
            'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race',
            'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex',
          ],
          codingMatch: [{ system: 'urn:oid:2.16.840.1.113883.6.238', code: '2028-9' }],
        },
        template: {
          resourceType: 'Patient',
          extension: [
            { url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race', extension: [
              { url: 'ombCategory', valueCoding: { system: 'urn:oid:2.16.840.1.113883.6.238', code: '2028-9', display: 'Asian' } },
              { url: 'text', valueString: 'Asian' },
            ]},
            { url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex', valueCode: 'F' },
          ],
          identifier: [{ system: 'http://hospital.org/mrn', value: '998877' }],
          gender: 'female',
        },
        notes: ['extension URL must be the canonical StructureDefinition URL.', 'Complex extension uses sub-extensions inside extension[].', 'birthsex valueCode: M|F|UNK|OTH'],
      },
    ],
  },

  // ============================== DAY 6 — SAT — REVISION + HL7v2 DRILLS ==============================
  {
    day: 6, dayLabel: 'Sat', kind: 'revision',
    title: 'Saturday Revision · HL7v2 → FHIR Mapping Drills',
    tagline: 'Bridge the legacy ↔ modern gap. Pure muscle-memory reps.',
    concepts: [
      'HL7v2 is still the dominant in-hospital messaging standard. Real integration jobs = HL7v2 ↔ FHIR mapping.',
      'Pipe-delimited segments: MSH (header), PID (patient identification), PV1 (visit), OBR/OBX (orders/observations), DG1 (diagnosis), RXE/RXA (meds).',
      'MSH-9 = message type → "ADT^A01" (admit), "ORU^R01" (lab result), "RDE^O11" (pharmacy), "SIU^S12" (scheduling).',
      'PID-3 = identifier (MRN) → Patient.identifier',
      'PID-5 = patient name → Patient.name (^ separates family^given)',
      'PID-7 = DOB (YYYYMMDD) → Patient.birthDate (insert dashes)',
      'PID-8 = admin sex (M|F|O|U) → lowercase Patient.gender (male|female|other|unknown)',
      'OBX-3 = obs code → Observation.code · OBX-5 = value · OBX-6 = unit · OBX-14 = effectiveDateTime',
      'PV1-2 = patient class (I|O|E) → Encounter.class (IMP|AMB|EMER) · PV1-19 = visit id → Encounter.identifier',
    ],
    accordions: [
      { title: 'PID → Patient field map', body: [
        'PID-3.1  → identifier[0].value',
        'PID-3.4  → identifier[0].system (assigning authority)',
        'PID-5.1  → name[0].family',
        'PID-5.2  → name[0].given[0]',
        'PID-5.3  → name[0].given[1] (middle)',
        'PID-7    → birthDate (reformat YYYYMMDD → YYYY-MM-DD)',
        'PID-8    → gender (lowercase normalize)',
        'PID-11   → address[0]',
        'PID-13   → telecom (phone home)',
        'PID-14   → telecom (phone work)',
      ]},
      { title: 'OBX → Observation field map', body: [
        'OBX-2    → value[x] type hint (NM=numeric, ST=string, CE=coded)',
        'OBX-3    → code (CodeableConcept) — usually LOINC',
        'OBX-5    → valueQuantity.value (NM) or valueString',
        'OBX-6    → valueQuantity.unit + (map to UCUM code)',
        'OBX-7    → referenceRange.text',
        'OBX-8    → interpretation (CodeableConcept)',
        'OBX-11   → status (F=final, P=preliminary, C=corrected)',
        'OBX-14   → effectiveDateTime',
      ]},
      { title: 'MSH → MessageHeader / Bundle map', body: [
        'MSH-3    → MessageHeader.source.name',
        'MSH-5    → MessageHeader.destination.name',
        'MSH-7    → Bundle.timestamp + MessageHeader.eventCoding source',
        'MSH-9.1  → MessageHeader.eventCoding (e.g. ADT^A01)',
        'MSH-10   → Bundle.identifier.value (control id)',
      ]},
    ],
    drills: [
      {
        id: 'd6c1', title: 'PID segment → Patient JSON',
        prompt: 'Map this HL7v2 PID segment to a FHIR Patient JSON:\n\nPID|1||MRN-554433^^^HOSP^MR||Nair^Priya||19920819|F\n\nProduce Patient with resourceType, identifier(system="HOSP", value="MRN-554433"), name(family=Nair, given=[Priya]), birthDate=1992-08-19, gender=female.',
        validator: {
          type: 'json',
          requiredKeys: ['resourceType', 'identifier', 'name', 'birthDate', 'gender'],
          equals: { resourceType: 'Patient', gender: 'female', birthDate: '1992-08-19' },
          regex: [
            { path: 'identifier.0.value', pattern: '^MRN-554433$' },
            { path: 'identifier.0.system', pattern: '^HOSP$' },
            { path: 'name.0.family', pattern: '^Nair$' },
          ],
          containsAny: [{ path: 'name.0.given', any: ['Priya'] }],
        },
        template: {
          resourceType: 'Patient',
          identifier: [{ system: 'HOSP', value: 'MRN-554433' }],
          name: [{ family: 'Nair', given: ['Priya'] }],
          birthDate: '1992-08-19', gender: 'female',
        },
        notes: ['PID-7 19920819 → reformat with dashes 1992-08-19.', 'PID-8 F → lowercase "female".', '^ is the component separator inside a field.'],
      },
      {
        id: 'd6c2', title: 'OBX segment → Observation JSON',
        prompt: 'Map this HL7v2 OBX to a FHIR Observation:\n\nOBX|1|NM|8867-4^Heart rate^LN||76|/min|||||F|||20250620101500\n\nResult: Observation with status=final, LOINC code 8867-4, valueQuantity 76 /min (UCUM), effectiveDateTime=2025-06-20T10:15:00. Use Patient/pat-555 as subject. category=vital-signs.',
        validator: {
          type: 'json',
          requiredKeys: ['resourceType', 'status', 'code', 'valueQuantity', 'effectiveDateTime', 'subject'],
          equals: { resourceType: 'Observation', status: 'final' },
          regex: [
            { path: 'effectiveDateTime', pattern: '^2025-06-20T10:15:00' },
            { path: 'subject.reference', pattern: '^Patient/pat-555$' },
          ],
          codingMatch: [
            { system: 'http://loinc.org', code: '8867-4' },
            { system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' },
          ],
          quantityMatch: { path: 'valueQuantity', value: 76, code: '/min' },
        },
        template: {
          resourceType: 'Observation', status: 'final',
          category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
          code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
          subject: { reference: 'Patient/pat-555' },
          effectiveDateTime: '2025-06-20T10:15:00',
          valueQuantity: { value: 76, unit: '/min', system: 'http://unitsofmeasure.org', code: '/min' },
        },
        notes: ['OBX-11 F → status=final.', 'OBX-14 YYYYMMDDHHMMSS → format as 2025-06-20T10:15:00.', 'LN in OBX-3.3 means LOINC → canonical http://loinc.org.'],
      },
      {
        id: 'd6c3', title: 'PV1 segment → Encounter JSON',
        prompt: 'Map this HL7v2 PV1 to a FHIR Encounter:\n\nPV1|1|I|ICU^101^A||||DOC-123^Sharma^Neha|||CARD|||||||||V-998877\n\nResult: Encounter with status=in-progress, class=IMP (v3-ActCode), subject=Patient/pat-555, identifier (system=urn:visit, value=V-998877).',
        validator: {
          type: 'json',
          requiredKeys: ['resourceType', 'status', 'class', 'subject', 'identifier'],
          equals: { resourceType: 'Encounter', status: 'in-progress' },
          regex: [
            { path: 'subject.reference', pattern: '^Patient/pat-555$' },
            { path: 'class.code', pattern: '^IMP$' },
            { path: 'class.system', pattern: 'v3-ActCode' },
            { path: 'identifier.0.value', pattern: '^V-998877$' },
          ],
        },
        template: {
          resourceType: 'Encounter', status: 'in-progress',
          class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'IMP', display: 'inpatient encounter' },
          identifier: [{ system: 'urn:visit', value: 'V-998877' }],
          subject: { reference: 'Patient/pat-555' },
        },
        notes: ['PV1-2 I → IMP (inpatient). O → AMB. E → EMER.', 'PV1-19 (visit number) → Encounter.identifier.', 'class is a single Coding object (NOT CodeableConcept).'],
      },
      {
        id: 'd6c4', title: 'Quick concept regex: name two FHIR Bundle types',
        prompt: 'Type any TWO Bundle type codes (lowercase) separated by a comma — e.g. "transaction,batch". Valid: searchset, transaction, batch, document, message, collection, history.',
        validator: {
          type: 'text',
          regexAll: ['^(searchset|transaction|batch|document|message|collection|history)\\s*,\\s*(searchset|transaction|batch|document|message|collection|history)$'],
        },
        template: 'transaction,batch',
        notes: ['Used for warm-up recall.', 'Don\'t forget collection and history.'],
      },
      {
        id: 'd6c5', title: 'Token search modifier',
        prompt: 'Write the search URL to find all Patients whose identifier has system http://hospital.org/mrn and value 998877. Base: https://api.example.org/fhir',
        validator: {
          type: 'text',
          regexAll: [
            '^https://api\\.example\\.org/fhir/Patient\\?identifier=http://hospital\\.org/mrn\\|998877$',
          ],
        },
        template: 'https://api.example.org/fhir/Patient?identifier=http://hospital.org/mrn|998877',
        notes: ['Token searches use pipe between system and value/code.', 'No URL-encoding needed for the pipe in most FHIR servers.'],
      },
    ],
  },

  // ============================== DAY 7 — SUN — MINI PROJECT ==============================
  {
    day: 7, dayLabel: 'Sun', kind: 'project',
    title: 'Sunday Mini-Project · ADT^A01 → FHIR Transaction Bundle',
    tagline: 'Compose everything into one shippable artefact.',
    brief: [
      'GOAL: Given an HL7v2 ADT^A01 (patient admission) message, produce a SINGLE FHIR transaction Bundle that creates Patient + Encounter + Condition + Observation, all linked.',
      'INPUT MESSAGE:',
      'MSH|^~\\&|HIS|HOSP|RIS|HOSP|20250620100000||ADT^A01|MSG-0001|P|2.5',
      'PID|1||MRN-554433^^^HOSP^MR||Nair^Priya||19920819|F',
      'PV1|1|I|ICU^101^A||||DOC-123^Sharma^Neha|||CARD',
      'DG1|1|I10|38341003^Hypertensive disorder^SCT|Hypertension|20230410',
      'OBX|1|NM|8867-4^Heart rate^LN||92|/min|||||F|||20250620100500',
      '',
      'OUTPUT: One JSON Bundle that passes ALL 4 milestone validators below.',
    ],
    milestones: [
      {
        id: 'd7m1', title: 'Milestone 1 · Bundle envelope',
        prompt: 'Build the Bundle skeleton: resourceType=Bundle, type=transaction, entry array with 4 entries. Each entry must have request.method (POST) and request.url (Patient, Encounter, Condition, Observation). Use fullUrl urn:uuid:p1, urn:uuid:e1, urn:uuid:c1, urn:uuid:o1.',
        validator: {
          type: 'json',
          requiredKeys: ['resourceType', 'type', 'entry'],
          equals: { resourceType: 'Bundle', type: 'transaction' },
          bundleEntries: ['Patient', 'Encounter', 'Condition', 'Observation'],
          fullUrls: ['urn:uuid:p1', 'urn:uuid:e1', 'urn:uuid:c1', 'urn:uuid:o1'],
        },
        template: {
          resourceType: 'Bundle', type: 'transaction',
          entry: [
            { fullUrl: 'urn:uuid:p1', resource: { resourceType: 'Patient' }, request: { method: 'POST', url: 'Patient' } },
            { fullUrl: 'urn:uuid:e1', resource: { resourceType: 'Encounter' }, request: { method: 'POST', url: 'Encounter' } },
            { fullUrl: 'urn:uuid:c1', resource: { resourceType: 'Condition' }, request: { method: 'POST', url: 'Condition' } },
            { fullUrl: 'urn:uuid:o1', resource: { resourceType: 'Observation' }, request: { method: 'POST', url: 'Observation' } },
          ],
        },
        notes: ['fullUrl with urn:uuid:* lets later entries reference this without knowing server-assigned id yet.', 'request.method+url are MANDATORY in transaction Bundles.'],
      },
      {
        id: 'd7m2', title: 'Milestone 2 · Full Patient + Encounter resources',
        prompt: 'Now flesh out Patient (from PID) and Encounter (from PV1). Patient identifier MRN-554433 system HOSP, name Nair^Priya, birthDate 1992-08-19, gender female. Encounter status=in-progress, class=IMP, subject references the Patient via urn:uuid:p1.',
        validator: {
          type: 'json',
          bundleResourceCheck: {
            Patient: {
              equals: { gender: 'female', birthDate: '1992-08-19' },
              regex: [
                { path: 'identifier.0.value', pattern: '^MRN-554433$' },
                { path: 'name.0.family', pattern: '^Nair$' },
              ],
            },
            Encounter: {
              equals: { status: 'in-progress' },
              regex: [
                { path: 'class.code', pattern: '^IMP$' },
                { path: 'subject.reference', pattern: '^urn:uuid:p1$' },
              ],
            },
          },
        },
        template: 'See reference: Patient (PID → identifier/name/birthDate/gender) + Encounter (PV1 → status, class IMP, subject urn:uuid:p1). Use the per-resource templates from Day 2–3.',
        notes: ['Cross-entry refs in a transaction Bundle use urn:uuid:<id> — never raw "Patient/123" before commit.', 'Server resolves urn:uuid refs and rewrites them on commit.'],
      },
      {
        id: 'd7m3', title: 'Milestone 3 · Condition (from DG1) inside Bundle',
        prompt: 'Add Condition: SNOMED 38341003 (Hypertensive disorder), clinicalStatus=active, verificationStatus=confirmed, onsetDateTime=2023-04-10, subject references urn:uuid:p1, encounter references urn:uuid:e1.',
        validator: {
          type: 'json',
          bundleResourceCheck: {
            Condition: {
              regex: [
                { path: 'subject.reference', pattern: '^urn:uuid:p1$' },
                { path: 'encounter.reference', pattern: '^urn:uuid:e1$' },
                { path: 'onsetDateTime', pattern: '^2023-04-10$' },
              ],
              codingMatch: [
                { system: 'http://snomed.info/sct', code: '38341003' },
                { system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' },
                { system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' },
              ],
            },
          },
        },
        template: 'Condition has both subject (Patient urn:uuid:p1) and encounter (Encounter urn:uuid:e1) references.',
        notes: ['DG1-3.3 = SCT → SNOMED CT canonical http://snomed.info/sct.', 'Condition.encounter ties the diagnosis to the visit in which it was identified.'],
      },
      {
        id: 'd7m4', title: 'Milestone 4 · Heart rate Observation (from OBX) wired up',
        prompt: 'Add Observation: status=final, category=vital-signs, LOINC 8867-4, valueQuantity 92 /min UCUM, effectiveDateTime=2025-06-20T10:05:00, subject=urn:uuid:p1, encounter=urn:uuid:e1.',
        validator: {
          type: 'json',
          bundleResourceCheck: {
            Observation: {
              equals: { status: 'final' },
              regex: [
                { path: 'subject.reference', pattern: '^urn:uuid:p1$' },
                { path: 'encounter.reference', pattern: '^urn:uuid:e1$' },
                { path: 'effectiveDateTime', pattern: '^2025-06-20T10:05:00' },
              ],
              codingMatch: [
                { system: 'http://loinc.org', code: '8867-4' },
                { system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' },
              ],
              quantityMatch: { path: 'valueQuantity', value: 92, code: '/min' },
            },
          },
        },
        template: 'Observation includes encounter ref (urn:uuid:e1) so the vital sign is anchored to the admission visit.',
        notes: ['When the OBX reading happens DURING an Encounter, always set Observation.encounter.', 'OBX-14 YYYYMMDDHHMMSS → ISO format.'],
      },
    ],
    finalReference: {
      label: 'Final complete Bundle (one possible passing solution)',
      json: {
        resourceType: 'Bundle', type: 'transaction',
        entry: [
          {
            fullUrl: 'urn:uuid:p1',
            resource: {
              resourceType: 'Patient',
              identifier: [{ system: 'HOSP', value: 'MRN-554433' }],
              name: [{ family: 'Nair', given: ['Priya'] }],
              gender: 'female', birthDate: '1992-08-19',
            },
            request: { method: 'POST', url: 'Patient' },
          },
          {
            fullUrl: 'urn:uuid:e1',
            resource: {
              resourceType: 'Encounter', status: 'in-progress',
              class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'IMP', display: 'inpatient encounter' },
              subject: { reference: 'urn:uuid:p1' },
            },
            request: { method: 'POST', url: 'Encounter' },
          },
          {
            fullUrl: 'urn:uuid:c1',
            resource: {
              resourceType: 'Condition',
              clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
              verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' }] },
              code: { coding: [{ system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertensive disorder' }] },
              subject: { reference: 'urn:uuid:p1' },
              encounter: { reference: 'urn:uuid:e1' },
              onsetDateTime: '2023-04-10',
            },
            request: { method: 'POST', url: 'Condition' },
          },
          {
            fullUrl: 'urn:uuid:o1',
            resource: {
              resourceType: 'Observation', status: 'final',
              category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
              code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
              subject: { reference: 'urn:uuid:p1' },
              encounter: { reference: 'urn:uuid:e1' },
              effectiveDateTime: '2025-06-20T10:05:00',
              valueQuantity: { value: 92, unit: '/min', system: 'http://unitsofmeasure.org', code: '/min' },
            },
            request: { method: 'POST', url: 'Observation' },
          },
        ],
      },
    },
  },
]

export const JOB_INDEX = [
  { role: 'FHIR Integration Engineer', focus: 'Channel pipelines (Mirth/Rhapsody/Iguana), HL7v2 ⇄ FHIR mapping, RESTful API delivery' },
  { role: 'Interoperability Analyst', focus: 'Mapping specs, IG conformance reviews, Connectathon participation, payer-provider data flows' },
  { role: 'Senior Integration Specialist', focus: 'Multi-tenant FHIR gateway architecture, OAuth2/SMART, Bulk Data, audit & provenance' },
  { role: 'Healthcare Solutions Architect', focus: 'End-to-end product architecture, US Core / Da Vinci / CARIN BB decisions, vendor selection' },
  { role: 'EHR / Epic / Cerner Integration Engineer', focus: 'App Orchard, SMART apps, Cerner Code, Epic FHIR sandbox, MyChart launch contexts' },
  { role: 'Senior Backend Engineer (HealthTech)', focus: 'Python/FastAPI exposing FHIR APIs, HAPI-FHIR servers, Postgres+JSONB stores' },
]

export const TARGET_ORGS = [
  { name: 'Optum (UnitedHealth Group GCC)', type: 'Payer GCC', location: 'Bengaluru / Hyderabad / Gurugram / Noida' },
  { name: 'Cotiviti', type: 'Payer Analytics', location: 'Hyderabad / Bengaluru' },
  { name: 'Innovaccer', type: 'Health Cloud Product', location: 'Noida / Bengaluru / SF' },
  { name: 'Cognizant Healthcare', type: 'IT Services', location: 'Chennai / Hyderabad / Pune / Bengaluru' },
  { name: 'Oracle Health (Cerner)', type: 'EHR Product', location: 'Bengaluru / Hyderabad' },
  { name: 'Epic (via partners)', type: 'EHR Product', location: 'Remote / Hyderabad partners' },
  { name: 'Athenahealth', type: 'EHR Product', location: 'Bengaluru / Chennai' },
  { name: 'CitiusTech', type: 'HealthTech Pure-play', location: 'Mumbai / Pune / Bengaluru / Chennai' },
  { name: 'Wipro Health Plans / Healthcare', type: 'IT Services', location: 'Bengaluru / Hyderabad / Pune' },
  { name: 'Accenture Health & Public Service', type: 'IT Services', location: 'Bengaluru / Mumbai / Hyderabad' },
  { name: 'Edifecs', type: 'Interoperability Product', location: 'Hyderabad / Bengaluru' },
  { name: 'NextGen Healthcare', type: 'EHR Product', location: 'Bengaluru' },
  { name: 'Change Healthcare / UHG Optum', type: 'Payer Tech', location: 'Bengaluru' },
  { name: 'IQVIA', type: 'Clinical Data', location: 'Bengaluru / Kochi' },
  { name: 'ZS Associates', type: 'HealthTech Consulting', location: 'Pune / Bengaluru / Gurugram' },
  { name: 'GE HealthCare', type: 'Medical Devices + Software', location: 'Bengaluru' },
  { name: 'Philips Healthcare', type: 'Medical Devices + Software', location: 'Bengaluru / Pune / Chennai' },
  { name: 'Roche / Genentech Informatics', type: 'Pharma Informatics', location: 'Hyderabad / Pune' },
]

export const COMP_LADDER = [
  { level: 'Entry / Associate (1-3 yrs)', range: '₹12L – ₹18L LPA', signals: 'Python fluency, can parse/produce FHIR JSON, basic HL7v2, REST clients, 1 EHR sandbox tested' },
  { level: 'Mid / SDE-2 / Specialist (3-6 yrs)', range: '₹18L – ₹28L LPA', signals: 'US Core conformance, owns mapping spec, debugs CapabilityStatement, SMART app authored, profile validation' },
  { level: 'Senior / Lead Integration (6-10 yrs)', range: '₹28L – ₹45L LPA', signals: 'Architects gateways, leads Connectathon, drives IG selection, owns SLA on production interfaces' },
  { level: 'Principal / Architect (10+ yrs)', range: '₹45L – ₹70L+ LPA', signals: 'Multi-product architecture, Da Vinci / CARIN BB / Bulk Data scale, vendor strategy, regulatory (ONC, CMS) literacy' },
]

export const LINKEDIN_TEMPLATES = [
  {
    title: 'Cold Pitch — Engineering Manager (Healthcare Product GCC)',
    body: `Hi {FirstName},

I noticed you lead {Team/Area} at {Company} — your team's work on {SpecificProductOrPost} is exactly the FHIR-heavy interoperability problem space I have been deepening into.

Quick context on me: 3+ years of production Python (FastAPI, async httpx, Pydantic v2), and over the last 30 days I have done a from-scratch deep-dive into HL7 FHIR R4 — Patient/Observation/Encounter/Condition/MedicationRequest schemas, US Core 6.1 profile conformance, SMART on FHIR (auth-code + backend services), and Bulk Data $export. I have hand-built sample mappings (HL7v2 ADT → FHIR Patient, ORU → Observation) and validated payloads against the official IG.

Would love 15 minutes to learn what your team values most in an Integration Engineer hire this cycle, and whether my profile maps. Happy to share a short writeup of a FHIR mapping I shipped.

Thanks,
{YourName}
{Portfolio/GitHub link}`,
  },
  {
    title: 'Warm Referral Ask — Existing Connection at Target Co',
    body: `Hey {FirstName} — hope you're doing well!

Quick ask: I am actively pivoting into a FHIR Integration Engineer / Interoperability role and {Company} is right at the top of my list (your work on {ProductArea} is genuinely the kind of problem I want to be in).

Over the last quarter I have moved from "reads about FHIR" to "builds in FHIR" — RESTful interactions, R4 resource schemas, US Core conformance, SMART on FHIR auth flows, and Python-side validators. I can share a 2-page artefact (a sample HL7v2→FHIR mapping I produced) if useful.

Would you be open to a quick referral to {HiringManager/RecruiterName} or pointing me to the right opening? Totally understand if not — happy either way.

Thanks a ton,
{YourName}`,
  },
  {
    title: 'Recruiter Outreach — Tight, Specific, Signal-Heavy',
    body: `Hi {RecruiterName},

Reaching out re: open Integration Engineer / Interoperability Analyst roles at {Company}.

Snapshot — Python (FastAPI / async / Pydantic) ×3 yrs, hands-on FHIR R4 (Patient, Practitioner, Encounter, Observation, Condition, MedicationRequest, AllergyIntolerance), CodeableConcept + Identifier + Reference data type fluency, LOINC/SNOMED/RxNorm/ICD-10-CM terminology bindings, SMART on FHIR (auth-code + backend services), Bulk Data $export, US Core 6 profile validation, CapabilityStatement-first integration approach.

I can produce a mapping artefact (ADT^A01 → FHIR Patient + Encounter Bundle) on request within 24 hours as a working sample.

Is there a current rec where this profile fits? Happy to share full resume.

Thanks,
{YourName}
{Phone} | {Email}`,
  },
]

export const PYTHON_SIDECAR = [
  'Parse a FHIR JSON file with json.load → access patient["name"][0]["family"]',
  'Build a Patient dict in Python and dump with json.dumps(p, indent=2)',
  'GET a FHIR Bundle with httpx.AsyncClient(headers={"Accept":"application/fhir+json"})',
  'POST a Patient with httpx.post(url, json=patient_dict) — inspect r.status_code and Location header',
  'Walk Bundle.entry[*].resource and filter by resourceType using a generator expression',
  'Resolve a Reference: split "Patient/123" → fetch /Patient/123',
  'Spin a FastAPI endpoint: @app.post("/Patient") returning a dict — confirm OpenAPI docs render',
  'Validate dates with from datetime import datetime; datetime.fromisoformat(birthDate)',
  'Map an HL7v2 PID segment → FHIR Patient (PID-3 → identifier, PID-5 → name, PID-7 → birthDate, PID-8 → gender)',
  'Handle OperationOutcome on non-2xx and raise a typed exception with issue[0].diagnostics',
]

// FHIR 7-Day Curriculum + Validation Engine Data
// All content is hand-curated, production-grade FHIR R4 oriented.

export const CURRICULUM = [
  {
    day: 1,
    title: 'FHIR Foundations: Resources, REST & Bundles',
    tagline: 'From zero to a working FHIR mental model in one sitting.',
    concepts: [
      'FHIR = Fast Healthcare Interoperability Resources. R4 (4.0.1) is the production baseline; R5 is the latest normative.',
      'Atomic unit = Resource. Every resource has resourceType, id, meta, plus typed elements.',
      'Wire formats: JSON (default in modern APIs), XML, RDF/Turtle. All semantically equivalent.',
      'RESTful API verbs: GET (read/search), POST (create), PUT (update by id), PATCH (partial), DELETE.',
      'Endpoints: /Patient/123, /Observation?subject=Patient/123&code=8480-6, /Patient/_history/2',
      'Bundle resource bundles many resources into one payload. Types: searchset, transaction, batch, collection, document, message.',
      'References use Reference type → { "reference": "Patient/123" } (relative) or absolute URL.',
      'Conformance: CapabilityStatement at /metadata. Always inspect this first before integration.',
    ],
    accordions: [
      {
        title: 'HTTP verb → FHIR interaction mapping (memorize cold)',
        body: [
          'read → GET [base]/[Type]/[id]',
          'vread → GET [base]/[Type]/[id]/_history/[vid]',
          'update → PUT [base]/[Type]/[id]   (full replace, sends id in body)',
          'patch → PATCH [base]/[Type]/[id]   (JSON Patch / FHIRPath Patch)',
          'delete → DELETE [base]/[Type]/[id]',
          'create → POST [base]/[Type]',
          'search → GET [base]/[Type]?param=value',
          'capabilities → GET [base]/metadata',
          'transaction → POST [base]   (Bundle of type "transaction")',
        ],
      },
      {
        title: 'Bundle types — when to use which',
        body: [
          'searchset → server returns search results (paged via link.next).',
          'transaction → ACID across entries; rollback on any failure. Use fullUrl + urn:uuid for forward refs.',
          'batch → independent ops, no rollback.',
          'document → clinically signed composition (CCD-equivalent).',
          'message → event-driven (MessageHeader at index 0).',
          'collection → loose container, no processing semantics.',
        ],
      },
      {
        title: 'Common response codes',
        body: [
          '200 OK — read/search success',
          '201 Created — POST success; Location header has new id',
          '400 Bad Request — malformed FHIR',
          '404 Not Found — resource absent',
          '409 Conflict / 412 Precondition Failed — version mismatch on update (ETag/If-Match)',
          '422 Unprocessable Entity — validation failure; OperationOutcome returned',
        ],
      },
    ],
    payload: {
      label: 'Minimal Patient resource (R4)',
      json: {
        resourceType: 'Patient',
        id: 'pat-001',
        identifier: [{ system: 'http://hospital.smarthealthit.org', value: 'MRN-998877' }],
        active: true,
        name: [{ use: 'official', family: 'Iyer', given: ['Anand', 'K'] }],
        gender: 'male',
        birthDate: '1989-04-12',
      },
    },
    challenge: {
      prompt:
        'Write a minimal FHIR R4 Patient JSON for a female patient named "Priya Nair", born 1992-08-19, with one official identifier MRN-554433 from system http://example.org/mrn. Must be valid JSON with resourceType, identifier (array with system+value), name (array with family+given), gender, birthDate.',
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
        gender: 'female',
        birthDate: '1992-08-19',
      },
      notes: [
        'identifier and name are ARRAYS even for one value — modeling for multiplicity.',
        'gender is a code: male | female | other | unknown (lowercase).',
        'birthDate uses date type: YYYY, YYYY-MM, or YYYY-MM-DD.',
      ],
    },
  },
  {
    day: 2,
    title: 'Data Types: Primitive + Complex (CodeableConcept, Identifier, Reference, Period, Quantity)',
    tagline: 'The grammar of every FHIR payload you will ever write.',
    concepts: [
      'Primitive types: boolean, integer, decimal, string, uri, url, code, date, dateTime, instant, base64Binary, id, oid, uuid.',
      'Each primitive can carry an _underscore sibling object with id and extension.',
      'Complex types are the workhorses — CodeableConcept, Coding, Identifier, Reference, Period, Quantity, HumanName, Address, ContactPoint, Attachment, Annotation, Money, Range, Ratio, SampledData, Signature, Timing.',
      'CodeableConcept = a concept + multiple Codings (different code systems for same idea) + free text fallback.',
      'Identifier = business identifier (MRN, NPI, SSN) with system + value + use + type + period + assigner.',
      'Reference points to another resource: { reference, type, identifier, display }.',
      'Quantity carries value + unit + system (UCUM is standard) + code.',
      'Period has start + end (dateTime). Open-ended allowed (omit one).',
    ],
    accordions: [
      {
        title: 'CodeableConcept anatomy',
        body: [
          '{ coding: [ { system, code, display } ], text: "human readable" }',
          'system: canonical URL of the terminology (e.g. http://loinc.org, http://snomed.info/sct, http://www.nlm.nih.gov/research/umls/rxnorm)',
          'code: the actual code value (e.g. 8480-6)',
          'display: human label (e.g. "Systolic blood pressure")',
          'You MAY include multiple coding entries for cross-walking (LOINC + SNOMED).',
          'text is the fallback if no coding system is appropriate.',
        ],
      },
      {
        title: 'Identifier vs id — never confuse these',
        body: [
          'Resource.id = the technical, server-assigned key on /Type/{id} URL. One per resource.',
          'Resource.identifier = the business identifier (MRN, SSN, NPI) assigned by an external authority.',
          'You search by identifier with: GET /Patient?identifier=http://hospital.org/mrn|998877',
        ],
      },
      {
        title: 'Reference styles',
        body: [
          'Relative: { "reference": "Patient/123" }   — most common inside same server',
          'Absolute: { "reference": "https://server.example.org/fhir/Patient/123" }',
          'Logical (no URL): { "identifier": { "system":"...", "value":"..." } }',
          'Conditional in transaction: { "reference": "urn:uuid:xxxxx" } resolved via Bundle.entry.fullUrl',
        ],
      },
      {
        title: 'UCUM Quantity examples',
        body: [
          'BP mmHg → { value: 120, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" }',
          'Weight kg → { value: 72.5, unit: "kg", system: "http://unitsofmeasure.org", code: "kg" }',
          'Glucose mmol/L → code: "mmol/L"',
        ],
      },
    ],
    payload: {
      label: 'CodeableConcept with multi-system coding (Diabetes Mellitus Type 2)',
      json: {
        coding: [
          { system: 'http://snomed.info/sct', code: '44054006', display: 'Diabetes mellitus type 2' },
          { system: 'http://hl7.org/fhir/sid/icd-10-cm', code: 'E11.9', display: 'Type 2 diabetes mellitus without complications' },
        ],
        text: 'Type 2 Diabetes Mellitus',
      },
    },
    challenge: {
      prompt:
        'Produce a single FHIR CodeableConcept JSON for "Essential (primary) hypertension" with TWO codings — LOINC code 59621-6 AND ICD-10-CM code I10 — plus a text fallback "Hypertension". Use canonical systems http://loinc.org and http://hl7.org/fhir/sid/icd-10-cm.',
      validator: {
        type: 'json',
        requiredKeys: ['coding', 'text'],
        regex: [
          { path: 'text', pattern: 'Hypertension' },
        ],
        codingMatch: [
          { system: 'http://loinc.org', code: '59621-6' },
          { system: 'http://hl7.org/fhir/sid/icd-10-cm', code: 'I10' },
        ],
      },
      template: {
        coding: [
          { system: 'http://loinc.org', code: '59621-6', display: 'Blood pressure systolic and diastolic' },
          { system: 'http://hl7.org/fhir/sid/icd-10-cm', code: 'I10', display: 'Essential (primary) hypertension' },
        ],
        text: 'Hypertension',
      },
      notes: [
        'coding is ARRAY — you can list multiple terminologies.',
        'system must be the canonical URI, not the name.',
        'text is the human-readable fallback when terminology is unavailable.',
      ],
    },
  },
  {
    day: 3,
    title: 'Maturity Levels (FMM 0–5) & Patient / Practitioner / Organization',
    tagline: 'Know what is safe to depend on, and the 3 admin resources behind every clinical chart.',
    concepts: [
      'FHIR Maturity Model (FMM) signals stability of a resource definition — NOT data quality.',
      'FMM 0 = Draft, freshly proposed; FMM 1 = Trial Use, early implementation; FMM 2 = Tested against >1 implementations.',
      'FMM 3 = Used in multiple implementations and verified by Connectathon testing; FMM 4 = Used in 5+ independent implementations.',
      'FMM 5 = Normative — backward compatibility guaranteed. Patient, Observation, AllergyIntolerance reach Normative in R5.',
      'Patient, Practitioner, Organization, Location, HealthcareService form the "administrative spine".',
      'Group = collection of patients (e.g. cohort); RelatedPerson = family contact; Person = identity linking across roles.',
      'PractitionerRole connects Practitioner ↔ Organization with specialty + location + period.',
    ],
    accordions: [
      {
        title: 'Patient — high-yield fields',
        body: [
          'identifier[*], active, name[*], telecom[*] (phone/email), gender, birthDate, deceasedBoolean|deceasedDateTime, address[*], maritalStatus (CodeableConcept), communication[*].language, generalPractitioner[*] (Reference Practitioner|Organization|PractitionerRole), managingOrganization (Reference Organization).',
          'US Core profile adds: race, ethnicity, birthsex extensions (mandatory).',
        ],
      },
      {
        title: 'Practitioner vs PractitionerRole',
        body: [
          'Practitioner = the human — name, NPI in identifier, qualification[] (license).',
          'PractitionerRole = THIS practitioner AT THIS org doing THIS specialty during THIS period.',
          'Always reference PractitionerRole when context (org/location/specialty) matters in workflows.',
        ],
      },
      {
        title: 'Organization',
        body: [
          'identifier (NPI org, tax id), active, type[] (e.g. hospital department), name, alias[], telecom[], address[], partOf (parent org Reference), contact[], endpoint[] (Reference to Endpoint for technical connectivity).',
        ],
      },
      {
        title: 'Maturity Quick-Lookup (R4 snapshot)',
        body: [
          'Patient: FMM 5 (Normative)',
          'Practitioner: FMM 3',
          'Organization: FMM 3',
          'Observation: FMM 5 (Normative in R5)',
          'Encounter: FMM 2',
          'Condition: FMM 3',
          'MedicationRequest: FMM 3',
          'AllergyIntolerance: FMM 4',
          'CarePlan: FMM 2',
        ],
      },
    ],
    payload: {
      label: 'Practitioner with NPI + qualification',
      json: {
        resourceType: 'Practitioner',
        id: 'prac-9001',
        identifier: [
          { system: 'http://hl7.org/fhir/sid/us-npi', value: '1234567893' },
        ],
        active: true,
        name: [{ family: 'Sharma', given: ['Neha'], prefix: ['Dr.'] }],
        telecom: [{ system: 'email', value: 'neha.sharma@clinic.org', use: 'work' }],
        qualification: [
          {
            identifier: [{ system: 'http://example.org/license', value: 'KA-MED-44721' }],
            code: {
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0360', code: 'MD', display: 'Doctor of Medicine' }],
            },
            period: { start: '2014-06-01' },
          },
        ],
      },
    },
    challenge: {
      prompt:
        'Build a Practitioner resource for "Dr. Ravi Menon" with NPI 1987654321 (system http://hl7.org/fhir/sid/us-npi), active=true, work email ravi.menon@hospital.org, and qualification code MD from system http://terminology.hl7.org/CodeSystem/v2-0360.',
      validator: {
        type: 'json',
        requiredKeys: ['resourceType', 'identifier', 'name', 'active', 'qualification'],
        equals: { resourceType: 'Practitioner', active: true },
        regex: [
          { path: 'identifier.0.system', pattern: 'us-npi' },
          { path: 'identifier.0.value', pattern: '^1987654321$' },
          { path: 'name.0.family', pattern: '^Menon$' },
        ],
        codingMatch: [
          { system: 'http://terminology.hl7.org/CodeSystem/v2-0360', code: 'MD' },
        ],
      },
      template: {
        resourceType: 'Practitioner',
        identifier: [{ system: 'http://hl7.org/fhir/sid/us-npi', value: '1987654321' }],
        active: true,
        name: [{ family: 'Menon', given: ['Ravi'], prefix: ['Dr.'] }],
        telecom: [{ system: 'email', value: 'ravi.menon@hospital.org', use: 'work' }],
        qualification: [{ code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0360', code: 'MD' }] } }],
      },
      notes: [
        'NPI canonical system: http://hl7.org/fhir/sid/us-npi',
        'qualification.code is a CodeableConcept (must wrap in coding[]).',
        'name array can contain prefix/suffix arrays too.',
      ],
    },
  },
  {
    day: 4,
    title: 'Clinical Core: Encounter & Observation',
    tagline: 'The two resources that touch 80% of real interoperability traffic.',
    concepts: [
      'Encounter = a visit/interaction. status (planned|arrived|in-progress|finished|cancelled), class (Coding from v3-ActCode: AMB, EMER, IMP, HH), type[], subject, participant[], period, reasonCode[], hospitalization, location[].',
      'Observation = a measurement, assertion, or finding. status (registered|preliminary|final|amended|corrected|cancelled|entered-in-error|unknown), category[], code (CodeableConcept, REQUIRED), subject, effective[x], issued, performer[], value[x] OR component[] for paired/grouped values.',
      'effective[x] is polymorphic: effectiveDateTime | effectivePeriod | effectiveTiming | effectiveInstant.',
      'value[x] polymorphic: valueQuantity, valueCodeableConcept, valueString, valueBoolean, valueInteger, valueRange, valueRatio, valueSampledData, valueTime, valueDateTime, valuePeriod.',
      'Blood pressure is the classic component[] use-case: one Observation, two components (systolic 8480-6, diastolic 8462-4).',
      'LOINC is the universal code system for laboratory + vital signs.',
    ],
    accordions: [
      {
        title: 'Encounter.class — v3-ActCode quick map',
        body: [
          'AMB — ambulatory (outpatient)',
          'EMER — emergency',
          'IMP — inpatient',
          'ACUTE — inpatient acute',
          'NONAC — inpatient non-acute',
          'OBSENC — observation encounter',
          'PRENC — pre-admission',
          'SS — short stay',
          'VR — virtual',
          'HH — home health',
          'system: http://terminology.hl7.org/CodeSystem/v3-ActCode',
        ],
      },
      {
        title: 'Observation must-haves',
        body: [
          'status (required), code (required), subject (required for US Core), effective[x] (US Core required), category (US Core required: vital-signs, laboratory, social-history, etc.)',
          'category system: http://terminology.hl7.org/CodeSystem/observation-category',
          'Use components when readings are inseparable (BP systolic+diastolic, focal/peripheral pulse).',
        ],
      },
      {
        title: 'Vital sign LOINC cheat sheet',
        body: [
          '85354-9 — Blood pressure panel (parent)',
          '8480-6 — Systolic BP',
          '8462-4 — Diastolic BP',
          '8867-4 — Heart rate',
          '9279-1 — Respiratory rate',
          '8310-5 — Body temperature',
          '29463-7 — Body weight',
          '8302-2 — Body height',
          '39156-5 — BMI',
          '2708-6 — Oxygen saturation',
        ],
      },
    ],
    payload: {
      label: 'Blood Pressure Observation with component[] pattern',
      json: {
        resourceType: 'Observation',
        id: 'bp-001',
        status: 'final',
        category: [{
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }],
        }],
        code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }] },
        subject: { reference: 'Patient/pat-001' },
        effectiveDateTime: '2025-06-15T09:30:00+05:30',
        component: [
          {
            code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic BP' }] },
            valueQuantity: { value: 128, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic BP' }] },
            valueQuantity: { value: 82, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
          },
        ],
      },
    },
    challenge: {
      prompt:
        'Create an Observation for a heart rate reading of 76 beats/min for Patient/pat-555, status=final, category=vital-signs, LOINC code 8867-4, effectiveDateTime=2025-06-20T10:15:00Z. Use UCUM unit /min with system http://unitsofmeasure.org.',
      validator: {
        type: 'json',
        requiredKeys: ['resourceType', 'status', 'category', 'code', 'subject', 'effectiveDateTime'],
        equals: { resourceType: 'Observation', status: 'final', effectiveDateTime: '2025-06-20T10:15:00Z' },
        regex: [
          { path: 'subject.reference', pattern: '^Patient/pat-555$' },
        ],
        codingMatch: [
          { system: 'http://loinc.org', code: '8867-4' },
          { system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' },
        ],
        quantityMatch: { path: 'valueQuantity', value: 76, code: '/min' },
      },
      template: {
        resourceType: 'Observation',
        status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
        code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
        subject: { reference: 'Patient/pat-555' },
        effectiveDateTime: '2025-06-20T10:15:00Z',
        valueQuantity: { value: 76, unit: '/min', system: 'http://unitsofmeasure.org', code: '/min' },
      },
      notes: [
        'valueQuantity is at root because heart rate is a single value (no components).',
        'UCUM code for beats/min is literally "/min".',
        'category code must be "vital-signs" exactly — not "vitalsigns" or "vital signs".',
      ],
    },
  },
  {
    day: 5,
    title: 'Condition, MedicationRequest, AllergyIntolerance',
    tagline: 'The diagnostic + therapeutic + safety triad.',
    concepts: [
      'Condition (problem list / diagnosis): clinicalStatus (active|recurrence|relapse|inactive|remission|resolved), verificationStatus (unconfirmed|provisional|differential|confirmed|refuted|entered-in-error), category[] (problem-list-item, encounter-diagnosis), severity, code (SNOMED preferred, ICD-10 acceptable), bodySite, subject (REQUIRED), onset[x], abatement[x], recordedDate, recorder, asserter, evidence[].',
      'MedicationRequest: status (active|on-hold|cancelled|completed|stopped|draft), intent (proposal|plan|order|original-order|reflex-order|filler-order|instance-order|option), medication[x] (medicationCodeableConcept with RxNorm OR medicationReference), subject, authoredOn, requester, dosageInstruction[], dispenseRequest, substitution.',
      'AllergyIntolerance: clinicalStatus, verificationStatus, type (allergy|intolerance), category[] (food|medication|environment|biologic), criticality (low|high|unable-to-assess), code (SNOMED/RxNorm), patient (REQUIRED), recordedDate, reaction[].',
      'RxNorm system canonical: http://www.nlm.nih.gov/research/umls/rxnorm',
      'SNOMED CT system canonical: http://snomed.info/sct',
      'clinicalStatus + verificationStatus systems are at http://terminology.hl7.org/CodeSystem/condition-clinical and condition-ver-status.',
    ],
    accordions: [
      {
        title: 'Condition status state machine',
        body: [
          'clinicalStatus tracks LIFECYCLE (is the disease active now?).',
          'verificationStatus tracks CERTAINTY (do we believe the diagnosis?).',
          'A confirmed-active Type 2 DM looks like: clinicalStatus=active, verificationStatus=confirmed.',
          'A ruled-out problem looks like: verificationStatus=refuted.',
        ],
      },
      {
        title: 'MedicationRequest.dosageInstruction breakdown',
        body: [
          'text — free-text human readable instruction',
          'timing.repeat.frequency / period / periodUnit — "twice a day" → frequency=2, period=1, periodUnit="d"',
          'route — CodeableConcept (oral, IV, IM, SC)',
          'doseAndRate.doseQuantity — { value, unit, system, code } (e.g. 500 mg)',
          'asNeededBoolean — PRN flag',
        ],
      },
      {
        title: 'AllergyIntolerance criticality vs reaction.severity',
        body: [
          'criticality = risk if exposed again: low | high | unable-to-assess',
          'reaction[].severity = severity of an ACTUAL past reaction: mild | moderate | severe',
          'These are independent — a low-criticality allergy can have had a severe reaction once.',
        ],
      },
    ],
    payload: {
      label: 'MedicationRequest — Metformin 500mg BID PO',
      json: {
        resourceType: 'MedicationRequest',
        id: 'mr-7001',
        status: 'active',
        intent: 'order',
        medicationCodeableConcept: {
          coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '860975', display: 'Metformin hydrochloride 500 MG Oral Tablet' }],
        },
        subject: { reference: 'Patient/pat-001' },
        authoredOn: '2025-06-12',
        requester: { reference: 'Practitioner/prac-9001' },
        dosageInstruction: [{
          text: '500 mg orally twice daily',
          timing: { repeat: { frequency: 2, period: 1, periodUnit: 'd' } },
          route: { coding: [{ system: 'http://snomed.info/sct', code: '26643006', display: 'Oral route' }] },
          doseAndRate: [{ doseQuantity: { value: 500, unit: 'mg', system: 'http://unitsofmeasure.org', code: 'mg' } }],
        }],
      },
    },
    challenge: {
      prompt:
        'Build a Condition resource: clinicalStatus=active, verificationStatus=confirmed, SNOMED code 38341003 (Hypertensive disorder) for Patient/pat-777, onsetDateTime=2023-04-10, category=problem-list-item.',
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
      notes: [
        'clinicalStatus and verificationStatus are CodeableConcepts (wrap codes in coding[]).',
        'Use canonical systems — terminology.hl7.org/CodeSystem/... not the version-y URL.',
        'category is plural (array).',
      ],
    },
  },
  {
    day: 6,
    title: 'Search, Operations, Profiles & US Core',
    tagline: 'Where you stop being a beginner and start shipping real integrations.',
    concepts: [
      'Search params per resource — string, token (system|code), reference, date, quantity, uri, composite.',
      'Modifiers: :exact, :contains, :missing, :not, :in, :not-in, :below, :above, :identifier.',
      'Common patient searches: /Patient?identifier=http://hospital.org/mrn|998877  /Patient?name=Nair&birthdate=ge1990-01-01',
      'Observation by patient + code: /Observation?subject=Patient/123&code=http://loinc.org|8867-4&date=ge2025-01-01',
      'Chained search: /Observation?subject.identifier=http://hospital.org/mrn|998877',
      'Reverse chained (_has): /Patient?_has:Observation:subject:code=8867-4',
      '_include / _revinclude pull adjacent resources into searchset Bundle.',
      'Operations ($) — /Patient/$everything, /Observation/$lastn, /ValueSet/$expand, /CodeSystem/$lookup, /ConceptMap/$translate.',
      'Profile = a constrained, conformance-locked version of a resource. US Core (HL7 USA Realm) is mandated by ONC for certified EHRs.',
      'StructureDefinition declares profiles; resources reference profiles via meta.profile[].',
      'Extensions add fields not in the base spec. Use canonical URL; valueX where X is the type.',
    ],
    accordions: [
      {
        title: 'US Core (v6+) must-support resources',
        body: [
          'Patient, Practitioner, PractitionerRole, Organization, Location, Encounter, Condition, Observation (Lab/Vital/Smoking/SDOH/etc.), Immunization, AllergyIntolerance, MedicationRequest, Medication, CarePlan, CareTeam, Goal, DocumentReference, DiagnosticReport, Procedure, ServiceRequest, Provenance, RelatedPerson, QuestionnaireResponse, Coverage.',
          'Mandatory extensions on Patient: us-core-race, us-core-ethnicity, us-core-birthsex.',
          'must-support fields are flagged with "mustSupport": true in the profile.',
        ],
      },
      {
        title: 'Search prefixes for date/number/quantity',
        body: [
          'eq (default) | ne | gt | lt | ge | le | sa (starts after) | eb (ends before) | ap (approximately)',
          'Example: /Observation?date=ge2025-01-01&date=le2025-06-30',
          'Quantity comparator: /Observation?value-quantity=gt100|http://unitsofmeasure.org|mg/dL',
        ],
      },
      {
        title: 'Extension pattern',
        body: [
          'extension: [{ url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex", valueCode: "F" }]',
          'Complex extensions use sub-extensions:',
          'extension: [{ url: "...us-core-race", extension: [{ url: "ombCategory", valueCoding: {...} }, { url: "text", valueString: "Asian" }] }]',
        ],
      },
      {
        title: 'CapabilityStatement triage steps',
        body: [
          '1. GET [base]/metadata',
          '2. Inspect rest[0].resource[] — every supported resource + interactions + searchParam[]',
          '3. Check fhirVersion (4.0.1 vs 5.0.0)',
          '4. Look at security.service for OAuth2/SMART support',
          '5. Inspect implementationGuide[] for declared profile conformance (e.g. US Core 6.1.0)',
        ],
      },
    ],
    payload: {
      label: 'searchset Bundle with _include',
      json: {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 1,
        link: [
          { relation: 'self', url: 'https://api.example.org/fhir/Observation?subject=Patient/pat-001&_include=Observation:subject' },
        ],
        entry: [
          {
            fullUrl: 'https://api.example.org/fhir/Observation/bp-001',
            resource: { resourceType: 'Observation', id: 'bp-001', status: 'final' },
            search: { mode: 'match' },
          },
          {
            fullUrl: 'https://api.example.org/fhir/Patient/pat-001',
            resource: { resourceType: 'Patient', id: 'pat-001' },
            search: { mode: 'include' },
          },
        ],
      },
    },
    challenge: {
      prompt:
        'Write the FULL FHIR search URL (just the URL string, nothing else) to fetch all Observations for Patient pat-555 with LOINC code 8867-4 (heart rate) dated on or after 2025-01-01, and ALSO _include the linked Patient. Base server is https://api.example.org/fhir',
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
      template:
        'https://api.example.org/fhir/Observation?subject=Patient/pat-555&code=http://loinc.org|8867-4&date=ge2025-01-01&_include=Observation:subject',
      notes: [
        'token search with system: code=system|code — pipe is the separator.',
        'date comparator prefix: ge (greater-or-equal).',
        '_include format is SourceResource:searchParameter — for Observation→Patient it is Observation:subject.',
      ],
    },
  },
  {
    day: 7,
    title: 'SMART on FHIR, Bulk Data, Validation & Production Integration',
    tagline: 'Day-1-on-the-job toolkit: auth, scale, and CI.',
    concepts: [
      'SMART on FHIR = OAuth2/OIDC profile for FHIR. Two flavors: EHR-Launch (launched from inside EHR with launch token) and Standalone-Launch.',
      'Scopes: patient/*.read, user/Observation.rs, system/Patient.read (Backend Services), openid fhirUser launch/patient offline_access.',
      '.well-known/smart-configuration (and /metadata) advertise authorization_endpoint and token_endpoint.',
      'SMART Backend Services (system-level) uses signed JWT client assertion (PKCE not used; uses asymmetric JWT auth grant).',
      'Bulk Data Access ($export) — async kickoff: GET /Patient/$export with Prefer: respond-async + Accept: application/fhir+json. Returns 202 + Content-Location for status polling. Final NDJSON files per resource type.',
      'Validation: $validate operation, plus official IG validator JAR (hapi-fhir-cli). Profile validation requires StructureDefinitions + ValueSets loaded.',
      'Common gotchas: timezone handling on effectiveDateTime, ID collisions in transaction Bundles, reference target type mismatch, missing must-support, non-UCUM units.',
      'Production patterns: idempotency via If-None-Exist conditional create, ETag concurrency control, OperationOutcome handling.',
    ],
    accordions: [
      {
        title: 'SMART Standalone Launch flow (Authorization Code + PKCE)',
        body: [
          '1. Discover: GET /.well-known/smart-configuration → authorization_endpoint, token_endpoint',
          '2. Browser → authorize?response_type=code&client_id=...&redirect_uri=...&scope=...&state=...&aud=<fhir-base>&code_challenge=...&code_challenge_method=S256',
          '3. User logs in + consents → 302 redirect_uri?code=...&state=...',
          '4. POST /token with grant_type=authorization_code, code, redirect_uri, client_id, code_verifier',
          '5. Receive access_token + (optional) id_token + refresh_token + patient context',
          '6. Use Authorization: Bearer <access_token> on every FHIR call',
        ],
      },
      {
        title: 'Bulk Data Kickoff sequence',
        body: [
          '1. POST /token with backend-services JWT assertion → access_token (scope system/*.read)',
          '2. GET [base]/Patient/$export?_type=Patient,Observation&_since=2025-01-01 with Prefer: respond-async + Authorization Bearer',
          '3. Server returns 202 Accepted + Content-Location: <status URL>',
          '4. Poll status URL until 200 OK with file manifest (output[] of url + type)',
          '5. GET each output URL → NDJSON streams of resources',
          '6. DELETE the status URL to cleanup',
        ],
      },
      {
        title: 'Validation hierarchy',
        body: [
          'Layer 1: Structure (JSON parses, required cardinalities met)',
          'Layer 2: Datatype (date format, code patterns, reference targets)',
          'Layer 3: Terminology (codes exist in bound ValueSet)',
          'Layer 4: Profile (must-support fields, slicing, invariants like us-core-6)',
          'Layer 5: Business (clinical sanity — does it make sense in workflow)',
        ],
      },
      {
        title: 'FastAPI mini-pattern (sidecar reference)',
        body: [
          'from fastapi import FastAPI, HTTPException',
          'from pydantic import BaseModel',
          'app = FastAPI()',
          '@app.post("/fhir/Patient")',
          'async def create_patient(p: dict): return {"resourceType":"Patient", **p, "id": "new-id"}',
          'Wrap an httpx.AsyncClient with retry+backoff for upstream FHIR calls; cache CapabilityStatement; surface OperationOutcome on 4xx.',
        ],
      },
    ],
    payload: {
      label: 'OperationOutcome (server returns this on 4xx/5xx)',
      json: {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'invariant',
            diagnostics: 'Patient.identifier.system must be a valid URI',
            location: ['Patient.identifier[0].system'],
            expression: ['Patient.identifier[0].system'],
          },
        ],
      },
    },
    challenge: {
      prompt:
        'Write a valid FHIR OperationOutcome JSON with ONE issue: severity=error, code=required, diagnostics text containing "missing", and a location array pointing to "Patient.birthDate".',
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
      template: {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'required',
            diagnostics: 'Patient.birthDate is missing',
            location: ['Patient.birthDate'],
          },
        ],
      },
      notes: [
        'issue is an array — even for one error.',
        'severity: fatal | error | warning | information',
        'code: required | invariant | structure | value | code-invalid | not-supported | conflict (see IssueType ValueSet)',
      ],
    },
  },
]

export const JOB_INDEX = [
  { role: 'FHIR Integration Engineer', focus: 'Channel pipelines (Mirth/Rhapsody/Iguana), HL7v2 ↔ FHIR mapping, RESTful API delivery' },
  { role: 'Interoperability Analyst', focus: 'Mapping specs, IG conformance reviews, Connectathon participation, payer-provider data flows' },
  { role: 'Senior Integration Specialist', focus: 'Architecting multi-tenant FHIR gateways, OAuth2/SMART, Bulk Data, audit & provenance' },
  { role: 'Healthcare Solutions Architect', focus: 'End-to-end product architecture, US Core / Da Vinci / CARIN BB profile decisions, vendor selection' },
  { role: 'EHR / Epic / Cerner Integration Engineer', focus: 'App Orchard, SMART apps, Cerner Code, Epic FHIR sandbox, MyChart launch contexts' },
  { role: 'Senior Backend Engineer (HealthTech)', focus: 'Python/FastAPI services exposing FHIR APIs, HAPI-FHIR servers, Postgres+JSONB stores' },
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
  { level: 'Mid / SDE-2 / Specialist (3-6 yrs)', range: '₹18L – ₹28L LPA', signals: 'US Core conformance, owns mapping spec, can debug CapabilityStatement, SMART app authored, profile validation' },
  { level: 'Senior / Lead Integration (6-10 yrs)', range: '₹28L – ₹45L LPA', signals: 'Architects gateways, leads Connectathon presence, drives IG selection, owns SLA on production interfaces' },
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
  'Parse a FHIR JSON file with json.load — access patient["name"][0]["family"]',
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

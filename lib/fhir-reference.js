// FHIR Daily Reference Library
// Bonus content for role-switch readiness (US Healthcare Integration roles).
// Covers what the 5-day learn path doesn't drill into — daily reference + interview prep.

export const RESOURCE_CATALOG = [
  {
    group: 'Clinical (beyond core)',
    items: [
      { name: 'DiagnosticReport', fmm: 3, purpose: 'Lab/radiology/pathology report container. result[] references Observations.', keyFields: 'status, category[], code, subject, effective[x], issued, performer[], result[] (Reference Observation), conclusion, conclusionCode[], presentedForm[] (Attachment).' },
      { name: 'Procedure', fmm: 3, purpose: 'Performed clinical procedure (surgery, therapy, counseling).', keyFields: 'status, category, code, subject, performed[x] (dateTime|Period|string|Age|Range), recorder, performer[].actor, location, reasonCode[], bodySite[], outcome, complication[], followUp[].' },
      { name: 'ServiceRequest', fmm: 3, purpose: 'Order / referral / request for a service. Procedure → fulfilled.', keyFields: 'status, intent (proposal|plan|directive|order|original-order|reflex-order|filler-order|instance-order|option), category[], priority, code, subject, encounter, occurrence[x], authoredOn, requester, performerType, performer[], reasonCode[].' },
      { name: 'Immunization', fmm: 4, purpose: 'Vaccine administration event. CVX is the universal code system.', keyFields: 'status (completed|entered-in-error|not-done), vaccineCode (CVX system http://hl7.org/fhir/sid/cvx), patient, encounter, occurrenceDateTime, primarySource (bool), site, route, doseQuantity, performer[], reasonCode[].' },
      { name: 'DocumentReference', fmm: 3, purpose: 'Pointer to a clinical document (PDF, CDA, image). The "search this chart" workhorse.', keyFields: 'status, docStatus, type (LOINC), category[], subject, date, author[], custodian, content[].attachment (url, contentType, data, hash, size), content[].format, context.encounter, context.period.' },
      { name: 'CarePlan', fmm: 2, purpose: 'Multi-resource plan of care over time.', keyFields: 'status, intent (proposal|plan|order|option), category[], subject, period, careTeam[], addresses[] (Reference Condition), goal[] (Reference Goal), activity[].detail.' },
      { name: 'CareTeam', fmm: 2, purpose: 'Who is on the patient\'s care team.', keyFields: 'status, category[], subject, period, participant[].role + .member (Reference Practitioner|RelatedPerson|Patient|Organization|CareTeam), managingOrganization[].' },
      { name: 'Goal', fmm: 2, purpose: 'Outcomes target (BP < 130/80, lose 5kg).', keyFields: 'lifecycleStatus, achievementStatus, category[], priority, description (CodeableConcept), subject, start[x], target[].measure + .detail[x] + .due[x], expressedBy, addresses[].' },
    ],
  },
  {
    group: 'Payer / Financial (Optum, Cotiviti, CARIN BB territory)',
    items: [
      { name: 'Coverage', fmm: 2, purpose: 'Insurance plan + member context.', keyFields: 'status, type (CodeableConcept), policyHolder (Reference Patient|RelatedPerson|Organization), subscriber, subscriberId, beneficiary (Reference Patient), relationship, period, payor[] (Reference Organization|Patient|RelatedPerson), class[] (group, plan).' },
      { name: 'Claim', fmm: 2, purpose: 'Submission asking payer to adjudicate.', keyFields: 'status, type, subType, use (claim|preauthorization|predetermination), patient, billablePeriod, created, insurer, provider, priority, diagnosis[].diagnosisCodeableConcept, item[].productOrService + .servicedDate + .quantity + .net, total.' },
      { name: 'ClaimResponse', fmm: 2, purpose: 'Payer\'s adjudication answer.', keyFields: 'status, type, use, patient, created, insurer, requestor, request (Reference Claim), outcome (queued|complete|error|partial), disposition, item[].adjudication[], total[], payment.amount.' },
      { name: 'ExplanationOfBenefit', fmm: 2, purpose: 'EOB sent to member. Big CARIN BB resource.', keyFields: 'status, type, use, patient, created, insurer, provider, related[], payee, careTeam[], diagnosis[], procedure[], insurance[], item[].adjudication[], total[], payment.' },
      { name: 'CoverageEligibilityRequest / Response', fmm: 2, purpose: 'Real-time eligibility verification (270/271 in v2-speak).', keyFields: 'status, purpose[] (auth-requirements|benefits|discovery|validation), patient, servicedDate, created, enterer, provider, insurer, facility, item[].' },
    ],
  },
  {
    group: 'Workflow & Messaging',
    items: [
      { name: 'Appointment', fmm: 3, purpose: 'Scheduled visit slot.', keyFields: 'status (proposed|pending|booked|arrived|fulfilled|cancelled|noshow|entered-in-error|checked-in|waitlist), serviceCategory[], serviceType[], specialty[], appointmentType, reasonCode[], priority, start, end, minutesDuration, slot[], participant[].actor + .status.' },
      { name: 'Schedule + Slot', fmm: 3, purpose: 'Provider availability blocks → bookable slots.', keyFields: 'Schedule: actor[] (Reference Practitioner|Location), planningHorizon. Slot: schedule, status (busy|free|busy-unavailable|busy-tentative|entered-in-error), start, end, overbooked.' },
      { name: 'Task', fmm: 2, purpose: 'A unit of work for someone/something to do.', keyFields: 'status, intent, priority, code, description, focus (Reference Any), for (Reference Patient), authoredOn, lastModified, requester, owner, restriction.period.' },
      { name: 'MessageHeader', fmm: 3, purpose: 'Header of a message-type Bundle.', keyFields: 'event[x] (eventCoding|eventUri), source.name + .endpoint, destination[].name + .endpoint, sender, enterer, author, focus[] (Reference Any), reason, response (identifier + code).' },
      { name: 'Subscription', fmm: 3, purpose: 'Server pushes you when something changes (R4) / topic-based (R4B/R5).', keyFields: 'status (requested|active|error|off), criteria (FHIR search expression in R4), channel.type (rest-hook|websocket|email|sms), channel.endpoint, channel.payload (application/fhir+json).' },
      { name: 'Provenance', fmm: 3, purpose: 'WHO did WHAT to WHICH resource WHEN. Audit/security backbone.', keyFields: 'target[] (Reference Any), occurred[x], recorded, policy[], location, reason[], activity, agent[].who + .onBehalfOf + .type + .role[], entity[].what + .role (derivation|revision|quotation|source|removal).' },
    ],
  },
  {
    group: 'Conformance / Terminology / Infra',
    items: [
      { name: 'CapabilityStatement', fmm: 5, purpose: 'Server tells you what it can do. ALWAYS the first thing to GET.', keyFields: 'url, version, name, status, kind (instance|capability|requirements), fhirVersion, format[], implementationGuide[], rest[].mode (server|client), rest[].security.service[], rest[].resource[].type + .interaction[].code + .searchParam[] + .operation[], rest[].resource[].profile + .supportedProfile[].' },
      { name: 'StructureDefinition', fmm: 5, purpose: 'Defines a profile/extension/datatype. The source of "must-support".', keyFields: 'url (canonical), version, name, kind (primitive-type|complex-type|resource|logical), type, baseDefinition, derivation (specialization|constraint), differential.element[], snapshot.element[] (with constraints, slicing, fixed[x], pattern[x], binding).' },
      { name: 'ValueSet', fmm: 5, purpose: 'A set of codes drawn from one or more CodeSystems.', keyFields: 'url, version, name, status, compose.include[].system + .version + .concept[] + .filter[] + .valueSet[], compose.exclude[], expansion.contains[] (after $expand).' },
      { name: 'CodeSystem', fmm: 5, purpose: 'Definition of a terminology (the actual codes, not just a selection).', keyFields: 'url, version, name, status, content (not-present|example|fragment|complete|supplement), caseSensitive, hierarchyMeaning, concept[].code + .display + .definition + .designation[].' },
      { name: 'ConceptMap', fmm: 3, purpose: 'Map codes from one system to another (cross-walks like ICD-10 → SNOMED).', keyFields: 'sourceUri|sourceCanonical, targetUri|targetCanonical, group[].source + .target + .element[].code + .element[].target[].code + .equivalence (relatedto|equivalent|equal|wider|subsumes|narrower|specializes|inexact|unmatched|disjoint).' },
    ],
  },
]

export const FHIRPATH_CHEATS = [
  { expr: 'Patient.name.family', meaning: 'Family name(s) of the patient (collection).' },
  { expr: 'Patient.name.where(use = \'official\').given.first()', meaning: 'First given name of the official-use HumanName.' },
  { expr: 'Patient.telecom.where(system = \'email\').value', meaning: 'All email addresses.' },
  { expr: 'Observation.value.as(Quantity).value', meaning: 'Numeric value, treating value[x] as Quantity.' },
  { expr: 'Bundle.entry.resource.ofType(Patient)', meaning: 'All Patient resources in a Bundle.' },
  { expr: 'Patient.identifier.exists(system = \'http://hl7.org/fhir/sid/us-npi\')', meaning: 'True if Patient has NPI.' },
  { expr: 'Patient.birthDate <= today() - 18 \'years\'', meaning: 'Adult (≥ 18).' },
  { expr: 'Patient.contact.relationship.coding.where(system = \'http://terminology.hl7.org/CodeSystem/v2-0131\').code', meaning: 'Contact relationship codes.' },
  { expr: 'Observation.component.where(code.coding.code = \'8480-6\').valueQuantity.value', meaning: 'Pull systolic BP from a BP panel component.' },
  { expr: '%resource.id', meaning: '%resource is the resource context inside an invariant.' },
  { expr: '.empty() / .exists() / .all(expr) / .any(expr)', meaning: 'Collection predicates.' },
  { expr: '.iif(condition, true-result, false-result)', meaning: 'Inline conditional.' },
  { expr: 'string.matches(\'regex\')', meaning: 'Regex match against a string.' },
]

export const TERMINOLOGY_SYSTEMS = [
  { name: 'LOINC', canonical: 'http://loinc.org', use: 'Labs, vitals, panels, document types (e.g. 11506-3 progress note)' },
  { name: 'SNOMED CT (Intl)', canonical: 'http://snomed.info/sct', use: 'Clinical findings, problems, procedures, body sites, devices' },
  { name: 'SNOMED CT (US)', canonical: 'http://snomed.info/sct/731000124108', use: 'US Edition variant' },
  { name: 'RxNorm', canonical: 'http://www.nlm.nih.gov/research/umls/rxnorm', use: 'Medications, drug ingredients, branded/generic mapping' },
  { name: 'ICD-10-CM', canonical: 'http://hl7.org/fhir/sid/icd-10-cm', use: 'Diagnosis billing codes (US)' },
  { name: 'ICD-10-PCS', canonical: 'http://www.cms.gov/Medicare/Coding/ICD10', use: 'Inpatient procedure billing (US)' },
  { name: 'CPT', canonical: 'http://www.ama-assn.org/go/cpt', use: 'Procedure/service billing codes (US outpatient)' },
  { name: 'HCPCS Level II', canonical: 'https://www.cms.gov/Medicare/Coding/MedHCPCSGenInfo', use: 'DME, supplies, drugs not in CPT' },
  { name: 'NDC', canonical: 'http://hl7.org/fhir/sid/ndc', use: 'National Drug Code (packaged product)' },
  { name: 'CVX', canonical: 'http://hl7.org/fhir/sid/cvx', use: 'Vaccine administered codes (CDC)' },
  { name: 'UCUM', canonical: 'http://unitsofmeasure.org', use: 'Units of measure (mandatory for Quantity.code)' },
  { name: 'NUCC Provider Taxonomy', canonical: 'http://nucc.org/provider-taxonomy', use: 'Provider specialty codes' },
  { name: 'OMB Race/Ethnicity', canonical: 'urn:oid:2.16.840.1.113883.6.238', use: 'US Core race/ethnicity ombCategory' },
  { name: 'HL7 v3 ActCode', canonical: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', use: 'Encounter.class, security labels' },
  { name: 'HL7 v2-0203 (ID Types)', canonical: 'http://terminology.hl7.org/CodeSystem/v2-0203', use: 'Identifier.type (MR=MRN, SS=SSN, DL=License, MA=Medicare, etc.)' },
]

export const OPERATIONS_CATALOG = [
  { op: '$validate', scope: 'Resource', use: 'POST /Patient/$validate?profile=...   → returns OperationOutcome with validation issues.' },
  { op: '$everything', scope: 'Patient', use: 'GET /Patient/123/$everything   → all resources in patient compartment.' },
  { op: '$lastn', scope: 'Observation', use: 'GET /Observation/$lastn?patient=...&category=vital-signs&max=3   → last N observations per code.' },
  { op: '$expand', scope: 'ValueSet', use: 'GET /ValueSet/$expand?url=...&filter=heart   → expanded code list.' },
  { op: '$lookup', scope: 'CodeSystem', use: 'GET /CodeSystem/$lookup?system=http://loinc.org&code=8867-4   → display, designations, properties.' },
  { op: '$translate', scope: 'ConceptMap', use: 'GET /ConceptMap/$translate?source=...&code=...&targetsystem=...   → mapped codes + equivalence.' },
  { op: '$export', scope: 'System|Group|Patient', use: 'GET /Patient/$export   (async, returns 202 + Content-Location). Bulk Data IG.' },
  { op: '$process-message', scope: 'System', use: 'POST /$process-message   → process a message Bundle synchronously.' },
  { op: '$match', scope: 'Patient', use: 'POST /Patient/$match   → MPI candidate matches with score.' },
  { op: '$apply', scope: 'PlanDefinition / ActivityDefinition', use: 'Generate a CarePlan or Request from a definition.' },
  { op: '$populate', scope: 'Questionnaire', use: 'Pre-fill a Questionnaire from existing resources.' },
  { op: '$meta-add / $meta-delete', scope: 'Resource', use: 'Add/remove tags, security labels, profiles without full resource update.' },
]

export const IMPLEMENTATION_GUIDES = [
  { ig: 'US Core (v6.1+, v7.0)', body: 'HL7 USA Realm', focus: 'ONC-mandated baseline. Aligned with USCDI v3. Must-support patterns for Patient, Practitioner, Encounter, Observation (Lab/Vital/Smoking/SDOH/Pregnancy/SO), Condition, MedicationRequest, Immunization, AllergyIntolerance, Procedure, DocumentReference, etc.' },
  { ig: 'Da Vinci PDex (Payer Data Exchange)', body: 'HL7 Da Vinci', focus: 'Member-authorized payer-to-payer / payer-to-provider clinical data exchange. Profiles for ExplanationOfBenefit + clinical resources.' },
  { ig: 'Da Vinci CDex (Clinical Data Exchange)', body: 'HL7 Da Vinci', focus: 'Payer requests clinical data from provider on demand. Task-driven workflow.' },
  { ig: 'Da Vinci HRex (Health Record Exchange)', body: 'HL7 Da Vinci', focus: 'Foundational profiles shared across Da Vinci IGs (Coverage, Provenance patterns).' },
  { ig: 'Da Vinci PAS (Prior Authorization Support)', body: 'HL7 Da Vinci', focus: 'Real-time PA submission and adjudication using Claim/ClaimResponse with use=preauthorization.' },
  { ig: 'Da Vinci DTR (Documentation Templates & Rules)', body: 'HL7 Da Vinci', focus: 'CQL-driven SMART app pre-populates Questionnaire for PA documentation.' },
  { ig: 'Da Vinci CRD (Coverage Requirements Discovery)', body: 'HL7 Da Vinci', focus: 'CDS Hooks called at order time to surface coverage rules.' },
  { ig: 'Da Vinci DEQM (Data Exchange for Quality Measures)', body: 'HL7 Da Vinci', focus: 'MeasureReport-based quality reporting (HEDIS, CMS).' },
  { ig: 'CARIN Blue Button (CARIN BB)', body: 'CARIN Alliance', focus: 'Member-facing EOB and Coverage API. CMS-required for payers participating in MyHealth.' },
  { ig: 'International Patient Summary (IPS)', body: 'HL7 International', focus: 'Cross-border traveller summary (problems, meds, allergies).' },
  { ig: 'SMART App Launch 2.0', body: 'HL7 / SMART Health IT', focus: 'OAuth2 launch protocol for apps inside or alongside EHRs.' },
  { ig: 'Bulk Data Access 2.0', body: 'HL7 / SMART', focus: 'NDJSON $export with Group/Patient/System scope.' },
  { ig: 'SDOH Clinical Care', body: 'HL7 Gravity Project', focus: 'Social determinants Observation/Condition/Goal/Procedure patterns.' },
]

export const SMART_SCOPES = [
  { scope: 'patient/*.read', meaning: 'Read ALL resources in the current patient context.' },
  { scope: 'patient/Observation.rs', meaning: 'Read + search Observations for current patient. (R5 granular CRUDS: c=create r=read u=update d=delete s=search)' },
  { scope: 'user/*.read', meaning: 'Read everything the logged-in user can see (not patient-restricted).' },
  { scope: 'user/Practitioner.read user/Patient.read', meaning: 'Resource-level user scopes.' },
  { scope: 'system/Patient.read system/Observation.read', meaning: 'Backend Services (no user). JWT client assertion grant.' },
  { scope: 'launch', meaning: 'EHR-launch context (received via launch parameter).' },
  { scope: 'launch/patient', meaning: 'Standalone-launch — ask user to pick a patient.' },
  { scope: 'launch/encounter', meaning: 'Standalone-launch — include encounter context too.' },
  { scope: 'openid fhirUser', meaning: 'Get an id_token; fhirUser claim has a Reference to the user resource.' },
  { scope: 'offline_access', meaning: 'Return refresh_token; allows access when user is offline.' },
  { scope: 'online_access', meaning: 'Refresh allowed while user is online only.' },
]

export const HL7V2_MESSAGE_TYPES = [
  { type: 'ADT^A01', meaning: 'Admit / visit notification', fhirTarget: 'Patient + Encounter (status=in-progress) + (optionally) Condition (DG1)' },
  { type: 'ADT^A02', meaning: 'Transfer patient', fhirTarget: 'Encounter update (location[] change) + Provenance' },
  { type: 'ADT^A03', meaning: 'Discharge', fhirTarget: 'Encounter (status=finished) + hospitalization.dischargeDisposition' },
  { type: 'ADT^A04', meaning: 'Register outpatient', fhirTarget: 'Patient + Encounter (class=AMB)' },
  { type: 'ADT^A05', meaning: 'Pre-admit', fhirTarget: 'Encounter (status=planned)' },
  { type: 'ADT^A08', meaning: 'Update patient information', fhirTarget: 'Patient PUT' },
  { type: 'ADT^A11', meaning: 'Cancel admit', fhirTarget: 'Encounter (status=cancelled)' },
  { type: 'ADT^A13', meaning: 'Cancel discharge', fhirTarget: 'Encounter status revert + Provenance' },
  { type: 'ADT^A40', meaning: 'Merge patient', fhirTarget: 'Patient.link[type=replaced-by] + Patient.active=false' },
  { type: 'ORU^R01', meaning: 'Observation result (labs, vitals)', fhirTarget: 'DiagnosticReport + Observation[] (OBR → DR; OBX → Observation)' },
  { type: 'ORM^O01', meaning: 'Order message (general)', fhirTarget: 'ServiceRequest (intent=order)' },
  { type: 'OMG^O19', meaning: 'General clinical order', fhirTarget: 'ServiceRequest' },
  { type: 'OML^O21', meaning: 'Laboratory order', fhirTarget: 'ServiceRequest + Specimen' },
  { type: 'RDE^O11', meaning: 'Pharmacy/treatment encoded order', fhirTarget: 'MedicationRequest (intent=order)' },
  { type: 'RAS^O17', meaning: 'Pharmacy administration', fhirTarget: 'MedicationAdministration' },
  { type: 'RDS^O13', meaning: 'Pharmacy dispense', fhirTarget: 'MedicationDispense' },
  { type: 'SIU^S12', meaning: 'Notification of new appointment', fhirTarget: 'Appointment (status=booked)' },
  { type: 'SIU^S14', meaning: 'Appointment modification', fhirTarget: 'Appointment PUT' },
  { type: 'SIU^S15', meaning: 'Appointment cancellation', fhirTarget: 'Appointment (status=cancelled)' },
  { type: 'MDM^T02', meaning: 'Document notification with content', fhirTarget: 'DocumentReference + Binary' },
  { type: 'VXU^V04', meaning: 'Unsolicited vaccination record update', fhirTarget: 'Immunization' },
  { type: 'BAR^P01', meaning: 'Add patient accounts (billing)', fhirTarget: 'Account + Coverage' },
  { type: 'DFT^P03', meaning: 'Detailed financial transaction (charges)', fhirTarget: 'ChargeItem' },
  { type: 'ACK', meaning: 'Generic ACK / application response', fhirTarget: 'Bundle response entry .response.status' },
]

export const PRODUCTION_GOTCHAS = [
  { topic: 'contained vs referenced resources', detail: 'contained[] is for resources that have NO independent existence. Once you put it inside .contained, it can ONLY be referenced via #localId from THIS parent. Prefer real references in 99% of cases.' },
  { topic: 'Version-aware updates (optimistic concurrency)', detail: 'Server returns ETag: W/"3". Client sends If-Match: W/"3" on PUT. Server returns 412 Precondition Failed if version moved. PREVENTS lost updates.' },
  { topic: 'Conditional create (idempotency)', detail: 'POST /Patient with header If-None-Exist: identifier=http://hosp/mrn|998877. Server creates only if no match; otherwise returns 200 with existing resource.' },
  { topic: 'Conditional update', detail: 'PUT /Patient?identifier=http://hosp/mrn|998877  → server updates the (single) match or creates if none. Reject if >1 match.' },
  { topic: 'Conditional delete', detail: 'DELETE /Patient?identifier=...  → server deletes the matched resource.' },
  { topic: 'Transaction Bundle reference resolution', detail: 'Use fullUrl: "urn:uuid:xxx" + reference: "urn:uuid:xxx" for entries that reference each other. Server rewrites to permanent ids on commit. Order of entries does NOT matter.' },
  { topic: 'Search param indexing latency', detail: 'Custom SearchParameter resources require server reindex. Newly created data may not be searchable for seconds-to-minutes.' },
  { topic: '_format vs Accept', detail: 'Accept: application/fhir+json is canonical. ?_format=json is also accepted. Some servers also accept Accept: application/json (lenient).' },
  { topic: 'Timezone normalization', detail: 'effectiveDateTime should carry offset (+05:30 / Z). Naive datetimes are non-conformant and break date-prefix searches.' },
  { topic: 'Missing data: data-absent-reason extension', detail: 'When a required field is unknown, add http://hl7.org/fhir/StructureDefinition/data-absent-reason with valueCode (unknown|asked-unknown|temp-unknown|not-asked|asked-declined|masked|not-applicable|unsupported|as-text|error|not-a-number|negative-infinity|positive-infinity|not-performed|not-permitted) on the missing element.' },
  { topic: 'must-support semantics', detail: '"mustSupport=true" means the system MUST be able to consume/produce this element when present — NOT that the element is required. Cardinality 0..1 + mustSupport is the most confusing combo.' },
  { topic: 'Profile validation: strict vs lenient', detail: 'Profile invariants come from differential.element[].constraint[]. The IG validator JAR (hapi-fhir-cli) is the reference implementation. Always validate against the EXACT IG version your partner requires.' },
  { topic: 'PHI in audit / logs', detail: 'Never log full resources at INFO level. Always redact identifiers. Use Provenance + AuditEvent resources for access trails.' },
  { topic: 'Reference target type ambiguity', detail: 'Reference.type is optional but adds clarity when target type is ambiguous (e.g. recipient[] can be Patient|Practitioner|RelatedPerson).' },
  { topic: 'OperationOutcome on success', detail: 'Some operations return OperationOutcome with severity=information on success (e.g. $validate when valid). Don\'t assume OperationOutcome = error.' },
  { topic: 'Pagination via link.next', detail: 'Bundle.link[] has self, first, previous, next, last. Always paginate via link.next URL — NEVER construct page params manually (server has opaque continuation tokens).' },
]

export const TOOLING = [
  { name: 'HAPI FHIR Test Server', url: 'http://hapi.fhir.org/baseR4', note: 'Free public R4 server. Throw away data weekly. Perfect for $everything experiments.' },
  { name: 'SMART Health IT Sandbox', url: 'https://launch.smarthealthit.org/', note: 'EHR-launch + Standalone-launch playground. Pre-built patients. Cerner-shape.' },
  { name: 'Synthea', url: 'https://github.com/synthetichealth/synthea', note: 'Generate 1k+ synthetic patients in FHIR R4 JSON. Java tool. Use for load testing + demos.' },
  { name: 'Inferno', url: 'https://inferno.healthit.gov/', note: 'ONC\'s certification test harness for US Core. Run your server against it to prove conformance.' },
  { name: 'HL7 FHIR Validator (CLI JAR)', url: 'https://github.com/hapifhir/org.hl7.fhir.core', note: 'Official reference validator. java -jar validator_cli.jar resource.json -ig hl7.fhir.us.core#6.1.0' },
  { name: 'Firely Terminal (.NET)', url: 'https://docs.fire.ly/projects/Firely-Terminal/', note: 'CLI for profile push/pull, validation, snapshot generation.' },
  { name: 'FSH / SUSHI', url: 'https://fshschool.org/', note: 'FHIR Shorthand — author profiles in a concise DSL, SUSHI compiles to StructureDefinition JSON.' },
  { name: 'fhir-py / fhir.resources', url: 'pip install fhir.resources', note: 'Python Pydantic models for FHIR R4/R5. Type-safe resource construction.' },
  { name: 'Postman FHIR Collection', url: 'Search "FHIR R4 Postman"', note: 'Pre-built request collection for CRUD + search on every resource.' },
  { name: 'fhirpath.js / fhirpath-py', url: 'pip install fhirpathpy', note: 'Run FHIRPath expressions client-side.' },
  { name: 'Bulk Data Server (sample)', url: 'https://bulk-data.smarthealthit.org/', note: 'Test $export end-to-end with backend services JWT.' },
]

export const INTERVIEW_QUESTIONS = [
  { q: 'Difference between Coding and CodeableConcept?', a: 'Coding = ONE concept reference (system + code + display). CodeableConcept = a wrapper around MULTIPLE Codings (for cross-walks) plus a free-text fallback. CodeableConcept is what you put on a resource field; Coding is what goes inside .coding[].' },
  { q: 'Explain SMART Standalone vs EHR launch.', a: 'EHR launch: user is already in the EHR, EHR redirects to your app with a launch token; your app exchanges it during auth-code flow for an access_token scoped to current patient context. Standalone launch: your app is invoked outside an EHR, prompts user to log in and pick a patient via scope launch/patient.' },
  { q: 'What is a contained resource and when would you use it?', a: 'A contained[] resource is one without independent identity, only meaningful within its parent. Referenced by #localId. Use when the inner resource truly cannot exist on its own (rare — most cases prefer real references).' },
  { q: 'How does $everything work?', a: 'GET /Patient/{id}/$everything returns a Bundle containing the Patient plus all resources in the patient compartment (Condition, Observation, MedicationRequest, etc.) the user has access to. Supports _since, _type, _count parameters.' },
  { q: 'Walk me through Bulk Data $export.', a: 'POST /token (backend services JWT assertion) → access_token. GET /Patient/$export with Prefer: respond-async → 202 + Content-Location. Poll status URL until 200 with manifest (output[]). GET each NDJSON file URL. DELETE status URL to cleanup.' },
  { q: 'What\'s the difference between transaction and batch Bundles?', a: 'transaction = ACID; ALL entries succeed or ALL roll back. batch = each entry is independent; partial failures allowed. Both POST to /[base] root, both use Bundle.entry[].request.method+url. transaction supports urn:uuid: cross-refs.' },
  { q: 'How do you handle versioning conflicts?', a: 'Server returns ETag (W/"version"). Client sends If-Match on PUT. Server returns 412 Precondition Failed if the resource was updated in between. Client refetches, merges, retries.' },
  { q: 'What does mustSupport mean?', a: 'A profile flag (mustSupport=true) meaning: "If you implement this profile, your system MUST be able to handle this element when it appears." It does NOT mean the element is required — cardinality is separate. mustSupport on a 0..1 optional element means: don\'t error out if absent, but DO process it if present.' },
  { q: 'How would you ingest an HL7v2 ORU^R01 lab message into a FHIR store?', a: 'Parse MSH (header → MessageHeader/control), PID (→ Patient resolve via identifier), OBR (→ DiagnosticReport with code=test panel + subject=Patient ref + status from ORC-5), OBX[] (→ each becomes Observation; code from OBX-3 LOINC, value from OBX-5, unit→UCUM via OBX-6, status from OBX-11). Bundle as transaction with conditional-create for Patient (identifier match) and POST for DR+Observations.' },
  { q: 'What is US Core and how does it relate to R4?', a: 'US Core is HL7\'s USA Realm IG that constrains base R4 resources with mustSupport elements + bindings to US-specific code systems + mandatory extensions (race, ethnicity, birthsex). It\'s the ONC-mandated baseline for certified EHRs. You declare conformance via meta.profile[].' },
  { q: 'How do you debug a CapabilityStatement-conformant integration?', a: '1) GET /metadata. 2) Inspect rest[0].resource[] for your target type — check supported interactions, searchParam[], operation[]. 3) Check fhirVersion. 4) Inspect security.service for OAuth/SMART support. 5) Cross-check implementationGuide[] against your partner\'s declared IG version. 6) Use the validator JAR against sample payloads with that IG loaded.' },
  { q: 'Difference between Patient.identifier and Patient.id?', a: '.id is the server-assigned technical key (resource URL: /Patient/{id}), one value, opaque. .identifier[] is business identifiers (MRN, SSN, NPI) assigned by external authorities (system+value). Searches by external key use ?identifier=system|value.' },
  { q: 'What is FHIRPath and where is it used?', a: 'A path-based expression language for navigating FHIR resources. Used in: invariant constraints inside StructureDefinitions (.constraint[].expression), Subscription.criteria (R4), search parameter definitions (SearchParameter.expression), CQL bridges, custom evaluators. Example: Patient.name.where(use=\'official\').given.first().' },
  { q: 'How do you implement consent / data segmentation?', a: 'Use Consent resource referencing scope (patient-privacy|research|treatment|adr), category, patient, provision[].type (deny|permit) + .actor + .action + .securityLabel[]. Tag resources with meta.security[] coding. Server enforces by intersecting Consent.provision rules with incoming request scopes.' },
  { q: 'What does "Reference Integrity" mean in FHIR?', a: 'Whether the server validates that referenced resources actually exist. Most servers DON\'T enforce by default (referenceIntegrity may be set to "none" in CapabilityStatement). You can have dangling references. Production systems often add validation via $validate or pre-commit hooks.' },
]

export const READINESS_CHECKLIST = [
  { area: 'Foundations', items: ['Explain REST verbs → FHIR interactions cold', 'Bundle types: when to use transaction vs batch vs document vs message', 'CapabilityStatement-first integration approach'] },
  { area: 'Data Types', items: ['CodeableConcept vs Coding fluency', 'Identifier system+value patterns', 'Reference styles (relative, absolute, urn:uuid, logical)', 'UCUM Quantity discipline', 'Period vs Timing vs effectiveDateTime'] },
  { area: 'Core Clinical', items: ['Patient + US Core extensions', 'Practitioner / PractitionerRole / Organization', 'Encounter class + status state machine', 'Observation single vs component[]', 'Condition (clinical+verification status)', 'MedicationRequest dosageInstruction', 'AllergyIntolerance criticality vs reaction.severity'] },
  { area: 'Payer / Financial', items: ['Coverage + Claim + ClaimResponse + EOB chain', 'CARIN BB profile basics', 'Eligibility verification 270/271 → FHIR', 'PA workflow via Claim use=preauthorization'] },
  { area: 'Search & Operations', items: ['Token search with system|code', 'Date prefixes (ge, le, eq, gt, lt)', '_include + _revinclude + chained + _has', '$everything, $lastn, $export, $validate, $expand'] },
  { area: 'Profiles & Conformance', items: ['US Core v6.1+ key profiles', 'StructureDefinition snapshot vs differential', 'must-support semantics', 'Slicing + discriminator basics', 'Extension authoring (simple + complex)'] },
  { area: 'Security & Auth', items: ['SMART App Launch 2.0 (standalone + EHR)', 'Backend Services JWT assertion', 'Scope syntax (patient/*.rs, system/*.read, launch/patient)', 'Consent + meta.security tagging'] },
  { area: 'Interop Bridge', items: ['HL7v2 segment → FHIR resource mappings (PID, OBX, OBR, PV1, ORC, RXE)', 'ADT^A01 / ORU^R01 / SIU^S12 / RDE^O11 fluency', 'Bidirectional CDA ↔ FHIR awareness', 'IHE PIX/PDQ FHIR'] },
  { area: 'Production Engineering', items: ['Conditional create/update/delete', 'ETag/If-Match concurrency', 'Transaction Bundle composition', 'OperationOutcome handling', 'Audit/Provenance', 'Async + pagination patterns'] },
  { area: 'IGs to Recognise', items: ['US Core (v6.1, v7.0)', 'Da Vinci PDex / CDex / PAS / DTR / CRD', 'CARIN BB', 'SMART App Launch 2.0', 'Bulk Data 2.0', 'IPS', 'SDOH Clinical Care'] },
  { area: 'Tooling Hands-on', items: ['HAPI test server CRUD', 'IG validator CLI JAR', 'Synthea data generation', 'Inferno US Core certification run', 'Postman collection navigation', 'FHIRPath evaluator'] },
]

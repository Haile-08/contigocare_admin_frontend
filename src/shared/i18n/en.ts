import type { Phrase } from './types'

/**
 * English — the source of truth.
 *
 * Every other language is typed against this object, so a key added here is a
 * compile error in `es.ts` until it is translated. That is deliberate: a
 * missing translation should fail the build, not silently fall back to English
 * in front of a Spanish-speaking user.
 *
 * Keys are dotted and grouped by the surface they appear on. Text the *server*
 * produces (a FastAPI `detail`, a validation message from Pydantic) is not in
 * here — we cannot translate a string we did not write, so those pass through.
 * That matters more in this app than most: the API answers in Spanish, and its
 * messages are about Mexican policy documents, so passing them through is more
 * accurate than any translation this file could carry.
 */
export const en = {
  /* ------------------------------------------------------------- common */

  'common.tryAgain': 'Try again',
  'common.retry': 'Retry',
  'common.reload': 'Reload',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.viewAll': 'View all',
  'common.close': 'Close',
  'common.loading': 'Loading',
  'common.language': 'Language',

  /* --------------------------------------------------------- navigation */

  'nav.main': 'Main',
  'nav.overview': 'Overview',
  'nav.work': 'Work',
  'nav.dashboard': 'Dashboard',
  'nav.policies': 'Policies',
  'nav.breadcrumb': 'Breadcrumb',

  /* ------------------------------------------------------------- topbar */

  'topbar.openNavigation': 'Open navigation',
  'topbar.closeNavigation': 'Close navigation',
  'topbar.expandSidebar': 'Expand sidebar',
  'topbar.collapseSidebar': 'Collapse sidebar',
  'topbar.switchToDark': 'Switch to dark mode',
  'topbar.switchToLight': 'Switch to light mode',
  'topbar.account': 'Account',
  'topbar.signedIn': 'Signed in',
  'topbar.signOut': 'Sign out',

  /* --------------------------------------------------------- auth shell */

  'auth.eyebrow': 'Insurance analysis · Internal console',
  'auth.headlineLead': 'Every policy.',
  'auth.headlineAccent': 'Read in seconds.',
  'auth.intro':
    'Upload a Mexican GMM policy, confirm what gets removed, and get a structured analysis with a citation behind every figure.',
  'auth.capability.redaction': 'Redaction first',
  'auth.capability.redactionBody':
    'Personal data is found and removed before anything leaves this network.',
  'auth.capability.evidence': 'Cited answers',
  'auth.capability.evidenceBody': 'Every extracted value quotes the line it came from.',
  'auth.capability.retention': 'Nothing stored',
  'auth.capability.retentionBody': 'The policy is parsed in memory and never written to disk.',
  'auth.topic.gmm': 'Gastos Médicos Mayores',
  'auth.topic.coverage': 'Coberturas',
  'auth.topic.waiting': 'Periodos de espera',
  'auth.topic.exclusions': 'Exclusiones',
  'auth.footer': 'Authorised personnel only',

  /* -------------------------------------------------------------- login */

  'login.title': 'Sign in',
  'login.subtitle': 'Enter your credentials to continue.',
  'login.submit': 'Continue',
  'login.sessionExpired': 'Your session expired. Please sign in again.',
  'login.note':
    'Accounts are provisioned by an administrator. There is no self-registration.',

  /* ---------------------------------------------------------------- mfa */

  'mfa.title': 'Two-factor verification',
  'mfa.subtitle': 'Enter the 6-digit code from Google Authenticator.',
  'mfa.codeLabel': 'Verification code',
  'mfa.codeHint': 'The code changes every 30 seconds.',
  'mfa.submit': 'Verify',
  'mfa.useRecovery': 'Use a recovery code instead',

  /* ----------------------------------------------------------- enrolment */

  'enroll.title': 'Set up two-factor authentication',
  'enroll.subtitle': 'This is required before you can use the console.',
  'enroll.step1': 'Install Google Authenticator on your phone, if you have not already.',
  'enroll.step2': 'Open the app, tap the plus button and scan the code below.',
  'enroll.step3': 'Enter the 6-digit code the app shows, to confirm it works.',
  'enroll.qrAlt': 'QR code for two-factor setup',
  'enroll.cannotScan': 'Cannot scan the code?',
  'enroll.hideSecret': 'Hide setup key',
  'enroll.secretHint': 'Enter this key in the app manually.',
  'enroll.codeLabel': 'Code from the app',
  'enroll.codeHint': 'Six digits, no spaces.',
  'enroll.submit': 'Confirm and sign in',
  'enroll.startFailed': 'Could not start setup. Please try again.',

  /* ------------------------------------------------------------ recovery */

  'recovery.title': 'Use a recovery code',
  'recovery.subtitle': 'For when you cannot reach your authenticator app.',
  'recovery.warning':
    'Each recovery code works once. After signing in, ask an administrator to reset your authenticator.',
  'recovery.step1': 'Find the recovery codes you saved when you set up two-factor authentication.',
  'recovery.step2': 'Pick one you have not used yet and type it below.',
  'recovery.step3': 'After signing in, ask an administrator to reset your authenticator.',
  'recovery.lostCodes': 'Do not have your codes?',
  'recovery.hideHelp': 'Hide help',
  'recovery.lostCodesHint':
    'Only an administrator can reset two-factor authentication for your account. Contact one to get back in.',
  'recovery.codeLabel': 'Recovery code',
  'recovery.codeHint': 'Ten characters, in the format XXXXX-XXXXX.',
  'recovery.submit': 'Sign in',
  'recovery.backToCode': 'Back to authenticator code',

  /* ------------------------------------------------------ recovery codes */

  'recoveryCodes.title': 'Save your recovery codes',
  'recoveryCodes.subtitle': 'This is the only time they are shown.',
  'recoveryCodes.step1': 'Copy or print these codes and keep them somewhere only you can reach.',
  'recoveryCodes.step2': 'Use one to sign in if you ever lose access to your phone.',
  'recoveryCodes.step3': 'Each code works once, and there are no more after these ten.',
  'recoveryCodes.warning':
    'Save these now. They are shown once and cannot be retrieved later. Each one works a single time.',
  'recoveryCodes.copy': 'Copy all',
  'recoveryCodes.copied': 'Copied',
  'recoveryCodes.print': 'Print',
  'recoveryCodes.acknowledge': 'I have saved these codes somewhere safe.',
  'recoveryCodes.continue': 'Continue to the console',

  /* ----------------------------------------------------- password reset */

  'forgot.link': 'Forgot your password?',
  'forgot.title': 'Reset your password',
  'forgot.subtitle': 'We will email you a link to choose a new one.',
  'forgot.step1': 'Enter the email address your account uses.',
  'forgot.step2': 'Open the link we send. It expires in 30 minutes and works once.',
  'forgot.step3': 'Choose a new password, then sign in with it and your authenticator code.',
  'forgot.submit': 'Send the link',
  'forgot.backToLogin': 'Back to sign in',
  'forgot.sentTitle': 'Check your email',
  'forgot.sentBody':
    'If an account exists for {email}, a link to reset the password is on its way. It expires in 30 minutes.',
  'forgot.sentHint': 'Nothing arrived? Check the spam folder, then try again in a few minutes.',
  'forgot.resend': 'Send it again',

  'reset.title': 'Choose a new password',
  'reset.subtitle': 'This link works once, and only for the next few minutes.',
  'reset.step1': 'Pick a password at least 12 characters long, with a letter and a number.',
  'reset.step2': 'Type it twice so a slip does not lock you out.',
  'reset.step3': 'Sign in with the new password and your Google Authenticator code.',
  'reset.newPassword': 'New password',
  'reset.confirmPassword': 'Confirm new password',
  'reset.passwordHint': 'At least 12 characters, including a letter and a number.',
  'reset.submit': 'Update password',
  'reset.missingToken': 'This link is incomplete. Request a new one from the sign-in screen.',
  'reset.doneTitle': 'Password updated',
  'reset.doneBody':
    'Your password has been changed and every other session was signed out. Sign in with the new password and your authenticator code.',
  'reset.goToLogin': 'Go to sign in',
  'reset.mfaNote':
    'Resetting a password does not change your two-factor setup — you will still need a code from Google Authenticator.',

  /* ---------------------------------------------------------- dashboard */

  'dashboard.title': 'Dashboard',
  'dashboard.description': 'Volume, speed and — most importantly — how often the agent is right.',
  'dashboard.newAnalysis': 'New analysis',
  'dashboard.totalAnalyses': 'Analyses',
  'dashboard.lastSevenDays': '{count} in the last 7 days',
  'dashboard.patients': 'Patients',
  'dashboard.successRate': 'Success rate',
  'dashboard.successHint': 'Runs that produced an analysis',
  'dashboard.medianLatency': 'Median time',
  'dashboard.latencyHint': 'Model time per policy',
  'dashboard.accuracy': 'Accuracy',
  'dashboard.accuracyHint': 'Across {count} reviewed analyses',
  'dashboard.accuracyEmpty': 'No analyses reviewed yet',
  'dashboard.reviewRate': 'Reviewed',
  'dashboard.reviewHint': 'Share of analyses given a verdict',
  'dashboard.blocked': 'Blocked',
  'dashboard.blockedHint': 'Refused for residual personal data',
  'dashboard.blockedWarning': {
    one: '{count} submission was refused because personal data was still present. Check the redaction step.',
    other:
      '{count} submissions were refused because personal data was still present. Check the redaction step.',
  },
  'dashboard.recent': 'Recent analyses',
  'dashboard.recentHint': 'Newest first',
  'dashboard.patientLabel': 'Patient {id}',
  'dashboard.unknownInsurer': 'Insurer not identified',
  'dashboard.awaitingReview': 'Awaiting review',
  'dashboard.emptyTitle': 'No analyses yet',
  'dashboard.emptyDescription': 'Run your first policy analysis to see it here.',
  'dashboard.redactionTitle': 'Data removed',
  'dashboard.redactionHint': 'Identifiers stripped before the model, by type',
  'dashboard.noRedactions': 'Nothing redacted yet.',

  /* ----------------------------------------------------------- policies */

  'policies.title': 'Policies',
  'policies.description': 'Every policy that has been analysed, newest first.',
  'policies.analyze': 'Analyse policy',
  'policies.search': 'Search by patient ID',
  'policies.searchPlaceholder': 'Patient ID',
  'policies.count': {
    one: '{count} policy',
    other: '{count} policies',
  },
  'policies.range': '{from}–{to} of {total}',
  'policies.previous': 'Previous',
  'policies.next': 'Next',
  'policies.emptyTitle': 'No policies analysed yet',
  'policies.emptyDescription': 'Analyse your first policy and it will appear here.',
  'policies.noMatchTitle': 'No policies for that patient',
  'policies.noMatchDescription': 'Check the ID, or clear the search to see everything.',
  'policies.clearSearch': 'Clear search',
  'policies.detailCrumb': 'Policy',

  /* ------------------------------------------------------ policy detail */

  'policyDetail.title': 'Policy',
  'policyDetail.ranAt': 'Analysed {when} · {pages} pages',
  'policyDetail.backToList': 'All policies',
  'policyDetail.tabAnalysis': 'Analysis',
  'policyDetail.tabPolicy': 'Redacted policy',
  'policyDetail.policyHint':
    'Exactly what the model was given. The uploaded document itself was never stored.',
  'policyDetail.charCount': '{count} characters',
  'policyDetail.noText': 'No text was stored for this run.',
  'policyDetail.noResult': 'This run did not produce an analysis.',

  /* ------------------------------------------------------------- erasure */

  'delete.action': 'Delete',
  'delete.title': 'Delete this analysis?',
  'delete.description':
    'Removes the redacted policy text, the extracted analysis and the review recorded against it. The uploaded document was never stored, so nothing else is kept.',
  'delete.scopeLabel': 'What to delete',
  'delete.scopeRun': 'This analysis only',
  'delete.scopeRunHint': {
    one: '{count} other analysis for this patient is kept.',
    other: '{count} other analyses for this patient are kept.',
  },
  'delete.scopePatient': {
    one: 'All {count} analysis for this patient',
    other: 'All {count} analyses for this patient',
  },
  'delete.scopePatientHint': 'Everything filed under patient {id}, this analysis included.',
  'delete.onlyAnalysis': 'This is the only analysis on record for patient {id}.',
  'delete.irreversible': 'This cannot be undone. Deleted analyses are not archived or recoverable.',
  'delete.confirmRun': 'Delete analysis',
  'delete.confirmPatient': {
    one: 'Delete {count} analysis',
    other: 'Delete {count} analyses',
  },
  'delete.deletedRun': 'The analysis was deleted.',
  'delete.deletedPatient': {
    one: '{count} analysis was deleted.',
    other: '{count} analyses were deleted.',
  },

  /* ------------------------------------------------------------- wizard */

  'wizard.title': 'Analyse a policy',
  'wizard.description':
    'Identify the patient, confirm the redaction, review the result, then navigate the case.',
  'wizard.step1': 'Patient and policy',
  'wizard.step1Hint': 'Who it is for, and the document',
  'wizard.step2': 'Redact',
  'wizard.step2Hint': 'Confirm what is removed',
  'wizard.step3': 'Review and save',
  'wizard.step3Hint': 'Check the values, give a verdict',
  'wizard.skipReview': 'Save without a review',

  /* ----------------------------------------------------------- analysis */

  'analysis.title': 'Policy analysis',
  'analysis.newAnalysis': 'Start over',
  'analysis.patientId': 'Patient ID',
  'analysis.patientIdHint': 'The identifier this analysis will be filed under.',
  'analysis.patientIdRequired': 'Enter a patient ID before uploading.',
  'analysis.knownNames': 'Names',
  'analysis.knownNamesHint': 'Patient, titular or family members, as they may appear. Separate with commas or new lines.',
  'analysis.knownPolicyNumbers': 'Policy or certificate numbers',
  'analysis.knownPolicyNumbersHint': 'Separate with commas.',
  'intake.optional': 'Optional',
  'intake.patientSection': 'Patient',
  'intake.patientIdPlaceholder': 'e.g. PAC-2026-0042',
  'intake.redactionSection': 'Identifiers to remove',
  'intake.redactionSectionHint':
    'What you already know identifies the patient. Every occurrence in the document is proposed for removal, even without a label. Not stored.',
  'intake.documentSection': 'Policy',
  'intake.documentSectionHint':
    'The carátula or the full policy. Reading starts as soon as you choose the file; the next step confirms what is removed.',
  'analysis.forPatient': 'Analysis for patient {id}',
  'analysis.notFound': 'Not found',
  'analysis.showEvidence': 'Show source',
  'analysis.hideEvidence': 'Hide source',
  'analysis.page': 'Page {page}',

  /* -------------------------------------------------------- run summary */

  'runSummary.patient': 'Patient (ID)',
  'runSummary.insurer': 'Insurer',
  'runSummary.runId': 'Run ID',
  'runSummary.generatedAt': 'Generated',

  /* --------------------------------------------------- policy extraction */

  'extraction.title': 'Policy extraction',
  'extraction.description':
    'The extracted terms everything below is read against. Open a value to see the line it came from.',
  'extraction.download': 'Download PDF',
  'extraction.downloadFailed': 'The PDF could not be generated. The table above is selectable.',

  'extraction.edit': 'Edit values',
  'extraction.doneEditing': 'Done editing',
  'extraction.editHint':
    'Correct a value the analysis misread before exporting. The stored analysis is not changed — corrections apply to this table and the PDF you download from it.',
  'extraction.editField': 'Value for {field}',
  'extraction.revert': 'Restore the extracted value',
  'extraction.editedMarker': 'Corrected by the reviewer',
  'extraction.editedWas': 'Extracted: {value}',
  'extraction.editedNotice': {
    one: '1 value was corrected by hand. The PDF carries the correction and marks it as one.',
    other:
      '{count} values were corrected by hand. The PDF carries the corrections and marks them as such.',
  },
  'extraction.resetEdits': 'Undo all corrections',

  'extraction.pdfIntro':
    'The terms the policy sets out, extracted from the contract and grouped the way the report presents them. A dash (—) marks a value the analysis did not find in the document.',
  'extraction.pdfEditedNote': {
    one: '* One value was corrected by hand by the reviewer and is not the value the analysis extracted.',
    other:
      '* The {count} values marked with an asterisk were corrected by hand by the reviewer and are not the values the analysis extracted.',
  },
  'extraction.pdfFooter':
    'Confidential — for the case coordinator. Contains no personal data beyond the patient ID. Every value is traceable to a quote in the console.',
  'extraction.pdfFooterEdited':
    'Confidential — for the case coordinator. Contains no personal data beyond the patient ID. Every value not marked with an asterisk is traceable to a quote in the console.',

  'extraction.groupIdentification': 'Identification and administrative',
  'extraction.groupFinancial': 'Financial structure',
  'extraction.groupPreexisting': 'Pre-existing and continuity',

  'extraction.aseguradora': 'Insurer',
  'extraction.vigencia_inicio': 'Coverage start',
  'extraction.confidence': 'Extraction confidence',
  'extraction.extractedAt': 'Extracted on',

  'extraction.deducible': 'Deductible',
  'extraction.coaseguro_porcentaje': 'Coinsurance (%)',
  'extraction.tope_coaseguro': 'Coinsurance cap',

  'extraction.antiguedad': 'Policy tenure',

  /* ---------------------------------------------------- case navigation */

  'wizard.step4': 'InnovaDerm Navigator',
  'wizard.step4Hint': 'Plan, costs, calendar, letters',
  'wizard.continueToNavigation': 'Continue to InnovaDerm Navigator',
  'policyDetail.tabNavigation': 'InnovaDerm',
  'delete.navigationsIncluded': {
    one: '{count} InnovaDerm navigation was deleted with it.',
    other: '{count} InnovaDerm navigations were deleted with it.',
  },
  'navigation.intakeTitle': 'InnovaDerm patient intake',
  'navigation.intakeHint':
    'No names, policy numbers or birth dates. InnovaDerm reads the saved redacted policy itself; letters carry placeholders the coordinator fills outside the console.',
  'navigation.sectionPolicy': 'A. Policy data (carátula)',
  'navigation.sectionPolicyHint':
    'Filled from the policy analysis, with the review’s corrections — insurer, vigencia, tenure (antigüedad), deducible, coaseguro and tope. Confirm against the carátula and fix any value right here.',
  'navigation.sectionClinical': 'B. Clinical data',
  'navigation.sectionIncidence': 'C. Incidence status',
  'navigation.field.carrier': 'Insurer',
  'navigation.field.carrierOther': 'Other insurer (no carrier rules)',
  'navigation.field.policyYearStart': 'Policy start date',
  'navigation.field.monthsInsured': 'Months of continuous coverage',
  'navigation.field.deducible': 'Deducible (MXN)',
  'navigation.field.coaseguro': 'Coaseguro (%)',
  'navigation.field.tope': 'Tope de coaseguro (MXN)',
  'navigation.field.financialHint':
    'Prefilled from the analysis where it was found. Confirm against the carátula; left empty, InnovaDerm uses its defaults ($15,000 deducible, 10% coaseguro, the tope from the policy or the carrier).',
  'navigation.field.riderPreexisting': 'Preexisting-conditions rider active (SMNYL)',
  'navigation.field.programacionDone': 'Programación de pago directo already scheduled (MetLife / GNP)',
  'navigation.field.diagnosis': 'Diagnosis',
  'navigation.field.icd10': 'ICD-10',
  'navigation.field.treatmentRx': 'Prescribed treatment',
  'navigation.field.treatmentRxHint':
    'Pick a catalog therapy or type the prescription. A therapy outside the catalog is priced generically.',
  'navigation.field.easi': 'EASI (0–72)',
  'navigation.field.scorad': 'SCORAD (0–103)',
  'navigation.field.dlqi': 'DLQI (0–30)',
  'navigation.field.priorTreatments': 'Failed prior treatments',
  'navigation.field.priorTreatmentsHint': 'One per line, e.g. "ciclosporina oral 3mg/kg x 4 meses".',
  'navigation.field.preexisting': 'Diagnosed before the policy began (preexisting)',
  'navigation.field.dermatologistName': 'Treating dermatologist',
  'navigation.field.dermatologistNameHint': 'A professional credential cited in appeal letters — not patient data.',
  'navigation.field.dermatologistCedula': 'Cédula profesional',
  'navigation.field.cofepris': 'COFEPRIS registration',
  'navigation.field.incidenceDate': 'Incidence date',
  'navigation.field.incidenceDateHint': 'The prescription date: the 5-day claim notice runs from here.',
  'navigation.field.notificationSent': 'Written claim notice already sent',
  'navigation.field.denialReason': 'Denial reason (insurer’s text)',
  'navigation.field.denialReasonHint':
    'Only if the insurer already denied. It triggers the Advocate’s appeal package. Personal data is removed before use.',
  'navigation.field.authorizationExpiry': 'Current authorisation expires',
  'navigation.field.authorizationExpiryHint': 'Only if the insurer already authorised the treatment.',
  'navigation.run': 'Run InnovaDerm',
  'navigation.rerun': 'Run again with changes',
  'navigation.editIntake': 'Edit intake and run again',
  'navigation.catalogError': 'The treatment catalog could not be loaded.',
  'navigation.error.required': 'Required.',
  'navigation.error.future': 'Cannot be in the future.',
  'navigation.error.icd10': 'Use an ICD-10 code such as L20.9.',
  'navigation.error.number': 'Enter a number.',
  'navigation.error.range': 'Out of range.',
  'navigation.error.treatments': 'At most 10 treatments of 300 characters each.',
  'navigation.error.tooLong': 'Too long.',
  'navigation.formInvalid': 'Check the highlighted fields.',
  'navigation.runningTitle': 'InnovaDerm is working on the case',
  'navigation.runningHint':
    'The agents run one after another, as in InnovaDerm. It usually takes a few minutes; you can leave this screen and come back.',
  'navigation.agent.parser': 'Parser — reads the policy',
  'navigation.agent.planner': 'Planner — action plan',
  'navigation.agent.notification': 'Claim notice letter',
  'navigation.agent.optimizer': 'Optimizer — 12-month costs',
  'navigation.agent.adherence': 'Adherence monitor — calendars',
  'navigation.agent.advocate': 'Advocate — appeal package',
  'navigation.agentState.done': 'Done',
  'navigation.agentState.running': 'Working',
  'navigation.agentState.pending': 'Pending',
  'navigation.agentState.skipped': 'Not needed',
  'navigation.pollError': 'The navigation status could not be refreshed. It keeps running on the server.',
  'navigation.failed': 'The navigation failed: {error}',
  'navigation.blocked': 'The intake still contained personal data and nothing was sent.',
  'navigation.legacyRun':
    'This navigation was produced before InnovaDerm Navigator was ported in full and cannot be shown. Run it again.',
  'navigation.ranAt': 'Run {when} · {duration}',
  'navigation.degraded': 'Some agents did not answer and used InnovaDerm’s fallback: {agents}.',
  'navigation.warningsTitle': 'Check before sharing',
  'navigation.downloadReport': 'Coordinator report (PDF)',
  'navigation.downloadKit': 'Broker kit (ZIP)',

  'navigationFeedback.title': 'Was this navigation correct?',
  'navigationFeedback.editTitle': 'Your review of this navigation',
  'navigationFeedback.why':
    'Flag the sections that are wrong and say why. It tells us which agent to fix — a deadline, a projection or a letter — rather than only that something was off.',
  'navigationFeedback.sectionsTitle': 'Report sections',
  'navigationFeedback.sectionsHint': 'Mark a section as wrong, add a comment, or both. Untouched sections are not recorded.',
  'navigationFeedback.flaggedCount': {
    one: '{count} section flagged',
    other: '{count} sections flagged',
  },
  'navigationFeedback.markWrong': 'Mark wrong',
  'navigationFeedback.flagged': 'Wrong',
  'navigationFeedback.flag': 'Mark {section} as wrong',
  'navigationFeedback.comment': 'Comment on {section}',
  'navigationFeedback.commentPlaceholder': 'What is wrong (optional)',
  'navigationFeedback.thanks': 'Review recorded. Thank you.',
  'navigationFeedback.section.policy_extraction': '2. Policy extraction',
  'navigationFeedback.section.carrier_alerts': '3. Carrier alerts',
  'navigationFeedback.section.deadlines': '4. Deadlines',
  'navigationFeedback.section.action_plan': '1 & 5. Summary and action plan',
  'navigationFeedback.section.docs_checklist': '6. Document checklist',
  'navigationFeedback.section.cost_projection': '7. Cost projection',
  'navigationFeedback.section.financial_roadmap': '8. 12-month financial roadmap',
  'navigationFeedback.section.adherence': '9. Adherence and monitoring',
  'navigationFeedback.section.appeal_pathway': '10. Appeal pathway',
  'navigationFeedback.section.notification_letter': '11. Claim notification letter',
  'navigationFeedback.section.appeal_package': 'Appeal package',
  'navigation.downloadFailed': 'The download failed. Try again.',

  /* ------------------------------------------------------------- upload */

  'upload.cta': 'Drop a policy here, or click to choose a file',
  'upload.hint': 'PDF, PNG, JPG or WEBP · up to 15 MB',
  'upload.processing': 'Reading the document',
  'upload.processingFile': 'Reading {name}',
  'upload.locked': 'Enter the patient ID first',
  'upload.dropNow': 'Drop the file to read it',
  'upload.processingHint': 'Scanned pages are read with OCR, which can take a minute.',
  'upload.tooLarge': 'That file is larger than {size}.',
  'upload.wrongType': 'That file type is not supported.',
  'upload.privacyNote':
    'The document is parsed in memory and never written to disk. Only the text you approve is sent for analysis.',

  /* ---------------------------------------------------------- redaction */

  'redaction.title': 'Confirm what gets removed',
  'redaction.summary': '{selected} of {total} items marked for removal',
  'redaction.confirm': 'Redact and analyse',
  'redaction.all': 'Select all',
  'redaction.none': 'Clear',
  'redaction.lowConfidence': 'Low confidence — check before removing',
  'redaction.noneDetected': 'No personal data detected. Review the text before continuing.',
  'redaction.redactSelection': 'Redact selection',
  'redaction.selectionPreview': 'Selected: “{text}”',
  'redaction.blocking': {
    one: '{count} item must be removed before this can be analysed.',
    other: '{count} items must be removed before this can be analysed.',
  },
  'redaction.ocrNotice': '{pages} of {total} pages were read with OCR. Check figures carefully.',
  'redaction.duplicate': 'This document has been analysed before.',

  /* ----------------------------------------------------------- feedback */

  'feedback.title': 'Was this analysis correct?',
  'feedback.editTitle': 'Your review',
  'feedback.editedOn': 'Recorded {date}. Change anything below and save.',
  'feedback.saveChanges': 'Save changes',
  'feedback.why':
    'Your verdict becomes a test case. It is the only thing that tells us whether a change to the agent made it better.',
  'feedback.verdict.correct': 'Correct',
  'feedback.verdict.partially_correct': 'Partly correct',
  'feedback.verdict.incorrect': 'Incorrect',
  'feedback.correctFields': 'Correct specific fields',
  'feedback.hideFields': 'Hide field corrections',
  'feedback.correctionHint':
    'Enter the right value, or mark a field as invented if the agent produced something that is not in the policy.',
  'feedback.shouldBe': 'Correct value for {field}',
  'feedback.shouldBePlaceholder': 'Correct value',
  'feedback.invented': 'Invented',
  'feedback.markInvented': 'The policy does not contain this value',
  'feedback.notes': 'Notes (optional)',
  'feedback.submit': 'Submit review',
  'feedback.thanks': 'Recorded. Thank you — this is what makes the agent better.',
  'feedback.failed': 'Could not save your review. Please try again.',

  /* --------------------------------------------------------- vocabulary */

  'confidence.alta': 'High confidence',
  'confidence.media': 'Medium confidence',
  'confidence.baja': 'Low confidence',
  'confidence.no_encontrado': 'Not found',

  'status.succeeded': 'Succeeded',
  'status.failed': 'Failed',
  'status.blocked_by_redaction': 'Blocked',

  /* ------------------------------------------------------------- fields */

  'field.email': 'Email',
  'field.emailPlaceholder': 'you@karai.health',
  'field.password': 'Password',
  'field.showPassword': 'Show password',
  'field.hidePassword': 'Hide password',

  /* --------------------------------------------------------- validation */

  'validation.email': 'Enter a valid email address.',
  'validation.passwordRequired': 'Enter your password.',
  'validation.mfaCode': 'Enter the 6-digit code.',
  'validation.recoveryCode': 'Enter a complete recovery code.',
  'validation.passwordLength': 'Use at least {min} characters.',
  'validation.passwordLetter': 'Include at least one letter.',
  'validation.passwordNumber': 'Include at least one number.',
  'validation.passwordMismatch': 'The two passwords do not match.',

  /* -------------------------------------------------------------- error */

  'error.generic': 'Something went wrong. Please try again.',
  'error.fetch': 'Could not reach the server. Check your connection and try again.',
  'error.timeout': 'The server took too long to respond. Please try again.',
  'error.parsing': 'The server returned an unexpected response.',
  'error.badRequest': 'The request was rejected. Please check the details and try again.',
  'error.unauthorized': 'Your session has expired. Please sign in again.',
  'error.forbidden': 'You do not have permission to do that.',
  'error.notFound': 'We could not find what you were looking for.',
  'error.conflict': 'That conflicts with something that already exists.',
  'error.tooMany': 'Too many attempts. Please wait a moment and try again.',
  'error.fieldsHighlighted': 'Please correct the highlighted fields.',

  'error.couldNotLoad': 'Could not load this',
  'error.httpStatus': 'HTTP {status}',
  'error.boundaryTitle': 'Something went wrong',
  'error.boundaryBody': 'The page hit an unexpected error. You can try again.',
  'error.routeBody': 'This page could not be loaded. Reloading usually fixes it.',
  'error.pageNotFound': 'Page not found',
  'error.goHome': 'Go back home',
} satisfies Record<string, Phrase>

/**
 * The contract every other language has to satisfy. Deliberately *not* the
 * literal types of `en` — a translation is a different string, not the same
 * one — but a translation must keep a plural key plural.
 */
export type Dictionary = {
  [K in keyof typeof en]: (typeof en)[K] extends string ? string : { one: string; other: string }
}

export type TranslationKey = keyof typeof en

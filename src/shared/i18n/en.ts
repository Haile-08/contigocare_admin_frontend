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
  'dashboard.criticalFindings': {
    one: '{count} critical',
    other: '{count} critical',
  },
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
  'wizard.description': 'Three steps: identify the patient, confirm the redaction, review the result.',
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
  'analysis.forPatient': 'Analysis for patient {id}',
  'analysis.notFound': 'Not found',
  'analysis.showEvidence': 'Show source',
  'analysis.hideEvidence': 'Hide source',
  'analysis.page': 'Page {page}',
  'analysis.criticalCount': {
    one: '{count} critical finding needs attention.',
    other: '{count} critical findings need attention.',
  },

  /* -------------------------------------------------------- run summary */

  'runSummary.patient': 'Patient (ID)',
  'runSummary.insurer': 'Insurer',
  'runSummary.urgency': 'Urgency level',
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
  'extraction.groupCoverage': 'Coverage scope',
  'extraction.groupExclusions': 'Exclusions and limitations',
  'extraction.groupPreexisting': 'Pre-existing and continuity',
  'extraction.groupClaims': 'Claims process',
  'extraction.groupDisputes': 'Dispute and regulatory',

  'extraction.aseguradora': 'Insurer',
  'extraction.nombre_plan': 'Plan',
  'extraction.nivel_plan': 'Plan tier',
  'extraction.numero_poliza': 'Policy number',
  'extraction.tipo_poliza': 'Policy type',
  'extraction.contratante': 'Policyholder',
  'extraction.asegurado_titular': 'Named insured',
  'extraction.numero_dependientes': 'Dependants',
  'extraction.vigencia_inicio': 'Coverage start',
  'extraction.vigencia_fin': 'Coverage end',
  'extraction.fecha_renovacion': 'Renewal date',
  'extraction.moneda': 'Currency',
  'extraction.codigo_agente': 'Agent code',
  'extraction.registro_cnsf': 'CNSF registration',
  'extraction.periodo': 'Policy period',
  'extraction.confidence': 'Extraction confidence',
  'extraction.extractedAt': 'Extracted on',

  'extraction.suma_asegurada': 'Sum insured',
  'extraction.deducible': 'Deductible',
  'extraction.tipo_deducible': 'Deductible type',
  'extraction.coaseguro_porcentaje': 'Coinsurance (%)',
  'extraction.tope_coaseguro': 'Coinsurance cap',
  'extraction.copagos': 'Copays',
  'extraction.prima_total': 'Total premium',
  'extraction.prima_neta': 'Net premium',
  'extraction.recargos_derechos': 'Fees and surcharges',
  'extraction.forma_pago': 'Payment frequency',
  'extraction.tabulador_aplicable': 'Applicable fee schedule',
  'extraction.tope_honorarios_medicos': 'Cap on medical fees',
  'extraction.tope_medicamentos': 'Cap on drugs',
  'extraction.tope_enfermeria': 'Cap on nursing',
  'extraction.tope_por_padecimiento': 'Cap per condition',

  'extraction.hospitalizacion_cubierta': 'Inpatient',
  'extraction.ambulatorio_cubierto': 'Outpatient',
  'extraction.medicamentos_cubiertos': 'Drugs',
  'extraction.maternidad_cubierta': 'Maternity',
  'extraction.emergencias_cubiertas': 'Emergencies',
  'extraction.dental_vision_cubierto': 'Dental and vision',
  'extraction.biologicos_cubiertos': 'Biologics covered',
  'extraction.medicamentos_especialidad_cubiertos': 'Specialty drugs covered',
  'extraction.pago_directo_disponible': 'Direct payment available',
  'extraction.pago_directo_medicamentos': 'Direct payment for drugs',
  'extraction.coaseguro_medicamentos_ambulatorio': 'Outpatient drug coinsurance',
  'extraction.modelo_red': 'Network model',
  'extraction.red_hospitalaria': 'Hospital network',
  'extraction.nivel_hospitalario': 'Hospital tier',
  'extraction.zona_cobertura': 'Coverage area',
  'extraction.cobertura_eua': 'US coverage',
  'extraction.terminos_cobertura_extranjero': 'Terms abroad',

  'extraction.edad_maxima_admision': 'Maximum entry age',
  'extraction.edad_maxima_permanencia': 'Maximum renewal age',
  'extraction.congenitos_excluidos': 'Congenital conditions excluded',
  'extraction.productos_dermatologicos_excluidos': 'Dermatological products excluded',
  'extraction.biologicos_excluidos': 'Biologics excluded',
  'extraction.cosmeticos_excluidos': 'Cosmetics excluded',
  'extraction.exclusiones_especificas_asegurado': 'Insured-specific exclusions',

  'extraction.preexistencias_excluidas': 'Pre-existing excluded',
  'extraction.via_cobertura': 'Route to coverage',
  'extraction.cobertura_despues_de_meses': 'Covered after (months)',
  'extraction.rider_opcional_disponible': 'Optional rider available',
  'extraction.regla_30_dias': '30-day rule',
  'extraction.antiguedad': 'Policy tenure',
  'extraction.portabilidad_antiguedad': 'Tenure portability',

  'extraction.plazo_aviso_siniestro_dias': 'Notice deadline (days)',
  'extraction.tipo_dias_aviso': 'Business or calendar days',
  'extraction.metodo_notificacion': 'Notice method',
  'extraction.formatos_requeridos': 'Required forms',
  'extraction.plazo_liquidacion_dias': 'Settlement deadline (days)',
  'extraction.via_reembolso': 'Reimbursement pathway',
  'extraction.via_programacion': 'Scheduled-payment pathway',
  'extraction.preautorizacion_alto_costo': 'High-cost pre-authorisation',

  'extraction.une_disponible': 'UNE available',
  'extraction.une_suspende_prescripcion': 'UNE suspends limitation period',
  'extraction.condusef_disponible': 'CONDUSEF available',
  'extraction.clausula_arbitraje': 'Arbitration clause',
  'extraction.plazo_prescripcion': 'Limitation period',
  'extraction.suspension_prescripcion': 'What suspends the limitation period',
  'extraction.clausula_renovacion': 'Renewal clause',
  'extraction.garantia_renovacion_vitalicia': 'Guaranteed/lifetime renewal',
  'extraction.agravacion_riesgo': 'Aggravation of risk',
  'extraction.proceso_cancelacion': 'Cancellation process',

  /* ------------------------------------------------------------- upload */

  'upload.cta': 'Drop a policy here, or click to choose a file',
  'upload.hint': 'PDF, PNG, JPG or WEBP · up to 15 MB',
  'upload.processing': 'Reading the document',
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
  'field.emailPlaceholder': 'you@contigo.care',
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

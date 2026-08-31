import type { Dictionary } from './en'

/**
 * Spanish (Mexico).
 *
 * Typed against `en`, so a key added there is a compile error here until it is
 * translated. Two conventions specific to this console:
 *
 * - Insurance terms are the Mexican ones, not neutral Spanish: `deducible`,
 *   `coaseguro`, `suma asegurada`, `antigüedad`, `periodo de espera`. These are
 *   the words on the document the operator is holding.
 * - The register is `usted`, which is what an internal tool handling patient
 *   data in Mexico is expected to use.
 */
export const es: Dictionary = {
  /* ------------------------------------------------------------- common */

  'common.tryAgain': 'Reintentar',
  'common.retry': 'Reintentar',
  'common.reload': 'Recargar',
  'common.save': 'Guardar',
  'common.cancel': 'Cancelar',
  'common.new': 'Nuevo',
  'common.all': 'Todos',
  'common.viewAll': 'Ver todo',
  'common.open': 'Abrir',
  'common.close': 'Cerrar',
  'common.loading': 'Cargando',
  'common.language': 'Idioma',

  /* --------------------------------------------------------- navigation */

  'nav.main': 'Principal',
  'nav.overview': 'Resumen',
  'nav.work': 'Trabajo',
  'nav.dashboard': 'Panel',
  'nav.policies': 'Pólizas',
  'nav.breadcrumb': 'Ruta de navegación',

  /* ------------------------------------------------------------- topbar */

  'topbar.openNavigation': 'Abrir navegación',
  'topbar.closeNavigation': 'Cerrar navegación',
  'topbar.expandSidebar': 'Expandir barra lateral',
  'topbar.collapseSidebar': 'Contraer barra lateral',
  'topbar.switchToDark': 'Cambiar a modo oscuro',
  'topbar.switchToLight': 'Cambiar a modo claro',
  'topbar.account': 'Cuenta',
  'topbar.signedIn': 'Sesión iniciada',
  'topbar.signOut': 'Cerrar sesión',

  /* --------------------------------------------------------- auth shell */

  'auth.eyebrow': 'Análisis de seguros · Consola interna',
  'auth.headlineLead': 'Cada póliza.',
  'auth.headlineAccent': 'Leída en segundos.',
  'auth.intro':
    'Cargue una póliza de Gastos Médicos Mayores, confirme qué datos se eliminan y obtenga un análisis estructurado con una cita textual detrás de cada cifra.',
  'auth.capability.redaction': 'Primero la redacción',
  'auth.capability.redactionBody':
    'Los datos personales se detectan y eliminan antes de que algo salga de esta red.',
  'auth.capability.evidence': 'Respuestas con cita',
  'auth.capability.evidenceBody': 'Cada valor extraído cita la línea de donde proviene.',
  'auth.capability.retention': 'Nada se almacena',
  'auth.capability.retentionBody':
    'La póliza se procesa en memoria y nunca se escribe en disco.',
  'auth.topic.gmm': 'Gastos Médicos Mayores',
  'auth.topic.coverage': 'Coberturas',
  'auth.topic.waiting': 'Periodos de espera',
  'auth.topic.exclusions': 'Exclusiones',
  'auth.footer': 'Solo personal autorizado',

  /* -------------------------------------------------------------- login */

  'login.title': 'Iniciar sesión',
  'login.subtitle': 'Ingrese sus credenciales para continuar.',
  'login.submit': 'Continuar',
  'login.sessionExpired': 'Su sesión expiró. Inicie sesión de nuevo.',
  'login.note':
    'Las cuentas las crea un administrador. No existe registro por cuenta propia.',

  /* ---------------------------------------------------------------- mfa */

  'mfa.title': 'Verificación en dos pasos',
  'mfa.subtitle': 'Ingrese el código de 6 dígitos de Google Authenticator.',
  'mfa.codeLabel': 'Código de verificación',
  'mfa.codeHint': 'El código cambia cada 30 segundos.',
  'mfa.submit': 'Verificar',
  'mfa.useRecovery': 'Usar un código de recuperación',

  /* ----------------------------------------------------------- enrolment */

  'enroll.title': 'Configurar verificación en dos pasos',
  'enroll.subtitle': 'Es obligatorio antes de poder usar la consola.',
  'enroll.step1': 'Instale Google Authenticator en su teléfono, si aún no lo tiene.',
  'enroll.step2': 'Abra la aplicación, toque el botón más y escanee el código de abajo.',
  'enroll.step3': 'Ingrese el código de 6 dígitos que muestra la aplicación, para confirmar.',
  'enroll.qrAlt': 'Código QR para configurar la verificación en dos pasos',
  'enroll.cannotScan': '¿No puede escanear el código?',
  'enroll.hideSecret': 'Ocultar clave de configuración',
  'enroll.secretHint': 'Ingrese esta clave manualmente en la aplicación.',
  'enroll.codeLabel': 'Código de la aplicación',
  'enroll.codeHint': 'Seis dígitos, sin espacios.',
  'enroll.submit': 'Confirmar e iniciar sesión',
  'enroll.startFailed': 'No se pudo iniciar la configuración. Intente de nuevo.',

  /* ------------------------------------------------------------ recovery */

  'recovery.title': 'Usar un código de recuperación',
  'recovery.subtitle': 'Para cuando no tenga acceso a su aplicación de autenticación.',
  'recovery.warning':
    'Cada código de recuperación funciona una sola vez. Después de entrar, pida a un administrador que reinicie su autenticador.',
  'recovery.step1':
    'Busque los códigos de recuperación que guardó al configurar la verificación en dos pasos.',
  'recovery.step2': 'Elija uno que no haya usado todavía y escríbalo abajo.',
  'recovery.step3': 'Después de entrar, pida a un administrador que reinicie su autenticador.',
  'recovery.lostCodes': '¿No tiene sus códigos?',
  'recovery.hideHelp': 'Ocultar ayuda',
  'recovery.lostCodesHint':
    'Solo un administrador puede reiniciar la verificación en dos pasos de su cuenta. Contacte a uno para recuperar el acceso.',
  'recovery.codeLabel': 'Código de recuperación',
  'recovery.codeHint': 'Diez caracteres, con el formato XXXXX-XXXXX.',
  'recovery.submit': 'Iniciar sesión',
  'recovery.backToCode': 'Volver al código del autenticador',

  /* ------------------------------------------------ códigos de respaldo */

  'recoveryCodes.title': 'Guarde sus códigos de recuperación',
  'recoveryCodes.subtitle': 'Esta es la única vez que se muestran.',
  'recoveryCodes.step1':
    'Copie o imprima estos códigos y guárdelos en un lugar al que solo usted tenga acceso.',
  'recoveryCodes.step2': 'Use uno para iniciar sesión si alguna vez pierde acceso a su teléfono.',
  'recoveryCodes.step3': 'Cada código funciona una sola vez, y no habrá más después de estos diez.',
  'recoveryCodes.warning':
    'Guárdelos ahora. Se muestran una sola vez y no se pueden recuperar después. Cada uno funciona una vez.',
  'recoveryCodes.copy': 'Copiar todos',
  'recoveryCodes.copied': 'Copiado',
  'recoveryCodes.print': 'Imprimir',
  'recoveryCodes.acknowledge': 'He guardado estos códigos en un lugar seguro.',
  'recoveryCodes.continue': 'Continuar a la consola',

  /* ------------------------------------------- restablecer la contraseña */

  'forgot.link': '¿Olvidó su contraseña?',
  'forgot.title': 'Restablecer su contraseña',
  'forgot.subtitle': 'Le enviaremos por correo un enlace para elegir una nueva.',
  'forgot.step1': 'Escriba el correo electrónico de su cuenta.',
  'forgot.step2': 'Abra el enlace que le enviamos. Caduca en 30 minutos y funciona una sola vez.',
  'forgot.step3':
    'Elija una contraseña nueva y luego inicie sesión con ella y su código del autenticador.',
  'forgot.submit': 'Enviar el enlace',
  'forgot.backToLogin': 'Volver al inicio de sesión',
  'forgot.sentTitle': 'Revise su correo',
  'forgot.sentBody':
    'Si existe una cuenta con {email}, le enviamos un enlace para restablecer la contraseña. Caduca en 30 minutos.',
  'forgot.sentHint':
    '¿No llegó nada? Revise la carpeta de correo no deseado y vuelva a intentarlo en unos minutos.',
  'forgot.resend': 'Enviar de nuevo',

  'reset.title': 'Elija una contraseña nueva',
  'reset.subtitle': 'Este enlace funciona una sola vez y solo durante unos minutos más.',
  'reset.step1': 'Elija una contraseña de al menos 12 caracteres, con una letra y un número.',
  'reset.step2': 'Escríbala dos veces para que un error de tecleo no lo deje fuera.',
  'reset.step3': 'Inicie sesión con la contraseña nueva y su código de Google Authenticator.',
  'reset.newPassword': 'Contraseña nueva',
  'reset.confirmPassword': 'Confirmar contraseña nueva',
  'reset.passwordHint': 'Al menos 12 caracteres, incluyendo una letra y un número.',
  'reset.submit': 'Actualizar contraseña',
  'reset.missingToken':
    'Este enlace está incompleto. Solicite uno nuevo desde la pantalla de inicio de sesión.',
  'reset.doneTitle': 'Contraseña actualizada',
  'reset.doneBody':
    'Su contraseña se cambió y todas las demás sesiones se cerraron. Inicie sesión con la contraseña nueva y su código del autenticador.',
  'reset.goToLogin': 'Ir al inicio de sesión',
  'reset.mfaNote':
    'Restablecer la contraseña no cambia su verificación en dos pasos: seguirá necesitando un código de Google Authenticator.',

  /* ---------------------------------------------------------- dashboard */

  'dashboard.title': 'Panel',
  'dashboard.description':
    'Volumen, velocidad y —lo más importante— con qué frecuencia acierta el agente.',
  'dashboard.newAnalysis': 'Nuevo análisis',
  'dashboard.totalAnalyses': 'Análisis',
  'dashboard.lastSevenDays': '{count} en los últimos 7 días',
  'dashboard.patients': 'Pacientes',
  'dashboard.successRate': 'Tasa de éxito',
  'dashboard.successHint': 'Ejecuciones que produjeron un análisis',
  'dashboard.medianLatency': 'Tiempo mediano',
  'dashboard.latencyHint': 'Tiempo del modelo por póliza',
  'dashboard.accuracy': 'Exactitud',
  'dashboard.accuracyHint': 'Sobre {count} análisis revisados',
  'dashboard.accuracyEmpty': 'Aún no se ha revisado ningún análisis',
  'dashboard.reviewRate': 'Revisados',
  'dashboard.reviewHint': 'Proporción de análisis con veredicto',
  'dashboard.blocked': 'Bloqueados',
  'dashboard.blockedHint': 'Rechazados por datos personales residuales',
  'dashboard.blockedWarning': {
    one: '{count} envío fue rechazado porque aún contenía datos personales. Revise el paso de redacción.',
    other:
      '{count} envíos fueron rechazados porque aún contenían datos personales. Revise el paso de redacción.',
  },
  'dashboard.recent': 'Análisis recientes',
  'dashboard.recentHint': 'Más recientes primero',
  'dashboard.patientLabel': 'Paciente {id}',
  'dashboard.unknownInsurer': 'Aseguradora no identificada',
  'dashboard.criticalFindings': {
    one: '{count} crítico',
    other: '{count} críticos',
  },
  'dashboard.awaitingReview': 'Pendiente de revisión',
  'dashboard.emptyTitle': 'Aún no hay análisis',
  'dashboard.emptyDescription': 'Realice su primer análisis de póliza para verlo aquí.',
  'dashboard.redactionTitle': 'Datos eliminados',
  'dashboard.redactionHint': 'Identificadores removidos antes del modelo, por tipo',
  'dashboard.noRedactions': 'Todavía no se ha redactado nada.',

  /* ----------------------------------------------------------- policies */

  'policies.title': 'Pólizas',
  'policies.description': 'Todas las pólizas analizadas, de la más reciente a la más antigua.',
  'policies.analyze': 'Analizar póliza',
  'policies.search': 'Buscar por ID de paciente',
  'policies.searchPlaceholder': 'ID del paciente',
  'policies.count': {
    one: '{count} póliza',
    other: '{count} pólizas',
  },
  'policies.range': '{from}–{to} de {total}',
  'policies.previous': 'Anterior',
  'policies.next': 'Siguiente',
  'policies.emptyTitle': 'Todavía no hay pólizas analizadas',
  'policies.emptyDescription': 'Analice su primera póliza y aparecerá aquí.',
  'policies.noMatchTitle': 'No hay pólizas de ese paciente',
  'policies.noMatchDescription': 'Verifique el ID, o limpie la búsqueda para ver todo.',
  'policies.clearSearch': 'Limpiar búsqueda',
  'policies.detailCrumb': 'Póliza',

  /* ------------------------------------------------------ policy detail */

  'policyDetail.title': 'Póliza',
  'policyDetail.ranAt': 'Analizada {when} · {pages} páginas',
  'policyDetail.backToList': 'Todas las pólizas',
  'policyDetail.tabAnalysis': 'Análisis',
  'policyDetail.tabPolicy': 'Póliza redactada',
  'policyDetail.policyHint':
    'Exactamente lo que recibió el modelo. El documento cargado nunca se almacenó.',
  'policyDetail.charCount': '{count} caracteres',
  'policyDetail.noText': 'No se almacenó texto para este análisis.',
  'policyDetail.noResult': 'Este análisis no produjo un resultado.',

  /* ------------------------------------------------------------- wizard */

  'wizard.title': 'Analizar una póliza',
  'wizard.description':
    'Tres pasos: identifique al paciente, confirme la redacción y revise el resultado.',
  'wizard.step1': 'Paciente y póliza',
  'wizard.step1Hint': 'Para quién es, y el documento',
  'wizard.step2': 'Redactar',
  'wizard.step2Hint': 'Confirme qué se elimina',
  'wizard.step3': 'Revisar y guardar',
  'wizard.step3Hint': 'Verifique los valores y dé un veredicto',
  'wizard.skipReview': 'Guardar sin revisión',

  /* ----------------------------------------------------------- analysis */

  'analysis.title': 'Análisis de pólizas',
  'analysis.description':
    'Cargue una póliza, confirme qué se elimina y revise el resultado estructurado.',
  'analysis.newAnalysis': 'Empezar de nuevo',
  'analysis.patientId': 'ID del paciente',
  'analysis.patientIdHint': 'El identificador con el que se archivará este análisis.',
  'analysis.patientIdRequired': 'Ingrese un ID de paciente antes de cargar el archivo.',
  'analysis.forPatient': 'Análisis del paciente {id}',
  'analysis.summary': 'Resumen',
  'analysis.policyData': 'Datos de la póliza',
  'analysis.coverage': 'Coberturas',
  'analysis.findings': 'Hallazgos',
  'analysis.benefits': 'Beneficios',
  'analysis.waitingPeriods': 'Periodos de espera',
  'analysis.exclusions': 'Exclusiones',
  'analysis.preexisting': 'Preexistencias',
  'analysis.notFound': 'No encontrado',
  'analysis.showEvidence': 'Ver fuente',
  'analysis.hideEvidence': 'Ocultar fuente',
  'analysis.page': 'Página {page}',
  'analysis.showEnglish': 'Ver resumen en inglés',
  'analysis.showSpanish': 'Ver resumen en español',
  'analysis.criticalCount': {
    one: '{count} hallazgo crítico requiere atención.',
    other: '{count} hallazgos críticos requieren atención.',
  },
  'analysis.provenance': '{model} · prompt {prompt} · {seconds}s · {tokens} tokens',
  'analysis.selfCritiqueApplied': 'autorrevisión aplicada',

  /* ------------------------------------------------------------- upload */

  'upload.cta': 'Arrastre una póliza aquí, o haga clic para elegir un archivo',
  'upload.hint': 'PDF, PNG, JPG o WEBP · hasta 15 MB',
  'upload.processing': 'Leyendo el documento',
  'upload.processingHint':
    'Las páginas escaneadas se leen con OCR, lo que puede tardar un minuto.',
  'upload.tooLarge': 'Ese archivo supera los {size}.',
  'upload.wrongType': 'Ese tipo de archivo no es compatible.',
  'upload.privacyNote':
    'El documento se procesa en memoria y nunca se escribe en disco. Solo se envía a analizar el texto que usted apruebe.',

  /* ---------------------------------------------------------- redaction */

  'redaction.title': 'Confirme qué se elimina',
  'redaction.summary': '{selected} de {total} elementos marcados para eliminar',
  'redaction.confirm': 'Redactar y analizar',
  'redaction.all': 'Seleccionar todo',
  'redaction.none': 'Limpiar',
  'redaction.lowConfidence': 'Confianza baja — verifique antes de eliminar',
  'redaction.noneDetected':
    'No se detectaron datos personales. Revise el texto antes de continuar.',
  'redaction.redactSelection': 'Redactar selección',
  'redaction.selectionPreview': 'Seleccionado: «{text}»',
  'redaction.blocking': {
    one: '{count} elemento debe eliminarse antes de poder analizar.',
    other: '{count} elementos deben eliminarse antes de poder analizar.',
  },
  'redaction.ocrNotice':
    '{pages} de {total} páginas se leyeron con OCR. Verifique las cifras con cuidado.',
  'redaction.duplicate': 'Este documento ya se había analizado antes.',

  /* ----------------------------------------------------------- feedback */

  'feedback.title': '¿El análisis fue correcto?',
  'feedback.editTitle': 'Su revisión',
  'feedback.editedOn': 'Registrada {date}. Cambie lo que necesite y guarde.',
  'feedback.saveChanges': 'Guardar cambios',
  'feedback.why':
    'Su veredicto se convierte en un caso de prueba. Es lo único que nos dice si un cambio en el agente lo mejoró.',
  'feedback.verdict.correct': 'Correcto',
  'feedback.verdict.partially_correct': 'Parcialmente correcto',
  'feedback.verdict.incorrect': 'Incorrecto',
  'feedback.correctFields': 'Corregir campos específicos',
  'feedback.hideFields': 'Ocultar correcciones',
  'feedback.correctionHint':
    'Escriba el valor correcto, o marque el campo como inventado si el agente produjo algo que no está en la póliza.',
  'feedback.shouldBe': 'Valor correcto de {field}',
  'feedback.shouldBePlaceholder': 'Valor correcto',
  'feedback.invented': 'Inventado',
  'feedback.markInvented': 'La póliza no contiene este valor',
  'feedback.notes': 'Notas (opcional)',
  'feedback.submit': 'Enviar revisión',
  'feedback.thanks': 'Registrado. Gracias — esto es lo que mejora al agente.',
  'feedback.failed': 'No se pudo guardar su revisión. Intente de nuevo.',

  /* --------------------------------------------------------- vocabulary */

  'confidence.alta': 'Confianza alta',
  'confidence.media': 'Confianza media',
  'confidence.baja': 'Confianza baja',
  'confidence.no_encontrado': 'No encontrado',

  'severity.critica': 'Crítico',
  'severity.alta': 'Alto',
  'severity.media': 'Medio',
  'severity.informativa': 'Informativo',

  'status.succeeded': 'Exitoso',
  'status.failed': 'Fallido',
  'status.blocked_by_redaction': 'Bloqueado',

  'field.poliza.numero_poliza': 'Número de póliza',
  'field.poliza.aseguradora': 'Aseguradora',
  'field.poliza.nombre_plan': 'Plan',
  'field.poliza.ramo': 'Ramo',
  'field.poliza.moneda': 'Moneda',
  'field.poliza.vigencia_inicio': 'Inicio de vigencia',
  'field.poliza.vigencia_fin': 'Fin de vigencia',
  'field.poliza.fecha_emision': 'Fecha de emisión',
  'field.poliza.antiguedad': 'Antigüedad',
  'field.poliza.forma_pago': 'Forma de pago',
  'field.poliza.prima_total': 'Prima total',
  'field.poliza.contratante': 'Contratante',
  'field.poliza.titular': 'Asegurado titular',
  'field.poliza.numero_dependientes': 'Dependientes',

  'field.cobertura.suma_asegurada': 'Suma asegurada',
  'field.cobertura.suma_asegurada_por_padecimiento': 'Suma asegurada por padecimiento',
  'field.cobertura.deducible': 'Deducible',
  'field.cobertura.coaseguro_porcentaje': 'Coaseguro',
  'field.cobertura.tope_coaseguro': 'Tope de coaseguro',
  'field.cobertura.nivel_hospitalario': 'Nivel hospitalario',
  'field.cobertura.tabulador_medico': 'Tabulador médico',
  'field.cobertura.cobertura_geografica': 'Cobertura geográfica',
  'field.cobertura.red_hospitalaria': 'Red hospitalaria',

  /* ------------------------------------------------------------- fields */

  'field.email': 'Correo electrónico',
  'field.emailPlaceholder': 'usted@contigo.care',
  'field.password': 'Contraseña',
  'field.showPassword': 'Mostrar contraseña',
  'field.hidePassword': 'Ocultar contraseña',

  /* --------------------------------------------------------- validation */

  'validation.email': 'Ingrese un correo electrónico válido.',
  'validation.passwordRequired': 'Ingrese su contraseña.',
  'validation.mfaCode': 'Ingrese el código de 6 dígitos.',
  'validation.recoveryCode': 'Ingrese un código de recuperación completo.',
  'validation.passwordLength': 'Use al menos {min} caracteres.',
  'validation.passwordLetter': 'Incluya al menos una letra.',
  'validation.passwordNumber': 'Incluya al menos un número.',
  'validation.passwordMismatch': 'Las dos contraseñas no coinciden.',

  /* -------------------------------------------------------------- error */

  'error.generic': 'Algo salió mal. Intente de nuevo.',
  'error.fetch': 'No se pudo contactar al servidor. Revise su conexión e intente de nuevo.',
  'error.timeout': 'El servidor tardó demasiado en responder. Intente de nuevo.',
  'error.parsing': 'El servidor devolvió una respuesta inesperada.',
  'error.badRequest': 'La solicitud fue rechazada. Revise los datos e intente de nuevo.',
  'error.unauthorized': 'Su sesión expiró. Inicie sesión de nuevo.',
  'error.forbidden': 'No tiene permiso para hacer eso.',
  'error.notFound': 'No encontramos lo que buscaba.',
  'error.conflict': 'Eso entra en conflicto con algo que ya existe.',
  'error.tooMany': 'Demasiados intentos. Espere un momento e intente de nuevo.',
  'error.fieldsHighlighted': 'Corrija los campos marcados.',

  'error.couldNotLoad': 'No se pudo cargar',
  'error.httpStatus': 'HTTP {status}',
  'error.boundaryTitle': 'Algo salió mal',
  'error.boundaryBody': 'La página encontró un error inesperado. Puede intentar de nuevo.',
  'error.routeBody': 'No se pudo cargar esta página. Recargar suele resolverlo.',
  'error.pageNotFound': 'Página no encontrada',
  'error.goHome': 'Volver al inicio',
}

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
  'common.viewAll': 'Ver todo',
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

  /* ---------------------------------------------------------- eliminación */

  'delete.action': 'Eliminar',
  'delete.title': '¿Eliminar este análisis?',
  'delete.description':
    'Se elimina el texto redactado de la póliza, el análisis extraído y la revisión registrada. El documento cargado nunca se almacenó, así que no queda nada más.',
  'delete.scopeLabel': 'Qué eliminar',
  'delete.scopeRun': 'Solo este análisis',
  'delete.scopeRunHint': {
    one: 'Se conserva {count} análisis más de este paciente.',
    other: 'Se conservan {count} análisis más de este paciente.',
  },
  'delete.scopePatient': {
    one: 'Los {count} análisis de este paciente',
    other: 'Los {count} análisis de este paciente',
  },
  'delete.scopePatientHint': 'Todo lo registrado con el paciente {id}, incluido este análisis.',
  'delete.onlyAnalysis': 'Es el único análisis registrado del paciente {id}.',
  'delete.irreversible':
    'Esta acción no se puede deshacer. Los análisis eliminados no se archivan ni se pueden recuperar.',
  'delete.confirmRun': 'Eliminar análisis',
  'delete.confirmPatient': {
    one: 'Eliminar {count} análisis',
    other: 'Eliminar {count} análisis',
  },
  'delete.deletedRun': 'Se eliminó el análisis.',
  'delete.deletedPatient': {
    one: 'Se eliminó {count} análisis.',
    other: 'Se eliminaron {count} análisis.',
  },

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
  'analysis.newAnalysis': 'Empezar de nuevo',
  'analysis.patientId': 'ID del paciente',
  'analysis.patientIdHint': 'El identificador con el que se archivará este análisis.',
  'analysis.patientIdRequired': 'Ingrese un ID de paciente antes de cargar el archivo.',
  'analysis.forPatient': 'Análisis del paciente {id}',
  'analysis.notFound': 'No encontrado',
  'analysis.showEvidence': 'Ver fuente',
  'analysis.hideEvidence': 'Ocultar fuente',
  'analysis.page': 'Página {page}',
  'analysis.criticalCount': {
    one: '{count} hallazgo crítico requiere atención.',
    other: '{count} hallazgos críticos requieren atención.',
  },

  /* -------------------------------------------------------- run summary */

  'runSummary.patient': 'Paciente (ID)',
  'runSummary.insurer': 'Aseguradora',
  'runSummary.urgency': 'Nivel de Urgencia',
  'runSummary.runId': 'Run ID',
  'runSummary.generatedAt': 'Fecha de generación',

  /* ------------------------------------------------------ extracción de póliza */

  'extraction.title': 'Extracción de Póliza',
  'extraction.description':
    'Los términos extraídos contra los que se lee todo lo demás. Abra un valor para ver la línea de la que salió.',
  'extraction.download': 'Descargar PDF',
  'extraction.downloadFailed': 'No se pudo generar el PDF. La tabla de arriba es seleccionable.',

  'extraction.edit': 'Editar valores',
  'extraction.doneEditing': 'Terminar edición',
  'extraction.editHint':
    'Corrija un valor que el análisis leyó mal antes de exportar. El análisis guardado no se modifica: las correcciones aplican a esta tabla y al PDF que descargue de ella.',
  'extraction.editField': 'Valor de {field}',
  'extraction.revert': 'Restaurar el valor extraído',
  'extraction.editedMarker': 'Corregido por el revisor',
  'extraction.editedWas': 'Extraído: {value}',
  'extraction.editedNotice': {
    one: 'Se corrigió 1 valor a mano. El PDF lleva la corrección y la señala como tal.',
    other: 'Se corrigieron {count} valores a mano. El PDF lleva las correcciones y las señala como tales.',
  },
  'extraction.resetEdits': 'Deshacer todas las correcciones',

  'extraction.pdfIntro':
    'Los términos que la póliza establece, extraídos del contrato y agrupados como los presenta el reporte. Un guion (—) indica un dato que el análisis no encontró en el documento.',
  'extraction.pdfEditedNote': {
    one: '* Un valor fue corregido a mano por el revisor y no es el valor que extrajo el análisis.',
    other:
      '* Los {count} valores marcados con asterisco fueron corregidos a mano por el revisor y no son los valores que extrajo el análisis.',
  },
  'extraction.pdfFooter':
    'CONFIDENCIAL — para uso del coordinador del caso. No contiene datos personales del paciente más allá del ID. Cada valor es rastreable a una cita en la consola.',
  'extraction.pdfFooterEdited':
    'CONFIDENCIAL — para uso del coordinador del caso. No contiene datos personales del paciente más allá del ID. Cada valor no marcado con asterisco es rastreable a una cita en la consola.',

  'extraction.groupIdentification': 'Identificación y administrativo',
  'extraction.groupFinancial': 'Estructura financiera',
  'extraction.groupCoverage': 'Alcance de la cobertura',
  'extraction.groupExclusions': 'Exclusiones y limitaciones',
  'extraction.groupPreexisting': 'Preexistencias y continuidad',
  'extraction.groupClaims': 'Proceso de siniestros',
  'extraction.groupDisputes': 'Disputa y regulación',

  'extraction.aseguradora': 'Aseguradora',
  'extraction.nombre_plan': 'Plan',
  'extraction.nivel_plan': 'Nivel del plan',
  'extraction.numero_poliza': 'Número de póliza',
  'extraction.tipo_poliza': 'Tipo de póliza',
  'extraction.contratante': 'Contratante',
  'extraction.asegurado_titular': 'Asegurado titular',
  'extraction.numero_dependientes': 'Dependientes',
  'extraction.vigencia_inicio': 'Inicio de vigencia',
  'extraction.vigencia_fin': 'Fin de vigencia',
  'extraction.fecha_renovacion': 'Fecha de renovación',
  'extraction.moneda': 'Moneda',
  'extraction.codigo_agente': 'Código de agente',
  'extraction.registro_cnsf': 'Registro CNSF',
  'extraction.periodo': 'Periodo de póliza',
  'extraction.confidence': 'Confianza de extracción',
  'extraction.extractedAt': 'Fecha de extracción',

  'extraction.suma_asegurada': 'Suma asegurada',
  'extraction.deducible': 'Deducible',
  'extraction.tipo_deducible': 'Tipo de deducible',
  'extraction.coaseguro_porcentaje': 'Coaseguro (%)',
  'extraction.tope_coaseguro': 'Tope de coaseguro',
  'extraction.copagos': 'Copagos',
  'extraction.prima_total': 'Prima total',
  'extraction.prima_neta': 'Prima neta',
  'extraction.recargos_derechos': 'Derechos y recargos',
  'extraction.forma_pago': 'Forma de pago',
  'extraction.tabulador_aplicable': 'Tabulador aplicable',
  'extraction.tope_honorarios_medicos': 'Tope honorarios médicos',
  'extraction.tope_medicamentos': 'Tope medicamentos',
  'extraction.tope_enfermeria': 'Tope enfermería',
  'extraction.tope_por_padecimiento': 'Tope por padecimiento',

  'extraction.hospitalizacion_cubierta': 'Hospitalización',
  'extraction.ambulatorio_cubierto': 'Ambulatorio',
  'extraction.medicamentos_cubiertos': 'Medicamentos',
  'extraction.maternidad_cubierta': 'Maternidad',
  'extraction.emergencias_cubiertas': 'Emergencias',
  'extraction.dental_vision_cubierto': 'Dental y visual',
  'extraction.biologicos_cubiertos': 'Biológicos cubiertos',
  'extraction.medicamentos_especialidad_cubiertos': 'Meds especialidad cubiertos',
  'extraction.pago_directo_disponible': 'Pago directo disponible',
  'extraction.pago_directo_medicamentos': 'Pago directo medicamentos',
  'extraction.coaseguro_medicamentos_ambulatorio': 'Coaseguro meds ambulatorio',
  'extraction.modelo_red': 'Modelo de red',
  'extraction.red_hospitalaria': 'Red hospitalaria',
  'extraction.nivel_hospitalario': 'Nivel hospitalario',
  'extraction.zona_cobertura': 'Zona de cobertura',
  'extraction.cobertura_eua': 'Cobertura en EUA',
  'extraction.terminos_cobertura_extranjero': 'Términos en el extranjero',

  'extraction.edad_maxima_admision': 'Edad máxima de admisión',
  'extraction.edad_maxima_permanencia': 'Edad máxima de permanencia',
  'extraction.congenitos_excluidos': 'Congénitos excluidos',
  'extraction.productos_dermatologicos_excluidos': 'Productos derm excluidos',
  'extraction.biologicos_excluidos': 'Biológicos excluidos',
  'extraction.cosmeticos_excluidos': 'Cosméticos excluidos',
  'extraction.exclusiones_especificas_asegurado': 'Exclusiones específicas',

  'extraction.preexistencias_excluidas': 'Preexistencias excluidas',
  'extraction.via_cobertura': 'Vía de cobertura',
  'extraction.cobertura_despues_de_meses': 'Cobertura después de (meses)',
  'extraction.rider_opcional_disponible': 'Rider opcional disponible',
  'extraction.regla_30_dias': 'Regla de 30 días',
  'extraction.antiguedad': 'Antigüedad',
  'extraction.portabilidad_antiguedad': 'Portabilidad de antigüedad',

  'extraction.plazo_aviso_siniestro_dias': 'Plazo de aviso (días)',
  'extraction.tipo_dias_aviso': 'Días hábiles o naturales',
  'extraction.metodo_notificacion': 'Método de notificación',
  'extraction.formatos_requeridos': 'Formatos requeridos',
  'extraction.plazo_liquidacion_dias': 'Plazo liquidación (días)',
  'extraction.via_reembolso': 'Vía de reembolso',
  'extraction.via_programacion': 'Vía de programación',
  'extraction.preautorizacion_alto_costo': 'Preautorización alto costo',

  'extraction.une_disponible': 'UNE disponible',
  'extraction.une_suspende_prescripcion': 'UNE suspende prescripción',
  'extraction.condusef_disponible': 'CONDUSEF disponible',
  'extraction.clausula_arbitraje': 'Cláusula de arbitraje',
  'extraction.plazo_prescripcion': 'Plazo de prescripción',
  'extraction.suspension_prescripcion': 'Suspensión de prescripción',
  'extraction.clausula_renovacion': 'Cláusula de renovación',
  'extraction.garantia_renovacion_vitalicia': 'Renovación garantizada/vitalicia',
  'extraction.agravacion_riesgo': 'Agravación del riesgo',
  'extraction.proceso_cancelacion': 'Proceso de cancelación',

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

  'status.succeeded': 'Exitoso',
  'status.failed': 'Fallido',
  'status.blocked_by_redaction': 'Bloqueado',

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

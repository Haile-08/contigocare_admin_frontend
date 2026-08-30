import type { Dictionary } from './en'

/**
 * Spanish.
 *
 * Typed as `Dictionary`, so this file will not compile until every key in
 * `en.ts` has a translation — and an obsolete key here is an error too.
 *
 * Register: neutral, impersonal Spanish rather than tú/usted wherever a verb
 * can be avoided ("Escriba" → "Introduzca", "Se necesita una cuenta"), which is
 * what keeps one translation usable across Spain and Latin America. Product
 * vocabulary is fixed: *conversación* for a thread, *mensaje* for a turn, and
 * *asistente* for the bot — the same word every time, since these label the
 * same objects across the dashboard, the rail and the chat.
 */
export const es: Dictionary = {
  /* ------------------------------------------------------------- common */

  'common.tryAgain': 'Reintentar',
  'common.reload': 'Recargar',
  'common.save': 'Guardar',
  'common.cancel': 'Cancelar',
  'common.new': 'Nueva',
  'common.all': 'Todas',
  'common.viewAll': 'Ver todas',
  'common.open': 'Abierta',
  'common.loading': 'Cargando',
  'common.language': 'Idioma',

  /* --------------------------------------------------------- navigation */

  'nav.main': 'Principal',
  'nav.overview': 'Resumen',
  'nav.work': 'Trabajo',
  'nav.dashboard': 'Panel',
  'nav.conversations': 'Conversaciones',
  'nav.breadcrumb': 'Ruta de navegación',

  /* ------------------------------------------------------------- topbar */

  'topbar.openNavigation': 'Abrir la navegación',
  'topbar.closeNavigation': 'Cerrar la navegación',
  'topbar.expandSidebar': 'Expandir la barra lateral',
  'topbar.collapseSidebar': 'Contraer la barra lateral',
  'topbar.switchToDark': 'Cambiar al modo oscuro',
  'topbar.switchToLight': 'Cambiar al modo claro',
  'topbar.account': 'Cuenta',
  'topbar.signedIn': 'Sesión iniciada',
  'topbar.signOut': 'Cerrar sesión',

  /* --------------------------------------------------------- auth shell */

  'auth.eyebrow': 'Asistente de cuidados · Consola de administración',
  'auth.headlineLead': 'Todas las conversaciones.',
  'auth.headlineAccent': 'Una sola consola.',
  'auth.intro':
    'Abra una conversación, siga al asistente mientras responde y conserve todo el historial en un mismo lugar, sin salir del navegador.',
  'auth.capability.conversations': 'Conversaciones',
  'auth.capability.conversationsBody':
    'Todas las sesiones que ha mantenido el asistente, en una sola lista.',
  'auth.capability.live': 'Respuestas en vivo',
  'auth.capability.liveBody':
    'Las respuestas llegan palabra a palabra, a medida que se escriben.',
  'auth.capability.history': 'Historial completo',
  'auth.capability.historyBody':
    'Renombre, retome o borre cualquier conversación desde la consola.',
  'auth.topic.sessions': 'Sesiones',
  'auth.topic.messages': 'Mensajes',
  'auth.topic.streaming': 'Transmisión',
  'auth.topic.history': 'Historial',
  'auth.footer': 'Consola interna · se necesita una cuenta',

  /* --------------------------------------------------------------- login */

  'login.title': 'Iniciar sesión',
  'login.subtitle': 'Use su cuenta de ContigoCare.',
  'login.sessionExpired': 'Su sesión ha caducado. Vuelva a iniciar sesión.',
  'login.submit': 'Iniciar sesión',
  'login.noAccount': '¿Aún no tiene cuenta?',
  'login.createOne': 'Cree una',
  'login.note':
    'Las conversaciones pertenecen a la cuenta que las abrió. Inicie sesión con la dirección que registró su equipo.',

  /* ------------------------------------------------------------ register */

  'register.title': 'Cree su cuenta',
  'register.subtitle': 'Solo toma un momento.',
  'register.submit': 'Crear cuenta',
  'register.haveAccount': '¿Ya tiene una cuenta?',
  'register.signIn': 'Iniciar sesión',

  /* -------------------------------------------------------------- fields */

  'field.email': 'Correo electrónico',
  'field.emailPlaceholder': 'usted@contigo.care',
  'field.password': 'Contraseña',
  'field.showPassword': 'Mostrar la contraseña',
  'field.hidePassword': 'Ocultar la contraseña',
  'field.displayName': 'Nombre visible',
  'field.displayNameHint': 'Opcional: el asistente lo usa para dirigirse a usted.',
  'field.passwordHint':
    '8 caracteres o más, con una mayúscula, una minúscula, un número y un carácter especial.',

  /* ---------------------------------------------------------- validation */

  'validation.email': 'Introduzca una dirección de correo válida',
  'validation.passwordRequired': 'Introduzca su contraseña',
  'validation.passwordMin': 'Use al menos 8 caracteres',
  'validation.passwordMax': 'Use como máximo 64 caracteres',
  'validation.passwordUppercase': 'Añada una letra mayúscula',
  'validation.passwordLowercase': 'Añada una letra minúscula',
  'validation.passwordNumber': 'Añada un número',
  'validation.passwordSpecial': 'Añada un carácter especial (por ejemplo !, ? o @)',
  'validation.nameMax': 'Use como máximo 50 caracteres',

  /* ----------------------------------------------------------- dashboard */

  'dashboard.title': 'Resumen',
  'dashboard.emptyCount': { one: '{count} vacía', other: '{count} vacías' },
  'dashboard.activeCount': { one: '{count} activa', other: '{count} activas' },
  'dashboard.sampleSize': 'Tamaño de la muestra',
  'dashboard.sampleOption': {
    one: '{count} conversación',
    other: '{count} conversaciones',
  },
  'dashboard.showPanel': 'Mostrar el panel',

  'dashboard.stat.conversations': 'Conversaciones',
  'dashboard.stat.conversationsCaptionAll': 'Todas leídas',
  'dashboard.stat.conversationsCaptionPartial': '{count} leídas para esta vista',
  'dashboard.stat.messages': 'Mensajes',
  'dashboard.stat.messagesCaption': 'sobre {sampled} de {total} conversaciones',
  'dashboard.stat.asked': 'Preguntas',
  'dashboard.stat.askedCaption': 'Turnos escritos por una persona',
  'dashboard.stat.answered': 'Respuestas',
  'dashboard.stat.answeredCaption': 'Respuestas del asistente',
  'dashboard.stat.average': 'Conversación media',
  'dashboard.stat.averageCaption': 'Mensajes por conversación activa',
  'dashboard.stat.openConversations': 'Abrir conversaciones',
  'dashboard.stat.readThreads': 'Leer las conversaciones',

  'dashboard.chart.title': 'Volumen por conversación',
  'dashboard.chart.empty': 'Todavía no hay nada que graficar: se llenará con el primer mensaje.',
  'dashboard.busiest': 'Conversaciones más activas',
  'dashboard.busiestEmpty': 'Aún no hay conversaciones. Empiece una desde Conversaciones.',
  'dashboard.row.unavailable': 'No se pudo leer la transcripción',
  'dashboard.row.noMessages': 'Aún no hay mensajes: ábrala para hacer la primera pregunta.',
  'dashboard.row.awaitingReply': 'Espera respuesta',
  'dashboard.row.answered': 'Respondida',
  'dashboard.row.messageAbbrev': 'msj',

  /* ------------------------------------------------------------ ops rail */

  'opsRail.label': 'Hoy',
  'opsRail.hidePanel': 'Ocultar el panel',
  'opsRail.waiting': 'Terminaron en una pregunta',
  'opsRail.waitingEmpty': 'Todas las conversaciones terminan con una respuesta.',
  'opsRail.unstarted': 'Nunca empezaron',
  'opsRail.unstartedEmpty': 'No queda ninguna conversación vacía.',
  'opsRail.badgeEmpty': 'Vacía',
  'opsRail.messageMix': 'Reparto de mensajes',
  'opsRail.mixEmpty': 'Todavía no se ha dicho nada.',
  'opsRail.method': 'Cómo se calcula',
  'opsRail.methodBody':
    'La API no tiene un endpoint de métricas, así que cada cifra se cuenta a partir de las propias transcripciones: una lectura por conversación de la muestra.',
  'opsRail.methodPartial':
    'Se muestran {sampled} de {total} conversaciones. Amplíe la muestra desde la cabecera para incluir más.',
  'opsRail.messageCount': { one: '{count} mensaje', other: '{count} mensajes' },

  /* ---------------------------------------------------------- session list */

  'sessions.label': 'Conversaciones',
  'sessions.title': 'Conversaciones',
  'sessions.new': 'Nueva',
  'sessions.untitled': 'Conversación sin título',
  'sessions.thisConversation': 'esta conversación',
  'sessions.fallbackName': 'la conversación',
  'sessions.empty': 'Aún no hay conversaciones. Empiece una con «Nueva».',
  'sessions.rename': 'Renombrar {name}',
  'sessions.delete': 'Eliminar {name}',
  'sessions.confirmDelete': '¿Eliminar «{name}» y su historial? Esta acción no se puede deshacer.',
  'sessions.nameLabel': 'Nombre de la conversación',

  /* ----------------------------------------------------------------- chat */

  'chat.clearHistory': 'Borrar el historial',
  'chat.confirmClear': '¿Eliminar todos los mensajes de esta conversación?',
  'chat.loading': 'Cargando la conversación',
  'chat.messageLabel': 'Mensaje',
  'chat.placeholder': 'Escriba un mensaje…',
  'chat.send': 'Enviar',
  'chat.tooLong': '{current} / {max} caracteres: acorte el mensaje para poder enviarlo.',
  'chat.thinking': 'Pensando…',
  'chat.youSaid': 'Usted dijo: ',
  'chat.assistantSaid': 'El asistente dijo: ',
  'chat.noMessages':
    'Aún no hay mensajes. Haga una pregunta abajo para empezar la conversación.',
  'chat.noneSelected': 'No hay ninguna conversación seleccionada',
  'chat.noneSelectedBody': 'Elija una conversación en la barra lateral o empiece una nueva.',
  'chat.gone': 'Esta conversación ya no existe.',
  'chat.backToConversations': 'Volver a las conversaciones',

  /* --------------------------------------------------------------- errors */

  'error.generic': 'Algo ha salido mal. Inténtelo de nuevo.',
  'error.fetch': 'No se pudo contactar con el servidor. Compruebe su conexión e inténtelo de nuevo.',
  'error.timeout': 'El servidor tardó demasiado en responder. Inténtelo de nuevo.',
  'error.parsing': 'El servidor devolvió una respuesta inesperada.',
  'error.badRequest': 'Se rechazó la solicitud. Revise los datos e inténtelo de nuevo.',
  'error.unauthorized': 'Su sesión ha caducado. Vuelva a iniciar sesión.',
  'error.forbidden': 'No tiene permiso para hacer eso.',
  'error.notFound': 'No encontramos lo que buscaba.',
  'error.conflict': 'Eso entra en conflicto con algo que ya existe.',
  'error.tooMany': 'Demasiados intentos. Espere un momento e inténtelo de nuevo.',
  'error.fieldsHighlighted': 'Corrija los campos marcados.',

  'error.couldNotLoad': 'No se pudo cargar esto',
  'error.httpStatus': 'HTTP {status}',
  'error.boundaryTitle': 'Algo ha salido mal',
  'error.boundaryBody': 'La página encontró un error inesperado. Puede volver a intentarlo.',
  'error.routeBody': 'No se pudo cargar esta página. Recargar suele solucionarlo.',
  'error.pageNotFound': 'Página no encontrada',
  'error.goHome': 'Volver al inicio',
}

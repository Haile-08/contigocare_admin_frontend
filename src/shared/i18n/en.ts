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
 */
export const en = {
  /* ------------------------------------------------------------- common */

  'common.tryAgain': 'Try again',
  'common.reload': 'Reload',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.new': 'New',
  'common.all': 'All',
  'common.viewAll': 'View all',
  'common.open': 'Open',
  'common.loading': 'Loading',
  'common.language': 'Language',

  /* --------------------------------------------------------- navigation */

  'nav.main': 'Main',
  'nav.overview': 'Overview',
  'nav.work': 'Work',
  'nav.dashboard': 'Dashboard',
  'nav.conversations': 'Conversations',
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

  'auth.eyebrow': 'Care assistant · Admin console',
  'auth.headlineLead': 'Every conversation.',
  'auth.headlineAccent': 'One console.',
  'auth.intro':
    'Open a thread, follow the assistant as it answers, and keep the whole history in one place — without leaving the browser.',
  'auth.capability.conversations': 'Conversations',
  'auth.capability.conversationsBody': 'Every session the assistant has held, in one list.',
  'auth.capability.live': 'Live replies',
  'auth.capability.liveBody': 'Answers stream in token by token, as they are written.',
  'auth.capability.history': 'Full history',
  'auth.capability.historyBody': 'Rename, revisit or clear any thread from the console.',
  'auth.topic.sessions': 'Sessions',
  'auth.topic.messages': 'Messages',
  'auth.topic.streaming': 'Streaming',
  'auth.topic.history': 'History',
  'auth.footer': 'Internal console · account required',

  /* --------------------------------------------------------------- login */

  'login.title': 'Sign in',
  'login.subtitle': 'Use your ContigoCare account.',
  'login.sessionExpired': 'Your session expired. Please sign in again.',
  'login.submit': 'Sign in',
  'login.noAccount': 'No account yet?',
  'login.createOne': 'Create one',
  'login.note':
    'Conversations are tied to the account that opened them. Sign in with the address your team registered.',

  /* ------------------------------------------------------------ register */

  'register.title': 'Create your account',
  'register.subtitle': 'It takes a moment.',
  'register.submit': 'Create account',
  'register.haveAccount': 'Already have an account?',
  'register.signIn': 'Sign in',

  /* -------------------------------------------------------------- fields */

  'field.email': 'Email',
  'field.emailPlaceholder': 'you@contigo.care',
  'field.password': 'Password',
  'field.showPassword': 'Show password',
  'field.hidePassword': 'Hide password',
  'field.displayName': 'Display name',
  'field.displayNameHint': 'Optional — the assistant uses it to address you.',
  'field.passwordHint':
    '8+ characters with an uppercase letter, a lowercase letter, a number and a special character.',

  /* ---------------------------------------------------------- validation */

  'validation.email': 'Enter a valid email address',
  'validation.passwordRequired': 'Enter your password',
  'validation.passwordMin': 'Use at least 8 characters',
  'validation.passwordMax': 'Use at most 64 characters',
  'validation.passwordUppercase': 'Add an uppercase letter',
  'validation.passwordLowercase': 'Add a lowercase letter',
  'validation.passwordNumber': 'Add a number',
  'validation.passwordSpecial': 'Add a special character (for example !, ? or @)',
  'validation.nameMax': 'Use at most 50 characters',

  /* ----------------------------------------------------------- dashboard */

  'dashboard.title': 'Overview',
  'dashboard.emptyCount': { one: '{count} empty', other: '{count} empty' },
  'dashboard.activeCount': { one: '{count} active', other: '{count} active' },
  'dashboard.sampleSize': 'Sample size',
  'dashboard.sampleOption': {
    one: '{count} conversation',
    other: '{count} conversations',
  },
  'dashboard.showPanel': 'Show panel',

  'dashboard.stat.conversations': 'Conversations',
  'dashboard.stat.conversationsCaptionAll': 'All read',
  'dashboard.stat.conversationsCaptionPartial': '{count} read for this view',
  'dashboard.stat.messages': 'Messages',
  'dashboard.stat.messagesCaption': 'across {sampled} of {total} conversations',
  'dashboard.stat.asked': 'Asked',
  'dashboard.stat.askedCaption': 'Turns written by a person',
  'dashboard.stat.answered': 'Answered',
  'dashboard.stat.answeredCaption': 'Replies from the assistant',
  'dashboard.stat.average': 'Average thread',
  'dashboard.stat.averageCaption': 'Messages per active conversation',
  'dashboard.stat.openConversations': 'Open conversations',
  'dashboard.stat.readThreads': 'Read the threads',

  'dashboard.chart.title': 'Volume by conversation',
  'dashboard.chart.empty': 'Nothing to chart yet — this fills in with the first message.',
  'dashboard.busiest': 'Busiest conversations',
  'dashboard.busiestEmpty': 'No conversations yet. Start one from Conversations.',
  'dashboard.row.unavailable': 'Transcript could not be read',
  'dashboard.row.noMessages': 'No messages yet — open it to ask the first question.',
  'dashboard.row.awaitingReply': 'Awaiting reply',
  'dashboard.row.answered': 'Answered',
  'dashboard.row.messageAbbrev': 'msg',

  /* ------------------------------------------------------------ ops rail */

  'opsRail.label': 'Today',
  'opsRail.hidePanel': 'Hide panel',
  'opsRail.waiting': 'Ended on a question',
  'opsRail.waitingEmpty': 'Every conversation ends with an answer.',
  'opsRail.unstarted': 'Never started',
  'opsRail.unstartedEmpty': 'No empty conversations left lying around.',
  'opsRail.badgeEmpty': 'Empty',
  'opsRail.messageMix': 'Message mix',
  'opsRail.mixEmpty': 'Nothing said yet.',
  'opsRail.method': 'How this is counted',
  'opsRail.methodBody':
    'The API has no metrics endpoint, so every figure here is counted from the transcripts themselves — one read per conversation in the sample.',
  'opsRail.methodPartial':
    'Showing {sampled} of {total} conversations. Raise the sample from the header to widen it.',
  'opsRail.messageCount': { one: '{count} message', other: '{count} messages' },

  /* ---------------------------------------------------------- session list */

  'sessions.label': 'Conversations',
  'sessions.title': 'Conversations',
  'sessions.new': 'New',
  'sessions.untitled': 'Untitled conversation',
  'sessions.thisConversation': 'this conversation',
  'sessions.fallbackName': 'conversation',
  'sessions.empty': 'No conversations yet. Start one with “New”.',
  'sessions.rename': 'Rename {name}',
  'sessions.delete': 'Delete {name}',
  'sessions.confirmDelete': 'Delete “{name}” and its history? This cannot be undone.',
  'sessions.nameLabel': 'Conversation name',

  /* ----------------------------------------------------------------- chat */

  'chat.clearHistory': 'Clear history',
  'chat.confirmClear': 'Delete every message in this conversation?',
  'chat.loading': 'Loading conversation',
  'chat.messageLabel': 'Message',
  'chat.placeholder': 'Send a message…',
  'chat.send': 'Send',
  'chat.tooLong': '{current} / {max} characters — shorten the message to send it.',
  'chat.thinking': 'Thinking…',
  'chat.youSaid': 'You said: ',
  'chat.assistantSaid': 'Assistant said: ',
  'chat.noMessages': 'No messages yet. Ask a question below to start the conversation.',
  'chat.noneSelected': 'No conversation selected',
  'chat.noneSelectedBody': 'Pick a conversation from the sidebar, or start a new one.',
  'chat.gone': 'This conversation no longer exists.',
  'chat.backToConversations': 'Back to conversations',

  /* --------------------------------------------------------------- errors */

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

import { useTranslation } from '@/shared/i18n'

export function ChatIndexPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-[15px] font-medium tracking-[-0.01em] text-body">
          {t('chat.noneSelected')}
        </h1>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
          {t('chat.noneSelectedBody')}
        </p>
      </div>
    </div>
  )
}

export default ChatIndexPage

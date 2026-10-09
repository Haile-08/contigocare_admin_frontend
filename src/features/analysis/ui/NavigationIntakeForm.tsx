import { useId, useState } from 'react'
import type { ReactNode } from 'react'

import { useTranslation } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Input, Textarea } from '@/shared/ui/Field'
import type { InputProps } from '@/shared/ui/Field'

import { useGetDrugCatalogQuery } from '../api/analysisApi'
import type { IntakeErrors, IntakeForm } from '../lib/navigationIntake'
import { localToday, validateIntakeForm } from '../lib/navigationIntake'
import { CARRIER_OPTIONS } from '../model/navigation'

interface NavigationIntakeFormProps {
  initial: IntakeForm
  isSubmitting: boolean
  submitLabel: string
  onSubmit: (form: IntakeForm) => void
  onCancel?: () => void
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h4 className="border-b border-line-strong pb-1.5 text-[10.5px] font-medium tracking-wide text-faint uppercase">
        {title}
      </h4>
      {children}
    </section>
  )
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-xs px-1.5 py-1 text-[12px] text-body transition-colors hover:bg-surface-sunk">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.75 size-3 shrink-0 accent-ink"
      />
      <span>{label}</span>
    </label>
  )
}

/**
 * InnovaDerm's patient intake.
 *
 * Grouped as the handover's intake template groups it: what the carátula says
 * (section A), the clinical picture (B), and where the claim stands (C). The
 * policy figures arrive prefilled from the saved analysis and are meant to be
 * checked against the carátula, because the twelve-month projection runs on
 * exactly what is in those boxes.
 *
 * Validation mirrors the server's so a mistake is caught before six model calls
 * are paid for; the server validates everything again.
 */
export function NavigationIntakeForm({
  initial,
  isSubmitting,
  submitLabel,
  onSubmit,
  onCancel,
}: NavigationIntakeFormProps) {
  const { t, fmt } = useTranslation()
  const carrierId = useId()
  const treatmentListId = useId()
  const catalog = useGetDrugCatalogQuery()
  const [form, setForm] = useState<IntakeForm>(initial)
  const [errors, setErrors] = useState<IntakeErrors>({})
  const [attempted, setAttempted] = useState(false)

  const today = localToday()

  const update = (next: IntakeForm): void => {
    setForm(next)
    // Errors appear on the first submit and then follow the operator's edits,
    // rather than shouting at a form nobody has finished filling in.
    if (attempted) setErrors(validateIntakeForm(next, today))
  }

  const set = <K extends keyof IntakeForm>(key: K, value: IntakeForm[K]): void => {
    update({ ...form, [key]: value })
  }

  /** Choosing a catalog therapy fills its COFEPRIS registration, as the handover's intake template does. */
  const setTreatment = (value: string): void => {
    const match = catalog.data?.items.find(
      (item) => item.clave === value.trim().toLowerCase() || item.marca.toLowerCase() === value.trim().toLowerCase(),
    )
    update({
      ...form,
      treatmentRx: value,
      cofepris: match && !form.cofepris ? match.registro_cofepris : form.cofepris,
    })
  }

  const errorFor = (key: keyof IntakeForm): string | undefined => {
    const messageKey: TranslationKey | undefined = errors[key]
    return messageKey ? t(messageKey) : undefined
  }

  const handleSubmit = (): void => {
    setAttempted(true)
    const found = validateIntakeForm(form, today)
    setErrors(found)
    if (Object.keys(found).length === 0) onSubmit(form)
  }

  const text = (key: keyof IntakeForm, label: TranslationKey, extra: Partial<InputProps> = {}) => (
    <Input
      label={t(label)}
      name={key}
      autoComplete="off"
      className="h-9 px-3"
      value={String(form[key])}
      error={errorFor(key)}
      onChange={(event) => set(key, event.target.value as IntakeForm[typeof key])}
      {...extra}
    />
  )

  return (
    <Card>
      <CardHeader title={t('navigation.intakeTitle')} description={t('navigation.intakeHint')} />

      <form
        className="flex flex-col gap-5 px-4.5 pb-4.5"
        onSubmit={(event) => {
          event.preventDefault()
          handleSubmit()
        }}
        noValidate
      >
        <Section title={t('navigation.sectionPolicy')}>
          <p className="text-[11px] leading-relaxed text-faint">{t('navigation.sectionPolicyHint')}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={carrierId} className="text-[12px] font-medium text-body">
                {t('navigation.field.carrier')}
              </label>
              <select
                id={carrierId}
                name="carrier"
                value={form.carrier}
                onChange={(event) => set('carrier', event.target.value)}
                className={cn(
                  'h-9 w-full rounded-xs border border-line-soft bg-surface px-3 text-[12.5px] text-body',
                  'hover:border-line-strong',
                )}
              >
                {CARRIER_OPTIONS.map((carrier) => (
                  <option key={carrier} value={carrier}>
                    {carrier}
                  </option>
                ))}
                <option value="">{t('navigation.field.carrierOther')}</option>
              </select>
            </div>
            {text('policyYearStart', 'navigation.field.policyYearStart', { type: 'date', required: true, max: today })}
            {text('monthsInsured', 'navigation.field.monthsInsured', { inputMode: 'numeric' })}
          </div>

          <p className="text-[11px] leading-relaxed text-faint">{t('navigation.field.financialHint')}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {text('deducible', 'navigation.field.deducible', { inputMode: 'decimal' })}
            {text('coaseguro', 'navigation.field.coaseguro', { inputMode: 'decimal' })}
            {text('tope', 'navigation.field.tope', { inputMode: 'decimal' })}
          </div>

          <div className="flex flex-col">
            <Check
              label={t('navigation.field.riderPreexisting')}
              checked={form.riderPreexisting}
              onChange={(value) => set('riderPreexisting', value)}
            />
            <Check
              label={t('navigation.field.programacionDone')}
              checked={form.programacionDone}
              onChange={(value) => set('programacionDone', value)}
            />
          </div>
        </Section>

        <Section title={t('navigation.sectionClinical')}>
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
            {text('diagnosis', 'navigation.field.diagnosis')}
            {text('icd10', 'navigation.field.icd10')}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_16rem]">
            <Input
              label={t('navigation.field.treatmentRx')}
              hint={t('navigation.field.treatmentRxHint')}
              name="treatmentRx"
              autoComplete="off"
              list={treatmentListId}
              className="h-9 px-3"
              value={form.treatmentRx}
              error={errorFor('treatmentRx')}
              onChange={(event) => setTreatment(event.target.value)}
            />
            {text('cofepris', 'navigation.field.cofepris')}
          </div>
          <datalist id={treatmentListId}>
            {(catalog.data?.items ?? []).map((item) => (
              <option key={item.clave} value={item.clave}>
                {item.marca} · {item.fabricante} · ${fmt.number(item.costo_mensual_mxn)}/mes
              </option>
            ))}
          </datalist>
          {catalog.isError ? <Alert tone="error">{t('navigation.catalogError')}</Alert> : null}

          <div className="grid gap-3 sm:grid-cols-3">
            {text('easi', 'navigation.field.easi', { inputMode: 'decimal' })}
            {text('scorad', 'navigation.field.scorad', { inputMode: 'decimal' })}
            {text('dlqi', 'navigation.field.dlqi', { inputMode: 'numeric' })}
          </div>

          <Textarea
            label={t('navigation.field.priorTreatments')}
            hint={t('navigation.field.priorTreatmentsHint')}
            rows={3}
            value={form.priorTreatments}
            error={errorFor('priorTreatments')}
            className="text-[12px]"
            onChange={(event) => set('priorTreatments', event.target.value)}
          />

          <Check
            label={t('navigation.field.preexisting')}
            checked={form.preexisting}
            onChange={(value) => set('preexisting', value)}
          />

          <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
            {text('dermatologistName', 'navigation.field.dermatologistName', {
              hint: t('navigation.field.dermatologistNameHint'),
              maxLength: 120,
            })}
            {text('dermatologistCedula', 'navigation.field.dermatologistCedula', { inputMode: 'numeric' })}
          </div>
        </Section>

        <Section title={t('navigation.sectionIncidence')}>
          <div className="grid gap-3 sm:grid-cols-2">
            {text('incidenceDate', 'navigation.field.incidenceDate', {
              type: 'date',
              required: true,
              hint: t('navigation.field.incidenceDateHint'),
            })}
            {text('authorizationExpiry', 'navigation.field.authorizationExpiry', {
              type: 'date',
              hint: t('navigation.field.authorizationExpiryHint'),
            })}
          </div>

          <Check
            label={t('navigation.field.notificationSent')}
            checked={form.notificationSent}
            onChange={(value) => set('notificationSent', value)}
          />

          <Textarea
            label={t('navigation.field.denialReason')}
            hint={t('navigation.field.denialReasonHint')}
            rows={3}
            maxLength={4000}
            value={form.denialReason}
            error={errorFor('denialReason')}
            className="text-[12px]"
            onChange={(event) => set('denialReason', event.target.value)}
          />
        </Section>

        {attempted && Object.keys(errors).length > 0 ? (
          <Alert tone="error">{t('navigation.formInvalid')}</Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" isLoading={isSubmitting}>
            {submitLabel}
          </Button>
          {onCancel ? (
            <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  )
}

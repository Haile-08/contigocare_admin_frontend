import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders, uiStateWith } from '@/test/renderWithProviders'

import { AnalysisIntakeStep } from './AnalysisIntakeStep'
import { DocumentUploader } from './DocumentUploader'

/** The step with the wizard's state around it, as the drawer mounts it. */
function Harness({ onFile, isExtracting = false }: { onFile: (file: File) => void; isExtracting?: boolean }) {
  const [patientId, setPatientId] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [names, setNames] = useState('')
  const [numbers, setNumbers] = useState('')
  return (
    <AnalysisIntakeStep
      patientId={patientId}
      patientIdError={error}
      knownNames={names}
      knownPolicyNumbers={numbers}
      isExtracting={isExtracting}
      onPatientIdChange={(value) => {
        setPatientId(value)
        setError(undefined)
      }}
      onKnownNamesChange={setNames}
      onKnownPolicyNumbersChange={setNumbers}
      onMissingPatientId={() => setError('Enter a patient ID before uploading.')}
      onFile={onFile}
    />
  )
}

function renderStep(onFile = vi.fn(), isExtracting = false) {
  renderWithProviders(<Harness onFile={onFile} isExtracting={isExtracting} />, {
    preloadedState: { ui: uiStateWith({ locale: 'en' }) },
  })
  return { onFile }
}

const policy = () => new File(['%PDF-1.7'], 'poliza.pdf', { type: 'application/pdf' })

describe('AnalysisIntakeStep', () => {
  it('groups the fields and marks the redaction helpers optional', () => {
    renderStep()

    expect(screen.getByRole('heading', { name: 'Patient' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Identifiers to remove/ })).toHaveTextContent('Optional')
    expect(screen.getByRole('heading', { name: 'Policy' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Names' })).toBeInTheDocument()
  })

  it('keeps the upload locked until there is a patient ID, and sends the operator to it', async () => {
    const user = userEvent.setup()
    const { onFile } = renderStep()

    const zone = screen.getByRole('button', { name: /Enter the patient ID first/ })
    await user.click(zone)

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a patient ID before uploading.')
    expect(screen.getByRole('textbox', { name: 'Patient ID' })).toHaveFocus()
    expect(onFile).not.toHaveBeenCalled()
  })

  it('unlocks the upload once the ID is typed, and hands the file on', async () => {
    const user = userEvent.setup()
    const { onFile } = renderStep()

    await user.type(screen.getByRole('textbox', { name: 'Patient ID' }), 'PAC-2026-0042')
    expect(screen.queryByText('Enter the patient ID first')).not.toBeInTheDocument()

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    await user.upload(input as HTMLInputElement, policy())

    expect(onFile).toHaveBeenCalledOnce()
    expect((onFile.mock.calls[0]?.[0] as File).name).toBe('poliza.pdf')
  })

  it('refuses a file dropped before the ID is typed', async () => {
    const { onFile } = renderStep()
    const zone = screen.getByRole('button', { name: /Enter the patient ID first/ }).parentElement as HTMLElement

    const drop = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(drop, 'dataTransfer', { value: { files: [policy()] } })
    zone.dispatchEvent(drop)

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a patient ID before uploading.')
    expect(onFile).not.toHaveBeenCalled()
  })

  it('names the file while it is being read', async () => {
    const user = userEvent.setup()
    const { rerender } = renderWithProviders(<DocumentUploader isLoading={false} onSelect={vi.fn()} />, {
      preloadedState: { ui: uiStateWith({ locale: 'en' }) },
    })

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    await user.upload(input as HTMLInputElement, policy())
    rerender(<DocumentUploader isLoading onSelect={vi.fn()} />)

    expect(screen.getByText('Reading poliza.pdf')).toBeInTheDocument()
  })
})

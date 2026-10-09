import { baseApi } from '@/shared/api/baseApi'

import type {
  DownloadedFile,
  DownloadNavigationFileRequest,
  DrugCatalog,
  NavigationRun,
  RunNavigationRequest,
  SubmitNavigationFeedbackRequest,
} from '../model/navigation'
import { drugCatalogSchema, navigationResponseSchema } from '../model/navigation'
import type {
  AnalysisDetail,
  AnalysisList,
  AnalysisListQuery,
  AnalysisResult,
  AnalyzeRequest,
  DeleteAnalysisRequest,
  DeletionReceipt,
  ExtractedDocument,
  ExtractRequest,
  FeedbackRequest,
} from '../model/types'
import {
  analysisDetailSchema,
  analysisListSchema,
  analyzeResponseSchema,
  deletionResponseSchema,
  extractResponseSchema,
} from '../model/types'

/**
 * The policy surface: list, open, and the two-call analysis with the operator's
 * judgement in between.
 *
 * What is cached and what is not follows what the response actually contains.
 * The **list** is metadata — patient id, insurer, timestamps — and is cached
 * and tag-invalidated like any other list. `extract` and `analyze` are
 * mutations that cache nothing at all: an extracted policy is the most
 * sensitive thing this app ever holds, and leaving it in the RTK Query cache
 * means it sits in memory long after the screen that needed it is gone.
 *
 * The **detail** sits in between. It carries the redacted policy text, which is
 * safe to store — it is what the server itself keeps — but there is no reason
 * for it to linger, so it is dropped the moment its screen unmounts.
 */

/**
 * The budget for the two calls that wait on OCR or on a model.
 *
 * It sits deliberately **above** the server's own ceiling for those routes
 * (`ANALYSIS_TIMEOUT_SECONDS`, 195s). Whichever side gives up first is the one
 * that writes the message the operator reads, and the server's is the better
 * message: it knows whether the model was saturated, whether the run was
 * recorded, and whether trying again is worth anything. A client that abandons
 * the socket first can only say "the server took too long" — while the server,
 * unaware anyone left, finishes the analysis and stores a result nobody asked
 * to see.
 */
const SLOW_REQUEST_TIMEOUT_MS = 240_000

export const analysisApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAnalyses: builder.query<AnalysisList, AnalysisListQuery | void>({
      query: (args) => ({
        url: '/insurance/analyses',
        params: {
          limit: args?.limit ?? 25,
          offset: args?.offset ?? 0,
          // Omitted rather than sent empty: `patient_id=` would be a filter on
          // the empty string as far as the query string is concerned.
          ...(args?.patientId ? { patient_id: args.patientId } : {}),
        },
      }),
      transformResponse: (response: unknown) => analysisListSchema.parse(response),
      providesTags: [{ type: 'Analysis', id: 'LIST' }],
    }),

    getAnalysis: builder.query<AnalysisDetail, string>({
      query: (analysisId) => ({
        url: `/insurance/analyses/${encodeURIComponent(analysisId)}`,
      }),
      transformResponse: (response: unknown) => analysisDetailSchema.parse(response),
      providesTags: (_result, _error, analysisId) => [{ type: 'Analysis', id: analysisId }],
      // Holds the redacted policy. Safe to keep, but no reason to: it goes when
      // the screen showing it does.
      keepUnusedDataFor: 0,
    }),

    extractDocument: builder.mutation<ExtractedDocument, ExtractRequest>({
      query: ({ file, names, policyNumbers }) => {
        const body = new FormData()
        body.append('file', file)
        // Sent with the upload so the scan proposes every occurrence; the
        // server does not keep them.
        if (names.trim()) body.append('names', names.trim())
        if (policyNumbers.trim()) body.append('policy_numbers', policyNumbers.trim())
        return {
          url: '/insurance/extract',
          method: 'POST',
          body,
          // OCR on a 60-page scan runs for minutes. The shared budget is sized
          // for ordinary API calls, so this one carries its own.
          timeout: SLOW_REQUEST_TIMEOUT_MS,
          // Never set Content-Type by hand for FormData: the browser has to add
          // the multipart boundary, and an explicit header overwrites it.
        }
      },
      // Re-uploading a document the server may still be parsing wastes the
      // upload and doubles the OCR bill for one operator action.
      extraOptions: { maxRetries: 0 },
      transformResponse: (response: unknown) => extractResponseSchema.parse(response),
    }),

    analyzePolicy: builder.mutation<AnalysisResult, AnalyzeRequest>({
      query: ({ patientId, document, approvedSpans }) => ({
        url: '/insurance/analyze',
        method: 'POST',
        body: {
          patient_id: patientId,
          document_sha256: document.document_sha256,
          document_kind: document.document_kind,
          page_count: document.page_count,
          // The original text plus the approved spans — the server performs the
          // redaction itself. Sending pre-redacted text would make the browser
          // the thing enforcing the guarantee.
          text: document.text,
          approved_spans: approvedSpans.map((span) => ({
            start: span.start,
            end: span.end,
            category: span.category,
            confidence: span.confidence,
          })),
        },
        timeout: SLOW_REQUEST_TIMEOUT_MS,
      }),
      // An analysis is the expensive call in this app and it is not idempotent
      // — it writes a run. A transport-level retry would bill a second one.
      extraOptions: { maxRetries: 0 },
      transformResponse: (response: unknown) => analyzeResponseSchema.parse(response),
      // A completed analysis changes every figure on the dashboard, and adds a
      // row to the policy list.
      invalidatesTags: [
        { type: 'Dashboard', id: 'OVERVIEW' },
        { type: 'Analysis', id: 'LIST' },
      ],
    }),

    getDrugCatalog: builder.query<DrugCatalog, void>({
      query: () => ({ url: '/insurance/navigator/catalog' }),
      transformResponse: (response: unknown) => drugCatalogSchema.parse(response),
    }),

    runNavigation: builder.mutation<NavigationRun, RunNavigationRequest>({
      query: ({ analysisId, intake }) => ({
        url: `/insurance/analyses/${encodeURIComponent(analysisId)}/navigation`,
        method: 'POST',
        body: intake,
      }),
      // The server answers at once with a `running` run and works in the
      // background; a transport retry would start and store a second one.
      extraOptions: { maxRetries: 0 },
      transformResponse: (response: unknown) => navigationResponseSchema.parse(response),
    }),

    getNavigation: builder.query<NavigationRun, string>({
      query: (navigationId) => ({ url: `/insurance/navigations/${encodeURIComponent(navigationId)}` }),
      transformResponse: (response: unknown) => navigationResponseSchema.parse(response),
      providesTags: (_result, _error, navigationId) => [{ type: 'Navigation', id: navigationId }],
      // Polled while the pipeline runs, and the result carries the case: no
      // reason to keep it once the screen is gone.
      keepUnusedDataFor: 0,
    }),

    submitNavigationFeedback: builder.mutation<void, SubmitNavigationFeedbackRequest>({
      query: ({ navigationId, verdict, sections, notes }) => ({
        url: `/insurance/navigations/${encodeURIComponent(navigationId)}/feedback`,
        method: 'POST',
        body: { verdict, sections, notes },
      }),
      // The verdict is shown on the navigation itself, and on the analysis
      // detail that carries its latest navigation.
      invalidatesTags: (_result, _error, { navigationId, analysisId }) => [
        { type: 'Navigation', id: navigationId },
        { type: 'Analysis', id: analysisId },
      ],
    }),

    /**
     * The coordinator report or the broker kit, built by the server in memory.
     *
     * Kept out of the cache as bytes: the response becomes an object URL the
     * component clicks and revokes, so only a string is ever stored.
     */
    downloadNavigationFile: builder.mutation<DownloadedFile, DownloadNavigationFileRequest>({
      query: ({ navigationId, kind }) => ({
        url: `/insurance/navigations/${encodeURIComponent(navigationId)}/${kind}`,
        responseHandler: async (response: Response) => {
          if (!response.ok) return response.json()
          const disposition = response.headers.get('Content-Disposition') ?? ''
          const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? ''
          return { url: URL.createObjectURL(await response.blob()), filename }
        },
        timeout: SLOW_REQUEST_TIMEOUT_MS,
      }),
      extraOptions: { maxRetries: 0 },
    }),

    submitFeedback: builder.mutation<void, FeedbackRequest>({
      query: ({ analysisId, verdict, fieldCorrections, notes }) => ({
        url: `/insurance/analyses/${encodeURIComponent(analysisId)}/feedback`,
        method: 'POST',
        body: {
          verdict,
          field_corrections: fieldCorrections,
          notes,
        },
      }),
      // A verdict moves the accuracy rate, the row's badge in the list, and the
      // feedback shown on the analysis itself — which is the copy the reviewer
      // is about to edit again.
      invalidatesTags: (_result, _error, { analysisId }) => [
        { type: 'Dashboard', id: 'OVERVIEW' },
        { type: 'Analysis', id: 'LIST' },
        { type: 'Analysis', id: analysisId },
      ],
    }),

    deleteAnalysis: builder.mutation<DeletionReceipt, DeleteAnalysisRequest>({
      query: ({ analysisId, scope }) => ({
        url: `/insurance/analyses/${encodeURIComponent(analysisId)}`,
        method: 'DELETE',
        params: { scope },
      }),
      // Erasure is not idempotent from the operator's side: a retry after a
      // response that was merely slow to arrive lands on a run that is already
      // gone and reports a 404 for work that succeeded.
      extraOptions: { maxRetries: 0 },
      transformResponse: (response: unknown) => deletionResponseSchema.parse(response),
      // With `scope: 'patient'` this removes rows the console never named, so
      // the whole list and every dashboard figure are invalidated rather than
      // the one id — a cached page that still lists an erased analysis is the
      // one thing this feature cannot leave behind.
      invalidatesTags: (_result, _error, { analysisId }) => [
        { type: 'Dashboard', id: 'OVERVIEW' },
        { type: 'Analysis', id: 'LIST' },
        { type: 'Analysis', id: analysisId },
      ],
    }),
  }),
})

export const {
  useListAnalysesQuery,
  useGetAnalysisQuery,
  useExtractDocumentMutation,
  useAnalyzePolicyMutation,
  useSubmitFeedbackMutation,
  useDeleteAnalysisMutation,
  useGetDrugCatalogQuery,
  useRunNavigationMutation,
  useGetNavigationQuery,
  useDownloadNavigationFileMutation,
  useSubmitNavigationFeedbackMutation,
} = analysisApi

import { z } from 'zod'

import { baseApi } from '@/shared/api/baseApi'

/**
 * The dashboard's figures.
 *
 * Every number is computed by the API from stored runs and stored verdicts.
 * The previous dashboard derived its numbers client-side by fetching every
 * conversation and counting messages, which cost one request per row and made
 * the screen slower the more there was to show. Aggregation belongs in the
 * database, and this endpoint is a constant number of queries whatever the
 * table size.
 */

const analysisSummarySchema = z.object({
  id: z.string(),
  patient_id: z.string(),
  created_at: z.string(),
  status: z.string(),
  aseguradora: z.string().nullish(),
  confianza_global: z.string().nullish(),
  verdict: z.string().nullish(),
  latency_ms: z.number().default(0),
  hallazgos_criticos: z.number().default(0),
})

const dashboardSchema = z.object({
  total_analyses: z.number().default(0),
  analyses_last_7_days: z.number().default(0),
  distinct_patients: z.number().default(0),
  success_rate: z.number().default(0),
  review_rate: z.number().default(0),
  accuracy_rate: z.number().default(0),
  blocked_count: z.number().default(0),
  median_latency_ms: z.number().default(0),
  redaction_totals: z.record(z.string(), z.number()).default({}),
  verdict_breakdown: z.record(z.string(), z.number()).default({}),
  recent: z.array(analysisSummarySchema).default([]),
})

export type DashboardOverview = z.infer<typeof dashboardSchema>
export type AnalysisSummary = z.infer<typeof analysisSummarySchema>

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOverview: builder.query<DashboardOverview, { limit?: number } | void>({
      query: (args) => ({
        url: '/dashboard',
        params: { limit: args?.limit ?? 15 },
      }),
      transformResponse: (response: unknown) => dashboardSchema.parse(response),
      providesTags: [{ type: 'Dashboard', id: 'OVERVIEW' }],
    }),
  }),
})

export const { useGetOverviewQuery } = dashboardApi

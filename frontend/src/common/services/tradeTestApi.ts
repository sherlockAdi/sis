import { apiFetch } from "./apiFetch";

export type TradeTestRecordRow = {
  trade_test_id: number;
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  phone: string | null;
  email: string | null;
  job_id: number;
  job_title: string;
  job_code: string | null;
  partner_id: number;
  partner_name: string | null;
  trade_test_required: boolean | 0 | 1 | null;
  application_status: string | null;
  review_status: string | null;
  deployment_id: number | null;
  trade_video_file_path: string | null;
  trade_video_file_name: string | null;
  trade_video_file_size: number | null;
  trade_video_uploaded_at: string | null;
  certificate_file_path: string | null;
  certificate_file_name: string | null;
  certificate_file_size: number | null;
  certificate_uploaded_at: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

export type TradeTestUpsertInput = {
  review_status?: string | null;
  trade_video_file_path?: string | null;
  trade_video_file_name?: string | null;
  trade_video_file_size?: number | null;
  certificate_file_path?: string | null;
  certificate_file_name?: string | null;
  certificate_file_size?: number | null;
  remarks?: string | null;
};

export const tradeTestApi = {
  admin: {
    list: () => apiFetch<TradeTestRecordRow[]>(`/trade-test/submissions`, { method: "GET" }),
    get: (application_id: number) => apiFetch<TradeTestRecordRow>(`/trade-test/submissions/${application_id}`, { method: "GET" }),
    upsert: (application_id: number, input: TradeTestUpsertInput) =>
      apiFetch<{ trade_test_id: number; deployment_id: number | null; deployment_created: boolean; application_status: string | null }>(
        `/trade-test/submissions/${application_id}`,
        { method: "PUT", body: JSON.stringify(input) },
      ),
  },
  partner: {
    list: () => apiFetch<TradeTestRecordRow[]>(`/partner/deployment-zone/trade-tests`, { method: "GET" }),
  },
};

# Required Supabase Views

The React app is wired to the canonical views from the implementation plan. If a view does not exist, the app keeps the UI section ready and shows `Data source not connected yet` instead of fake values.

## Acquisition

- vw_acq_person_summary_v3
- vw_acq_person_deals_v3
- vw_acq_rank_coverage_v1
- vw_acq_activity_details_v1
- vw_acq_country_coverage_v3
- vw_acq_rank_breakdown_v3
- vw_acq_rep_leaderboard_v3
- vw_acq_company_next_activity_v3
- vw_acq_deals_at_risk_v3
- vw_acquisition_lead_summary
- vw_acquisition_priority_leads
- vw_acquisition_lead_source_performance
- vw_acq_financial_summary_v1
- vw_acq_sheet_financial_rows_v1

## Retention

- vw_retention_person_summary_v3
- vw_retention_person_accounts_v3
- vw_retention_person_deals_v3
- vw_retention_activity_details_v1
- vw_retention_role_coverage_v3
- vw_retention_no_next_activity_v3
- vw_retention_financial_summary_v1
- vw_retention_sheet_accounts_v1

## P&L

- vw_pnl_monthly_summary_v2
- vw_pnl_cost_breakdown_v2
- vw_pnl_product_profitability_v3

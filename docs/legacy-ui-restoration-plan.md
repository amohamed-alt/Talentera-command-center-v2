# Legacy UI Restoration Execution Plan

Reference target: the old Talentera command center screenshots and legacy HTML.

Current issue: the current `index.html` is too generic and does not match the old dashboard hierarchy, density, sidebar, top tabs, KPI rows, retention blocks, acquisition rep pages, or financial details layout.

Decision: stop iterating on the compact generic renderer. Restore the legacy-style shell and wire Supabase data into that structure.

## Required visual structure

- Dark green sidebar with Talentera logo.
- Main sections: Acquisition, Retention, P&L.
- Acquisition reps listed under Acquisition.
- Retention Team / Financial Details / Features Plan under Retention.
- Retention team owners listed under Retention Team.
- Sticky top header with title, updated timestamp, live status, refresh button.
- Horizontal sub-tabs under the top header.
- White/glass rounded cards, dense KPI rows, old-style tables and status pills.

## Pages to restore first

1. Retention Team Overview
   - Today's Retention Focus
   - Smart Actions
   - Retention KPI Snapshots: Yesterday / MTD / YTD
   - Monthly Renewal Pipeline
   - Unified Renewal Table
   - Coverage Quality
   - Churn Reasons
   - RM / CSM Follow-up Metrics by Tier
   - RM View / CSM View summaries

2. Acquisition Rep Page
   - Rep header
   - Yesterday / MTD / YTD summary
   - Needs To Contact: online vs offline
   - AI Coaching / attention list
   - Open Deals
   - Rank A/B Coverage
   - Stuck Deals >21 days
   - Leads summary

3. Retention Financial Details
   - Budget Renewal
   - Booked Total
   - Cash Collected
   - Remaining Collection
   - Not in Budget
   - Owner Financial Summary
   - Renewal Status Split sections

4. Acquisition Financial Details
   - Cashing Revenue
   - Signed Contract
   - Pending To Cash
   - Cashing table
   - Signed / Booking table

## Supabase views already available

- vw_acquisition_sidebar_reps
- vw_acquisition_kpi_snapshot_periods
- vw_acquisition_rep_kpi_periods
- vw_acquisition_team_snapshot
- vw_acquisition_rank_coverage
- vw_acquisition_rank_details
- vw_acquisition_leads_need_contact_v2
- vw_acquisition_pipeline_snapshot
- vw_acquisition_pipeline_details
- vw_acquisition_pipeline_by_stage
- vw_acquisition_stuck_deals
- vw_acquisition_cold_deals
- vw_retention_renewal_logic
- vw_retention_sidebar_reps
- vw_retention_kpi_snapshot
- vw_retention_coverage_quality
- vw_retention_not_in_budget
- vw_pnl_advanced_summary
- vw_pnl_monthly_advanced
- vw_pnl_cost_breakdown
- vw_pnl_year_comparison

## Implementation approach

Use smaller commits because full `index.html` replacement is being blocked by the write tool.

Commit 1: restore CSS/sidebar/top-tabs only.
Commit 2: restore Retention Team Overview render function.
Commit 3: restore Acquisition Rep render function.
Commit 4: restore Retention Financial Details.
Commit 5: restore Acquisition Financial Details.
Commit 6: QA click-through drawers and filters.

## Acceptance checks

- Visual hierarchy matches screenshots.
- Not a raw Supabase table viewer.
- Every main KPI is clickable.
- Company/deal names open HubSpot.
- Owner-scoped activity remains correct.
- Fadi/Faizan are deal-only in Acquisition.
- No Abdullah/Bassam in sidebars.

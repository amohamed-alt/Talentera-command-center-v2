# Talentera Command Center V2 — Full Porting Blueprint

Purpose: rebuild the new Supabase dashboard using the old dashboard UX and business logic as the reference, not as a raw data-table dashboard.

This document is the source of truth so the project does not lose context between sessions.

---

## 0) Core principle

Old dashboard experience stays. Only the data source changes.

Old:
- index legacy HTML
- data.json for Acquisition
- data-retention.json for Retention

New:
- Supabase raw tables/views
- n8n sync jobs
- index.html renders the same UX using Supabase views

The HTML should not do heavy business logic. Supabase views should return ready dashboard-shaped datasets.

---

## 1) Main navigation structure

### Main sidebar

Required main modules:
1. Executive Overview
2. Acquisition
3. Retention
4. P&L
5. Upselling / Features Plan
6. Marketing
7. Data Quality / Source Diagnostics

### Acquisition sidebar

When Acquisition is open, show two groups:

#### Acquisition Activity Reps
These have calls, connected calls, meetings, Rank A/B coverage, leads, and pipeline:
- Marita Chedid
- Zein Fares
- Ursula Waked
- Ahmad Khawajah
- Mohammad Jehad Al-Barqawi
- Mohamed Khaled — temporary, add when owner ID is confirmed

Do NOT show:
- Abdullah
- Bassam
- Unassigned
- any owner not in allowlist

#### Acquisition Deal Owners Only
These appear in Acquisition only for deal/pipeline ownership, not activity coverage:
- Fadi Zanona
- Mohammed Faizan

For Fadi/Faizan in Acquisition, show only:
- open deals
- won deals
- lost deals
- pipeline amount
- deal list
- HubSpot links

Do NOT show for deal-only owners:
- calls
- connected calls
- meetings
- Rank A/B coverage
- needs contact

### Retention sidebar

#### Retention RM
- Fadi Zanona
- Mohammad Jehad Al-Barqawi
- Mohammed Faizan

#### Retention CSM
- Darshna Suresh
- Haia Al-Zo’ubi
- Hatem Alawneh
- Maryam Alfarra
- Sarah Al-jarrah

---

## 2) Acquisition — required page structure

### 2.1 Team Overview page

Must look like old dashboard, not raw tables.

Order:
1. Today's Focus / Command Preview
2. Team Performance
3. Insights & Recommendations
4. Detailed KPI Cards — visible by default
5. Critical Follow-ups
6. Lead Funnel / Source Performance
7. Leads Overview
8. Outreach Coverage
9. Rank A/B Coverage
10. Acquisition Pipeline
11. Open Pipeline by Rep
12. Closed Won / Lost
13. AI Sales Insights / recommendations
14. Market news if still useful

### 2.2 KPI Snapshot

Show three periods:
- Yesterday
- MTD
- YTD

For each period, show:
- calls logged
- connected calls
- connection rate
- meetings completed
- leads created
- inbound leads
- outbound leads
- open deals snapshot
- pipeline value
- won deals
- won amount
- lost deals
- lost amount

Old JSON reference:
- `kpi.yesterday.calls`
- `kpi.yesterday.connected`
- `kpi.yesterday.connRate`
- `kpi.yesterday.meetings`
- `kpi.yesterday.openDeals`
- `kpi.yesterday.openDealsSnap`
- `kpi.yesterday.pipeline`
- `kpi.yesterday.leads`
- `kpi.yesterday.wonAmt`
- `kpi.yesterday.wonDeals`
- `kpi.yesterday.lost`
- `kpi.yesterday.lostAmt`
- same pattern for `mtd` and `ytd`

Old team reference:
- `team.callsYest`
- `team.callsConn`
- `team.callsMTD`
- `team.callsMTDConn`
- `team.callsYTD`
- `team.callsYTDConn`
- `team.meetings`
- `team.meetingsMTD`
- `team.meetingsYTD`
- `team.openDeals`
- `team.pipeline`
- `team.won`, `team.wonAmt`, `team.wonYTD`, `team.wonAmtYTD`
- `team.lost`, `team.lostAmt`, `team.lostYTD`, `team.lostAmtYTD`
- `team.leadsYest`, `team.leadsYestInbound`, `team.leadsYestOutbound`
- `team.leadsMTD`, `team.leadsMTDInbound`, `team.leadsMTDOutbound`
- `team.leadsYTD`, `team.leadsYTDInbound`, `team.leadsYTDOutbound`

Required Supabase views:
- `vw_acquisition_kpi_snapshot_periods`
- `vw_acquisition_team_snapshot`
- `vw_acquisition_rep_kpi_periods`

Connected call logic:
- `hs_call_status = 'COMPLETED'`
- `hs_call_disposition = 'f240bbac-87c9-4f6e-bf70-924b57d47db7'`

Meetings completed logic:
- `is_completed = true` OR `upper(hs_meeting_outcome) = 'COMPLETED'`

All activity counts must be scoped to the same owner being displayed. Do not count a Faizan meeting on a Marita-owned company under Marita.

---

## 3) Acquisition Rep View / Subpage

Each activity rep page must include:

1. Rep hero
   - rep name
   - calls yest / MTD / YTD
   - connected calls yest / MTD / YTD
   - connection rates
   - meetings yest / MTD / YTD
   - open deals
   - pipeline amount
   - won MTD/YTD
   - lost MTD/YTD

2. Rank A/B Coverage card
   - Rank A total
   - Rank A contacted
   - Rank A not contacted
   - Rank A untouched list
   - Rank B total
   - Rank B contacted
   - Rank B not contacted
   - Rank B untouched list
   - country chips inside the card
   - internal table filter by country, rank, contacted/not contacted, online/offline if available

3. Leads Need Contact split
   - Online / Inbound leads needing contact
   - Offline / Outbound leads needing contact
   - all rows clickable
   - default show 5 then See More

4. Pipeline section
   - open deals
   - stuck deals
   - cold deals
   - needs attention
   - closed won
   - closed lost
   - amounts
   - stage
   - next activity
   - HubSpot link

5. Rep details drawers
   - every number opens the matching row list

Old JSON reference per rep:
- `repData[].calls.yest`
- `repData[].calls.yestConn`
- `repData[].calls.mtd`
- `repData[].calls.mtdConn`
- `repData[].calls.ytd`
- `repData[].calls.ytdConn`
- `repData[].connRateYest`
- `repData[].connRateMTD`
- `repData[].connRateYTD`
- `repData[].meetings.yest`
- `repData[].meetings.mtd`
- `repData[].meetings.ytd`
- `repData[].openDeals`
- `repData[].pipeAmt`
- `repData[].won`, `wonAmt`, `wonYTD`, `wonAmtYTD`
- `repData[].lost`, `lostAmt`, `lostYTD`, `lostAmtYTD`
- `repData[].rankA`, `rankAContacted`, `rankANotContacted`, `rankAUntouched`
- `repData[].rankB`, `rankBContacted`, `rankBNotContacted`, `rankBUntouched`
- `repData[].countryBreakdown`
- `repData[].rankAByCountry`
- `repData[].rankBByCountry`
- `repData[].stuck`
- `repData[].cold`
- `repData[].needsAttention`
- `repData[].topDeals`
- `repData[].leadActivities`
- `repData[].leadQuality`
- `repData[].leadFunnel`

Required Supabase views:
- `vw_acquisition_rep_overview`
- `vw_acquisition_rep_activity_periods`
- `vw_acquisition_rep_rank_summary`
- `vw_acquisition_rep_rank_details`
- `vw_acquisition_rep_needs_contact`
- `vw_acquisition_rep_pipeline_summary`
- `vw_acquisition_rep_deal_details`

---

## 4) Acquisition Rank A/B Coverage

The old dashboard has `renderRepRankCoverageCard(rep, rankA, rankB)` with country chips and rank summaries. New dashboard must preserve this pattern.

Rules:
- Rank A/B companies belong to the company owner.
- Connected calls and completed meetings must be counted only when the activity owner is the same as the company owner / displayed rep.
- Do not count another rep's call/meeting on the same company for the displayed rep.
- Table must have internal filters:
  - country
  - rank A/B
  - contacted / not contacted
  - connected calls > 0
  - completed meetings > 0
  - online / offline if source exists

Fields needed in detail rows:
- company_id
- company_name
- company_url
- owner_id
- owner_name
- rank
- country
- company_tier
- source / online_offline
- calls_logged_by_owner
- connected_calls_by_owner
- meetings_logged_by_owner
- completed_meetings_by_owner
- last_call_by_owner
- last_meeting_by_owner
- last_touch_by_owner
- needs_contact
- contacted_status

Current partial views:
- `vw_acquisition_company_owner_activity_v2`
- `vw_acquisition_rank_coverage`
- `vw_acquisition_rank_details`

Need upgrade:
- add online/offline/source fields
- add last call / last meeting fields
- add MTD/YTD per company if useful

---

## 5) Acquisition Leads / Outreach Coverage

Old dashboard has outreach and clickable metrics for:
- leads_not_contacted
- leads_contacted
- online_not_contacted
- offline_not_contacted
- companies_not_contacted
- rank_a_untouched
- rank_b_untouched
- rank_ab_untouched
- deals_at_risk
- open_deals

Required sections:
1. Outreach Coverage top KPIs
2. Online / Offline split
3. Leads Need Contact list
4. Companies Not Contacted list
5. Rank A/B untouched list
6. Details drawer for every metric

Old helper logic in HTML references:
- `acqRowsForMetric(kind, opts)`
- `getAcqNoConnectedMetricRows('online'|'offline'|'all', repId)`
- clickables for `leads_not_contacted`, `online_not_contacted`, `offline_not_contacted`, `rank_a_untouched`, `rank_b_untouched`

Required Supabase views:
- `vw_acquisition_outreach_summary`
- `vw_acquisition_outreach_details`
- `vw_acquisition_leads_need_contact`
- `vw_acquisition_company_need_contact`

Need source mapping:
- Define online/inbound vs offline/outbound from HubSpot fields.
- Candidate fields: lead source, original source, latest source, campaign/source fields, lifecycle/source fields from synced data.
- If source field is unclear, Data Quality page should show `Missing source` rather than hiding rows.

---

## 6) Acquisition Pipeline

Required metrics:
- open deals count
- open pipeline amount
- won deals yesterday / MTD / YTD
- won amount yesterday / MTD / YTD
- lost deals yesterday / MTD / YTD
- lost amount yesterday / MTD / YTD
- stuck deals
- cold deals
- no next activity
- pipeline by stage
- open pipeline by rep

Deal-only owners:
- Fadi Zanona
- Mohammed Faizan

For them, only pipeline/deal data should appear.

Old JSON references:
- `team.openDeals`
- `team.pipeline`
- `team.won`, `team.wonAmt`, `team.wonYTD`, `team.wonAmtYTD`
- `team.lost`, `team.lostAmt`, `team.lostYTD`, `team.lostAmtYTD`
- `repData[].openDeals`
- `repData[].pipeAmt`
- `repData[].won`, `wonAmt`, `wonYTD`, `wonAmtYTD`
- `repData[].lost`, `lostAmt`, `lostYTD`, `lostAmtYTD`
- `repData[].stuck`
- `repData[].cold`
- `repData[].needsAttention`
- `repData[].topDeals`

Required Supabase views:
- `vw_acquisition_pipeline_summary_periods`
- `vw_acquisition_pipeline_by_stage`
- `vw_acquisition_pipeline_by_owner`
- `vw_acquisition_deal_owner_summary`
- `vw_acquisition_deal_owner_details`
- `vw_acquisition_stuck_deals`
- `vw_acquisition_cold_deals`
- `vw_acquisition_no_next_activity_deals`

Definitions:
- Cold deals threshold: 21 days unless updated.
- Stuck deals: days in current stage over configured threshold, based on `hs_v2_date_entered_current_stage` or equivalent.
- Open pipeline: acquisition pipeline, open stages only.
- Won/lost: close date or date entered closed stage, scoped to period.

---

## 7) Retention Overview

Retention old JSON is the source of truth for business rules.

Logic rules:
- booked: deal currently in Booked stage and `hs_v2_date_entered_current_stage` is in current year.
- cashed: deal currently in Cashed stage and `hs_v2_date_entered_current_stage` is in current year.
- churn: deal currently in Churned stage and churn stage date is in current year.
- renewed: same company has a deal currently in Booked/Cashed and entered current stage this year.
- delayed: active renewal account only, renewal date passed, and no same-company Booked/Cashed deal entered current stage this year. Churned accounts excluded.
- touch: connected call disposition `f240bbac-87c9-4f6e-bf70-924b57d47db7` OR meeting outcome completed by assigned RM/CSM on company or associated deal.
- tier follow-up: Tier A CSM 7d / RM 14d, Tier B CSM 14d / RM 30d, Tier C CSM 30d / RM 90d.

Required Retention Overview sections:
1. KPI Snapshot Yesterday / MTD / YTD
2. Team Matrix
3. RM Matrix
4. CSM Matrix
5. Delayed Renewals
6. Renewal Pipeline
7. Accounts To Renew
8. Coverage Details
9. Tier follow-ups
10. Missing tier accounts
11. Churn review
12. Auto recommendations

Old JSON references:
- `logicRules`
- `summary`
- `kpi.yesterday`, `kpi.mtd`, `kpi.ytd`
- `team`
- `repData`
- `rmMatrix`
- `csmMatrix`
- `ownerMatrix`
- `ownerDetails`
- `accounts`
- `accountsSplit`
- `deals`
- `dealsSplit`
- `renewalPipeline`
- `monthlyRenewalPipeline`
- `accountsToRenew`
- `delayedRenewals`
- `coverageDetails`

Required Supabase views:
- `vw_retention_kpi_snapshot`
- `vw_retention_team_summary`
- `vw_retention_owner_matrix`
- `vw_retention_owner_details`
- `vw_retention_delayed_renewals`
- `vw_retention_accounts_to_renew`
- `vw_retention_monthly_renewal_pipeline`
- `vw_retention_tier_followups`
- `vw_retention_missing_tier_accounts`
- `vw_retention_coverage_details`
- `vw_retention_churn_review`

---

## 8) Retention Rep View

Each RM/CSM page must show:
- accounts
- active accounts
- churned accounts
- renewed count/amount
- booked count/amount
- cashed count/amount
- churn count/amount
- delayed count/amount
- calls
- meetings
- no contact
- no meeting
- tier follow-up due
- account list
- renewed/booked/cashed/churned deal list
- tier follow-up list
- coverage details

Owner details from old JSON:
- `ownerDetails[ownerId].accounts`
- `ownerDetails[ownerId].renewedDeals`
- `ownerDetails[ownerId].bookedDeals`
- `ownerDetails[ownerId].cashedDeals`
- `ownerDetails[ownerId].churnDeals`
- account fields include `rmLastCall`, `rmLastMeeting`, `rmDaysSinceTouch`, `rmFollowupDue`, `csmLastCall`, `csmLastMeeting`, `csmDaysSinceTouch`, `csmFollowupDue`.

---

## 9) Retention Financial Details

Required financial KPIs:
- Renewal Value
- Booked Value Total
- Cash Collected
- Booked Not Cash
- Remaining Collection
- Delayed Value
- Renewed Late
- Lost / Churned
- Expected To Be Lost
- Not In Budget

Required tables:
- Budget vs Booking vs Collection
- Product summary
- Monthly renewal pipeline
- Booked accounts
- Cash collected accounts
- Booked not cash
- Remaining collection
- Delayed renewals
- Renewed late
- Lost / churned
- Expected to be lost
- Not in budget

Rules:
- Lost and Lost from 2025 are excluded from delayed follow-up.
- Expected to be lost can still appear as delayed but must be tagged as expected lost.
- Booked/cashed rows not found in budget appear under Not In Budget and should not distort core budget matching.
- Do not convert negative values to positive.
- No unnecessary decimals in UI.

---

## 10) P&L

Required KPIs:
- Booking
- Cashing
- Revenue if separate
- COGS
- Overheads
- Support/Super Allocation
- Total Cost
- Net Cash Position
- Net Booking Position
- Gross Profit / Net Profit if available
- Margin %
- Cost to Cash %
- Cost to Booking %

Required tables:
- Product summary
- Monthly advanced
- Cost breakdown
- Year comparison
- 2025 vs 2026

Existing views:
- `vw_pnl_advanced_summary`
- `vw_pnl_monthly_advanced`
- `vw_pnl_cost_breakdown`
- `vw_pnl_year_comparison`

Rules:
- Total Cost = COGS + Overheads + Support/Super Allocation.
- Negative values remain signed.
- Do not use absolute value.

---

## 11) Upselling / Features Plan

Required KPIs:
- total clients
- feature rows
- proposal sent
- interested
- not interested
- upsell value
- renewal value
- potential open value

Required grouping:
- group rows by company
- company appears once
- aggregate feature counts
- aggregate proposal/interested/not interested counts
- company-level renewal and upsell values must not double count duplicate feature rows

Filters:
- month
- product line
- owner
- CSM
- status

Required views:
- `vw_features_plan_dashboard_summary`
- `vw_features_plan_company_summary`
- `vw_features_plan_status_breakdown`
- `vw_features_plan_details`

---

## 12) Clickability and drawers

Every KPI/card number that represents rows must be clickable.

Required drawers:
- connected calls
- completed meetings
- leads need contact
- online need contact
- offline need contact
- Rank A untouched
- Rank B untouched
- open deals
- won deals
- lost deals
- cold deals
- stuck deals
- no next activity
- delayed renewals
- booked not cash
- cash collected
- not in budget
- expected lost
- tier followups
- missing tier
- P&L cost rows
- upsell interested companies

Drawer row rules:
- show first meaningful columns, not raw dump
- company/deal/contact names open HubSpot record
- include owner, source, date, amount, status
- table has internal search/filter where needed

---

## 13) Field source / data quality page

Create a clear Field Sources page/table that explains:
- metric name
- source table/view
- source fields
- transformation logic
- last sync status
- missing fields count

Must include:
- connected calls source
- completed meetings source
- company rank source
- company country source
- online/offline source
- lead source
- deal stage source
- open/won/lost source
- P&L source
- Retention Budget/Booking/Cash source
- Features Plan source

This page should prevent confusion when a metric looks different from the old JSON.

---

## 14) Implementation order

Do not rebuild everything randomly. Execute in this order:

### Sprint A — Acquisition foundation
1. owner allowlist
2. connected call logic
3. activity owner scoping
4. acquisition KPI snapshot periods
5. acquisition sidebar groups
6. company rank details with owner-scoped activity

### Sprint B — Acquisition UX from old HTML
1. restore tabs bar inside Acquisition
2. restore Team Overview layout order
3. restore rep subpages
4. restore Rank A/B card with country chips and internal filters
5. restore outreach coverage and online/offline leads
6. restore pipeline sections
7. make all KPIs clickable

### Sprint C — Retention
1. Retention overview
2. RM/CSM pages
3. Financial Details
4. tier follow-up and coverage

### Sprint D — P&L
1. connect advanced views
2. build product/month/cost/year comparison UI

### Sprint E — Upselling
1. group by company
2. filters
3. details drawers

### Sprint F — Marketing + Data Quality
1. source diagnostics
2. field sources
3. data quality warnings

---

## 15) Current critical fixes pending

1. Add Mohamed Khaled owner ID to allowlist when provided.
2. Rebuild Acquisition HTML from old layout rather than current raw table UI.
3. Add internal filters inside rank tables.
4. Create online/offline source mapping.
5. Create deal-only Acquisition section for Fadi/Faizan.
6. Replace all current generic owner activity views with allowlisted views.
7. Avoid showing Abdullah/Bassam/Unassigned in sidebar.
8. Connect P&L advanced views in HTML.

---

## 16) Acceptance criteria

Acquisition is done only when:
- opening Acquisition shows old-style tabs and sections
- reps are correct
- Fadi/Faizan are deals-only
- Bassam/Abdullah never appear
- connected calls are not zero if HubSpot has connected disposition rows
- Rank A/B activity counts are scoped to the displayed rep only
- every major KPI opens correct details
- company/deal rows open HubSpot
- internal filters exist in Rank A/B and Leads/Outreach sections

Retention is done only when:
- logic matches old retention JSON rules
- RM/CSM pages match old owner matrices
- delayed/lost/expected-lost are separated correctly
- financial details reconcile with Budget/Booking/Cash sheets

P&L is done only when:
- cost breakdown is visible
- signed negatives remain signed
- 2025/2026 comparisons work

Upselling is done only when:
- company-level grouping prevents duplicate values
- proposal/interested/not interested are clear

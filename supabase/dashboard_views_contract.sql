-- Talentera Command Center — Supabase view contract
-- Use this as the stable API layer for the React dashboard.
-- React should display these views; KPI calculations should live in SQL.

-- 1) Acquisition summary cards
-- Expected columns:
-- label text, value numeric, helper text, tone text, type text
create or replace view public.v_acquisition_summary as
select
  'Today Focus'::text as label,
  0::numeric as value,
  'Rank A/B companies needing contact'::text as helper,
  'green'::text as tone,
  'number'::text as type
where false;

-- 2) Acquisition people
-- Include fixed person pages:
-- Mariata, Orsla, Ahmed Khawaja, Zain, Fares, Mohamed, Jihad.
-- Fadi and Faizan should be deals-only in acquisition: open/won/lost only, no activity metrics.
create or replace view public.v_acquisition_people as
select
  null::text as owner_name,
  null::text as role,
  true::boolean as activities,
  0::numeric as calls_logged,
  0::numeric as connected_calls,
  0::numeric as meetings_completed,
  0::numeric as deals_created,
  0::numeric as open_deals,
  0::numeric as won_deals,
  0::numeric as lost_deals,
  0::numeric as rank_a_companies,
  0::numeric as rank_b_companies
where false;

-- 3) Acquisition priority list
-- Acquisition Rank cards/lists must only include Rank A and Rank B.
create or replace view public.v_acquisition_priority as
select
  null::text as company,
  null::text as owner_name,
  null::text as country,
  null::text as rank,
  null::text as status,
  null::text as next_step
where false;

-- 4) Retention summary cards
create or replace view public.v_retention_summary as
select
  'Renewal Value'::text as label,
  0::numeric as value,
  'Filtered renewal scope'::text as helper,
  'green'::text as tone,
  'money'::text as type
where false;

-- 5) Retention people
-- Include RMs: Fadi, Jihad, Faizan.
-- Include CSMs: Haya, Mariam, Sara, Darshna, Hatem.
-- Tiers are company/account tiers only: A, B, C, Empty.
create or replace view public.v_retention_people as
select
  null::text as owner_name,
  null::text as role,
  0::numeric as calls_logged,
  0::numeric as connected_calls,
  0::numeric as meetings_completed,
  0::numeric as deals_created,
  0::numeric as open_deals,
  0::numeric as won_deals,
  0::numeric as lost_deals,
  0::numeric as tier_a_accounts,
  0::numeric as tier_b_accounts,
  0::numeric as tier_c_accounts,
  0::numeric as empty_tier_accounts
where false;

-- 6) Retention accounts
create or replace view public.v_retention_accounts as
select
  null::text as company,
  null::text as owner_name,
  null::text as csm,
  null::text as product,
  null::text as tier,
  null::text as status,
  0::numeric as renewal_value,
  0::numeric as cash_collected
where false;

-- 7) P&L monthly
-- total cost = cogs + overheads + super_allocate.
-- Keep negative amounts as negative amounts; do not abs() them in SQL.
create or replace view public.v_pnl_monthly as
select
  null::text as month,
  null::text as year,
  0::numeric as revenue,
  0::numeric as cogs,
  0::numeric as overheads,
  0::numeric as super_allocate
where false;

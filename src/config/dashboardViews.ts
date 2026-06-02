export const views = {
  acquisition: {
    personSummary: 'mv_acq_person_summary_v3',
    personDeals: 'mv_acq_person_deals_v3',
    rankCoverage: 'mv_acq_rank_coverage_v1',
    activityDetails: 'mv_acq_activity_details_v1',
    countryCoverage: 'mv_acq_country_coverage_v3',
    rankBreakdown: 'mv_acq_rank_breakdown_v3',
    repLeaderboard: 'mv_acq_rep_leaderboard_v3',
    companyNextActivity: 'mv_acq_company_next_activity_v3',
    dealsAtRisk: 'mv_acq_deals_at_risk_v3',
    leadSummary: 'vw_acquisition_lead_summary',
    priorityLeads: 'vw_acquisition_priority_leads',
    leadSourcePerformance: 'vw_acquisition_lead_source_performance',
    financialSummary: 'vw_acq_financial_summary_v1',
    sheetFinancialRows: 'vw_acq_sheet_financial_rows_v1'
  },
  retention: {
    personSummary: 'mv_retention_person_summary_v3',
    personAccounts: 'mv_retention_person_accounts_v3',
    personDeals: 'mv_retention_person_deals_v3',
    activityDetails: 'mv_retention_activity_details_v1',
    roleCoverage: 'mv_retention_role_coverage_v3',
    noNextActivity: 'mv_retention_no_next_activity_v3',
    financialSummary: 'vw_retention_financial_summary_v1',
    sheetAccounts: 'vw_retention_sheet_accounts_v1'
  },
  pnl: {
    monthlySummary: 'mv_pnl_monthly_summary_v2',
    costBreakdown: 'mv_pnl_cost_breakdown_v2',
    productProfitability: 'mv_pnl_product_profitability_v3'
  }
} as const;

export const views = {
  acquisition: {
    personSummary: 'vw_acq_person_summary_v3',
    personDeals: 'vw_acq_person_deals_v3',
    rankCoverage: 'vw_acq_rank_coverage_v1',
    activityDetails: 'vw_acq_activity_details_v1',
    countryCoverage: 'vw_acq_country_coverage_v3',
    rankBreakdown: 'vw_acq_rank_breakdown_v3',
    repLeaderboard: 'vw_acq_rep_leaderboard_v3',
    companyNextActivity: 'vw_acq_company_next_activity_v3',
    dealsAtRisk: 'vw_acq_deals_at_risk_v3',
    leadSummary: 'vw_acquisition_lead_summary',
    priorityLeads: 'vw_acquisition_priority_leads',
    leadSourcePerformance: 'vw_acquisition_lead_source_performance',
    financialSummary: 'vw_acq_financial_summary_v1',
    sheetFinancialRows: 'vw_acq_sheet_financial_rows_v1'
  },
  retention: {
    personSummary: 'vw_retention_person_summary_v3',
    personAccounts: 'vw_retention_person_accounts_v3',
    personDeals: 'vw_retention_person_deals_v3',
    activityDetails: 'vw_retention_activity_details_v1',
    roleCoverage: 'vw_retention_role_coverage_v3',
    noNextActivity: 'vw_retention_no_next_activity_v3',
    financialSummary: 'vw_retention_financial_summary_v1',
    sheetAccounts: 'vw_retention_sheet_accounts_v1'
  },
  pnl: {
    monthlySummary: 'vw_pnl_monthly_summary_v2',
    costBreakdown: 'vw_pnl_cost_breakdown_v2',
    productProfitability: 'vw_pnl_product_profitability_v3'
  }
} as const;

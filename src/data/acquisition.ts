import { views } from '../config/dashboardViews';
import { fetchView } from '../lib/fetchView';
import type { DashboardFilters } from '../types';

export async function loadAcquisitionOverview(filters: DashboardFilters) {
  const v = views.acquisition;
  const [personSummary, personDeals, rankCoverage, countryCoverage, rankBreakdown, repLeaderboard, companyNextActivity, dealsAtRisk, leadSummary, priorityLeads, leadSourcePerformance, financialSummary] = await Promise.all([
    fetchView(v.personSummary, filters),
    fetchView(v.personDeals, filters),
    fetchView(v.rankCoverage, filters),
    fetchView(v.countryCoverage, filters),
    fetchView(v.rankBreakdown, filters),
    fetchView(v.repLeaderboard, filters),
    fetchView(v.companyNextActivity, filters),
    fetchView(v.dealsAtRisk, filters),
    fetchView(v.leadSummary, filters),
    fetchView(v.priorityLeads, filters),
    fetchView(v.leadSourcePerformance, filters),
    fetchView(v.financialSummary, filters)
  ]);
  return { personSummary, personDeals, rankCoverage, countryCoverage, rankBreakdown, repLeaderboard, companyNextActivity, dealsAtRisk, leadSummary, priorityLeads, leadSourcePerformance, financialSummary };
}

export async function loadAcquisitionPerson(filters: DashboardFilters, personKey: string) {
  const v = views.acquisition;
  const personFilter = { person_key: personKey };
  const [summary, deals, rankCoverage, activityDetails, countryCoverage, dealsAtRisk, companyNextActivity, financialSummary] = await Promise.all([
    fetchView(v.personSummary, filters, personFilter),
    fetchView(v.personDeals, filters, personFilter),
    fetchView(v.rankCoverage, filters, personFilter),
    fetchView(v.activityDetails, filters, personFilter),
    fetchView(v.countryCoverage, filters, personFilter),
    fetchView(v.dealsAtRisk, filters, personFilter),
    fetchView(v.companyNextActivity, filters, personFilter),
    fetchView(v.financialSummary, filters, { rep_key: personKey })
  ]);
  return { summary, deals, rankCoverage, activityDetails, countryCoverage, dealsAtRisk, companyNextActivity, financialSummary };
}

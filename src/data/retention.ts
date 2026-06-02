import { views } from '../config/dashboardViews';
import { fetchView } from '../lib/fetchView';
import type { DashboardFilters } from '../types';

export async function loadRetentionOverview(filters: DashboardFilters) {
  const v = views.retention;
  const [personSummary, personAccounts, personDeals, activityDetails, roleCoverage, noNextActivity, financialSummary] = await Promise.all([
    fetchView(v.personSummary, filters),
    fetchView(v.personAccounts, filters),
    fetchView(v.personDeals, filters),
    fetchView(v.activityDetails, filters),
    fetchView(v.roleCoverage, filters),
    fetchView(v.noNextActivity, filters),
    fetchView(v.financialSummary, filters)
  ]);
  return { personSummary, personAccounts, personDeals, activityDetails, roleCoverage, noNextActivity, financialSummary };
}

export async function loadRetentionPerson(filters: DashboardFilters, personKey: string) {
  const v = views.retention;
  const personFilter = { person_key: personKey };
  const [summary, accounts, deals, activityDetails, noNextActivity, financialSummary] = await Promise.all([
    fetchView(v.personSummary, filters, personFilter),
    fetchView(v.personAccounts, filters, personFilter),
    fetchView(v.personDeals, filters, personFilter),
    fetchView(v.activityDetails, filters, personFilter),
    fetchView(v.noNextActivity, filters, personFilter),
    fetchView(v.financialSummary, filters, personFilter)
  ]);
  return { summary, accounts, deals, activityDetails, noNextActivity, financialSummary };
}

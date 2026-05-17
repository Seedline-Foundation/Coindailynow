/**
 * BE-1-2: Reporting facade — first slice of FinanceService decomposition.
 */
import { financeService } from '../FinanceService';

export const FinanceReportingFacade = {
  getInstance: () => financeService,
};

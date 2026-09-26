export type SyncServerInvestecAccount = {
  balance: number | null;
  account_id: string;
  institution: string;
  orgDomain?: string | null;
  orgId?: string;
  name: string;
};

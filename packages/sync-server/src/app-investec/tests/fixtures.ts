import type {
  InvestecAccount,
  InvestecBalance,
  InvestecTransaction,
} from '#app-investec/investec-service';

export const mockAccount: InvestecAccount = {
  accountId: '3353431574710163189587446',
  accountNumber: '10011234567',
  accountName: 'Mr J Smith',
  referenceName: 'Everyday',
  productName: 'Private Bank Account',
  kycCompliant: true,
  profileId: '10163189587446',
  profileName: 'Mr J Smith',
};

export const mockBalance: InvestecBalance = {
  accountId: mockAccount.accountId,
  currentBalance: 34305.66,
  availableBalance: 33931.66,
  currency: 'ZAR',
};

export const mockCardPurchase: InvestecTransaction = {
  accountId: mockAccount.accountId,
  type: 'DEBIT',
  transactionType: 'CardPurchases',
  status: 'POSTED',
  description: 'WOOLWORTHS   CAVENDISH   CAPE TOWN ZA',
  cardNumber: '402167xxxxxx9999',
  postedOrder: 11050,
  postingDate: '2026-09-14',
  valueDate: '2026-09-14',
  actionDate: '2026-09-14',
  transactionDate: '2026-09-12',
  amount: 374,
  runningBalance: 34305.66,
};

export const mockSalary: InvestecTransaction = {
  accountId: mockAccount.accountId,
  type: 'CREDIT',
  transactionType: 'Deposits',
  status: 'POSTED',
  description: 'ACME SALARY SEP',
  cardNumber: '',
  postedOrder: 11049,
  postingDate: '2026-09-01',
  valueDate: '2026-09-01',
  actionDate: '2026-09-01',
  transactionDate: '2026-09-01',
  amount: 25000.5,
  runningBalance: 34679.66,
  uuid: 'b2c6f1c0-2a27-4d5a-9b1c-0a1e2f3d4c5b',
};

export const mockPending: InvestecTransaction = {
  accountId: mockAccount.accountId,
  type: 'DEBIT',
  transactionType: null,
  status: 'PENDING',
  description: 'UBER TRIP',
  cardNumber: '402167xxxxxx9999',
  postedOrder: 0,
  postingDate: null,
  valueDate: null,
  actionDate: '2026-09-20',
  transactionDate: '2026-09-20',
  amount: 89.99,
  runningBalance: 0,
};

export const mockOldTransaction: InvestecTransaction = {
  ...mockCardPurchase,
  description: 'BEFORE START DATE',
  postedOrder: 10000,
  postingDate: '2026-07-01',
  transactionDate: '2026-07-01',
  amount: 10,
};

type Route = (url: URL, init?: RequestInit) => Response | undefined;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function investecFetchMock({
  transactions = [mockCardPurchase, mockSalary, mockPending],
  tokenStatus = 200,
  pages,
  extra,
}: {
  transactions?: InvestecTransaction[];
  tokenStatus?: number;
  pages?: InvestecTransaction[][];
  extra?: Route;
} = {}) {
  return async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input.toString());

    const custom = extra?.(url, init);
    if (custom) return custom;

    if (url.pathname === '/identity/v2/oauth2/token') {
      if (tokenStatus !== 200) {
        return json({ error: 'invalid_client' }, tokenStatus);
      }
      return json({
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 1799,
        scope: 'accounts',
      });
    }

    if (url.pathname === '/za/pb/v1/accounts') {
      return json({
        data: { accounts: [mockAccount] },
        meta: { totalPages: 1 },
      });
    }

    if (url.pathname.endsWith('/balance')) {
      return json({ data: mockBalance });
    }

    if (url.pathname.endsWith('/transactions')) {
      if (pages) {
        const page = Number(url.searchParams.get('page') ?? '1');
        return json({
          data: { transactions: pages[page - 1] ?? [] },
          meta: { totalPages: pages.length },
        });
      }
      return json({ data: { transactions }, meta: { totalPages: 1 } });
    }

    return json({ message: 'Not found' }, 404);
  };
}

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearInvestecTokenCache,
  createInvestecClient,
  getTransactionId,
  InvestecApiError,
  normaliseTransaction,
} from '#app-investec/investec-service';

import {
  investecFetchMock,
  mockAccount,
  mockCardPurchase,
  mockPending,
  mockSalary,
} from './fixtures';

const credentials = {
  clientId: 'client-id',
  clientSecret: 'client-secret',
  apiKey: 'api-key',
};

describe('createInvestecClient', () => {
  beforeEach(() => {
    clearInvestecTokenCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests a token with basic auth, the API key and client credentials grant', async () => {
    const fetchImpl = vi.fn(investecFetchMock());
    const client = createInvestecClient(credentials, { fetchImpl });

    await client.getAccounts();

    const [tokenUrl, tokenInit] = fetchImpl.mock.calls[0];
    expect(String(tokenUrl)).toBe(
      'https://openapi.investec.com/identity/v2/oauth2/token',
    );
    const headers = tokenInit?.headers as Record<string, string>;
    expect(headers.Authorization).toBe(
      `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`,
    );
    expect(headers['x-api-key']).toBe('api-key');
    expect(tokenInit?.body).toBe('grant_type=client_credentials');

    const [, accountsInit] = fetchImpl.mock.calls[1];
    expect(
      (accountsInit?.headers as Record<string, string>).Authorization,
    ).toBe('Bearer test-access-token');
  });

  it('reuses a cached token across requests', async () => {
    const fetchImpl = vi.fn(investecFetchMock());
    const client = createInvestecClient(credentials, { fetchImpl });

    await client.getAccounts();
    await client.getBalance(mockAccount.accountId);

    const tokenCalls = fetchImpl.mock.calls.filter(([url]) =>
      String(url).includes('/oauth2/token'),
    );
    expect(tokenCalls).toHaveLength(1);
  });

  it('returns accounts and balances', async () => {
    const client = createInvestecClient(credentials, {
      fetchImpl: investecFetchMock(),
    });

    expect(await client.getAccounts()).toEqual([mockAccount]);
    expect(await client.getBalance(mockAccount.accountId)).toMatchObject({
      currentBalance: 34305.66,
      currency: 'ZAR',
    });
  });

  it('follows pagination and passes the date range and pending flag', async () => {
    const fetchImpl = vi.fn(
      investecFetchMock({ pages: [[mockCardPurchase], [mockSalary]] }),
    );
    const client = createInvestecClient(credentials, { fetchImpl });

    const transactions = await client.getTransactions(
      mockAccount.accountId,
      '2026-09-01',
      '2026-09-26',
    );

    expect(transactions).toEqual([mockCardPurchase, mockSalary]);

    const txUrls = fetchImpl.mock.calls
      .map(([url]) => new URL(String(url)))
      .filter(url => url.pathname.endsWith('/transactions'));
    expect(txUrls).toHaveLength(2);
    expect(txUrls[0].searchParams.get('fromDate')).toBe('2026-09-01');
    expect(txUrls[0].searchParams.get('toDate')).toBe('2026-09-26');
    expect(txUrls[0].searchParams.get('includePending')).toBe('true');
    expect(txUrls[0].searchParams.get('page')).toBeNull();
    expect(txUrls[1].searchParams.get('page')).toBe('2');
  });

  it('throws an auth error when the token request is rejected', async () => {
    const client = createInvestecClient(credentials, {
      fetchImpl: investecFetchMock({ tokenStatus: 401 }),
    });

    const error = await client.getAccounts().catch(e => e);
    expect(error).toBeInstanceOf(InvestecApiError);
    expect(error.isAuthError).toBe(true);
    expect(error.message).toContain('invalid_client');
  });
});

describe('normaliseTransaction', () => {
  it('signs debits as negative and uses the transaction date', () => {
    const result = normaliseTransaction(mockCardPurchase, 'ZAR');

    expect(result).toMatchObject({
      booked: true,
      date: '2026-09-12',
      bookingDate: '2026-09-14',
      payeeName: 'WOOLWORTHS CAVENDISH CAPE TOWN ZA',
      notes: 'WOOLWORTHS CAVENDISH CAPE TOWN ZA',
      transactionAmount: { amount: -374, currency: 'ZAR' },
      transactionType: 'CardPurchases',
      cardNumber: '402167xxxxxx9999',
    });
    expect(result.transactionId).toMatch(/^[0-9a-f]{32}$/);
  });

  it('signs credits as positive and prefers the Investec uuid', () => {
    const result = normaliseTransaction(mockSalary, 'ZAR');

    expect(result.transactionAmount.amount).toBe(25000.5);
    expect(result.transactionId).toBe(mockSalary.uuid);
  });

  it('marks pending transactions as not booked without an id', () => {
    const result = normaliseTransaction(mockPending, 'ZAR');

    expect(result.booked).toBe(false);
    expect(result.transactionId).toBeUndefined();
    expect(result.date).toBe('2026-09-20');
    expect(result.transactionAmount.amount).toBe(-89.99);
  });
});

describe('getTransactionId', () => {
  it('is stable for the same transaction and differs between transactions', () => {
    expect(getTransactionId(mockCardPurchase)).toBe(
      getTransactionId({ ...mockCardPurchase, runningBalance: 1 }),
    );
    expect(getTransactionId(mockCardPurchase)).not.toBe(
      getTransactionId({ ...mockCardPurchase, postedOrder: 11051 }),
    );
  });
});

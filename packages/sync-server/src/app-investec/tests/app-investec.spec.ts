import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  investecFetchMock,
  mockAccount,
  mockCardPurchase,
  mockOldTransaction,
  mockPending,
  mockSalary,
} from './fixtures';

const secrets: Record<string, string | null> = {};

vi.mock('../../services/secrets-service', () => ({
  SecretName: {
    investec_clientId: 'investec_clientId',
    investec_clientSecret: 'investec_clientSecret',
    investec_apiKey: 'investec_apiKey',
  },
  secretsService: {
    get: vi.fn((name: string) => secrets[name] ?? null),
    set: vi.fn(),
  },
}));

vi.mock('../../util/middlewares', () => ({
  requestLoggerMiddleware: (_req: unknown, _res: unknown, next: () => void) =>
    next(),
  validateSessionMiddleware: (_req: unknown, _res: unknown, next: () => void) =>
    next(),
}));

const { handlers } = await import('../app-investec');
const { clearInvestecTokenCache } = await import('../investec-service');

const app = express();
app.use(express.json());
app.use('/', handlers);

function configure() {
  secrets.investec_clientId = 'client-id';
  secrets.investec_clientSecret = 'client-secret';
  secrets.investec_apiKey = 'api-key';
}

describe('Investec bank sync routes', () => {
  beforeEach(() => {
    clearInvestecTokenCache();
    for (const key of Object.keys(secrets)) {
      delete secrets[key];
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('POST /status', () => {
    it('reports not configured without credentials', async () => {
      const res = await request(app).post('/status').send({});
      expect(res.body).toEqual({ status: 'ok', data: { configured: false } });
    });

    it('reports configured when all three secrets are set', async () => {
      configure();
      const res = await request(app).post('/status').send({});
      expect(res.body.data.configured).toBe(true);
    });
  });

  describe('POST /accounts', () => {
    it('returns an error when credentials are missing', async () => {
      const res = await request(app).post('/accounts').send({});
      expect(res.body.status).toBe('ok');
      expect(res.body.data.error).toMatch(/not configured/);
    });

    it('lists accounts with their current balance', async () => {
      configure();
      vi.stubGlobal('fetch', vi.fn(investecFetchMock()));

      const res = await request(app).post('/accounts').send({});

      expect(res.body.status).toBe('ok');
      expect(res.body.data.accounts).toEqual([
        { ...mockAccount, balance: 34305.66, currency: 'ZAR' },
      ]);
    });

    it('maps rejected credentials to an invalid access token error', async () => {
      configure();
      vi.stubGlobal('fetch', vi.fn(investecFetchMock({ tokenStatus: 401 })));

      const res = await request(app).post('/accounts').send({});

      expect(res.body.status).toBe('ok');
      expect(res.body.data).toMatchObject({
        error_type: 'INVALID_INPUT',
        error_code: 'INVALID_ACCESS_TOKEN',
      });
    });
  });

  describe('POST /transactions', () => {
    it('requires accountId and startDate', async () => {
      configure();
      const res = await request(app).post('/transactions').send({});
      expect(res.body.data.error).toMatch(/required/);
    });

    it('returns balances and bucketed, newest-first transactions', async () => {
      configure();
      vi.stubGlobal(
        'fetch',
        vi.fn(
          investecFetchMock({
            transactions: [
              mockSalary,
              mockOldTransaction,
              mockCardPurchase,
              mockPending,
            ],
          }),
        ),
      );

      const res = await request(app)
        .post('/transactions')
        .send({ accountId: mockAccount.accountId, startDate: '2026-08-01' });

      expect(res.body.status).toBe('ok');
      const { balances, startingBalance, transactions } = res.body.data;

      expect(startingBalance).toBe(3430566);
      expect(balances).toEqual([
        expect.objectContaining({
          balanceType: 'expected',
          balanceAmount: { amount: 3430566, currency: 'ZAR' },
        }),
        expect.objectContaining({
          balanceType: 'interimAvailable',
          balanceAmount: { amount: 3393166, currency: 'ZAR' },
        }),
      ]);

      const payees = (list: Array<{ payeeName: string }>) =>
        list.map(t => t.payeeName);
      expect(payees(transactions.all)).toEqual([
        'UBER TRIP',
        'WOOLWORTHS CAVENDISH CAPE TOWN ZA',
        'ACME SALARY SEP',
      ]);
      expect(payees(transactions.booked)).toEqual([
        'WOOLWORTHS CAVENDISH CAPE TOWN ZA',
        'ACME SALARY SEP',
      ]);
      expect(payees(transactions.pending)).toEqual(['UBER TRIP']);
    });

    it('returns a readable error when the API fails', async () => {
      configure();
      vi.stubGlobal(
        'fetch',
        vi.fn(
          investecFetchMock({
            extra: url =>
              url.pathname.endsWith('/balance')
                ? new Response('Service unavailable', { status: 503 })
                : undefined,
          }),
        ),
      );

      const res = await request(app)
        .post('/transactions')
        .send({ accountId: mockAccount.accountId, startDate: '2026-08-01' });

      expect(res.body.status).toBe('ok');
      expect(res.body.data.error).toMatch(
        /^Failed to fetch transactions: .*503/,
      );
    });
  });
});

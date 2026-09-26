import express from 'express';

import { handleError } from '#app-gocardless/util/handle-error';
import { SecretName, secretsService } from '#services/secrets-service';
import {
  requestLoggerMiddleware,
  validateSessionMiddleware,
} from '#util/middlewares';

import {
  convertToCents,
  createInvestecClient,
  InvestecApiError,
  normaliseTransaction,
} from './investec-service';
import type {
  InvestecCredentials,
  NormalisedInvestecTransaction,
} from './investec-service';

const app = express();
export { app as handlers };
app.use(express.json());
app.use(requestLoggerMiddleware);
app.use(validateSessionMiddleware);

function getCredentials(): InvestecCredentials | null {
  const clientId = secretsService.get(SecretName.investec_clientId);
  const clientSecret = secretsService.get(SecretName.investec_clientSecret);
  const apiKey = secretsService.get(SecretName.investec_apiKey);

  if (!clientId || !clientSecret || !apiKey) {
    return null;
  }
  return { clientId, clientSecret, apiKey };
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : String(error);
}

function sendApiError(
  res: express.Response,
  error: unknown,
  prefix: string = '',
) {
  if (error instanceof InvestecApiError && error.isAuthError) {
    res.send({
      status: 'ok',
      data: {
        error_type: 'INVALID_INPUT',
        error_code: 'INVALID_ACCESS_TOKEN',
        status: 'rejected',
        reason:
          'Investec rejected the credentials. Check the client ID, secret and API key, and that the API key has access to this account.',
      },
    });
    return;
  }

  res.send({
    status: 'ok',
    data: {
      error: prefix + errorMessage(error),
    },
  });
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

app.post(
  '/status',
  handleError(async (_req, res) => {
    res.send({
      status: 'ok',
      data: {
        configured: getCredentials() != null,
      },
    });
  }),
);

app.post(
  '/accounts',
  handleError(async (_req, res) => {
    const credentials = getCredentials();
    if (!credentials) {
      res.send({
        status: 'ok',
        data: { error: 'Investec credentials are not configured' },
      });
      return;
    }

    try {
      const client = createInvestecClient(credentials);
      const accounts = await client.getAccounts();

      const withBalances = await Promise.all(
        accounts.map(async account => {
          const balance = await client
            .getBalance(account.accountId)
            .catch(() => null);
          return {
            ...account,
            balance: balance?.currentBalance ?? null,
            currency: balance?.currency ?? 'ZAR',
          };
        }),
      );

      res.send({
        status: 'ok',
        data: { accounts: withBalances },
      });
    } catch (error) {
      sendApiError(res, error);
    }
  }),
);

app.post(
  '/transactions',
  handleError(async (req, res) => {
    const { accountId, startDate } = req.body || {};

    if (!accountId || !startDate) {
      res.send({
        status: 'ok',
        data: { error: 'accountId and startDate are required' },
      });
      return;
    }

    const credentials = getCredentials();
    if (!credentials) {
      res.send({
        status: 'ok',
        data: { error: 'Investec credentials are not configured' },
      });
      return;
    }

    try {
      const client = createInvestecClient(credentials);
      const today = new Date();
      const fromDate = formatDate(new Date(startDate));

      const [balance, rawTransactions] = await Promise.all([
        client.getBalance(accountId),
        client.getTransactions(accountId, fromDate, formatDate(today)),
      ]);

      const currency = balance.currency || 'ZAR';
      const currentBalance = convertToCents(balance.currentBalance);
      const referenceDate = formatDate(today);

      const balances = [
        {
          balanceAmount: { amount: currentBalance, currency },
          balanceType: 'expected',
          referenceDate,
        },
        {
          balanceAmount: {
            amount: convertToCents(balance.availableBalance),
            currency,
          },
          balanceType: 'interimAvailable',
          referenceDate,
        },
      ];

      const all: NormalisedInvestecTransaction[] = [];
      const booked: NormalisedInvestecTransaction[] = [];
      const pending: NormalisedInvestecTransaction[] = [];

      for (const raw of rawTransactions) {
        const trans = normaliseTransaction(raw, currency);
        if (!trans.date || trans.date < fromDate) {
          continue;
        }
        all.push(trans);
        (trans.booked ? booked : pending).push(trans);
      }

      const newestFirst = (
        a: NormalisedInvestecTransaction,
        b: NormalisedInvestecTransaction,
      ) => b.sortOrder - a.sortOrder;

      res.send({
        status: 'ok',
        data: {
          balances,
          startingBalance: currentBalance,
          transactions: {
            all: all.sort(newestFirst),
            booked: booked.sort(newestFirst),
            pending: pending.sort(newestFirst),
          },
        },
      });
    } catch (error) {
      sendApiError(res, error, 'Failed to fetch transactions: ');
    }
  }),
);

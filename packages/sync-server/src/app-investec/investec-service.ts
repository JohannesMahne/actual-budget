import { createHash } from 'node:crypto';

export const INVESTEC_API_URL = 'https://openapi.investec.com';

export type InvestecCredentials = {
  clientId: string;
  clientSecret: string;
  apiKey: string;
};

export type InvestecAccount = {
  accountId: string;
  accountNumber: string;
  accountName: string;
  referenceName: string;
  productName: string;
  kycCompliant?: boolean;
  profileId?: string;
  profileName?: string;
};

export type InvestecBalance = {
  accountId: string;
  currentBalance: number;
  availableBalance: number;
  budgetBalance?: number;
  straightBalance?: number;
  cashBalance?: number;
  currency: string;
};

export type InvestecTransaction = {
  accountId: string;
  type: 'DEBIT' | 'CREDIT';
  transactionType?: string | null;
  status: 'POSTED' | 'PENDING';
  description: string;
  cardNumber?: string | null;
  postedOrder?: number;
  postingDate?: string | null;
  valueDate?: string | null;
  actionDate?: string | null;
  transactionDate?: string | null;
  amount: number;
  runningBalance?: number | null;
  uuid?: string | null;
};

export type NormalisedInvestecTransaction = {
  booked: boolean;
  date: string;
  bookingDate?: string;
  valueDate?: string;
  payeeName: string;
  notes: string;
  transactionId?: string;
  sortOrder: number;
  transactionAmount: { amount: number; currency: string };
  transactionType?: string;
  cardNumber?: string;
  runningBalance?: number;
};

export class InvestecApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'InvestecApiError';
    this.status = status;
  }

  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }
}

type FetchLike = typeof fetch;

type CachedToken = { value: string; expiresAt: number };

// Tokens are valid for ~30 minutes; refresh a minute early to avoid races.
const TOKEN_EXPIRY_MARGIN_MS = 60 * 1000;
const tokenCache = new Map<string, CachedToken>();

function tokenCacheKey({ clientId, apiKey }: InvestecCredentials) {
  return createHash('sha256').update(`${clientId}:${apiKey}`).digest('hex');
}

export function clearInvestecTokenCache() {
  tokenCache.clear();
}

async function readError(res: Response) {
  const text = await res.text().catch(() => '');
  try {
    const body = JSON.parse(text);
    return (
      body?.error_description ||
      body?.message ||
      body?.error ||
      text ||
      res.statusText
    );
  } catch {
    return text || res.statusText;
  }
}

export function createInvestecClient(
  credentials: InvestecCredentials,
  {
    baseUrl = INVESTEC_API_URL,
    fetchImpl = fetch,
  }: { baseUrl?: string; fetchImpl?: FetchLike } = {},
) {
  const cacheKey = tokenCacheKey(credentials);

  async function getAccessToken(): Promise<string> {
    const cached = tokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const basic = Buffer.from(
      `${credentials.clientId}:${credentials.clientSecret}`,
    ).toString('base64');

    const res = await fetchImpl(`${baseUrl}/identity/v2/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'x-api-key': credentials.apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }).toString(),
    });

    if (!res.ok) {
      throw new InvestecApiError(
        `Investec authentication failed: ${await readError(res)}`,
        res.status,
      );
    }

    const body = (await res.json()) as {
      access_token?: string;
      expires_in?: number | string;
    };
    if (!body.access_token) {
      throw new InvestecApiError(
        'Investec authentication failed: no access token returned',
        401,
      );
    }

    const expiresInMs = Number(body.expires_in ?? 1799) * 1000;
    tokenCache.set(cacheKey, {
      value: body.access_token,
      expiresAt: Date.now() + expiresInMs - TOKEN_EXPIRY_MARGIN_MS,
    });
    return body.access_token;
  }

  async function get<T>(
    path: string,
    query: Record<string, string> = {},
  ): Promise<T> {
    const url = new URL(path, baseUrl);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }

    const send = async () =>
      fetchImpl(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
          Accept: 'application/json',
        },
      });

    let res = await send();
    if (res.status === 401) {
      // The cached token may have been revoked; retry once with a fresh one.
      tokenCache.delete(cacheKey);
      res = await send();
    }

    if (!res.ok) {
      throw new InvestecApiError(
        `Investec API request failed (${res.status}): ${await readError(res)}`,
        res.status,
      );
    }

    return (await res.json()) as T;
  }

  return {
    async getAccounts(): Promise<InvestecAccount[]> {
      const body = await get<{ data?: { accounts?: InvestecAccount[] } }>(
        '/za/pb/v1/accounts',
      );
      return body.data?.accounts ?? [];
    },

    async getBalance(accountId: string): Promise<InvestecBalance> {
      const body = await get<{ data: InvestecBalance }>(
        `/za/pb/v1/accounts/${encodeURIComponent(accountId)}/balance`,
      );
      return body.data;
    },

    async getTransactions(
      accountId: string,
      fromDate: string,
      toDate: string,
    ): Promise<InvestecTransaction[]> {
      const transactions: InvestecTransaction[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const query: Record<string, string> = {
          fromDate,
          toDate,
          includePending: 'true',
        };
        if (page > 1) {
          query.page = String(page);
        }

        const body = await get<{
          data?: { transactions?: InvestecTransaction[] };
          meta?: { totalPages?: number };
        }>(
          `/za/pb/v1/accounts/${encodeURIComponent(accountId)}/transactions`,
          query,
        );

        transactions.push(...(body.data?.transactions ?? []));
        totalPages = body.meta?.totalPages ?? 1;
        page++;
      } while (page <= totalPages);

      return transactions;
    },
  };
}

export type InvestecClient = ReturnType<typeof createInvestecClient>;

function toCents(amount: number) {
  return Math.round(amount * 100);
}

export function convertToCents(amount: number | null | undefined): number {
  return toCents(Number(amount ?? 0));
}

function cleanDescription(description: string) {
  return description.replace(/\s+/g, ' ').trim();
}

/**
 * Investec does not document a stable transaction id for Private Bank
 * accounts, so posted transactions without a `uuid` get a deterministic
 * id derived from fields that do not change once a transaction is posted.
 */
export function getTransactionId(trans: InvestecTransaction): string {
  if (trans.uuid) {
    return trans.uuid;
  }

  return createHash('sha256')
    .update(
      [
        trans.accountId,
        trans.postingDate ?? '',
        trans.transactionDate ?? '',
        trans.postedOrder ?? '',
        trans.type,
        trans.amount.toFixed(2),
        cleanDescription(trans.description),
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 32);
}

export function normaliseTransaction(
  trans: InvestecTransaction,
  currency: string,
): NormalisedInvestecTransaction {
  const booked = trans.status !== 'PENDING';
  const date =
    trans.transactionDate || trans.postingDate || trans.actionDate || '';
  const signedAmount =
    trans.type === 'CREDIT' ? Math.abs(trans.amount) : -Math.abs(trans.amount);
  const description = cleanDescription(trans.description ?? '');

  return {
    booked,
    date,
    bookingDate: trans.postingDate ?? undefined,
    valueDate: trans.valueDate ?? undefined,
    payeeName: description,
    notes: description,
    transactionId: booked ? getTransactionId(trans) : undefined,
    sortOrder: Date.parse(date) + (trans.postedOrder ?? 0),
    transactionAmount: {
      amount: toCents(signedAmount) / 100,
      currency,
    },
    transactionType: trans.transactionType ?? undefined,
    cardNumber: trans.cardNumber ?? undefined,
    runningBalance: trans.runningBalance ?? undefined,
  };
}

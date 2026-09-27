import { generateAccount } from '@actual-app/core/mocks';
import { describe, expect, it } from 'vitest';

import {
  getSyncSourceReadable,
  groupBankSyncAccounts,
  toInvestecExternalAccount,
} from './bankSyncUtils';

describe('bankSyncUtils', () => {
  it('groups open accounts by provider and leaves unlinked last', () => {
    const goCardlessAccount = generateAccount('GoCardless', true, false);
    const pluggyAccount = {
      ...generateAccount('Pluggy', true, false),
      account_sync_source: 'pluggyai' as const,
    };
    const simpleFinAccount = {
      ...generateAccount('SimpleFIN', true, false),
      account_sync_source: 'simpleFin' as const,
    };
    const unlinkedAccount = generateAccount('Manual', false, false);
    const closedAccount = {
      ...generateAccount('Closed', true, false),
      closed: 1 as const,
    };

    const groupedAccounts = groupBankSyncAccounts([
      unlinkedAccount,
      simpleFinAccount,
      closedAccount,
      pluggyAccount,
      goCardlessAccount,
    ]);

    expect(Object.keys(groupedAccounts)).toEqual([
      'goCardless',
      'pluggyai',
      'simpleFin',
      'unlinked',
    ]);
    expect(groupedAccounts.goCardless).toEqual([goCardlessAccount]);
    expect(groupedAccounts.pluggyai).toEqual([pluggyAccount]);
    expect(groupedAccounts.simpleFin).toEqual([simpleFinAccount]);
    expect(groupedAccounts.unlinked).toEqual([unlinkedAccount]);
  });

  it('returns stable readable provider labels', () => {
    const readable = getSyncSourceReadable(
      (key: string) => `translated:${key}`,
    );

    expect(readable.goCardless).toBe('GoCardless');
    expect(readable.simpleFin).toBe('SimpleFIN');
    expect(readable.pluggyai).toBe('Pluggy.ai');
    expect(readable.unlinked).toBe('translated:Unlinked');
  });
});

describe('toInvestecExternalAccount', () => {
  it('builds a readable name and Investec institution details', () => {
    expect(
      toInvestecExternalAccount({
        accountId: '3353431574710163189587446',
        accountNumber: '10011234567',
        accountName: 'Mr J Smith',
        referenceName: 'Everyday',
        productName: 'Private Bank Account',
        balance: 34305.66,
      }),
    ).toEqual({
      account_id: '3353431574710163189587446',
      name: 'Private Bank Account – Everyday (…4567)',
      institution: 'Investec',
      orgDomain: 'investec.com',
      orgId: 'investec',
      balance: 34305.66,
    });
  });

  it('falls back gracefully when optional fields are missing', () => {
    expect(toInvestecExternalAccount({ accountId: 'abc' })).toMatchObject({
      account_id: 'abc',
      name: 'Investec account',
      balance: null,
    });
  });
});

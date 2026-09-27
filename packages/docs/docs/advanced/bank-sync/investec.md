# Investec Setup

:::warning
Investec bank sync is an experimental feature. See [Experimental Features](../../experimental/index.md) for instructions to enable experimental features, then turn on **Investec Programmable Banking sync (SA banks)**.
:::

Investec's [Programmable Banking](https://developer.investec.com/individuals) Open API gives Investec Private Bank clients in South Africa free, read-only access to their own accounts, balances and transactions. Actual uses it to download transactions directly from Investec; no third-party aggregator is involved.

Business (Corporate and Investment Banking) accounts use a different API and are not yet supported.

### Create API credentials in Investec Online

1. Sign in to [Investec Online](https://login.secure.investec.com/).
2. Go to **Manage → Investec Developer**. If this is your first visit, accept the terms to enable Programmable Banking.
3. Open **Individual Connections**. Copy your **Client ID** and **Client Secret**.
4. Click **Create new API key**, give it an alias (for example _Actual Budget_), choose the accounts you want to sync and grant at least the **accounts** and **transactions** read permissions.
5. Copy the **API key**. It is only shown once.

:::note
The credentials are stored on your Actual server (not in the budget file) and are shared by every budget on that server. Only server administrators can set them up. Revoke the API key in Investec Online at any time to cut off access.
:::

### Link accounts in Actual

1. In Actual, go to **More → Bank Sync**.
2. In the **Investec** card, click **Set up** and paste the Client ID, Client Secret and API key.
3. Click **Link bank account** in the **Investec** card, choose which Investec accounts to link and whether each one should be a new or existing Actual account.

### How transactions are imported

- The transaction date is the date you made the purchase (`transactionDate`). You can switch to Investec's posting date by choosing `bookingDate` for the date field in the account's bank sync settings.
- The payee and notes default to the Investec transaction description. Use [rules](../../budgeting/rules/index.md) to tidy card merchant names (for example, removing the trailing city and `ZA`).
- `transactionType` (for example `CardPurchases`) and `cardNumber` are available as extra fields for notes in the bank sync field mapping.
- Pending card transactions are imported as uncleared and are matched to the posted transaction on a later sync. Turn off **Import pending transactions** in the account's bank sync settings if you prefer to wait for them to post.

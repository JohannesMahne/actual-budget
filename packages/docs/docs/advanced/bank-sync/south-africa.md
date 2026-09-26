# South African Banks and Investments

Most South African institutions do not offer a personal API, so the right way to bring data into Actual depends on who you bank or invest with.

| Institution             | Best option in Actual                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| Investec (Private Bank) | [Investec bank sync](./investec.md)                                            |
| FNB                     | Import OFX (or QIF/CSV) files downloaded from FNB Online Banking               |
| TymeBank / GoTyme Bank  | Enter transactions manually, or convert the PDF statement to CSV and import it |
| 10X Investments         | Off-budget tracking account, updated from My10X                                |
| Momentum                | Off-budget tracking account, updated from the Momentum app                     |

Aggregators such as Stitch cover several of these banks, but they are commercial services for businesses and are not supported by Actual.

## FNB

FNB does not offer a public API for personal accounts, but FNB Online Banking can export your transaction history in formats Actual imports directly.

1. Sign in to FNB Online Banking in a web browser (downloads are not available in the app).
2. Open **My Accounts → Transaction History** and choose the account.
3. Click **Download** and choose **OFX** (Microsoft Money). FNB delivers it as a `.zip` file; extract the `.ofx` file.
4. In Actual, open the matching account, click **Import** and choose the `.ofx` file.

OFX is recommended because each transaction carries a unique ID, so importing overlapping date ranges does not create duplicates. The transaction history screen typically covers the last 90 days, so import at least monthly.

If you prefer CSV, FNB's export starts with a few summary lines before the column headings. Set **Skip lines at start** until the heading row is shown, map _Date_, _Description_ and _Amount_, and pick the `YYYY/MM/DD` date format. Actual remembers these settings for the account the next time you import.

## TymeBank / GoTyme Bank

TymeBank is now called GoTyme Bank in South Africa. Internet banking has been withdrawn, there is no API, and statements are only available as monthly PDFs from the app, a kiosk or email.

- For day-to-day budgeting, enter transactions in Actual as you spend. TymeBank accounts usually have low transaction volumes, which makes this practical.
- To catch up, convert the PDF statement to CSV with a PDF table-extraction tool, check the rows, then import the CSV. If the file has separate _Money in_ and _Money out_ columns, turn on **Split amount into separate inflow/outflow columns**.
- Reconcile against the closing balance on each statement.

## 10X Investments and Momentum

10X (retirement annuities, tax-free savings and unit trusts) and Momentum (investments, life cover and Momentum Securities) only provide PDF statements through the My10X portal and the Momentum app. Neither offers a client API or transaction export.

Track these as **off-budget** accounts:

1. Create an off-budget account for each investment, for example _10X Retirement Annuity_ or _Momentum Investo_.
2. Record debit orders or top-ups as transfers from your bank account, so the money leaves your budget as a transfer.
3. Once a month, compare the value shown in My10X or the Momentum app with Actual and [reconcile](../../accounts/reconciliation.md) the account. Actual adds the difference as a reconciliation transaction; you can rename its payee to _Growth_ or _Fees_.

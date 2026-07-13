/* PayPal alternate checkout config
 *
 * Primary sales stay on MQL5 (instant MT5 license).
 * To enable PayPal on this static site:
 * 1. Log into PayPal Business → Pay & Get Paid → Payment Links (or Buttons)
 * 2. Create links for $149 / $30 / $75
 * 3. Paste the URLs below (or set clientId + use Smart Buttons)
 * 4. Redeploy the site
 *
 * After a PayPal payment, buyer must email/Telegram you with receipt + MT5 account #
 * for manual license fulfillment (MQL5 Market licenses cannot auto-issue from PayPal).
 *
 * Note: PayPal’s Acceptable Use Policy restricts some forex/trading activity.
 * Selling software is usually OK, but accounts can still be reviewed — keep MQL5 primary.
 */
window.FMP_PAYPAL = {
  enabled: false,
  /* Optional: PayPal REST App Client ID from developer.paypal.com (live) */
  clientId: '',
  /* Prefer hosted payment links — simplest on a static site */
  links: {
    buy: '',      // e.g. https://www.paypal.com/ncp/payment/XXXX  or paypal.me/...
    rent1m: '',
    rent3m: ''
  },
  currency: 'USD',
  amounts: { buy: '149.00', rent1m: '30.00', rent3m: '75.00' },
  supportNote:
    'After PayPal payment, message Telegram @ForexMasterProEA with your receipt and MT5 account number for license fulfillment.'
};

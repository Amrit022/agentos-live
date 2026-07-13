/* PayPal checkout — Live Client ID for agentosacademy.com
 * Secret key stays ONLY in PayPal dashboard (never on this site).
 * After payment: buyer messages Telegram @ForexMasterProEA with receipt + MT5 account #.
 */
window.FMP_PAYPAL = {
  enabled: true,
  clientId: 'BAAD5l9OG-gDKcRwo5-8aBEcDngVT1hhtyvzctvAFNICKftsqCyzcnGgY-mJGyDIgRk4RQto5wXplDSXBQ',
  links: {
    buy: '',
    rent1m: '',
    rent3m: ''
  },
  currency: 'USD',
  amounts: { buy: '149.00', rent1m: '30.00', rent3m: '75.00' },
  supportNote:
    'After PayPal payment, message Telegram @ForexMasterProEA with your PayPal receipt ID and MT5 account number so we can fulfill your license.'
};

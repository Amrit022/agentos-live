# Integrate Stripe Payment Gateway

This plan outlines the steps to integrate a secure payment gateway (Stripe) into the WealthWeb platform. Because we are developing locally, we will use Stripe's **Test Mode**, which allows you to simulate transactions using test credit cards without spending real money.

## User Review Required

> [!IMPORTANT]
> To make this work, you will eventually need a free **Stripe Account** to get your API keys. For now, I will use placeholder test keys so we can build the logic, but you will need to swap them out before going live.

> [!WARNING]
> Since we are integrating a third-party payment gateway, the checkout flow will change. Instead of an instant pop-up, users will be securely redirected to a Stripe-hosted payment page, and then redirected back to the Customer Portal upon success.

## Open Questions

1. Do you already have a Stripe account, or would you prefer me to build the integration with dummy keys that you can replace later?
2. Are you okay with the user being redirected to a secure Stripe Checkout page to enter their credit card details?

## Proposed Changes

### Backend (`app.py` & DB)
We need to modify the checkout process to handle asynchronous payments.

#### [MODIFY] [app.py](file:///C:/Users/amrit/.gemini/antigravity/scratch/earn-online-hub/app.py)
- Import and configure the `stripe` python library.
- **Update Database Schema**: Add a `status` column to the `orders` table (e.g., 'pending' vs 'paid') and an `order_id` string identifier.
- **New Route (`/api/create-checkout-session`)**: 
  - Takes the cart details and customer info.
  - Creates a "pending" order in the database.
  - Calls Stripe's API to generate a secure Checkout Session URL.
  - Returns the URL to the frontend.
- **New Route (`/checkout/success`)**:
  - Handles the callback from Stripe after a successful payment.
  - Verifies the payment with Stripe.
  - Updates the order status to 'paid'.
  - Creates the user's Customer Portal account (using the password they provided earlier).
  - Logs them in and redirects them to `/portal`.
- **New Route (`/checkout/cancel`)**:
  - Redirects the user back to the cart if they cancel the payment.

### Frontend (`cart.html`)
We need to connect the cart to the new backend flow.

#### [MODIFY] [cart.html](file:///C:/Users/amrit/.gemini/antigravity/scratch/earn-online-hub/templates/cart.html)
- Update the `checkout()` JavaScript function.
- Instead of showing a fake "Success" alert immediately, it will call `/api/create-checkout-session` and then `window.location.href = stripeUrl` to redirect the user to the real payment gateway.

### Dependencies
- We will need to install the official `stripe` python package to securely communicate with the payment gateway.

## Verification Plan

### Automated/Manual Verification
1. Install `stripe` using pip.
2. Run the application and add a product to the cart.
3. Fill out the contact/password form and click "Complete Secure Order".
4. Verify the redirect to the Stripe Test Checkout page.
5. Use a Stripe Test Card (e.g., 4242 4242 4242 4242) to complete the purchase.
6. Verify the successful redirect back to the Customer Portal and ensure the purchased products are unlocked.

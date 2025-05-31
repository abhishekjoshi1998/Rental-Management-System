
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from './PaymentForm.jsx';
import { initiatePaymentIntent } from '../../api/paymentService.js'; // Assuming you have this in paymentService
import AlertMessage from '../../components/Common/AlertMessage.jsx';
import useAuth from '../../components/hooks/useAuth.js';
import LoadingSpinner from '../../components/Common/LoadingSpinner.jsx';

// Initialize Stripe outside of the component render cycle
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const MakePaymentPage = () => {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loadingIntent, setLoadingIntent] = useState(false);

  // These would typically come from a selected lease or user's active lease
  const [leaseId, setLeaseId] = useState(''); // Example: "your_lease_id_here"
  const [amount, setAmount] = useState(0);   // Example: 1000 (for $10.00 if amount is in cents, or 10 if in dollars)

  // Simulate fetching lease details or selecting a lease
  useEffect(() => {
    // In a real app, you'd fetch the user's active lease and its rent amount.
    // For this example, we'll use placeholder values.
    // You might have a component to select a lease, or it's tied to the user's current context.
    if (user) {
        // Dummy data - replace with actual logic to get lease and amount
        const dummyLeaseId = "60d5ecf5c1b2b4434c9d2f1a"; // Replace
        const dummyAmount = 1250; // For $12.50 if backend expects dollars
        setLeaseId(dummyLeaseId);
        setAmount(dummyAmount);
    }
  }, [user]);


  useEffect(() => {
    if (!stripePromise) {
      setError("Stripe is not configured. Please set VITE_STRIPE_PUBLISHABLE_KEY.");
      return;
    }

    if (leaseId && amount > 0 && user) {
      const createPaymentIntent = async () => {
        setLoadingIntent(true);
        setError('');
        setMessage('');
        try {
          const response = await initiatePaymentIntent({
            leaseId: leaseId,
            amount: amount,
            // currency: 'usd', // If your backend doesn't default it
          });
          if (response.clientSecret && response.paymentId) {
            setClientSecret(response.clientSecret);
            setPaymentId(response.paymentId);
          } else {
            throw new Error("Invalid response from payment initiation.");
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to initialize payment. Please try again.');
          console.error("Payment Intent Error:", err);
        } finally {
          setLoadingIntent(false);
        }
      };
      createPaymentIntent();
    } else if (user && (!leaseId || amount <=0)) {
        setMessage("Please ensure a lease and valid amount are selected/available for payment.");
    }
  }, [leaseId, amount, user]); // Depend on user as well

  const appearance = {
    theme: 'stripe',
    // variables: { colorPrimaryText: '#262626' }
  };
  const options = clientSecret ? {
    clientSecret,
    appearance,
  } : null;

  if (!user) {
    return <AlertMessage type="info" message="Please log in to make a payment." />
  }

  if (!stripePromise) {
    return <AlertMessage type="error" message="Stripe is not available. Publishable key might be missing." />;
  }

  if (loadingIntent) {
    return <LoadingSpinner />;
  }

  if (error && !clientSecret) { // Show error prominently if PI creation failed
    return <AlertMessage type="error" message={error} />;
  }
  if (message && !clientSecret) {
    return <AlertMessage type="info" message={message} />;
  }


  return (
    <div>
      <h2>Make Rent Payment</h2>
      <p>Lease ID: {leaseId || "N/A"}</p>
      <p>Amount Due: ${amount > 0 ? amount.toFixed(2) : "N/A"}</p>

      {error && <AlertMessage type="error" message={error} />} {/* For errors after PI is created */}

      {clientSecret && options ? (
        <Elements options={options} stripe={stripePromise}>
          <PaymentForm clientSecret={clientSecret} paymentId={paymentId} amount={amount} />
        </Elements>
      ) : (
        <p>Waiting for payment details or select a lease to pay...</p>
      )}
    </div>
  );
};

export default MakePaymentPage;
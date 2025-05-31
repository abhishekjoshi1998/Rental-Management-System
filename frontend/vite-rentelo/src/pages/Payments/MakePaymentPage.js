// src/pages/Payments/MakePaymentPage.js
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../../components/Payments/PaymentForm'; // You'll create this
import api from '../../api'; // Or paymentService.js
import AlertMessage from '../../components/Common/AlertMessage';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const MakePaymentPage = () => {
  const [clientSecret, setClientSecret] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [error, setError] = useState('');
  const [leaseId, setLeaseId] = useState(''); // Get this from user context or selection
  const [amount, setAmount] = useState(0); // Get this from lease details

  useEffect(() => {
    // Fetch active lease and amount for the logged-in tenant
    // For simplicity, let's assume these are set
    // e.g., setLeaseId('someLeaseIdFromContext'); setAmount(1000);

    if (leaseId && amount > 0) {
      const createPaymentIntent = async () => {
        try {
          // Replace with your actual payment service call
          const response = await api.post('/payments/initiate', {
            leaseId: leaseId, // Example leaseId
            amount: amount, // Example amount
          });
          setClientSecret(response.data.clientSecret);
          setPaymentId(response.data.paymentId);
        } catch (err) {
          setError('Failed to initialize payment. Please try again.');
          console.error(err);
        }
      };
      createPaymentIntent();
    }
  }, [leaseId, amount]);

  const appearance = {
    theme: 'stripe',
  };
  const options = {
    clientSecret,
    appearance,
  };

  // Dummy data for example
  useEffect(() => {
    setLeaseId("60d5ecf5c1b2b4434c9d2f1a"); // Replace with actual logic
    setAmount(1200); // Replace with actual logic
  }, []);


  if (!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) {
    return <AlertMessage type="error" message="Stripe publishable key not configured." />
  }

  return (
    <div>
      <h2>Make Rent Payment</h2>
      {error && <AlertMessage type="error" message={error} />}
      {/* Add inputs for leaseId and amount if not fetched automatically */}
      {!leaseId && <p>Please select a lease to pay for.</p>}

      {clientSecret && stripePromise && (
        <Elements options={options} stripe={stripePromise}>
          <PaymentForm clientSecret={clientSecret} paymentId={paymentId} amount={amount} />
        </Elements>
      )}
      {!clientSecret && leaseId && amount > 0 && <p>Initializing payment...</p>}
    </div>
  );
};

export default MakePaymentPage;
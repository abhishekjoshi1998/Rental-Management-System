import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import AlertMessage from '../../components/Common/AlertMessage';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import api from '../../api'; // Direct API for this simple check

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const paymentIntentClientSecret = query.get('payment_intent_client_secret');
    const paymentIntentId = query.get('payment_intent');
    const redirectStatus = query.get('redirect_status');

    if (!paymentIntentClientSecret && !paymentIntentId) {
      setMessage('Payment information missing. If you made a payment, please check your history or contact support.');
      setStatus('error');
      setLoading(false);
      return;
    }

    const verifyPayment = async (pi_id) => {
        try {
            // In a real app, you might not need to call your backend again if Stripe webhook handles it.
            // This is more for immediate feedback if webhook is delayed.
            // Or, you can just rely on the redirect_status from Stripe.
            if (redirectStatus === 'succeeded') {
                 setStatus('success');
                 setMessage('Your payment was successful! Thank you.');
            } else if (redirectStatus === 'processing') {
                setStatus('info');
                setMessage('Your payment is processing. We will update you shortly.');
            } else if (redirectStatus === 'requires_payment_method') {
                setStatus('error');
                setMessage('Payment failed. Please try another payment method.');
            } else {
                setStatus('error');
                setMessage('Payment failed or status unknown. Please check your payment history or contact support.');
            }
        } catch (err) {
            setStatus('error');
            setMessage('There was an issue verifying your payment. Please check your payment history or contact support.');
        } finally {
            setLoading(false);
        }
    };

    if(paymentIntentId) {
        verifyPayment(paymentIntentId);
    } else {
        // Fallback if only client secret is available (less ideal for final verification)
        if (redirectStatus === 'succeeded') {
            setStatus('success');
            setMessage('Your payment was successful! (Status based on redirect).');
        } else {
            setStatus('error');
            setMessage('Payment status uncertain from redirect. Please check history.');
        }
        setLoading(false);
    }

  }, [location]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Payment Status</h2>
      {status === 'success' && <AlertMessage type="success" message={message} />}
      {status === 'error' && <AlertMessage type="error" message={message} />}
      {status === 'info' && <AlertMessage type="info" message={message} />}
      <p>
        <Link to="/dashboard">Go to Dashboard</Link> | <Link to="/payments/history">View Payment History</Link>
      </p>
    </div>
  );
};

export default PaymentSuccessPage;
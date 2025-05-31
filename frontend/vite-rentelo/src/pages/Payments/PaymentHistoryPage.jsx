import React, { useState, useEffect } from 'react';
import { getPaymentHistory } from '../../api/paymentService';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import AlertMessage from '../../components/Common/AlertMessage';
import { Link } from 'react-router-dom';

const PaymentHistoryPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await getPaymentHistory();
        setPayments(response.data.payments || response.data);
      } catch (err) {
        setError('Failed to fetch payment history.');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchPayments();
    else { setLoading(false); setError("Not authenticated"); }
  }, [user]);

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="error" message={error} />;

  return (
    <div>
      <h2>Payment History</h2>
      {payments.length === 0 ? (
        <p>No payment history found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Lease ID</th>
              <th>Property</th>
              <th>Method</th>
              <th>Status</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment._id}>
                <td>{new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}</td>
                <td>${payment.amount.toFixed(2)}</td>
                <td><Link to={`/leases/${payment.lease?._id || payment.lease}`}>{payment.lease?._id || payment.lease}</Link></td>
                <td>{payment.property?.address?.street || 'N/A'}</td>
                <td>{payment.paymentMethod}</td>
                <td>{payment.status}</td>
                <td>
                  {payment.receiptUrl ? (
                    <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">View</a>
                  ) : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PaymentHistoryPage;
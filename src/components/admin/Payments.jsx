import React, { useState } from 'react';
import { Search, Download, Filter } from 'lucide-react';

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  // Placeholder data - replace with actual payment data from your payment processor
  const payments = [
    {
      id: '1',
      user: 'John Doe',
      email: 'john@example.com',
      amount: 29.99,
      plan: 'Pro',
      status: 'succeeded',
      date: '2024-02-10',
      method: 'card',
    },
    // Add more when you integrate payment processor
  ];

  return (
    <div className="payments-management">
      <div className="payments-header">
        <h2>Payment Transactions</h2>
        <button className="export-button">
          <Download size={18} />
          Export
        </button>
      </div>

      <div className="controls-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by user or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'succeeded' ? 'active' : ''}
            onClick={() => setFilter('succeeded')}
          >
            Succeeded
          </button>
          <button
            className={filter === 'failed' ? 'active' : ''}
            onClick={() => setFilter('failed')}
          >
            Failed
          </button>
          <button
            className={filter === 'refunded' ? 'active' : ''}
            onClick={() => setFilter('refunded')}
          >
            Refunded
          </button>
        </div>
      </div>

      <div className="integration-notice">
        <h3>💳 Payment Integration Required</h3>
        <p>
          Connect Stripe or Paystack to start tracking transactions
          automatically.
        </p>
        <div className="integration-steps">
          <h4>Integration Steps:</h4>
          <ol>
            <li>Set up webhook endpoint in your backend</li>
            <li>Create a 'payments' collection in Appwrite</li>
            <li>Listen for payment events (successful, failed, refunded)</li>
            <li>Store transaction data with user reference</li>
          </ol>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="payments-table-wrapper">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Date</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="transaction-id">{payment.id}</td>
                  <td>
                    <div className="user-cell">
                      <p className="user-name">{payment.user}</p>
                      <p className="user-email">{payment.email}</p>
                    </div>
                  </td>
                  <td className="amount">${payment.amount}</td>
                  <td>
                    <span className="plan-badge">{payment.plan}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${payment.status}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td>{new Date(payment.date).toLocaleDateString()}</td>
                  <td className="payment-method">{payment.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Payments;

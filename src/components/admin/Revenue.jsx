import React, { useState, useEffect } from 'react';
import { databases } from '../../lib/appwrite';
import { Query } from 'appwrite';
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

const Revenue = () => {
  const [revenue, setRevenue] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    subscribers: 0,
    churnRate: 0,
    avgRevenuePerUser: 0,
    growth: 0,
  });
  const [loading, setLoading] = useState(true);

  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_TABLE_ID;

  // Pro plan price (you can move this to env variables)
  const PRO_PLAN_PRICE = 29.99; // Monthly price

  useEffect(() => {
    loadRevenue();
  }, []);

  const loadRevenue = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_TABLE_ID
      );

      const users = response.documents;
      const proUsers = users.filter((u) => u.plan === 'pro');

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const proUsersThisMonth = proUsers.filter(
        (u) => u.planUpdatedAt && new Date(u.planUpdatedAt) >= startOfMonth
      ).length;

      const proUsersLastMonth = proUsers.filter(
        (u) =>
          u.planUpdatedAt &&
          new Date(u.planUpdatedAt) >= lastMonth &&
          new Date(u.planUpdatedAt) < startOfMonth
      ).length;

      const monthlyRev = proUsers.length * PRO_PLAN_PRICE;
      const growth =
        proUsersLastMonth > 0
          ? ((proUsersThisMonth - proUsersLastMonth) / proUsersLastMonth) * 100
          : 0;

      setRevenue({
        totalRevenue: monthlyRev * 12, // Annualized
        monthlyRevenue: monthlyRev,
        subscribers: proUsers.length,
        churnRate: 0, // Calculate based on cancellations
        avgRevenuePerUser:
          proUsers.length > 0 ? monthlyRev / proUsers.length : 0,
        growth: growth,
      });
    } catch (error) {
      console.error('Error loading revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const RevenueCard = ({
    icon: Icon,
    label,
    value,
    prefix = '',
    suffix = '',
    trend,
  }) => (
    <div className="revenue-card">
      <div className="revenue-header">
        <Icon size={20} />
        <span className="revenue-label">{label}</span>
      </div>
      <div className="revenue-value">
        {prefix}
        {typeof value === 'number' ? value.toFixed(2) : value}
        {suffix}
      </div>
      {trend !== undefined && (
        <div
          className={`revenue-trend ${trend >= 0 ? 'positive' : 'negative'}`}
        >
          {trend >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          {Math.abs(trend).toFixed(1)}% vs last month
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div className="loading-state">Loading revenue data...</div>;
  }

  return (
    <div className="revenue-dashboard">
      <div className="revenue-grid">
        <RevenueCard
          icon={DollarSign}
          label="Monthly Recurring Revenue"
          value={revenue.monthlyRevenue}
          prefix="$"
        />
        <RevenueCard
          icon={TrendingUp}
          label="Annual Run Rate"
          value={revenue.totalRevenue}
          prefix="$"
        />
        <RevenueCard
          icon={Users}
          label="Active Subscribers"
          value={revenue.subscribers}
          trend={revenue.growth}
        />
        <RevenueCard
          icon={CreditCard}
          label="ARPU"
          value={revenue.avgRevenuePerUser}
          prefix="$"
        />
      </div>

      <div className="revenue-chart-placeholder">
        <h3>Revenue Growth Chart</h3>
        <p className="placeholder-text">
          📊 Connect your payment processor (Stripe/Paystack) to see detailed
          revenue charts
        </p>
        <div className="integration-suggestion">
          <h4>Next Steps:</h4>
          <ul>
            <li>Integrate Stripe or Paystack webhook</li>
            <li>Store payment transactions in a dedicated collection</li>
            <li>Track subscription lifecycle events</li>
            <li>Display monthly revenue trends</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Revenue;

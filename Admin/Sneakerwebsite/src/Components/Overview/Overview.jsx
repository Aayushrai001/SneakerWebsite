import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'
import { toast } from 'react-hot-toast'
import { FiPackage, FiShoppingCart, FiUsers, FiClock } from 'react-icons/fi'
import './Overview.css'

const Overview = () => {
  const [overviewData, setOverviewData] = useState({
    totalProducts: 0,
    totalEarnings: 0,
    totalOrders: 0,
    totalUsers: 0,
    newUsers: 0,
    pendingOrders: 0,
    monthlySales: [],
    yearlySales: [],
    topProducts: [],
    recentTransactions: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const response = await fetch('http://localhost:5000/admin/overview', {
          headers: {
            'auth-token': localStorage.getItem('admin-token')
          }
        })
        const data = await response.json()
        if (data.success) {
          setOverviewData(data.data)
          toast.success('Overview data loaded successfully')
        } else {
          toast.error('Failed to fetch overview data')
        }
      } catch (error) {
        console.error('Error fetching overview data:', error)
        toast.error('Error fetching overview data')
      } finally {
        setLoading(false)
      }
    }

    fetchOverviewData()
  }, [])

  const pieColors = ['#4CAF50', '#FF5722', '#2196F3', '#FFC107', '#9C27B0']

  if (loading) {
    return <div className="loading">Loading overview data...</div>
  }

  return (
    <div className="overview-container">
      <h2 className="overview-title">Admin Dashboard Overview</h2>

      <div className="overview-cards">
        <div className="card">
          <div className="card-icon">
            <FiPackage />
          </div>
          <div className="card-content">
            <h3>Total Products</h3>
            <p>{overviewData.totalProducts}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-icon">
          </div>
          <div className="card-content">
            <h3>Total Earnings</h3>
            <p>Rs. {overviewData.totalEarnings.toLocaleString()}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-icon">
            <FiShoppingCart />
          </div>
          <div className="card-content">
            <h3>Total Orders</h3>
            <p>{overviewData.totalOrders}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-icon">
            <FiUsers />
          </div>
          <div className="card-content">
            <h3>Users</h3>
            <p>{overviewData.totalUsers || 0}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-icon">
            <FiClock />
          </div>
          <div className="card-content">
            <h3>Pending Orders</h3>
            <p>{overviewData.pendingOrders}</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-section">
          <h3 className="chart-title">Monthly Sales Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overviewData.monthlySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `Rs. {value.toLocaleString()}`} />
              <Bar dataKey="sales" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h3 className="chart-title">Yearly Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={overviewData.yearlySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => `Rs. ${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#2196F3" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-section">
          <h3 className="chart-title">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={overviewData.topProducts}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {overviewData.topProducts.map((entry, index) => (
                  <Cell key={`cell-{index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `{value} orders`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h3 className="chart-title">Recent Transactions</h3>
          <div className="transactions-list">
            {overviewData.recentTransactions.map((transaction) => (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-info">
                  <span className="transaction-user">{transaction.user}</span>
                  <span className="transaction-product">{transaction.product}</span>
                </div>
                <div className="transaction-details">
                  <span className="transaction-amount">
                    Rs. {(transaction.amount || 0).toLocaleString()}
                  </span>
                  <span className="transaction-date">
                    {transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview

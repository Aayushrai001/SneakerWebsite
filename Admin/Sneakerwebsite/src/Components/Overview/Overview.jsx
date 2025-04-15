import React from 'react'
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
import './Overview.css'

const Overview = () => {
  const salesData = [
    { name: 'Jan', sales: 4000 },
    { name: 'Feb', sales: 3000 },
    { name: 'Mar', sales: 5000 },
    { name: 'Apr', sales: 4000 },
    { name: 'May', sales: 6000 },
  ]

  const yearlySales = [
    { year: '2020', total: 25000 },
    { year: '2021', total: 34000 },
    { year: '2022', total: 47000 },
    { year: '2023', total: 58000 },
    { year: '2024', total: 69000 },
  ]

  const topProducts = [
    { name: 'Air Force', value: 2300 },
    { name: 'Air Jordan 1', value: 3900 },
    { name: 'Air Jordan 2', value: 3200 },
    { name: 'Air Jordan 3', value: 1800 },
    { name: 'Air Jordan 9', value: 1500 },
  ]

  const pieColors = ['#4CAF50', '#FF5722', '#2196F3', '#FFC107', '#9C27B0']

  return (
    <div className="overview-container">
      <h2 className="overview-title">Admin Dashboard Overview</h2>

      <div className="overview-cards">
        <div className="card">
          <h3>Total Products</h3>
          <p>120</p>
        </div>
        <div className="card">
          <h3>Total Earnings</h3>
          <p>$8,750</p>
        </div>
        <div className="card">
          <h3>Total Orders</h3>
          <p>312</p>
        </div>
        <div className="card">
          <h3>New Users</h3>
          <p>45</p>
        </div>
      </div>

      <div className="chart-section">
        <h3 className="chart-title">Monthly Sales Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sales" fill="#4CAF50" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-section">
        <h3 className="chart-title">Yearly Sales Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={yearlySales}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#2196F3" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-section">
        <h3 className="chart-title">Top Selling Products</h3>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={topProducts}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {topProducts.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Overview

// 

import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Calendar, Download, Users, Book, Clock, Filter, Search } from 'lucide-react';
import './AdminDashboard.css';

function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeLoans: 0,
    overdueLoans: 0,
    departmentDistribution: [],
    monthlyActivity: []
  });

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      // Mock students
      const mockStudents = [
        { usn: "SCEM001", name: "Alice", department: "CSE" },
        { usn: "SCEM002", name: "Bob", department: "ECE" }
      ];
      setStudents(mockStudents);

      // Mock logs
      const mockLogs = [
        {
          _id: "1",
          student: mockStudents[0],
          bookTitle: "Learn React",
          checkoutDate: "2025-05-01",
          dueDate: "2025-05-10",
          status: "active"
        },
        {
          _id: "2",
          student: mockStudents[1],
          bookTitle: "Introduction to AI",
          checkoutDate: "2025-04-20",
          dueDate: "2025-04-30",
          status: "returned"
        }
      ];
      setLogs(mockLogs);

      // Mock stats
      setStats({
        totalStudents: 2,
        activeLoans: 1,
        overdueLoans: 0,
        departmentDistribution: [
          { department: "CSE", value: 1 },
          { department: "ECE", value: 1 }
        ],
        monthlyActivity: [
          { month: "January", checkouts: 10, returns: 5 },
          { month: "February", checkouts: 20, returns: 15 },
          { month: "March", checkouts: 15, returns: 18 }
        ]
      });

      setIsLoading(false);
    }, 1000);
  }, []);

  const generatePDFReport = () => {
    alert("Mock PDF download triggered.");
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.student?.usn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.bookTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (isLoading) {
    return <div className="admin-dashboard loading"><p>Loading...</p></div>;
  }

  return (
    <div className="admin-dashboard">
      {/* Header & Stats Cards */}
      <header className="dashboard-header">
        <div>
          <h1>Library Admin Dashboard</h1>
          <p>Sahyadri College</p>
        </div>
        <div className="admin-profile">
          <p>Admin User</p>
          <img src="/admin-avatar.png" alt="Admin" />
        </div>
      </header>

      <div className="dashboard-stats">
        <div className="stat-card"><Users /><h3>Total Students</h3><p>{stats.totalStudents}</p></div>
        <div className="stat-card"><Book /><h3>Active Loans</h3><p>{stats.activeLoans}</p></div>
        <div className="stat-card"><Clock /><h3>Overdue</h3><p>{stats.overdueLoans}</p></div>
        <div className="stat-card"><Calendar /><h3>Date</h3><p>{new Date().toLocaleDateString()}</p></div>
      </div>

      {/* Charts */}
      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>Department Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stats.departmentDistribution} dataKey="value" nameKey="department" outerRadius={80} label>
                {stats.departmentDistribution.map((entry, index) => (
                  <Cell key={index} fill={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Monthly Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="checkouts" stroke="#8884d8" />
              <Line type="monotone" dataKey="returns" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Logs Section */}
      <div className="logs-section">
        <div className="logs-header">
          <h2>Logs</h2>
          <button onClick={generatePDFReport}><Download size={16} /> Download PDF</button>
        </div>

        <div className="logs-filters">
          <Search /><input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <Filter /><select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
            <option value="returned">Returned</option>
          </select>
        </div>

        <table className="logs-table">
          <thead>
            <tr>
              <th>USN</th><th>Name</th><th>Dept</th><th>Book</th><th>Out</th><th>Due</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentLogs.length > 0 ? currentLogs.map(log => (
              <tr key={log._id}>
                <td>{log.student.usn}</td>
                <td>{log.student.name}</td>
                <td>{log.student.department}</td>
                <td>{log.bookTitle}</td>
                <td>{new Date(log.checkoutDate).toLocaleDateString()}</td>
                <td>{new Date(log.dueDate).toLocaleDateString()}</td>
                <td><span className={`status-badge ${log.status}`}>{log.status}</span></td>
                <td><button className="view-btn">View</button></td>
              </tr>
            )) : <tr><td colSpan="8">No logs found</td></tr>}
          </tbody>
        </table>

        {/* Pagination */}
        {filteredLogs.length > itemsPerPage && (
          <div className="pagination">
            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => paginate(i + 1)} className={currentPage === i + 1 ? 'active' : ''}>{i + 1}</button>
            ))}
            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;

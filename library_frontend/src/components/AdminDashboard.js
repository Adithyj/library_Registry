// 

import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Calendar, Download, Users, Book, Clock, Filter, Search, Calendar as CalendarIcon, FileText, Upload } from 'lucide-react';
import './AdminDashboard.css';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
// Import jsPDF correctly with autoTable
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import StudentImport from './admin/StudentImport';
import titleLogo from '../assets/title-logo.png';

function AdminDashboard() {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [adminProfile, setAdminProfile] = useState({});
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // New state for tab navigation
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeEntries: 0,
    todayEntries: 0,
    departmentDistribution: [],
    semesterDistribution: []
  });

  // Function to generate colors for pie chart
  const getChartColor = (index) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f'];
    return colors[index % colors.length];
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = '/admin-login';
      return;
    }

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch dashboard stats
        const statsResponse = await fetch('http://localhost:5000/api/admin/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }
        
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
          setStats(statsData.stats);
        }
        
        // Fetch recent entries
        const entriesResponse = await fetch('http://localhost:5000/api/admin/dashboard/recent-entries', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!entriesResponse.ok) {
          throw new Error('Failed to fetch recent entries');
        }
        
        const entriesData = await entriesResponse.json();
        
        if (entriesData.success) {
          setEntries(entriesData.entries);
          
          // Extract unique departments and semesters
          const depts = [...new Set(entriesData.entries.map(entry => entry.department))].filter(Boolean);
          const sems = [...new Set(entriesData.entries.map(entry => entry.semester))].filter(Boolean).sort((a, b) => a - b);
          
          setDepartments(depts);
          setSemesters(sems);
          
          // Get currently active students (no exit_time)
          const active = entriesData.entries.filter(entry => !entry.exit_time);
          setActiveStudents(active);
        }
        
        // Fetch admin profile
        const profileResponse = await fetch('http://localhost:5000/api/admin/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch admin profile');
        }
        
        const profileData = await profileResponse.json();
        
        if (profileData.success) {
          setAdminProfile(profileData.profile);
        }
        
        // Fetch all students
        const studentsResponse = await fetch('http://localhost:5000/api/students', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!studentsResponse.ok) {
          throw new Error('Failed to fetch students');
        }
        
        // Still fetch students for stats, but don't store in state since we don't use it
        await studentsResponse.json();
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
        setIsLoading(false);
        
        // If unauthorized, redirect to login
        if (err.message.includes('401') || err.message.includes('403')) {
          localStorage.removeItem('adminToken');
          window.location.href = '/admin-login';
        }
      }
    };

    fetchDashboardData();
  }, []);

  const generatePDFReport = (customDateRange = false) => {
    try {
      // Create a new PDF document with portrait orientation
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set document properties
      doc.setProperties({
        title: 'Sahyadri College Library Report',
        subject: 'Library Attendance Report',
        author: 'Sahyadri College Library Management System',
        creator: 'Library Registry System'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add logo at the top
      try {
        // Add logo with adjusted width to show both logo and college name
        const imgWidth = 120; // Increased width to fit logo with college name
        const imgHeight = 30; // Adjusted height to maintain aspect ratio
        const topMargin = 15; // Position a bit lower from the top for better spacing
        doc.addImage(titleLogo, 'PNG', (pageWidth - imgWidth) / 2, topMargin, imgWidth, imgHeight);
      } catch (imgErr) {
        console.warn('Could not add logo image:', imgErr);
      }
      
      // Add decorative line under logo
      doc.setDrawColor(75, 107, 251);
      doc.setLineWidth(0.5);
      doc.line(15, 50, pageWidth - 15, 50);
      
      // Reset text color for body
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      
      // Report type heading
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(25, 50, 150);
      doc.text('LIBRARY ATTENDANCE REPORT', pageWidth / 2, 60, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Add date information in a nice box
      doc.setFillColor(240, 240, 250);
      doc.setDrawColor(200, 200, 220);
      doc.roundedRect(15, 65, pageWidth - 30, 12, 2, 2, 'FD');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      
      // Clone the date objects to avoid mutation issues
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      const dateStr = customDateRange 
        ? `Report Period: ${startDateObj.toLocaleDateString()} to ${endDateObj.toLocaleDateString()}`
        : `Report Date: ${new Date().toLocaleDateString()}`;
      
      doc.text(dateStr, pageWidth / 2, 73, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      
      // Filter entries based on date range if custom range is selected
      let reportEntries = [...entries]; // Create a copy to avoid mutation
      
      if (customDateRange) {
        const start = startDateObj.setHours(0, 0, 0, 0);
        const end = endDateObj.setHours(23, 59, 59, 999);
        
        reportEntries = entries.filter(entry => {
          if (!entry.entry_time) return false;
          const entryDate = new Date(entry.entry_time).getTime();
          return entryDate >= start && entryDate <= end;
        });
      } else {
        // Just today's entries for daily report
        const today = new Date().setHours(0, 0, 0, 0);
        reportEntries = entries.filter(entry => {
          if (!entry.entry_time) return false;
          return new Date(entry.entry_time).setHours(0, 0, 0, 0) === today;
        });
      }
      
      // Summary statistics in a nicely formatted box
      doc.setFillColor(245, 247, 250);
      doc.setDrawColor(220, 220, 235);
      doc.roundedRect(15, 85, pageWidth - 30, 35, 2, 2, 'FD');
      
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 100);
      doc.text('SUMMARY STATISTICS', pageWidth / 2, 93, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      
      const activeCount = reportEntries.filter(entry => !entry.exit_time).length;
      const completedCount = reportEntries.filter(entry => entry.exit_time).length;
      
      // Create a 2x2 grid for statistics
      doc.text(`Total Entries: ${reportEntries.length}`, 25, 103);
      doc.text(`Active Entries: ${activeCount}`, pageWidth - 25, 103, { align: 'right' });
      doc.text(`Completed Entries: ${completedCount}`, 25, 113);
      
      // Department breakdown
      const deptCounts = {};
      reportEntries.forEach(entry => {
        if (entry.department) {
          deptCounts[entry.department] = (deptCounts[entry.department] || 0) + 1;
        }
      });
      
      // Create department breakdown table data
      let deptRows = [];
      for (const [dept, count] of Object.entries(deptCounts)) {
        deptRows.push([dept, count.toString(), Math.round(count / reportEntries.length * 100) + '%']);
      }
      
      // Only add department breakdown if there are departments
      if (deptRows.length > 0) {
        // Section heading
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(50, 50, 100);
        doc.text('DEPARTMENT STATISTICS', pageWidth / 2, 130, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        // Department distribution table
        autoTable(doc, {
          head: [['Department', 'Count', 'Percentage']],
          body: deptRows,
          startY: 135,
          theme: 'grid',
          headStyles: { 
            fillColor: [75, 107, 251],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          styles: { 
            overflow: 'linebreak',
            cellWidth: 'auto',
            cellPadding: 4
          },
          columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 40, halign: 'center' }
          },
          margin: { left: pageWidth / 2 - 70 }
        });
      }
      
      // Create a table with entry details
      // Separate date from time for better readability
      const tableColumn = ["USN", "Name", "Department", "Date", "Check In", "Check Out", "Duration"];
      const tableRows = [];
      
      const formatTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      };
      
      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString();
      };
      
      reportEntries.forEach(entry => {
        const entryData = [
          entry.usn || 'N/A',
          entry.name || 'N/A',
          entry.department || 'N/A',
          entry.entry_time ? formatDate(entry.entry_time) : 'N/A',
          entry.entry_time ? formatTime(entry.entry_time) : 'N/A',
          entry.exit_time ? formatTime(entry.exit_time) : "Still Active",
          entry.duration ? `${entry.duration} min` : "N/A"
        ];
        tableRows.push(entryData);
      });
      
      // Section heading for entries table
      let entriesStartY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 180;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(50, 50, 100);
      doc.text('DETAILED ENTRIES', pageWidth / 2, entriesStartY, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Only add table if there are entries
      if (reportEntries.length > 0) {
        // Use the autoTable imported function directly
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: entriesStartY + 10,
          theme: 'striped',
          headStyles: { 
            fillColor: [75, 107, 251],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250]
          },
          styles: { 
            overflow: 'linebreak',
            cellWidth: 'auto',
            fontSize: 9,
            cellPadding: 3
          },
          columnStyles: { 
            0: { cellWidth: 25 }, // USN
            1: { cellWidth: 30 }, // Name
            2: { cellWidth: 25 }, // Department
            3: { cellWidth: 20 }, // Date
            4: { cellWidth: 20 }, // Check In
            5: { cellWidth: 20 }, // Check Out
            6: { cellWidth: 15, halign: 'center' }  // Duration
          }
        });
      } else {
        // Add a message if no entries found
        doc.setFontSize(11);
        doc.text('No entries found for the selected time period.', pageWidth / 2, entriesStartY + 20, { align: 'center' });
      }
      
      // Add footer with decorative line and information
      const footerY = doc.internal.pageSize.getHeight() - 10;
      
      // Add footer for all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Add decorative line
        doc.setDrawColor(75, 107, 251);
        doc.setLineWidth(0.5);
        doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
        
        // Footer text
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, footerY);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, footerY, { align: 'right' });
        doc.text('Sahyadri College Library Management System', pageWidth / 2, footerY, { align: 'center' });
      }
      
      // Save the PDF
      const fileName = customDateRange 
        ? `library_report_${startDateObj.toISOString().split('T')[0]}_to_${endDateObj.toISOString().split('T')[0]}.pdf` 
        : `library_report_${new Date().toISOString().split('T')[0]}.pdf`;
      
      doc.save(fileName);
      
      console.log(`Report generated successfully: ${fileName}`);
      
      // Show success message
      alert('Report generated successfully!');
      
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('Failed to generate report. See console for details.');
    }
  };

  const filteredEntries = entries.filter(entry => {
    // Text search filter
    const matchesSearch = 
      entry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.usn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.department?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && !entry.exit_time) ||
      (filterStatus === 'completed' && entry.exit_time);
      
    // Department filter
    const matchesDepartment = filterDepartment === 'all' || 
      entry.department === filterDepartment;
      
    // Semester filter
    const matchesSemester = filterSemester === 'all' || 
      entry.semester === parseInt(filterSemester);

    return matchesSearch && matchesStatus && matchesDepartment && matchesSemester;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEntries = filteredEntries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Format entry status
  const getEntryStatus = (entry) => {
    return entry.exit_time ? 'completed' : 'active';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return <div className="admin-dashboard loading"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="admin-dashboard error"><p>Error: {error}</p></div>;
  }

  return (
    <div className="admin-dashboard">
      {/* Header remains at the top */}
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>Library Dashboard</h1>
          <p>Manage your library resources and activities</p>
        </div>
        <div className="dashboard-actions">
          <button className="action-btn" title="Help & Documentation">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </button>
          <button className="action-btn" title="System Settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
          <button className="action-btn" title="Notifications">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            <span className="notification-badge">2</span>
          </button>
        </div>
        <div className="admin-profile">
          <div className="admin-info">
            <p className="admin-name">{adminProfile.name || 'Admin User'}</p>
            <p className="admin-role">System Administrator</p>
          </div>
          <div className="admin-avatar">
            <img src="/admin-avatar.png" alt="Admin" />
          </div>
        </div>
      </header>

      {/* Create a container with sidebar and content */}
      <div className="dashboard-container">
        {/* Left Sidebar for Navigation */}
        <div className="dashboard-sidebar">
          <div className="sidebar-section">
            <h3>Main Navigation</h3>
            <ul className="sidebar-nav">
              <li className={activeTab === 'dashboard' ? 'active' : ''}>
                <button onClick={() => setActiveTab('dashboard')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
                  <span>Dashboard</span>
                </button>
              </li>
              <li className={activeTab === 'studentImport' ? 'active' : ''}>
                <button onClick={() => setActiveTab('studentImport')}>
                  <Upload size={18} />
                  <span>Student Import</span>
                </button>
              </li>
              <li>
                <button onClick={() => alert('Book Management coming soon')}>
                  <Book size={18} />
                  <span>Book Management</span>
                </button>
              </li>
              <li>
                <button onClick={() => alert('Circulation coming soon')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                  <span>Circulation</span>
                </button>
              </li>
              <li>
                <button onClick={() => alert('User Management coming soon')}>
                  <Users size={18} />
                  <span>User Management</span>
                </button>
              </li>
            </ul>
          </div>
          
          <div className="sidebar-section">
            <h3>Reports</h3>
            <div className="report-buttons">
              <button onClick={() => generatePDFReport(false)} className="report-btn">
                <FileText size={16} /> Daily Report
              </button>
              
              <button onClick={() => setShowDatePicker(!showDatePicker)} className="report-btn">
                <CalendarIcon size={16} /> Custom Date Range
              </button>
            </div>
            
            {showDatePicker && (
              <div className="date-picker-container">
                <div className="date-fields">
                  <div className="date-field">
                    <label>Start Date:</label>
                    <DatePicker
                      selected={startDate}
                      onChange={date => setStartDate(date)}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      className="date-input"
                    />
                  </div>
                  
                  <div className="date-field">
                    <label>End Date:</label>
                    <DatePicker
                      selected={endDate}
                      onChange={date => setEndDate(date)}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      className="date-input"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    generatePDFReport(true);
                    setShowDatePicker(false);
                  }}
                  className="generate-btn"
                >
                  <Download size={16} /> Generate Report
                </button>
              </div>
            )}
          </div>
          
          <div className="sidebar-section">
            <h3>Data Filters</h3>
            <div className="filter-group vertical">
              <label>Status:</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Currently In</option>
                <option value="completed">Checked Out</option>
              </select>
            </div>
            
            <div className="filter-group vertical">
              <label>Department:</label>
              <select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)}>
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group vertical">
              <label>Semester:</label>
              <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)}>
                <option value="all">All Semesters</option>
                {semesters.map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>System Info</h3>
            <div className="system-info">
              <div className="info-item">
                <span className="info-label">Version:</span>
                <span className="info-value">1.2.0</span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Update:</span>
                <span className="info-value">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Database:</span>
                <span className="info-value">PostgreSQL</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="dashboard-content">
          {activeTab === 'dashboard' ? (
            <>
              {/* System Overview Cards */}
              <div className="dashboard-stats">
                <div className="stat-card">
                  <div className="stat-icon"><Users size={24} /></div>
                  <div className="stat-details">
                    <h3>Total Students</h3>
                    <p className="stat-value">{stats.totalStudents || 0}</p>
                    <span className="stat-trend positive">+5% from last month</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon"><Book size={24} /></div>
                  <div className="stat-details">
                    <h3>Active Entries</h3>
                    <p className="stat-value">{stats.activeEntries || 0}</p>
                    <span className="stat-trend">Current visitors</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon"><Clock size={24} /></div>
                  <div className="stat-details">
                    <h3>Today's Entries</h3>
                    <p className="stat-value">{stats.todayEntries || 0}</p>
                    <span className="stat-trend">Daily visits</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon"><Calendar size={24} /></div>
                  <div className="stat-details">
                    <h3>Date</h3>
                    <p className="stat-value">{new Date().toLocaleDateString()}</p>
                    <span className="stat-trend">{new Date().toLocaleDateString(undefined, { weekday: 'long' })}</span>
                  </div>
                </div>
              </div>

              {/* Quick Access Section */}
              <div className="quick-access-section">
                <h2>Quick Actions</h2>
                <div className="quick-access-buttons">
                  <button className="quick-access-btn" onClick={() => alert('Check-in Student feature coming soon')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                    <span>Check-in Student</span>
                  </button>
                  <button className="quick-access-btn" onClick={() => alert('Check-out Student feature coming soon')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    <span>Check-out Student</span>
                  </button>
                  <button className="quick-access-btn" onClick={() => alert('Add New Book feature coming soon')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><line x1="12" y1="6" x2="12" y2="14"></line><line x1="8" y1="10" x2="16" y2="10"></line></svg>
                    <span>Add New Book</span>
                  </button>
                  <button className="quick-access-btn" onClick={() => window.open(generatePDFReport(false))}>
                    <FileText size={24} />
                    <span>Generate Report</span>
                  </button>
                </div>
              </div>

              {/* Charts */}
              <div className="dashboard-charts">
                <div className="chart-container">
                  <div className="chart-header">
                    <h3>Department Distribution</h3>
                    <div className="chart-actions">
                      <button className="chart-action-btn" title="Download Data">
                        <Download size={14} />
                      </button>
                      <button className="chart-action-btn" title="View Full Screen">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                      </button>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie 
                        data={stats.departmentDistribution || []} 
                        dataKey="count" 
                        nameKey="department" 
                        outerRadius={80} 
                        label
                      >
                        {(stats.departmentDistribution || []).map((entry, index) => (
                          <Cell key={index} fill={getChartColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-container">
                  <div className="chart-header">
                    <h3>Semester Distribution</h3>
                    <div className="chart-actions">
                      <button className="chart-action-btn" title="Download Data">
                        <Download size={14} />
                      </button>
                      <button className="chart-action-btn" title="View Full Screen">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                      </button>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.semesterDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="semester" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" name="Students" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activity Summary & System Notifications */}
              <div className="activity-notifications-grid">
                {/* Activity Summary */}
                <div className="activity-summary">
                  <div className="section-header">
                    <h3>Recent Activity</h3>
                    <button className="section-action-btn">View All</button>
                  </div>
                  <div className="activity-list">
                    <div className="activity-item">
                      <div className="activity-icon check-in">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                      </div>
                      <div className="activity-content">
                        <p className="activity-text"><strong>John Doe</strong> checked in</p>
                        <p className="activity-time">10 minutes ago</p>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon check-out">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                      </div>
                      <div className="activity-content">
                        <p className="activity-text"><strong>Jane Smith</strong> checked out</p>
                        <p className="activity-time">25 minutes ago</p>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon system">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                      </div>
                      <div className="activity-content">
                        <p className="activity-text">Daily report generated</p>
                        <p className="activity-time">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* System Notifications */}
                <div className="system-notifications">
                  <div className="section-header">
                    <h3>System Notifications</h3>
                    <button className="section-action-btn">Mark All Read</button>
                  </div>
                  <div className="notification-list">
                    <div className="notification-item unread">
                      <div className="notification-icon warning">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      </div>
                      <div className="notification-content">
                        <p className="notification-text">System backup scheduled for tonight at 2 AM</p>
                        <p className="notification-time">2 hours ago</p>
                      </div>
                    </div>
                    <div className="notification-item unread">
                      <div className="notification-icon info">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                      </div>
                      <div className="notification-content">
                        <p className="notification-text">New system update v1.2.1 is available</p>
                        <p className="notification-time">Yesterday</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Active Students Section */}
              <div className="active-students-section">
                <div className="section-header">
                  <h3>Currently In Library ({activeStudents.length} students)</h3>
                  <div className="section-actions">
                    <button className="section-action-btn" title="Refresh">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                    </button>
                    <button className="section-action-btn" title="Export">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
                <div className="active-students-grid">
                  {activeStudents.length > 0 ? (
                    activeStudents.map(student => (
                      <div className="active-student-card" key={student.id}>
                        <div className="student-info">
                          <strong>{student.name}</strong>
                          <span>{student.usn}</span>
                          <span>{student.department} - Sem {student.semester}</span>
                          <span className="check-in-time">
                            Since: {formatDate(student.entry_time)}
                          </span>
                        </div>
                        <div className="student-actions">
                          <button className="student-action-btn" title="Check Out">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-active">No students currently in the library</p>
                  )}
                </div>
              </div>

              {/* Logs Section */}
              <div className="logs-section">
                <div className="logs-header">
                  <h2>Library Entries</h2>
                  <button className="generate-pdf-btn" onClick={() => generatePDFReport(false)}>
                    <Download size={16} /> Export to PDF
                  </button>
                </div>

                <div className="search-filter">
                  <Search /><input placeholder="Search by name, USN, department..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>

                <div className="logs-table-container">
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>USN</th>
                        <th>Name</th>
                        <th>Dept</th>
                        <th>Semester</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentEntries.length > 0 ? currentEntries.map(entry => (
                        <tr key={entry.id}>
                          <td>{entry.usn}</td>
                          <td>{entry.name}</td>
                          <td>{entry.department}</td>
                          <td>{entry.semester}</td>
                          <td>{formatDate(entry.entry_time)}</td>
                          <td>{entry.exit_time ? formatDate(entry.exit_time) : '-'}</td>
                          <td>{entry.duration ? `${entry.duration} min` : 'Active'}</td>
                          <td>
                            <span className={`status-badge ${getEntryStatus(entry)}`}>
                              {getEntryStatus(entry)}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="action-btn view" title="View Details">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              </button>
                              {!entry.exit_time && (
                                <button className="action-btn checkout" title="Check Out">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )) : <tr><td colSpan="9" className="no-data">No entries found</td></tr>}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredEntries.length > itemsPerPage && (
                  <div className="pagination">
                    <button className="page-btn" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button key={i} onClick={() => paginate(i + 1)} className={currentPage === i + 1 ? 'active' : ''}>{i + 1}</button>
                    ))}
                    <button className="page-btn" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Student Import Tab */
            <StudentImport />
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

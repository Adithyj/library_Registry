// 

import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Calendar, Download, Users, Book, Clock, Filter, Search, Calendar as CalendarIcon, FileText, Upload, UserPlus } from 'lucide-react';
import './AdminDashboard.css';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
// Import jsPDF correctly with autoTable
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import StudentImport from './admin/StudentImport';
import titleLogo from '../assets/title-logo.png';
import logoWatermark from '../assets/s-logo.jpg';

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
  
  // New states for modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: adminProfile.name || 'Admin User',
    email: adminProfile.email || 'admin@sahyadri.edu',
    role: adminProfile.role || 'System Administrator',
    department: adminProfile.department || 'Library Management',
    joinDate: adminProfile.joinDate || '2023-01-01'
  });
  const [settingsData, setSettingsData] = useState({
    darkMode: false,
    emailNotifications: true,
    smsNotifications: false,
    language: 'English',
    autoLogout: 30
  });
  
  // Student form state
  const [studentForm, setStudentForm] = useState({
    usn: '',
    name: '',
    department: '',
    semester: '',
    email: '',
    phone: '',
    sendWhatsapp: false  // New field for WhatsApp notification toggle
  });
  const [formMode, setFormMode] = useState('initial'); // 'initial', 'search', 'add', or 'update'
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeEntries: 0,
    todayEntries: 0,
    departmentDistribution: [],
    semesterDistribution: []
  });

  // Add class to body when component mounts
  useEffect(() => {
    document.body.classList.add('admin-dashboard-page');
    
    // Clean up function to remove class when component unmounts
    return () => {
      document.body.classList.remove('admin-dashboard-page');
    };
  }, []);

  // Function to handle clicking outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      const dropdown = document.getElementById('profile-dropdown');
      const profileMenu = document.querySelector('.admin-profile');
      
      if (dropdown && profileMenu && !profileMenu.contains(event.target)) {
        dropdown.classList.remove('show');
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to generate colors for pie chart
  const getChartColor = (index) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f'];
    return colors[index % colors.length];
  };

  // Handle checkbox change specifically for the WhatsApp notification toggle
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setStudentForm(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setStudentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle student search
  const handleStudentSearch = async () => {
    if (!studentForm.usn) {
      alert('Please enter a USN to search');
      return;
    }
    
    try {
      // Get admin token
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        return;
      }

      // In a real implementation, you would fetch student data from the API
      console.log(`Searching for student with USN: ${studentForm.usn}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Only keep the USN and reset other fields, letting user enter actual data
      setStudentForm({
        usn: studentForm.usn,
        name: '',
        department: '',
        semester: '',
        email: '',
        phone: '',
        sendWhatsapp: false
      });
      
      // Set form mode to update
      setFormMode('update');
      
      // Show the user that the search was successful
      setSuccessMessage(`Student with USN ${studentForm.usn} found. Please update details.`);
      setShowSuccessModal(true);
      
      // Auto hide the success message after 2 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error searching for student:', error);
      alert(`Error searching for student: ${error.message}`);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (mode) => {
    try {
      // Get admin token
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        return;
      }

      // Validate form fields
      if (!studentForm.usn || !studentForm.name || !studentForm.department || !studentForm.semester || !studentForm.email) {
        alert('Please fill all required fields: USN, Name, Department, Semester, and Email');
        return;
      }

      // Validate phone number if WhatsApp notifications are enabled
      if (studentForm.sendWhatsapp && (!studentForm.phone || studentForm.phone.length < 10)) {
        alert('Please enter a valid phone number for WhatsApp notifications');
        return;
      }

      // In a real implementation, this would be an API call
      // For demonstration, we'll simulate a successful update
      console.log(`${mode === 'add' ? 'Adding' : 'Updating'} student:`, studentForm);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message with information about notifications sent
      let notificationDetails = 'Email notification sent';
      if (studentForm.sendWhatsapp) {
        notificationDetails += ' and WhatsApp message delivered';
      }
      
      setSuccessMessage(`Student ${mode === 'add' ? 'added' : 'updated'} successfully! ${notificationDetails}.`);
      setShowSuccessModal(true);
      
      // Reset form after submission with timeout
      setTimeout(() => {
        setStudentForm({
          usn: '',
          name: '',
          department: '',
          semester: '',
          email: '',
          phone: '',
          sendWhatsapp: false
        });
        setFormMode('initial');
        setShowSuccessModal(false);
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Error ${formMode === 'add' ? 'adding' : 'updating'} student: ${error.message}`);
    }
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
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Function to add watermark to each page
      const addWatermark = (pageNumber) => {
        doc.setPage(pageNumber);
        
        try {
          // Add watermark image with low opacity
          const wmWidth = 100; // Width of watermark
          const wmHeight = 100; // Height of watermark
          
          // Position in the center of the page
          const x = (pageWidth - wmWidth) / 2;
          const y = (pageHeight - wmHeight) / 2;
          
          // Save current global settings
          const currentGState = doc.getGState();
          
          // Set transparency for watermark
          doc.setGState(new doc.GState({ opacity: 0.1 }));
          
          // Add the watermark image
          doc.addImage(logoWatermark, 'JPEG', x, y, wmWidth, wmHeight);
          
          // Restore previous settings
          doc.setGState(currentGState);
        } catch (wmErr) {
          console.warn('Could not add watermark image:', wmErr);
        }
      };
      
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
        
        // Add watermark to each page
        addWatermark(i);
        
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

  // Add logout function
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin-login';
  };

  // Handle profile and settings modal open/close
  const handleOpenProfileModal = () => {
    setShowProfileModal(true);
    document.getElementById('profile-dropdown').classList.remove('show');
  };

  const handleOpenSettingsModal = () => {
    setShowSettingsModal(true);
    document.getElementById('profile-dropdown').classList.remove('show');
  };

  const handleCloseModals = () => {
    setShowProfileModal(false);
    setShowSettingsModal(false);
  };
  
  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle settings form changes
  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettingsData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle profile update
  const handleProfileUpdate = () => {
    // In a real app, this would be an API call to update the user profile
    console.log('Updating profile with:', profileData);
    
    // Update local adminProfile state to reflect changes
    setAdminProfile({
      ...adminProfile,
      name: profileData.name,
      email: profileData.email,
      role: profileData.role,
      department: profileData.department,
      joinDate: profileData.joinDate
    });
    
    // Show success message and close modal
    setSuccessMessage('Profile updated successfully!');
    setShowSuccessModal(true);
    setShowProfileModal(false);
    
    // Auto hide success message
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 2000);
  };
  
  // Handle settings update
  const handleSettingsUpdate = () => {
    // In a real app, this would be an API call to update user settings
    console.log('Updating settings with:', settingsData);
    
    // Show success message and close modal
    setSuccessMessage('Settings updated successfully!');
    setShowSuccessModal(true);
    setShowSettingsModal(false);
    
    // Auto hide success message
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 2000);
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
          <div className="title-with-icon">
            <div className="dashboard-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            </div>
            <div>
              <h1>Sahyadri Library Dashboard</h1>
              <p>Manage your library resources and activities</p>
            </div>
          </div>
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
        <div className="admin-profile" onClick={() => document.getElementById('profile-dropdown').classList.toggle('show')}>
          <div className="admin-info">
            <p className="admin-name">{adminProfile.name || 'Admin User'}</p>
            <p className="admin-role">System Administrator</p>
          </div>
          <div className="admin-avatar">
            <img src="/admin-avatar.png" alt="Admin" />
          </div>
          <div className="profile-dropdown-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          <div id="profile-dropdown" className="profile-dropdown">
            <div className="dropdown-item" onClick={handleOpenProfileModal}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              My Profile
            </div>
            <div className="dropdown-item" onClick={handleOpenSettingsModal}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              Account Settings
            </div>
            <div className="dropdown-divider"></div>
            <div className="dropdown-item logout" onClick={handleLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Logout
            </div>
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
              <li className={activeTab === 'studentInfo' ? 'active' : ''}>
                <button onClick={() => setActiveTab('studentInfo')}>
                  <UserPlus size={18} />
                  <span>Student Info Management</span>
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm14 14H7V5h10v14z"></path></svg>
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
          ) : activeTab === 'studentInfo' ? (
            /* Student Info Management Tab */
            <div className="student-info-management">
              <h2>Student Information Management</h2>
              
              {/* Step 1: Initial buttons for student management */}
              {!studentForm.usn || formMode === 'initial' ? (
                <div className="student-actions-container">
                  <button 
                    className="student-action-btn primary"
                    onClick={() => setFormMode('search')}
                  >
                    Update Student Information
                  </button>
                  <button 
                    className="student-action-btn secondary"
                    onClick={() => {
                      setStudentForm({
                        usn: '',
                        name: '',
                        department: '',
                        semester: '',
                        email: '',
                        phone: '',
                        sendWhatsapp: false
                      });
                      setFormMode('add');
                    }}
                  >
                    Add New Student
                  </button>
                </div>
              ) : null}
              
              {/* Step 2: USN Search form */}
              {formMode === 'search' && (
                <div className="usn-search-container">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Enter Student USN to Update</label>
                      <div className="search-input-group">
                        <input 
                          type="text" 
                          name="usn"
                          value={studentForm.usn}
                          onChange={handleFormChange}
                          placeholder="Enter student USN" 
                        />
                        <button 
                          className="action-button search"
                          onClick={handleStudentSearch}
                        >
                          Search
                        </button>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="action-button cancel"
                    onClick={() => setFormMode('initial')}
                  >
                    Cancel
                  </button>
                </div>
              )}
              
              {/* Step 3: Full student form (only shown after USN search or in add mode) */}
              {(formMode === 'update' || formMode === 'add') && (
                <div className="student-update-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>USN</label>
                      <input 
                        type="text" 
                        name="usn"
                        value={studentForm.usn}
                        onChange={handleFormChange}
                        placeholder="Enter student USN" 
                        readOnly={formMode === 'update'}
                      />
                    </div>
                    <div className="form-group">
                      <label>Name</label>
                      <input 
                        type="text" 
                        name="name"
                        value={studentForm.name}
                        onChange={handleFormChange}
                        placeholder="Enter student name" 
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Department</label>
                      <select
                        name="department"
                        value={studentForm.department}
                        onChange={handleFormChange}
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Semester</label>
                      <select
                        name="semester"
                        value={studentForm.semester}
                        onChange={handleFormChange}
                      >
                        <option value="">Select Semester</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <input 
                        type="email" 
                        name="email"
                        value={studentForm.email}
                        onChange={handleFormChange}
                        placeholder="Enter student email" 
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input 
                        type="text" 
                        name="phone"
                        value={studentForm.phone}
                        onChange={handleFormChange}
                        placeholder="Enter student phone" 
                      />
                    </div>
                  </div>
                  <div className="form-row whatsapp-row">
                    <div className="form-group whatsapp-toggle">
                      <label className="checkbox-container">
                        <input
                          type="checkbox"
                          name="sendWhatsapp"
                          checked={studentForm.sendWhatsapp}
                          onChange={handleCheckboxChange}
                        />
                        <span className="custom-checkbox"></span>
                        Send WhatsApp notification in addition to email
                      </label>
                      {studentForm.sendWhatsapp && (
                        <p className="whatsapp-note">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                          A WhatsApp message with student details will be sent to the phone number above
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="form-actions">
                    <button 
                      className="action-button update"
                      onClick={() => handleFormSubmit(formMode)}
                    >
                      {formMode === 'add' ? 'Add Student' : 'Update Student'}
                    </button>
                    <button 
                      className="action-button cancel"
                      onClick={() => setFormMode('initial')}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Student Import Tab */
            <StudentImport />
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="success-modal">
          <div className="modal-content">
            <div className="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h2>{successMessage}</h2>
            <button onClick={() => setShowSuccessModal(false)}>Close</button>
          </div>
        </div>
      )}
      
      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>My Profile</h2>
              <button className="close-btn" onClick={handleCloseModals}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="profile-avatar-section">
                <div className="large-avatar">
                  <img src="/admin-avatar.png" alt="Profile" />
                </div>
                <button className="upload-avatar-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  Upload Photo
                </button>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    name="role"
                    value={profileData.role}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    name="department"
                    value={profileData.department}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Join Date</label>
                  <input
                    type="date"
                    name="joinDate"
                    value={profileData.joinDate}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={handleCloseModals}>Cancel</button>
              <button className="save-btn" onClick={handleProfileUpdate}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Account Settings</h2>
              <button className="close-btn" onClick={handleCloseModals}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="settings-section">
                <h3>Appearance</h3>
                <div className="setting-item">
                  <div className="setting-label">
                    <span>Dark Mode</span>
                    <p className="setting-description">Enable dark theme for the dashboard</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="darkMode"
                      checked={settingsData.darkMode}
                      onChange={handleSettingsChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div className="settings-section">
                <h3>Notifications</h3>
                <div className="setting-item">
                  <div className="setting-label">
                    <span>Email Notifications</span>
                    <p className="setting-description">Receive email notifications</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="emailNotifications"
                      checked={settingsData.emailNotifications}
                      onChange={handleSettingsChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                
                <div className="setting-item">
                  <div className="setting-label">
                    <span>SMS Notifications</span>
                    <p className="setting-description">Receive SMS alerts for important events</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="smsNotifications"
                      checked={settingsData.smsNotifications}
                      onChange={handleSettingsChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div className="settings-section">
                <h3>Preferences</h3>
                <div className="setting-item">
                  <div className="setting-label">
                    <span>Language</span>
                  </div>
                  <select
                    name="language"
                    value={settingsData.language}
                    onChange={handleSettingsChange}
                    className="settings-select"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Kannada">Kannada</option>
                  </select>
                </div>
                
                <div className="setting-item">
                  <div className="setting-label">
                    <span>Auto Logout</span>
                    <p className="setting-description">Automatically log out after inactivity (minutes)</p>
                  </div>
                  <select
                    name="autoLogout"
                    value={settingsData.autoLogout}
                    onChange={handleSettingsChange}
                    className="settings-select"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={handleCloseModals}>Cancel</button>
              <button className="save-btn" onClick={handleSettingsUpdate}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

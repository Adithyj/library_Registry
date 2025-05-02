import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SemesterManager() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/students');
      setStudents(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const advanceSemesters = async () => {
    if (!window.confirm('Are you sure you want to advance all students to the next semester?')) return;
    
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/students/update-semesters');
      setMessage(response.data.message);
      fetchStudents();
    } catch (error) {
      console.error(error);
      setMessage('Error updating semesters');
    } finally {
      setLoading(false);
    }
  };

  const updateStudentSemester = async (usn, newSemester) => {
    try {
      await axios.put(`http://localhost:5000/api/students/${usn}`, { semester: newSemester });
      fetchStudents();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="card">
      <h2>Semester Management</h2>
      
      <button 
        onClick={advanceSemesters}
        disabled={loading}
        className="advance-btn"
      >
        {loading ? 'Processing...' : 'Advance All to Next Semester'}
      </button>
      
      {message && <p className={message.includes('error') ? 'error' : 'success'}>{message}</p>}
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>USN</th>
              <th>Name</th>
              <th>Department</th>
              <th>Current Semester</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.usn}>
                <td>{student.usn}</td>
                <td>{student.name}</td>
                <td>{student.department}</td>
                <td>
                  <select
                    value={student.semester}
                    onChange={(e) => updateStudentSemester(student.usn, parseInt(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button 
                    onClick={() => updateStudentSemester(student.usn, student.semester + 1)}
                    disabled={student.semester >= 8}
                  >
                    +1
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SemesterManager;
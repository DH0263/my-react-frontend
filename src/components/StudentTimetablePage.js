import React, { useEffect, useState, useMemo } from 'react';
import Timetable from './Timetable';
import axios from 'axios';

// API 주소를 환경변수로 관리
const API_URL = process.env.REACT_APP_API_URL || 'https://my-fastapi-backend-0yks.onrender.com';

function StudentTimetablePage() {
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  useEffect(() => {
    axios.get(`${API_URL}/students/`).then(res => setStudents(res.data));
    axios.get(`${API_URL}/schedules/`).then(res => setSchedules(res.data));
  }, []);

  // 1개 이상 수업 듣는 학생만
  const studentsWithClass = useMemo(() => {
    const classCount = {};
    schedules.forEach(s => {
      if (s.student_id && s.type === '수업') {
        classCount[s.student_id] = (classCount[s.student_id] || 0) + 1;
      }
    });
    return students.filter(st => classCount[st.id]);
  }, [students, schedules]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return studentsWithClass;
    return studentsWithClass.filter(st => st.name.includes(studentSearch));
  }, [studentSearch, studentsWithClass]);

  const studentSchedules = useMemo(() => {
    if (!selectedStudentId) return [];
    return schedules.filter(s => s.student_id === Number(selectedStudentId));
  }, [schedules, selectedStudentId]);

  return (
    <div style={{padding:24}}>
      <h2>학생별 시간표</h2>
      <input placeholder="학생 검색" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} style={{marginBottom:8}} />
      <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
        <option value="">학생 선택</option>
        {filteredStudents.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
      </select>
      {selectedStudentId && (
        <Timetable schedules={studentSchedules} />
      )}
    </div>
  );
}

export default StudentTimetablePage;

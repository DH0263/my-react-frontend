import React, { useEffect, useState } from 'react';
import Timetable from './components/Timetable';
import AdminPanel from './components/AdminPanel';
import axios from 'axios';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate
} from 'react-router-dom';
import StudentTimetablePage from './components/StudentTimetablePage';

function TeacherTimetablePage() {
  const { id } = useParams();
  const [schedules, setSchedules] = useState([]);
  const [teacher, setTeacher] = useState(null);
  useEffect(() => {
    axios.get(`http://localhost:8000/teachers/${id}/schedules`)
      .then(res => setSchedules(res.data))
      .catch(e => alert(e.response?.data?.detail || '스케줄 로딩 실패'));
    axios.get(`http://localhost:8000/teachers/${id}`)
      .then(res => setTeacher(res.data))
      .catch(e => alert(e.response?.data?.detail || '선생님 로딩 실패'));
  }, [id]);
  return (
    <div style={{padding:24}}>
      <h2>{teacher ? `${teacher.name} 선생님 시간표` : '로딩 중...'}</h2>
      <Timetable schedules={schedules} />
      <Link to="/">← 메인으로</Link>
    </div>
  );
}

function RoomTimetablePage() {
  const { name } = useParams();
  const [schedules, setSchedules] = useState([]);
  useEffect(() => {
    if (!name) return;
    axios.get(`http://localhost:8000/rooms/by_name/${encodeURIComponent(name)}/schedules`)
      .then(res => setSchedules(res.data))
      .catch(e => alert(e.response?.data?.detail || '공간 스케줄 로딩 실패'));
  }, [name]);
  return (
    <div style={{padding:24}}>
      <h2>{name} 공간 시간표</h2>
      <Timetable schedules={schedules} />
      <Link to="/">← 메인으로</Link>
    </div>
  );
}

function AdminPage() {
  const [schedules, setSchedules] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(false);
  useEffect(() => {
    axios.get('http://localhost:8000/schedules/').then(res => setSchedules(res.data));
  }, [refreshFlag]);
  const handleRefresh = () => setRefreshFlag(f => !f);
  return (
    <div style={{padding:24}}>
      <h2>기본시간표 관리 (관리자)</h2>
      <AdminPanel onRefresh={handleRefresh} />
      <div style={{marginTop:32}}>
        <Timetable schedules={schedules} onRefresh={handleRefresh} />
      </div>
      <Link to="/">← 메인으로</Link>
    </div>
  );
}

function MainPage() {
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  useEffect(() => {
    axios.get('http://localhost:8000/teachers/').then(res => setTeachers(res.data));
    axios.get('http://localhost:8000/rooms/').then(res => setRooms(res.data));
  }, []);
  const navigate = useNavigate();
  return (
    <div style={{padding:24}}>
      <h1>학원 시간표/상담표</h1>
      <div style={{marginBottom:24}}>
        <button onClick={()=>navigate('/admin')}>기본시간표 관리(관리자)</button>
      </div>
      <div style={{marginBottom:16}}>
        <h3>선생님별 시간표 보기</h3>
        {teachers.map(t => (
          <button key={t.id} style={{margin:4}} onClick={() => navigate('/teacher/' + t.id)}>{t.name}</button>
        ))}
      </div>
      <div style={{marginBottom:16}}>
        <h3>공간별 시간표 보기</h3>
        {rooms.map(r => (
          <button key={r.id || r.name} style={{margin:4}} onClick={() => navigate('/room/' + r.name)}>{r.name}</button>
        ))}
      </div>
      <div style={{marginBottom:16}}>
        <h3>학생별 시간표 보기</h3>
        <button onClick={()=>navigate('/student-timetable')}>학생별 시간표</button>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/teacher/:id" element={<TeacherTimetablePage />} />
        <Route path="/room/:name" element={<RoomTimetablePage />} />
        <Route path="/student-timetable" element={<StudentTimetablePage />} />
      </Routes>
    </Router>
  );
}

export default App;

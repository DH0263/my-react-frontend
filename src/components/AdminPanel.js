import React, { useState, useMemo } from 'react';
import axios from 'axios';
import Timetable from './Timetable'; // Timetable 컴포넌트를 import하세요.

// API 주소를 환경변수로 관리
const API_URL = process.env.REACT_APP_API_URL || 'https://my-fastapi-backend-0yks.onrender.com';

function AdminPanel({ onRefresh }) {
  const [teacher, setTeacher] = useState("");
  const [teacherSubject, setTeacherSubject] = useState("");
  const [room, setRoom] = useState("");
  const [student, setStudent] = useState("");
  const [schedule, setSchedule] = useState({
    teacher_id: "",
    room_id: "",
    student_id: "",
    day_of_week: "월요일",
    start_time: "13:00",
    end_time: "14:00",
    type: "수업",
  });
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkResult, setBulkResult] = useState("");
  const [bulkIsRegular, setBulkIsRegular] = useState(true);
  const [bulkError, setBulkError] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [schedules, setSchedules] = useState([]); // schedules 상태 추가
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [errors, setErrors] = useState([]);
  // 단체수업 추가용 상태
  const [groupSchedule, setGroupSchedule] = useState({
    teacher_id: "",
    room_id: "",
    student_ids: [],
    day_of_week: "월요일",
    start_time: "13:00",
    end_time: "14:00",
    type: "수업",
    is_regular: 1,
    group: true
  });
  const [groupStudentInput, setGroupStudentInput] = useState("");
  // 데이터 삭제 토글
  const [showDeletePanel, setShowDeletePanel] = useState(false);
  // 반복되는 모든 기본시간표 수정 체크박스
  const [addBulkEdit, setAddBulkEdit] = useState(false);
  const [groupBulkEdit, setGroupBulkEdit] = useState(false);

  // 삭제 핸들러들
  const handleDeleteTeacher = async (id) => {
    if (!teachers.find(t => t.id === id)) {
      alert('이미 삭제된 선생님입니다. 새로고침 후 다시 시도하세요.');
      return;
    }
    try {
      await axios.delete(`${API_URL}/teachers/${id}`);
      axios.get(`${API_URL}/teachers/`).then(res => setTeachers(res.data));
      onRefresh && onRefresh();
    } catch (e) {
      if (e.response?.status === 404) {
        alert('해당 선생님이 존재하지 않습니다. 목록을 새로고침합니다.');
        axios.get(`${API_URL}/teachers/`).then(res => setTeachers(res.data));
      } else {
        alert(e.response?.data?.detail || '선생님 삭제 중 오류 발생');
      }
    }
  };
  const handleDeleteRoom = async (id) => {
    if (!rooms.find(r => r.id === id)) {
      alert('이미 삭제된 공간입니다. 새로고침 후 다시 시도하세요.');
      return;
    }
    try {
      await axios.delete(`${API_URL}/rooms/${id}`);
      axios.get(`${API_URL}/rooms/`).then(res => setRooms(res.data));
      onRefresh && onRefresh();
    } catch (e) {
      if (e.response?.status === 404) {
        alert('해당 공간이 존재하지 않습니다. 목록을 새로고침합니다.');
        axios.get(`${API_URL}/rooms/`).then(res => setRooms(res.data));
      } else {
        alert(e.response?.data?.detail || '공간 삭제 중 오류 발생');
      }
    }
  };
  const handleDeleteStudent = async (id) => {
    if (!students.find(s => s.id === id)) {
      alert('이미 삭제된 학생입니다. 새로고침 후 다시 시도하세요.');
      return;
    }
    try {
      await axios.delete(`${API_URL}/students/${id}`);
      axios.get(`${API_URL}/students/`).then(res => setStudents(res.data));
      onRefresh && onRefresh();
    } catch (e) {
      if (e.response?.status === 404) {
        alert('해당 학생이 존재하지 않습니다. 목록을 새로고침합니다.');
        axios.get(`${API_URL}/students/`).then(res => setStudents(res.data));
      } else {
        alert(e.response?.data?.detail || '학생 삭제 중 오류 발생');
      }
    }
  };

  React.useEffect(() => {
    axios.get(`${API_URL}/teachers/`).then(res => setTeachers(res.data));
    axios.get(`${API_URL}/rooms/`).then(res => setRooms(res.data));
    axios.get(`${API_URL}/students/`).then(res => setStudents(res.data));
    axios.get(`${API_URL}/schedules/`).then(res => setSchedules(res.data)); // schedules 데이터 가져오기
  }, []);

  React.useEffect(() => {
    const errs = [];
    // 2. 각 선생님은 1타임당 1명의 수업,상담만 가능 (단체수업 제외)
    const teacherTimeMap = {};
    schedules.forEach(s => {
      if (s.type === '수업' && s.group) return; // 단체수업은 제외
      if (!s.teacher_id) return;
      const key = `${s.teacher_id}_${s.day_of_week}_${s.start_time}_${s.end_time}`;
      if (!teacherTimeMap[key]) teacherTimeMap[key] = [];
      teacherTimeMap[key].push(s);
    });
    Object.values(teacherTimeMap).forEach(arr => {
      if (arr.length > 1) {
        errs.push(`선생님(${arr[0].teacher?.name || arr[0].teacher_id})의 ${arr[0].day_of_week} ${arr[0].start_time}-${arr[0].end_time}에 중복 수업/상담이 있습니다.`);
      }
    });
    // 4. 각 공간은 1타임당 1개만 가능
    const roomTimeMap = {};
    schedules.forEach(s => {
      if (!s.room_id) return;
      const key = `${s.room_id}_${s.day_of_week}_${s.start_time}_${s.end_time}`;
      if (!roomTimeMap[key]) roomTimeMap[key] = [];
      roomTimeMap[key].push(s);
    });
    Object.values(roomTimeMap).forEach(arr => {
      if (arr.length > 1) {
        errs.push(`공간(${arr[0].room?.name || arr[0].room_id})의 ${arr[0].day_of_week} ${arr[0].start_time}-${arr[0].end_time}에 중복 수업/상담이 있습니다.`);
      }
    });
    // 5. 학생은 같은시간에 2개 이상 수업/상담 불가
    const studentTimeMap = {};
    schedules.forEach(s => {
      if (!s.student_id) return;
      const key = `${s.student_id}_${s.day_of_week}_${s.start_time}_${s.end_time}`;
      if (!studentTimeMap[key]) studentTimeMap[key] = [];
      studentTimeMap[key].push(s);
    });
    Object.values(studentTimeMap).forEach(arr => {
      if (arr.length > 1) {
        errs.push(`학생(${arr[0].student?.name || arr[0].student_id})의 ${arr[0].day_of_week} ${arr[0].start_time}-${arr[0].end_time}에 중복 수업/상담이 있습니다.`);
      }
    });
    setErrors(errs);
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    let result = schedules;
    if (selectedTeacherId) result = result.filter(s => s.teacher_id === Number(selectedTeacherId));
    if (selectedRoomId) result = result.filter(s => s.room_id === Number(selectedRoomId));
    return result;
  }, [schedules, selectedTeacherId, selectedRoomId]);

  const studentsWithClass = useMemo(() => {
    // 수업이 1개 이상 있는 학생만 추출
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

  const handleAddTeacher = async () => {
    await axios.post(`${API_URL}/teachers/`, { name: teacher, subject: teacherSubject });
    setTeacher(""); setTeacherSubject("");
    axios.get(`${API_URL}/teachers/`).then(res => setTeachers(res.data));
    onRefresh && onRefresh();
  };
  const handleAddRoom = async () => {
    await axios.post(`${API_URL}/rooms/`, { name: room });
    setRoom("");
    axios.get(`${API_URL}/rooms/`).then(res => setRooms(res.data));
    onRefresh && onRefresh();
  };
  const handleAddStudent = async () => {
    await axios.post(`${API_URL}/students/`, { name: student });
    setStudent("");
    axios.get(`${API_URL}/students/`).then(res => setStudents(res.data));
    onRefresh && onRefresh();
  };
  const handleAddSchedule = async () => {
    try {
      await axios.post(`${API_URL}/schedules/`, schedule);
      if (addBulkEdit && schedule.is_regular) {
        // 등록 직후 같은 조건 모두 bulk_update_regular
        await axios.post(`${API_URL}/schedules/bulk_update_regular/`, {
          filter: {
            teacher_id: schedule.teacher_id,
            student_id: schedule.student_id,
            room_id: schedule.room_id,
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            type: schedule.type
          },
          update: schedule
        });
      }
      setSchedule({ ...schedule, start_time: "13:00", end_time: "14:00" });
      axios.get(`${API_URL}/schedules/`).then(res => setSchedules(res.data));
      onRefresh && onRefresh();
      alert('스케줄 추가 완료!');
    } catch (e) {
      alert(e.response?.data?.detail || "일정 추가 중 오류 발생");
    }
  };

  const handleBulkSubmit = async () => {
    setBulkError("");
    const lines = bulkInput.split(/\r?\n/).filter(line => line.trim());
    let success = 0, fail = 0, failLines = [];
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const parts = line.split(',').map(s => s.trim());
      if (parts.length < 8) { fail++; failLines.push(`${idx+1}행: 형식 오류`); continue; }
      const [teacherName, teacherSubject, roomName, studentName, day, start, end, type] = parts;
      try {
        let teacherId;
        let tRes = teachers.find(t => t.name === teacherName);
        if (!tRes) {
          const res = await axios.post(`${API_URL}/teachers/`, { name: teacherName, subject: teacherSubject });
          teacherId = res.data.id;
          teachers.push(res.data);
        } else { teacherId = tRes.id; }
        let roomId;
        let rRes = rooms.find(r => r.name === roomName);
        if (!rRes) {
          const res = await axios.post(`${API_URL}/rooms/`, { name: roomName });
          roomId = res.data.id;
          rooms.push(res.data);
        } else { roomId = rRes.id; }
        let studentId;
        let sRes = students.find(s => s.name === studentName);
        if (!sRes) {
          const res = await axios.post(`${API_URL}/students/`, { name: studentName });
          studentId = res.data.id;
          students.push(res.data);
        } else { studentId = sRes.id; }
        // 기본시간표 체크시 반복스케줄 자동 일괄수정: 등록 직후 bulk_update_regular 호출
        let scheduleRes = await axios.post(`${API_URL}/schedules/`, {
          teacher_id: teacherId,
          room_id: roomId,
          student_id: studentId,
          day_of_week: day,
          start_time: start,
          end_time: end,
          type,
          is_regular: bulkIsRegular ? 1 : 0
        });
        if (bulkIsRegular) {
          // 등록 직후 같은 조건 모두 bulk_update_regular
          await axios.put(`${API_URL}/schedules/bulk_update_regular/`, {
            filter: {
              teacher_id: teacherId,
              student_id: studentId,
              room_id: roomId,
              day_of_week: day,
              start_time: start,
              end_time: end,
              type
            },
            update: {
              day_of_week: day,
              start_time: start,
              end_time: end,
              room_id: roomId,
              teacher_id: teacherId,
              student_id: studentId,
              type,
              is_regular: 1
            }
          });
        }
        success++;
      } catch (e) {
        fail++; failLines.push(`${idx+1}행: ${e.response?.data?.detail || '등록실패'}`);
      }
    }
    setBulkResult(`${success}개 성공, ${fail}개 실패` + (failLines.length ? `\n${failLines.join('\n')}` : ""));
    axios.get(`${API_URL}/schedules/`).then(res => setSchedules(res.data));
    onRefresh && onRefresh();
  };

  // 단체수업 추가 후 스케줄 강제 새로고침 (학생별 스케줄 반영)
  const refreshSchedules = async () => {
    await axios.get(`${API_URL}/schedules/`).then(res => setSchedules(res.data));
    onRefresh && onRefresh();
  };

  const handleAddGroupSchedule = async () => {
    // 입력된 학생명 파싱 및 등록
    const names = groupStudentInput.split(',').map(s=>s.trim()).filter(Boolean);
    if (!groupSchedule.teacher_id || !groupSchedule.room_id || names.length === 0) {
      alert("모든 항목을 입력해주세요."); return;
    }
    let ids = [];
    for (let name of names) {
      let sRes = students.find(s => s.name === name);
      if (!sRes) {
        const res = await axios.post(`${API_URL}/students/`, { name });
        ids.push(res.data.id);
        students.push(res.data);
      } else { ids.push(sRes.id); }
    }
    setGroupSchedule(s=>({...s, student_ids: ids}));
    setTimeout(async ()=>{
      if (!groupSchedule.teacher_id || !groupSchedule.room_id || ids.length === 0) {
        alert("모든 항목을 입력해주세요."); return;
      }
      for (let sid of ids) {
        await axios.post(`${API_URL}/schedules/`, {
          teacher_id: groupSchedule.teacher_id,
          room_id: groupSchedule.room_id,
          student_id: sid,
          day_of_week: groupSchedule.day_of_week,
          start_time: groupSchedule.start_time,
          end_time: groupSchedule.end_time,
          type: groupSchedule.type,
          is_regular: groupSchedule.is_regular,
          group: true
        });
      }
      if (groupBulkEdit && groupSchedule.is_regular) {
        // 등록 직후 같은 조건 모두 bulk_update_regular
        await axios.post(`${API_URL}/schedules/bulk_update_regular/`, {
          filter: {
            teacher_id: groupSchedule.teacher_id,
            room_id: groupSchedule.room_id,
            day_of_week: groupSchedule.day_of_week,
            start_time: groupSchedule.start_time,
            end_time: groupSchedule.end_time,
            type: groupSchedule.type
          },
          update: {
            day_of_week: groupSchedule.day_of_week,
            start_time: groupSchedule.start_time,
            end_time: groupSchedule.end_time,
            room_id: groupSchedule.room_id,
            teacher_id: groupSchedule.teacher_id,
            type: groupSchedule.type,
            is_regular: 1
          }
        });
      }
      setGroupSchedule({ ...groupSchedule, student_ids: [] });
      await refreshSchedules();
      alert('단체수업 추가 완료!');
    }, 100); // 학생ID 반영 후 등록
  };

  return (
    <div style={{ background: '#f0f4fa', padding: 16, borderRadius: 8, marginBottom: 32 }}>
      <div style={{marginTop:24, background:'#ffeaea', border:'1px solid #e57373', borderRadius:8, padding:12}}>
        <b>오류 탐지기</b>
        {errors.length === 0 ? <div style={{color:'#388e3c'}}>오류 없음</div> : (
          <ul style={{color:'#d32f2f', margin:0, paddingLeft:20}}>
            {errors.map((e,i) => <li key={i}>{e}</li>)}
          </ul>
        )}
      </div>
      <h2>관리자 패널 (데이터 직접 추가)</h2>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <b>선생님 추가</b><br/>
          <input placeholder="이름" value={teacher} onChange={e => setTeacher(e.target.value)} />
          <input placeholder="과목" value={teacherSubject} onChange={e => setTeacherSubject(e.target.value)} />
          <button onClick={handleAddTeacher}>추가</button>
        </div>
        <div>
          <b>공간 추가</b><br/>
          <input placeholder="공간명" value={room} onChange={e => setRoom(e.target.value)} />
          <button onClick={handleAddRoom}>추가</button>
        </div>
        <div>
          <b>학생 추가</b><br/>
          <input placeholder="학생명" value={student} onChange={e => setStudent(e.target.value)} />
          <button onClick={handleAddStudent}>추가</button>
        </div>
        <div>
          <b>스케줄 추가</b><br/>
          <select value={schedule.teacher_id} onChange={e => setSchedule(s => ({ ...s, teacher_id: Number(e.target.value) }))}>
            <option value="">선생님</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={schedule.room_id} onChange={e => setSchedule(s => ({ ...s, room_id: Number(e.target.value) }))}>
            <option value="">공간</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select value={schedule.student_id} onChange={e => setSchedule(s => ({ ...s, student_id: Number(e.target.value) }))}>
            <option value="">학생</option>
            {students.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
          </select><br/>
          <select value={schedule.day_of_week} onChange={e => setSchedule(s => ({ ...s, day_of_week: e.target.value }))}>
            {["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input type="time" value={schedule.start_time} onChange={e => setSchedule(s => ({ ...s, start_time: e.target.value }))} />
          <input type="time" value={schedule.end_time} onChange={e => setSchedule(s => ({ ...s, end_time: e.target.value }))} />
          <select value={schedule.type} onChange={e => setSchedule(s => ({ ...s, type: e.target.value }))}>
            <option value="수업">수업</option>
            <option value="상담">상담</option>
          </select>
          <label style={{marginLeft:8}}>
            <input type="checkbox" checked={schedule.is_regular} onChange={e => setSchedule(s => ({ ...s, is_regular: e.target.checked ? 1 : 0 }))} />기본시간표로 등록
          </label>
          <label style={{marginLeft:8}}>
            <input type="checkbox" checked={addBulkEdit} onChange={e => setAddBulkEdit(e.target.checked)} disabled={!schedule.is_regular} />반복되는 모든 기본시간표 수정
          </label>
          <button onClick={handleAddSchedule}>추가</button>
        </div>
      </div>
      <div style={{marginTop:24}}>
        <button onClick={()=>setShowDeletePanel(v=>!v)} style={{background:'#8e24aa',color:'white',borderRadius:6,padding:'4px 12px'}}>데이터 삭제 열기/닫기</button>
        {showDeletePanel && (
          <div style={{marginTop:8, background:'#f3e5f5', border:'1px solid #8e24aa', borderRadius:8, padding:12}}>
            <b>데이터 삭제</b><br/>
            <div>
              <b>선생님</b>:
              {teachers.map(t => <span key={t.id} style={{marginRight:8}}>{t.name} <button onClick={()=>handleDeleteTeacher(t.id)} style={{color:'#b71c1c'}}>삭제</button></span>)}
            </div>
            <div>
              <b>공간</b>:
              {rooms.map(r => <span key={r.id} style={{marginRight:8}}>{r.name} <button onClick={()=>handleDeleteRoom(r.id)} style={{color:'#b71c1c'}}>삭제</button></span>)}
            </div>
            <div>
              <b>학생</b>:
              {students.map(s => <span key={s.id} style={{marginRight:8}}>{s.name} <button onClick={()=>handleDeleteStudent(s.id)} style={{color:'#b71c1c'}}>삭제</button></span>)}
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 24 }}>
        <h3>여러 줄 붙여넣기 일괄등록</h3>
        <div style={{ marginBottom: 8 }}>
          <label><input type="checkbox" checked={bulkIsRegular} onChange={e => setBulkIsRegular(e.target.checked)} /> 기본시간표로 등록</label>
        </div>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
          예시: <br />
          김철수,수학,컨설팅룸1,홍길동,월요일,13:00,14:00,수업<br />
          이영희,영어,CS룸,김민수,수요일,15:00,16:00,상담<br />
          (이름,과목,공간,학생,요일,시작,종료,유형)
        </div>
        <textarea value={bulkInput} onChange={e => setBulkInput(e.target.value)} rows={6} style={{ width: '100%' }} placeholder="여러 줄을 붙여넣으세요" />
        <button onClick={handleBulkSubmit}>일괄등록</button>
        <div>{bulkResult}</div>
        {bulkError && <pre style={{ color: 'red', fontSize: 13, marginTop: 8 }}>{bulkError}</pre>}
      </div>
      <div style={{ marginTop: 32 }}>
        <h3>기본시간표 목록</h3>
        <div style={{marginBottom:8}}>
          <label>선생님별 보기: </label>
          <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}>
            <option value="">전체</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <label style={{marginLeft: 16}}>공간별 보기: </label>
          <select value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)}>
            <option value="">전체</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <Timetable
          schedules={schedules}
          teacherId={selectedTeacherId}
          roomId={selectedRoomId}
          onRefresh={onRefresh}
        />
      </div>
      <div style={{ marginTop: 32 }}>
        <h3>학생별 시간표</h3>
        <input placeholder="학생 검색" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} style={{marginBottom:8}} />
        <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
          <option value="">학생 선택</option>
          {filteredStudents.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
        </select>
        {selectedStudentId && (
          <Timetable schedules={studentSchedules} onRefresh={onRefresh} />
        )}
      </div>
      <div style={{marginTop:24, background:'#e3f2fd', border:'1px solid #1976d2', borderRadius:8, padding:12}}>
        <b>단체수업 추가</b><br/>
        <select value={groupSchedule.teacher_id} onChange={e => setGroupSchedule(s=>({...s,teacher_id:e.target.value}))}>
          <option value="">선생님</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={groupSchedule.room_id} onChange={e => setGroupSchedule(s=>({...s,room_id:e.target.value}))}>
          <option value="">공간</option>
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <input type="text" placeholder="학생명1, 학생명2, ..." value={groupStudentInput} onChange={e => setGroupStudentInput(e.target.value)} style={{width:180}} />
        <select value={groupSchedule.day_of_week} onChange={e => setGroupSchedule(s=>({...s,day_of_week:e.target.value}))}>
          {["월요일","화요일","수요일","목요일","금요일","토요일","일요일"].map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <input type="time" value={groupSchedule.start_time} onChange={e => setGroupSchedule(s=>({...s,start_time:e.target.value}))} />
        <input type="time" value={groupSchedule.end_time} onChange={e => setGroupSchedule(s=>({...s,end_time:e.target.value}))} />
        <label style={{marginLeft:8}}>
          <input type="checkbox" checked={groupSchedule.is_regular} onChange={e => setGroupSchedule(s=>({...s,is_regular:e.target.checked?1:0}))} />기본시간표로 등록
        </label>
        <label style={{marginLeft:8}}>
          <input type="checkbox" checked={groupBulkEdit} onChange={e=>setGroupBulkEdit(e.target.checked)} disabled={!groupSchedule.is_regular} />반복되는 모든 기본시간표 수정
        </label>
        <button onClick={handleAddGroupSchedule}>단체수업 추가</button>
        <div style={{fontSize:12, color:'#1976d2'}}>학생명을 쉼표로 구분해 입력하세요</div>
      </div>
    </div>
  );
}

export default AdminPanel;

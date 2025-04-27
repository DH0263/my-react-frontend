import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import ScheduleModal from './ScheduleModal';
import ScheduleAddModal from './ScheduleAddModal';
import axios from 'axios';

const dayMap = {
  '일요일': 0,
  '월요일': 1,
  '화요일': 2,
  '수요일': 3,
  '목요일': 4,
  '금요일': 5,
  '토요일': 6,
};
const days = ['월요일','화요일','수요일','목요일','금요일','토요일','일요일'];

function parseTime(timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  return { hour, minute };
}

function makeEvents(schedules, showType, teacherId) {
  // showType: 'regular' | 'special' | 'all'
  // teacherId: 선생님별 시간표일 때만 사용
  const now = new Date();
  const events = [];
  const base = moment(now).startOf('week').subtract(4, 'weeks');
  const end = moment(now).endOf('week').add(4, 'weeks');
  schedules.filter(item => {
    if (teacherId && item.teacher_id !== Number(teacherId)) return false;
    if (showType === 'regular') return item.is_regular === 1;
    if (showType === 'special') return item.is_regular === 0;
    return true;
  }).forEach(item => {
    if (item.is_regular === 1) {
      // 기본시간표는 +-4주 반복 생성
      let week = base.clone();
      while (week.isBefore(end)) {
        const dayNum = dayMap[item.day_of_week];
        const start = week.clone().add(dayNum, 'days');
        const { hour: sh, minute: sm } = parseTime(item.start_time);
        start.set({ hour: sh, minute: sm, second: 0, millisecond: 0 });
        const endDt = start.clone();
        const { hour: eh, minute: em } = parseTime(item.end_time);
        endDt.set({ hour: eh, minute: em, second: 0, millisecond: 0 });
        events.push({
          title: `${item.type}` + (item.teacher && item.teacher.name ? ` (${item.teacher.name}${item.teacher.subject ? '·' + item.teacher.subject : ''})` : '') + (item.room && item.room.name ? ` @${item.room.name}` : '') + (item.student && item.student.name ? ` - ${item.student.name}` : ''),
          start: start.toDate(),
          end: endDt.toDate(),
          resource: { ...item, is_virtual: true },
          allDay: false,
        });
        week.add(1, 'week');
      }
    } else {
      // 특별일정(변경/보강)은 실제 날짜 기준
      const start = moment(item.date + ' ' + item.start_time, 'YYYY-MM-DD HH:mm');
      const endDt = moment(item.date + ' ' + item.end_time, 'YYYY-MM-DD HH:mm');
      events.push({
        title: `${item.type}` + (item.teacher && item.teacher.name ? ` (${item.teacher.name}${item.teacher.subject ? '·' + item.teacher.subject : ''})` : '') + (item.room && item.room.name ? ` @${item.room.name}` : '') + (item.student && item.student.name ? ` - ${item.student.name}` : ''),
        start: start.toDate(),
        end: endDt.toDate(),
        resource: item,
        allDay: false,
      });
    }
  });
  return events;
}

function Timetable({ schedules, onRefresh, teacherId, roomId }) {
  // teacherId: 선생님별 시간표에서만 전달됨
  // roomId: 공간별 시간표에서만 전달됨
  const [showType, setShowType] = React.useState('all');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState(null);

  // 필터링: teacherId, roomId 둘 다 있으면 교집합만
  const filteredSchedules = React.useMemo(() => {
    let result = schedules;
    if (teacherId) result = result.filter(s => s.teacher_id === Number(teacherId));
    if (roomId) result = result.filter(s => s.room_id === Number(roomId));
    return result;
  }, [schedules, teacherId, roomId]);

  const events = React.useMemo(() => makeEvents(filteredSchedules, showType, teacherId), [filteredSchedules, showType, teacherId]);

  function handleSelectEvent(event) {
    setSelectedEvent(event);
    setModalOpen(true);
  }

  async function handleAdd(form) {
    // 필수값 체크
    if (!form.teacher_id || !form.room_id || !form.student_id || !form.day_of_week || !form.start_time || !form.end_time || !form.type) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    // 보강(초록) 및 일반/변경(빨강) 처리
    if (form.change_type === '보강') {
      // 보강은 특별일정, is_regular=0, change_type='보강', date 필수
      const now = new Date();
      const dayIdx = days.indexOf(form.day_of_week);
      if (dayIdx < 0) return alert('요일을 정확히 입력하세요');
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      const date = new Date(monday);
      date.setDate(monday.getDate() + dayIdx);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth()+1).padStart(2,'0');
      const dd = String(date.getDate()).padStart(2,'0');
      await axios.post('https://my-fastapi-backend-0yks.onrender.com/schedules/', {
        ...form,
        is_regular: 0,
        change_type: '보강',
        date: `${yyyy}-${mm}-${dd}`
      });
    } else if (form.change_type === '변경') {
      // 변경도 특별일정, is_regular=0, change_type='변경', date 필수
      const now = new Date();
      const dayIdx = days.indexOf(form.day_of_week);
      if (dayIdx < 0) return alert('요일을 정확히 입력하세요');
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      const date = new Date(monday);
      date.setDate(monday.getDate() + dayIdx);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth()+1).padStart(2,'0');
      const dd = String(date.getDate()).padStart(2,'0');
      await axios.post('https://my-fastapi-backend-0yks.onrender.com/schedules/', {
        ...form,
        is_regular: 0,
        change_type: '변경',
        date: `${yyyy}-${mm}-${dd}`
      });
    } else {
      await axios.post('https://my-fastapi-backend-0yks.onrender.com/schedules/', form);
    }
    setAddModalOpen(false);
    if (onRefresh) onRefresh();
  }

  async function handleUpdate(form, bulkEdit, isCancel) {
    if (!selectedEvent) return;
    const sch = selectedEvent.resource;
    if (form.change_type === '취소' || isCancel) {
      // 특별일정(취소)로 추가
      const date = form.date || sch.date || new Date().toISOString().slice(0,10);
      await axios.post('https://my-fastapi-backend-0yks.onrender.com/schedules/', {
        ...sch,
        change_type: '취소',
        is_regular: 0,
        date,
      });
    } else if (form.change_type === '변경') {
      // 해당 주 특별일정(변경)로 추가
      const date = form.date || sch.date || new Date().toISOString().slice(0,10);
      await axios.post('https://my-fastapi-backend-0yks.onrender.com/schedules/', {
        ...form,
        is_regular: 0,
        change_type: '변경',
        date,
      });
    } else {
      await axios.patch(`https://my-fastapi-backend-0yks.onrender.com/schedules/${sch.id}`, form);
    }
    setModalOpen(false);
    setSelectedEvent(null);
    if (onRefresh) onRefresh();
  }

  async function handleDelete() {
    if (!selectedEvent) return;
    await axios.delete(`https://my-fastapi-backend-0yks.onrender.com/schedules/${selectedEvent.resource.id}`);
    setModalOpen(false);
    setSelectedEvent(null);
    if (onRefresh) onRefresh();
  }

  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <button onClick={()=>setShowType('all')}>전체</button>
        <button onClick={()=>setShowType('regular')}>기본시간표</button>
        <button onClick={()=>setShowType('special')}>특별일정</button>
        <button style={{ marginLeft: 16 }} onClick={()=>setAddModalOpen(true)}>일정 추가</button>
      </div>
      <Calendar
        localizer={momentLocalizer(moment)}
        events={events}
        defaultView="week"
        views={["week"]}
        step={30}
        timeslots={1}
        style={{ height: 900 }}
        min={new Date(2000,1,1,7,0,0)}
        max={new Date(2000,1,1,23,0,0)}
        eventPropGetter={event => {
          const r = event.resource;
          if (r.change_type === '취소') return { style: { backgroundColor: '#e74a3b', color: 'white', borderRadius: 6 } };
          if (r.change_type === '보강') return { style: { backgroundColor: '#27ae60', color: 'white', borderRadius: 6 } };
          if (r.change_type === '변경') return { style: { backgroundColor: '#f39c12', color: 'white', borderRadius: 6 } };
          if (r.is_regular === 1) {
            if (r.type === '상담') return { style: { backgroundColor: '#fff9c4', color: 'black', borderRadius: 6 } };
            return { style: { backgroundColor: '#4e73df', color: 'white', borderRadius: 6 } };
          }
          return { style: { backgroundColor: '#e0e0e0', color: 'black', borderRadius: 6 } };
        }}
        messages={{
          week: '주간',
          day: '일간',
          today: '오늘',
          previous: '이전',
          next: '다음',
        }}
        culture="ko"
        onSelectEvent={handleSelectEvent}
      />
      <ScheduleModal
        open={modalOpen}
        event={selectedEvent}
        onClose={() => setModalOpen(false)}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        teacherMode={!!teacherId}
      />
      <ScheduleAddModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAdd}
        teacherMode={!!teacherId}
      />
    </>
  );
}

export default Timetable;

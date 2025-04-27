import React from "react";

function ScheduleAddModal({ open, onClose, onAdd }) {
  const [form, setForm] = React.useState({
    teacher_id: '',
    room_id: '',
    student_id: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    type: '수업',
    is_regular: 1,
    change_type: undefined,
  });
  
  // 30분 단위 시간 드롭다운 생성
  const times = [];
  for (let h = 7; h <= 23; h++) {
    times.push(`${String(h).padStart(2,'0')}:00`);
    times.push(`${String(h).padStart(2,'0')}:30`);
  }

  if (!open) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.2)", zIndex: 1000 }}>
      <div style={{ background: "white", padding: 24, borderRadius: 8, width: 350, margin: "100px auto", position: "relative" }}>
        <h3>일정 추가</h3>
        <div style={{ margin: "8px 0" }}>
          <label>요일: <input value={form.day_of_week} onChange={e => setForm(f=>({...f,day_of_week:e.target.value}))} /></label>
        </div>
        <div style={{ margin: "8px 0" }}>
          <label>시작: <select value={form.start_time} onChange={e => setForm(f=>({...f,start_time:e.target.value}))}>{times.map(t=><option key={t} value={t}>{t}</option>)}</select></label>
        </div>
        <div style={{ margin: "8px 0" }}>
          <label>종료: <select value={form.end_time} onChange={e => setForm(f=>({...f,end_time:e.target.value}))}>{times.map(t=><option key={t} value={t}>{t}</option>)}</select></label>
        </div>
        <div style={{ margin: "8px 0" }}>
          <label>유형: <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}><option value="수업">수업</option><option value="상담">상담</option></select></label>
        </div>
        <div style={{ margin: "8px 0" }}>
          <label>기본시간표 <input type="checkbox" checked={form.is_regular === 1} onChange={e => setForm(f=>({...f,is_regular:e.target.checked?1:0}))} /></label>
        </div>
        <div style={{ margin: "8px 0" }}>
          <label>변경/보강: <select value={form.change_type||''} onChange={e => setForm(f=>({...f,change_type:e.target.value||undefined}))}>
            <option value="">일반</option>
            <option value="변경">변경</option>
            <option value="보강">보강</option>
          </select></label>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <button onClick={()=>onAdd(form)}>추가</button>
          <button onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}

export default ScheduleAddModal;

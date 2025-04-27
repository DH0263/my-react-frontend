import React from "react";

function ScheduleModal({ open, onClose, onDelete, onUpdate, event }) {
  const [form, setForm] = React.useState({
    start_time: event?.resource?.start_time || "",
    end_time: event?.resource?.end_time || "",
    day_of_week: event?.resource?.day_of_week || "",
    type: event?.resource?.type || "수업",
  });

  const [bulkEdit, setBulkEdit] = React.useState(false);

  // 30분 단위 시간 드롭다운 생성
  const times = [];
  for (let h = 7; h <= 23; h++) {
    times.push(`${String(h).padStart(2,'0')}:00`);
    times.push(`${String(h).padStart(2,'0')}:30`);
  }

  React.useEffect(() => {
    if (event) {
      setForm({
        start_time: event.resource.start_time,
        end_time: event.resource.end_time,
        day_of_week: event.resource.day_of_week,
        type: event.resource.type,
      });
    }
  }, [event]);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.2)", zIndex: 1000 }}>
      <div style={{ background: "white", padding: 24, borderRadius: 8, width: 320, margin: "100px auto", position: "relative" }}>
        <h3>일정 수정/삭제</h3>
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
          <label>
            <input type="checkbox" checked={bulkEdit} onChange={e => setBulkEdit(e.target.checked)} disabled={!(event?.resource?.is_regular === 1)} />
            반복되는 모든 기본시간표 수정
          </label>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <button onClick={() => onUpdate(form, bulkEdit)}>수정</button>
          <button onClick={onDelete} style={{ color: "red" }}>삭제</button>
          <button onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}

export default ScheduleModal;

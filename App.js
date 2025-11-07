// App.js (왕초보 시작버전) — 전역 React 사용
const { useEffect, useMemo, useState } = React;

const STORAGE_KEY = "athly-beginner-v1";
const BACKEND = (window.ATHLY_CONFIG && window.ATHLY_CONFIG.BACKEND_BASE) || "";

function usePersistentState(defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch { return defaultValue; }
  });
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(state)), [state]);
  return [state, setState];
}
const todayISO = () => new Date().toISOString().slice(0, 10);

function Section({ title, subtitle, children, right }) {
  return React.createElement("div", { className: "bg-white rounded-2xl shadow p-5 mb-6" },
    React.createElement("div", { className: "flex items-start justify-between mb-3" },
      React.createElement("div", null,
        React.createElement("h2", { className: "text-xl font-semibold" }, title),
        subtitle && React.createElement("p", { className: "text-sm text-gray-500 mt-1" }, subtitle)
      ),
      right
    ),
    children
  );
}
function Input({ label, ...props }) {
  return React.createElement("label", { className: "block mb-3" },
    React.createElement("span", { className: "block text-sm text-gray-600 mb-1" }, label),
    React.createElement("input", { className: "w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10", ...props })
  );
}
function Textarea({ label, ...props }) {
  return React.createElement("label", { className: "block mb-3" },
    React.createElement("span", { className: "block text-sm text-gray-600 mb-1" }, label),
    React.createElement("textarea", { className: "w-full border rounded-xl px-3 py-2 min-h-[88px] focus:outline-none focus:ring-2 focus:ring-black/10", ...props })
  );
}
function Select({ label, options, ...props }) {
  return React.createElement("label", { className: "block mb-3" },
    React.createElement("span", { className: "block text-sm text-gray-600 mb-1" }, label),
    React.createElement("select", { className: "w-full border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/10", ...props },
      options.map(o => React.createElement("option", { key: o.value, value: o.value }, o.label))
    )
  );
}
function PillButton({ children, ...props }) {
  return React.createElement("button", { className: "px-3 py-2 rounded-full bg-black text-white text-sm hover:opacity-90 active:opacity-80 disabled:opacity-50", ...props }, children);
}
function Row({ children }) { return React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3" }, children); }

function App() {
  const [db, setDb] = usePersistentState({ linkedPlayer: null, bullpen: [], workouts: [], games: [] });
  const [tab, setTab] = useState("home");

  return React.createElement("div", { className: "min-h-screen bg-gray-50 text-gray-900" },
    React.createElement("header", { className: "max-w-3xl mx-auto px-4 pt-8 pb-4" },
      React.createElement("div", { className: "flex items-center justify-between" },
        React.createElement("div", null,
          React.createElement("h1", { className: "text-2xl font-bold" }, "ATHLY β"),
          React.createElement("p", { className: "text-sm text-gray-500" }, "왕초보 시작버전 · Asia/Seoul"),
          db.linkedPlayer
            ? React.createElement("p", { className: "text-sm mt-1" }, "연결된 선수: ", React.createElement("b", null, db.linkedPlayer.name), " (", db.linkedPlayer.team, ") · ID: ", db.linkedPlayer.id)
            : React.createElement("p", { className: "text-sm mt-1 text-red-600" }, "아직 KBO 선수 연결이 필요해요.")
        ),
        React.createElement("div", { className: "flex gap-2" },
          React.createElement(PillButton, { onClick: () => setTab("kbo") }, "선수 연결")
        )
      ),
      React.createElement("nav", { className: "mt-6 flex gap-2 flex-wrap" },
        [
          { k: "home", l: "홈" },
          { k: "game", l: "경기기록" },
          { k: "bullpen", l: "불펜" },
          { k: "workout", l: "운동" },
          { k: "report", l: "리포트" },
          { k: "kbo", l: "KBO연동" },
        ].map(t =>
          React.createElement("button", {
            key: t.k, onClick: () => setTab(t.k),
            className: `px-4 py-2 rounded-full text-sm ${tab === t.k ? "bg-black text-white" : "bg-white text-gray-700 border"}`
          }, t.l)
        )
      )
    ),
    React.createElement("main", { className: "max-w-3xl mx-auto px-4 pb-16" },
      tab === "home" && React.createElement(Home, { db }),
      tab === "game" && React.createElement(GameLog, { db, setDb }),
      tab === "bullpen" && React.createElement(Bullpen, { db, setDb }),
      tab === "workout" && React.createElement(Workout, { db, setDb }),
      tab === "report" && React.createElement(Report, { db }),
      tab === "kbo" && React.createElement(KboLink, { db, setDb })
    )
  );
}

// --- pages
function Home({ db }) {
  return React.createElement(React.Fragment, null,
    React.createElement(Section, { title: "시작하기", subtitle: "선수 연결 후 자동 동기화를 쓸 수 있어요." },
      db.linkedPlayer
        ? React.createElement("div", { className: "text-sm" },
            React.createElement("p", null, "연결된 선수의 경기/박스스코어를 동기화하려면 아래 버튼을 눌러보세요."),
            React.createElement("div", { className: "mt-2 flex gap-2" },
              React.createElement(SyncButtons, { db })
            )
          )
        : React.createElement("p", { className: "text-sm text-gray-600" }, "상단의 ", React.createElement("b", null, "선수 연결"), "을 먼저 완료해주세요.")
    )
  );
}

function SyncButtons({ db }) {
  const [msg, setMsg] = useState("");
  const sync = async (scope) => {
    if (!db.linkedPlayer) return;
    setMsg("동기화 중...");
    try {
      if (!BACKEND) {
        await new Promise(r=>setTimeout(r,500));
        setMsg("데모: 오늘 경기 1건, 이벤트 5개를 불러온 것으로 처리됨.");
        return;
      }
      const url = `${BACKEND}/kbo/sync?playerId=${encodeURIComponent(db.linkedPlayer.id)}&scope=${scope}`;
      const res = await fetch(url);
      const data = await res.json();
      setMsg(`동기화 완료: ${data.message || "ok"}`);
    } catch (e) {
      setMsg("동기화 실패: " + e.message);
    }
  };
  return React.createElement("div", { className: "text-sm" },
    React.createElement("div", { className: "flex gap-2" },
      React.createElement(PillButton, { onClick: () => sync("today") }, "오늘 경기 동기화"),
      React.createElement(PillButton, { onClick: () => sync("recent") }, "최근 경기 동기화")
    ),
    msg && React.createElement("p", { className: "text-gray-600 mt-2" }, msg)
  );
}

function KboLink({ db, setDb }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [err, setErr] = useState("");

  const search = async () => {
    setLoading(true); setErr(""); setResults([]);
    try {
      if (!BACKEND) {
        const sample = [
          { id: "70001", name: "김성민", team: "키움 히어로즈", position: "투수" },
          { id: "70002", name: "이정후", team: "KBO 샘플", position: "외야수" },
          { id: "70003", name: "안우진", team: "키움 히어로즈", position: "투수" },
        ].filter(p => p.name.includes(q));
        await new Promise(r=>setTimeout(r,400));
        setResults(sample);
      } else {
        const res = await fetch(`${BACKEND}/kbo/search?name=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("검색 실패");
        const data = await res.json();
        setResults(data.players || []);
      }
    } catch(e) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  const link = (p) => setDb({ ...db, linkedPlayer: p });

  return React.createElement(Section, { title: "KBO 선수 연결", subtitle: "선수 이름으로 검색하고 선택하면 연결됩니다." },
    React.createElement("div", { className: "flex gap-2" },
      React.createElement("input", { className: "flex-1 border rounded-xl px-3 py-2", placeholder: "예: 김성민", value: q, onChange: e => setQ(e.target.value) }),
      React.createElement(PillButton, { onClick: search, disabled: !q || loading }, loading ? "검색 중..." : "검색")
    ),
    err && React.createElement("p", { className: "text-sm text-red-600 mt-2" }, err),
    React.createElement("div", { className: "mt-4 space-y-2" },
      results.map((p,i) => React.createElement("div", { key: i, className: "bg-gray-100 rounded-xl p-3 flex items-center justify-between" },
        React.createElement("div", { className: "text-sm" },
          React.createElement("div", { className: "font-medium" }, p.name),
          React.createElement("div", { className: "text-gray-600" }, `${p.team} · ${p.position} · ID ${p.id}`)
        ),
        React.createElement(PillButton, { onClick: () => link(p) }, "선택")
      )),
      !loading && results.length === 0 && React.createElement("p", { className: "text-sm text-gray-500" }, "검색 결과가 여기에 표시됩니다.")
    ),
    React.createElement("hr", { className: "my-6" }),
    React.createElement("p", { className: "text-xs text-gray-500" },
      "지금은 데모 모드입니다. 나중에 백엔드 주소를 넣으면 실제 연동으로 바뀝니다."
    )
  );
}

function GameLog({ db, setDb }) {
  const [form, setForm] = useState({ date: todayISO(), opponent: "", homeAway: "H", usedInningFrom: "", usedInningTo: "", pitches: "", notes: "" });
  const add = () => { const payload = { ...form, pitches: Number(form.pitches || 0) }; setDb({ ...db, games: [...db.games, payload] }); setForm({ ...form, opponent: "", usedInningFrom: "", usedInningTo: "", pitches: "", notes: "" }); };
  return React.createElement(React.Fragment, null,
    React.createElement(Section, { title: "경기 사용 기록", subtitle: "당일 어떻게 쓰였는지 간단 요약" },
      React.createElement(Row, null,
        React.createElement(Input, { label: "날짜", type: "date", value: form.date, onChange: e => setForm({ ...form, date: e.target.value }) }),
        React.createElement(Input, { label: "상대팀", placeholder: "예: LG", value: form.opponent, onChange: e => setForm({ ...form, opponent: e.target.value }) }),
        React.createElement(Select, { label: "홈/원정", value: form.homeAway, onChange: e => setForm({ ...form, homeAway: e.target.value }), options: [{ value: "H", label: "홈" }, { value: "A", label: "원정" }] }),
        React.createElement(Input, { label: "등판 이닝(시작)", placeholder: "예: 7", value: form.usedInningFrom, onChange: e => setForm({ ...form, usedInningFrom: e.target.value }) }),
        React.createElement(Input, { label: "등판 이닝(끝)", placeholder: "예: 7", value: form.usedInningTo, onChange: e => setForm({ ...form, usedInningTo: e.target.value }) }),
        React.createElement(Input, { label: "투구수(구)", type: "number", placeholder: "예: 22", value: form.pitches, onChange: e => setForm({ ...form, pitches: e.target.value }) }),
        React.createElement(Textarea, { label: "메모(대타/대타자/상황 등)", placeholder: "주자상황, 타자, 결과 요약", value: form.notes, onChange: e => setForm({ ...form, notes: e.target.value }) })
      ),
      React.createElement("div", { className: "flex justify-end" }, React.createElement(PillButton, { onClick: add }, "저장"))
    ),
    React.createElement(Section, { title: "기록 목록" },
      React.createElement("div", { className: "space-y-3" },
        db.games.slice().sort((a,b)=>a.date<b.date?1:-1).map((g,i)=>
          React.createElement("div", { key: i, className: "bg-white border rounded-xl p-4" },
            React.createElement("div", { className: "flex items-center justify-between" },
              React.createElement("div", { className: "font-medium" }, `${g.date} · ${g.homeAway==="H"?"홈":"원정"} vs ${g.opponent}`),
              React.createElement("div", { className: "text-sm text-gray-500" }, `${g.pitches}구`)
            ),
            g.notes && React.createElement("p", { className: "text-sm text-gray-700 mt-2" }, g.notes)
          )
        )
      )
    )
  );
}

function Bullpen({ db, setDb }) {
  const [form, setForm] = useState({ date: todayISO(), context: "경기 전", startTime: "", totalPitches: "", intensityRPE: "5", mix: "직구/슬라이더/체인지업", notes: "" });
  const add = () => { setDb({ ...db, bullpen: [...db.bullpen, { ...form, totalPitches: Number(form.totalPitches || 0), intensityRPE: Number(form.intensityRPE || 0) }] }); setForm({ ...form, startTime: "", totalPitches: "", notes: "" }); };
  return React.createElement(React.Fragment, null,
    React.createElement(Section, { title: "불펜 기록", subtitle: "팔 풀었는지/언제/강도/구종 비율" },
      React.createElement(Row, null,
        React.createElement(Input, { label: "날짜", type: "date", value: form.date, onChange: e => setForm({ ...form, date: e.target.value }) }),
        React.createElement(Select, { label: "상황", value: form.context, onChange: e => setForm({ ...form, context: e.target.value }), options: [{ value: "경기 전", label: "경기 전" }, { value: "경기 중", label: "경기 중" }, { value: "경기 후", label: "경기 후" }, { value: "훈련", label: "훈련" }] }),
        React.createElement(Input, { label: "시작 시간", placeholder: "예: 18:20", value: form.startTime, onChange: e => setForm({ ...form, startTime: e.target.value }) }),
        React.createElement(Input, { label: "총 투구수(구)", type: "number", placeholder: "예: 30", value: form.totalPitches, onChange: e => setForm({ ...form, totalPitches: e.target.value }) }),
        React.createElement(Input, { label: "강도(RPE 1-10)", type: "number", value: form.intensityRPE, onChange: e => setForm({ ...form, intensityRPE: e.target.value }) }),
        React.createElement(Input, { label: "구종 비율 메모", placeholder: "예: 직50 슬30 체20", value: form.mix, onChange: e => setForm({ ...form, mix: e.target.value }) }),
        React.createElement(Textarea, { label: "메모", placeholder: "캐처/장소/느낌 등", value: form.notes, onChange: e => setForm({ ...form, notes: e.target.value }) })
      ),
      React.createElement("div", { className: "flex justify-end" }, React.createElement(PillButton, { onClick: add }, "저장"))
    ),
    React.createElement(Section, { title: "기록 목록" },
      React.createElement("div", { className: "space-y-3" },
        db.bullpen.slice().sort((a,b)=>a.date<b.date?1:-1).map((b,i)=>
          React.createElement("div", { key: i, className: "bg-white border rounded-xl p-4" },
            React.createElement("div", { className: "flex items-center justify-between" },
              React.createElement("div", { className: "font-medium" }, `${b.date} · ${b.context}`),
              React.createElement("div", { className: "text-sm text-gray-500" }, `${b.totalPitches}구 · RPE${b.intensityRPE}`)
            ),
            (b.mix || b.notes) && React.createElement("p", { className: "text-sm text-gray-700 mt-2" }, [b.mix, b.notes].filter(Boolean).join(" · "))
          )
        )
      )
    )
  );
}

function Workout({ db, setDb }) {
  const [date, setDate] = useState(todayISO());
  const [blocks, setBlocks] = useState([{ type: "유산소", duration: 30 }, { type: "상체", duration: 30 }]);
  const [rpe, setRpe] = useState(6);
  const [notes, setNotes] = useState("");
  const addBlock = () => setBlocks([...blocks, { type: "", duration: 0 }]);
  const save = () => { setDb({ ...db, workouts: [...db.workouts, { date, blocks, rpe: Number(rpe), notes }] }); setBlocks([{ type: "유산소", duration: 30 }]); setRpe(6); setNotes(""); };
  return React.createElement(React.Fragment, null,
    React.createElement(Section, { title: "운동 기록", subtitle: "예: 유산소 30분 / 상체 30분" },
      React.createElement(Row, null,
        React.createElement(Input, { label: "날짜", type: "date", value: date, onChange: e => setDate(e.target.value) }),
        React.createElement(Input, { label: "RPE(1-10)", type: "number", value: rpe, onChange: e => setRpe(e.target.value) })
      ),
      React.createElement("div", { className: "mt-2" },
        blocks.map((b,i) => React.createElement("div", { key: i, className: "grid grid-cols-12 gap-2 mb-2" },
          React.createElement("div", { className: "col-span-7" },
            React.createElement(Input, { label: "구분", placeholder: "유산소/상체/하체/코어", value: b.type, onChange: e => setBlocks(blocks.map((x,idx)=>(idx===i?{...x, type:e.target.value}:x))) })
          ),
          React.createElement("div", { className: "col-span-5" },
            React.createElement(Input, { label: "시간(분)", type: "number", value: b.duration, onChange: e => setBlocks(blocks.map((x,idx)=>(idx===i?{...x, duration:Number(e.target.value)}:x))) })
          )
        )),
        React.createElement("button", { onClick: addBlock, className: "text-sm text-gray-600 underline" }, "블록 추가")
      ),
      React.createElement(Textarea, { label: "메모", value: notes, onChange: e => setNotes(e.target.value) }),
      React.createElement("div", { className: "flex justify-end" }, React.createElement(PillButton, { onClick: save }, "저장"))
    ),
    React.createElement(Section, { title: "기록 목록" },
      React.createElement("div", { className: "space-y-3" },
        db.workouts.slice().sort((a,b)=>a.date<b.date?1:-1).map((w,i) =>
          React.createElement("div", { key: i, className: "bg-white border rounded-xl p-4" },
            React.createElement("div", { className: "flex items-center justify-between" },
              React.createElement("div", { className: "font-medium" }, w.date),
              React.createElement("div", { className: "text-sm text-gray-500" }, `RPE${w.rpe}`)
            ),
            React.createElement("div", { className: "mt-1 flex flex-wrap" },
              w.blocks.map((b,j) => React.createElement("span", { key: j, className: "inline-flex items-center text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-1 mr-2 mb-2" }, `${b.type}${b.duration?` ${b.duration}분`:""}`))
            ),
            w.notes && React.createElement("p", { className: "text-sm text-gray-700 mt-2" }, w.notes)
          )
        )
      )
    )
  );
}

function Report({ db }) {
  const totals = useMemo(()=>{
    const byDate = {};
    db.bullpen.forEach(b => { byDate[b.date] = byDate[b.date] || { bullpenPitches:0, workoutsMin:0, gamesPitches:0 }; byDate[b.date].bullpenPitches += Number(b.totalPitches||0); });
    db.workouts.forEach(w => { const mins = w.blocks.reduce((s,x)=>s+Number(x.duration||0),0); byDate[w.date] = byDate[w.date] || { bullpenPitches:0, workoutsMin:0, gamesPitches:0 }; byDate[w.date].workoutsMin += mins; });
    db.games.forEach(g => { byDate[g.date] = byDate[g.date] || { bullpenPitches:0, workoutsMin:0, gamesPitches:0 }; byDate[g.date].gamesPitches += Number(g.pitches||0); });
    return byDate;
  },[db]);
  const rows = Object.entries(totals).sort((a,b)=>a[0]<b[0]?1:-1).map(([date,v])=>({date,...v}));
  return React.createElement(React.Fragment, null,
    React.createElement(Section, { title: "일자별 합계", subtitle: "불펜 투구수 / 운동 시간 / 경기 투구수" },
      React.createElement("div", { className: "overflow-auto" },
        React.createElement("table", { className: "min-w-full text-sm" },
          React.createElement("thead", null,
            React.createElement("tr", { className: "text-left text-gray-600" },
              React.createElement("th", { className: "py-2 pr-4" }, "날짜"),
              React.createElement("th", { className: "py-2 pr-4" }, "불펜(구)"),
              React.createElement("th", { className: "py-2 pr-4" }, "운동(분)"),
              React.createElement("th", { className: "py-2 pr-4" }, "경기(구)")
            )
          ),
          React.createElement("tbody", null,
            rows.map((r,i) => React.createElement("tr", { key: i, className: "border-t" },
              React.createElement("td", { className: "py-2 pr-4" }, r.date),
              React.createElement("td", { className: "py-2 pr-4" }, r.bullpenPitches),
              React.createElement("td", { className: "py-2 pr-4" }, r.workoutsMin),
              React.createElement("td", { className: "py-2 pr-4" }, r.gamesPitches)
            ))
          )
        )
      )
    )
  );
}

export default App;

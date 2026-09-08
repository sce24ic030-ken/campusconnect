:root {
  --ink: #18233e;
  --muted: #74809a;
  --border: #e9ebf4;
  --page: #f7f8ff;
  --blue: #4568f0;
  --purple: #8456f7;
  --green: #2bb673;
  --orange: #f5a524;
  --pink: #ec5e8d;
  --shadow: 0 12px 30px rgba(44, 52, 98, .08);
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--page);
  color: var(--ink);
  font-family: "Nunito", sans-serif;
}
button, input { font: inherit; }
button { cursor: pointer; border: 0; }
a { color: inherit; text-decoration: none; }

.app-layout {
  display: grid;
  grid-template-columns: 230px minmax(600px, 1fr) 330px;
  min-height: 100vh;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 22px 14px;
  color: #fff;
  background: linear-gradient(165deg, #111d42, #122c63 55%, #172351);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 8px 26px;
  font-weight: 900;
  font-size: 18px;
  letter-spacing: .5px;
}
.brand-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: linear-gradient(135deg, #6da7ff, #8057ef);
  box-shadow: 0 8px 18px rgba(79, 119, 255, .35);
}
.brand small { display: block; font-size: 9px; letter-spacing: 2px; color: #adc1ee; }

.nav-menu { display: grid; gap: 4px; }
.nav-link {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 10px 12px;
  border-radius: 11px;
  color: #dce7ff;
  font-size: 14px;
  font-weight: 800;
  transition: .2s;
}
.nav-link i { width: 16px; color: #91b5ff; }
.nav-link:hover, .nav-link.active {
  color: #fff;
  background: linear-gradient(100deg, #456ff0, #6d50e9);
  box-shadow: 0 8px 20px rgba(51, 88, 214, .32);
}
.nav-link.active i { color: #fff; }
.sidebar-bottom { margin-top: auto; }
.help-card {
  display: flex;
  gap: 9px;
  align-items: center;
  margin: 16px 5px 0;
  padding: 12px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 14px;
  background: rgba(255,255,255,.09);
}
.help-card span { font-size: 25px; }
.help-card strong, .help-card small { display: block; }
.help-card strong { font-size: 12px; }
.help-card small { margin-top: 2px; font-size: 10px; color: #b8c8eb; }

.content { padding: 0 25px 28px; min-width: 0; }
.topbar {
  height: 72px;
  display: flex;
  align-items: center;
  gap: 20px;
}
.menu-toggle { display: none; color: var(--ink); background: transparent; font-size: 20px; }
.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  width: min(340px, 46%);
  padding: 10px 14px;
  color: #9299ab;
  border-radius: 12px;
  background: #eff1f8;
}
.search-box input { width: 100%; background: transparent; border: 0; outline: 0; color: var(--ink); }
.top-actions { display: flex; align-items: center; gap: 18px; margin-left: auto; }
.notification-btn { position: relative; font-size: 19px; color: var(--ink); background: transparent; }
.notification-btn span {
  position: absolute; top: -8px; right: -9px;
  width: 16px; height: 16px; border-radius: 50%;
  color: #fff; background: #ef4c62; font-size: 9px; font-weight: 900;
}
.student-mini { display: flex; align-items: center; gap: 9px; }
.avatar {
  display: grid; place-items: center; width: 38px; height: 38px;
  border-radius: 50%; color: #fff; font-size: 12px; font-weight: 900;
  background: linear-gradient(135deg, #f286ae, #6f64e9);
}
.student-mini strong, .student-mini small { display: block; }
.student-mini strong { font-size: 12px; }
.student-mini small { font-size: 10px; color: var(--muted); }

.welcome { display: flex; align-items: center; justify-content: space-between; margin: 9px 0 20px; }
.eyebrow { margin: 0 0 3px; color: #7e85a0; font-size: 10px; font-weight: 900; letter-spacing: 1px; }
h1 { margin: 0; font-size: 25px; }
.welcome > div > p:last-child { margin: 5px 0 0; color: var(--muted); font-size: 14px; }
.gradient-button {
  padding: 11px 16px; color: #fff; border-radius: 11px; font-size: 12px; font-weight: 800;
  background: linear-gradient(110deg, #4269f1, #a04ce1);
  box-shadow: 0 9px 18px rgba(92, 82, 223, .25);
}

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.stat-card {
  display: flex; align-items: center; gap: 11px; min-height: 112px;
  padding: 16px; border: 1px solid var(--border); border-radius: 17px;
  background: #fff; box-shadow: var(--shadow);
}
.stat-card.blue { background: linear-gradient(135deg, #edf5ff, #fff); }
.stat-card.green { background: linear-gradient(135deg, #edfff4, #fff); }
.stat-card.orange { background: linear-gradient(135deg, #fff6e7, #fff); }
.stat-card.purple { background: linear-gradient(135deg, #f5efff, #fff); }
.stat-icon {
  display: grid; place-items: center; flex: 0 0 42px; width: 42px; height: 42px;
  border-radius: 14px; font-size: 18px;
}
.blue .stat-icon { background: #dbe9ff; color: #3973ed; }
.green .stat-icon { background: #d9f8e5; color: #239f63; }
.orange .stat-icon { background: #ffebc8; color: #e89311; }
.purple .stat-icon { background: #e8dcff; color: #7847db; }
.stat-card strong, .stat-card span, .stat-card small { display: block; }
.stat-card strong { font-size: 20px; line-height: 1.05; }
.stat-card span { margin-top: 4px; font-size: 11px; font-weight: 900; }
.stat-card small { margin-top: 4px; color: var(--muted); font-size: 9px; }

.top-grid { display: grid; grid-template-columns: 1fr 1.18fr; gap: 14px; margin-top: 15px; }
.panel {
  padding: 17px; border: 1px solid var(--border); border-radius: 17px;
  background: #fff; box-shadow: var(--shadow);
}
.panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 13px; }
.panel-heading > div { display: flex; align-items: center; gap: 9px; }
.panel-heading h2 { margin: 0; font-size: 15px; }
.panel-heading a { color: var(--blue); font-size: 11px; font-weight: 900; }
.heading-icon {
  display: grid; place-items: center; width: 29px; height: 29px;
  border-radius: 9px; font-size: 13px;
}
.blue-icon { color: #3474ed; background: #e1ecff; }
.purple-icon { color: #7e46d9; background: #eee5ff; }
.green-icon { color: #249c60; background: #dcf9e9; }
.orange-icon { color: #e88d14; background: #fff0d2; }
.pink-icon { color: #df477b; background: #ffe0eb; }

.class-row {
  display: grid; grid-template-columns: 53px 1fr 66px; align-items: center;
  padding: 9px 0; border-bottom: 1px solid #f0f1f7; font-size: 11px;
}
.class-row:last-child { border-bottom: 0; }
.class-row time { color: #4e5880; font-weight: 900; font-size: 10px; }
.class-row time small { display: block; font-size: 8px; color: #9ca3b8; }
.class-row strong { font-size: 11px; }
.class-row > span { color: var(--muted); text-align: right; font-size: 10px; }

.insight-panel { background: linear-gradient(140deg, #f9f7ff, #f1f8ff); overflow: hidden; }
.live-dot { color: #269a5d; font-size: 10px; font-weight: 900; }
.live-dot::before { content: ""; display: inline-block; width: 6px; height: 6px; margin-right: 4px; border-radius: 50%; background: #2fc171; }
.insight-content { display: flex; align-items: center; min-height: 125px; }
.insight-content ul { z-index: 1; display: grid; gap: 13px; margin: 0; padding: 0; list-style: none; font-size: 11px; font-weight: 700; }
.insight-content li { display: flex; gap: 7px; align-items: flex-start; }
.robot { position: relative; margin-left: auto; padding-right: 3px; color: #fff; font-size: 75px; filter: drop-shadow(0 10px 8px rgba(90, 71, 193, .18)); }
.robot span { position: absolute; top: 2px; right: -3px; font-size: 21px; }

.ask-panel {
  display: flex; align-items: center; gap: 12px; margin-top: 15px; padding: 13px 17px;
  border: 1px solid #e2e6f8; border-radius: 17px; background: linear-gradient(110deg, #fff, #f4f5ff);
  box-shadow: var(--shadow);
}
.ask-avatar { display: grid; place-items: center; width: 43px; height: 43px; border-radius: 13px; background: #e5ebff; font-size: 27px; }
.ask-input-wrap { flex: 1; }
.ask-input-wrap > strong { display: block; margin-bottom: 5px; font-size: 12px; }
.ask-input { display: flex; overflow: hidden; border-radius: 9px; background: #eef0f8; }
.ask-input input { flex: 1; min-width: 0; padding: 9px 11px; border: 0; outline: 0; background: transparent; font-size: 11px; }
.ask-input button { width: 38px; color: #fff; background: linear-gradient(135deg, #4b75f0, #7a52e8); }

.bottom-grid { display: grid; grid-template-columns: 1.25fr 1fr 1fr; gap: 14px; margin-top: 15px; }
.small-button { padding: 7px 10px; color: #56607a; border: 1px solid var(--border); border-radius: 8px; background: #f9f9fc; font-size: 10px; font-weight: 800; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; text-align: center; font-size: 10px; }
th, td { min-width: 43px; padding: 8px 4px; border: 1px solid #e8ebf3; }
thead { color: #607097; background: #f0f5ff; }
tbody th { color: #65708b; background: #fbfcff; }
td { font-weight: 800; color: #33415e; }
.legend { margin: 11px 0 0; color: #7c8499; font-size: 8px; font-weight: 800; }

.attendance-summary { display: flex; align-items: center; gap: 15px; }
.circle-progress {
  display: grid; place-content: center; width: 97px; height: 97px; flex: 0 0 97px;
  text-align: center; border-radius: 50%;
  background: radial-gradient(closest-side, #fff 76%, transparent 77% 100%), conic-gradient(#2db36d 82%, #e7f4ec 0);
}
.circle-progress strong { font-size: 22px; }
.circle-progress span { color: var(--muted); font-size: 9px; font-weight: 800; }
.attendance-numbers { flex: 1; }
.attendance-numbers p { display: flex; align-items: center; gap: 6px; margin: 8px 0; color: #56617a; font-size: 10px; font-weight: 800; }
.attendance-numbers p strong { margin-left: auto; font-size: 12px; }
.success-dot, .warning-dot, .danger-dot { width: 8px; height: 8px; border-radius: 50%; }
.success-dot { background: #31b86f; } .warning-dot { background: #f4b533; } .danger-dot { background: #ec5c67; }
.subject-bars { margin-top: 14px; }
.subject-bars p { display: grid; grid-template-columns: 1.25fr 1fr 28px; align-items: center; gap: 7px; margin: 9px 0; font-size: 9px; font-weight: 800; }
.subject-bars p span { height: 7px; overflow: hidden; border-radius: 30px; background: #ebeff3; }
.subject-bars p b { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #32af69, #6bd283); }

.lost-item { display: flex; align-items: center; gap: 8px; margin-top: 9px; padding: 7px; border-radius: 10px; background: #fafbfe; }
.item-emoji { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; background: #edf1fa; font-size: 17px; }
.lost-item div { min-width: 0; flex: 1; }
.lost-item strong, .lost-item small { display: block; }
.lost-item strong { font-size: 10px; }
.lost-item small { overflow: hidden; color: var(--muted); font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
.lost-tag, .found-tag { padding: 4px 6px; border-radius: 6px; font-size: 8px; }
.lost-tag { color: #a549bc; background: #f6e3fd; }
.found-tag { color: #1e9561; background: #dff8e9; }

.chat-panel { padding: 5px 12px 12px 0; background: var(--page); }
.chat-panel > * { background: #fff; }
.chat-head {
  display: flex; align-items: center; gap: 10px; min-height: 82px; padding: 13px;
  border: 1px solid var(--border); border-radius: 17px 17px 0 0;
}
.chat-bot { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, #dcd8ff, #eaf5ff); font-size: 30px; }
.chat-head h2 { margin: 0; font-size: 15px; }
.chat-head p { margin: 3px 0 0; color: #29a664; font-size: 10px; font-weight: 800; }
.chat-head p i { font-size: 6px; }
.chat-head button { margin-left: auto; color: var(--ink); background: transparent; font-size: 17px; }

.messages {
  display: flex; flex-direction: column; gap: 12px; height: calc(100vh - 154px);
  padding: 17px 14px; overflow-y: auto; border-right: 1px solid var(--border); border-left: 1px solid var(--border);
}
.message { max-width: 85%; padding: 10px 12px; border-radius: 12px; font-size: 11px; line-height: 1.5; }
.bot-message { align-self: flex-start; color: #3d4661; border: 1px solid #e1e5f1; border-top-left-radius: 3px; background: #f8f9fd; }
.user-message { align-self: flex-end; color: #fff; border-bottom-right-radius: 3px; background: linear-gradient(130deg, #466ff0, #8d57eb); box-shadow: 0 7px 13px rgba(96, 82, 218, .18); }
.chat-input {
  display: flex; gap: 7px; padding: 10px; border: 1px solid var(--border); border-radius: 0 0 17px 17px;
}
.chat-input input { flex: 1; min-width: 0; padding: 10px; border: 1px solid #e4e7f0; border-radius: 9px; outline-color: var(--blue); font-size: 11px; }
.chat-input button { width: 38px; color: #fff; border-radius: 9px; background: linear-gradient(135deg, #4775ef, #8b55e9); }
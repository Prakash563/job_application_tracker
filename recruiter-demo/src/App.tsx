import { BarChart3, BriefcaseBusiness, CheckCircle2, ChevronRight, FileText, Github, LayoutDashboard, MapPin, Plus, RotateCcw, Sparkles, Target, Trash2, UploadCloud } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const STAGES = ["Saved", "Applied", "Interview", "Offer", "Rejected", "Withdrawn"] as const;
type Stage = (typeof STAGES)[number];
type View = "overview" | "applications" | "skills" | "project";

type Application = {
  id: string;
  company: string;
  role: string;
  location: string;
  status: Stage;
  date: string;
  notes: string;
};

type Resume = { id: string; name: string; size: number; skills: string };
type Store = { applications: Application[]; resumes: Resume[] };

const STORAGE_KEY = "career-compass-recruiter-demo-v1";
const SKILL_TERMS = ["python", "sql", "excel", "tableau", "power bi", "pandas", "machine learning", "data analysis", "data visualization", "a/b testing", "aws", "docker", "git", "fastapi", "django", "react", "typescript", "javascript", "html", "css", "postgresql", "mysql", "communication", "stakeholder management", "agile"];

const emptyStore: Store = { applications: [], resumes: [] };
const statusClass: Record<Stage, string> = {
  Saved: "status-saved", Applied: "status-applied", Interview: "status-interview", Offer: "status-offer", Rejected: "status-rejected", Withdrawn: "status-withdrawn",
};

function loadStore(): Store {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) as Store : emptyStore;
  } catch {
    return emptyStore;
  }
}

function containsTerm(text: string, term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(^|[^a-z0-9+#.])${escaped}(?=$|[^a-z0-9+#.])`, "i").test(text);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function App() {
  const [view, setView] = useState<View>("overview");
  const [store, setStore] = useState<Store>(loadStore);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  const createIllustrativeWorkspace = () => {
    setStore({
      applications: [
        { id: crypto.randomUUID(), company: "Northstar Analytics", role: "Data Analyst", location: "Remote", status: "Interview", date: "2026-08-08", notes: "Illustrative browser-only record for the recruiter walkthrough." },
        { id: crypto.randomUUID(), company: "Cedar Works", role: "Junior Full-Stack Developer", location: "Hybrid", status: "Applied", date: "2026-08-14", notes: "Illustrative browser-only record for the recruiter walkthrough." },
      ],
      resumes: [{ id: crypto.randomUUID(), name: "illustrative-resume.txt", size: 1180, skills: "Python, SQL, pandas, React, TypeScript, Git, stakeholder management" }],
    });
    setView("overview");
  };

  const clearWorkspace = () => setStore(emptyStore);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><BriefcaseBusiness size={18} /></div><div><strong>Career Compass</strong><span>Recruiter demo</span></div></div>
        <nav>
          <NavItem active={view === "overview"} onClick={() => setView("overview")} icon={<LayoutDashboard size={18} />} label="Overview" />
          <NavItem active={view === "applications"} onClick={() => setView("applications")} icon={<BriefcaseBusiness size={18} />} label="Application lab" />
          <NavItem active={view === "skills"} onClick={() => setView("skills")} icon={<Sparkles size={18} />} label="Skill lab" />
          <NavItem active={view === "project"} onClick={() => setView("project")} icon={<BarChart3 size={18} />} label="Project architecture" />
        </nav>
        <div className="sidebar-note"><span>Public, no-login walkthrough</span><p>Your changes stay in this browser only.</p></div>
      </aside>

      <main className="content">
        <header className="topbar"><div><span className="eyebrow">Interactive portfolio case study</span><h1>{view === "overview" ? "A job search command center" : view === "applications" ? "Application workflow" : view === "skills" ? "Deterministic skill-gap comparison" : "Full-stack architecture"}</h1></div><div className="top-actions"><a href="https://github.com/Prakash563/job_application_tracker" target="_blank" rel="noreferrer" className="source-link"><Github size={16} /> Source</a><button className="secondary" onClick={clearWorkspace}><RotateCcw size={16} /> Clear browser data</button></div></header>
        {view === "overview" && <Overview store={store} onSeed={createIllustrativeWorkspace} onOpenLab={() => setView("applications")} />}
        {view === "applications" && <ApplicationsLab store={store} setStore={setStore} />}
        {view === "skills" && <SkillLab store={store} />}
        {view === "project" && <ProjectArchitecture />}
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>{icon}<span>{label}</span></button>;
}

function Overview({ store, onSeed, onOpenLab }: { store: Store; onSeed: () => void; onOpenLab: () => void }) {
  const active = store.applications.filter(item => !["Rejected", "Withdrawn"].includes(item.status)).length;
  const applied = store.applications.filter(item => ["Applied", "Interview", "Offer", "Rejected"].includes(item.status)).length;
  const responses = store.applications.filter(item => ["Interview", "Offer", "Rejected"].includes(item.status)).length;
  const interviews = store.applications.filter(item => ["Interview", "Offer"].includes(item.status)).length;
  const responseRate = applied ? Math.round((responses / applied) * 100) : 0;
  const interviewRate = applied ? Math.round((interviews / applied) * 100) : 0;
  const distribution = STAGES.map(status => ({ status, count: store.applications.filter(item => item.status === status).length }));

  return <div className="page-content">
    <section className="hero"><div><span className="eyebrow">No login required</span><h2>Let recruiters explore the product, not a sign-in wall.</h2><p>This public walkthrough runs entirely in the browser. Add records, test the workflow, upload local metadata, and compare skills without sending information anywhere.</p><div className="hero-actions"><button className="primary" onClick={onOpenLab}><Plus size={17} /> Try the application lab</button><button className="text-button" onClick={onSeed}>Load illustrative local data <ChevronRight size={17} /></button></div></div><div className="hero-grid"><div><strong>01</strong><span>Public demo</span></div><div><strong>02</strong><span>Full-stack source</span></div><div><strong>03</strong><span>Production auth path</span></div><div><strong>04</strong><span>Clear data boundaries</span></div></div></section>
    <section className="metrics"><Metric label="Active leads" value={String(active)} helper="Saved through offer" icon={<BriefcaseBusiness size={19} />} /><Metric label="Response rate" value={`${responseRate}%`} helper="Interview, offer, or rejection" icon={<Target size={19} />} /><Metric label="Interview conversion" value={`${interviewRate}%`} helper="Interview or offer from active applications" icon={<CheckCircle2 size={19} />} /><Metric label="Local resumes" value={String(store.resumes.length)} helper="File metadata only" icon={<FileText size={19} />} /></section>
    <section className="two-column"><div className="panel"><div className="panel-head"><div><h3>Pipeline snapshot</h3><p>Exact workflow stages from the full product.</p></div><button className="mini-button" onClick={onOpenLab}>Manage</button></div><div className="pipeline">{distribution.map(item => <div key={item.status}><div className="pipeline-row"><span>{item.status}</span><strong>{item.count}</strong></div><div className="bar-track"><span className={`bar-fill ${statusClass[item.status]}`} style={{ width: `${store.applications.length ? Math.max(8, item.count / store.applications.length * 100) : 0}%` }} /></div></div>)}</div></div><div className="panel accent-panel"><Sparkles size={22} /><h3>What recruiters can test</h3><p>Create a browser-local application, move it through the exact workflow, add a local resume label, and run a transparent skill-gap comparison.</p><button className="light-button" onClick={onOpenLab}>Open interactive lab</button></div></section>
  </div>;
}

function Metric({ label, value, helper, icon }: { label: string; value: string; helper: string; icon: React.ReactNode }) {
  return <div className="metric"><div><span>{label}</span><strong>{value}</strong><p>{helper}</p></div><div className="metric-icon">{icon}</div></div>;
}

function ApplicationsLab({ store, setStore }: { store: Store; setStore: React.Dispatch<React.SetStateAction<Store>> }) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Stage>("Saved");
  const [resumeSkills, setResumeSkills] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!company.trim() || !role.trim()) return;
    setStore(current => ({ ...current, applications: [{ id: crypto.randomUUID(), company: company.trim(), role: role.trim(), location: location.trim() || "Not specified", notes: notes.trim(), status, date: new Date().toISOString().slice(0, 10) }, ...current.applications] }));
    setCompany(""); setRole(""); setLocation(""); setNotes(""); setStatus("Saved");
  };

  const addResume = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStore(current => ({ ...current, resumes: [{ id: crypto.randomUUID(), name: file.name, size: file.size, skills: resumeSkills }, ...current.resumes] }));
    event.target.value = "";
  };

  return <div className="page-content lab-grid"><section className="panel"><div className="panel-head"><div><h3>Create an application</h3><p>Stored only in this browser through local storage.</p></div><span className="local-badge">Local only</span></div><form onSubmit={submit} className="form-grid"><label>Company<input value={company} onChange={event => setCompany(event.target.value)} placeholder="Company name" /></label><label>Role<input value={role} onChange={event => setRole(event.target.value)} placeholder="Role title" /></label><label>Location<input value={location} onChange={event => setLocation(event.target.value)} placeholder="Remote, hybrid, or city" /></label><label>Status<select value={status} onChange={event => setStatus(event.target.value as Stage)}>{STAGES.map(stage => <option key={stage}>{stage}</option>)}</select></label><label className="wide">Notes<textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Add a next step, recruiter contact, or job context." rows={3} /></label><button className="primary wide" type="submit"><Plus size={17} /> Save locally</button></form></section><section className="panel"><div className="panel-head"><div><h3>Local resume metadata</h3><p>No file is uploaded; this stores only the selected filename, size, and your supplied skills.</p></div><UploadCloud size={20} /></div><label>Skills for the local comparison<textarea value={resumeSkills} onChange={event => setResumeSkills(event.target.value)} placeholder="Python, SQL, React, analytics..." rows={4} /></label><label className="file-input">Choose local file<input type="file" accept=".pdf,.docx,.txt" onChange={addResume} /><span><UploadCloud size={17} /> Select resume file</span></label><div className="resume-list">{store.resumes.length ? store.resumes.map(resume => <div key={resume.id}><FileText size={17} /><span>{resume.name}</span><small>{Math.round(resume.size / 1024)} KB</small></div>) : <p>No local metadata saved yet.</p>}</div></section><section className="panel wide-panel"><div className="panel-head"><div><h3>Application workflow</h3><p>Change any saved item to inspect the exact stage labels used in the production application.</p></div></div>{store.applications.length ? <div className="application-list">{store.applications.map(application => <div className="application-card" key={application.id}><div className="application-logo">{application.company.slice(0, 1).toUpperCase()}</div><div className="application-info"><div><h4>{application.role}</h4><span className={`status-pill ${statusClass[application.status]}`}>{application.status}</span></div><p>{application.company} <span>·</span> <MapPin size={13} /> {application.location}</p><small>{formatDate(application.date)} · {application.notes || "No notes yet"}</small></div><div className="card-actions"><select value={application.status} onChange={event => setStore(current => ({ ...current, applications: current.applications.map(item => item.id === application.id ? { ...item, status: event.target.value as Stage } : item) }))}>{STAGES.map(stage => <option key={stage}>{stage}</option>)}</select><button aria-label="Remove application" onClick={() => setStore(current => ({ ...current, applications: current.applications.filter(item => item.id !== application.id) }))}><Trash2 size={17} /></button></div></div>)}</div> : <div className="empty"><BriefcaseBusiness size={26} /><h4>Start with one opportunity</h4><p>Add an application above or load the illustrative browser-only walkthrough from Overview.</p></div>}</section></div>;
}

function SkillLab({ store }: { store: Store }) {
  const [candidate, setCandidate] = useState(store.resumes[0]?.skills ?? "");
  const [jobDescription, setJobDescription] = useState("Python, SQL, data analysis, React, TypeScript, and stakeholder communication are required. Experience with Docker is preferred.");
  const analysis = useMemo(() => {
    const required = SKILL_TERMS.filter(term => containsTerm(jobDescription, term));
    const matched = required.filter(term => containsTerm(candidate, term));
    return { required, matched, missing: required.filter(term => !matched.includes(term)) };
  }, [candidate, jobDescription]);
  return <div className="page-content skill-layout"><section className="panel"><span className="eyebrow">Transparent, browser-only logic</span><h2>Compare stated skills with job requirements.</h2><p className="intro">This GitHub Pages demo uses a documented keyword comparison. The production source includes a protected server-side AI narrative on top of a deterministic baseline.</p><label>Skills or resume text<textarea value={candidate} onChange={event => setCandidate(event.target.value)} rows={7} placeholder="Add skills or experience here." /></label><label>Job description<textarea value={jobDescription} onChange={event => setJobDescription(event.target.value)} rows={9} /></label></section><section className="analysis"><div className="match-score"><span>Recognised requirement coverage</span><strong>{analysis.required.length ? Math.round(analysis.matched.length / analysis.required.length * 100) : 0}%</strong><div className="score-track"><span style={{ width: `${analysis.required.length ? analysis.matched.length / analysis.required.length * 100 : 0}%` }} /></div><p>{analysis.matched.length} matched of {analysis.required.length} recognised requirements.</p></div><SkillGroup title="Matched skills" items={analysis.matched} tone="match" /><SkillGroup title="Gaps to address" items={analysis.missing} tone="gap" /><SkillGroup title="How this maps to full stack" items={["Public demo: browser-local text comparison", "Production app: user-scoped records and server-side AI explanation", "No resume data leaves this demo browser"]} tone="note" /></section></div>;
}

function SkillGroup({ title, items, tone }: { title: string; items: string[]; tone: string }) { return <div className="skill-group"><h3>{title}</h3><div>{items.length ? items.map(item => <span className={tone} key={item}>{item}</span>) : <p>No recognised items yet.</p>}</div></div>; }

function ProjectArchitecture() {
  return <div className="page-content project-layout"><section className="panel"><span className="eyebrow">Two delivery paths, one codebase</span><h2>Designed for recruiter visibility and real full-stack capability.</h2><p className="intro">The public demo proves interaction design in a browser. The separate production application preserves the database, protected API, S3 resume storage, and authenticated AI workflow.</p><div className="architecture"><div className="arch-lane demo-lane"><span>GitHub Pages recruiter demo</span><div>React + Vite</div><div>Browser local storage</div><div>Deterministic skill comparison</div><p>No login. No network persistence. Public walkthrough.</p></div><div className="arch-arrow">↔</div><div className="arch-lane full-lane"><span>Authenticated production app</span><div>React dashboard + tRPC</div><div>Database + S3 resume storage</div><div>Server-side AI narrative</div><p>Private user records and real authentication path.</p></div></div></section><section className="project-cards"><div><BriefcaseBusiness size={21} /><h3>Recruiter test flow</h3><p>Open the public URL, add an application, move it through a stage, and run the skill lab. Changes stay in the local browser.</p></div><div><Target size={21} /><h3>Full-stack evidence</h3><p>Review the repository schema, protected server router, S3 storage helper, tests, and architecture documentation.</p></div><div><Github size={21} /><h3>Source transparency</h3><p>The project README documents both hosting paths and the strict boundary between the demo and production data.</p></div></section></div>;
}

export default App;

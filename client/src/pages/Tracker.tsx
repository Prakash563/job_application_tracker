import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { BarChart3, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronRight, FilePlus2, FileText, Link2, Loader2, MapPin, MoreHorizontal, Plus, Sparkles, Target, Trash2, UploadCloud, UserRound } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

const STATUSES = ["Saved", "Applied", "Interview", "Offer", "Rejected", "Withdrawn"] as const;
type Status = (typeof STATUSES)[number];
type Page = "overview" | "applications" | "resumes" | "skill-match" | "analytics" | "profile";

type ApplicationRecord = {
  id: number;
  company: string;
  role: string;
  location: string | null;
  salaryRange: string | null;
  applicationDate: Date;
  status: Status;
  notes: string | null;
  jobUrl: string | null;
  resumeIds: number[];
  updatedAt: Date;
};

type ApplicationFormState = {
  company: string;
  role: string;
  location: string;
  salaryRange: string;
  applicationDate: string;
  status: Status;
  notes: string;
  jobUrl: string;
};

type ApplicationPayload = Omit<ApplicationFormState, "applicationDate"> & { applicationDate: Date };

const STATUS_STYLES: Record<Status, string> = {
  Saved: "bg-slate-100 text-slate-700 border-slate-200",
  Applied: "bg-blue-50 text-blue-700 border-blue-200",
  Interview: "bg-violet-50 text-violet-700 border-violet-200",
  Offer: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200",
  Withdrawn: "bg-amber-50 text-amber-800 border-amber-200",
};

const CHART_COLORS = ["#1d4f4a", "#d97757", "#6c5ce7", "#2e9d85", "#bf4a4a", "#b8860b"];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function emptyApplicationForm(): ApplicationFormState {
  return { company: "", role: "", location: "", salaryRange: "", applicationDate: todayDate(), status: "Saved", notes: "", jobUrl: "" };
}

function toApplicationForm(application: ApplicationRecord): ApplicationFormState {
  return {
    company: application.company,
    role: application.role,
    location: application.location ?? "",
    salaryRange: application.salaryRange ?? "",
    applicationDate: new Date(application.applicationDate).toISOString().slice(0, 10),
    status: application.status,
    notes: application.notes ?? "",
    jobUrl: application.jobUrl ?? "",
  };
}

function allowedStatuses(current: Status): Status[] {
  if (current === "Rejected" || current === "Withdrawn") return [current];
  const index = STATUSES.indexOf(current);
  const next = STATUSES[index + 1];
  const options: Status[] = [current];
  if (next && next !== "Rejected" && next !== "Withdrawn") options.push(next);
  if (["Saved", "Applied", "Interview"].includes(current)) options.push("Rejected");
  options.push("Withdrawn");
  return Array.from(new Set(options));
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function listFromJson(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function MetricCard({ label, value, helper, icon: Icon }: { label: string; value: string; helper: string; icon: typeof BriefcaseBusiness }) {
  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold mt-2 tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground mt-2">{helper}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#eaf4f1] text-[#1d4f4a] grid place-items-center"><Icon className="h-5 w-5" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Tracker({ page }: { page: Page }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const applicationsQuery = trpc.jobTracker.applications.list.useQuery();
  const resumesQuery = trpc.jobTracker.resumes.list.useQuery();
  const analyticsQuery = trpc.jobTracker.analytics.overview.useQuery();
  const applications = (applicationsQuery.data ?? []) as ApplicationRecord[];
  const resumes = resumesQuery.data ?? [];
  const analytics = analyticsQuery.data;

  const invalidateWorkspace = async () => {
    await Promise.all([
      utils.jobTracker.applications.list.invalidate(),
      utils.jobTracker.resumes.list.invalidate(),
      utils.jobTracker.analytics.overview.invalidate(),
    ]);
  };

  const createApplication = trpc.jobTracker.applications.create.useMutation({
    onSuccess: async () => { await invalidateWorkspace(); toast.success("Application saved to your tracker."); },
    onError: error => toast.error(error.message),
  });
  const updateApplication = trpc.jobTracker.applications.update.useMutation({
    onSuccess: async () => { await invalidateWorkspace(); toast.success("Application updated."); },
    onError: error => toast.error(error.message),
  });
  const deleteApplication = trpc.jobTracker.applications.remove.useMutation({
    onSuccess: async () => { await invalidateWorkspace(); toast.success("Application removed."); },
    onError: error => toast.error(error.message),
  });

  if (applicationsQuery.isLoading || resumesQuery.isLoading || analyticsQuery.isLoading) {
    return <div className="min-h-[65vh] grid place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#1d4f4a]" /></div>;
  }

  if (applicationsQuery.error || resumesQuery.error || analyticsQuery.error) {
    return <Card className="max-w-xl mx-auto mt-16"><CardHeader><CardTitle>Workspace unavailable</CardTitle><CardDescription>Refresh the page or sign in again. Your data remains protected.</CardDescription></CardHeader></Card>;
  }

  const sharedProps = { applications, resumes, analytics, createApplication, updateApplication, deleteApplication, invalidateWorkspace };
  if (page === "overview") return <OverviewPage {...sharedProps} />;
  if (page === "applications") return <ApplicationsPage {...sharedProps} />;
  if (page === "resumes") return <ResumesPage applications={applications} resumes={resumes} invalidateWorkspace={invalidateWorkspace} />;
  if (page === "skill-match") return <SkillMatchPage applications={applications} resumes={resumes} />;
  if (page === "analytics") return <AnalyticsPage analytics={analytics} />;
  return <ProfilePage user={user} analytics={analytics} resumesCount={resumes.length} />;
}

function OverviewPage({ applications, analytics, createApplication, updateApplication, deleteApplication }: Omit<SharedApplicationProps, "resumes" | "invalidateWorkspace">) {
  const recent = applications.slice(0, 4);
  return (
    <div className="page-enter max-w-7xl mx-auto space-y-7">
      <Hero applications={applications} createApplication={createApplication} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active leads" value={String(applications.filter(item => !["Rejected", "Withdrawn"].includes(item.status)).length)} helper="Saved through offer" icon={BriefcaseBusiness} />
        <MetricCard label="Response rate" value={`${analytics?.responseRate ?? 0}%`} helper="Interview, offer, or rejection" icon={Target} />
        <MetricCard label="Interview conversion" value={`${analytics?.interviewConversionRate ?? 0}%`} helper="From all active applications" icon={CalendarDays} />
        <MetricCard label="Offers" value={String(applications.filter(item => item.status === "Offer").length)} helper="Keep your next step visible" icon={CheckCircle2} />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4"><div><CardTitle>Recent applications</CardTitle><CardDescription>Your latest updates across the search.</CardDescription></div><a href="/applications"><Button variant="outline" size="sm">View all <ChevronRight className="h-4 w-4" /></Button></a></CardHeader>
          <CardContent>
            {recent.length ? <div className="divide-y">{recent.map(application => <ApplicationRow key={application.id} application={application} onEdit={() => undefined} onDelete={() => deleteApplication.mutate({ id: application.id })} compact />)}</div> : <EmptyApplications createApplication={createApplication} />}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-[#1d4f4a] text-white overflow-hidden">
          <CardHeader><div className="h-10 w-10 rounded-xl bg-white/15 grid place-items-center"><Sparkles className="h-5 w-5" /></div><CardTitle className="text-white mt-3">Turn a job description into a plan.</CardTitle><CardDescription className="text-white/70">Use Skill match to identify what to emphasize and what to learn next.</CardDescription></CardHeader>
          <CardContent><a href="/skill-match"><Button className="w-full bg-[#f4b183] hover:bg-[#f6c09c] text-[#3f261b]">Run skill match</Button></a></CardContent>
        </Card>
      </section>
    </div>
  );
}

type SharedApplicationProps = {
  applications: ApplicationRecord[];
  resumes: Array<{ id: number }>;
  analytics: { totalApplications: number; responseRate: number; interviewConversionRate: number; statusDistribution: { status: Status; count: number }[]; applicationsByMonth: { month: string; count: number }[] } | undefined;
  createApplication: ReturnType<typeof trpc.jobTracker.applications.create.useMutation>;
  updateApplication: ReturnType<typeof trpc.jobTracker.applications.update.useMutation>;
  deleteApplication: ReturnType<typeof trpc.jobTracker.applications.remove.useMutation>;
  invalidateWorkspace: () => Promise<void>;
};

function Hero({ applications, createApplication }: { applications: ApplicationRecord[]; createApplication: SharedApplicationProps["createApplication"] }) {
  const [open, setOpen] = useState(false);
  return <>
    <div className="relative overflow-hidden rounded-3xl bg-[#fcf1e8] px-6 py-8 md:px-10 md:py-10">
      <div className="absolute right-[-4rem] top-[-3rem] h-56 w-56 rounded-full bg-[#f4b183]/45 blur-3xl" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b05c37]">Job search command center</p><h1 className="font-display mt-3 text-4xl tracking-tight text-[#1d4f4a] md:text-5xl">Track the work that gets you to yes.</h1><p className="mt-4 text-base text-[#53645f] leading-relaxed">You have {applications.length} {applications.length === 1 ? "application" : "applications"} in your private workspace. Keep momentum with clear next steps and evidence-based preparation.</p></div>
        <Button onClick={() => setOpen(true)} className="bg-[#1d4f4a] hover:bg-[#163e3a] shadow-lg shadow-[#1d4f4a]/15"><Plus className="h-4 w-4" /> Add application</Button>
      </div>
    </div>
    <ApplicationDialog open={open} onOpenChange={setOpen} onSubmit={data => createApplication.mutate(data, { onSuccess: () => setOpen(false) })} isSaving={createApplication.isPending} />
  </>;
}

function ApplicationsPage({ applications, createApplication, updateApplication, deleteApplication }: Omit<SharedApplicationProps, "resumes" | "analytics" | "invalidateWorkspace">) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApplicationRecord | null>(null);
  const [filter, setFilter] = useState<Status | "all">("all");
  const filtered = filter === "all" ? applications : applications.filter(item => item.status === filter);
  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (application: ApplicationRecord) => { setEditing(application); setOpen(true); };
  return <div className="page-enter max-w-7xl mx-auto space-y-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b05c37]">Opportunity pipeline</p><h1 className="font-display text-4xl text-[#1d4f4a] mt-1">Applications</h1><p className="text-muted-foreground mt-2">Move applications forward with a clear, validated workflow.</p></div><Button onClick={openCreate} className="bg-[#1d4f4a] hover:bg-[#163e3a]"><Plus className="h-4 w-4" /> Add application</Button></div>
    <div className="flex flex-wrap gap-2">{["all", ...STATUSES].map(status => <Button key={status} variant={filter === status ? "default" : "outline"} className={filter === status ? "bg-[#1d4f4a] hover:bg-[#163e3a]" : "bg-white"} size="sm" onClick={() => setFilter(status as Status | "all")}>{status === "all" ? `All (${applications.length})` : `${status} (${applications.filter(item => item.status === status).length})`}</Button>)}</div>
    <Card className="border-0 shadow-sm"><CardContent className="p-0">{filtered.length ? <div className="divide-y">{filtered.map(application => <ApplicationRow key={application.id} application={application} onEdit={() => openEdit(application)} onDelete={() => deleteApplication.mutate({ id: application.id })} />)}</div> : <div className="p-10"><EmptyApplications createApplication={createApplication} /></div>}</CardContent></Card>
    <ApplicationDialog open={open} onOpenChange={setOpen} application={editing} onSubmit={data => editing ? updateApplication.mutate({ id: editing.id, data }, { onSuccess: () => setOpen(false) }) : createApplication.mutate(data, { onSuccess: () => setOpen(false) })} isSaving={createApplication.isPending || updateApplication.isPending} />
  </div>;
}

function ApplicationRow({ application, onEdit, onDelete, compact = false }: { application: ApplicationRecord; onEdit: () => void; onDelete: () => void; compact?: boolean }) {
  return <div className={`flex flex-col gap-4 ${compact ? "py-4" : "p-5 md:flex-row md:items-center"} md:justify-between`}>
    <div className="min-w-0 flex items-start gap-4"><div className="h-11 w-11 shrink-0 rounded-xl bg-[#eaf4f1] text-[#1d4f4a] grid place-items-center font-semibold">{application.company.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold truncate">{application.role}</p><Badge variant="outline" className={STATUS_STYLES[application.status]}>{application.status}</Badge>{application.resumeIds.length > 0 && <Badge variant="secondary" className="gap-1"><FileText className="h-3 w-3" />{application.resumeIds.length}</Badge>}</div><p className="text-sm text-muted-foreground mt-1">{application.company}{application.location ? ` · ${application.location}` : ""}{application.salaryRange ? ` · ${application.salaryRange}` : ""}</p><p className="text-xs text-muted-foreground mt-1">Applied record: {formatDate(application.applicationDate)}</p></div></div>
    {!compact && <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>{application.jobUrl && <a href={application.jobUrl} target="_blank" rel="noreferrer"><Button variant="ghost" size="icon" aria-label="Open job listing"><Link2 className="h-4 w-4" /></Button></a>}<Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { if (window.confirm("Remove this application?")) onDelete(); }} aria-label="Delete application"><Trash2 className="h-4 w-4" /></Button></div>}
  </div>;
}

function EmptyApplications({ createApplication }: { createApplication: SharedApplicationProps["createApplication"] }) {
  const [open, setOpen] = useState(false);
  return <div className="text-center py-8"><div className="mx-auto h-12 w-12 rounded-2xl bg-[#eaf4f1] text-[#1d4f4a] grid place-items-center"><BriefcaseBusiness className="h-6 w-6" /></div><h3 className="mt-4 font-semibold">Start with your next opportunity</h3><p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Save a role as soon as you find it, then make the next action visible.</p><Button onClick={() => setOpen(true)} className="mt-5 bg-[#1d4f4a] hover:bg-[#163e3a]"><Plus className="h-4 w-4" /> Add application</Button><ApplicationDialog open={open} onOpenChange={setOpen} onSubmit={data => createApplication.mutate(data, { onSuccess: () => setOpen(false) })} isSaving={createApplication.isPending} /></div>;
}

function ApplicationDialog({ open, onOpenChange, application, onSubmit, isSaving }: { open: boolean; onOpenChange: (open: boolean) => void; application?: ApplicationRecord | null; onSubmit: (data: ApplicationPayload) => void; isSaving: boolean }) {
  const [form, setForm] = useState<ApplicationFormState>(application ? toApplicationForm(application) : emptyApplicationForm());
  const key = application?.id ?? "new";
  const options = application ? allowedStatuses(application.status) : STATUSES;
  const submit = () => onSubmit({ ...form, applicationDate: new Date(`${form.applicationDate}T12:00:00`) });
  return <Dialog open={open} onOpenChange={next => { if (next) setForm(application ? toApplicationForm(application) : emptyApplicationForm()); onOpenChange(next); }}><DialogContent key={key} className="max-w-2xl max-h-[92vh] overflow-y-auto"><DialogHeader><DialogTitle>{application ? "Update application" : "Add an application"}</DialogTitle><DialogDescription>{application ? "Keep the status moving forward and update the opportunity details." : "Start with the information you have. You can enrich the record later."}</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><Field label="Company"><Input value={form.company} onChange={event => setForm({ ...form, company: event.target.value })} placeholder="Acme Inc." /></Field><Field label="Role"><Input value={form.role} onChange={event => setForm({ ...form, role: event.target.value })} placeholder="Data Analyst" /></Field><Field label="Location"><Input value={form.location} onChange={event => setForm({ ...form, location: event.target.value })} placeholder="Remote or city" /></Field><Field label="Salary range"><Input value={form.salaryRange} onChange={event => setForm({ ...form, salaryRange: event.target.value })} placeholder="$75k–$90k" /></Field><Field label="Application date"><Input type="date" value={form.applicationDate} onChange={event => setForm({ ...form, applicationDate: event.target.value })} /></Field><Field label="Status"><Select value={form.status} onValueChange={value => setForm({ ...form, status: value as Status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></Field><div className="sm:col-span-2"><Field label="Job URL"><Input value={form.jobUrl} onChange={event => setForm({ ...form, jobUrl: event.target.value })} placeholder="https://company.com/jobs/..." /></Field></div><div className="sm:col-span-2"><Field label="Notes"><Textarea value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} placeholder="Recruiter name, next action, interview context, or a reminder." rows={4} /></Field></div></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!form.company.trim() || !form.role.trim() || isSaving} onClick={submit} className="bg-[#1d4f4a] hover:bg-[#163e3a]">{isSaving && <Loader2 className="h-4 w-4 animate-spin" />}{application ? "Save changes" : "Add application"}</Button></DialogFooter></DialogContent></Dialog>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }

function ResumesPage({ applications, resumes, invalidateWorkspace }: { applications: ApplicationRecord[]; resumes: Array<{ id: number; fileName: string; mimeType: string; fileSize: number; storageUrl: string; resumeText: string | null; createdAt: Date }>; invalidateWorkspace: () => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const upload = trpc.jobTracker.resumes.upload.useMutation({ onSuccess: async () => { setFile(null); setResumeText(""); setSelectedApplications([]); await invalidateWorkspace(); toast.success("Resume stored securely and linked to your selected applications."); }, onError: error => toast.error(error.message) });
  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null);
  const uploadResume = async () => {
    if (!file) return toast.error("Choose a resume file first.");
    const extension = file.name.split(".").pop()?.toLowerCase();
    const mimeType = file.type || (extension === "pdf" ? "application/pdf" : extension === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "text/plain");
    const reader = new FileReader();
    reader.onload = () => upload.mutate({ fileName: file.name, mimeType: mimeType as "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "text/plain", fileBase64: String(reader.result), resumeText, applicationIds: selectedApplications });
    reader.readAsDataURL(file);
  };
  return <div className="page-enter max-w-7xl mx-auto grid gap-6 xl:grid-cols-[0.95fr_1.35fr]"><Card className="border-0 shadow-sm h-fit"><CardHeader><div className="h-10 w-10 rounded-xl bg-[#eaf4f1] text-[#1d4f4a] grid place-items-center"><UploadCloud className="h-5 w-5" /></div><CardTitle className="mt-3">Add a resume</CardTitle><CardDescription>Files are stored in S3. Paste the important resume text to enable skill matching—PDF and DOCX text extraction is intentionally not performed in the browser.</CardDescription></CardHeader><CardContent className="space-y-5"><Field label="Resume file"><Input type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={chooseFile} /></Field>{file && <p className="text-sm text-muted-foreground">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>}<Field label="Resume text for AI matching"><Textarea value={resumeText} onChange={event => setResumeText(event.target.value)} placeholder="Paste a concise professional summary, skills section, or relevant experience. This is the text the skill matcher can compare." rows={7} /></Field><div className="space-y-2"><Label>Associate with applications</Label><div className="max-h-40 overflow-y-auto rounded-lg border p-3 space-y-2">{applications.length ? applications.map(application => <label key={application.id} className="flex items-center gap-2 text-sm cursor-pointer"><Checkbox checked={selectedApplications.includes(application.id)} onCheckedChange={checked => setSelectedApplications(current => checked ? [...current, application.id] : current.filter(id => id !== application.id))} />{application.company} · {application.role}</label>) : <p className="text-sm text-muted-foreground">Create an application first, then attach this resume to it.</p>}</div></div><Button onClick={uploadResume} disabled={!file || upload.isPending} className="w-full bg-[#1d4f4a] hover:bg-[#163e3a]">{upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}Store resume</Button></CardContent></Card><Card className="border-0 shadow-sm"><CardHeader><CardTitle>Your resumes</CardTitle><CardDescription>Use a specific version for each role and keep match-ready text attached.</CardDescription></CardHeader><CardContent>{resumes.length ? <div className="divide-y">{resumes.map(resume => <div key={resume.id} className="py-4 flex items-center justify-between gap-4"><div className="flex items-start gap-3 min-w-0"><div className="h-10 w-10 shrink-0 rounded-xl bg-[#fcf1e8] text-[#b05c37] grid place-items-center"><FileText className="h-5 w-5" /></div><div className="min-w-0"><p className="font-medium truncate">{resume.fileName}</p><p className="text-sm text-muted-foreground">{(resume.fileSize / 1024).toFixed(0)} KB · {formatDate(resume.createdAt)}</p><p className="text-xs mt-1 text-muted-foreground">{resume.resumeText ? "Match-ready text saved" : "Add text in a future upload for AI matching"}</p></div></div><a href={resume.storageUrl} target="_blank" rel="noreferrer"><Button variant="outline" size="sm">Open</Button></a></div>)}</div> : <div className="py-16 text-center"><FilePlus2 className="h-8 w-8 mx-auto text-muted-foreground" /><p className="mt-3 font-medium">No resumes yet</p><p className="text-sm text-muted-foreground mt-1">Your files will appear here after a secure upload.</p></div>}</CardContent></Card></div>;
}

function SkillMatchPage({ applications, resumes }: { applications: ApplicationRecord[]; resumes: Array<{ id: number; fileName: string; resumeText: string | null }> }) {
  const [applicationId, setApplicationId] = useState<number | null>(applications[0]?.id ?? null);
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [manualSkills, setManualSkills] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const matchesQuery = trpc.jobTracker.skillMatching.listForApplication.useQuery({ applicationId: applicationId ?? 0 }, { enabled: Boolean(applicationId) });
  const utils = trpc.useUtils();
  const analyze = trpc.jobTracker.skillMatching.analyze.useMutation({ onSuccess: async () => { if (applicationId) await utils.jobTracker.skillMatching.listForApplication.invalidate({ applicationId }); toast.success("Skill match completed and saved to this application."); }, onError: error => toast.error(error.message) });
  const compatibleResumes = useMemo(() => resumes.filter(resume => resume.resumeText), [resumes]);
  const runMatch = () => { if (!applicationId) return toast.error("Select an application first."); analyze.mutate({ applicationId, resumeId, manualSkills, jobDescription }); };
  return <div className="page-enter max-w-7xl mx-auto grid gap-6 xl:grid-cols-[0.95fr_1.35fr]"><Card className="border-0 shadow-sm h-fit"><CardHeader><div className="h-10 w-10 rounded-xl bg-[#efeaff] text-[#6c5ce7] grid place-items-center"><Sparkles className="h-5 w-5" /></div><CardTitle className="mt-3">AI skill match</CardTitle><CardDescription>Compare skills you provide against a job description. The result is guidance for preparation, not a hiring decision.</CardDescription></CardHeader><CardContent className="space-y-5"><Field label="Application"><Select value={applicationId ? String(applicationId) : undefined} onValueChange={value => setApplicationId(Number(value))}><SelectTrigger><SelectValue placeholder="Select application" /></SelectTrigger><SelectContent>{applications.map(application => <SelectItem key={application.id} value={String(application.id)}>{application.company} · {application.role}</SelectItem>)}</SelectContent></Select></Field><Field label="Use an uploaded resume (optional)"><Select value={resumeId ? String(resumeId) : "manual"} onValueChange={value => setResumeId(value === "manual" ? null : Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Use manually entered skills</SelectItem>{compatibleResumes.map(resume => <SelectItem key={resume.id} value={String(resume.id)}>{resume.fileName}</SelectItem>)}</SelectContent></Select></Field><Field label="Skills or experience"><Textarea value={manualSkills} onChange={event => setManualSkills(event.target.value)} placeholder="Example: Python, SQL, pandas, Tableau, A/B testing, stakeholder communication..." rows={5} /></Field><Field label="Job description"><Textarea value={jobDescription} onChange={event => setJobDescription(event.target.value)} placeholder="Paste the responsibilities, required skills, and preferred qualifications from the job description." rows={9} /></Field><Button onClick={runMatch} disabled={!applicationId || jobDescription.trim().length < 80 || (!manualSkills.trim() && !resumeId) || analyze.isPending} className="w-full bg-[#1d4f4a] hover:bg-[#163e3a]">{analyze.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Analyze skill fit</Button></CardContent></Card><Card className="border-0 shadow-sm"><CardHeader><CardTitle>Saved analyses</CardTitle><CardDescription>Results are stored with the selected application so you can revise and compare your preparation strategy.</CardDescription></CardHeader><CardContent>{matchesQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : matchesQuery.data?.length ? <div className="space-y-5">{matchesQuery.data.map(match => <div key={match.id} className="rounded-2xl bg-[#fbfaf9] border p-5 space-y-4"><div className="flex items-center justify-between gap-3"><Badge variant="outline" className="bg-white">{match.sourceType === "resume" ? "Resume source" : "Manual skills"}</Badge><span className="text-xs text-muted-foreground">{formatDate(match.createdAt)}</span></div><p className="leading-relaxed text-sm">{match.summary}</p><div className="grid gap-4 md:grid-cols-2"><SkillList title="Matched strengths" items={listFromJson(match.matchedSkills)} tone="green" /><SkillList title="Skill gaps to address" items={listFromJson(match.missingSkills)} tone="orange" /><SkillList title="Evidence to emphasize" items={listFromJson(match.strengths)} tone="purple" /><SkillList title="Next actions" items={listFromJson(match.nextActions)} tone="slate" /></div></div>)}</div> : <div className="py-16 text-center"><Sparkles className="h-8 w-8 mx-auto text-muted-foreground" /><p className="mt-3 font-medium">Your analysis will appear here</p><p className="text-sm text-muted-foreground mt-1">Choose an application, add a job description, then run the first skill match.</p></div>}</CardContent></Card></div>;
}

function SkillList({ title, items, tone }: { title: string; items: string[]; tone: "green" | "orange" | "purple" | "slate" }) { const colors = { green: "bg-emerald-50 text-emerald-800 border-emerald-100", orange: "bg-orange-50 text-orange-800 border-orange-100", purple: "bg-violet-50 text-violet-800 border-violet-100", slate: "bg-slate-100 text-slate-800 border-slate-200" }; return <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{title}</p><div className="flex flex-wrap gap-2">{items.length ? items.map(item => <Badge key={item} variant="outline" className={colors[tone]}>{item}</Badge>) : <span className="text-sm text-muted-foreground">No items returned.</span>}</div></div>; }

function AnalyticsPage({ analytics }: { analytics: SharedApplicationProps["analytics"] }) { const chartData = analytics?.statusDistribution ?? []; return <div className="page-enter max-w-7xl mx-auto space-y-6"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b05c37]">Progress signals</p><h1 className="font-display text-4xl text-[#1d4f4a] mt-1">Analytics</h1><p className="text-muted-foreground mt-2">Use the numbers to improve the process, not to judge your progress.</p></div><div className="grid gap-4 sm:grid-cols-3"><MetricCard label="Total applications" value={String(analytics?.totalApplications ?? 0)} helper="All saved opportunities" icon={BriefcaseBusiness} /><MetricCard label="Response rate" value={`${analytics?.responseRate ?? 0}%`} helper="Interview, offer, or rejection ÷ active applications" icon={Target} /><MetricCard label="Interview conversion" value={`${analytics?.interviewConversionRate ?? 0}%`} helper="Interview or offer ÷ active applications" icon={CalendarDays} /></div><div className="grid gap-6 xl:grid-cols-2"><Card className="border-0 shadow-sm"><CardHeader><CardTitle>Applications by month</CardTitle><CardDescription>When opportunities entered your tracker.</CardDescription></CardHeader><CardContent className="h-72">{analytics?.applicationsByMonth.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.applicationsByMonth}><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: "#f7f3ef" }} /><Bar dataKey="count" fill="#1d4f4a" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer> : <ChartEmpty />}</CardContent></Card><Card className="border-0 shadow-sm"><CardHeader><CardTitle>Status distribution</CardTitle><CardDescription>Your current pipeline by exact workflow stage.</CardDescription></CardHeader><CardContent className="h-72">{analytics?.totalApplications ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="count" nameKey="status" innerRadius={58} outerRadius={90} paddingAngle={3}>{chartData.map((entry, index) => <Cell key={entry.status} fill={CHART_COLORS[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <ChartEmpty />}</CardContent></Card></div></div>; }

function ChartEmpty() { return <div className="h-full grid place-items-center text-center"><div><BarChart3 className="h-8 w-8 mx-auto text-muted-foreground" /><p className="font-medium mt-3">No application data yet</p><p className="text-sm text-muted-foreground mt-1">Charts populate as you record opportunities.</p></div></div>; }

function ProfilePage({ user, analytics, resumesCount }: { user: ReturnType<typeof useAuth>["user"]; analytics: SharedApplicationProps["analytics"]; resumesCount: number }) { return <div className="page-enter max-w-4xl mx-auto space-y-6"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b05c37]">Private workspace</p><h1 className="font-display text-4xl text-[#1d4f4a] mt-1">Profile</h1></div><Card className="border-0 shadow-sm"><CardContent className="p-7 flex flex-col sm:flex-row sm:items-center gap-5"><div className="h-16 w-16 rounded-2xl bg-[#1d4f4a] text-white grid place-items-center text-2xl font-semibold">{user?.name?.slice(0, 1).toUpperCase() ?? "U"}</div><div><h2 className="text-xl font-semibold">{user?.name || "Your career workspace"}</h2><p className="text-muted-foreground">{user?.email || "Authenticated with Manus OAuth"}</p><p className="text-sm text-muted-foreground mt-2">Your applications, resumes, and AI analyses are scoped to your account.</p></div></CardContent></Card><div className="grid gap-4 sm:grid-cols-3"><MetricCard label="Applications" value={String(analytics?.totalApplications ?? 0)} helper="Private opportunity records" icon={BriefcaseBusiness} /><MetricCard label="Resumes" value={String(resumesCount)} helper="Stored in S3" icon={FileText} /><MetricCard label="AI analyses" value="Private" helper="Processed server-side" icon={Sparkles} /></div><Card className="border-0 shadow-sm"><CardHeader><CardTitle>How your data is handled</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground leading-7"><p>Manus OAuth protects access to this workspace. Application and resume metadata are stored in the database; resume files live in S3. AI skill matching is processed on the server, and results are stored only for the selected application.</p></CardContent></Card></div>; }

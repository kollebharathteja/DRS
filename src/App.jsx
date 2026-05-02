import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { QRCodeCanvas } from "qrcode.react";
import {
  Archive,
  BarChart3,
  Check,
  ClipboardList,
  Download,
  LogIn,
  LogOut,
  Plus,
  QrCode,
  Save,
  Send,
  Star,
  Settings,
  Trash2,
} from "lucide-react";

const sessionKey = "review-system-owner-session";
const defaultOptions = ["Clear explanation", "Good examples", "Interactive session", "Useful materials"];
const defaultQuestions = [{ text: "Is this good?" }, { text: "Expectations reached?" }];

function getFormIdFromUrl() {
  return new URLSearchParams(window.location.search).get("form");
}

function getPublicAppOrigin() {
  return (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "");
}

export default function App() {
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(sessionKey));
  const [screen, setScreen] = useState(() => (getFormIdFromUrl() ? "public-form" : "landing"));
  const publicFormId = getFormIdFromUrl();
  const owner = useQuery(api.owners.viewer, sessionId ? { sessionId } : "skip");

  useEffect(() => {
    if (sessionId) localStorage.setItem(sessionKey, sessionId);
    else localStorage.removeItem(sessionKey);
  }, [sessionId]);

  if (screen === "public-form" && publicFormId) {
    return <PublicReviewForm formId={publicFormId} onHome={() => setScreen("landing")} />;
  }

  if (screen === "admin") {
    return owner ? (
      <AdminDashboard sessionId={sessionId} owner={owner} onLogout={() => setSessionId(null)} onHome={() => setScreen("landing")} />
    ) : (
      <OwnerAuth onAuthed={setSessionId} onHome={() => setScreen("landing")} />
    );
  }

  return <Landing onAdmin={() => setScreen("admin")} onDemoForm={() => setScreen("public-form")} />;
}

function Landing({ onAdmin, onDemoForm }) {
  return (
    <main className="min-h-screen bg-page text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-5">
        <header className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-teal-400 text-slate-950">
              <ClipboardList size={22} />
            </span>
            <span className="font-semibold">Dynamic Review System</span>
          </div>
          <button onClick={onAdmin} className="btn-secondary">
            <LogIn size={18} /> Owner Login
          </button>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="label">Convex powered review collection</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
              Build a review form, publish it, and collect student feedback through a QR code.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-300">
              Owners manage forms and live submissions. Students scan the QR and submit reviews without creating an account.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={onAdmin} className="btn-primary">
                <Settings size={18} /> Build Review Form
              </button>
              <button onClick={onDemoForm} className="btn-secondary">
                <Send size={18} /> Open QR Form Route
              </button>
            </div>
          </div>

          <div className="panel p-5">
            <div className="grid gap-3">
              {[
                ["Owner login", "Private dashboard for form building and submissions."],
                ["Instant publish", "A public URL and QR code are created for each active form."],
                ["Convex storage", "Forms and reviews are saved in Convex and update live."],
              ].map(([title, body]) => (
                <div className="rounded-md border border-white/10 bg-white/[.04] p-4" key={title}>
                  <h2 className="font-semibold">{title}</h2>
                  <p className="mt-1 text-sm text-slate-400">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function OwnerAuth({ onAuthed, onHome }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const register = useMutation(api.owners.register);
  const login = useMutation(api.owners.login);

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const sessionId = mode === "register" ? await register(form) : await login({ email: form.email, password: form.password });
      onAuthed(sessionId);
    } catch (err) {
      setError(err.message || "Unable to authenticate");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-page px-5 text-white">
      <form onSubmit={submit} className="panel w-full max-w-md p-6">
        <button type="button" onClick={onHome} className="mb-5 text-sm text-slate-400 hover:text-white">
          Back to website
        </button>
        <h1 className="text-3xl font-bold">{mode === "login" ? "Owner Login" : "Owner Register"}</h1>
        <p className="mt-2 text-sm text-slate-400">Login unlocks the private form builder and review dashboard.</p>

        <div className="mt-5 grid gap-3">
          {mode === "register" && (
            <input className="input" placeholder="Owner name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          )}
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>

        {error && <p className="mt-3 rounded-md border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

        <button className="btn-primary mt-5 w-full justify-center">
          <LogIn size={18} /> {mode === "login" ? "Login" : "Create Owner Account"}
        </button>
        <button type="button" className="mt-4 w-full text-sm font-semibold text-teal-300" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          Switch to {mode === "login" ? "register" : "login"}
        </button>
      </form>
    </main>
  );
}

function AdminDashboard({ sessionId, owner, onLogout, onHome }) {
  const forms = useQuery(api.forms.listMine, { sessionId }) || [];
  const activeForm = forms.find((form) => form.status === "published") || forms[0];
  const reviews = useQuery(api.reviews.listForOwner, { sessionId }) || [];
  const createForm = useMutation(api.forms.create);
  const publishForm = useMutation(api.forms.publish);
  const archiveForm = useMutation(api.forms.archive);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const selectedForm = forms.find((form) => form._id === selectedFormId) || activeForm;

  async function makeForm() {
    const id = await createForm({
      sessionId,
      title: "New Training Review",
      trainerName: "Trainer Name",
      presentationPrompt: "Presentation Quality",
      expectationPrompt: "Session met expectations",
      feedbackOptions: defaultOptions,
    });
    setSelectedFormId(id);
  }

  const formUrl = selectedForm ? `${getPublicAppOrigin()}${window.location.pathname}?form=${selectedForm._id}` : "";
  const isLocalhostQr = formUrl.includes("127.0.0.1") || formUrl.includes("localhost");

  return (
    <main className="min-h-screen bg-page px-5 py-6 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label">Welcome, {owner.name}</p>
            <h1 className="text-3xl font-bold">Owner Dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onHome} className="btn-secondary">Website</button>
            <button onClick={onLogout} className="btn-danger"><LogOut size={18} /> Logout</button>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <section className="panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Forms</h2>
              <button onClick={makeForm} className="icon-btn" title="Create form"><Plus size={18} /></button>
            </div>
            <div className="mt-4 grid gap-2">
              {forms.map((form) => (
                <button key={form._id} onClick={() => setSelectedFormId(form._id)} className={`form-row ${selectedForm?._id === form._id ? "active" : ""}`}>
                  <span>{form.title}</span>
                  <small>{form.status}</small>
                </button>
              ))}
              {!forms.length && <p className="text-sm text-slate-400">Create your first review form.</p>}
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
            {selectedForm ? (
              <FormBuilder form={selectedForm} sessionId={sessionId} onPublish={() => publishForm({ sessionId, formId: selectedForm._id })} />
            ) : (
              <div className="panel grid place-items-center p-8 text-slate-400">No form selected.</div>
            )}

            <aside className="panel p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold"><QrCode size={20} /> Publish QR</h2>
              {selectedForm ? (
                <>
                  <div className="mt-4 inline-block rounded-md bg-white p-3">
                    <QRCodeCanvas value={formUrl} size={190} />
                  </div>
                  <p className="mt-3 break-all text-sm text-slate-400">{formUrl}</p>
                  {isLocalhostQr && (
                    <p className="mt-3 rounded-md border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
                      This QR uses localhost. Phones and tablets need a LAN IP or deployed website URL.
                    </p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button className="btn-primary" onClick={() => publishForm({ sessionId, formId: selectedForm._id })}>
                      <Send size={18} /> Publish
                    </button>
                    <button className="btn-secondary" onClick={() => archiveForm({ sessionId, formId: selectedForm._id })}>
                      <Archive size={18} /> Archive
                    </button>
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-400">Create a form to generate a QR code.</p>
              )}
            </aside>
          </section>
        </div>

        <section className="panel mt-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold"><BarChart3 size={20} /> Live Reviews</h2>
            <ExportButton reviews={reviews} sessionId={sessionId} />
          </div>
          <ReviewTable reviews={reviews} />
        </section>
      </div>
    </main>
  );
}

function FormBuilder({ form, sessionId, onPublish }) {
  const updateForm = useMutation(api.forms.update);
  const addQuestion = useMutation(api.forms.addQuestion);
  const removeQuestion = useMutation(api.forms.removeQuestion);
  const [draft, setDraft] = useState(form);
  const [question, setQuestion] = useState("");
  const questions = form.questions?.length ? form.questions : defaultQuestions;

  useEffect(() => setDraft(form), [form._id]);

  function save() {
    updateForm({
      sessionId,
      formId: form._id,
      title: draft.title,
      trainerName: draft.trainerName,
      presentationPrompt: draft.presentationPrompt,
      expectationPrompt: draft.expectationPrompt,
    });
  }

  async function addRatingQuestion() {
    if (!question.trim()) return;
    await addQuestion({ sessionId, formId: form._id, question: question.trim() });
    setQuestion("");
  }

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Instant Form Builder</h2>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase text-slate-300">{form.status}</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="field-label">Form title<input className="input mt-1" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
        <label className="field-label">Trainer name<input className="input mt-1" value={draft.trainerName} onChange={(e) => setDraft({ ...draft, trainerName: e.target.value })} /></label>
        <label className="field-label">Presentation field<input className="input mt-1" value={draft.presentationPrompt} onChange={(e) => setDraft({ ...draft, presentationPrompt: e.target.value })} /></label>
        <label className="field-label">Expectation field<input className="input mt-1" value={draft.expectationPrompt} onChange={(e) => setDraft({ ...draft, expectationPrompt: e.target.value })} /></label>
      </div>

      <div className="mt-5">
        <p className="field-label">Rating scale questions</p>
        <div className="mt-2 grid gap-2">
          {questions.map((item, index) => (
            <div className="flex items-center justify-between rounded-md border border-white/10 bg-slate-950 p-3" key={`${item.text}-${index}`}>
              <span>{item.text}</span>
              <button className="text-slate-500 hover:text-rose-300" onClick={() => removeQuestion({ sessionId, formId: form._id, index })} title="Remove question">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input className="input" placeholder="Add question, e.g. Is this good?" value={question} onChange={(event) => setQuestion(event.target.value)} />
          <button className="btn-secondary" onClick={addRatingQuestion}><Plus size={18} /> Add</button>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-white/10 bg-slate-950 p-4 text-sm text-slate-300">
        Every student form includes these rating questions plus a required suggestions text area.
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button className="btn-secondary" onClick={save}><Save size={18} /> Save Structure</button>
        <button className="btn-primary" onClick={onPublish}><Send size={18} /> Publish</button>
      </div>
    </section>
  );
}

function PublicReviewForm({ formId, onHome }) {
  const form = useQuery(api.forms.getPublic, { formId });
  const submitReview = useMutation(api.reviews.submit);
  const [done, setDone] = useState(false);
  const [data, setData] = useState({
    studentName: "",
    contactNumber: "",
    email: "",
    trainerName: "",
    presentationQuality: "Excellent",
    answers: {},
    suggestions: "",
  });

  useEffect(() => {
    if (form?.trainerName) setData((current) => ({ ...current, trainerName: form.trainerName }));
  }, [form?.trainerName]);

  if (form === undefined) return <Loading label="Loading form" />;
  if (form === null) return <EmptyState title="Form unavailable" body="This review form is not published or no longer exists." onHome={onHome} />;
  if (done) return <EmptyState title="Thank you" body="Your review was submitted successfully." onHome={onHome} />;

  const questions = form.questions?.length ? form.questions : defaultQuestions;

  async function submit(event) {
    event.preventDefault();
    const questionAnswers = questions.map((item, index) => ({
      question: item.text,
      rating: data.answers[index] ?? 0,
    }));
    if (!data.studentName || !data.contactNumber || !data.email || !data.suggestions.trim() || questionAnswers.some((answer) => !answer.rating)) return;
    await submitReview({
      formId,
      studentName: data.studentName,
      contactNumber: data.contactNumber,
      email: data.email,
      trainerName: data.trainerName,
      presentationQuality: data.presentationQuality,
      questionAnswers,
      suggestions: data.suggestions,
    });
    setDone(true);
  }

  return (
    <main className="min-h-screen bg-page px-5 py-8 text-white">
      <form onSubmit={submit} className="panel mx-auto max-w-2xl p-5">
        <p className="label">Student Review</p>
        <h1 className="mt-2 text-3xl font-bold">{form.title}</h1>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input required className="input" placeholder="Student name" value={data.studentName} onChange={(e) => setData({ ...data, studentName: e.target.value })} />
          <input required className="input" placeholder="Contact number" value={data.contactNumber} onChange={(e) => setData({ ...data, contactNumber: e.target.value })} />
          <input required className="input md:col-span-2" type="email" placeholder="Email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
          <input className="input" placeholder="Trainer name" value={data.trainerName} onChange={(e) => setData({ ...data, trainerName: e.target.value })} />
          <select className="input" value={data.presentationQuality} onChange={(e) => setData({ ...data, presentationQuality: e.target.value })}>
            {["Excellent", "Good", "Average", "Needs improvement"].map((quality) => <option key={quality}>{quality}</option>)}
          </select>
        </div>

        <div className="mt-6 grid gap-4">
          {questions.map((item, index) => (
            <div key={`${item.text}-${index}`}>
              <p className="field-label">{item.text}</p>
              <div className="mt-2 flex gap-5 rounded-md bg-white p-3 text-slate-500">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    type="button"
                    className={`star-button ${data.answers[index] >= value ? "active" : ""}`}
                    onClick={() => setData({ ...data, answers: { ...data.answers, [index]: value } })}
                    key={value}
                  >
                    <Star fill="currentColor" size={28} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <label className="field-label">
            Suggestions / opinions
            <textarea
              required
              className="textarea mt-2"
              rows="4"
              placeholder="Enter your suggestions or opinions"
              value={data.suggestions}
              onChange={(event) => setData({ ...data, suggestions: event.target.value })}
            />
          </label>
          </div>

        <button className="btn-primary mt-6 w-full justify-center"><Check size={18} /> Submit Review</button>
      </form>
    </main>
  );
}

function ReviewTable({ reviews }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="text-slate-400">
          <tr>{["Student", "Contact", "Trainer", "Quality", "Ratings", "Suggestions", "Date"].map((head) => <th className="border-b border-white/10 py-3" key={head}>{head}</th>)}</tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review._id} className="border-b border-white/5">
              <td className="py-3">{review.studentName}<div className="text-slate-500">{review.email}</div></td>
              <td>{review.contactNumber}</td>
              <td>{review.trainerName}</td>
              <td>{review.presentationQuality}</td>
              <td className="text-amber-300">{formatAnswers(review)}</td>
              <td className="max-w-[280px] whitespace-normal">{review.suggestions ?? "-"}</td>
              <td>{new Date(review.submittedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!reviews.length && <p className="py-8 text-center text-slate-400">No reviews submitted yet.</p>}
    </div>
  );
}

function ExportButton({ reviews, sessionId }) {
  const [removeAfterExport, setRemoveAfterExport] = useState(false);
  const removeExported = useMutation(api.reviews.removeExported);

  async function exportCsv() {
    const header = ["Student", "Contact", "Email", "Trainer", "Quality", "Ratings", "Suggestions", "Submitted At"];
    const rows = reviews.map((review) => [
      review.studentName,
      review.contactNumber,
      review.email,
      review.trainerName,
      review.presentationQuality,
      formatAnswers(review),
      review.suggestions ?? "",
      new Date(review.submittedAt).toLocaleString(),
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: "student-reviews.csv",
    });
    link.click();
    URL.revokeObjectURL(link.href);

    if (removeAfterExport && reviews.length) {
      await removeExported({ sessionId, reviewIds: reviews.map((review) => review._id) });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" checked={removeAfterExport} onChange={(event) => setRemoveAfterExport(event.target.checked)} />
        Remove after export
      </label>
      <button className="btn-secondary" onClick={exportCsv}>
        <Download size={18} /> Export CSV
      </button>
    </div>
  );
}

function formatAnswers(review) {
  if (review.questionAnswers?.length) {
    return review.questionAnswers.map((answer) => `${answer.question}: ${answer.rating}/5`).join("; ");
  }

  if (review.feedbackRating) return `Feedback: ${review.feedbackRating}/5`;
  if (review.rating) return `Rating: ${review.rating}/5`;
  return "-";
}

function EmptyState({ title, body, onHome }) {
  return (
    <main className="grid min-h-screen place-items-center bg-page px-5 text-white">
      <div className="panel max-w-md p-6 text-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-slate-300">{body}</p>
        <button onClick={onHome} className="btn-secondary mt-5">Back</button>
      </div>
    </main>
  );
}

function Loading({ label }) {
  return <main className="grid min-h-screen place-items-center bg-page text-slate-300">{label}...</main>;
}

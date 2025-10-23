// MurMax Express® — Join App Page (Next.js App Router + Tailwind + reCAPTCHA v3)
// -----------------------------------------------------------------------------
// This single canvas contains two "files":
// 1) app/join/page.tsx  — Public Join page (client component)
// 2) app/api/join/route.ts — Serverless API to verify reCAPTCHA + handle submission
//
// Setup Instructions
// -----------------------------------------------------------------------------
// 1) Ensure Tailwind is configured in your Next.js project.
// 2) Add env vars in .env.local (replace with your real keys):
//    NEXT_PUBLIC_RECAPTCHA_SITE_KEY=YOUR_RECAPTCHA_V3_SITE_KEY
//    RECAPTCHA_SECRET_KEY=YOUR_RECAPTCHA_V3_SECRET
//    (Optional for email) SMTP_HOST=... SMTP_PORT=... SMTP_USER=... SMTP_PASS=...
// 3) Place the two code blocks below into the indicated paths.
// 4) `npm i nodemailer` (only if you enable the email portion).
// 5) `npm run dev` and visit http://localhost:3000/join
//
// Notes
// - Uses reCAPTCHA v3 (score-based, invisible). Action: 'join'.
// - On submit, client requests a token and posts to /api/join for verification.
// - If you prefer v2 checkbox, see the comment near the reCAPTCHA hook below.

// ============================================================================
// FILE: app/join/page.tsx (CLIENT)
// ============================================================================
"use client";
import React, { useEffect, useState } from "react";

export default function JoinPage() {
  const [form, setForm] = useState({
    role: "driver",
    fullName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    vehicleClass: "P1 - Car/Sedan",
    licenseType: "Regular (E)",
    endorsements: [] as string[],
    accept: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<null | { ok: boolean; msg: string }>(null);

  const VEHICLE_CLASSES = [
    "P1 - Car/Sedan",
    "P2 - SUV/Pickup",
    "P3 - Cargo Van/Sprinter",
    "P4 - 16–26 ft Box Truck",
    "P5 - Tractor-Trailer",
  ];
  const ENDORSEMENTS = ["Hazmat (H)", "Tanker (N)", "Doubles/Triples (T)", "TWIC"];

  const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!; // v3 site key

  // Load the reCAPTCHA v3 script
  useEffect(() => {
    if (!SITE_KEY) return;
    const id = "grecaptcha-script";
    if (document.getElementById(id)) return;
    const s = document.createElement("script");
    s.id = id;
    s.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    s.async = true;
    document.body.appendChild(s);
  }, [SITE_KEY]);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type, checked } = e.target as HTMLInputElement & HTMLSelectElement;
    if (name === "endorsements") {
      setForm((f) => ({
        ...f,
        endorsements: checked ? [...new Set([...f.endorsements, value])] : f.endorsements.filter((v) => v !== value),
      }));
    } else if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.accept) {
      alert("Please accept the terms to continue.");
      return;
    }
    setSubmitting(true);

    try {
      // Get v3 token for action 'join'
      // If using v2 checkbox instead: render <div className="g-recaptcha" data-sitekey=... /> and read the response.
      const token = await new Promise<string>((resolve, reject) => {
        if (!(window as any).grecaptcha) return resolve("");
        (window as any).grecaptcha.ready(() => {
          (window as any).grecaptcha
            .execute(SITE_KEY, { action: "join" })
            .then((t: string) => resolve(t))
            .catch(reject);
        });
      });

      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form, recaptchaToken: token, action: "join" }),
      });
      const data = await res.json();
      setSubmitted({ ok: res.ok && data.success, msg: data.message || (res.ok ? "Submitted" : "Failed") });
    } catch (err: any) {
      setSubmitted({ ok: false, msg: err?.message || "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-red-600" aria-hidden />
            <div className="leading-tight">
              <h1 className="font-extrabold tracking-tight text-lg">MurMax Express®</h1>
              <p className="text-xs text-neutral-600">Rideshare for Logistics™</p>
            </div>
          </div>
          <a href="#apply" className="px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold shadow-sm hover:bg-red-700">Join Now</a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Join the Movement. <span className="text-red-600">Drive MurMax®.</span>
            </h2>
            <p className="mt-4 text-lg text-neutral-700">
              On‑demand logistics across America: flexible schedules, instant/weekly pay, and a safety‑first culture.
            </p>
            <ul className="mt-6 space-y-2 text-neutral-800">
              <li>• Accept jobs in the app with live navigation & ePOD</li>
              <li>• Vehicle classes P1–P5: Car to Tractor‑Trailer</li>
              <li>• Support 24/7 and nationwide network</li>
            </ul>
            <div className="mt-6 flex gap-3">
              <a href="#apply" className="px-4 py-3 rounded-xl bg-red-600 text-white font-semibold shadow hover:bg-red-700">Start Application</a>
              <a href="#how" className="px-4 py-3 rounded-xl border border-neutral-300 text-neutral-900 font-semibold hover:bg-neutral-50">See How it Works</a>
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-neutral-200 shadow-sm bg-white">
            <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 grid place-items-center">
              <span className="text-neutral-500">Promo / map or fleet image</span>
            </div>
            <p className="mt-3 text-xs text-neutral-500">Maximum Power. Maximum Purpose.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-neutral-200 bg-neutral-50/60">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h3 className="text-2xl md:text-3xl font-bold">How it works</h3>
          <div className="mt-8 grid md:grid-cols-4 gap-6">
            {[
              { t: "Apply", d: "Tell us about you, your city, and vehicle." },
              { t: "Verify", d: "Background & MVR checks. Upload docs securely." },
              { t: "Activate", d: "Get your zone, download the app, go online." },
              { t: "Drive & Earn", d: "Accept loads, upload ePOD, instant/weekly pay." },
            ].map((s, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-red-600 text-white grid place-items-center font-bold">{i + 1}</div>
                <h4 className="mt-4 font-semibold">{s.t}</h4>
                <p className="text-sm text-neutral-700 mt-1">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apply */}
      <section id="apply">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <div className="mb-6">
            <h3 className="text-2xl md:text-3xl font-bold">Apply to join MurMax Express®</h3>
            <p className="text-neutral-700 mt-1">Fill out the form. A coordinator will follow up with next steps.</p>
          </div>

          {submitted ? (
            <div className={`p-6 rounded-2xl border ${submitted.ok ? "border-green-300 bg-green-50 text-green-900" : "border-red-300 bg-red-50 text-red-900"}`}>
              <p className="font-semibold">{submitted.ok ? "Application received." : "There was a problem submitting."}</p>
              <p className="text-sm mt-1">{submitted.msg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="text-sm font-semibold">Role</label>
                <div className="mt-2 flex gap-3 text-sm">
                  {[
                    { label: "Driver", value: "driver" },
                    { label: "Dispatcher", value: "dispatcher" },
                    { label: "Shipper (get a quote)", value: "shipper" },
                  ].map((r) => (
                    <label key={r.value} className={`px-3 py-2 rounded-xl border cursor-pointer ${form.role === r.value ? "border-red-600 bg-red-50" : "border-neutral-300"}`}>
                      <input type="radio" name="role" value={r.value} className="hidden" onChange={onChange} checked={form.role === r.value} />
                      {r.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Full Name</label>
                <input required name="fullName" value={form.fullName} onChange={onChange} className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600" placeholder="Dr. Alexander MurMax" />
              </div>
              <div>
                <label className="text-sm font-semibold">Email</label>
                <input required type="email" name="email" value={form.email} onChange={onChange} className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600" placeholder="you@murmaxexpress.com" />
              </div>

              <div>
                <label className="text-sm font-semibold">Phone</label>
                <input required name="phone" value={form.phone} onChange={onChange} className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600" placeholder="1-844-MURMAXX" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-sm font-semibold">City</label>
                  <input required name="city" value={form.city} onChange={onChange} className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600" placeholder="Clewiston" />
                </div>
                <div>
                  <label className="text-sm font-semibold">State</label>
                  <input required name="state" value={form.state} onChange={onChange} className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600" placeholder="FL" />
                </div>
              </div>

              {form.role !== "shipper" && (
                <>
                  <div>
                    <label className="text-sm font-semibold">Vehicle Class</label>
                    <select name="vehicleClass" value={form.vehicleClass} onChange={onChange} className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600">
                      {VEHICLE_CLASSES.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">License Type</label>
                    <select name="licenseType" value={form.licenseType} onChange={onChange} className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600">
                      {["Regular (E)", "Commercial (CDL)", "Chauffeur", "Learner", "Other"].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold">Endorsements</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ENDORSEMENTS.map((e) => (
                        <label key={e} className={`px-3 py-2 rounded-xl border text-sm cursor-pointer ${form.endorsements.includes(e) ? "border-red-600 bg-red-50" : "border-neutral-300"}`}>
                          <input type="checkbox" className="hidden" name="endorsements" value={e} checked={form.endorsements.includes(e)} onChange={onChange} />
                          {e}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="col-span-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="accept" checked={form.accept} onChange={onChange} className="h-4 w-4" />
                  I agree to the Terms of Service and Privacy Policy.
                </label>
                <button disabled={submitting} className="px-5 py-3 rounded-xl bg-red-600 text-white font-semibold shadow hover:bg-red-700 disabled:opacity-60">
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-neutral-600">
          <p>MurMax Express® • 14725 Center Ave, Clewiston, FL 33440 • 1‑844‑MURMAXX • info@murmaxexpress.com • www.MurMaxExpress.com</p>
          <p className="mt-2">© 2025 MurMax Express®. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// FILE: app/api/join/route.ts (SERVER)
// ============================================================================
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { form, recaptchaToken, action } = body || {};

    // Verify reCAPTCHA v3
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) return Response.json({ success: false, message: "Server missing reCAPTCHA secret" }, { status: 500 });

    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: recaptchaToken || "" }),
    });
    const verifyData = await verifyRes.json();

    // Basic checks for v3: success + score threshold + (optional) action
    if (!verifyData.success || (typeof verifyData.score === "number" && verifyData.score < 0.5)) {
      return Response.json({ success: false, message: "Failed reCAPTCHA verification" }, { status: 400 });
    }

    // TODO: Persist to your DB / send email. Example logging only:
    // Optionally send email via Nodemailer (requires SMTP env vars)
    // const nodemailer = await import("nodemailer");
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: Number(process.env.SMTP_PORT || 587),
    //   secure: false,
    //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // });
    // await transporter.sendMail({
    //   from: 'MurMax Express <no-reply@murmaxexpress.com>',
    //   to: 'onboarding@murmaxexpress.com',
    //   subject: 'New Join Application',
    //   text: JSON.stringify(form, null, 2),
    // });

    return Response.json({ success: true, message: "Application received. Our team will contact you." });
  } catch (err: any) {
    return Response.json({ success: false, message: err?.message || "Unexpected error" }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// OPTIONAL: Plain HTML Export (drop into /public/join.html)
// - Replace YOUR_RECAPTCHA_V3_SITE_KEY in the script URL.
// - Post to a server endpoint that verifies the token (similar to route.ts).
/*
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Join MurMax Express®</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;color:#111}
    .wrap{max-width:860px;margin:0 auto;padding:24px}
    .btn{background:#e4002b;color:#fff;border-radius:12px;padding:12px 16px;border:0;cursor:pointer}
    input,select{width:100%;padding:10px;border:1px solid #ccc;border-radius:12px}
    .grid{display:grid;gap:16px;grid-template-columns:1fr}
    @media(min-width:800px){.grid{grid-template-columns:1fr 1fr}}
  </style>
  <script src="https://www.google.com/recaptcha/api.js?render=YOUR_RECAPTCHA_V3_SITE_KEY"></script>
  <script>
    async function submitJoin(e){
      e.preventDefault();
      const token = await grecaptcha.execute('YOUR_RECAPTCHA_V3_SITE_KEY', {action:'join'});
      const payload = Object.fromEntries(new FormData(e.target).entries());
      payload.recaptchaToken = token; payload.action='join';
      const res = await fetch('/api/join', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      const data = await res.json();
      alert(data.message || (res.ok? 'Submitted' : 'Failed'));
    }
  </script>
</head>
<body>
  <div class="wrap">
    <h1>Join MurMax Express®</h1>
    <p>Rideshare for Logistics™ — Join the Movement. Drive MurMax®.</p>
    <form class="grid" onsubmit="submitJoin(event)">
      <div>
        <label>Full Name</label>
        <input name="fullName" required />
      </div>
      <div>
        <label>Email</label>
        <input type="email" name="email" required />
      </div>
      <div>
        <label>Phone</label>
        <input name="phone" required />
      </div>
      <div>
        <label>City</label>
        <input name="city" required />
      </div>
      <div>
        <label>State</label>
        <input name="state" required />
      </div>
      <button class="btn">Submit Application</button>
    </form>
  </div>
</body>
</html>
*/

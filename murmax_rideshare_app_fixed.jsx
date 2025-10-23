// MurMax Express® Rideshare — Single-File TSX (Stable Build, JSX balanced)
// Fix: closed unterminated string in <tr className="border-t border-white/10"> and ensured all JSX tags are balanced.
// This file compiles in React/TS without external UI libs.

import React, { useState, createContext, useContext } from "react";

/********************
 * Minimal UI Kit (no external libs)
 *******************/
export function Button(
  { className = "", variant, children, ...rest }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default"|"outline" }
){
  const base = "px-3 py-2 rounded-xl text-sm transition";
  const style = variant === "outline" ? "border border-white/20 text-white bg-transparent" : "bg-red-600 text-white hover:bg-red-700";
  return <button className={`${base} ${style} ${className}`} {...rest}>{children}</button>;
}
export function Card({ className = "", children, ...rest }: React.HTMLAttributes<HTMLDivElement>){
  return <div className={`rounded-2xl border border-white/10 ${className}`} {...rest}>{children}</div>;
}
export function CardContent({ className = "", children, ...rest }: React.HTMLAttributes<HTMLDivElement>){
  return <div className={`p-4 ${className}`} {...rest}>{children}</div>;
}
export function Input({ className = "", ...rest }: React.InputHTMLAttributes<HTMLInputElement>){
  return <input className={`w-full rounded-xl px-3 py-2 bg-zinc-900/60 border border-white/10 outline-none ${className}`} {...rest}/>;
}
export function Textarea({ className = "", ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>){
  return <textarea className={`w-full rounded-xl px-3 py-2 bg-zinc-900/60 border border-white/10 outline-none ${className}`} {...rest}/>;
}
export function Progress({ value = 0, className = "" }: { value?: number; className?: string }){
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full h-2 bg-zinc-800 rounded-full ${className}`}>
      <div className="h-2 bg-red-600 rounded-full" style={{ width: `${v}%` }} />
    </div>
  );
}

/********************
 * Tabs (no external deps)
 *******************/
const TabsContext = createContext<{ value: string; onChange: (v:string)=>void }>({ value: "home", onChange: ()=>{} });
export function Tabs({ value, onValueChange, className = "", children }:{ value:string; onValueChange:(v:string)=>void; className?:string; children:React.ReactNode }){
  return <div className={className}><TabsContext.Provider value={{ value, onChange: onValueChange }}>{children}</TabsContext.Provider></div>;
}
export function TabsList({ className = "", children }:{ className?:string; children:React.ReactNode }){
  return <div className={`rounded-2xl p-1 ${className}`}>{children}</div>;
}
export function TabsTrigger({ value, className = "", children }:{ value:string; className?:string; children:React.ReactNode }){
  const { value: cur, onChange } = useContext(TabsContext);
  const active = cur === value;
  return <button onClick={()=>onChange(value)} className={`px-3 py-2 text-sm rounded-xl ${active?"bg-red-600 text-white":"text-white/80 hover:text-white"} ${className}`}>{children}</button>;
}
export function TabsContent({ value, children }:{ value:string; children:React.ReactNode }){
  const { value: cur } = useContext(TabsContext);
  if(cur !== value) return null;
  return <div>{children}</div>;
}

/********************
 * Types
 *******************/
export type LoadStatus = "Posted" | "Matched" | "Dispatched" | "Picked" | "Delivered";
export interface Load { id: string; route: string; status: LoadStatus; offer: number | string; token: string; }
export interface EBOLItem { desc: string; qty: number; weight: number; nmfc?: string; class?: string; }
export interface EBOL { shipper: string; consignee: string; items: EBOLItem[]; notes?: string; totalWeight: number; status: "Signed" | "Pending"; signedAt?: string; }
export interface DriverSplit { lead: number; co: number; }
export interface Invoice { invoiceNo: string; loadId: string; shipper: string; consignee: string; items: EBOLItem[]; totalWeight: number; subtotal: number; driverSplit: { leadPct:number; coPct:number; leadAmt:number; coAmt:number }; createdAt: string; }
export interface WebhookStages { matched:boolean; picked:boolean; delivered:boolean }
export interface WebhookConfig { slack?:string; email?:string; sms?:string; stages:WebhookStages; test?:boolean }
export interface AlertPayloads { slack:{ text:string }; email:{ to:string; subject:string; body:string }; sms:{ to:string; body:string } }

/********************
 * Lib: alerts
 *******************/
export function buildAlertPayloads(stage: LoadStatus, load: Load, shareUrl: string, email?: string, sms?: string): AlertPayloads{
  const amount = Number(load.offer).toFixed(2);
  return {
    slack: { text: `🚚 ${stage} • ${load.id} • ${load.route} • $${amount}\nTrack: ${shareUrl}` },
    email: { to: email || "ops@murmaxexpress.com", subject: `[${stage}] ${load.id} — ${load.route}` , body: `Status: ${stage}\nLoad: ${load.id}\nRoute: ${load.route}\nOffer: $${amount}\nTrack: ${shareUrl}` },
    sms: { to: sms || "+18446876299", body: `${stage}: ${load.id} • ${load.route} • $${amount} • ${shareUrl}` }
  };
}

/********************
 * Shared UI bits
 *******************/
function StatusBadge({ status }:{ status: LoadStatus }){
  const map:Record<string,string> = { Posted:"bg-zinc-700 text-white", Matched:"bg-blue-600/80", Dispatched:"bg-purple-600/80", Picked:"bg-amber-600/80", Delivered:"bg-green-600/80" };
  return <span className={`text-xs px-2 py-1 rounded-full ${map[status]||'bg-zinc-700'}`}>{status}</span>;
}
function Timeline({ stage = 1 }:{ stage?: number }){
  const steps=["Posted","Matched","Dispatched","Picked","Delivered"];
  return (<div className="flex items-center justify-between gap-2">{steps.map((s,i)=>(<div key={s} className="flex-1"><div className={`h-2 rounded-full ${i<=stage? 'bg-red-600':'bg-zinc-700'}`}/><div className="text-[10px] text-gray-400 mt-1">{s}</div></div>))}</div>);
}
function DocRow({ name, status='Pending' }:{ name:string; status?:string }){
  return (<div className="flex items-center justify-between py-2 border-b border-white/5"><div className="text-sm">{name}</div><div className="text-xs text-gray-400">{status}</div><div className="flex gap-2"><Button variant="outline" className="border-white/20 text-white">View</Button><Button className="bg-red-600 hover:bg-red-700">Upload</Button></div></div>);
}

/********************
 * Feature Components
 *******************/
function LiveMap(): JSX.Element{
  return (
    <Card className="bg-zinc-900 mt-4 p-4"><CardContent>
      <div className="text-sm text-gray-400">Live Map & Route</div>
      <div className="mt-2 h-48 rounded-xl border border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(255,0,0,0.25),transparent_40%),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.08),transparent_45%)]"/>
    </CardContent></Card>
  );
}

function SplitPayEditor({ total = 1250, primaryName = "Primary Driver", onSave }:{ total?: number; primaryName?: string; onSave?(leadPct:number, coPct:number): void }): JSX.Element{
  const [hasCoDriver, setHasCoDriver] = useState(true);
  const [d1, setD1] = useState(60);
  const [d2, setD2] = useState(40);
  const sum = hasCoDriver ? d1 + d2 : d1;
  const p1 = ((total * d1) / 100).toFixed(2);
  const p2 = hasCoDriver ? ((total * d2) / 100).toFixed(2) : "0.00";
  const isValid = sum === 100 && d1 >= 0 && d2 >= 0;
  return (
    <Card className="bg-zinc-800/60"><CardContent className="p-4 space-y-3">
      <div className="flex items-center justify-between"><div className="font-semibold">Split Pay</div><div className={`text-xs px-2 py-1 rounded-full ${isValid?"bg-green-600/30 text-green-300":"bg-red-600/30 text-red-300"}`}>{isValid?"Locked at 100%":`Total: ${sum}%`}</div></div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-300 mb-1">{primaryName}</div>
          <div className="flex items-center gap-2"><Input type="number" value={d1} onChange={e=>setD1(Math.max(0, Math.min(100, Number(e.target.value))))} className="bg-black/30 w-24"/><span className="text-sm text-gray-400">%</span><div className="ml-auto text-green-400 font-semibold">${p1}</div></div>
          <Progress value={d1} className="mt-2"/>
        </div>
        {hasCoDriver && (
          <div>
            <div className="text-sm text-gray-300 mb-1">Co‑Driver</div>
            <div className="flex items-center gap-2"><Input type="number" value={d2} onChange={e=>setD2(Math.max(0, Math.min(100, Number(e.target.value))))} className="bg-black/30 w-24"/><span className="text-sm text-gray-400">%</span><div className="ml-auto text-green-400 font-semibold">${p2}</div></div>
            <Progress value={d2} className="mt-2"/>
          </div>
        )}
      </div>
      {onSave && <div className="flex gap-2"><Button className="bg-red-600 hover:bg-red-700" onClick={()=>onSave(d1, hasCoDriver?d2:0)}>Save Split</Button></div>}
    </CardContent></Card>
  );
}

function VerificationUploader(): JSX.Element{
  const [files, setFiles] = useState<Record<string, File | null>>({ cdlFront:null, cdlBack:null, insurance:null, med:null });
  const DocTile = ({ label, keyName }:{ label:string; keyName:string }) => (
    <Card className="bg-black/30"><CardContent className="p-4">
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <Input type="file" accept="image/*,application/pdf" className="bg-black/30" onChange={e=>setFiles(prev=>({ ...prev, [keyName]: (e.target as HTMLInputElement)?.files?.[0] || null }))}/>
      <div className="text-xs text-gray-500 mt-2 h-5">{files[keyName]?.name || "No file selected"}</div>
      <div className="text-xs text-gray-400">Status: <span className="text-yellow-300">Pending verification</span></div>
    </CardContent></Card>
  );
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <DocTile label="CDL — Front" keyName="cdlFront"/>
        <DocTile label="CDL — Back" keyName="cdlBack"/>
        <DocTile label="Insurance Certificate (COI)" keyName="insurance"/>
        <DocTile label="DOT Medical Card" keyName="med"/>
      </div>
      <div className="flex gap-3"><Button className="bg-red-600 hover:bg-red-700">Submit for Review</Button><Button variant="outline" className="border-white/20 text-white">Save Draft</Button></div>
    </div>
  );
}

function EBOLBuilder({ seed, onSigned }:{ seed: Partial<EBOL>; onSigned:(ebol:EBOL)=>void }){
  const [shipper, setShipper] = useState(seed.shipper || "NeuralSyn Labs, Corp.");
  const [consignee, setConsignee] = useState(seed.consignee || "MurMax Express® ATL Hub");
  const [items, setItems] = useState<EBOLItem[]>(seed.items || [{ desc:"Palletized electronics", qty:10, weight:12000, nmfc:"116030", class:"70" }]);
  const [notes, setNotes] = useState(seed.notes || "Handle with care. No stack.");
  const totalW = items.reduce((a,c)=>a + Number(c.weight||0), 0);
  return (
    <Card className="bg-black/30"><CardContent className="p-4 space-y-4">
      <div className="font-semibold">Electronic Bill of Lading (eBOL)</div>
      <div className="grid md:grid-cols-2 gap-3"><Input value={shipper} onChange={e=>setShipper(e.target.value)} placeholder="Shipper" className="bg-black/30"/><Input value={consignee} onChange={e=>setConsignee(e.target.value)} placeholder="Consignee" className="bg-black/30"/></div>
      <div className="overflow-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/60">
            <tr>
              <th className="text-left p-2">Description</th>
              <th className="text-left p-2">Qty</th>
              <th className="text-left p-2">Weight (lb)</th>
              <th className="text-left p-2">NMFC</th>
              <th className="text-left p-2">Class</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row,i)=>(
              <tr key={i} className="border-t border-white/10">
                <td className="p-2"><Input value={row.desc} onChange={e=>setItems(v=>v.map((r,ix)=>ix===i?{...r, desc:e.target.value}:r))} className="bg-black/30"/></td>
                <td className="p-2 w-24"><Input type="number" value={row.qty} onChange={e=>setItems(v=>v.map((r,ix)=>ix===i?{...r, qty:Number(e.target.value)}:r))} className="bg-black/30"/></td>
                <td className="p-2 w-28"><Input type="number" value={row.weight} onChange={e=>setItems(v=>v.map((r,ix)=>ix===i?{...r, weight:Number(e.target.value)}:r))} className="bg-black/30"/></td>
                <td className="p-2 w-28"><Input value={row.nmfc} onChange={e=>setItems(v=>v.map((r,ix)=>ix===i?{...r, nmfc:e.target.value}:r))} className="bg-black/30"/></td>
                <td className="p-2 w-24"><Input value={row.class} onChange={e=>setItems(v=>v.map((r,ix)=>ix===i?{...r, class:e.target.value}:r))} className="bg-black/30"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2"><Button variant="outline" className="border-white/20 text-white" onClick={()=>setItems(v=>[...v,{ desc:"", qty:1, weight:0, nmfc:"", class:"" }])}>Add Line</Button><div className="ml-auto text-sm text-gray-300">Total Weight: <span className="font-semibold">{totalW.toLocaleString()} lb</span></div></div>
      <Textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Special Instructions" className="bg-black/30"/>
      <div className="grid md:grid-cols-2 gap-3"><div className="space-y-2"><div className="text-xs text-gray-400">Shipper Signature</div><div className="h-24 rounded-xl bg-zinc-800/60 flex items-center justify-center text-xs text-gray-500">Signature Pad</div></div><div className="space-y-2"><div className="text-xs text-gray-400">Carrier Signature</div><div className="h-24 rounded-xl bg-zinc-800/60 flex items-center justify-center text-xs text-gray-500">Signature Pad</div></div></div>
      <div className="flex gap-2"><Button className="bg-red-600 hover:bg-red-700" onClick={()=> onSigned({ shipper, consignee, items, notes, totalWeight: totalW, status:"Signed", signedAt: new Date().toISOString() })}>Mark eBOL as Signed</Button><Button variant="outline" className="border-white/20 text-white">Export PDF</Button></div>
    </CardContent></Card>
  );
}

function PODCapture(): JSX.Element{
  const [file,setFile] = useState<File|null>(null);
  const [geo,setGeo] = useState("Not captured");
  const [name,setName] = useState("");
  return (
    <Card className="bg-black/30"><CardContent className="p-4 space-y-3">
      <div className="font-semibold">Proof of Delivery (POD)</div>
      <Input type="file" accept="image/*,application/pdf" onChange={e=>setFile((e.target as HTMLInputElement)?.files?.[0]||null)} className="bg-black/30"/>
      <div className="grid md:grid-cols-2 gap-3"><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Receiver / Signer Name" className="bg-black/30"/><div className="flex gap-2"><Input readOnly value={geo} className="bg-black/30"/><Button className="bg-red-600 hover:bg-red-700" onClick={()=>setGeo("33.7488, -84.3877 (Atlanta, GA) • geo/time")}>Geo‑Stamp</Button></div></div>
      <div className="h-24 rounded-xl bg-zinc-800/60 flex items-center justify-center text-xs text-gray-500">Signature Pad</div>
      <div className="text-xs text-gray-400">Attach photos of delivered freight, BOL with receiver signature, and dock door.</div>
      <div className="flex gap-2"><Button className="bg-red-600 hover:bg-red-700">Submit POD</Button>{file && <div className="text-xs text-gray-300">Selected: {file.name}</div>}</div>
    </CardContent></Card>
  );
}

function ShareLinkControls({ url }:{ url:string }): JSX.Element{
  const [expires, setExpires] = useState("24");
  const [pin, setPin] = useState("");
  const [perm, setPerm] = useState<'view'|'upload'>('view');
  function fireRegenerate(reason:string){ try { window.dispatchEvent(new CustomEvent('mmx:regenerate-link',{ detail:{ reason } })); } catch {} }
  function onPinChange(v:string){ setPin(v); if(v && v.length>0){ fireRegenerate('pin_set'); } else { fireRegenerate('pin_cleared'); } }
  function onPermChange(v:'view'|'upload'){ setPerm(v); fireRegenerate('perm_change'); }
  return (
    <Card className="bg-black/30"><CardContent className="p-4 space-y-3">
      <div className="font-semibold">Share Link Controls</div>
      <div className="text-sm text-gray-300">{url}</div>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="flex items-center gap-2"><span className="text-sm text-gray-400">Expires in</span><Input value={expires} onChange={e=>setExpires((e.target as HTMLInputElement).value)} className="bg-black/30"/><span className="text-sm text-gray-400">hours</span></div>
        <Input placeholder="Optional PIN" value={pin} onChange={e=>onPinChange((e.target as HTMLInputElement).value)} className="bg-black/30"/>
        <div className="flex items-center gap-2"><Button variant={perm==='view'?"default":"outline"} className={perm==='view'?"bg-red-600 hover:bg-red-700":"border-white/20 text-white"} onClick={()=>onPermChange('view')}>View‑only</Button><Button variant={perm==='upload'?"default":"outline"} className={perm==='upload'?"bg-red-600 hover:bg-red-700":"border-white/20 text-white"} onClick={()=>onPermChange('upload')}>Allow Docs Upload</Button></div>
      </div>
      <div className="flex gap-2"><Button className="bg-red-600 hover:bg-red-700" onClick={()=>fireRegenerate('manual_click')}>Regenerate Link</Button><Button variant="outline" className="border-white/20 text-white">Disable Link</Button></div>
    </CardContent></Card>
  );
}

function WebhookSettings({ value, onChange }:{ value?:WebhookConfig; onChange?:(cfg:WebhookConfig)=>void }): JSX.Element{
  const stored = (typeof window !== 'undefined') ? window.localStorage.getItem('mm_webhooks') : null;
  const initial: WebhookConfig = value || (stored ? (()=>{ try { return JSON.parse(stored!); } catch { return { stages:{matched:true,picked:true,delivered:true} }; })() : { stages:{matched:true,picked:true,delivered:true} });
  const [slack,setSlack] = useState(initial.slack || "");
  const [email,setEmail] = useState(initial.email || "ops@murmaxexpress.com");
  const [sms,setSms] = useState(initial.sms || "+1 844 687 6299");
  const [stages,setStages] = useState<WebhookStages>(initial.stages || { matched:true, picked:true, delivered:true });
  function save(){ const cfg = { slack,email,sms,stages } as WebhookConfig; try { window.localStorage.setItem('mm_webhooks', JSON.stringify(cfg)); } catch {} ; try { window.dispatchEvent(new CustomEvent('mmx:toast',{ detail:{ message:'Alerts saved' } })); } catch {} ; onChange && onChange(cfg); }
  return (
    <Card className="bg-black/30"><CardContent className="p-4 space-y-3">
      <div className="font-semibold">Status Webhooks & Alerts</div>
      <div className="grid md:grid-cols-2 gap-3"><Input placeholder="Slack Incoming Webhook URL" value={slack} onChange={e=>setSlack((e.target as HTMLInputElement).value)} className="bg-black/30"/><Input placeholder="Alert Email" value={email} onChange={e=>setEmail((e.target as HTMLInputElement).value)} className="bg-black/30"/><Input placeholder="Alert SMS" value={sms} onChange={e=>setSms((e.target as HTMLInputElement).value)} className="bg-black/30"/></div>
      <div className="flex flex-wrap gap-2 text-sm"><Button variant={stages.matched?"default":"outline"} className={stages.matched?"bg-red-600 hover:bg-red-700":"border-white/20 text-white"} onClick={()=>setStages(s=>({ ...s, matched:!s.matched }))}>Matched</Button><Button variant={stages.picked?"default":"outline"} className={stages.picked?"bg-red-600 hover:bg-red-700":"border-white/20 text-white"} onClick={()=>setStages(s=>({ ...s, picked:!s.picked }))}>Picked</Button><Button variant={stages.delivered?"default":"outline"} className={stages.delivered?"bg-red-600 hover:bg-red-700":"border-white/20 text-white"} onClick={()=>setStages(s=>({ ...s, delivered:!s.delivered }))}>Delivered</Button></div>
      <div className="flex gap-2"><Button className="bg-red-600 hover:bg-red-700" onClick={save}>Save Alerts</Button><Button variant="outline" className="border-white/20 text-white" onClick={()=> onChange && onChange({ slack,email,sms,stages, test:true })}>Send Test</Button></div>
    </CardContent></Card>
  );
}

/********************
 * Feature Views for Tabs
 *******************/
function FindRideView(){
  return (
    <Card className="bg-zinc-900 mt-4 p-4"><CardContent>
      <h2 className="text-xl font-semibold mb-4">Nearby Loads</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Input placeholder="City / ZIP" className="bg-black/30"/>
        <Input placeholder="Cargo Type" className="bg-black/30"/>
        <Input placeholder="Min Payout ($)" className="bg-black/30"/>
        <Button className="bg-red-600 hover:bg-red-700">Search</Button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {[1,2,3,4].map(i=> (
          <Card key={i} className="bg-black/30"><CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><div className="text-sm text-gray-400">Tampa, FL → Atlanta, GA</div><div className="font-semibold">Dry Van • 12,000 lbs</div></div>
              <div className="text-right"><div className="text-green-400 font-bold">$1,250</div><div className="text-xs text-gray-400">278 mi • Today</div></div>
            </div>
            <div className="mt-3 flex gap-2"><Button className="bg-red-600 hover:bg-red-700">Instant Match</Button><Button variant="outline" className="border-white/20 text-white">Details</Button></div>
          </CardContent></Card>
        ))}
      </div>
    </CardContent></Card>
  );
}

function MyTripsView(){
  const trips = [
    { id: "#MM-4821", r: "Tampa → Atlanta", status: "En Route", pay: 1250, primary:"J. Morales" },
    { id: "#MM-4610", r: "Orlando → Miami", status: "Completed", pay: 780, primary:"A. Rivera" }
  ];
  return (
    <Card className="bg-zinc-900 mt-4 p-4"><CardContent>
      <h2 className="text-xl font-semibold mb-3">Active & Recent Trips</h2>
      <div className="grid gap-3">
        {trips.map(t=> (
          <Card key={t.id} className="bg-black/30"><CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div><div className="text-sm text-gray-400">{t.id}</div><div className="font-semibold">{t.r}</div><div className="text-xs text-gray-400">eBOL • POD • Invoices</div></div>
              <div className="text-right"><div className="text-green-400 font-bold">${t.pay.toFixed(2)}</div><div className="text-xs text-gray-400">{t.status}</div><div className="mt-2 flex gap-2 justify-end"><Button className="bg-red-600 hover:bg-red-700">Track</Button><Button variant="outline" className="border-white/20 text-white">Docs</Button></div></div>
            </div>
            <SplitPayEditor total={t.pay} primaryName={t.primary} onSave={(lead,co)=>{ try { window.localStorage.setItem('mm_splits', JSON.stringify({lead,co})); } catch {} ; try { window.dispatchEvent(new CustomEvent('mmx:toast',{ detail:{ message:'Split saved' } })); } catch {} }} />
          </CardContent></Card>
        ))}
      </div>
    </CardContent></Card>
  );
}

function DispatchCenter(){
  return (
    <Card className="bg-zinc-900 mt-4 p-4"><CardContent>
      <h2 className="text-xl font-semibold mb-4">Dispatch Center</h2>
      <div className="grid md:grid-cols-3 gap-3">
        <Card className="bg-black/30 md:col-span-2"><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><span>🗺️</span><span className="font-semibold">Fleet Tracker</span></div><div className="text-sm text-gray-400">2 drivers online • 1 active load</div><LiveMap/></CardContent></Card>
        <Card className="bg-black/30"><CardContent className="p-4">
          <div className="font-semibold mb-2">Driver Queue</div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><div><div className="font-medium">J. Morales</div><div className="text-gray-400 text-xs">26' box • Tampa</div></div><Button className="bg-red-600 hover:bg-red-700">Assign</Button></div>
            <div className="flex items-center justify-between"><div><div className="font-medium">A. Rivera</div><div className="text-gray-400 text-xs">Sprinter • Orlando</div></div><Button variant="outline" className="border-white/20 text-white">Ping</Button></div>
          </div>
        </CardContent></Card>
      </div>
    </CardContent></Card>
  );
}

function CommunityView(){
  return (
    <Card className="bg-zinc-900 mt-4 p-4"><CardContent>
      <h2 className="text-xl font-semibold mb-4">Community</h2>
      <div className="grid md:grid-cols-3 gap-3">
        <Card className="bg-black/30 md:col-span-2"><CardContent className="p-4 space-y-4">
          {[1,2,3].map(i=> (
            <div key={i} className="rounded-xl bg-zinc-800 p-3"><div className="text-sm text-gray-400">#general • {i}h ago</div><div className="font-medium">Fuel tip: Pilot on I-75 exit 287 has a short line right now.</div></div>
          ))}
          <div className="flex gap-2"><Input placeholder="Share an update…" className="bg-black/30"/><Button className="bg-red-600 hover:bg-red-700">Post</Button></div>
        </CardContent></Card>
        <Card className="bg-black/30"><CardContent className="p-4"><div className="font-semibold mb-2">Alerts</div><ul className="text-sm space-y-2 text-gray-300"><li>🔔 New load matches your 26' box in Tampa.</li><li>🧾 POD required for #MM-4610.</li><li>🛠 Maintenance due in 300 mi.</li></ul></CardContent></Card>
      </div>
    </CardContent></Card>
  );
}

function WalletView(){
  return (
    <Card className="bg-zinc-900 mt-4 p-4"><CardContent>
      <h2 className="text-xl font-semibold mb-2">Wallet Overview</h2>
      <p>Balance: <span className="text-green-500 font-bold">$2,450.00</span></p>
      <div className="mt-3 flex gap-3"><Button className="bg-red-600 hover:bg-red-700">Withdraw</Button><Button variant="outline" className="border-white/20 text-white">View History</Button></div>
      <div className="mt-6"><h3 className="font-semibold mb-2">Recent Transactions</h3>
        <div className="rounded-xl overflow-hidden border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-zinc-800/60"><tr><th className="text-left p-2">Date</th><th className="text-left p-2">Description</th><th className="text-left p-2">Amount</th></tr></thead>
            <tbody>
              <tr className="border-t border-white/10"><td className="p-2">2025-10-20</td><td className="p-2">Payout — #MM-4610</td><td className="p-2 text-green-400">+$780.00</td></tr>
              <tr className="border-t border-white/10"><td className="p-2">2025-10-18</td><td className="p-2">Fuel — Tampa</td><td className="p-2 text-red-400">-$120.45</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </CardContent></Card>
  );
}

function ProfileView(){
  return (
    <Card className="bg-zinc-900 mt-4 p-4"><CardContent className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Profile & Settings</h2>
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <Input placeholder="Driver Name" className="bg-black/30" defaultValue="Dr. Alexander MurMax"/>
          <Input placeholder="Phone" className="bg-black/30" defaultValue="1-844-MURMAXX"/>
          <Input placeholder="DOT / MC" className="bg-black/30" defaultValue="DOT 4227699 • MC 1635137"/>
          <Input placeholder="Vehicle Type" className="bg-black/30" defaultValue="26' Box Truck"/>
        </div>
        <div className="flex gap-3 mt-3"><Button className="bg-red-600 hover:bg-red-700">Save Changes</Button><Button variant="outline" className="border-white/20 text-white">Upload Avatar</Button></div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Driver Verification</h3>
        <p className="text-sm text-gray-400 mb-3">Upload CDL, insurance, and DOT medical card for compliance review.</p>
        <VerificationUploader/>
      </div>
    </CardContent></Card>
  );
}

/********************
 * Shipper Console (with toasts/persistence)
 *******************/
function ShipperConsole({ seedLoad }:{ seedLoad: Load | null }){
  const [load, setLoad] = useState<Load>(seedLoad || { id:"#SHIP-1284", route:"Tampa, FL → Atlanta, GA", status:"Posted", offer:1250, token:"MMX8-TRK1" });
  const [docTab, setDocTab] = useState<"docs"|"ebol"|"pod"|"settings">("docs");
  const [ebol, setEbol] = useState<EBOL|null>(null);
  const [invoice, setInvoice] = useState<Invoice|null>(null);
  const [splits, setSplits] = useState<DriverSplit>(()=>{ try { const s = window.localStorage.getItem('mm_splits'); return s ? JSON.parse(s) : { lead:60, co:40 }; } catch { return { lead:60, co:40 }; } });
  const [webhooks, setWebhooks] = useState<WebhookConfig>(()=>{ try { const s = window.localStorage.getItem('mm_webhooks'); return s ? JSON.parse(s) : { stages:{ matched:true, picked:true, delivered:true } }; } catch { return { stages:{ matched:true, picked:true, delivered:true } }; } });
  const [payloadPreview, setPayloadPreview] = useState<AlertPayloads | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const shareUrl = `https://murmax.app/track/${load.token}`;

  React.useEffect(()=>{ try { window.localStorage.setItem('mm_webhooks', JSON.stringify(webhooks)); } catch {} }, [webhooks]);
  React.useEffect(()=>{ try { window.localStorage.setItem('mm_splits', JSON.stringify(splits)); } catch {} }, [splits]);
  React.useEffect(()=>{
    const h = (e: any) => {
      setLoad(l=>({ ...l, token: Math.random().toString(36).slice(2,10).toUpperCase() }));
      try {
        const reason = e?.detail?.reason || 'regenerated';
        const msg = reason==='pin_set' ? 'Link refreshed (PIN set)' : reason==='pin_cleared' ? 'Link refreshed (PIN cleared)' : reason==='perm_change' ? 'Link refreshed (permissions updated)' : 'Link refreshed';
        setToast(msg); setTimeout(()=>setToast(null), 2000);
      } catch { setToast('Link refreshed'); setTimeout(()=>setToast(null), 2000); }
    };
    window.addEventListener('mmx:regenerate-link', h as any);
    return ()=> window.removeEventListener('mmx:regenerate-link', h as any);
  }, []);
  React.useEffect(()=>{
    const onToast = (e: any) => { setToast(e?.detail?.message || 'Saved'); setTimeout(()=>setToast(null), 1800); };
    window.addEventListener('mmx:toast', onToast as any);
    return ()=> window.removeEventListener('mmx:toast', onToast as any);
  }, []);

  function sendConfiguredAlerts(stage: LoadStatus, payloads: AlertPayloads){
    if (stage === 'Dispatched' || stage === 'Picked' || stage === 'Delivered'){
      const missing: string[] = [];
      if (webhooks.slack)  { console.log('[ALERT->SLACK]',  payloads.slack);  } else { missing.push('Slack not configured — skipping'); }
      if (webhooks.email)  { console.log('[ALERT->EMAIL]',  payloads.email); } else { missing.push('Email not configured — skipping'); }
      if (webhooks.sms)    { console.log('[ALERT->SMS]',    payloads.sms);   } else { missing.push('SMS not configured — skipping'); }
      if (missing.length){ setToast(missing[0]); setTimeout(()=>setToast(null), 1800); }
    }
  }

  function advanceStatus(newStatus: LoadStatus){
    setLoad(l=>({ ...l, status:newStatus }));
    const payloads = buildAlertPayloads(newStatus, load, shareUrl, webhooks.email, webhooks.sms);
    setPayloadPreview(payloads);
    sendConfiguredAlerts(newStatus, payloads);
  }

  function onEbolSigned(ebolData: EBOL){
    setEbol(ebolData);
    advanceStatus("Matched");
    const amount = Number(load.offer);
    const inv:Invoice = {
      invoiceNo:`INV-${Math.floor(Math.random()*90000+10000)}`,
      loadId: load.id,
      shipper: ebolData.shipper,
      consignee: ebolData.consignee,
      items: ebolData.items,
      totalWeight: ebolData.totalWeight,
      subtotal: amount,
      driverSplit: { leadPct: splits.lead, coPct: splits.co, leadAmt: +(amount*splits.lead/100).toFixed(2), coAmt: +(amount*splits.co/100).toFixed(2) },
      createdAt: new Date().toISOString()
    };
    setInvoice(inv);
  }

  return (
    <Card className="bg-zinc-900 mt-4 p-4"><CardContent className="space-y-6">
      <div className="flex items-center justify-between"><div><div className="text-sm text-gray-400">{load.id}</div><div className="text-xl font-semibold">{load.route}</div></div><div className="flex items-center gap-2"><StatusBadge status={load.status}/><div className="text-green-400 font-bold">${Number(load.offer).toFixed(2)}</div></div></div>
      <Timeline stage={["Posted","Matched","Dispatched","Picked","Delivered"].indexOf(load.status)}/>

      <Card className="bg-black/30"><CardContent className="p-4 flex flex-wrap gap-2 items-center justify-between">
        <div className="text-sm text-gray-300">Dispatch Controls</div>
        <div className="flex gap-2">
          <Button disabled={!ebol || load.status==='Dispatched' || load.status==='Picked' || load.status==='Delivered'} className="bg-red-600 hover:bg-red-700" onClick={()=>advanceStatus('Dispatched')}>Dispatch Now</Button>
          <Button disabled={load.status!=='Dispatched'} variant="outline" className="border-white/20 text-white" onClick={()=>advanceStatus('Picked')}>Mark Picked</Button>
          <Button disabled={load.status!=='Picked'} variant="outline" className="border-white/20 text-white" onClick={()=>advanceStatus('Delivered')}>Mark Delivered</Button>
        </div>
        {!ebol && <div className="text-xs text-amber-300">eBOL must be <span className="font-semibold">Signed</span> to enable Dispatch.</div>}
      </CardContent></Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-black/30 md:col-span-2"><CardContent className="p-4">
          <div className="flex items-center justify-between mb-2"><div className="font-semibold">Live Tracking</div><div className="text-xs text-gray-400">Public share link</div></div>
          <LiveMap/>
          <div className="mt-3 flex items-center gap-2">
            <Input readOnly value={shareUrl} className="bg-black/30"/>
            <Button className="bg-red-600 hover:bg-red-700" onClick={async()=>{ try { await navigator.clipboard.writeText(shareUrl); window.dispatchEvent(new CustomEvent('mmx:toast',{ detail:{ message:'Link copied' } })); } catch { window.dispatchEvent(new CustomEvent('mmx:toast',{ detail:{ message:'Copy failed' } })); } }}>Copy Link</Button>
          </div>
          <div className="mt-3"><ShareLinkControls url={shareUrl}/></div>
        </CardContent></Card>

        <div className="space-y-4">
          <Card className="bg-black/30"><CardContent className="p-4">
            <div className="font-semibold mb-2">Docs / Builder</div>
            <div className="flex flex-wrap gap-2 text-sm mb-3">
              <Button className={docTab==='docs'?"bg-red-600 hover:bg-red-700":"border-white/20 text-white"} variant={docTab==='docs'?"default":"outline"} onClick={()=>setDocTab('docs')}>Summary</Button>
              <Button className={docTab==='ebol'?"bg-red-600 hover:bg-red-700":"border-white/20 text-white"} variant={docTab==='ebol'?"default":"outline"} onClick={()=>setDocTab('ebol')}>eBOL</Button>
              <Button className={docTab==='pod'?"bg-red-600 hover:bg-red-700":"border-white/20 text-white"} variant={docTab==='pod'?"default":"outline"} onClick={()=>setDocTab('pod')}>POD</Button>
              <Button className={docTab==='settings'?"bg-red-600 hover:bg-red-700":"border-white/20 text-white"} variant={docTab==='settings'?"default":"outline"} onClick={()=>setDocTab('settings')}>Alerts</Button>
            </div>

            {docTab==='docs' && (
              <div className="space-y-3">
                <DocRow name="Rate Confirmation" status={ebol? 'Signed':'Signed'}/>
                <DocRow name="Bill of Lading (eBOL)" status={ebol? 'Signed':'Pending'}/>
                <DocRow name="Proof of Delivery (POD)" status={load.status==='Delivered'? 'Submitted':'Pending'}/>
                <DocRow name="Invoice" status={invoice? 'Generated':'Draft'}/>
              </div>
            )}

            {docTab==='ebol' && <EBOLBuilder seed={{ shipper:'NeuralSyn Labs, Corp.', consignee:'MurMax Express® ATL Hub' }} onSigned={onEbolSigned}/>}
            {docTab==='pod' && <PODCapture/>}
            {docTab==='settings' && <WebhookSettings value={webhooks} onChange={cfg=> setWebhooks(cfg)}/>}
          </CardContent></Card>
        </div>
      </div>

      {payloadPreview && (
        <Card className="bg-black/30"><CardContent className="p-4">
          <div className="font-semibold mb-2">Sample Alert Payloads (preview)</div>
          <div className="grid md:grid-cols-3 gap-3 text-xs">
            <pre className="bg-zinc-950 p-3 rounded-xl overflow-auto">{JSON.stringify(payloadPreview.slack, null, 2)}</pre>
            <pre className="bg-zinc-950 p-3 rounded-xl overflow-auto">{JSON.stringify(payloadPreview.email, null, 2)}</pre>
            <pre className="bg-zinc-950 p-3 rounded-xl overflow-auto">{JSON.stringify(payloadPreview.sms, null, 2)}</pre>
          </div>
          <div className="text-[10px] text-gray-500 mt-2">Implement actual POSTs to Slack/Email/SMS providers in production.</div>
        </CardContent></Card>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900/90 border border-white/10 px-3 py-2 rounded-xl text-sm shadow-lg flex items-center gap-2" aria-live="polite">
          🔔 {toast}
          <button className="text-gray-400 hover:text-white ml-2 text-lg leading-none" onClick={()=>setToast(null)} aria-label="Close toast">×</button>
        </div>
      )}
    </CardContent></Card>
  );
}

/********************
 * Self-tests (runtime)
 *******************/
function runSelfTests(){
  const base: Load = { id: "#SHIP-1001", route: "Tampa, FL → Atlanta, GA", status: "Posted", offer: 1250, token: "ABCDEF12" };
  const p1 = buildAlertPayloads("Matched", base, "https://track/ABCDEF12");
  console.assert(p1.slack.text.includes("Matched") && p1.slack.text.includes("$1250.00"), "Slack payload should include stage and formatted amount");
  const p2 = buildAlertPayloads("Delivered", { ...base, offer: "900" }, "url");
  console.assert(p2.slack.text.includes("$900.00"), "String offer should be coerced and formatted");
  const p3 = buildAlertPayloads("Picked", base, "https://track/XYZ");
  console.assert(p3.email.body.includes("https://track/XYZ") && p3.sms.body.includes("https://track/XYZ"), "All channels should include tracking URL");
}
if (typeof window !== "undefined") { try { runSelfTests(); } catch { /* noop */ } }

/********************
 * Main App
 *******************/
export default function MurMaxRideshareApp(): JSX.Element{
  const [activeTab, setActiveTab] = useState("home");
  const [lastPostedLoad, setLastPostedLoad] = useState<Load | null>(null);
  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <header className="flex items-center justify-between mb-6"><h1 className="text-3xl font-bold text-red-600">MurMax Express® Rideshare</h1><div className="flex gap-3"><Button variant="outline" className="border-white/20 text-white">Go Online</Button><Button className="bg-white text-black hover:bg-gray-200">New Load</Button></div></header>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-9 bg-zinc-900/60 rounded-2xl text-white">
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="find">Find Ride</TabsTrigger>
          <TabsTrigger value="post">Post Load</TabsTrigger>
          <TabsTrigger value="shipper">Shipper</TabsTrigger>
          <TabsTrigger value="trips">My Trips</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
          <TabsTrigger value="chat">Community</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="home">
          <Card className="bg-zinc-900 mt-4 p-4"><CardContent><h2 className="text-xl font-semibold mb-2">Welcome back, Driver!</h2><p>See available loads nearby or post your next delivery. Stay synced, stay moving.</p><div className="grid grid-cols-2 gap-4 mt-4"><Button className="bg-red-600 hover:bg-red-700 w-full" onClick={()=>setActiveTab("find")}>Find Load</Button><Button className="bg-white text-black hover:bg-gray-200 w-full" onClick={()=>setActiveTab("post")}>Post Load</Button></div></CardContent></Card>
          <LiveMap/>
        </TabsContent>

        <TabsContent value="find"><FindRideView/></TabsContent>

        <TabsContent value="post"><Card className="bg-zinc-900 mt-4 p-4"><CardContent className="space-y-3"><h2 className="text-xl font-semibold">Post a New Load</h2><div className="grid md:grid-cols-3 gap-3"><Input placeholder="Origin (City, State)" id="origin" className="bg-black/30"/><Input placeholder="Destination (City, State)" id="dest" className="bg-black/30"/><Input placeholder="Pickup Window" id="pickup" className="bg-black/30"/><Input placeholder="Cargo Type" id="cargo" className="bg-black/30"/><Input placeholder="Weight (lbs)" id="weight" className="bg-black/30"/><Input placeholder="Offer ($)" id="offer" className="bg-black/30"/><Textarea placeholder="Notes / Instructions" id="notes" className="bg-black/30 md:col-span-3"/></div><div className="flex gap-3"><Button className="bg-red-600 hover:bg-red-700" onClick={()=>{ const origin=(document.getElementById('origin') as HTMLInputElement)?.value || 'Tampa, FL'; const dest=(document.getElementById('dest') as HTMLInputElement)?.value || 'Atlanta, GA'; const offer=Number((document.getElementById('offer') as HTMLInputElement)?.value || '1250'); const fake:Load={ id:`#SHIP-${Math.floor(Math.random()*9000+1000)}`, route:`${origin} → ${dest}`, status:'Posted', offer, token: Math.random().toString(36).slice(2,10).toUpperCase() }; setLastPostedLoad(fake); setActiveTab('shipper'); }}>Publish Load</Button><Button variant="outline" className="border-white/20 text-white">Save Draft</Button></div></CardContent></Card></TabsContent>

        <TabsContent value="shipper"><ShipperConsole seedLoad={lastPostedLoad}/></TabsContent>
        <TabsContent value="trips"><MyTripsView/></TabsContent>
        <TabsContent value="dispatch"><DispatchCenter/></TabsContent>
        <TabsContent value="chat"><CommunityView/></TabsContent>
        <TabsContent value="wallet"><WalletView/></TabsContent>
        <TabsContent value="profile"><ProfileView/></TabsContent>
      </Tabs>
    </div>
  );
}

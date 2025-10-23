import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, X, Upload, ArrowLeft, ArrowRight } from "lucide-react";

// ---- Shared UI bits ----
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
      <div className="h-full bg-red-600" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
function StepBadge({ idx, active, done }: { idx: number; active?: boolean; done?: boolean }) {
  return (
    <div className={`w-7 h-7 flex items-center justify-center rounded-full border ${
      done ? "bg-red-600 border-red-600" : active ? "border-red-600" : "border-neutral-700"
    }`}
    >
      {done ? <CheckCircle2 className="w-4 h-4 text-white"/> : <span className={active? "text-red-500" : "text-neutral-400"}>{idx}</span>}
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-neutral-400">{label}</label>
      {children}
    </div>
  );
}

// ---- Types ----
type Role = "Driver" | "Dispatcher" | "Shipper" | "Broker";

type Step = {
  title: string;
  valid: (state: any) => boolean;
  Content: (props: any) => JSX.Element;
};

// ---- Role Configs ----
const driverSteps = (state: any, set: (p: any) => void): Step[] => [
  {
    title: "Registration",
    valid: (s) => !!s.name && !!s.cdl && !!s.phone,
    Content: () => (
      <Row>
        <Field label="Full Name"><Input value={state.name||""} onChange={e=>set({ name:e.target.value })} className="bg-neutral-900 border-neutral-700"/></Field>
        <Field label="CDL #"><Input value={state.cdl||""} onChange={e=>set({ cdl:e.target.value })} className="bg-neutral-900 border-neutral-700"/></Field>
        <Field label="Phone"><Input value={state.phone||""} onChange={e=>set({ phone:e.target.value })} className="bg-neutral-900 border-neutral-700"/></Field>
        <Field label="Vehicle (26' Box / 53' Van / Reefer / Hotshot)"><Input value={state.vehicle||""} onChange={e=>set({ vehicle:e.target.value })} className="bg-neutral-900 border-neutral-700"/></Field>
      </Row>
    )
  },
  {
    title: "Documents",
    valid: (s) => !!s.cdlFile && !!s.coiFile,
    Content: () => (
      <Row>
        <Field label="Upload CDL (PDF/Image)"><UploadField value={state.cdlFile} onChange={(f)=>set({ cdlFile:f })}/></Field>
        <Field label="Upload Insurance COI"><UploadField value={state.coiFile} onChange={(f)=>set({ coiFile:f })}/></Field>
        <Field label="Medical Card (optional)"><UploadField value={state.medFile} onChange={(f)=>set({ medFile:f })}/></Field>
        <Field label="Vehicle Registration"><UploadField value={state.regFile} onChange={(f)=>set({ regFile:f })}/></Field>
      </Row>
    )
  },
  {
    title: "Account & Payouts",
    valid: (s) => !!s.payout,
    Content: () => (
      <Row>
        <Field label="Payout Method (ACH/Stripe)"><Input value={state.payout||""} onChange={e=>set({ payout:e.target.value })} placeholder="ex: ACH ****1234" className="bg-neutral-900 border-neutral-700"/></Field>
        <Field label="Preferred Equipment ID (optional)"><Input value={state.eqid||""} onChange={e=>set({ eqid:e.target.value })} className="bg-neutral-900 border-neutral-700"/></Field>
      </Row>
    )
  },
  {
    title: "Orientation",
    valid: (s) => !!s.agree,
    Content: () => (
      <div className="space-y-2">
        <div className="text-sm text-neutral-300">Watch: <span className="underline">MurMax Power Fleet Basics (5m)</span></div>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={!!state.agree} onChange={e=>set({ agree:e.target.checked })}/> I accept Driver Agreement & RateCon T&Cs
        </label>
      </div>
    )
  },
];

const dispatcherSteps = (state:any,set:(p:any)=>void): Step[] => [
  {
    title: "Company Setup",
    valid: (s)=>!!s.company && !!s.ein,
    Content: ()=> (
      <Row>
        <Field label="Company Name"><Input value={state.company||""} onChange={e=>set({company:e.target.value})} className="bg-neutral-900 border-neutral-700"/></Field>
        <Field label="EIN"><Input value={state.ein||""} onChange={e=>set({ein:e.target.value})} className="bg-neutral-900 border-neutral-700"/></Field>
        <Field label="Upload W-9"><UploadField value={state.w9} onChange={(f)=>set({w9:f})}/></Field>
        <Field label="Carrier Packet"><UploadField value={state.packet} onChange={(f)=>set({packet:f})}/></Field>
      </Row>
    )
  },
  {
    title: "Access & Fleet",
    valid: (s)=>!!s.dispId,
    Content: ()=> (
      <Row>
        <Field label="Dispatcher ID"><Input value={state.dispId||""} onChange={e=>set({dispId:e.target.value})} className="bg-neutral-900 border-neutral-700"/></Field>
        <Field label="Linked Drivers (comma-separated)"><Input value={state.drivers||""} onChange={e=>set({drivers:e.target.value})} className="bg-neutral-900 border-neutral-700"/></Field>
      </Row>
    )
  },
  {
    title: "Training",
    valid: (s)=>!!s.trainingDone,
    Content: ()=> (
      <div className="space-y-2">
        <ul className="list-disc ml-6 text-sm text-neutral-300">
          <li>Auto-Dispatch & Compliance Sync</li>
          <li>Instant Book / Escrow Workflow</li>
        </ul>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={!!state.trainingDone} onChange={e=>set({trainingDone:e.target.checked})}/> I completed both modules
        </label>
      </div>
    )
  }
];

const shipperSteps = (state:any,set:(p:any)=>void): Step[] => [
  {
    title: "Business Profile",
    valid: (s)=>!!s.biz && !!s.address,
    Content: ()=> (
      <Row>
        <Field label="Business Name"><Input value={state.biz||""} onChange={e=>set({biz:e.target.value})} className="bg-neutral-900 border-neutral-700"/></Field>
        <Field label="Business Address"><Input value={state.address||""} onChange={e=>set({address:e.target.value})} className="bg-neutral-900 border-neutral-700"/></Field>
        <Field label="W-9"><UploadField value={state.w9} onChange={(f)=>set({w9:f})}/></Field>
        <Field label="Payment Method (Escrow)"><Input value={state.pay||""} onChange={e=>set({pay:e.target.value})} className="bg-neutral-900 border-neutral-700"/></Field>
      </Row>
    )
  },
  {
    title: "KYC & Terms",
    valid: (s)=>!!s.kyc && !!s.terms,
    Content: ()=> (
      <Row>
        <Field label="KYC (EIN/SSN)"><Input value={state.kyc||""} onChange={e=>set({kyc:e.target.value})} className="bg-neutral-900 border-neutral-700"/></Field>
        <Field label="Agree to Escrow & Shipper T&Cs">
          <div className="flex items-center gap-2"><input type="checkbox" checked={!!state.terms} onChange={e=>set({terms:e.target.checked})}/> Accept</div>
        </Field>
      </Row>
    )
  },
  {
    title: "Activation",
    valid: (s)=>true,
    Content: ()=> (
      <div className="text-sm text-neutral-300">Escrow Wallet linked and marketplace posting enabled upon completion.</div>
    )
  }
];

const brokerSteps = (state:any,set:(p:any)=>void): Step[] => [
  {
    title: "Registration",
    valid: (s)=>!!s.mc || !!s.dot,
    Content: ()=> (
      <Row>
        <Field label="MC #"><Input value={state.mc||""} onChange={e=>set({mc:e.target.value})} className="bg-neutral-900 border-neutral-700"/></Field>
        <Field label="USDOT #"><Input value={state.dot||""} onChange={e=>set({dot:e.target.value})} className="bg-neutral-900 border-neutral-700"/></Field>
        <Field label="Broker Authority"><UploadField value={state.auth} onChange={(f)=>set({auth:f})}/></Field>
        <Field label="COI"><UploadField value={state.coi} onChange={(f)=>set({coi:f})}/></Field>
      </Row>
    )
  },
  {
    title: "Terms & Escrow",
    valid: (s)=>!!s.terms && !!s.split,
    Content: ()=> (
      <Row>
        <Field label="Commission Split %"><Input value={state.split||""} onChange={e=>set({split:e.target.value})} className="bg-neutral-900 border-neutral-700"/></Field>
        <Field label="Accept Broker RateCon & Commission Terms">
          <div className="flex items-center gap-2"><input type="checkbox" checked={!!state.terms} onChange={e=>set({terms:e.target.checked})}/> Accept</div>
        </Field>
      </Row>
    )
  }
];

// ---- Upload stub ----
function UploadField({ value, onChange }:{ value?: File|null; onChange: (f: File|null)=>void }){
  return (
    <label className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 cursor-pointer">
      <Upload className="w-4 h-4"/> <span className="text-sm">{value? value.name : "Choose file…"}</span>
      <input type="file" className="hidden" onChange={(e)=>onChange(e.target.files?.[0]||null)} />
    </label>
  );
}

// ---- Stepper wrapper ----
function Stepper({ title, steps, state, setState, onFinish }:{
  title: string;
  steps: Step[];
  state: any;
  setState: (delta:any)=>void;
  onFinish: ()=>void;
}){
  const [idx,setIdx] = useState(0);
  const current = steps[idx];
  const valid = current.valid(state);
  const pct = ((idx) / (steps.length)) * 100 + (valid? (1/steps.length)*100 : 0);
  return (
    <Card className="bg-neutral-900 border border-neutral-800 rounded-2xl">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
            {steps.map((s,i)=> <StepBadge key={i} idx={i+1} active={i===idx} done={i<idx}/>) }
          </div>
        </div>
        <ProgressBar value={pct}/>
        <div className="min-h-[160px]">
          <current.Content/>
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="rounded-xl" onClick={()=> setIdx(Math.max(0, idx-1))} disabled={idx===0}><ArrowLeft className="w-4 h-4 mr-1"/>Back</Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl border-neutral-700" onClick={()=>setState({...state})}>Save Draft</Button>
            {idx < steps.length-1 ? (
              <Button className="bg-red-600 hover:bg-red-700 rounded-xl" onClick={()=> valid && setIdx(idx+1)} disabled={!valid}>Next<ArrowRight className="w-4 h-4 ml-1"/></Button>
            ) : (
              <Button className="bg-red-600 hover:bg-red-700 rounded-xl" onClick={()=> valid && onFinish()} disabled={!valid}>Finish</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Root component ----
export default function MurMaxOnboardingDashboard(){
  const [role,setRole] = useState<Role>("Driver");
  const [driver,setDriver] = useSmartState({});
  const [dispatcher,setDispatcher] = useSmartState({});
  const [shipper,setShipper] = useSmartState({});
  const [broker,setBroker] = useSmartState({});
  const [banner,setBanner] = useState<string| null>(null);

  const roleSteps = {
    Driver: driverSteps(driver, (d:any)=> setDriver(d)),
    Dispatcher: dispatcherSteps(dispatcher, (d:any)=> setDispatcher(d)),
    Shipper: shipperSteps(shipper, (d:any)=> setShipper(d)),
    Broker: brokerSteps(broker, (d:any)=> setBroker(d)),
  } as const;

  const onFinish = () => {
    setBanner(`${role} onboarding complete — account activated.`);
    setTimeout(()=>setBanner(null), 3500);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 space-y-4">
      <header className="bg-red-600 rounded-2xl p-4 flex items-center justify-between">
        <h1 className="font-bold text-xl">MurMax Express® Onboarding</h1>
        <div className="flex gap-2">
          {(["Driver","Dispatcher","Shipper","Broker"] as Role[]).map(r=> (
            <Button key={r} onClick={()=> setRole(r)} className={`${role===r? "bg-white text-black":"bg-neutral-900 text-white"} rounded-2xl`}>{r}</Button>
          ))}
        </div>
      </header>

      {banner && (
        <div className="rounded-xl border border-green-700 bg-green-900/30 p-3">{banner}</div>
      )}

      <div className="max-w-5xl mx-auto">
        <Stepper
          title={`${role} Onboarding`}
          steps={roleSteps[role]}
          state={{ Driver: driver, Dispatcher: dispatcher, Shipper: shipper, Broker: broker }[role]}
          setState={(delta)=> ({ Driver: setDriver, Dispatcher: setDispatcher, Shipper: setShipper, Broker: setBroker }[role])(delta)}
          onFinish={onFinish}
        />
      </div>

      <DevSelfTests/>
    </div>
  );
}

// small helper hook merges partial updates like setState in class components
function useSmartState<T extends object>(init:T){
  const [state,setState] = useState<T>(init);
  return [state, (delta:Partial<T>)=> setState(prev=> ({...prev, ...delta}))] as const;
}

// ---- Dev tests (renders PASS/FAIL) ----
function DevSelfTests(){
  // Test 1: step validation should block next when required fields missing
  const dummyState:any = { name: "", cdl:"", phone:"" };
  const ok1 = driverSteps(dummyState, ()=>{} )[0].valid(dummyState) === false;

  // Test 2: shipper KYC/Terms required
  const dummyShipper:any = { biz:"MurMax Corp", address:"14725 Center Ave, Clewiston, FL 33440", kyc:"", terms:false };
  const ok2 = shipperSteps(dummyShipper, ()=>{} )[1].valid(dummyShipper) === false;

  // Test 3: broker MC/DOT either/or allowed
  const bro1:any = { mc:"", dot:"123" }; const bro2:any = { mc:"567", dot:"" }; const bro3:any = { mc:"", dot:"" };
  const ok3 = brokerSteps(bro1,()=>{})[0].valid(bro1) && brokerSteps(bro2,()=>{})[0].valid(bro2) && !brokerSteps(bro3,()=>{})[0].valid(bro3);

  const pass = (b:boolean)=> b? "PASS":"FAIL";
  return (
    <div className="fixed right-3 bottom-3 text-[10px] text-neutral-300 bg-neutral-900/80 border border-neutral-700 rounded-lg px-2 py-1">
      Tests: RegBlock={pass(ok1)} • ShipperKYC={pass(ok2)} • BrokerEitherOr={pass(ok3)}
    </div>
  );
}

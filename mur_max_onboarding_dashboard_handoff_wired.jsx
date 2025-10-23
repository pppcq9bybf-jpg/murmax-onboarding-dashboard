import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

// --- Types ---
type Role = "Driver" | "Dispatcher" | "Shipper" | "Broker";
type Step = { title: string; valid: (s:any)=>boolean; Content: (p:any)=>JSX.Element };

// --- Mock API with explicit handoff wiring ---
const wait = (ms:number)=> new Promise(r=>setTimeout(r,ms));
const api = {
  saveDraft: async (role: Role, data: any) => {
    localStorage.setItem(`murmax:onboard:${role}`, JSON.stringify(data));
    await wait(150); return { ok: true } as const;
  },
  loadDraft: (role: Role) => JSON.parse(localStorage.getItem(`murmax:onboard:${role}`) || '{}'),
  finalize: async (role: Role, data: any) => {
    const payload = { ...data, finalizedAt: Date.now() };
    localStorage.setItem(`murmax:onboard:final:${role}`, JSON.stringify(payload));
    // Call Marketplace helper if available
    try { (window as any).murmaxOnboardingFinalize?.(role, payload); } catch {}
    await wait(250);
    return { ok: true, id: `${role}-${Date.now()}` } as const;
  }
};

// --- Small helpers ---
function Row({ children }: { children: React.ReactNode }){ return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div> }
function Field({ label, children }: { label:string; children:React.ReactNode }){ return <div className="space-y-1"><label className="text-xs text-neutral-400">{label}</label>{children}</div> }

// --- Per-role simple steps ---
const driverSteps = (state:any,set:(d:any)=>void): Step[] => [
  { title:"Registration", valid:s=>!!s.name && !!s.cdl,
    Content:()=> (
      <Row>
        <Field label="Full Name"><Input value={state.name||''} onChange={e=>set({name:e.target.value})} className="bg-neutral-900 border-neutral-700"/></Field>
        <Field label="CDL #"><Input value={state.cdl||''} onChange={e=>set({cdl:e.target.value})} className="bg-neutral-900 border-neutral-700"/></Field>
      </Row>
    )},
  { title:"Payouts", valid:s=>!!s.payout,
    Content:()=> (
      <Row>
        <Field label="Payout (ACH/Stripe)"><Input value={state.payout||''} onChange={e=>set({payout:e.target.value})} className="bg-neutral-900 border-neutral-700"/></Field>
      </Row>
    )},
];

// --- Stepper ---
function Stepper({ title, steps, state, setState, onFinish }:{ title:string; steps:Step[]; state:any; setState:(d:any)=>void; onFinish:()=>void }){
  const [i,setI]=useState(0);
  const valid = steps[i].valid(state);
  return (
    <Card className="bg-neutral-900 border border-neutral-800 rounded-2xl">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-red-500"/><h2 className="font-semibold">{title}</h2></div><div className="text-xs text-neutral-400">Step {i+1} / {steps.length}</div></div>
        <div className="min-h-[140px]"><steps[i].Content/></div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="rounded-xl" onClick={()=>setI(Math.max(0,i-1))} disabled={i===0}><ArrowLeft className="w-4 h-4 mr-1"/>Back</Button>
          {i<steps.length-1 ? (
            <Button className="bg-red-600 hover:bg-red-700 rounded-xl" onClick={()=> valid && setI(i+1)} disabled={!valid}>Next<ArrowRight className="w-4 h-4 ml-1"/></Button>
          ):(
            <Button className="bg-red-600 hover:bg-red-700 rounded-xl" onClick={onFinish} disabled={!valid}>Finish</Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// --- Root Component ---
export default function MurMaxOnboardingHandoff(){
  const [role,setRole] = useState<Role>('Driver');
  const [driver,setDriver] = useSmart<any>({});
  const roleSteps = useMemo(()=>({ Driver: driverSteps(driver, d=>setDriver(d)) } as const),[driver]);

  const onFinish = async ()=>{
    const current = { Driver:driver }[role];
    await api.saveDraft(role, current);
    const res = await api.finalize(role, current);
    if (res.ok){
      // Optional: ensure navigation for environments without marketplace helper
      try { if (!location.hash || location.hash !== '#marketplace') location.hash = '#marketplace'; } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 space-y-4">
      <header className="bg-red-600 rounded-2xl p-4 flex items-center justify-between">
        <h1 className="font-bold text-xl">MurMax Onboarding (Handoff-Wired)</h1>
        <div className="flex gap-2">
          {(['Driver'] as Role[]).map(r=> (
            <Button key={r} onClick={()=>setRole(r)} className={`${role===r? 'bg-white text-black':'bg-neutral-900 text-white'} rounded-2xl`}>{r}</Button>
          ))}
        </div>
      </header>
      <div className="max-w-2xl mx-auto">
        <Stepper title={`${role} Onboarding`} steps={roleSteps[role]} state={{Driver:driver}[role]} setState={({...d})=>setDriver(d)} onFinish={onFinish}/>
      </div>
    </div>
  );
}

function useSmart<T extends object>(init:T){
  const [s,setS] = useState<T>(init);
  return [s,(d:Partial<T>)=> setS(p=>({...p,...d}))] as const;
}
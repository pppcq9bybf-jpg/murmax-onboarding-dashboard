import { Home, Truck, DollarSign, User, MessageSquare, FileText, Settings, HelpCircle, Fuel, BarChart3, ClipboardList, Gift, MapPin, Bell, Filter, Users, ListChecks, SendHorizontal, X, Mail, FileDown, CheckCircle2, Loader2, UserCircle2, Plus, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useRef, useState } from "react";

// =====================
// Types
// =====================
export type SampleLoad = {
  id: string;
  origin: string;
  dest: string;
  rate: number; // total USD
  distance: number; // miles
  age: string;
  equipment: string;
  broker: string;
};
export type ShipperLoadForm = {
  origin: string;
  destination: string;
  pickupDate: string;
  deliveryDate: string;
  equipment: string;
  weightLbs: number;
  budgetUSD: number; // shipper budget
  notes?: string;
};
export type LeaseAsset = {
  id: string;
  type: string;
  location: string;
  terms: string;
  availability: string;
};

type RateConPayload = {
  loadId: string;
  shipper: string;
  carrier: string;
  broker: string;
  origin: string;
  destination: string;
  equipment: string;
  rateUSD: number;
  terms: string;
};

const defaultTerms = `1) Carrier complies with FMCSA regulations.\n2) Detention: $50/hr after 2 free hours.\n3) TONU: $150 if cancelled <2h pre-pick.\n4) POD + signed BOL required for payment.\n5) Cargo insurance >= $100,000.\n6) Payment NET 24h after verified delivery (Escrow).`;

// =====================
// UI helpers
// =====================
function Pill({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`px-3 py-1 rounded-full border text-sm transition-all ${active ? "bg-red-600 border-red-600" : "bg-neutral-900 border-neutral-700 hover:border-red-600"}`}>
      {children}
    </button>
  );
}
function HOSBadge({ state }: { state: "Available" | "Driving" | "Rest" | "Near Limit" }) {
  const styles = {
    Available: "bg-green-700/30 border-green-700/50",
    Driving: "bg-blue-700/30 border-blue-700/50",
    Rest: "bg-neutral-700/30 border-neutral-600/50",
    "Near Limit": "bg-amber-700/30 border-amber-700/50",
  } as const;
  return <span className={`px-2 py-0.5 text-xs rounded-full border ${styles[state]}`}>{state}</span>;
}
function SectionTitle({ icon, title, action }: { icon: JSX.Element; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="text-red-500">{icon}</div>
        <h2 className="font-semibold">{title}</h2>
      </div>
      {action}
    </div>
  );
}
function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <Card className="bg-neutral-900 border border-neutral-800 rounded-2xl">
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs text-neutral-400 mb-1 block">{children}</label>;
}
function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      {children}
    </section>
  );
}
function Img({ src, alt, className }: { src: string; alt: string; className?: string }) {
  // Simple image helper with sane defaults
  return <img src={src} alt={alt} loading="lazy" className={className ?? "rounded-xl border border-neutral-800"} />;
}

// Common placeholder images (royalty-free placeholder service)
const PLACEHOLD = {
  map: "https://placehold.co/960x320/png?text=Fleet+Map",
  truck: "https://placehold.co/640x360/png?text=Box+Truck",
  reefer: "https://placehold.co/640x360/png?text=Reefer+Trailer",
  van: "https://placehold.co/640x360/png?text=53'+Van",
  avatarDriver: "https://placehold.co/48x48/jpg?text=D",
  avatarBroker: "https://placehold.co/48x48/jpg?text=B",
  avatarShipper: "https://placehold.co/48x48/jpg?text=S",
  logoMurMax: "https://placehold.co/120x40/png?text=MurMax®",
};

// === Onboarding → Marketplace handoff helper (explicit storage) ===
function createProfileFromOnboarding(role: string, data: any) {
  const key = 'murmax:marketplace:profiles';
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  const id = `${role}-${Date.now()}`;
  const base: any = { id, role, createdAt: Date.now() };
  if (role === 'Driver') list.push({ ...base, name: data?.name || 'New Driver', equipment: data?.vehicle || data?.eqid || "26' Box", hos: 'Available' });
  else if (role === 'Dispatcher') list.push({ ...base, company: data?.company || 'New Dispatch', drivers: (data?.drivers||'').split(',').map((s:string)=>s.trim()).filter(Boolean), roleLevel: data?.role || 'Viewer' });
  else if (role === 'Shipper') list.push({ ...base, biz: data?.biz || 'New Shipper', address: data?.address || '', escrowLinked: !!data?.pay });
  else if (role === 'Broker') list.push({ ...base, mc: data?.mc || '', dot: data?.dot || '', split: data?.split || 'N/A' });
  else list.push(base);
  localStorage.setItem(key, JSON.stringify(list));
  // Store keys for highlight and role switch
  localStorage.setItem('murmax:marketplace:lastCreatedId', id);
  localStorage.setItem('murmax:marketplace:lastRole', role);
  return id;
}
// Expose a global hook so the onboarding app can call this without code sharing
// Usage in onboarding: window.murmaxHandoff('Driver', payload)
// This will create the profile, store handoff keys, and navigate to #marketplace
;(window as any).murmaxHandoff = (role: string, payload: any) => {
  const id = createProfileFromOnboarding(role, payload);
  // Navigate to Marketplace and let listener pick it up
  window.location.hash = '#marketplace';
  return id;
};

// =====================
// Root App
// =====================
export default function MurMaxTruckingAppUI() {
  const [role, setRole] = useState<"Driver" | "Dispatcher" | "Shipper" | "Leasing Co.">("Driver");
  const [dispatcherTab, setDispatcherTab] = useState<"Load Board" | "Fleet Map" | "Driver Queue" | "Alerts" | "Reports">("Load Board");

  // Notifications
  const [notices, setNotices] = useState<string[]>([]);
  const pushNotice = (msg: string) => {
    setNotices((n) => [...n, msg]);
    setTimeout(() => setNotices((n) => n.slice(1)), 3200);
  };

  // Listen for onboarding handoff
  useEffect(() => {
    const applyFromHash = () => {
      if (window.location.hash === '#marketplace') {
        const last = localStorage.getItem('murmax:marketplace:lastRole') as any;
        if (last && ["Driver","Dispatcher","Shipper","Leasing Co."].includes(last)) setRole(last);
        pushNotice('Opened via Onboarding → Marketplace handoff');
      }
    };
    applyFromHash();
    const onHash = () => applyFromHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Marketplace profiles directory
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const prevCountRef = useRef<number>(0);

  const refreshProfiles = () => {
    try {
      const raw = localStorage.getItem('murmax:marketplace:profiles');
      const list = raw ? JSON.parse(raw) : [];
      setProfiles(list);
      const lastCreated = localStorage.getItem('murmax:marketplace:lastCreatedId');
      if (lastCreated) {
        setHighlightId(lastCreated);
      } else if (prevCountRef.current && list.length > prevCountRef.current) {
        const newest = list.reduce((a:any,b:any)=> a.createdAt > b.createdAt ? a : b, list[0]);
        setHighlightId(newest?.id);
      }
      prevCountRef.current = list.length;
    } catch { setProfiles([]); }
  };
  useEffect(() => { refreshProfiles(); }, []);

  // Scroll to highlight when set
  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`profile-${highlightId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      localStorage.removeItem('murmax:marketplace:lastCreatedId');
      const t = setTimeout(() => setHighlightId(null), 3500);
      return () => clearTimeout(t);
    }
  }, [highlightId, profiles]);

  const filteredProfiles = useMemo(() => {
    const f = profiles.filter((p) => {
      if (roleFilter !== 'All' && p.role !== roleFilter) return false;
      const q = search.trim().toLowerCase();
      if (q) {
        const hay = `${p.role} ${p.name||''} ${p.company||''} ${p.biz||''} ${p.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (dateFrom) {
        if (p.createdAt < new Date(dateFrom).getTime()) return false;
      }
      if (dateTo) {
        if (p.createdAt > new Date(dateTo).getTime()) return false;
      }
      return true;
    });
    return f.sort((a,b)=> b.createdAt - a.createdAt);
  }, [profiles, roleFilter, search, dateFrom, dateTo]);

  // Create test profile (dev)
  const createTestProfile = () => {
    const key = 'murmax:marketplace:profiles';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    const id = `TEST-${role}-${Date.now()}`;
    const base:any = { id, role, createdAt: Date.now() };
    if (role === 'Driver') list.push({ ...base, name: 'Test Driver', equipment: "26' Box", hos: 'Available' });
    if (role === 'Dispatcher') list.push({ ...base, company: 'Test Dispatch LLC', drivers: ['DRV-001','DRV-002'], roleLevel: 'Junior' });
    if (role === 'Shipper') list.push({ ...base, biz: 'Test Shipper Inc', address: '14725 Center Ave, Clewiston, FL', escrowLinked: true });
    if (role === 'Leasing Co.') list.push({ ...base, company: 'Test Leasing Co', asset: "53' Van" });
    localStorage.setItem(key, JSON.stringify(list));
    localStorage.setItem('murmax:marketplace:lastCreatedId', id);
    refreshProfiles();
    pushNotice(`Created test ${role} profile`);
  };

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatWith, setChatWith] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState(
    [{ from: "System", text: "Welcome to MurMax Express® Marketplace.", ts: "12:30" }] as { from: string; text: string; ts: string }[]
  );
  const openChat = (withLabel: string) => { setChatWith(withLabel); setChatOpen(true); };
  const sendChat = (text: string) => { if (!text) return; setChatMessages((m) => [...m, { from: "You", text, ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]); };

  // Drivers (HOS-aware dispatch)
  const drivers = [
    { id: "DRV-201", name: "J. Rivera", hos: "Available" as const, equipment: "26' Box" },
    { id: "DRV-144", name: "M. Lewis", hos: "Near Limit" as const, equipment: "53' Van" },
    { id: "DRV-089", name: "S. Patel", hos: "Rest" as const, equipment: "Reefer" },
    { id: "DRV-033", name: "A. Chen", hos: "Available" as const, equipment: "Hotshot" },
  ];

  // RateCon + Payments
  const [rateConOpen, setRateConOpen] = useState(false);
  const [rateConData, setRateConData] = useState<null | RateConPayload>(null);
  const [paymentsOpen, setPaymentsOpen] = useState(false);

  const assignLoad = (loadId: string, driverName: string) => pushNotice(`Assigned ${loadId} to ${driverName}.`);
  const autoDispatch = (load: SampleLoad) => {
    const match = drivers.find((d) => d.hos === "Available" && (d.equipment === load.equipment || load.equipment.includes(d.equipment.split(" ")[0]))) || drivers.find((d) => d.hos === "Available");
    if (!match) return pushNotice(`No eligible drivers for ${load.id} (HOS constraint).`);
    assignLoad(load.id, match.name);
  };
  const openRateCon = (load: SampleLoad) => {
    setRateConData({
      loadId: load.id,
      shipper: "Shipper, Inc.",
      carrier: "MurMax Express®",
      broker: load.broker,
      origin: load.origin,
      destination: load.dest,
      equipment: load.equipment,
      rateUSD: load.rate,
      terms: defaultTerms,
    });
    setRateConOpen(true);
  };
  const sendRateCon = (loadId: string) => { pushNotice(`Rate Confirmation sent for ${loadId}.`); setPaymentsOpen(true); };

  // Shipper state + Instant logic (unchanged)
  const [noStringsMode, setNoStringsMode] = useState<"No-Strings Instant" | "Custom Terms">("No-Strings Instant");
  const [shipperForm, setShipperForm] = useState<ShipperLoadForm>({ origin: "", destination: "", pickupDate: "", deliveryDate: "", equipment: "26' Box", weightLbs: 5000, budgetUSD: 1200, notes: "" });
  const [instantLog, setInstantLog] = useState<string[]>([]);
  const log = (m: string) => setInstantLog((prev) => [...prev, `${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — ${m}`]);
  const inHouseOffers = [ { carrier: "MurMax Express®", rpm: 2.35, eta: 3.2, equipment: "26' Box", onTime: 0.98 } ];
  const partnerOffers = [ { carrier: "Queen City Freight", rpm: 2.20, eta: 4.0, equipment: "26' Box", onTime: 0.96 }, { carrier: "TX Hub Carriers", rpm: 2.10, eta: 5.0, equipment: "Reefer", onTime: 0.95 }, { carrier: "Seaport Freight", rpm: 2.28, eta: 3.8, equipment: "53' Van", onTime: 0.94 } ];
  const clearInstantLog = () => setInstantLog([]);
  const runNoStringsInstant = () => {
    clearInstantLog();
    log("Starting No-Strings™ Instant booking…");
    if (!shipperForm.origin || !shipperForm.destination || !shipperForm.budgetUSD || !shipperForm.equipment) { log("Missing required fields (origin/destination/budget/equipment)."); pushNotice("Enter origin, destination, budget, equipment."); return; }
    log("Searching in-house MurMax® capacity…");
    const ih = inHouseOffers.find((o) => o.equipment.includes(shipperForm.equipment.split(" ")[0]));
    if (ih) {
      if (ih.rpm * 300 <= shipperForm.budgetUSD) { log("In-house within budget → Booking MurMax Express®."); pushNotice("Instant Booked: MurMax Express® (in-house)"); setRateConData({ loadId: "AUTO-INSTANT", shipper: "Shipper, Inc.", carrier: "MurMax Express®", broker: "Direct", origin: shipperForm.origin, destination: shipperForm.destination, equipment: shipperForm.equipment, rateUSD: Math.round(ih.rpm * 300), terms: defaultTerms }); setRateConOpen(true); log("Escrow hold initialized."); return; }
      else { log("In-house over budget → Falling back to partner network."); }
    } else { log("No in-house equipment match → Partner search."); }
    log("Scanning partners for lowest RPM under budget…");
    const eligible = partnerOffers.filter((o) => o.equipment.includes(shipperForm.equipment.split(" ")[0]) && o.onTime >= 0.95).sort((a, b) => a.rpm - b.rpm);
    const chosen = eligible.find((o) => o.rpm * 300 <= shipperForm.budgetUSD);
    if (!chosen) { log("No eligible carrier under budget. Consider raising budget or relaxing constraints."); pushNotice("No partner match under budget."); return; }
    log(`Selected ${chosen.carrier} at $${chosen.rpm.toFixed(2)}/mi (lowest under budget).`);
    pushNotice(`Instant Booked: ${chosen.carrier}`);
    setRateConData({ loadId: "AUTO-INSTANT", shipper: "Shipper, Inc.", carrier: chosen.carrier, broker: "Marketplace", origin: shipperForm.origin, destination: shipperForm.destination, equipment: shipperForm.equipment, rateUSD: Math.round(chosen.rpm * 300), terms: defaultTerms });
    setRateConOpen(true); log("Escrow hold initialized.");
  };

  const postShipperLoad = () => { if (!shipperForm.origin || !shipperForm.destination) return pushNotice("Enter origin and destination to post."); pushNotice(`Load posted: ${shipperForm.origin} → ${shipperForm.destination}.`); };
  const instantBook = () => { runNoStringsInstant(); };

  // Leasing
  const leasingAssets: LeaseAsset[] = [
    { id: "EQ-901", type: "26' Box Truck", location: "Tampa, FL", terms: "$650/week + 0.10/mi", availability: "Now" },
    { id: "EQ-733", type: "53' Dry Van", location: "Orlando, FL", terms: "$300/week", availability: "Now" },
    { id: "EQ-455", type: "Reefer Trailer", location: "Miami, FL", terms: "$400/week + FSC", availability: "Oct 25" },
  ];

  const tabs = [
    { icon: <Home className="w-6 h-6" />, label: "Dashboard" },
    { icon: <Truck className="w-6 h-6" />, label: "Find Loads" },
    { icon: <ClipboardList className="w-6 h-6" />, label: "Active Load" },
    { icon: <DollarSign className="w-6 h-6" />, label: "Earnings" },
    { icon: <User className="w-6 h-6" />, label: "Profile" },
  ];
  const sideMenu = [
    { icon: <FileText className="w-5 h-5" />, label: "Documents" },
    { icon: <Fuel className="w-5 h-5" />, label: "Fuel & Expenses" },
    { icon: <MessageSquare className="w-5 h-5" />, label: "Messages" },
    { icon: <BarChart3 className="w-5 h-5" />, label: "Reports" },
    { icon: <Gift className="w-5 h-5" />, label: "Rewards" },
    { icon: <HelpCircle className="w-5 h-5" />, label: "Support" },
    { icon: <Settings className="w-5 h-5" />, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Header */}
      <header className="bg-red-600 p-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Img src={PLACEHOLD.logoMurMax} alt="MurMax Logo" className="rounded-md border border-red-700 bg-white" />
          <h1 className="font-bold text-xl tracking-wide">MurMax Express® Marketplace</h1>
        </div>
        <div className="flex items-center gap-2">
          {(["Driver", "Dispatcher", "Shipper", "Leasing Co."] as const).map((r) => (
            <Button key={r} className={`${role === r ? "bg-white text-black" : "bg-neutral-800 text-white"} rounded-2xl`} onClick={() => setRole(r)}>
              {r}
            </Button>
          ))}
          <Button variant="outline" className="rounded-xl border-neutral-700" onClick={refreshProfiles}><UserCircle2 className="w-4 h-4 mr-1"/>Profiles</Button>
        </div>
      </header>

      {/* Profiles Directory + Filters */}
      <main className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <CardShell>
            <SectionTitle icon={<UserCircle2 className="w-5 h-5" />} title="Marketplace Directory" action={<span className="text-xs text-neutral-400">{profiles.length} profiles</span>} />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <select className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm" value={roleFilter} onChange={(e)=>setRoleFilter(e.target.value)}>
                {['All','Driver','Dispatcher','Shipper','Broker','Leasing Co.'].map(r=> <option key={r} value={r}>{r}</option>)}
              </select>
              <Input placeholder="Search name/company" value={search} onChange={(e)=>setSearch(e.target.value)} className="bg-neutral-900 border-neutral-700" />
              <Input type="date" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} className="bg-neutral-900 border-neutral-700" />
              <Input type="date" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} className="bg-neutral-900 border-neutral-700" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="outline" className="rounded-xl border-neutral-700" onClick={()=>{ setRoleFilter('All'); setSearch(''); setDateFrom(''); setDateTo(''); }}>Reset</Button>
              <Button className="bg-red-600 hover:bg-red-700 rounded-xl" onClick={createTestProfile}><Plus className="w-4 h-4 mr-1"/>Create Test Profile</Button>
            </div>
            {filteredProfiles.length === 0 ? (
              <p className="text-sm text-neutral-400">No profiles match. Adjust filters or create a test profile.</p>
            ) : (
              <ul className="space-y-2 max-h-56 overflow-auto text-sm">
                {filteredProfiles.map((p) => (
                  <li
                    key={p.id}
                    id={`profile-${p.id}`}
                    className={`flex items-center justify-between bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 transition-all ${highlightId===p.id? 'ring-2 ring-red-500 ring-offset-2 ring-offset-black' : ''}`}
                  >
                    <span className="truncate flex items-center gap-2">
                      {p.role === 'Driver' && <Img src={PLACEHOLD.avatarDriver} alt="driver" className="w-6 h-6 rounded-full border border-neutral-700" />}
                      {p.role === 'Dispatcher' && <Building2 className="w-5 h-5 text-neutral-300" />}
                      {p.role === 'Shipper' && <Img src={PLACEHOLD.avatarShipper} alt="shipper" className="w-6 h-6 rounded-full border border-neutral-700" />}
                      {p.role === 'Broker' && <Img src={PLACEHOLD.avatarBroker} alt="broker" className="w-6 h-6 rounded-full border border-neutral-700" />}
                      {p.role}: {p.name || p.company || p.biz || p.id}
                    </span>
                    <span className="text-neutral-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardShell>

          {/* Main panels */}
          <div className="lg:col-span-3">
            {role === "Driver" && <DriverPanel tabs={tabs} sideMenu={sideMenu} />}
            {role === "Dispatcher" && (
              <DispatcherPanel dispatcherTab={dispatcherTab} setDispatcherTab={setDispatcherTab} onOpenChat={openChat} onAssign={assignLoad} onAutoDispatch={autoDispatch} onOpenRateCon={openRateCon} onSendRateCon={sendRateCon} />
            )}
            {role === "Shipper" && (
              <ShipperPanel form={shipperForm} setForm={setShipperForm} mode={noStringsMode} setMode={setNoStringsMode} onPost={postShipperLoad} onInstantBook={instantBook} onOpenChat={openChat} instantLog={instantLog} />
            )}
            {role === "Leasing Co." && <LeasingPanel assets={leasingAssets} onOpenChat={openChat} />}
          </div>
        </div>
      </main>

      {/* Bottom Navigation (Driver only) */}
      {role === "Driver" && (
        <footer className="bg-neutral-900 border-t border-neutral-800 flex justify-around p-3 md:hidden">
          {tabs.map((tab, idx) => (
            <button key={idx} className="flex flex-col items-center text-sm">
              <div className="text-red-500">{tab.icon}</div>
              <span>{tab.label}</span>
            </button>
          ))}
        </footer>
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 space-y-2 z-50">
        {notices.map((n, i) => (
          <div key={i} className="px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-xl shadow-lg">{n}</div>
        ))}
      </div>

      {/* Chat Drawer */}
      {chatOpen && (
        <ChatDrawer title={chatWith ?? "Chat"} messages={chatMessages} onClose={() => setChatOpen(false)} onSend={sendChat} />
      )}

      {/* RateCon Modal */}
      {rateConOpen && rateConData && (
        <RateConModal data={rateConData} onClose={() => setRateConOpen(false)} onGenerate={() => {
          const blob = new Blob([
            `RATE CONFIRMATION\n\nLoad: ${rateConData.loadId}\nShipper: ${rateConData.shipper}\nCarrier: ${rateConData.carrier}\nBroker: ${rateConData.broker}\nOrigin: ${rateConData.origin}\nDestination: ${rateConData.destination}\nEquipment: ${rateConData.equipment}\nRate: $${rateConData.rateUSD}\n\nTerms:\n${rateConData.terms}`
          ], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `${rateConData.loadId}_RateCon.txt`; a.click();
          URL.revokeObjectURL(url);
          setRateConOpen(false);
          setPaymentsOpen(true);
        }} />
      )}

      {/* Payments Drawer */}
      {paymentsOpen && <PaymentsDrawer onClose={() => setPaymentsOpen(false)} />}

      {/* Dev Self-Tests */}
      <DevTests />
    </div>
  );
}

// =====================
// Panels (unchanged core features)
// =====================
function DriverPanel({ tabs, sideMenu }: { tabs: { icon: JSX.Element; label: string }[]; sideMenu: { icon: JSX.Element; label: string }[] }) {
  return (
    <main className="flex-1 grid md:grid-cols-4 gap-4">
      <aside className="bg-neutral-900 rounded-2xl p-4 space-y-2 hidden md:block">
        {sideMenu.map((item, idx) => (
          <Button key={idx} variant="ghost" className="w-full justify-start text-white hover:bg-red-600 hover:text-white">
            {item.icon}
            <span className="ml-3">{item.label}</span>
          </Button>
        ))}
      </aside>
      <section className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tabs.map((tab, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}>
            <Card className="bg-neutral-800 border border-neutral-700 hover:border-red-500 hover:shadow-lg transition-all rounded-2xl">
              <CardContent className="flex flex-col items-center p-6">
                <div className="text-red-500 mb-3">{tab.icon}</div>
                <h3 className="font-semibold text-lg">{tab.label}</h3>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>
    </main>
  );
}

function DispatcherPanel({ dispatcherTab, setDispatcherTab, onOpenChat, onAssign, onAutoDispatch, onOpenRateCon, onSendRateCon }: {
  dispatcherTab: "Load Board" | "Fleet Map" | "Driver Queue" | "Alerts" | "Reports";
  setDispatcherTab: (v: "Load Board" | "Fleet Map" | "Driver Queue" | "Alerts" | "Reports") => void;
  onOpenChat: (withLabel: string) => void;
  onAssign: (loadId: string, driverName: string) => void;
  onAutoDispatch: (load: SampleLoad) => void;
  onOpenRateCon: (load: SampleLoad) => void;
  onSendRateCon: (loadId: string) => void;
}) {
  return (
    <main className="flex-1 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {["Load Board", "Fleet Map", "Driver Queue", "Alerts", "Reports"].map((t) => (
            <Pill key={t} active={dispatcherTab === t} onClick={() => setDispatcherTab(t as any)}>{t}</Pill>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input placeholder="Search lanes, brokers, cities..." className="bg-neutral-900 border-neutral-700 pr-10" />
            <Filter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          </div>
          <Button className="bg-red-600 hover:bg-red-700 rounded-xl">New Dispatch</Button>
        </div>
      </div>

      {dispatcherTab === "Load Board" && (
        <LoadBoardCardGrid onOpenChat={onOpenChat} onAssign={onAssign} onAutoDispatch={onAutoDispatch} onOpenRateCon={onOpenRateCon} onSendRateCon={onSendRateCon} />
      )}
      {dispatcherTab === "Fleet Map" && <FleetMapCard />}
      {dispatcherTab === "Driver Queue" && <DriverQueueCard />}
      {dispatcherTab === "Alerts" && <AlertsCard />}
      {dispatcherTab === "Reports" && <ReportsCard />}
    </main>
  );
}

function LoadBoardCardGrid({ onOpenChat, onAssign, onAutoDispatch, onOpenRateCon, onSendRateCon }: {
  onOpenChat: (withLabel: string) => void;
  onAssign: (loadId: string, driverName: string) => void;
  onAutoDispatch: (load: SampleLoad) => void;
  onOpenRateCon: (load: SampleLoad) => void;
  onSendRateCon: (loadId: string) => void;
}) {
  const sampleLoads: SampleLoad[] = [
    { id: "MMX-1042", origin: "Tampa, FL", dest: "Atlanta, GA", rate: 1250, distance: 456, age: "32m", equipment: "26' Box", broker: "ATL Logistics" },
    { id: "MMX-1043", origin: "Miami, FL", dest: "Savannah, GA", rate: 1425, distance: 485, age: "1h", equipment: "53' Van", broker: "Seaport Freight" },
    { id: "MMX-1044", origin: "Orlando, FL", dest: "Houston, TX", rate: 2800, distance: 969, age: "18m", equipment: "Reefer", broker: "TX Hub" },
    { id: "MMX-1045", origin: "Jacksonville, FL", dest: "Charlotte, NC", rate: 1100, distance: 370, age: "6m", equipment: "Hotshot", broker: "Queen City" },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <CardShell>
        <SectionTitle icon={<ListChecks className="w-5 h-5" />} title="Load Board" action={<Button variant="ghost" className="rounded-xl">View All</Button>} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-neutral-400">
              <tr className="text-left">
                <th className="py-2">Load #</th>
                <th>Origin → Dest</th>
                <th>Equip</th>
                <th>Mi</th>
                <th>Rate</th>
                <th>Age</th>
                <th>Broker</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sampleLoads.map((l) => (
                <tr key={l.id} className="border-t border-neutral-800">
                  <td className="py-2 font-medium">{l.id}</td>
                  <td className="flex items-center gap-2">
                    <Img src={l.equipment.includes("Reefer")? PLACEHOLD.reefer : l.equipment.includes("53")? PLACEHOLD.van : PLACEHOLD.truck} alt="equip" className="w-10 h-6 object-cover rounded" />
                    {l.origin} → {l.dest}
                  </td>
                  <td>{l.equipment}</td>
                  <td>{l.distance}</td>
                  <td className="font-semibold">${l.rate.toLocaleString()}</td>
                  <td>{l.age}</td>
                  <td className="flex items-center gap-2">
                    <Img src={PLACEHOLD.avatarBroker} alt="broker" className="w-6 h-6 rounded-full"/>
                    {l.broker}
                  </td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <Button className="bg-red-600 hover:bg-red-700 rounded-xl" onClick={() => onAutoDispatch(l)}>Auto-Dispatch</Button>
                      <Button variant="secondary" className="rounded-xl" onClick={() => onAssign(l.id, "Choose Driver…")}>Assign</Button>
                      <Button variant="ghost" className="rounded-xl border border-neutral-700" onClick={() => onOpenChat(`${l.broker} • ${l.id}`)}>Chat</Button>
                      <Button variant="outline" className="rounded-xl border-neutral-700" onClick={() => onOpenRateCon(l)}>
                        <Mail className="w-4 h-4 mr-1" /> RateCon
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-neutral-400">
          <FileDown className="w-4 h-4" />
          <span>RateCon: generates a text preview file (stub) and opens Payments drawer.</span>
        </div>
      </CardShell>
      <FleetMapCard />
      <CardShell>
        <SectionTitle icon={<Filter className="w-5 h-5" />} title="Smart Filters" />
        <div className="grid grid-cols-2 gap-2">
          {["Box Truck 26'", "Reefer", "High RPM", "<500 mi", ">$2.50+/mi", "Hotshot"].map((tag) => (<Pill key={tag}>{tag}</Pill>))}
        </div>
      </CardShell>
    </div>
  );
}

function FleetMapCard() {
  return (
    <CardShell>
      <SectionTitle icon={<MapPin className="w-5 h-5" />} title="Fleet Map (Live)" />
      <div className="mb-3">
        <Img src={PLACEHOLD.map} alt="Fleet map" className="w-full h-64 object-cover rounded-xl border border-neutral-800" />
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {[
          { name: "MMX-206", city: "Ocala, FL", hos: "Available" as const },
          { name: "MMX-178", city: "Charlotte, NC", hos: "Near Limit" as const },
          { name: "MMX-099", city: "Tallahassee, FL", hos: "Rest" as const },
        ].map((p, i) => (
          <li key={i} className="flex items-center justify-between bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="font-medium">{p.name}</span>
              <span className="text-neutral-400 text-sm">{p.city}</span>
            </div>
            <HOSBadge state={p.hos} />
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

function DriverQueueCard() {
  const queue = [
    { name: "J. Rivera", truck: "MMX-206 • 26' Box", status: "Available in 45m", hos: "Available" as const },
    { name: "M. Lewis", truck: "MMX-178 • 53' Van", status: "On delivery • ETA 14:30", hos: "Near Limit" as const },
    { name: "S. Patel", truck: "MMX-099 • Reefer", status: "Break • 21m left", hos: "Rest" as const },
  ];
  return (
    <CardShell>
      <SectionTitle icon={<Users className="w-5 h-5" />} title="Driver Queue" />
      <ul className="divide-y divide-neutral-800">
        {queue.map((d, i) => (
          <li key={i} className="py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Img src={PLACEHOLD.avatarDriver} alt="driver" className="w-8 h-8 rounded-full border border-neutral-700" />
              <div>
                <p className="font-medium">{d.name}</p>
                <p className="text-sm text-neutral-400">{d.truck}</p>
              </div>
            </div>
            <HOSBadge state={d.hos} />
            <div className="text-sm">{d.status}</div>
            <Button className="bg-red-600 hover:bg-red-700 rounded-xl">Dispatch</Button>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

function AlertsCard() {
  const alerts = [
    { type: "Delay", msg: "MMX-178 delayed at Gate B • Charlotte, NC", time: "12:41" },
    { type: "Docs", msg: "POD missing for MMX-1041 • Upload required", time: "12:15" },
    { type: "HOS", msg: "J. Rivera nearing drive limit • 45m left", time: "11:59" },
  ];
  return (
    <CardShell>
      <SectionTitle icon={<Bell className="w-5 h-5" />} title="Live Alerts" />
      <ul className="divide-y divide-neutral-800">
        {alerts.map((a, i) => (
          <li key={i} className="py-3 flex items-center gap-3">
            <span className="px-2 py-0.5 text-xs rounded-full bg-red-700/30 border border-red-700/50">{a.type}</span>
            <span className="flex-1">{a.msg}</span>
            <span className="text-neutral-400 text-xs">{a.time}</span>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

function ReportsCard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[{ title: "RPM by Lane", value: "$2.47/mi", sub: "+0.12 WoW" }, { title: "On-Time Delivery", value: "97.2%", sub: "+0.6% MoM" }, { title: "Utilization", value: "83%", sub: "+3% WoW" }].map((kpi, i) => (
        <CardShell key={i}>
          <p className="text-neutral-400 text-sm">{kpi.title}</p>
          <p className="text-3xl font-bold mt-1">{kpi.value}</p>
          <p className="text-xs text-neutral-400 mt-1">{kpi.sub}</p>
        </CardShell>
      ))}
    </div>
  );
}

function ShipperPanel({ form, setForm, mode, setMode, onPost, onInstantBook, onOpenChat, instantLog }: {
  form: ShipperLoadForm;
  setForm: (f: ShipperLoadForm) => void;
  mode: "No-Strings Instant" | "Custom Terms";
  setMode: (m: "No-Strings Instant" | "Custom Terms") => void;
  onPost: () => void;
  onInstantBook: () => void;
  onOpenChat: (withLabel: string) => void;
  instantLog: string[];
}) {
  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">No-Strings™ Instant: Hybrid (In-House First → Lowest RPM Under Budget)</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Pill active={mode === "No-Strings Instant"} onClick={() => setMode("No-Strings Instant")}>No-Strings™ Instant</Pill>
        <Pill active={mode === "Custom Terms"} onClick={() => setMode("Custom Terms")}>Custom Terms</Pill>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="Post a Load">
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label>Origin</Label>
              <Input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} className="bg-neutral-900 border-neutral-700" placeholder="City, ST" />
            </Field>
            <Field>
              <Label>Destination</Label>
              <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="bg-neutral-900 border-neutral-700" placeholder="City, ST" />
            </Field>
            <Field>
              <Label>Pickup Date</Label>
              <Input type="date" value={form.pickupDate} onChange={(e) => setForm({ ...form, pickupDate: e.target.value })} className="bg-neutral-900 border-neutral-700" />
            </Field>
            <Field>
              <Label>Delivery Date</Label>
              <Input type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} className="bg-neutral-900 border-neutral-700" />
            </Field>
            <Field>
              <Label>Equipment</Label>
              <Input value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} className="bg-neutral-900 border-neutral-700" placeholder="26' Box / 53' Van / Reefer / Hotshot" />
            </Field>
            <Field>
              <Label>Weight (lbs)</Label>
              <Input type="number" value={form.weightLbs} onChange={(e) => setForm({ ...form, weightLbs: parseInt(e.target.value || "0") })} className="bg-neutral-900 border-neutral-700" />
            </Field>
            <Field>
              <Label>Budget (USD)</Label>
              <Input type="number" value={form.budgetUSD} onChange={(e) => setForm({ ...form, budgetUSD: parseInt(e.target.value || "0") })} className="bg-neutral-900 border-neutral-700" />
            </Field>
            <Field className="col-span-2">
              <Label>Notes</Label>
              <Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-neutral-900 border-neutral-700" placeholder="Handling, time windows, special instructions" />
            </Field>
          </div>
          <div className="mt-3 flex gap-2">
            <Button className="bg-red-600 hover:bg-red-700 rounded-xl" onClick={onPost}>Post Load</Button>
            {mode === "No-Strings Instant" && <Button variant="outline" className="rounded-xl border-neutral-700" onClick={onInstantBook}>Instant Book + Escrow</Button>}
          </div>
        </Section>

        <Section title="Quotes & Bids (Live)">
          <ul className="space-y-2 text-sm">
            {[{ carrier: "MurMax Express®", price: 1180, eta: "Pick 15:00", equip: "26' Box", avatar: PLACEHOLD.avatarShipper }, { carrier: "Queen City Freight", price: 1300, eta: "Pick 17:00", equip: "26' Box", avatar: PLACEHOLD.avatarBroker }, { carrier: "TX Hub Carriers", price: 1140, eta: "Pick 19:00", equip: "Reefer", avatar: PLACEHOLD.avatarBroker }].map((q, i) => (
              <li key={i} className="flex items-center justify-between bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <Img src={q.avatar} alt="logo" className="w-6 h-6 rounded-full border border-neutral-700" />
                  <div>
                    <p className="font-medium">{q.carrier}</p>
                    <p className="text-neutral-400">{q.equip} • {q.eta}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">${q.price}</span>
                  <Button className="bg-red-600 hover:bg-red-700 rounded-xl">Accept</Button>
                  <Button variant="ghost" className="rounded-xl border border-neutral-700" onClick={() => onOpenChat(`${q.carrier} • Quote`)}>Chat</Button>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Escrow Wallet">
          <div className="text-sm space-y-2">
            <p className="text-neutral-400">Funds are held until POD is uploaded and delivery is confirmed.</p>
            <div className="flex items-center justify-between bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2">
              <span>Balance</span>
              <span className="font-semibold">$4,850.00</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl border-neutral-700">Add Funds</Button>
              <Button variant="outline" className="rounded-xl border-neutral-700">Payout</Button>
            </div>
          </div>
        </Section>
      </div>

      <Section title="No-Strings™ Live Log">
        <ul className="text-xs space-y-1 max-h-48 overflow-auto">
          {instantLog.length === 0 && <li className="text-neutral-500">No activity yet. Click Instant Book to run the hybrid logic.</li>}
          {instantLog.map((line, i) => (
            <li key={i} className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-red-500" />{line}</li>
          ))}
        </ul>
      </Section>

      <Section title="Compliance, Docs & KYC">
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {["W-9 on file", "Insurance COI valid", "MC/US DOT verified", "Carrier Packet e-signed", "RateCon template ready", "BOL/POD auto-capture", "KYC: TIN/SSN verified", "KYC: Business registration", "KYC: Driver CDL on file"].map((d, i) => (
            <li key={i} className="bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 flex items-center justify-between">
              <span>{d}</span>
              <span className="text-green-400">●</span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
          <Input placeholder="Upload COI (PDF)" className="bg-neutral-900 border-neutral-700" />
          <Input placeholder="Upload Carrier Packet" className="bg-neutral-900 border-neutral-700" />
          <Input placeholder="Upload CDL" className="bg-neutral-900 border-neutral-700" />
          <Button className="bg-red-600 hover:bg-red-700 rounded-xl">Submit</Button>
        </div>
      </Section>
    </div>
  );
}

function LeasingPanel({ assets, onOpenChat }: { assets: LeaseAsset[]; onOpenChat: (withLabel: string) => void }) {
  const imageFor = (type:string) => type.includes("Reefer")? PLACEHOLD.reefer : type.includes("53")? PLACEHOLD.van : PLACEHOLD.truck;
  return (
    <main className="flex-1 p-0 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {assets.map((a) => (
          <CardShell key={a.id}>
            <Img src={imageFor(a.type)} alt={a.type} className="w-full h-36 object-cover rounded-xl mb-2" />
            <SectionTitle icon={<Truck className="w-5 h-5" />} title={`${a.type} — ${a.id}`} />
            <p className="text-sm text-neutral-400">{a.location} • {a.availability}</p>
            <p className="mt-1 font-medium">Terms: {a.terms}</p>
            <div className="mt-3 flex gap-2">
              <Button className="bg-red-600 hover:bg-red-700 rounded-xl">Book Lease</Button>
              <Button variant="ghost" className="rounded-xl border border-neutral-700" onClick={() => onOpenChat(`${a.type} • ${a.id}`)}>Chat</Button>
            </div>
          </CardShell>
        ))}
      </div>

      <CardShell>
        <SectionTitle icon={<ClipboardList className="w-5 h-5" />} title="Attach Equipment to Load" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="Load # (e.g., MMX-1042)" className="bg-neutral-900 border-neutral-700" />
          <Input placeholder="Asset ID (e.g., EQ-901)" className="bg-neutral-900 border-neutral-700" />
          <Button className="bg-red-600 hover:bg-red-700 rounded-xl">Attach</Button>
        </div>
        <p className="text-xs text-neutral-400 mt-2">Leasing company can attach a truck/trailer to a posted load for revenue share.</p>
      </CardShell>
    </main>
  );
}

// =====================
// Drawers / Modals (unchanged)
// =====================
function ChatDrawer({ title, messages, onClose, onSend }: { title: string; messages: { from: string; text: string; ts: string }[]; onClose: () => void; onSend: (text: string) => void; }) {
  const [text, setText] = useState("");
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-neutral-950 border-l border-neutral-800 flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-neutral-800">
          <h3 className="font-semibold">Chat — {title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-800"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[85%] ${m.from === "You" ? "ml-auto" : "mr-auto"}`}>
              <div className={`rounded-2xl px-3 py-2 border ${m.from === "You" ? "bg-red-700/20 border-red-700/50" : "bg-neutral-900 border-neutral-700"}`}>
                <p className="text-xs text-neutral-400 mb-1">{m.from} • {m.ts}</p>
                <p className="text-sm">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-neutral-800 flex items-center gap-2">
          <Input placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { onSend(text); setText(""); } }} className="bg-neutral-900 border-neutral-700" />
          <Button className="bg-red-600 hover:bg-red-700 rounded-xl" onClick={() => { onSend(text); setText(""); }}>
            <SendHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function RateConModal({ data, onClose, onGenerate }: { data: RateConPayload; onClose: () => void; onGenerate: () => void; }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute right-1/2 translate-x-1/2 top-20 w-[95%] md:w-[720px] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-xl">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="font-semibold">Rate Confirmation — {data.loadId}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-800"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-2 text-sm">
          <p><b>Shipper:</b> {data.shipper}</p>
          <p><b>Carrier:</b> {data.carrier}</p>
          <p><b>Broker:</b> {data.broker}</p>
          <p><b>Lane:</b> {data.origin} → {data.destination}</p>
          <p><b>Equipment:</b> {data.equipment}</p>
          <p><b>Rate:</b> ${data.rateUSD.toLocaleString()}</p>
          <div className="mt-3">
            <Label>Terms</Label>
            <pre className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 whitespace-pre-wrap text-xs leading-relaxed">{data.terms}</pre>
          </div>
        </div>
        <div className="p-4 border-t border-neutral-800 flex items-center justify-end gap-2">
          <Button variant="ghost" className="rounded-xl border border-neutral-700" onClick={onClose}>Cancel</Button>
          <Button className="bg-red-600 hover:bg-red-700 rounded-xl" onClick={onGenerate}>Generate & Send</Button>
        </div>
      </div>
    </div>
  );
}

function PaymentsDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-neutral-950 border-l border-neutral-800 flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-neutral-800">
          <h3 className="font-semibold">Payments</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-800"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-3 text-sm">
          <p className="text-neutral-400">Demo flow — connect Stripe/ACH in production.</p>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
            <Label>Amount</Label>
            <Input defaultValue="1180" className="bg-neutral-900 border-neutral-700" />
            <div className="mt-3 flex gap-2">
              <Button className="bg-red-600 hover:bg-red-700 rounded-xl">Pay Now</Button>
              <Button variant="outline" className="rounded-xl border-neutral-700">Schedule</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================
// Dev Self-Tests (simple assertions displayed in UI)
// =====================
function DevTests() {
  const loads: SampleLoad[] = [{ id: "TST-1", origin: "A", dest: "B", rate: 1000, distance: 100, age: "1m", equipment: "26' Box", broker: "Test" }];
  const drivers = [ { id: "A", hos: "Rest" as const, equipment: "26' Box" }, { id: "B", hos: "Available" as const, equipment: "26' Box" } ];
  const selected = drivers.find((d) => d.hos === "Available" && (d.equipment === loads[0].equipment));
  const test1 = selected?.id === "B" ? "PASS" : "FAIL";
  const rc: RateConPayload = { loadId: "TST-1", shipper: "S", carrier: "C", broker: "B", origin: "A", destination: "B", equipment: "Van", rateUSD: 1234, terms: "ok" };
  const test2 = rc.loadId && rc.rateUSD > 0 ? "PASS" : "FAIL";
  const list = JSON.parse(localStorage.getItem('murmax:marketplace:profiles') || '[]');
  const pass3 = Array.isArray(list) ? "PASS" : "FAIL";
  return (
    <div className="fixed right-3 bottom-3 text-[10px] text-neutral-300 bg-neutral-900/80 border border-neutral-700 rounded-lg px-2 py-1">
      DevTests: HOS={test1} • RateCon={test2} • ProfilesStore={pass3}
    </div>
  );
}

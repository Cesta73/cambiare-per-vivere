import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  AlertCircle as CircleAlert, Archive, Barcode, CalendarClock, Camera, ChefHat,
  CheckCircle2 as CircleCheck, ChevronRight, Home as House, ListPlus, LogOut,
  Minus, Package as PackageOpen, Plus, RefreshCw,
  Search, ShoppingBasket, Sparkles, Users, X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  addPantryStock, consumePantryRecipe, createPantryInvite, getPantryRecommendation,
  getPantrySnapshot, lookupPantryBarcode, removePantryStock, updatePantryShopping,
  type BarcodeProduct, type PantryProduct, type PantrySnapshot, type PantryUnit,
} from '../lib/jarvis-core';

type View = 'home' | 'pantry' | 'shopping' | 'recipes' | 'family';
type Toast = { kind: 'ok' | 'error'; text: string } | null;

const tabs: Array<{ id: View; label: string; icon: typeof House }> = [
  { id: 'home', label: 'Oggi', icon: House },
  { id: 'pantry', label: 'Cambusa', icon: Archive },
  { id: 'shopping', label: 'Spesa', icon: ShoppingBasket },
  { id: 'recipes', label: 'Ricette', icon: ChefHat },
  { id: 'family', label: 'Famiglia', icon: Users },
];

const previewMode = ['localhost', '127.0.0.1'].includes(window.location.hostname) && new URLSearchParams(window.location.search).has('preview');
const previewSnapshot: PantrySnapshot = {
  household: { id: 'preview', name: 'Cambusa Cestarollo' },
  member: { id: 'owner', display_name: 'Gianluca', role: 'owner' },
  members: [
    { id: '1', display_name: 'Gianluca', role: 'owner' },
    { id: '2', display_name: 'Katia', role: 'editor' },
    { id: '3', display_name: 'Gabriele', role: 'editor' },
  ],
  inventory: [
    { id: 'p1', name: 'Yogurt greco bianco', brand: 'Fage', barcode: null, category: 'latticini', default_unit: 'g', minimum_quantity: 300, total_quantity: 750, is_low: false, next_expiry: '2026-07-17', expiry_status: 'soon', lots: [] },
    { id: 'p2', name: 'Pane integrale', brand: null, barcode: null, category: 'cereali', default_unit: 'g', minimum_quantity: 200, total_quantity: 420, is_low: false, next_expiry: '2026-07-18', expiry_status: 'soon', lots: [] },
    { id: 'p3', name: 'Pomodori', brand: null, barcode: null, category: 'verdura', default_unit: 'g', minimum_quantity: 300, total_quantity: 900, is_low: false, next_expiry: '2026-07-20', expiry_status: 'ok', lots: [] },
    { id: 'p4', name: 'Riso basmati', brand: null, barcode: null, category: 'cereali', default_unit: 'g', minimum_quantity: 250, total_quantity: 180, is_low: true, next_expiry: '2027-01-10', expiry_status: 'ok', lots: [] },
  ],
  shopping: [
    { id: 's1', name: 'Zucchine', needed_quantity: 800, unit: 'g', status: 'listed', reason: 'Menu dei prossimi giorni' },
    { id: 's2', name: 'Uova', needed_quantity: 6, unit: 'pz', status: 'listed', reason: null },
  ],
  recipes: [{ id: 'r1', name: 'Riso, verdure e uova', base_servings: 2, meal_types: ['dinner'], plan_compliant: true, preparation_minutes: 25, ingredients: [{ product_id: 'p4', name: 'Riso basmati', quantity: 160, unit: 'g', optional: false }, { product_id: 'p3', name: 'Verdure', quantity: 400, unit: 'g', optional: false }, { product_id: null, name: 'Uova', quantity: 2, unit: 'pz', optional: false }] }],
  summary: { products: 4, low_stock: 1, expiring_soon: 2, expired: 0, shopping: 2 },
};

export function CambusaApp() {
  const [session, setSession] = useState<Session | null>(previewMode ? ({} as Session) : null);
  const [authReady, setAuthReady] = useState(previewMode);
  const [snapshot, setSnapshot] = useState<PantrySnapshot | null>(previewMode ? previewSnapshot : null);
  const [membershipMissing, setMembershipMissing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>('home');
  const [stockOpen, setStockOpen] = useState(false);
  const [barcodeSeed, setBarcodeSeed] = useState<BarcodeProduct | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const notify = useCallback((next: Toast) => {
    setToast(next);
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const refresh = useCallback(async () => {
    if (previewMode) { setSnapshot(previewSnapshot); return; }
    if (!session) return;
    setLoading(true);
    try {
      const data = await getPantrySnapshot();
      setSnapshot(data);
      setMembershipMissing(false);
    } catch (error) {
      const code = (error as Error & { code?: string }).code;
      if (code === 'pantry_membership_required') setMembershipMissing(true);
      else notify({ kind: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, [notify, session]);

  useEffect(() => {
    if (previewMode) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) void refresh(); else setSnapshot(null); }, [refresh, session]);

  if (!authReady) return <LoadingScreen />;
  if (!session) return <AuthScreen notify={notify} />;
  if (membershipMissing) return <MembershipScreen onReady={refresh} notify={notify} />;
  if (!snapshot) return <LoadingScreen />;

  return (
    <div className="cambusa-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <img src="/jarvis-emblem.png" alt="" />
          <div><span>Cambusa Famiglia</span><small>{snapshot.household.name}</small></div>
        </div>
        <button className="icon-button" title="Aggiorna" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className={loading ? 'spin' : ''} />
        </button>
      </header>

      <main className="content">
        {view === 'home' && <HomeView snapshot={snapshot} refresh={refresh} notify={notify} openStock={() => setStockOpen(true)} />}
        {view === 'pantry' && <PantryView snapshot={snapshot} refresh={refresh} notify={notify} openStock={() => setStockOpen(true)} openBarcode={(seed) => { setBarcodeSeed(seed); setStockOpen(true); }} />}
        {view === 'shopping' && <ShoppingView snapshot={snapshot} refresh={refresh} notify={notify} />}
        {view === 'recipes' && <RecipesView snapshot={snapshot} refresh={refresh} notify={notify} />}
        {view === 'family' && <FamilyView snapshot={snapshot} refresh={refresh} notify={notify} />}
      </main>

      <nav className="bottom-nav" aria-label="Navigazione principale">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return <button key={tab.id} className={view === tab.id ? 'active' : ''} onClick={() => setView(tab.id)}><Icon /><span>{tab.label}</span></button>;
        })}
      </nav>

      {stockOpen && <StockDialog seed={barcodeSeed} onClose={() => { setStockOpen(false); setBarcodeSeed(null); }} onSaved={async () => { setStockOpen(false); setBarcodeSeed(null); await refresh(); notify({ kind: 'ok', text: 'Prodotto caricato con la sua scadenza.' }); }} />}
      {toast && <div className={`toast ${toast.kind}`}><span>{toast.text}</span><button onClick={() => setToast(null)}><X /></button></div>}
    </div>
  );
}

function LoadingScreen() {
  return <div className="center-screen"><img src="/jarvis-emblem.png" alt="" /><p>Allineo la cambusa...</p></div>;
}

function AuthScreen({ notify }: { notify: (toast: Toast) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [busy, setBusy] = useState(false);
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '');
    const password = String(form.get('password') || '');
    setBusy(true);
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) notify({ kind: 'error', text: result.error.message });
    else if (mode === 'signup' && !result.data.session) notify({ kind: 'ok', text: 'Controlla la mail per confermare l’accesso.' });
  };
  return <div className="auth-layout">
    <section className="auth-intro"><img src="/jarvis-emblem.png" alt="" /><p>Famiglia Jarvis</p><h1>La cambusa, in comune.</h1><span>Scadenze, spesa e pasti restano allineati per tutti.</span></section>
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="segmented"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Accedi</button><button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Crea accesso</button></div>
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required /></label>
      <button className="primary-button" disabled={busy}>{busy ? 'Attendi...' : mode === 'login' ? 'Entra' : 'Continua'}</button>
    </form>
  </div>;
}

function MembershipScreen({ onReady, notify }: { onReady: () => Promise<void>; notify: (toast: Toast) => void }) {
  const [busy, setBusy] = useState(false);
  const create = async () => {
    setBusy(true);
    const { error } = await supabase.rpc('ensure_pantry_household', { household_name: 'Cambusa di famiglia' });
    setBusy(false);
    if (error) notify({ kind: 'error', text: error.message }); else await onReady();
  };
  const join = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    const { error } = await supabase.rpc('join_pantry_household', { invite_code: String(form.get('code') || ''), member_name: String(form.get('name') || '') });
    setBusy(false);
    if (error) notify({ kind: 'error', text: 'Codice non valido o scaduto.' }); else await onReady();
  };
  return <div className="membership-screen"><img src="/jarvis-emblem.png" alt="" /><h1>Unisciti alla cambusa</h1><p>Usa il codice ricevuto da Gian oppure crea una nuova cambusa.</p><form onSubmit={join}><label>Il tuo nome<input name="name" required /></label><label>Codice invito<input name="code" required maxLength={8} /></label><button className="primary-button" disabled={busy}>Entra in famiglia</button></form><button className="text-button" onClick={() => void create()} disabled={busy}>Crea una nuova cambusa</button></div>;
}

function HomeView({ snapshot, refresh, notify, openStock }: ViewProps & { openStock: () => void }) {
  const [servings, setServings] = useState(2);
  const [recommendation, setRecommendation] = useState('');
  const [busy, setBusy] = useState(false);
  const suggest = async () => {
    setBusy(true);
    try {
      const result = await getPantryRecommendation({ text: 'Cosa possiamo preparare per il prossimo pasto?', servings });
      setRecommendation(result.message);
    } catch (error) { notify({ kind: 'error', text: (error as Error).message }); }
    finally { setBusy(false); }
  };
  const urgent = snapshot.inventory.filter((item) => ['expired', 'today', 'soon'].includes(item.expiry_status)).slice(0, 4);
  return <>
    <section className="welcome-band"><div><span>Buona giornata, {snapshot.member.display_name}</span><h1>Cosa serve, adesso?</h1></div><button className="primary-icon-button" title="Carica prodotto" onClick={openStock}><Plus /></button></section>
    <section className="metric-strip">
      <Metric value={snapshot.summary.products} label="disponibili" />
      <Metric value={snapshot.summary.expiring_soon} label="in scadenza" alert={snapshot.summary.expiring_soon > 0} />
      <Metric value={snapshot.summary.shopping} label="da comprare" />
    </section>
    <section className="recommend-band">
      <div className="section-heading"><div><Sparkles /><span>Jarvis propone</span></div><div className="stepper"><button title="Riduci porzioni" onClick={() => setServings(Math.max(1, servings - 1))}><Minus /></button><strong>{servings}</strong><button title="Aumenta porzioni" onClick={() => setServings(servings + 1)}><Plus /></button></div></div>
      {recommendation ? <p className="recommendation-text">{recommendation}</p> : <p>Incrocio il piano alimentare con ciò che è davvero disponibile e con le scadenze.</p>}
      <button className="secondary-button" onClick={() => void suggest()} disabled={busy}>{busy ? 'Sto verificando...' : 'Proponi il prossimo pasto'}<ChevronRight /></button>
    </section>
    <section className="list-section"><div className="section-heading"><div><CalendarClock /><span>Da usare prima</span></div></div>{urgent.length ? urgent.map((item) => <ProductRow key={item.id} product={item} compact />) : <Empty icon={CircleCheck} text="Nessuna scadenza urgente." />}</section>
  </>;
}

interface ViewProps { snapshot: PantrySnapshot; refresh: () => Promise<void>; notify: (toast: Toast) => void }

function PantryView({ snapshot, refresh, notify, openStock, openBarcode }: ViewProps & { openStock: () => void; openBarcode: (seed: BarcodeProduct) => void }) {
  const [query, setQuery] = useState('');
  const [scanner, setScanner] = useState(false);
  const [removing, setRemoving] = useState<PantryProduct | null>(null);
  const products = useMemo(() => snapshot.inventory.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())), [query, snapshot.inventory]);
  return <>
    <PageTitle title="Cambusa" subtitle={`${snapshot.summary.products} prodotti disponibili`} actions={<><button className="icon-button" title="Leggi codice a barre" onClick={() => setScanner(true)}><Barcode /></button><button className="primary-icon-button" title="Carica prodotto" onClick={openStock}><Plus /></button></>} />
    <div className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca prodotto" /></div>
    <section className="inventory-list">{products.map((product) => <ProductRow key={product.id} product={product} onClick={() => setRemoving(product)} />)}{!products.length && <Empty icon={PackageOpen} text="Nessun prodotto trovato." />}</section>
    {scanner && <BarcodeDialog onClose={() => setScanner(false)} onFound={(product) => { setScanner(false); openBarcode(product); }} notify={notify} />}
    {removing && <RemoveDialog product={removing} onClose={() => setRemoving(null)} onDone={async () => { setRemoving(null); await refresh(); notify({ kind: 'ok', text: 'Scarico registrato.' }); }} />}
  </>;
}

function ShoppingView({ snapshot, refresh, notify }: ViewProps) {
  const [name, setName] = useState('');
  const add = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    try { await updatePantryShopping({ name: name.trim(), status: 'listed' }); setName(''); await refresh(); }
    catch (error) { notify({ kind: 'error', text: (error as Error).message }); }
  };
  const mark = async (id: string, itemName: string, status: string) => {
    try { await updatePantryShopping({ id, name: itemName, status }); await refresh(); }
    catch (error) { notify({ kind: 'error', text: (error as Error).message }); }
  };
  return <><PageTitle title="Lista della spesa" subtitle="Condivisa e aggiornata in tempo reale" />
    <form className="quick-add" onSubmit={add}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Aggiungi un prodotto" /><button title="Aggiungi"><ListPlus /></button></form>
    <section className="shopping-list">{snapshot.shopping.map((item) => <div className="shopping-row" key={item.id}><button className="check-button" title="Segna acquistato" onClick={() => void mark(item.id, item.name, 'purchased')}><CircleCheck /></button><div><strong>{item.name}</strong><span>{item.needed_quantity ? `${item.needed_quantity} ${item.unit}` : item.reason || 'Da acquistare'}</span></div><button className="icon-button quiet" title="Rimuovi" onClick={() => void mark(item.id, item.name, 'dismissed')}><X /></button></div>)}{!snapshot.shopping.length && <Empty icon={ShoppingBasket} text="La lista è vuota." />}</section>
  </>;
}

function RecipesView({ snapshot, refresh, notify }: ViewProps) {
  const [servings, setServings] = useState<Record<string, number>>({});
  const consume = async (id: string) => {
    try { await consumePantryRecipe(id, servings[id] || 1); await refresh(); notify({ kind: 'ok', text: 'Ingredienti scaricati per tutte le porzioni.' }); }
    catch (error) { notify({ kind: 'error', text: (error as Error).message }); }
  };
  return <><PageTitle title="Ricette" subtitle="Porzioni collegate alla cambusa" />
    <section className="recipe-grid">{snapshot.recipes.map((recipe) => <article className="recipe-card" key={recipe.id}><div className="recipe-title"><ChefHat /><div><h2>{recipe.name}</h2><span>{recipe.plan_compliant ? 'Conforme al piano' : 'Ricetta di famiglia'}</span></div></div><ul>{recipe.ingredients.slice(0, 5).map((item) => <li key={`${recipe.id}-${item.name}`}>{item.name}<span>{item.quantity} {item.unit}</span></li>)}</ul><div className="recipe-actions"><div className="stepper"><button onClick={() => setServings({ ...servings, [recipe.id]: Math.max(1, (servings[recipe.id] || 1) - 1) })}><Minus /></button><strong>{servings[recipe.id] || 1}</strong><button onClick={() => setServings({ ...servings, [recipe.id]: (servings[recipe.id] || 1) + 1 })}><Plus /></button></div><button className="secondary-button" onClick={() => void consume(recipe.id)}>Preparata</button></div></article>)}{!snapshot.recipes.length && <Empty icon={ChefHat} text="Le ricette condivise compariranno qui." />}</section>
  </>;
}

function FamilyView({ snapshot, refresh, notify }: ViewProps) {
  const [invite, setInvite] = useState<{ code: string; expires_at: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const makeInvite = async () => {
    try { setInvite(await createPantryInvite()); }
    catch (error) { notify({ kind: 'error', text: (error as Error).message }); }
  };
  const uploadReceipt = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${snapshot.household.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-z0-9.]+/gi, '-')}`;
    const { error: storageError } = await supabase.storage.from('pantry-receipts').upload(path, file);
    if (!storageError) {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('pantry_receipts').insert({ household_id: snapshot.household.id, image_path: path, status: 'needs_review', created_by: user.user?.id });
      if (error) notify({ kind: 'error', text: error.message }); else notify({ kind: 'ok', text: 'Scontrino archiviato per la revisione.' });
    } else notify({ kind: 'error', text: storageError.message });
    setUploading(false); event.target.value = ''; await refresh();
  };
  return <><PageTitle title="Famiglia" subtitle="Accessi e strumenti condivisi" />
    <section className="family-section"><div className="section-heading"><div><Users /><span>Membri</span></div></div>{snapshot.members.map((member) => <div className="member-row" key={member.id}><span>{member.display_name.slice(0, 1).toUpperCase()}</span><div><strong>{member.display_name}</strong><small>{member.role === 'owner' ? 'Responsabile' : member.role === 'editor' ? 'Può modificare' : 'Solo lettura'}</small></div></div>)}</section>
    {snapshot.member.role === 'owner' && <section className="family-action"><h2>Invita un familiare</h2><p>Il codice è personale e scade dopo sette giorni.</p>{invite ? <div className="invite-code"><strong>{invite.code}</strong><span>Scade {formatDate(invite.expires_at)}</span></div> : <button className="secondary-button" onClick={() => void makeInvite()}>Genera codice</button>}</section>}
    <section className="family-action"><h2>Carica scontrino</h2><p>La foto viene conservata nella coda di revisione. Il riconoscimento automatico degli articoli sarà attivato nel prossimo rilascio.</p><label className="secondary-button file-button"><Camera />{uploading ? 'Caricamento...' : 'Fotografa scontrino'}<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => void uploadReceipt(event)} disabled={uploading} /></label></section>
    <button className="logout-button" onClick={() => void supabase.auth.signOut()}><LogOut />Esci da questo dispositivo</button>
  </>;
}

function StockDialog({ seed, onClose, onSaved }: { seed: BarcodeProduct | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try {
      await addPantryStock({
        name: String(data.get('name')), brand: String(data.get('brand') || ''), barcode: seed?.barcode,
        category: String(data.get('category')), quantity: Number(data.get('quantity')), unit: String(data.get('unit')) as PantryUnit,
        minimumQuantity: Number(data.get('minimum') || 0), storageLocation: String(data.get('location')),
        expiresOn: String(data.get('expiry') || ''), source: seed ? 'barcode' : 'manual',
      });
      await onSaved();
    } catch (caught) { setError((caught as Error).message); }
    finally { setBusy(false); }
  };
  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form className="dialog" onSubmit={submit}><div className="dialog-head"><div><span>{seed ? 'Codice riconosciuto' : 'Nuovo carico'}</span><h2>{seed?.name || 'Aggiungi prodotto'}</h2></div><button type="button" className="icon-button" onClick={onClose}><X /></button></div>
    <div className="form-grid"><label className="wide">Prodotto<input name="name" defaultValue={seed?.name} required /></label><label className="wide">Marca<input name="brand" defaultValue={seed?.brand || ''} /></label><label>Quantità<input name="quantity" type="number" min="0.001" step="0.001" defaultValue={seed?.package_quantity || ''} required /></label><label>Unità<select name="unit" defaultValue={seed?.unit || 'g'}><option value="g">grammi</option><option value="ml">millilitri</option><option value="pz">pezzi</option></select></label><label>Scadenza<input name="expiry" type="date" required /></label><label>Dove<select name="location"><option value="dispensa">Dispensa</option><option value="frigorifero">Frigorifero</option><option value="freezer">Freezer</option></select></label><label>Soglia minima<input name="minimum" type="number" min="0" step="0.001" defaultValue="0" /></label><label>Categoria<select name="category" defaultValue={seed?.category || 'altro'}>{['frutta','verdura','proteine','latticini','cereali','dispensa','surgelati','bevande','condimenti','altro'].map((item) => <option key={item}>{item}</option>)}</select></label></div>
    {error && <p className="form-error"><CircleAlert />{error}</p>}<button className="primary-button" disabled={busy}>{busy ? 'Registro...' : 'Registra carico'}</button></form></div>;
}

function RemoveDialog({ product, onClose, onDone }: { product: PantryProduct; onClose: () => void; onDone: () => Promise<void> }) {
  const [quantity, setQuantity] = useState<number>(Math.min(product.total_quantity, product.default_unit === 'pz' ? 1 : 100));
  const [busy, setBusy] = useState(false);
  const remove = async () => { setBusy(true); await removePantryStock(product, quantity); await onDone(); setBusy(false); };
  return <div className="dialog-backdrop"><div className="dialog small"><div className="dialog-head"><div><span>Scarico manuale</span><h2>{product.name}</h2></div><button className="icon-button" onClick={onClose}><X /></button></div><label>Quantità da scaricare<input type="number" value={quantity} min="0.001" max={product.total_quantity} step="0.001" onChange={(event) => setQuantity(Number(event.target.value))} /></label><p>Disponibili: {product.total_quantity} {product.default_unit}</p><button className="primary-button" disabled={busy || quantity <= 0 || quantity > product.total_quantity} onClick={() => void remove()}>Conferma scarico</button></div></div>;
}

function BarcodeDialog({ onClose, onFound, notify }: { onClose: () => void; onFound: (product: BarcodeProduct) => void; notify: (toast: Toast) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [manual, setManual] = useState('');
  const [active, setActive] = useState(false);
  const stop = useCallback(() => { stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null; }, []);
  const lookup = useCallback(async (code: string) => {
    try { const product = await lookupPantryBarcode(code); if (product.found) onFound(product); else notify({ kind: 'error', text: 'Prodotto non trovato: puoi inserirlo manualmente.' }); }
    catch (error) { notify({ kind: 'error', text: (error as Error).message }); }
  }, [notify, onFound]);
  useEffect(() => () => stop(), [stop]);
  const start = async () => {
    const Detector = (window as unknown as { BarcodeDetector?: new (options: { formats: string[] }) => { detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
    if (!Detector) { notify({ kind: 'error', text: 'La scansione non è disponibile qui: inserisci il codice.' }); return; }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (!video.current) return;
      video.current.srcObject = stream.current; await video.current.play(); setActive(true);
      const detector = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      const scan = async () => {
        if (!stream.current || !video.current) return;
        const results = await detector.detect(video.current).catch(() => []);
        if (results[0]?.rawValue) { stop(); await lookup(results[0].rawValue); return; }
        window.setTimeout(scan, 350);
      };
      void scan();
    } catch { notify({ kind: 'error', text: 'Non posso usare la fotocamera. Controlla i permessi.' }); }
  };
  return <div className="dialog-backdrop"><div className="dialog barcode-dialog"><div className="dialog-head"><div><span>Carico rapido</span><h2>Codice a barre</h2></div><button className="icon-button" onClick={() => { stop(); onClose(); }}><X /></button></div><div className={`camera-frame ${active ? 'active' : ''}`}><video ref={video} muted playsInline />{!active && <button className="camera-start" onClick={() => void start()}><Camera />Apri fotocamera</button>}</div><form className="manual-barcode" onSubmit={(event) => { event.preventDefault(); void lookup(manual); }}><input inputMode="numeric" pattern="[0-9]{8,14}" value={manual} onChange={(event) => setManual(event.target.value.replace(/\D/g, ''))} placeholder="Oppure digita il codice" /><button title="Cerca"><Search /></button></form></div></div>;
}

function PageTitle({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) { return <div className="page-title"><div><h1>{title}</h1><p>{subtitle}</p></div><div className="page-actions">{actions}</div></div>; }
function Metric({ value, label, alert }: { value: number; label: string; alert?: boolean }) { return <div className={alert ? 'alert' : ''}><strong>{value}</strong><span>{label}</span></div>; }
function Empty({ icon: Icon, text }: { icon: typeof House; text: string }) { return <div className="empty"><Icon /><span>{text}</span></div>; }
function ProductRow({ product, compact, onClick }: { product: PantryProduct; compact?: boolean; onClick?: () => void }) { return <button className={`product-row ${compact ? 'compact' : ''}`} onClick={onClick}><span className={`stock-dot ${product.expiry_status}`} /><div><strong>{product.name}</strong><span>{product.brand || product.category}</span></div><div className="product-quantity"><strong>{product.total_quantity} {product.default_unit}</strong><span>{product.next_expiry ? `Scade ${formatDate(product.next_expiry)}` : 'Scadenza non indicata'}</span></div>{onClick && <ChevronRight />}</button>; }
function formatDate(value: string) { return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value.includes('T') ? value : `${value}T12:00:00Z`)); }

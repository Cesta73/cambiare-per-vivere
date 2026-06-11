import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Check, Trash2, ShoppingCart, RefreshCw, Printer } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import type { ShoppingList, ShoppingListItem } from '../../lib/supabase';
import { todayISO, CATEGORY_LABELS, CATEGORY_ORDER, getWeekStart, dateToISO } from '../../lib/utils';
import { Modal } from '../ui/Modal';

interface Props { onBack: () => void; }

export function ShoppingPage({ onBack }: Props) {
  const { user, isDemo, demoData, showToast } = useApp();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'altro', quantity: '' });

  useEffect(() => {
    loadLists();
  }, [isDemo, user]);

  useEffect(() => {
    if (selectedList) loadItems(selectedList.id);
  }, [selectedList]);

  const loadLists = async () => {
    setLoading(true);
    if (isDemo) {
      setLists([demoData.shoppingList]);
      setSelectedList(demoData.shoppingList);
      setItems(demoData.shoppingItems);
    } else if (user) {
      const { data } = await supabase.from('shopping_lists').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setLists(data ?? []);
      if (data?.length) {
        setSelectedList(data[0]);
      }
    }
    setLoading(false);
  };

  const loadItems = async (listId: string) => {
    if (isDemo) { setItems(demoData.shoppingItems); return; }
    if (!user) return;
    const { data } = await supabase.from('shopping_list_items').select('*').eq('list_id', listId).order('category');
    setItems(data ?? []);
  };

  const generateFromWeekPlan = async () => {
    if (!user) { showToast('Disponibile solo con account', 'info'); return; }
    const weekStart = getWeekStart();
    const weekStartISO = dateToISO(weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndISO = dateToISO(weekEnd);

    const { data: meals } = await supabase.from('planned_meals').select('*').eq('user_id', user.id).gte('plan_date', weekStartISO).lte('plan_date', weekEndISO);
    if (!meals?.length) { showToast('Nessun pasto pianificato per questa settimana.', 'info'); return; }

    const { data: newList } = await supabase.from('shopping_lists').insert({
      user_id: user.id,
      name: `Lista settimana ${weekStartISO}`,
      week_start: weekStartISO,
    }).select().maybeSingle();

    if (!newList) return;

    const ingredientSet = new Set<string>();
    const insertItems: Partial<ShoppingListItem>[] = [];

    meals.forEach(meal => {
      if (meal.ingredients) {
        meal.ingredients.split(',').map((i: string) => i.trim()).filter(Boolean).forEach((ing: string) => {
          if (!ingredientSet.has(ing.toLowerCase())) {
            ingredientSet.add(ing.toLowerCase());
            insertItems.push({
              user_id: user.id,
              list_id: newList.id,
              name: ing,
              category: guessCategory(ing),
              is_manual: false,
            });
          }
        });
      }
    });

    if (insertItems.length > 0) {
      await supabase.from('shopping_list_items').insert(insertItems);
    }

    setLists(prev => [newList, ...prev]);
    setSelectedList(newList);
    await loadItems(newList.id);
    showToast(`Lista generata con ${insertItems.length} elementi!`, 'success');
  };

  const guessCategory = (name: string): string => {
    const n = name.toLowerCase();
    if (/mela|pera|banana|arancia|frutta|uva|fragola|kiwi/.test(n)) return 'frutta';
    if (/carota|zucchina|melanzana|pomodoro|insalata|verdura|spinaci|broccoli|cipolla|aglio/.test(n)) return 'verdura';
    if (/pollo|manzo|maiale|pesce|uovo|salmone|tonno|prosciutto|carne/.test(n)) return 'proteine';
    if (/latte|yogurt|formaggio|burro|panna|ricotta/.test(n)) return 'latticini';
    if (/pasta|riso|pane|farina|cereali|avena|farro/.test(n)) return 'cereali';
    if (/surgelat/.test(n)) return 'surgelati';
    if (/acqua|succo|bevanda|tè|caffè/.test(n)) return 'bevande';
    if (/olio|aceto|sale|spezie|dispensa/.test(n)) return 'dispensa';
    return 'altro';
  };

  const toggleItem = async (item: ShoppingListItem) => {
    const newVal = !item.is_purchased;
    if (isDemo) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_purchased: newVal } : i));
      return;
    }
    if (!user) return;
    await supabase.from('shopping_list_items').update({ is_purchased: newVal }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_purchased: newVal } : i));
  };

  const addManualItem = async () => {
    if (!newItem.name.trim() || !selectedList) return;
    if (isDemo) {
      const item: ShoppingListItem = {
        id: Math.random().toString(36),
        user_id: 'demo',
        list_id: selectedList.id,
        name: newItem.name,
        category: newItem.category,
        quantity: newItem.quantity || null,
        is_purchased: false,
        is_manual: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setItems(prev => [...prev, item]);
      setAddModal(false);
      setNewItem({ name: '', category: 'altro', quantity: '' });
      return;
    }
    if (!user) return;
    const { data } = await supabase.from('shopping_list_items').insert({
      user_id: user.id,
      list_id: selectedList.id,
      name: newItem.name,
      category: newItem.category,
      quantity: newItem.quantity || null,
      is_manual: true,
    }).select().maybeSingle();
    if (data) setItems(prev => [...prev, data]);
    setAddModal(false);
    setNewItem({ name: '', category: 'altro', quantity: '' });
    showToast('Elemento aggiunto!', 'success');
  };

  const deleteItem = async (item: ShoppingListItem) => {
    if (isDemo) { setItems(prev => prev.filter(i => i.id !== item.id)); return; }
    if (!user) return;
    await supabase.from('shopping_list_items').delete().eq('id', item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  const groupedItems = CATEGORY_ORDER.reduce<Record<string, ShoppingListItem[]>>((acc, cat) => {
    const catItems = items.filter(i => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  const purchasedCount = items.filter(i => i.is_purchased).length;

  const printList = () => {
    const content = CATEGORY_ORDER.map(cat => {
      const catItems = items.filter(i => i.category === cat);
      if (!catItems.length) return '';
      return `\n${CATEGORY_LABELS[cat].toUpperCase()}\n` + catItems.map(i => `- ${i.name}${i.quantity ? ` (${i.quantity})` : ''}${i.is_purchased ? ' ✓' : ''}`).join('\n');
    }).filter(Boolean).join('\n');
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`<pre style="font-family:sans-serif;padding:2rem;max-width:600px;">${selectedList?.name ?? 'Lista della spesa'}\n${content}</pre>`);
      w.print();
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-warm-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-warm-gray-700" />
        </button>
        <h1 className="section-title flex-1">Lista della spesa</h1>
        <button onClick={printList} className="p-2 rounded-xl hover:bg-warm-gray-100 transition-colors text-warm-gray-500" title="Stampa">
          <Printer size={20} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={() => setAddModal(true)} className="btn-primary py-2 px-4 text-sm flex items-center gap-1 flex-1">
          <Plus size={16} /> Aggiungi
        </button>
        <button onClick={generateFromWeekPlan} className="btn-secondary py-2 px-4 text-sm flex items-center gap-1 flex-1">
          <RefreshCw size={16} /> Da menù
        </button>
      </div>

      {/* Progress */}
      {items.length > 0 && (
        <div className="card py-3">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-warm-gray-600 font-medium">Acquistati</span>
            <span className="text-sage-600 font-semibold">{purchasedCount}/{items.length}</span>
          </div>
          <div className="w-full bg-warm-gray-100 rounded-full h-2">
            <div className="bg-sage-500 h-2 rounded-full transition-all" style={{ width: `${items.length ? (purchasedCount / items.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* Items by category */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-16 bg-warm-gray-100" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-warm-gray-400">
          <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Lista vuota</p>
          <p className="text-sm mt-1">Aggiungi elementi o genera da menù settimanale</p>
        </div>
      ) : (
        Object.entries(groupedItems).map(([cat, catItems]) => (
          <div key={cat} className="card">
            <h3 className="font-semibold text-warm-gray-700 text-sm mb-3">{CATEGORY_LABELS[cat]}</h3>
            <div className="space-y-2">
              {catItems.map(item => (
                <div key={item.id} className={`flex items-center gap-3 p-2 rounded-xl transition-all ${item.is_purchased ? 'opacity-60' : ''}`}>
                  <button
                    onClick={() => toggleItem(item)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.is_purchased ? 'bg-sage-500 border-sage-500' : 'border-warm-gray-300 hover:border-sage-400'}`}
                  >
                    {item.is_purchased && <Check size={13} className="text-white" />}
                  </button>
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${item.is_purchased ? 'line-through text-warm-gray-400' : 'text-warm-gray-800'}`}>{item.name}</span>
                    {item.quantity && <span className="text-xs text-warm-gray-400 ml-2">{item.quantity}</span>}
                  </div>
                  <button onClick={() => deleteItem(item)} className="p-1 rounded-lg text-warm-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {addModal && (
        <Modal isOpen title="Aggiungi elemento" onClose={() => setAddModal(false)} size="sm">
          <div className="space-y-4">
            <div>
              <label className="label">Nome</label>
              <input type="text" className="input-field" placeholder="Es. Yogurt greco" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} autoFocus />
            </div>
            <div>
              <label className="label">Categoria</label>
              <select className="input-field" value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}>
                {CATEGORY_ORDER.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Quantità (opzionale)</label>
              <input type="text" className="input-field" placeholder="Es. 500g, 2 pezzi..." value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))} />
            </div>
            <button onClick={addManualItem} disabled={!newItem.name.trim()} className="btn-primary w-full">Aggiungi</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  getBabyShowerBudget,
  addBabyShowerBudgetItem,
  updateBabyShowerBudgetItem,
  deleteBabyShowerBudgetItem,
  updateBabyShowerOverallBudget,
} from '../api/api';

export default function BabyShowerBudgetTracker({ slug, sessionToken, themeColor }) {
  const [items, setItems] = useState([]);
  const [overallBudget, setOverallBudget] = useState('');
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newEstimated, setNewEstimated] = useState('');
  const [editingCell, setEditingCell] = useState(null); // { id, field }
  const [editingValue, setEditingValue] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getBabyShowerBudget(slug, sessionToken);
      setItems(res.data.items);
      setOverallBudget(res.data.overall_budget ?? '');
    } catch {
      // silently fail — dashboard will still render
    } finally {
      setLoading(false);
    }
  }, [slug, sessionToken]);

  useEffect(() => { load(); }, [load]);

  const totalEstimated = items.reduce((s, i) => s + parseFloat(i.estimated_amount || 0), 0);
  const totalActual = items.reduce((s, i) => s + parseFloat(i.actual_amount || 0), 0);
  const remaining = overallBudget !== '' ? parseFloat(overallBudget) - totalActual : null;
  const isOver = remaining !== null && remaining < 0;

  async function handleSaveOverallBudget() {
    try {
      await updateBabyShowerOverallBudget(slug, budgetInput, sessionToken);
      setOverallBudget(budgetInput);
    } catch { /* ignore */ }
    setEditingBudget(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      const res = await addBabyShowerBudgetItem(slug, {
        session_token: sessionToken,
        category: newCategory.trim(),
        estimated_amount: newEstimated || 0,
      });
      setItems(prev => [...prev, res.data]);
      setNewCategory('');
      setNewEstimated('');
    } catch { /* ignore */ }
  }

  async function handleDelete(id) {
    try {
      await deleteBabyShowerBudgetItem(slug, id, sessionToken);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch { /* ignore */ }
  }

  function startEdit(id, field, value) {
    setEditingCell({ id, field });
    setEditingValue(value ?? '');
  }

  async function commitEdit(item) {
    if (!editingCell) return;
    const { id, field } = editingCell;
    if (item.id !== id) return;
    try {
      const res = await updateBabyShowerBudgetItem(slug, id, {
        session_token: sessionToken,
        [field]: editingValue,
      });
      setItems(prev => prev.map(i => (i.id === id ? res.data : i)));
    } catch { /* ignore */ }
    setEditingCell(null);
  }

  const fmt = (n) => n != null ? `$${parseFloat(n).toFixed(2)}` : '—';

  if (loading) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-[1.2rem] font-semibold text-[#333]">Budget Tracker</h3>
        <div className="flex items-center gap-2 text-sm">
          {editingBudget ? (
            <>
              <span className="text-[#666]">Total budget: $</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-28 text-sm"
                value={budgetInput}
                onChange={e => setBudgetInput(e.target.value)}
                autoFocus
              />
              <button
                onClick={handleSaveOverallBudget}
                className="text-white px-3 py-1 rounded text-xs font-medium"
                style={{ background: themeColor }}
              >Save</button>
              <button
                onClick={() => setEditingBudget(false)}
                className="text-[#666] px-2 py-1 rounded text-xs border"
              >Cancel</button>
            </>
          ) : (
            <button
              onClick={() => { setEditingBudget(true); setBudgetInput(overallBudget); }}
              className="text-[#666] border rounded px-3 py-1 hover:bg-gray-50 text-xs"
            >
              {overallBudget ? `Total budget: $${parseFloat(overallBudget).toFixed(2)}` : 'Set total budget'}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ background: `${themeColor}15` }}>
              <th className="text-left px-3 py-2 font-semibold text-[#555]">Category</th>
              <th className="text-right px-3 py-2 font-semibold text-[#555]">Estimated</th>
              <th className="text-right px-3 py-2 font-semibold text-[#555]">Actual</th>
              <th className="text-left px-3 py-2 font-semibold text-[#555]">Notes</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-6 text-[#999] text-sm">No budget items yet — add one below</td>
              </tr>
            )}
            {items.map(item => (
              <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-3 py-2">
                  {editingCell?.id === item.id && editingCell?.field === 'category' ? (
                    <input
                      className="border rounded px-2 py-0.5 w-full text-sm"
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      onBlur={() => commitEdit(item)}
                      onKeyDown={e => e.key === 'Enter' && commitEdit(item)}
                      autoFocus
                    />
                  ) : (
                    <span className="cursor-pointer" onClick={() => startEdit(item.id, 'category', item.category)}>{item.category}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {editingCell?.id === item.id && editingCell?.field === 'estimated_amount' ? (
                    <input
                      type="number"
                      className="border rounded px-2 py-0.5 w-24 text-sm text-right"
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      onBlur={() => commitEdit(item)}
                      onKeyDown={e => e.key === 'Enter' && commitEdit(item)}
                      autoFocus
                    />
                  ) : (
                    <span className="cursor-pointer" onClick={() => startEdit(item.id, 'estimated_amount', item.estimated_amount)}>{fmt(item.estimated_amount)}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {editingCell?.id === item.id && editingCell?.field === 'actual_amount' ? (
                    <input
                      type="number"
                      className="border rounded px-2 py-0.5 w-24 text-sm text-right"
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      onBlur={() => commitEdit(item)}
                      onKeyDown={e => e.key === 'Enter' && commitEdit(item)}
                      autoFocus
                    />
                  ) : (
                    <span className="cursor-pointer text-[#999]" onClick={() => startEdit(item.id, 'actual_amount', item.actual_amount ?? '')}>{fmt(item.actual_amount)}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {editingCell?.id === item.id && editingCell?.field === 'notes' ? (
                    <input
                      className="border rounded px-2 py-0.5 w-full text-sm"
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      onBlur={() => commitEdit(item)}
                      onKeyDown={e => e.key === 'Enter' && commitEdit(item)}
                      autoFocus
                    />
                  ) : (
                    <span className="cursor-pointer text-[#999]" onClick={() => startEdit(item.id, 'notes', item.notes)}>{item.notes || <span className="text-[#ccc]">add note</span>}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => handleDelete(item.id)} className="text-[#ccc] hover:text-red-400 text-lg leading-none">×</button>
                </td>
              </tr>
            ))}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr style={{ background: `${themeColor}10` }}>
                <td className="px-3 py-2 font-semibold text-[#555]">Total</td>
                <td className="px-3 py-2 text-right font-semibold text-[#555]">{fmt(totalEstimated)}</td>
                <td className="px-3 py-2 text-right font-semibold text-[#555]">{fmt(totalActual)}</td>
                <td className="px-3 py-2 text-right font-semibold" colSpan={2}>
                  {remaining !== null && (
                    <span style={{ color: isOver ? '#e53e3e' : '#38a169' }}>
                      {isOver ? `Over by $${Math.abs(remaining).toFixed(2)}` : `$${remaining.toFixed(2)} left`}
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <form onSubmit={handleAdd} className="mt-3 flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Category (e.g. Catering)"
          className="border rounded px-3 py-2 text-sm flex-1 min-w-0"
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
        />
        <input
          type="number"
          placeholder="Estimated $"
          className="border rounded px-3 py-2 text-sm w-32"
          value={newEstimated}
          onChange={e => setNewEstimated(e.target.value)}
        />
        <button
          type="submit"
          className="text-white px-4 py-2 rounded text-sm font-medium whitespace-nowrap"
          style={{ background: themeColor }}
        >
          + Add
        </button>
      </form>
      <p className="text-xs text-[#aaa] mt-2">Click any cell to edit it.</p>
    </div>
  );
}

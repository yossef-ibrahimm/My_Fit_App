import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Flame, Zap, Droplet, Leaf, Plus, Search, ChevronRight } from 'lucide-react';

export default function FoodsPage({ foodsDB, setFoodsDB, showStatus, getFoodName }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const emptyForm = { name: '', serving_size: 100, serving_unit: 'g', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, category: '', tags: '' };
  const [foodForm, setFoodForm] = useState(emptyForm);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const categories = useMemo(() => ['all', ...Array.from(new Set((foodsDB || []).map(f => f.category || 'other')))], [foodsDB]);

  const filteredFoods = useMemo(() => {
    const q = (search || '').toString().toLowerCase();
    return (foodsDB || []).filter(food => {
      const name = (getFoodName(food) || '').toString().toLowerCase();
      const matchesSearch = name.includes(q);
      const matchesCategory = categoryFilter === 'all' || food.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [foodsDB, search, categoryFilter, getFoodName]);

  const openAddModal = () => { setEditingFood(null); setFoodForm(emptyForm); setShowFoodModal(true); };
  const openEditModal = (food) => { setEditingFood(food); setFoodForm({ ...food, name: getFoodName(food), tags: (food.tags || []).join(', ') }); setShowFoodModal(true); };

  const handleSaveFood = () => {
    const cleaned = {
      id: editingFood ? editingFood.id : Date.now().toString(),
      name: (foodForm.name || '').trim(),
      serving_size: Number(foodForm.serving_size) || 0,
      serving_unit: foodForm.serving_unit || 'g',
      calories: Number(foodForm.calories) || 0,
      protein_g: Number(foodForm.protein_g) || 0,
      carbs_g: Number(foodForm.carbs_g) || 0,
      fat_g: Number(foodForm.fat_g) || 0,
      fiber_g: Number(foodForm.fiber_g) || 0,
      category: (foodForm.category || '').trim(),
      tags: (foodForm.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    };

    if (!cleaned.name) { showStatus('error', 'Please provide a name for the food.'); return; }

    setFoodsDB(prev => {
      if (editingFood) return prev.map(f => f.id === cleaned.id ? cleaned : f);
      return [cleaned, ...prev];
    });

    setShowFoodModal(false);
    showStatus('success', editingFood ? 'Food updated.' : 'Food added.');
  };

  const handleDeleteFood = (id) => {
    if (!confirm('Delete this food? This cannot be undone.')) return;
    setFoodsDB(prev => prev.filter(f => f.id !== id));
    showStatus('success', 'Food deleted.');
  };

  const MacroBar = ({ protein, carbs, fat, total }) => {
    const pPct = total > 0 ? Math.round((protein / total) * 100) : 0;
    const cPct = total > 0 ? Math.round((carbs / total) * 100) : 0;
    const fPct = total > 0 ? Math.round((fat / total) * 100) : 0;
    return (
      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--border-light)', gap: 1 }}>
        {protein > 0 && <div style={{ flex: pPct, background: '#10B981' }} />}
        {carbs > 0 && <div style={{ flex: cPct, background: '#F59E0B' }} />}
        {fat > 0 && <div style={{ flex: fPct, background: '#EF4444' }} />}
      </div>
    );
  };

  const CategoryBadge = ({ category }) => {
    const colors = {
      fruits: { bg: '#FCE7F3', text: '#EC4899' },
      vegetables: { bg: '#DCFCE7', text: '#16A34A' },
      dairy: { bg: '#DBEAFE', text: '#0284C7' },
      meat: { bg: '#FEF3C7', text: '#B45309' },
      grains: { bg: '#FEE2E2', text: '#DC2626' },
      other: { bg: '#F3F4F6', text: '#6B7280' },
    };
    const style = colors[category?.toLowerCase()] || colors.other;
    return (
      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, backgroundColor: style.bg, color: style.text }}>
        {category || 'Other'}
      </span>
    );
  };

  const MacroChip = ({ icon: Icon, label, value, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: `${color}15`, borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, color }}>
      <Icon size={14} />
      <span>{label}: {value}</span>
    </div>
  );

  // Mobile Card Component
  const MobileFoodCard = ({ food, idx }) => {
    const totalMacroGrams = (food.protein_g || 0) + (food.carbs_g || 0) + (food.fat_g || 0);
    return (
      <div style={{
        background: 'var(--surface)',
        borderRadius: 12,
        border: '1px solid var(--border-light)',
        padding: 14,
        marginBottom: 12,
        transition: 'all var(--anim-fast) ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.95rem' }}>{getFoodName(food)}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
              <CategoryBadge category={food.category} />
              {food.tags && food.tags.length > 0 && (
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{food.tags[0]}</div>
              )}
            </div>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3B82F6', textAlign: 'right' }}>
            {food.calories}<div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 500 }}>kcal</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <MacroChip icon={Zap} label="P" value={`${food.protein_g}g`} color="#10B981" />
          <MacroChip icon={Leaf} label="C" value={`${food.carbs_g}g`} color="#F59E0B" />
          <MacroChip icon={Droplet} label="F" value={`${food.fat_g}g`} color="#EF4444" />
        </div>

        {totalMacroGrams > 0 && (
          <div style={{ marginBottom: 12 }}>
            <MacroBar protein={food.protein_g} carbs={food.carbs_g} fat={food.fat_g} total={totalMacroGrams} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-lighter)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary-600)', fontWeight: 600 }}>{food.serving_size}{food.serving_unit}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => openEditModal(food)} style={{ padding: 8, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all var(--anim-fast) ease' }} onMouseOver={(e) => e.target.style.background = 'rgba(59,130,246,0.2)'} onMouseOut={(e) => e.target.style.background = 'rgba(59,130,246,0.1)'}><Edit2 size={16} /></button>
            <button onClick={() => handleDeleteFood(food.id)} style={{ padding: 8, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all var(--anim-fast) ease' }} onMouseOver={(e) => e.target.style.background = 'rgba(239,68,68,0.2)'} onMouseOut={(e) => e.target.style.background = 'rgba(239,68,68,0.1)'}><Trash2 size={16} /></button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-section-container">
      <div className="card">
        {/* Header - Responsive */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0, marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid var(--border-light)' }}>
          <div>
            <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 800, margin: 0, marginBottom: 4 }}>Nutrition Database</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Manage your food library</p>
          </div>
          <button onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: isMobile ? '10px 16px' : '12px 20px', background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.3)', transition: 'all var(--anim-fast) ease', fontSize: isMobile ? '0.9rem' : '1rem' }} onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}>
            <Plus size={18} />
            {isMobile ? 'Add' : 'Add Food'}
          </button>
        </div>

        {/* Filter Section - Responsive */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center' }}>
          <div style={{ flex: 1, minWidth: isMobile ? 'auto' : 200, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Search foods..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: 40, padding: '10px 12px 10px 40px', border: '1px solid var(--border-light)', borderRadius: 10, background: 'var(--surface)', color: 'var(--text)', transition: 'all var(--anim-fast) ease', fontFamily: 'inherit', fontSize: isMobile ? '0.95rem' : '1rem' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'} onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'} />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 10, background: 'var(--surface)', color: 'var(--text)', fontWeight: 500, cursor: 'pointer', minWidth: isMobile ? 'auto' : 160, fontFamily: 'inherit', fontSize: isMobile ? '0.9rem' : '1rem' }}>
            {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
          </select>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textAlign: isMobile ? 'center' : 'left' }}>{filteredFoods.length} foods</div>
        </div>

        {/* Desktop Table or Mobile Cards */}
        {filteredFoods.length > 0 ? (
          isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {filteredFoods.map((food, idx) => (
                <MobileFoodCard key={food.id} food={food} idx={idx} />
              ))}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border-light)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.08), rgba(6,182,212,0.06))', borderBottom: '2px solid var(--border-light)' }}>
                    <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Food Name</th>
                    <th style={{ padding: 14, textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Serving</th>
                    <th style={{ padding: 14, textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Calories</th>
                    <th style={{ padding: 14, textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Macros</th>
                    <th style={{ padding: 14, textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Breakdown</th>
                    <th style={{ padding: 14, textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFoods.map((food, idx) => {
                    const totalMacroGrams = (food.protein_g || 0) + (food.carbs_g || 0) + (food.fat_g || 0);
                    return (
                      <tr key={food.id} style={{ borderBottom: '1px solid var(--border-lighter)', transition: 'all var(--anim-fast) ease', background: idx % 2 === 0 ? 'transparent' : 'rgba(124,58,237,0.02)' }} onMouseOver={(e) => { const parent = e.currentTarget; parent.style.background = 'rgba(124,58,237,0.04)'; }} onMouseOut={(e) => { const parent = e.currentTarget; parent.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(124,58,237,0.02)'; }}>
                        <td style={{ padding: 14 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{getFoodName(food)}</div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            <CategoryBadge category={food.category} />
                            {food.tags && food.tags.length > 0 && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{food.tags.slice(0, 2).join(', ')}</div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: 14, textAlign: 'center', fontWeight: 600, color: 'var(--primary-600)' }}>{food.serving_size}{food.serving_unit}</td>
                        <td style={{ padding: 14, textAlign: 'center' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3B82F6' }}>{food.calories}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>kcal</div>
                        </td>
                        <td style={{ padding: 14, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <MacroChip icon={Zap} label="P" value={`${food.protein_g}g`} color="#10B981" />
                            <MacroChip icon={Leaf} label="C" value={`${food.carbs_g}g`} color="#F59E0B" />
                            <MacroChip icon={Droplet} label="F" value={`${food.fat_g}g`} color="#EF4444" />
                          </div>
                        </td>
                        <td style={{ padding: 14, textAlign: 'center', minWidth: 120 }}>
                          {totalMacroGrams > 0 && <MacroBar protein={food.protein_g} carbs={food.carbs_g} fat={food.fat_g} total={totalMacroGrams} />}
                        </td>
                        <td style={{ padding: 14, textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                            <button onClick={() => openEditModal(food)} style={{ padding: 6, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all var(--anim-fast) ease' }} onMouseOver={(e) => e.target.style.background = 'rgba(59,130,246,0.2)'} onMouseOut={(e) => e.target.style.background = 'rgba(59,130,246,0.1)'}><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteFood(food.id)} style={{ padding: 6, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all var(--anim-fast) ease' }} onMouseOver={(e) => e.target.style.background = 'rgba(239,68,68,0.2)'} onMouseOut={(e) => e.target.style.background = 'rgba(239,68,68,0.1)'}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div style={{ textAlign: 'center', padding: isMobile ? 24 : 40, background: 'var(--surface-alt)', borderRadius: 10, border: '2px dashed var(--border-light)' }}>
            <Flame size={isMobile ? 36 : 48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <div style={{ fontSize: isMobile ? '1rem' : '1.125rem', fontWeight: 600, color: 'var(--text)' }}>No foods found</div>
            <div style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: '0.9rem' }}>Try adjusting your search or add a new food</div>
          </div>
        )}
      </div>

      {showFoodModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxHeight: isMobile ? '90vh' : 'auto', overflowY: isMobile ? 'auto' : 'visible' }}>
            <h3 className="modal-title border-bottom">{editingFood ? 'Edit Food' : 'Add New Food'}</h3>
            <div className="spacing-y-4 spacing-top-4">
              <div>
                <label className="input-label">Name</label>
                <input className="input-field" value={foodForm.name} onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })} />
              </div>

              <div className="grid-responsive-3-small">
                <div>
                  <label className="input-label">Serving Size</label>
                  <input type="number" className="input-field" value={foodForm.serving_size} onChange={(e) => setFoodForm({ ...foodForm, serving_size: e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Unit</label>
                  <input className="input-field" value={foodForm.serving_unit} onChange={(e) => setFoodForm({ ...foodForm, serving_unit: e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Category</label>
                  <input className="input-field" value={foodForm.category} onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })} />
                </div>
              </div>

              <div className="grid-responsive-4">
                <div>
                  <label className="input-label">Calories</label>
                  <input type="number" className="input-field" value={foodForm.calories} onChange={(e) => setFoodForm({ ...foodForm, calories: e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Protein (g)</label>
                  <input type="number" className="input-field" value={foodForm.protein_g} onChange={(e) => setFoodForm({ ...foodForm, protein_g: e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Carbs (g)</label>
                  <input type="number" className="input-field" value={foodForm.carbs_g} onChange={(e) => setFoodForm({ ...foodForm, carbs_g: e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Fat (g)</label>
                  <input type="number" className="input-field" value={foodForm.fat_g} onChange={(e) => setFoodForm({ ...foodForm, fat_g: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="input-label">Fiber (g)</label>
                <input type="number" className="input-field" value={foodForm.fiber_g} onChange={(e) => setFoodForm({ ...foodForm, fiber_g: e.target.value })} />
              </div>

              <div>
                <label className="input-label">Tags (comma separated)</label>
                <input className="input-field" value={foodForm.tags} onChange={(e) => setFoodForm({ ...foodForm, tags: e.target.value })} />
              </div>

              <div className="flex-justify-end spacing-top-4 spacing-left-3">
                <button onClick={() => setShowFoodModal(false)} className="cancel-button">Cancel</button>
                <button onClick={handleSaveFood} className="log-button">{editingFood ? 'Save Changes' : 'Add Food'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
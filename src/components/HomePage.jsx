import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Dumbbell, TrendingUp, Calendar } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

const styles = `
.tutorial-step { display:flex; gap:12px; align-items:flex-start }
.tutorial-step .icon { width:48px; height:48px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:22px }
@media (max-width:720px){ .grid-responsive-4{grid-template-columns:repeat(2,1fr)} }
`;

const translations = {
  ar: {
    hello: 'مرحباً،',
    quickGuide: '📖 دليل الاستخدام السريع',
    weightTracking: '⚖️ تتبع الوزن',
    latestWeight: 'الوزن الحالي',
    change: 'التغيير',
    updateWeight: '📝 تحديث الوزن',
    calories: 'السعرات',
    protein: 'البروتين',
    carbs: 'الكربوهيدرات',
    fat: 'الدهون',
    metabolicSummary: 'ملخص الأهداف و الأيض',
    bmr: 'BMR (معدل الأيض الأساسي)',
    tdee: 'TDEE (إجمالي الطاقة اليومية)',
    currentWeight: 'الوزن الحالي',
    fitnessGoal: 'الهدف الرياضي',
    dailyTarget: 'الهدف اليومي للسعرات',
    quickNav: 'التنقل السريع',
    logFood: 'تسجيل طعام',
    logWorkout: 'تسجيل تمرين',
    viewProgress: 'عرض التقدم',
    recalc: 'إعادة حساب',
    tutorialTitle: '📚 دليل استخدام FitTrack Pro',
    tutorialClose: 'فهمت، لنبدأ! 🚀',
    save: 'حفظ',
    cancel: 'إلغاء',
    tipTitle: '💡 نصيحة مهمة',
    tip: 'الاستمرارية هي سر النجاح! سجل بياناتك يومياً وستلاحظ النتائج بعد أسابيع قليلة.'
  },
  en: {
    hello: 'Hello,',
    quickGuide: '📖 Quick Start Guide',
    weightTracking: '⚖️ Weight Tracking',
    latestWeight: 'Latest Weight',
    change: 'Change',
    updateWeight: '📝 Update Weight',
    calories: 'Calories',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    metabolicSummary: 'Metabolic & Goal Summary',
    bmr: 'BMR (Basal Metabolic Rate)',
    tdee: 'TDEE (Total Daily Energy)',
    currentWeight: 'Current Weight',
    fitnessGoal: 'Fitness Goal',
    dailyTarget: 'Daily Calorie Target',
    quickNav: 'Quick Navigation',
    logFood: 'Log Food',
    logWorkout: 'Log Workout',
    viewProgress: 'View Progress',
    recalc: 'Recalculate',
    tutorialTitle: '📚 FitTrack Pro Quick Guide',
    tutorialClose: "Got it, let's start! 🚀",
    save: 'Save',
    cancel: 'Cancel',
    tipTitle: '💡 Pro Tip',
    tip: 'Consistency is the key! Log daily and you will see results in a few weeks.'
  }
};

const MacroCard = ({ title, current, target, unit, colorClass }) => {
  const percentage = target > 0 ? (current / target) * 100 : 0;
  const isOver = current > target;
  const barColor = isOver ? '#EF4444' : colorClass;
  const barWidth = Math.min(percentage, 100);

  return (
    <div className="macro-card">
      <h3 className="macro-card-title">{title}</h3>
      <div className="macro-card-values">
        <span className="macro-card-current">{Math.round(current)}</span>
        <span className="macro-card-target">/ {target} {unit}</span>
      </div>
      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ width: `${barWidth}%`, backgroundColor: barColor }} />
      </div>
      <p className={`macro-card-percentage ${isOver ? 'text-red' : 'text-gray-medium'}`}>
        {isOver ? 'TARGET EXCEEDED' : `${Math.round(percentage)}% of target`}
      </p>
    </div>
  );
};

const InfoItem = ({ label, value, color, className }) => (
  <div className="info-item">
    <span className="text-gray-medium">{label}</span>
    <span className={`font-semibold ${className}`} style={{ color: color }}>{value}</span>
  </div>
);

// local helper
const getDateString = (date) => date.toISOString().split('T')[0];

export default function HomePage({ user, dailyTotals, calorieTarget, macros, setCurrentPage, showStatus, setUser, bmr, tdee, baseline, setBaseline }) {
  const [lang, setLang] = useState('ar');
  const t = translations[lang];

  const [weightHistory, setWeightHistory] = useState(() => {
    const saved = localStorage.getItem('fitness_weightHistory');
    return saved ? JSON.parse(saved) : [{date: getDateString(new Date()), weight: user.weight_kg}];
  });
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState(user.weight_kg);
  const [showTutorial, setShowTutorial] = useState(false);

  const openTutorial = () => { setShowTutorial(true); if (typeof window !== 'undefined') window.scrollTo(0, 0); };
  const openWeightModalFor = (weight) => { setNewWeight(weight); setShowWeightModal(true); if (typeof window !== 'undefined') window.scrollTo(0, 0); };

  useEffect(() => {
    localStorage.setItem('fitness_weightHistory', JSON.stringify(weightHistory));
  }, [weightHistory]);

  // Sync weightHistory when user.weight_kg changes elsewhere (e.g., Calculator updates)
  useEffect(() => {
    const today = getDateString(new Date());
    const latest = weightHistory[weightHistory.length - 1]?.weight;
    if (Number(user.weight_kg) !== Number(latest)) {
      const existingIndex = weightHistory.findIndex(w => w.date === today);
      if (existingIndex >= 0) {
        const updated = [...weightHistory];
        updated[existingIndex] = { date: today, weight: Number(user.weight_kg) };
        setWeightHistory(updated);
      } else {
        setWeightHistory(prev => [...prev, { date: today, weight: Number(user.weight_kg) }]);
      }
    }
  }, [user.weight_kg]);

  const handleAddWeight = () => {
    const today = getDateString(new Date());
    const existingIndex = weightHistory.findIndex(w => w.date === today);
    
    if (existingIndex >= 0) {
      const updated = [...weightHistory];
      updated[existingIndex] = { date: today, weight: Number(newWeight) };
      setWeightHistory(updated);
    } else {
      setWeightHistory([...weightHistory, { date: today, weight: Number(newWeight) }]);
    }
    
    if (setUser) setUser({ ...user, weight_kg: Number(newWeight) });
    setShowWeightModal(false);
    if (showStatus) showStatus('success', 'تم تحديث الوزن بنجاح!');
  };

  const latestWeight = weightHistory[weightHistory.length - 1]?.weight || user.weight_kg;
  const initialWeight = weightHistory[0]?.weight || user.weight_kg;
  const weightChange = latestWeight - initialWeight;
  const weightTrend = weightHistory.slice(-7).map(w => ({
    date: w.date.substring(5).replace('-', '/'),
    Weight: w.weight
  }));

  const InfoBox = ({ title, value, color }) => (
    <div style={{ marginBottom: 8 }}>
      <div className="text-gray-medium">{title}</div>
      <div className="font-semibold" style={{ color }}>{value}</div>
    </div>
  );

  return (
    <div className="page-section-container">
      <style>{styles}</style>
      <div style={{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'center', marginBottom:12 }}>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <h2 style={{ margin:0 }}>{t.hello} {user.displayName}!</h2>
          <button onClick={openTutorial} className="log-button">{t.quickGuide}</button>
        </div>
        <div>
          <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="cancel-button">{lang === 'ar' ? 'EN' : 'عربى'}</button>
        </div>
      </div>

      {/* Onboarding banner when no baseline exists */}
      {!baseline && (
        <div className="card" style={{ background: 'linear-gradient(90deg,#FEF3C7,#DBEAFE)', padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ color:"#000  " , display: 'block', marginBottom: 6 }}>{lang === 'ar' ? 'مرحباً! لم تقم بحساب السعرات بعد' : 'Welcome! You haven\'t calculated targets yet'}</div>
              <div style={{ color: '#374151' }}>{lang === 'ar' ? 'ابدأ بالحساب ثم سجل وجباتك وبياناتك لبدء تتبع التقدم.' : 'Start by calculating your targets then log meals and your data to track progress.'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setCurrentPage('calculator')} className="log-button">{lang === 'ar' ? 'اذهب للحاسبة' : 'Go to Calculator'}</button>
              <button onClick={() => setCurrentPage('my-day')} className="cancel-button">{lang === 'ar' ? 'سجل وجبة الآن' : 'Log a Meal'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', marginBottom: '2rem' }}>
        <div className="flex-justify-between" style={{ alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>{t.weightTracking}</h3>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>{t.latestWeight}</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{latestWeight} <span style={{ fontSize: '1.2rem' }}>kg</span></p>
              </div>
              <div>
                <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>{t.change}</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.5rem 0', color: weightChange > 0 ? '#FCD34D' : weightChange < 0 ? '#A7F3D0' : 'white' }}>{weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg</p>
              </div>
            </div>
          </div>
          <button onClick={() => openWeightModalFor(latestWeight)} className="log-button" style={{ background:'white', color:'#f5576c' }}>{t.updateWeight}</button>
        </div>

        {weightTrend.length > 1 && (
          <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '1rem' }}>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={weightTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                <XAxis dataKey="date" stroke="white" style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="white" domain={[ 'dataMin - 2', 'dataMax + 2' ]} style={{ fontSize: '0.75rem' }} />
                <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: 'white' }} />
                <Line type="monotone" dataKey="Weight" stroke="white" strokeWidth={3} dot={{ fill: 'white', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid-responsive-4">
        <MacroCard title={t.calories} current={dailyTotals.calories} target={calorieTarget} unit={lang==='ar' ? 'سعر' : 'kcal'} colorClass="#3B82F6" />
        <MacroCard title={t.protein} current={dailyTotals.protein_g} target={macros.protein_g} unit={lang==='ar' ? 'جم' : 'g'} colorClass="#10B981" />
        <MacroCard title={t.carbs} current={dailyTotals.carbs_g} target={macros.carb_g} unit={lang==='ar' ? 'جم' : 'g'} colorClass="#F59E0B" />
        <MacroCard title={t.fat} current={dailyTotals.fat_g} target={macros.fat_g} unit={lang==='ar' ? 'جم' : 'g'} colorClass="#EF4444" />
      </div>

      {/* Baseline / Progress Comparison */}
      {baseline && (
        <div className="card" style={{ marginTop: 16 }}>
          <h4 style={{ margin: 0, marginBottom: 12, fontWeight: 'bold' }}>{lang === 'ar' ? 'مقارنة الأساس (Baseline)' : 'Baseline Comparison'}</h4>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 8 }}>
            <div style={{ minWidth: 180 }}>
              <div className="text-gray-medium">{lang==='ar'?'الأساس - السعرات':'Baseline - Calories'}</div>
              <div className="font-semibold">{baseline.calorieTarget} {lang==='ar'?'سعر':'kcal'}</div>
            </div>
            <div style={{ minWidth: 180 }}>
              <div className="text-gray-medium">{lang==='ar'?'السعرات الحالية':'Current Calories'}</div>
              <div className="font-semibold">{calorieTarget} {lang==='ar'?'سعر':'kcal'}</div>
            </div>
            <div style={{ minWidth: 180 }}>
              <div className="text-gray-medium">{lang==='ar'?'الوزن عند التطبيق':'Weight at Apply'}</div>
              <div className="font-semibold">{baseline.weight} kg</div>
            </div>
            <div style={{ minWidth: 180 }}>
              <div className="text-gray-medium">{lang==='ar'?'الوزن الحالي':'Current Weight'}</div>
              <div className="font-semibold">{weightHistory[weightHistory.length - 1]?.weight || user.weight_kg} kg</div>
            </div>
            <div style={{ minWidth: 220 }}>
              <div className="text-gray-medium">{lang==='ar'?'التغير منذ البداية':'Change Since Baseline'}</div>
              <div className="font-semibold">{((weightHistory[weightHistory.length - 1]?.weight || user.weight_kg) - baseline.weight).toFixed(1)} kg</div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => { if (confirm('Reset baseline?')) { setBaseline(null); localStorage.removeItem('fitness_baseline'); } }} className="cancel-button">{lang==='ar'?'إعادة تعيين الأساس':'Reset Baseline'}</button>
          </div>
        </div>
      )}

      <div className="grid-responsive-2" style={{ marginTop:16 }}>
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', paddingBottom: '1rem', borderBottom: '2px solid #E5E7EB', display: 'flex', alignItems: 'center' }}>
            <Calculator size={20} style={{ marginLeft: '8px', color: '#3B82F6' }}/>
            {t.metabolicSummary}
          </h3>
          <div className="spacing-4" style={{ marginTop: '1rem' }}>
            <InfoBox title={t.bmr} value={`${Math.round(bmr || 0)} ${lang==='ar'?'سعر':'kcal'}`} color="#1D4ED8" />
            <InfoBox title={t.tdee} value={`${Math.round(tdee || 0)} ${lang==='ar'?'سعر':'kcal'}`} color="#059669" />
            <InfoBox title={t.currentWeight} value={`${latestWeight} kg`} color="#1F2937" />
            <InfoBox title={t.fitnessGoal} value={user.goal === 'cut' ? (lang==='ar'?'تنشيف':'Cut') : user.goal === 'bulk' ? (lang==='ar'?'تضخيم':'Bulk') : (lang==='ar'?'ثبات':'Maintain')} color="#9333EA" />
            <InfoBox title={t.dailyTarget} value={`${calorieTarget} ${lang==='ar'?'سعر':'kcal'}`} color="#1E40AF" />
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', paddingBottom: '1rem', borderBottom: '2px solid #E5E7EB', display: 'flex', alignItems: 'center' }}>
            <TrendingUp size={20} style={{ marginLeft: '8px', color: '#F97316' }}/>
            {t.quickNav}
          </h3>
          <div className="grid-responsive-2" style={{ marginTop: '1rem', gap: '0.75rem' }}>
            <button onClick={() => setCurrentPage('my-day')} className="quick-action-button" style={{ backgroundColor: '#3B82F6' }}>{t.logFood}</button>
            <button onClick={() => setCurrentPage('workouts')} className="quick-action-button" style={{ backgroundColor: '#10B981' }}>{t.logWorkout}</button>
{/*             <button onClick={() => setCurrentPage('analytics')} className="quick-action-button" style={{ backgroundColor: '#9333EA' }}>{t.viewProgress}</button>
 */}            <button onClick={() => setCurrentPage('calculator')} className="quick-action-button" style={{ backgroundColor: '#F59E0B' }}>{t.recalc}</button>
          </div>
        </div>
      </div>

      {/* Weight Modal */}
      {showWeightModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 className="modal-title border-bottom">⚖️ {t.updateWeight}</h3>
            <div className="spacing-y-5">
              <div>
                <label className="input-label">{lang==='ar'?'الوزن الجديد (كجم)':'New weight (kg)'}</label>
                <input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} className="input-field-lg" style={{ fontSize: '1.5rem', textAlign: 'center' }} />
              </div>
              <div className="flex-justify-end">
                <button onClick={() => setShowWeightModal(false)} className="cancel-button">{t.cancel}</button>
                <button onClick={handleAddWeight} className="log-button">{t.save}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 className="modal-title border-bottom" style={{ fontSize: '1.8rem', color: '#667eea' }}>{t.tutorialTitle}</h3>
            <div className="spacing-y-5" style={{ marginTop: '1.5rem' }}>
              <div className="tutorial-step"><div className="icon" style={{background:'#3B82F6'}}>🎯</div><div><b>1.</b> {lang==='ar'?'ابدأ بصفحة الحاسبة لحساب السعرات والماكروز':''} {lang==='en'?'Start on the Calculator to compute your targets':''}</div></div>
              <div className="tutorial-step"><div className="icon" style={{background:'#F59E0B'}}>⚖️</div><div><b>2.</b> {lang==='ar'?'سجل وزنك يومياً من الصفحة الرئيسية':''} {lang==='en'?'Record your weight daily from the homepage':''}</div></div>
              <div className="tutorial-step"><div className="icon" style={{background:'#10B981'}}>🍽️</div><div><b>3.</b> {lang==='ar'?'سجل طعامك في يومي':''} {lang==='en'?'Log meals in My Day':''}</div></div>
              <div style={{background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding:'1.5rem', borderRadius:12, color:'white', textAlign:'center', marginTop:20}}>
                <p style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{t.tipTitle}</p>
                <p style={{ fontSize: '0.95rem', opacity: 0.95 }}>{t.tip}</p>
              </div>
            </div>
            <div className="flex-justify-end" style={{ marginTop: '1.5rem' }}>
              <button onClick={() => setShowTutorial(false)} className="log-button" style={{ background: '#667eea', padding: '12px 32px' }}>{t.tutorialClose}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

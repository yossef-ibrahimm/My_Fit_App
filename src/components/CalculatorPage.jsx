import React, { useState } from 'react';

const CalcInput = ({ label, type, value, onChange, options, step, min, max, unit }) => (
  <div>
    <label className="input-label">{label} {unit && <span className="text-xs text-gray-light">({unit})</span>}</label>
    {type === 'select' ? (
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field capitalize">
        <option value="" disabled hidden>Choose</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : (
      <input type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)} className="input-field" min={min} max={max} />
    )}
  </div>
);

const ResultBox = ({ title, value, unit, colorClass }) => (
  <div className={`result-box ${colorClass}`}>
    <p className="text-sm font-medium">{title}</p>
    <p className="text-3xl font-extrabold mt-1">{value} <span className="text-xl font-medium">{unit}</span></p>
  </div>
);

const MacroResult = ({ label, value, color }) => (
  <div className="macro-result-item">
    <p className="macro-result-value" style={{ color }}>{value}</p>
    <p className="macro-result-label">{label} (g)</p>
  </div>
);

export default function CalculatorPage({ user, setUser, showStatus, calculateBMR, calculateTDEE, calculateCalorieTarget, calculateMacros, setCurrentPage, setBaselineIfNotExists }) {
  const [calc, setCalc] = useState({ ...user });
  const [calcResults, setCalcResults] = useState(null);

  const handleCalculate = () => {
    const bmr = calculateBMR(calc.weight_kg, calc.height_cm, calc.age, calc.gender);
    const tdee = calculateTDEE(bmr, calc.activityLevel);
    const target = calculateCalorieTarget(tdee, calc.goal);
    const macros = calculateMacros(calc.weight_kg, target, calc.settings.proteinFactor, calc.settings.fatPercentage);
    setCalcResults({ bmr, tdee, target, macros });
  };

  const handleApplyToProfile = () => {
    setUser(calc);
    showStatus('success', 'Profile updated successfully!');
    setCurrentPage('home');
    // Create baseline snapshot the first time the user applies calculated targets
    if (calcResults && setBaselineIfNotExists) {
      const snapshot = {
        date: new Date().toISOString().split('T')[0],
        calorieTarget: calcResults.target,
        macros: calcResults.macros,
        weight: calc.weight_kg
      };
      setBaselineIfNotExists(snapshot);
    }
  };

  return (
    <div className="max-width-5xl spacing-8">
      <div className="card card-blue-border">
        <h2 className="card-title-xl border-bottom spacing-bottom-8">Calorie & Macro Target Setter</h2>
        <div className="grid-responsive-4">
          <CalcInput label="Name" type="text" value={calc.displayName || ''} onChange={(v) => setCalc({ ...calc, displayName: v })} />
          <CalcInput label="Gender" type="select" value={calc.gender} options={['male','female']} onChange={(v) => setCalc({ ...calc, gender: v })} />
          <CalcInput label="Age" type="number" value={calc.age} onChange={(v) => setCalc({ ...calc, age: Number(v) })} min="10" max="120" unit="years" />
          <CalcInput label="Weight" type="number" value={calc.weight_kg} onChange={(v) => setCalc({ ...calc, weight_kg: Number(v) })} min="20" max="300" unit="kg" />
          <CalcInput label="Height" type="number" value={calc.height_cm} onChange={(v) => setCalc({ ...calc, height_cm: Number(v) })} min="100" max="250" unit="cm" />
          <CalcInput label="Goal" type="select" value={calc.goal} options={['cut','maintain','bulk']} onChange={(v) => setCalc({ ...calc, goal: v })} />
          <CalcInput label="Activity Level" type="select" value={calc.activityLevel} options={['sedentary','light','moderate','very','extra']} onChange={(v) => setCalc({ ...calc, activityLevel: v })} />
          <CalcInput label="Protein Factor (g/kg)" type="number" step="0.1" value={calc.settings.proteinFactor} onChange={(v) => setCalc({ ...calc, settings: { ...calc.settings, proteinFactor: Number(v) } })} min="1.4" max="2.2" />
          <CalcInput label="Fat Percentage" type="number" step="0.05" value={calc.settings.fatPercentage} onChange={(v) => setCalc({ ...calc, settings: { ...calc.settings, fatPercentage: Number(v) } })} min="0.15" max="0.35" />
        </div>

        <button onClick={handleCalculate} className="calculate-button">Calculate My New Targets</button>
      </div>

      {calcResults && (
        <div className="card card-green-border">
          <h3 className="card-title-md text-green spacing-bottom-4">Calculated Targets</h3>
          <div className="grid-responsive-3">
            <ResultBox title="BMR" value={Math.round(calcResults.bmr)} unit="kcal" colorClass="result-box-blue" />
            <ResultBox title="TDEE" value={calcResults.tdee} unit="kcal" colorClass="result-box-green" />
            <ResultBox title="Daily Target" value={calcResults.target} unit="kcal" colorClass="result-box-purple" />
          </div>

          <div className="macro-target-summary">
            <h4 className="font-semibold text-xl spacing-bottom-3 border-bottom-light">Macro Targets (Grams)</h4>
            <div className="flex-justify-around">
                <MacroResult value={calcResults.macros.protein_g} label="Protein" color="#059669" />
                <MacroResult value={calcResults.macros.carb_g} label="Carbs" color="#D97706" />
                <MacroResult value={calcResults.macros.fat_g} label="Fat" color="#DC2626" />
            </div>
          </div>

          <button onClick={handleApplyToProfile} className="apply-button">Apply These Targets to My Profile</button>
        </div>
      )}
    </div>
  );
}

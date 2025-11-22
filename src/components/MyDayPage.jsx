import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Select from 'react-select';

export default function MyDayPage({ foodLogs, addFoodLog, deleteFoodLog, foodsDB, selectedDate, setSelectedDate, dailyTotals, calorieTarget, macros, showStatus }) {
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [selectedFood, setSelectedFood] = useState('');
  const [quantity, setQuantity] = useState(100);

  const openAddFoodModalFor = (meal) => { setSelectedMeal(meal); setShowAddFoodModal(true); if (typeof window !== 'undefined') window.scrollTo(0, 0); };

  const logsForDate = (foodLogs || []).filter(log => log.date === selectedDate);
  const groupedLogs = {
    breakfast: logsForDate.filter(l => l.meal === 'breakfast'),
    lunch: logsForDate.filter(l => l.meal === 'lunch'),
    dinner: logsForDate.filter(l => l.meal === 'dinner'),
    snacks: logsForDate.filter(l => l.meal === 'snacks'),
  };

  const handleAddFood = () => {
    if (selectedFood && quantity > 0) {
      addFoodLog(selectedFood, selectedMeal, quantity);
      setShowAddFoodModal(false);
      setSelectedFood('');
      setQuantity(100);
    } else {
      showStatus('error', 'Please select a food and enter a valid quantity.');
    }
  };

  const MealSection = ({ meal, logs, foodsDBLocal }) => {
    const mealTotal = logs.reduce((acc, log) => acc + log.calculated.calories, 0);

    return (
      <div className="card meal-section">
        <div className="flex-justify-between border-bottom spacing-bottom-4">
          <h3 className="text-xl font-bold capitalize text-gray-800">{meal}</h3>
          <div className="flex-align-center spacing-left-3">
            <span className="text-lg font-semibold text-gray-medium">{Math.round(mealTotal)} kcal</span>
            <button onClick={() => openAddFoodModalFor(meal)} className="add-food-button" aria-label={`Add food to ${meal}`}><Plus size={18} /></button>
          </div>
        </div>

        {logs.length === 0 ? (
          <p className="text-gray-light text-base italic text-center spacing-vertical-4">No foods logged for {meal}.</p>
        ) : (
          <div className="spacing-y-3">
            {logs.map(log => {
              const food = (foodsDBLocal || []).find(f => f.id === log.foodId);
              return (
                <div key={log.id} className="log-item">
                  <div>
                    <div className="font-medium text-gray-800">{(food && (food.name_en + '_' + food.name_ar)) || 'Unknown Food'}</div>
                    <div className="text-sm text-gray-medium font-semibold">{log.quantity}g</div>
                  </div>
                  <div className="flex-align-center spacing-left-3">
                    <div className="text-right text-sm">
                      <div className="font-bold text-blue">{Math.round(log.calculated.calories)} kcal</div>
                      <div className="text-xs text-gray-light">P: {Math.round(log.calculated.protein_g)}g | C: {Math.round(log.calculated.carbs_g)}g | F: {Math.round(log.calculated.fat_g)}g</div>
                    </div>
                    <button onClick={() => deleteFoodLog(log.id)} className="delete-log-button" aria-label="Delete food log"><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-section-container spacing-8">
      <div className="card">
        <div className="nutrition-log-header">
          <h2 className="text-3xl font-bold text-gray-800">Nutrition Log</h2>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="date-input" />
        </div>

        <div className="grid-responsive-4 spacing-top-4">
          <div className="macro-card">Calories: {dailyTotals.calories}</div>
          <div className="macro-card">Protein: {dailyTotals.protein_g}</div>
          <div className="macro-card">Carbs: {dailyTotals.carbs_g}</div>
          <div className="macro-card">Fat: {dailyTotals.fat_g}</div>
        </div>
      </div>

      <div className="grid-responsive-4 spacing-top-6">
        <MealSection meal="breakfast" logs={groupedLogs.breakfast} foodsDBLocal={foodsDB} />
        <MealSection meal="lunch" logs={groupedLogs.lunch} foodsDBLocal={foodsDB} />
        <MealSection meal="dinner" logs={groupedLogs.dinner} foodsDBLocal={foodsDB} />
        <MealSection meal="snacks" logs={groupedLogs.snacks} foodsDBLocal={foodsDB} />
      </div>

      {showAddFoodModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 className="modal-title border-bottom text-blue-dark">Log Food to <span className='capitalize'>{selectedMeal}</span></h3>
            <div className="spacing-y-5">
              <div>
                <label className="input-label spacing-bottom-2">Select Food</label>
              <Select
  className="react-select-container"
  classNamePrefix="react-select"
  options={(foodsDB || []).map(food => ({
    value: food.id,
    label: `${food.name_en}_${food.name_ar} (${food.calories} kcal / ${food.serving_size}${food.serving_unit})`
  }))}

  value={(foodsDB || [])
    .map(f => ({
      value: f.id,
      label: `${f.name_en}_${f.name_ar} (${f.calories} kcal / ${f.serving_size}${f.serving_unit})`
    }))
    .find(o => o.value === selectedFood) || null}

  onChange={(opt) => setSelectedFood(opt ? opt.value : '')}
  isClearable
  placeholder="Search or choose a food..."

  /** ←← هنا التعديل الخاص بالسليكت ده فقط */
  styles={{
    option: (base) => ({
      ...base,
      color: "black",
    }),
    singleValue: (base) => ({
      ...base,
      color: "black",
    }),
    input: (base) => ({
      ...base,
      color: "black",
    }),
  }}
/>

              </div>

              <div>
                <label className="input-label spacing-bottom-2">Quantity (grams)</label>
                <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="input-field-lg" min="1" />
              </div>

              {selectedFood && quantity > 0 && (() => {
                const food = (foodsDB || []).find(f => f.id === selectedFood);
                if (!food) return null;
                const multiplier = quantity / food.serving_size;
                const calc = {
                  calories: Math.round(food.calories * multiplier * 10) / 10,
                  protein_g: Math.round(food.protein_g * multiplier * 10) / 10,
                  carbs_g: Math.round(food.carbs_g * multiplier * 10) / 10,
                  fat_g: Math.round(food.fat_g * multiplier * 10) / 10,
                };

                return (
                  <div className="calc-summary-box">
                    <h4 className="font-semibold text-blue-dark spacing-bottom-2">Estimated Macros for {quantity}g:</h4>
                    <div className="flex-justify-between font-medium text-sm">
                      <span>Calories: <span className="text-lg font-bold text-blue">{Math.round(calc.calories)} kcal</span></span>
                      <span>P: {Math.round(calc.protein_g)}g</span>
                      <span>C: {Math.round(calc.carbs_g)}g</span>
                      <span>F: {Math.round(calc.fat_g)}g</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex-justify-end spacing-top-4 spacing-left-3">
                <button onClick={() => setShowAddFoodModal(false)} className="cancel-button">Cancel</button>
                <button onClick={handleAddFood} className="log-button">Log Food</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

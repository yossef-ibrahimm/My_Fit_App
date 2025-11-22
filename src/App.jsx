import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { User, Calculator, Database, Calendar, Dumbbell, TrendingUp, Plus, Trash2, Edit2, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import NavBar from './components/NavBar';
import { SAMPLE_FOODS, SAMPLE_EXERCISES } from './data/sampleData';
import HomePage from './components/HomePage';
import CalculatorPage from './components/CalculatorPage';
import FoodsPage from './components/FoodsPage';
import MyDayPage from './components/MyDayPage';
import WorkoutsPage from './components/WorkoutsPage';
/* import AnalyticsPage from './components/AnalyticsPage';
 */import './App.css';
// ==================== CALCULATIONS ====================
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

function calculateBMR(weight_kg, height_cm, age, gender) {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

function calculateTDEE(bmr, activityLevel) {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

function calculateCalorieTarget(tdee, goal) {
  if (goal === 'maintain') return tdee;
  if (goal === 'cut') return Math.round(tdee * 0.8);
  return Math.round(tdee * 1.15);
}

function calculateMacros(weight_kg, calorieTarget, proteinFactor, fatPercentage) {
  const protein_g = Math.round(weight_kg * proteinFactor);
  const fat_calories = calorieTarget * fatPercentage;
  const fat_g = Math.round(fat_calories / 9);
  const carb_calories = calorieTarget - (protein_g * 4) - (fat_g * 9);
  const carb_g = Math.max(0, Math.round(carb_calories / 4));
  
  return { protein_g, fat_g, carb_g };
}

// Helper to get date string 'YYYY-MM-DD'
const getDateString = (date) => date.toISOString().split('T')[0];

// SAMPLE_FOODS and SAMPLE_EXERCISES moved to `src/data/sampleData.js`

// Mock historical data for analytics (last 7 days)
const generateMockHistoricalData = (target) => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = getDateString(date);

        // Simple mock to generate data around the target
        const offset = Math.floor(Math.random() * 200) - 100; // -100 to +100
        const cal = target.calorieTarget + offset;
        
        data.push({
            date: i === 0 ? 'Today' : dateStr.substring(5).replace('-', '/'),
            Calories: Math.max(1000, cal),
            Protein: Math.max(10, target.macros.protein_g + Math.floor(offset / 10)),
            Carbs: Math.max(10, target.macros.carb_g + Math.floor(offset / 15)),
            Fat: Math.max(10, target.macros.fat_g + Math.floor(offset / 20)),
            WeightVolume: Math.round(Math.random() * 5000 + 10000), // 10k to 15k kg volume
        });
    }
    return data;
};


// ==================== MAIN APP ====================
export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  
  // --- LOCAL STORAGE INITIALIZATION FOR USER ---
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('fitness_user');
    return savedUser ? JSON.parse(savedUser) : {
      id: 'user1',
      email: 'user@example.com',
      displayName: 'John Doe',
      weight_kg: 80,
      height_cm: 180,
      age: 30,
      gender: 'male',
      activityLevel: 'moderate',
      goal: 'maintain',
      settings: {
        proteinFactor: 1.8,
        fatPercentage: 0.25,
      },
    };
  });

  // --- LOCAL STORAGE INITIALIZATION FOR LOGS ---
  const [foodLogs, setFoodLogs] = useState(() => {
    const savedFood = localStorage.getItem('fitness_foodLogs');
    return savedFood ? JSON.parse(savedFood) : [];
  });

  const [workoutLogs, setWorkoutLogs] = useState(() => {
    const savedWorkouts = localStorage.getItem('fitness_workoutLogs');
    return savedWorkouts ? JSON.parse(savedWorkouts) : [];
  });

  const [selectedDate, setSelectedDate] = useState(getDateString(new Date()));
  const [statusMessage, setStatusMessage] = useState(null);

  // --- SAVE TO LOCAL STORAGE ON CHANGE ---
  useEffect(() => {
    localStorage.setItem('fitness_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('fitness_foodLogs', JSON.stringify(foodLogs));
  }, [foodLogs]);

  useEffect(() => {
    localStorage.setItem('fitness_workoutLogs', JSON.stringify(workoutLogs));
  }, [workoutLogs]);

  // Foods database (shared across pages) persisted to localStorage
  const [foodsDB, setFoodsDB] = useState(() => {
    try {
      const saved = localStorage.getItem('fitness_foodDatabase');
      return saved ? JSON.parse(saved) : SAMPLE_FOODS;
    } catch (e) {
      return SAMPLE_FOODS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('fitness_foodDatabase', JSON.stringify(foodsDB));
    } catch (e) {
      console.warn('Could not save foods to localStorage', e);
    }
  }, [foodsDB]);


  // Custom Alert/Confirmation
  const showStatus = (type, message) => {
    setStatusMessage({ type, message });
    setTimeout(() => setStatusMessage(null), 3000); // Clear after 3 seconds
  };

  // Helper to get a display name for food entries (supports legacy `name` and `name_en`/`name_ar`)
  const getFoodName = (f) => {
    if (!f) return '';
    return `${f.name_en}_${f.name_ar }`|| '';
  };
  
  // Calculate user targets
  const bmr = useMemo(() => calculateBMR(user.weight_kg, user.height_cm, user.age, user.gender), [user]);
  const tdee = useMemo(() => calculateTDEE(bmr, user.activityLevel), [bmr, user.activityLevel]);
  const calorieTarget = useMemo(() => calculateCalorieTarget(tdee, user.goal), [tdee, user.goal]);
  const macros = useMemo(() => calculateMacros(user.weight_kg, calorieTarget, user.settings.proteinFactor, user.settings.fatPercentage), [user.weight_kg, calorieTarget, user.settings]);

  const targets = useMemo(() => ({calorieTarget, macros}), [calorieTarget, macros]);
  const historicalData = useMemo(() => generateMockHistoricalData(targets), [targets]);

  // Baseline snapshot (created first time user applies calculated targets)
  const [baseline, setBaseline] = useState(() => {
    try {
      const s = localStorage.getItem('fitness_baseline');
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (baseline) localStorage.setItem('fitness_baseline', JSON.stringify(baseline));
    } catch (e) {
      console.warn('Could not save baseline', e);
    }
  }, [baseline]);

  const setBaselineIfNotExists = (snapshot) => {
    if (!baseline) setBaseline(snapshot);
  };


  // Calculate daily totals for the selected date
  const dailyTotals = useMemo(() => {
    const logsForDate = foodLogs.filter(log => log.date === selectedDate);
    return logsForDate.reduce((acc, log) => ({
      calories: acc.calories + log.calculated.calories,
      protein_g: acc.protein_g + log.calculated.protein_g,
      carbs_g: acc.carbs_g + log.calculated.carbs_g,
      fat_g: acc.fat_g + log.calculated.fat_g,
    }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  }, [foodLogs, selectedDate]);

  const addFoodLog = useCallback((foodId, meal, quantity) => {
    const food = foodsDB.find(f => f.id === foodId);
    if (!food) {
      showStatus('error', 'Food not found!');
      return;
    }

    const multiplier = quantity / food.serving_size;
    const newLog = {
      id: Date.now().toString(),
      date: selectedDate,
      meal,
      foodId,
      quantity,
      calculated: {
        calories: Math.round(food.calories * multiplier * 10) / 10,
        protein_g: Math.round(food.protein_g * multiplier * 10) / 10,
        carbs_g: Math.round(food.carbs_g * multiplier * 10) / 10,
        fat_g: Math.round(food.fat_g * multiplier * 10) / 10,
      },
    };
    setFoodLogs(prev => [...prev, newLog]);
    showStatus('success', `Logged ${getFoodName(food)} successfully!`);
  }, [selectedDate]);

  const deleteFoodLog = useCallback((id) => {
    setFoodLogs(foodLogs.filter(log => log.id !== id));
    showStatus('success', 'Food log deleted.');
  }, [foodLogs]);

  const addWorkoutLog = useCallback((workout) => {
    setWorkoutLogs(prev => [...prev, { ...workout, id: Date.now().toString(), date: selectedDate }]);
    showStatus('success', `Logged workout: ${workout.name}`);
  }, [selectedDate]);

  const deleteWorkoutLog = useCallback((id) => {
    setWorkoutLogs(workoutLogs.filter(log => log.id !== id));
    showStatus('success', 'Workout deleted.');
  }, [workoutLogs]);

  // ==================== UI COMPONENTS ====================

  const Header = () => (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <h1 className="logo">
            <Dumbbell size={28} style={{ marginRight: '8px' }} />
            FitTrack Pro
          </h1>
          <NavBar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        </div>
      </div>
    </header>
  );

  const StatusToast = ({ type, message }) => {
    const Icon = type === 'success' ? CheckCircle : XCircle;
    const bgColorClass = type === 'success' ? 'toast-success' : 'toast-error';
    
    return (
      <div className={`toast ${bgColorClass}`}>
        <Icon size={24} />
        <span className="toast-message">{message}</span>
      </div>
    );
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
          return (
            <HomePage
              setCurrentPage={setCurrentPage}
              user={user}
              dailyTotals={dailyTotals}
              calorieTarget={calorieTarget}
              macros={macros}
              bmr={bmr}
              tdee={tdee}
              showStatus={showStatus}
              setUser={setUser}
              baseline={baseline}
              setBaseline={setBaseline}
            />
          );
      case 'calculator':
        return <CalculatorPage user={user} setUser={setUser} showStatus={showStatus} calculateBMR={calculateBMR} calculateTDEE={calculateTDEE} calculateCalorieTarget={calculateCalorieTarget} calculateMacros={calculateMacros} setCurrentPage={setCurrentPage} setBaselineIfNotExists={setBaselineIfNotExists} />;
      case 'foods':
        return <FoodsPage foodsDB={foodsDB} setFoodsDB={setFoodsDB} showStatus={showStatus} getFoodName={getFoodName} />;
      case 'my-day':
        return <MyDayPage foodLogs={foodLogs} addFoodLog={addFoodLog} deleteFoodLog={deleteFoodLog} foodsDB={foodsDB} selectedDate={selectedDate} setSelectedDate={setSelectedDate} dailyTotals={dailyTotals} calorieTarget={calorieTarget} macros={macros} showStatus={showStatus} />;
      case 'workouts':
        return <WorkoutsPage workoutLogs={workoutLogs} addWorkoutLog={addWorkoutLog} deleteWorkoutLog={deleteWorkoutLog} selectedDate={selectedDate} setSelectedDate={setSelectedDate} showStatus={showStatus} />;
/*       case 'analytics':
        return <AnalyticsPage historicalData={historicalData} calorieTarget={calorieTarget} />;
 */      default:
        return <HomePage user={user} dailyTotals={dailyTotals} calorieTarget={calorieTarget} macros={macros} setCurrentPage={setCurrentPage} baseline={baseline} setBaseline={setBaseline} bmr={bmr} tdee={tdee} showStatus={showStatus} setUser={setUser} />;
    }
  };

  return (
    <div>

      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="container-main">
          {renderPage()}
        </main>
        {statusMessage && <StatusToast type={statusMessage.type} message={statusMessage.message} />}
      </div>
    </div>
  );
}
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { User, Calculator, Database, Calendar, Dumbbell, TrendingUp, Plus, Trash2, Edit2, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import NavBar from './components/NavBar';
import './App.css';
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

// ==================== MOCK DATA ====================

// Food Data (now in pure JS object array)
const SAMPLE_FOODS = [
  // --- اللحوم والدواجن ---
  { id: '1', name_en: 'Grilled Chicken Breast', name_ar: 'صدر دجاج مشوي', serving_size: 100, serving_unit: 'g', calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, fiber_g: 0, category: 'meat', tags: ['high-protein', 'low-carb'] },
  { id: '2', name_en: 'Beef Steak', name_ar: 'ستيك لحم بقر', serving_size: 100, serving_unit: 'g', calories: 271, protein_g: 25, carbs_g: 0, fat_g: 18, fiber_g: 0, category: 'meat', tags: ['high-protein'] },
  { id: '3', name_en: 'Turkey Breast', name_ar: 'صدر ديك رومي', serving_size: 100, serving_unit: 'g', calories: 135, protein_g: 29, carbs_g: 0, fat_g: 1, fiber_g: 0, category: 'meat', tags: ['high-protein', 'low-fat'] },
  { id: '4', name_en: 'Lamb Chop', name_ar: 'كتف ضأن', serving_size: 100, serving_unit: 'g', calories: 294, protein_g: 25, carbs_g: 0, fat_g: 21, fiber_g: 0, category: 'meat', tags: ['high-protein'] },
  { id: '5', name_en: 'Chicken Thigh', name_ar: 'فخذ دجاج', serving_size: 100, serving_unit: 'g', calories: 209, protein_g: 26, carbs_g: 0, fat_g: 11, fiber_g: 0, category: 'meat', tags: ['protein'] },

  // --- الأسماك والمأكولات البحرية ---
  { id: '6', name_en: 'Salmon Fillet', name_ar: 'فيليه سلمون', serving_size: 100, serving_unit: 'g', calories: 208, protein_g: 20, carbs_g: 0, fat_g: 13, fiber_g: 0, category: 'fish', tags: ['omega-3', 'high-protein'] },
  { id: '7', name_en: 'Tuna', name_ar: 'تونة', serving_size: 100, serving_unit: 'g', calories: 132, protein_g: 28, carbs_g: 0, fat_g: 1, fiber_g: 0, category: 'fish', tags: ['high-protein'] },
  { id: '8', name_en: 'Shrimp', name_ar: 'جمبري', serving_size: 100, serving_unit: 'g', calories: 99, protein_g: 24, carbs_g: 0, fat_g: 0.3, fiber_g: 0, category: 'fish', tags: ['low-fat', 'high-protein'] },
  { id: '9', name_en: 'Cod', name_ar: 'سمك القد', serving_size: 100, serving_unit: 'g', calories: 82, protein_g: 18, carbs_g: 0, fat_g: 0.7, fiber_g: 0, category: 'fish', tags: ['low-fat', 'protein'] },
  { id: '10', name_en: 'Mackerel', name_ar: 'ماكريل', serving_size: 100, serving_unit: 'g', calories: 205, protein_g: 19, carbs_g: 0, fat_g: 13, fiber_g: 0, category: 'fish', tags: ['omega-3'] },

  // --- الحبوب والبقوليات ---
  { id: '11', name_en: 'Brown Rice', name_ar: 'أرز بني', serving_size: 100, serving_unit: 'g', calories: 112, protein_g: 2.6, carbs_g: 24, fat_g: 0.9, fiber_g: 1.8, category: 'grains', tags: ['carbs'] },
  { id: '12', name_en: 'White Rice', name_ar: 'أرز أبيض', serving_size: 100, serving_unit: 'g', calories: 130, protein_g: 2.4, carbs_g: 28, fat_g: 0.3, fiber_g: 0.4, category: 'grains', tags: ['carbs'] },
  { id: '13', name_en: 'Oatmeal', name_ar: 'شوفان', serving_size: 100, serving_unit: 'g', calories: 389, protein_g: 17, carbs_g: 66, fat_g: 7, fiber_g: 11, category: 'grains', tags: ['fiber', 'breakfast'] },
  { id: '14', name_en: 'Lentils', name_ar: 'عدس', serving_size: 100, serving_unit: 'g', calories: 116, protein_g: 9, carbs_g: 20, fat_g: 0.4, fiber_g: 8, category: 'legumes', tags: ['fiber', 'protein'] },
  { id: '15', name_en: 'Chickpeas', name_ar: 'حمص', serving_size: 100, serving_unit: 'g', calories: 164, protein_g: 9, carbs_g: 27, fat_g: 2.6, fiber_g: 7.6, category: 'legumes', tags: ['fiber', 'protein'] },

  // --- الخضروات ---
  { id: '16', name_en: 'Broccoli', name_ar: 'بروكلي', serving_size: 100, serving_unit: 'g', calories: 34, protein_g: 2.8, carbs_g: 7, fat_g: 0.4, fiber_g: 2.6, category: 'vegetables', tags: ['low-calorie'] },
  { id: '17', name_en: 'Spinach', name_ar: 'سبانخ', serving_size: 100, serving_unit: 'g', calories: 23, protein_g: 2.9, carbs_g: 3.6, fat_g: 0.4, fiber_g: 2.2, category: 'vegetables', tags: ['iron', 'low-calorie'] },
  { id: '18', name_en: 'Carrot', name_ar: 'جزر', serving_size: 100, serving_unit: 'g', calories: 41, protein_g: 0.9, carbs_g: 10, fat_g: 0.2, fiber_g: 2.8, category: 'vegetables', tags: ['vitamin-A', 'low-calorie'] },
  { id: '19', name_en: 'Tomato', name_ar: 'طماطم', serving_size: 100, serving_unit: 'g', calories: 18, protein_g: 0.9, carbs_g: 3.9, fat_g: 0.2, fiber_g: 1.2, category: 'vegetables', tags: ['vitamin-C'] },
  { id: '20', name_en: 'Cucumber', name_ar: 'خيار', serving_size: 100, serving_unit: 'g', calories: 16, protein_g: 0.7, carbs_g: 3.6, fat_g: 0.1, fiber_g: 0.5, category: 'vegetables', tags: ['low-calorie'] },

  // --- الفواكه ---
  { id: '21', name_en: 'Banana', name_ar: 'موز', serving_size: 100, serving_unit: 'g', calories: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3, fiber_g: 2.6, category: 'fruits', tags: ['natural-sugar'] },
  { id: '22', name_en: 'Apple', name_ar: 'تفاح', serving_size: 100, serving_unit: 'g', calories: 52, protein_g: 0.3, carbs_g: 14, fat_g: 0.2, fiber_g: 2.4, category: 'fruits', tags: ['low-fat', 'fiber'] },
  { id: '23', name_en: 'Orange', name_ar: 'برتقال', serving_size: 100, serving_unit: 'g', calories: 47, protein_g: 0.9, carbs_g: 12, fat_g: 0.1, fiber_g: 2.4, category: 'fruits', tags: ['vitamin-C'] },
  { id: '24', name_en: 'Strawberry', name_ar: 'فراولة', serving_size: 100, serving_unit: 'g', calories: 33, protein_g: 0.7, carbs_g: 8, fat_g: 0.3, fiber_g: 2, category: 'fruits', tags: ['antioxidants'] },
  { id: '25', name_en: 'Grapes', name_ar: 'عنب', serving_size: 100, serving_unit: 'g', calories: 69, protein_g: 0.7, carbs_g: 18, fat_g: 0.2, fiber_g: 0.9, category: 'fruits', tags: ['natural-sugar'] },

  // --- المكسرات والبذور ---
  { id: '26', name_en: 'Almonds', name_ar: 'لوز', serving_size: 100, serving_unit: 'g', calories: 579, protein_g: 21, carbs_g: 22, fat_g: 50, fiber_g: 12, category: 'nuts', tags: ['healthy-fats'] },
  { id: '27', name_en: 'Walnuts', name_ar: 'جوز', serving_size: 100, serving_unit: 'g', calories: 654, protein_g: 15, carbs_g: 14, fat_g: 65, fiber_g: 7, category: 'nuts', tags: ['omega-3'] },
  { id: '28', name_en: 'Cashews', name_ar: 'كاجو', serving_size: 100, serving_unit: 'g', calories: 553, protein_g: 18, carbs_g: 30, fat_g: 44, fiber_g: 3.3, category: 'nuts', tags: ['healthy-fats'] },
  { id: '29', name_en: 'Peanuts', name_ar: 'فول سوداني', serving_size: 100, serving_unit: 'g', calories: 567, protein_g: 26, carbs_g: 16, fat_g: 49, fiber_g: 8.5, category: 'nuts', tags: ['healthy-fats'] },
  { id: '30', name_en: 'Chia Seeds', name_ar: 'بذور شيا', serving_size: 100, serving_unit: 'g', calories: 486, protein_g: 17, carbs_g: 42, fat_g: 31, fiber_g: 34, category: 'seeds', tags: ['fiber', 'omega-3'] },

  // --- منتجات الألبان ---
  { id: '31', name_en: 'Greek Yogurt', name_ar: 'زبادي يوناني', serving_size: 100, serving_unit: 'g', calories: 59, protein_g: 10, carbs_g: 3.6, fat_g: 0.4, fiber_g: 0, category: 'dairy', tags: ['high-protein', 'low-fat'] },
  { id: '32', name_en: 'Milk', name_ar: 'حليب', serving_size: 100, serving_unit: 'ml', calories: 42, protein_g: 3.4, carbs_g: 5, fat_g: 1, fiber_g: 0, category: 'dairy', tags: ['calcium'] },
  { id: '33', name_en: 'Cheddar Cheese', name_ar: 'جبنة شيدر', serving_size: 100, serving_unit: 'g', calories: 403, protein_g: 25, carbs_g: 1.3, fat_g: 33, fiber_g: 0, category: 'dairy', tags: ['high-fat', 'protein'] },
  { id: '34', name_en: 'Cottage Cheese', name_ar: 'جبنة قريش', serving_size: 100, serving_unit: 'g', calories: 98, protein_g: 11, carbs_g: 3.4, fat_g: 4.3, fiber_g: 0, category: 'dairy', tags: ['low-fat', 'protein'] },
  { id: '35', name_en: 'Butter', name_ar: 'زبدة', serving_size: 100, serving_unit: 'g', calories: 717, protein_g: 0.9, carbs_g: 0.1, fat_g: 81, fiber_g: 0, category: 'dairy', tags: ['high-fat'] },

  // --- البيض ---
  { id: '36', name_en: 'Egg', name_ar: 'بيضة', serving_size: 50, serving_unit: 'g', calories: 78, protein_g: 6, carbs_g: 0.6, fat_g: 5, fiber_g: 0, category: 'dairy', tags: ['high-protein'] },
  { id: '37', name_en: 'Egg White', name_ar: 'بياض بيض', serving_size: 100, serving_unit: 'g', calories: 52, protein_g: 11, carbs_g: 0.7, fat_g: 0.2, fiber_g: 0, category: 'dairy', tags: ['high-protein', 'low-fat'] },

  // --- المشروبات الصحية ---
  { id: '38', name_en: 'Green Tea', name_ar: 'شاي أخضر', serving_size: 200, serving_unit: 'ml', calories: 2, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, category: 'beverages', tags: ['antioxidants'] },
  { id: '39', name_en: 'Black Coffee', name_ar: 'قهوة سوداء', serving_size: 200, serving_unit: 'ml', calories: 2, protein_g: 0.3, carbs_g: 0, fat_g: 0, fiber_g: 0, category: 'beverages', tags: ['caffeine'] },
  { id: '40', name_en: 'Orange Juice', name_ar: 'عصير برتقال', serving_size: 200, serving_unit: 'ml', calories: 85, protein_g: 1.7, carbs_g: 20, fat_g: 0.2, fiber_g: 0.5, category: 'beverages', tags: ['vitamin-C'] },
  { id: '41', name_en: 'Almond Milk', name_ar: 'حليب لوز', serving_size: 200, serving_unit: 'ml', calories: 39, protein_g: 1, carbs_g: 3.4, fat_g: 2.5, fiber_g: 0.8, category: 'beverages', tags: ['low-calorie'] },

  // --- سناكات صحية ---
  { id: '42', name_en: 'Protein Bar', name_ar: 'لوح بروتين', serving_size: 50, serving_unit: 'g', calories: 200, protein_g: 20, carbs_g: 18, fat_g: 7, fiber_g: 3, category: 'snacks', tags: ['high-protein'] },
  { id: '43', name_en: 'Rice Cake', name_ar: 'كعكة أرز', serving_size: 20, serving_unit: 'g', calories: 77, protein_g: 1.5, carbs_g: 16, fat_g: 0.1, fiber_g: 0.2, category: 'snacks', tags: ['low-calorie'] },
  { id: '44', name_en: 'Beef Jerky', name_ar: 'لحم مقدد', serving_size: 28, serving_unit: 'g', calories: 116, protein_g: 9.4, carbs_g: 3.1, fat_g: 7.3, fiber_g: 0, category: 'snacks', tags: ['high-protein'] },
  { id: '45', name_en: 'Popcorn', name_ar: 'بوب كورن', serving_size: 100, serving_unit: 'g', calories: 387, protein_g: 12, carbs_g: 78, fat_g: 4.3, fiber_g: 15, category: 'snacks', tags: ['fiber'] },
  { id: '46', name_en: 'Dark Chocolate', name_ar: 'شوكولاتة داكنة', serving_size: 100, serving_unit: 'g', calories: 546, protein_g: 4.9, carbs_g: 61, fat_g: 31, fiber_g: 7, category: 'snacks', tags: ['antioxidants'] },

  // --- البذور ---
  { id: '47', name_en: 'Sunflower Seeds', name_ar: 'بذور دوار الشمس', serving_size: 100, serving_unit: 'g', calories: 584, protein_g: 21, carbs_g: 20, fat_g: 51, fiber_g: 8.6, category: 'seeds', tags: ['healthy-fats'] },
  { id: '48', name_en: 'Pumpkin Seeds', name_ar: 'بذور يقطين', serving_size: 100, serving_unit: 'g', calories: 559, protein_g: 30, carbs_g: 10, fat_g: 49, fiber_g: 6, category: 'seeds', tags: ['protein', 'healthy-fats'] },
  { id: '49', name_en: 'Flax Seeds', name_ar: 'بذور كتان', serving_size: 100, serving_unit: 'g', calories: 534, protein_g: 18, carbs_g: 29, fat_g: 42, fiber_g: 27, category: 'seeds', tags: ['omega-3', 'fiber'] },

  // --- إضافات عامة ---
  { id: '50', name_en: 'Honey', name_ar: 'عسل', serving_size: 100, serving_unit: 'g', calories: 304, protein_g: 0.3, carbs_g: 82, fat_g: 0, fiber_g: 0.2, category: 'sweeteners', tags: ['natural-sugar'] },
];

const SAMPLE_EXERCISES = [
  { id: 'e1', name: 'Bench Press', muscleGroups: ['chest', 'triceps'] },
  { id: 'e2', name: 'Squat', muscleGroups: ['legs', 'glutes'] },
  { id: 'e3', name: 'Deadlift', muscleGroups: ['back', 'legs'] },
  { id: 'e4', name: 'Overhead Press', muscleGroups: ['shoulders', 'triceps'] },
  { id: 'e5', name: 'Pull-ups', muscleGroups: ['back', 'biceps'] },
];

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

  const MacroCard = ({ title, current, target, unit, colorClass }) => {
    const percentage = target > 0 ? (current / target) * 100 : 0;
    const isOver = current > target;
    const barColor = isOver ? '#EF4444' : colorClass; // Red-500 for exceed
    const barWidth = Math.min(percentage, 100);
    
    return (
      <div className="macro-card">
        <h3 className="macro-card-title">{title}</h3>
        <div className="macro-card-values">
          <span className="macro-card-current">{Math.round(current)}</span>
          <span className="macro-card-target">/ {target} {unit}</span>
        </div>
        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{ width: `${barWidth}%`, backgroundColor: barColor }}
          />
        </div>
        <p className={`macro-card-percentage ${isOver ? 'text-red' : 'text-gray-medium'}`}>
          {isOver ? 'TARGET EXCEEDED' : `${Math.round(percentage)}% of target`}
        </p>
      </div>
    );
  };

  // ==================== PAGES ====================

  const HomePage = () => (
    <div className="page-section-container">
      <div className="welcome-banner">
        <h2 className="welcome-title">Hello, {user.displayName}!</h2>
        <p className="welcome-text">Your health journey starts here. Let's make today count.</p>
      </div>

      <div className="grid-responsive-4">
        <MacroCard title="Calories" current={dailyTotals.calories} target={calorieTarget} unit="kcal" colorClass="#3B82F6" /> {/* Blue-500 */}
        <MacroCard title="Protein" current={dailyTotals.protein_g} target={macros.protein_g} unit="g" colorClass="#10B981" /> {/* Green-500 */}
        <MacroCard title="Carbs" current={dailyTotals.carbs_g} target={macros.carb_g} unit="g" colorClass="#F59E0B" /> {/* Yellow-500 */}
        <MacroCard title="Fat" current={dailyTotals.fat_g} target={macros.fat_g} unit="g" colorClass="#EF4444" /> {/* Red-500 */}
      </div>

      <div className="grid-responsive-2">
        <div className="card">
          <h3 className="card-title-lg border-bottom flex-align-center">
            <Calculator size={20} style={{ marginRight: '8px', color: '#3B82F6' }}/>
            Metabolic & Goal Summary
          </h3>
          <div className="spacing-4">
            <InfoItem label="BMR (Basal Metabolic Rate)" value={`${Math.round(bmr)} kcal`} color="#1D4ED8" />
            <InfoItem label="TDEE (Total Daily Energy)" value={`${tdee} kcal`} color="#059669" />
            <InfoItem label="Current Weight" value={`${user.weight_kg} kg`} color="#1F2937" />
            <InfoItem label="Fitness Goal" value={user.goal.toUpperCase()} color="#9333EA" />
            <InfoItem label="Daily Calorie Target" value={`${calorieTarget} kcal`} color="#1E40AF" className="font-extrabold"/>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title-lg border-bottom flex-align-center">
            <TrendingUp size={20} style={{ marginRight: '8px', color: '#F97316' }}/>
            Quick Navigation
          </h3>
          <div className="grid-responsive-2-small">
            <QuickActionButton id="my-day" label="Log Food" icon={Calendar} color="#3B82F6" />
            <QuickActionButton id="workouts" label="Log Workout" icon={Dumbbell} color="#10B981" />
            <QuickActionButton id="analytics" label="View Progress" icon={TrendingUp} color="#9333EA" />
            <QuickActionButton id="calculator" label="Recalculate Targets" icon={Calculator} color="#F59E0B" />
          </div>
        </div>
      </div>
    </div>
  );

  const QuickActionButton = ({ id, label, icon: Icon, color }) => (
    <button
      onClick={() => setCurrentPage(id)}
      className="quick-action-button"
      style={{ backgroundColor: color }}
    >
      <Icon style={{ margin: '0 auto 8px', display: 'block' }} size={28} />
      <span className="quick-action-label">{label}</span>
    </button>
  );

  const InfoItem = ({ label, value, color, className }) => (
    <div className="info-item">
      <span className="text-gray-medium">{label}</span>
      <span className={`font-semibold ${className}`} style={{ color: color }}>{value}</span>
    </div>
  );

  const CalculatorPage = () => {
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
    };

    return (
      <div className="max-width-5xl spacing-8">
        <div className="card card-blue-border">
          <h2 className="card-title-xl border-bottom spacing-bottom-8">Calorie & Macro Target Setter</h2>
          
          <div className="grid-responsive-4">
            <CalcInput label="Gender" type="select" value={calc.gender} options={['male', 'female']} onChange={(v) => setCalc({ ...calc, gender: v })} />
            <CalcInput label="Age" type="number" value={calc.age} onChange={(v) => setCalc({ ...calc, age: Number(v) })} min="10" max="120" unit="years" />
            <CalcInput label="Weight" type="number" value={calc.weight_kg} onChange={(v) => setCalc({ ...calc, weight_kg: Number(v) })} min="20" max="300" unit="kg" />
            <CalcInput label="Height" type="number" value={calc.height_cm} onChange={(v) => setCalc({ ...calc, height_cm: Number(v) })} min="100" max="250" unit="cm" />
            
            <CalcInput label="Goal" type="select" value={calc.goal} options={['cut', 'maintain', 'bulk']} onChange={(v) => setCalc({ ...calc, goal: v })} />
            <CalcInput label="Activity Level" type="select" value={calc.activityLevel} options={Object.keys(ACTIVITY_MULTIPLIERS)} onChange={(v) => setCalc({ ...calc, activityLevel: v })} />

            <CalcInput label="Protein Factor (g/kg)" type="number" step="0.1" value={calc.settings.proteinFactor} onChange={(v) => setCalc({ ...calc, settings: { ...calc.settings, proteinFactor: Number(v) } })} min="1.4" max="2.2" />
            <CalcInput label="Fat Percentage" type="number" step="0.05" value={calc.settings.fatPercentage} onChange={(v) => setCalc({ ...calc, settings: { ...calc.settings, fatPercentage: Number(v) } })} min="0.15" max="0.35" />
          </div>

          <button
            onClick={handleCalculate}
            className="calculate-button"
          >
            Calculate My New Targets
          </button>
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

            <button
              onClick={handleApplyToProfile}
              className="apply-button"
            >
              Apply These Targets to My Profile
            </button>
          </div>
        )}
      </div>
    );
  };
  
  const CalcInput = ({ label, type, value, onChange, options, step, min, max, unit }) => (
    <div>
      <label className="input-label">{label} {unit && <span className="text-xs text-gray-light">({unit})</span>}</label>
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field capitalize"
        >
          <option value="" disabled selected hidden style={{color: "#696969ff"}}>Choose</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt.replace('-', ' ').replace('_', ' ')}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field"
          min={min}
          max={max}
        />
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

  const FoodsPage = () => {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Use shared foods DB from App root
    const foods = foodsDB;
    const setFoods = setFoodsDB;

    // Modal / form state for add/edit
    const [showFoodModal, setShowFoodModal] = useState(false);
    const [editingFood, setEditingFood] = useState(null);
    const emptyForm = { name: '', serving_size: 100, serving_unit: 'g', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, category: '', tags: '' };
    const [foodForm, setFoodForm] = useState(emptyForm);

    const categories = useMemo(() => ['all', ...Array.from(new Set(foods.map(f => f.category || 'other')))], [foods]);

    const filteredFoods = useMemo(() => {
      const q = (search || '').toString().toLowerCase();
      return foods.filter(food => {
        const name = (getFoodName(food) || '').toString().toLowerCase();
        const matchesSearch = name.includes(q);
        const matchesCategory = categoryFilter === 'all' || food.category === categoryFilter;
        return matchesSearch && matchesCategory;
      });
    }, [foods, search, categoryFilter]);

    const openAddModal = () => {
      setEditingFood(null);
      setFoodForm(emptyForm);
      setShowFoodModal(true);
    };

    const openEditModal = (food) => {
      setEditingFood(food);
      setFoodForm({ ...food, name: getFoodName(food), tags: (food.tags || []).join(', ') });
      setShowFoodModal(true);
    };

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

      if (!cleaned.name) {
        showStatus('error', 'Please provide a name for the food.');
        return;
      }

      setFoods(prev => {
        if (editingFood) {
          return prev.map(f => f.id === cleaned.id ? cleaned : f);
        }
        return [cleaned, ...prev];
      });

      setShowFoodModal(false);
      showStatus('success', editingFood ? 'Food updated.' : 'Food added.');
    };

    const handleDeleteFood = (id) => {
      if (!confirm('Delete this food? This cannot be undone.')) return;
      setFoods(prev => prev.filter(f => f.id !== id));
      showStatus('success', 'Food deleted.');
    };

    return (
      <div className="page-section-container">
        <div className="card">
          <div className="flex-justify-between border-bottom spacing-bottom-6">
            <h2 className="card-title-xl">Nutrition Database</h2>
            <div>
              <button onClick={openAddModal} className="log-button" aria-label="Add food">Add Food</button>
            </div>
          </div>

          <div className="food-filter-container spacing-top-6">
            <input
              type="text"
              placeholder="Search foods (e.g., 'chicken', 'rice')..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="food-search-input"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="food-category-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat} className="capitalize">{cat === 'all' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>

          <div className="table-container spacing-top-6">
            <table className="food-table">
              <thead className="food-table-header">
                <tr>
                  <th className="table-cell table-cell-left min-w-150 text-gray-700">Food Name</th>
                  <th className="table-cell table-cell-right text-gray-700">Serving</th>
                  <th className="table-cell table-cell-right text-blue">Calories</th>
                  <th className="table-cell table-cell-right text-green">Protein (g)</th>
                  <th className="table-cell table-cell-right text-yellow">Carbs (g)</th>
                  <th className="table-cell table-cell-right text-red">Fat (g)</th>
                  <th className="table-cell table-cell-right text-purple">Fiber (g)</th>
                  <th className="table-cell table-cell-right text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFoods.map(food => (
                  <tr key={food.id} className="table-row-hover">
                    <td className="table-cell">
                      <div className="font-medium text-gray-800">{getFoodName(food)}</div>
                      <div className="text-xs text-gray-light capitalize">{food.category} {food.tags && <span className="text-xs">• {food.tags.join(', ')}</span>}</div>
                    </td>
                    <td className="table-cell table-cell-right text-gray-medium">{food.serving_size}{food.serving_unit}</td>
                    <td className="table-cell table-cell-right font-bold text-blue">{food.calories}</td>
                    <td className="table-cell table-cell-right font-medium">{food.protein_g}</td>
                    <td className="table-cell table-cell-right font-medium">{food.carbs_g}</td>
                    <td className="table-cell table-cell-right font-medium">{food.fat_g}</td>
                    <td className="table-cell table-cell-right font-medium">{food.fiber_g}</td>
                    <td className="table-cell table-cell-right">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button onClick={() => openEditModal(food)} className="cancel-button" aria-label="Edit food"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteFood(food.id)} className="delete-log-button" aria-label="Delete food"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Food Modal */}
        {showFoodModal && (
          <div className="modal-backdrop">
            <div className="modal-content">
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
  };

  const MyDayPage = () => {
    const [showAddFoodModal, setShowAddFoodModal] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState('breakfast');
    const [selectedFood, setSelectedFood] = useState('');
    const [quantity, setQuantity] = useState(100);

    const logsForDate = foodLogs.filter(log => log.date === selectedDate);
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

    const MealSection = ({ meal, logs }) => {
      const mealTotal = logs.reduce((acc, log) => acc + log.calculated.calories, 0);
      
      return (
        <div className="card meal-section">
          <div className="flex-justify-between border-bottom spacing-bottom-4">
            <h3 className="text-xl font-bold capitalize text-gray-800">{meal}</h3>
            <div className="flex-align-center spacing-left-3">
              <span className="text-lg font-semibold text-gray-medium">{Math.round(mealTotal)} kcal</span>
              <button
                onClick={() => {
                  setSelectedMeal(meal);
                  setShowAddFoodModal(true);
                }}
                className="add-food-button"
                aria-label={`Add food to ${meal}`}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          
          {logs.length === 0 ? (
            <p className="text-gray-light text-base italic text-center spacing-vertical-4">No foods logged for {meal}.</p>
          ) : (
            <div className="spacing-y-3">
                    {logs.map(log => {
            const food = foodsDB.find(f => f.id === log.foodId);
                return (
                  <div key={log.id} className="log-item">
                    <div>
                      <div className="font-medium text-gray-800">{getFoodName(food) || 'Unknown Food'}</div>
                      <div className="text-sm text-gray-medium font-semibold">{log.quantity}g</div>
                    </div>
                    <div className="flex-align-center spacing-left-3">
                      <div className="text-right text-sm">
                        <div className="font-bold text-blue">{Math.round(log.calculated.calories)} kcal</div>
                        <div className="text-xs text-gray-light">
                          P: {Math.round(log.calculated.protein_g)}g | 
                          C: {Math.round(log.calculated.carbs_g)}g | 
                          F: {Math.round(log.calculated.fat_g)}g
                        </div>
                      </div>
                      <button
                        onClick={() => deleteFoodLog(log.id)}
                        className="delete-log-button"
                        aria-label="Delete food log"
                      >
                        <Trash2 size={16} />
                      </button>
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
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-input"
            />
          </div>

          <div className="grid-responsive-4 spacing-top-4">
            <MacroCard title="Calories" current={dailyTotals.calories} target={calorieTarget} unit="kcal" colorClass="#3B82F6" />
            <MacroCard title="Protein" current={dailyTotals.protein_g} target={macros.protein_g} unit="g" colorClass="#10B981" />
            <MacroCard title="Carbs" current={dailyTotals.carbs_g} target={macros.carb_g} unit="g" colorClass="#F59E0B" />
            <MacroCard title="Fat" current={dailyTotals.fat_g} target={macros.fat_g} unit="g" colorClass="#EF4444" />
          </div>
        </div>

        <div className="grid-responsive-4 spacing-top-6">
          <MealSection meal="breakfast" logs={groupedLogs.breakfast} />
          <MealSection meal="lunch" logs={groupedLogs.lunch} />
          <MealSection meal="dinner" logs={groupedLogs.dinner} />
          <MealSection meal="snacks" logs={groupedLogs.snacks} />
        </div>

        {/* Add Food Modal */}
        {showAddFoodModal && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h3 className="modal-title border-bottom text-blue-dark">Log Food to <span className='capitalize'>{selectedMeal}</span></h3>
              
              <div className="spacing-y-5">
                <div>
                  <label className="input-label spacing-bottom-2">Select Food</label>
                    <select
                    value={selectedFood}
                    onChange={(e) => setSelectedFood(e.target.value)}
                    className="input-field-lg"
                  >
                    <option value="">Choose a food...</option>
                    {foodsDB.map(food => (
                      <option key={food.id} value={food.id}>
                        {getFoodName(food)} ({food.calories} kcal / {food.serving_size}{food.serving_unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label spacing-bottom-2">Quantity (grams)</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="input-field-lg"
                    min="1"
                  />
                </div>

                {/* Dynamic Calculation Display (Completed) */}
                {selectedFood && quantity > 0 && (() => {
                  const food = foodsDB.find(f => f.id === selectedFood);
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
                  <button
                    onClick={() => setShowAddFoodModal(false)}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddFood}
                    className="log-button"
                  >
                    Log Food
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const WorkoutsPage = () => {
    const [isAddingWorkout, setIsAddingWorkout] = useState(false);
    const [workoutName, setWorkoutName] = useState('');
    const [muscleGroup, setMuscleGroup] = useState('');
    const [sets, setSets] = useState(3);
    const [reps, setReps] = useState(10);
    const [weight, setWeight] = useState(50);
    const [workoutType, setWorkoutType] = useState('strength');
    
    const logsForDate = workoutLogs.filter(log => log.date === selectedDate);
    
    const handleAddWorkout = () => {
      if (workoutName && muscleGroup) {
        const newWorkout = { 
          name: workoutName, 
          type: workoutType,
          muscleGroup,
          details: workoutType === 'strength' ? { sets, reps, weight } : { duration: sets, distance: reps }, // Reusing inputs for cardio mock
        };
        addWorkoutLog(newWorkout);
        setIsAddingWorkout(false);
        setWorkoutName('');
        setMuscleGroup('');
      } else {
        showStatus('error', 'Please enter workout name and primary muscle group.');
      }
    };

    const WorkoutLogItem = ({ log }) => (
      <div className="log-item workout-log-item">
        <div className="flex-1">
          <div className="font-bold text-gray-800">{log.name}</div>
          <div className="text-sm text-gray-medium capitalize">{log.muscleGroup} ({log.type})</div>
          {log.type === 'strength' && (
            <div className="text-xs text-gray-light mt-1">
              {log.details.sets} Sets | {log.details.reps} Reps @ {log.details.weight} kg
            </div>
          )}
           {log.type !== 'strength' && (
            <div className="text-xs text-gray-light mt-1">
              Duration: {log.details.duration} mins | Distance: {log.details.distance} km
            </div>
          )}
        </div>
        <button
          onClick={() => deleteWorkoutLog(log.id)}
          className="delete-log-button"
          aria-label="Delete workout log"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );

    return (
      <div className="page-section-container spacing-8">
        <div className="card">
          <div className="nutrition-log-header">
            <h2 className="text-3xl font-bold text-gray-800">Workout Log</h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-input"
            />
          </div>

          <button
            onClick={() => setIsAddingWorkout(true)}
            className="add-workout-button"
          >
            <Plus size={20} style={{ marginRight: '8px' }}/> Log New Exercise
          </button>

          <div className="spacing-y-4 spacing-top-6">
            <h3 className="card-title-md border-bottom text-blue-dark spacing-bottom-3">Logged Workouts for {selectedDate}</h3>
            {logsForDate.length === 0 ? (
              <p className="text-gray-light text-base italic text-center spacing-vertical-4">No workouts logged for this day.</p>
            ) : (
              <div className="spacing-y-3">
                {logsForDate.map(log => <WorkoutLogItem key={log.id} log={log} />)}
              </div>
            )}
          </div>
        </div>
        
        {/* Add Workout Modal */}
        {isAddingWorkout && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h3 className="modal-title border-bottom text-green-dark">Log New Workout</h3>
              
              <div className="spacing-y-5">
                <CalcInput label="Exercise Name" type="text" value={workoutName} onChange={setWorkoutName} />
                <CalcInput label="Primary Muscle Group" type="select" value={muscleGroup} options={['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full body', 'cardio']} onChange={setMuscleGroup} />
                <CalcInput label="Workout Type" type="select" value={workoutType} options={['strength', 'cardio']} onChange={setWorkoutType} />

                {workoutType === 'strength' ? (
                  <div className="grid-responsive-3-small">
                    <CalcInput label="Sets" type="number" value={sets} onChange={setSets} min="1" />
                    <CalcInput label="Reps" type="number" value={reps} onChange={setReps} min="1" />
                    <CalcInput label="Weight (kg)" type="number" value={weight} onChange={setWeight} min="0" step="2.5" />
                  </div>
                ) : (
                   <div className="grid-responsive-2-small">
                    <CalcInput label="Duration (minutes)" type="number" value={sets} onChange={setSets} min="1" />
                    <CalcInput label="Distance (km)" type="number" value={reps} onChange={setReps} min="0" step="0.1" />
                  </div>
                )}
              </div>

              <div className="flex-justify-end spacing-top-4 spacing-left-3">
                <button
                  onClick={() => setIsAddingWorkout(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWorkout}
                  className="log-button log-button-green"
                >
                  Log Workout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const AnalyticsPage = () => {
    const workoutVolumeData = historicalData.map(d => ({ date: d.date, 'Weight Volume (kg)': d.WeightVolume / 1000 }));
    
    return (
      <div className="page-section-container spacing-8">
        <h2 className="text-3xl font-bold text-gray-800 spacing-bottom-6">Progress Analytics (Last 7 Days)</h2>

        <div className="grid-responsive-2">
          {/* Calorie Trend */}
          <div className="chart-card">
            <h3 className="card-title-md text-blue-dark border-bottom spacing-bottom-3">Calorie Intake Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData} margin={{ top: 15, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '10px' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }}/>
                <Line type="monotone" dataKey="Calories" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Target" stroke="#EF4444" strokeDasharray="5 5" strokeWidth={1} dot={false} 
                  data={historicalData.map(d => ({ ...d, Target: calorieTarget }))} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Macro Trend */}
          <div className="chart-card">
            <h3 className="card-title-md text-green-dark border-bottom spacing-bottom-3">Macronutrient Intake (g)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={historicalData} margin={{ top: 15, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '10px' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }}/>
                <Bar dataKey="Protein" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Carbs" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Fat" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Workout Volume */}
          <div className="chart-card full-span-mobile">
            <h3 className="card-title-md text-purple-dark border-bottom spacing-bottom-3">Total Workout Volume (Tons)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workoutVolumeData} margin={{ top: 15, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" domain={[0, 20]} label={{ value: 'Tons (1000s kg)', angle: -90, position: 'insideLeft', fill: '#6B7280' }}/>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '10px' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }}/>
                <Bar dataKey="Weight Volume (kg)" fill="#9333EA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    );
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'calculator':
        return <CalculatorPage />;
      case 'foods':
        return <FoodsPage />;
      case 'my-day':
        return <MyDayPage />;
      case 'workouts':
        return <WorkoutsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
  
      
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
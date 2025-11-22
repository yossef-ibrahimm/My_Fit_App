import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function AnalyticsPage({ historicalData = [], calorieTarget }) {
  // Prepare workout volume chart data (convert kg → tons)
  const workoutVolumeData = historicalData.map(item => ({
    date: item.date,
    volumeTons: item.WeightVolume / 1000,
  }));

  return (
    <div className="page-section-container spacing-8">
      <h2 className="text-3xl font-bold text-gray-800 spacing-bottom-6">
        Progress Analytics (Last 7 Days)
      </h2>

      <div className="grid-responsive-2">

        {/* === Calorie Intake Trend === */}
        <div className="chart-card">
          <h3 className="card-title-md text-blue-dark border-bottom spacing-bottom-3">
            Calorie Intake Trend
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Legend />

              <Line
                type="monotone"
                dataKey="Calories"
                stroke="#3B82F6"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />

              {/* Constant Target Line */}
              <Line
                type="monotone"
                dataKey="Target"
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                // inject calorieTarget for every data point
                data={historicalData.map(d => ({ ...d, Target: calorieTarget }))}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* === Macronutrient Chart === */}
        <div className="chart-card">
          <h3 className="card-title-md text-green-dark border-bottom spacing-bottom-3">
            Macronutrient Intake (g)
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Legend />

              <Bar dataKey="Protein" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Carbs" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Fat" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* === Workout Volume Chart === */}
        <div className="chart-card full-span-mobile">
          <h3 className="card-title-md text-purple-dark border-bottom spacing-bottom-3">
            Total Workout Volume (Tons)
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workoutVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Legend />

              <Bar
                dataKey="volumeTons"
                name="Weight Volume (tons)"
                fill="#9333EA"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

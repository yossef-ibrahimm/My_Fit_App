import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function WorkoutsPage({ workoutLogs, addWorkoutLog, deleteWorkoutLog, selectedDate, setSelectedDate, showStatus }) {
  const [isAddingWorkout, setIsAddingWorkout] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(50);
  const [workoutType, setWorkoutType] = useState('strength');

  const logsForDate = (workoutLogs || []).filter(log => log.date === selectedDate);

  const handleAddWorkout = () => {
    if (workoutName && muscleGroup) {
      const newWorkout = {
        name: workoutName,
        type: workoutType,
        muscleGroup,
        details: workoutType === 'strength' ? { sets, reps, weight } : { duration: sets, distance: reps },
      };
      addWorkoutLog(newWorkout);
      setIsAddingWorkout(false);
      setWorkoutName('');
      setMuscleGroup('');
    } else {
      showStatus('error', 'Please enter workout name and primary muscle group.');
    }
  };

  const openAddWorkout = () => { setIsAddingWorkout(true); if (typeof window !== 'undefined') window.scrollTo(0, 0); };

  const WorkoutLogItem = ({ log }) => (
    <div className="log-item workout-log-item">
      <div className="flex-1">
        <div className="font-bold text-gray-800">{log.name}</div>
        <div className="text-sm text-gray-medium capitalize">{log.muscleGroup} ({log.type})</div>
        {log.type === 'strength' && (
          <div className="text-xs text-gray-light mt-1">{log.details.sets} Sets | {log.details.reps} Reps @ {log.details.weight} kg</div>
        )}
        {log.type !== 'strength' && (
          <div className="text-xs text-gray-light mt-1">Duration: {log.details.duration} mins | Distance: {log.details.distance} km</div>
        )}
      </div>
      <button onClick={() => deleteWorkoutLog(log.id)} className="delete-log-button" aria-label="Delete workout log"><Trash2 size={16} /></button>
    </div>
  );

  return (
    <div className="page-section-container spacing-8">
      <div className="card">
        <div className="nutrition-log-header">
          <h2 className="text-3xl font-bold text-gray-800">Workout Log</h2>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="date-input" />
        </div>

        <button onClick={openAddWorkout} className="add-workout-button"><Plus size={20} style={{ marginRight: '8px' }}/> Log New Exercise</button>

        <div className="spacing-y-4 spacing-top-6">
          <h3 className="card-title-md border-bottom text-blue-dark spacing-bottom-3">Logged Workouts for {selectedDate}</h3>
          {logsForDate.length === 0 ? (
            <p className="text-gray-light text-base italic text-center spacing-vertical-4">No workouts logged for this day.</p>
          ) : (
            <div className="spacing-y-3">{logsForDate.map(log => <WorkoutLogItem key={log.id} log={log} />)}</div>
          )}
        </div>
      </div>

      {isAddingWorkout && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 className="modal-title border-bottom text-green-dark">Log New Workout</h3>
            <div className="spacing-y-5">
              <div>
                <label className="input-label">Exercise Name</label>
                <input className="input-field" value={workoutName} onChange={(e) => setWorkoutName(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Primary Muscle Group</label>
                <select className="input-field" value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)}>
                  <option value="">Choose</option>
                  {['chest','back','legs','shoulders','arms','core','full body','cardio'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Workout Type</label>
                <select className="input-field" value={workoutType} onChange={(e) => setWorkoutType(e.target.value)}>
                  <option value="strength">strength</option>
                  <option value="cardio">cardio</option>
                </select>
              </div>

              {workoutType === 'strength' ? (
                <div className="grid-responsive-3-small">
                  <div>
                    <label className="input-label">Sets</label>
                    <input type="number" className="input-field" value={sets} onChange={(e) => setSets(Number(e.target.value))} min="1" />
                  </div>
                  <div>
                    <label className="input-label">Reps</label>
                    <input type="number" className="input-field" value={reps} onChange={(e) => setReps(Number(e.target.value))} min="1" />
                  </div>
                  <div>
                    <label className="input-label">Weight (kg)</label>
                    <input type="number" className="input-field" value={weight} onChange={(e) => setWeight(Number(e.target.value))} min="0" step="2.5" />
                  </div>
                </div>
              ) : (
                <div className="grid-responsive-2-small">
                  <div>
                    <label className="input-label">Duration (minutes)</label>
                    <input type="number" className="input-field" value={sets} onChange={(e) => setSets(Number(e.target.value))} min="1" />
                  </div>
                  <div>
                    <label className="input-label">Distance (km)</label>
                    <input type="number" className="input-field" value={reps} onChange={(e) => setReps(Number(e.target.value))} min="0" step="0.1" />
                  </div>
                </div>
              )}

              <div className="flex-justify-end spacing-top-4 spacing-left-3">
                <button onClick={() => setIsAddingWorkout(false)} className="cancel-button">Cancel</button>
                <button onClick={handleAddWorkout} className="log-button log-button-green">Log Workout</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Save, X } from "lucide-react"

interface Exercise {
  id: string
  name: string
  category: string
  description?: string
  sets: number
  reps: string
  rest: string
  notes: string
  videoUrl?: string
}

interface WorkoutDay {
  dayNumber: number
  name: string
  isRestDay: boolean
  estimatedDuration?: number
  notes?: string
  exercises: Exercise[]
}

interface WorkoutBuilderProps {
  onSave: (workout: { 
    name: string; 
    description: string; 
    exercises: Exercise[]; 
    isPublic: boolean;
    isMultiDay?: boolean;
    days?: WorkoutDay[];
  }) => void
  isLoading?: boolean
  editMode?: boolean
  editProgramId?: string
  initialData?: {
    name: string
    description: string
    isMultiDay: boolean
    numberOfDays: number
    days: WorkoutDay[]
  }
}

export default function WorkoutBuilder({ onSave, isLoading = false, editMode = false, editProgramId, initialData }: WorkoutBuilderProps) {
  const [workoutName, setWorkoutName] = useState(initialData?.name || "")
  const [workoutDescription, setWorkoutDescription] = useState(initialData?.description || "")
  const [isMultiDay, setIsMultiDay] = useState(initialData?.isMultiDay || false)
  const [numberOfDays, setNumberOfDays] = useState(initialData?.numberOfDays || 2)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>(initialData?.days || [])
  const [showExerciseForm, setShowExerciseForm] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [exerciseSearch, setExerciseSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [newExercise, setNewExercise] = useState<Omit<Exercise, 'id'> & { dayIndex?: number; exerciseId?: string }>({
    name: "",
    category: "",
    sets: 3,
    reps: "10",
    rest: "60s",
    notes: "",
    videoUrl: "",
    dayIndex: undefined,
    exerciseId: undefined
  })

  // Fetch exercises on component mount
  useEffect(() => {
    fetchAvailableExercises()
    fetchCategories()
  }, [])

  // Initialize workout days when editing or when multi-day is enabled
  useEffect(() => {
    if (editMode && initialData?.days) {
      setWorkoutDays(initialData.days)
    } else if (isMultiDay && workoutDays.length === 0) {
      initializeWorkoutDays()
    }
  }, [editMode, initialData, isMultiDay])

  // Filter exercises based on search and category
  const filteredExercises = availableExercises.filter(exercise =>
    (exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
     exercise.category.toLowerCase().includes(exerciseSearch.toLowerCase())) &&
    (selectedCategory === "" || exercise.category === selectedCategory)
  )

  const [exerciseCategories, setExerciseCategories] = useState<string[]>([])

  // Fetch available exercises from the exercise library
  const fetchAvailableExercises = async () => {
    try {
      const response = await fetch('/api/exercises')
      if (response.ok) {
        const data = await response.json()
        setAvailableExercises(data.exercises || [])
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    }
  }

  // Fetch exercise categories from the database
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/exercises/categories', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setExerciseCategories(data.categories || [])
      } else {
        console.error('Failed to fetch categories')
        // Fallback to default categories if API fails
        setExerciseCategories(["Strength", "Cardio", "Flexibility", "Balance", "Power", "Endurance", "Recovery"])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Fallback to default categories if API fails
      setExerciseCategories(["Strength", "Cardio", "Flexibility", "Balance", "Power", "Endurance", "Recovery"])
    }
  }

  // Initialize workout days when multi-day is enabled
  const initializeWorkoutDays = () => {
    const days: WorkoutDay[] = []
    for (let i = 1; i <= numberOfDays; i++) {
      days.push({
        dayNumber: i,
        name: `Day ${i}`,
        isRestDay: false,
        estimatedDuration: 60,
        notes: "",
        exercises: []
      })
    }
    setWorkoutDays(days)
  }

  // Handle multi-day toggle
  const handleMultiDayToggle = (enabled: boolean) => {
    setIsMultiDay(enabled)
    if (enabled) {
      initializeWorkoutDays()
    } else {
      setWorkoutDays([])
    }
  }

  // Handle number of days change
  const handleNumberOfDaysChange = (newNumberOfDays: number) => {
    // Check if reducing days and there are exercises that would be lost
    if (newNumberOfDays < numberOfDays && isMultiDay) {
      const exercisesInRemovedDays = workoutDays
        .slice(newNumberOfDays)
        .some(day => day.exercises.length > 0)
      
      if (exercisesInRemovedDays) {
        const confirmed = window.confirm(
          `Reducing to ${newNumberOfDays} days will remove exercises from days ${newNumberOfDays + 1}-${numberOfDays}. Are you sure?`
        )
        if (!confirmed) {
          return
        }
      }
    }
    
    setNumberOfDays(newNumberOfDays)
    if (isMultiDay) {
      // Reinitialize workout days with new count
      const days: WorkoutDay[] = []
      for (let i = 1; i <= newNumberOfDays; i++) {
        days.push({
          dayNumber: i,
          name: `Day ${i}`,
          isRestDay: false,
          estimatedDuration: 60,
          notes: "",
          exercises: []
        })
      }
      setWorkoutDays(days)
    }
  }

  const addExercise = () => {
    console.log('addExercise called', { isMultiDay, newExercise, workoutDays })
    
    if (newExercise.name.trim() && newExercise.category && newExercise.exerciseId) {
      const exercise: Exercise = {
        ...newExercise,
        id: newExercise.exerciseId // Use the actual exercise ID from library
      }
      
      if (isMultiDay && newExercise.dayIndex !== undefined) {
        console.log('Adding exercise to day', newExercise.dayIndex)
        // Add to specific day
        addExerciseToDay(newExercise.dayIndex)
      } else {
        console.log('Adding exercise to single workout')
        // Add to single workout
        setExercises([...exercises, exercise])
      }
      
      setNewExercise({
        name: "",
        category: "",
        sets: 3,
        reps: "10",
        rest: "60s",
        notes: "",
        dayIndex: undefined,
        exerciseId: undefined
      })
      setShowExerciseForm(false)
    } else {
      console.log('Validation failed', { name: newExercise.name, category: newExercise.category, exerciseId: newExercise.exerciseId })
    }
  }

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id))
  }

  const updateExercise = (id: string, field: keyof Exercise, value: any) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    ))
  }

  // Multi-day exercise management
  const addExerciseToDay = (dayIndex: number) => {
    console.log('addExerciseToDay called', { dayIndex, newExercise, workoutDays })
    
    if (newExercise.name.trim() && newExercise.category && newExercise.exerciseId) {
      const exercise: Exercise = {
        ...newExercise,
        id: newExercise.exerciseId // Use the actual exercise ID from library
      }
      console.log('Creating exercise', exercise)
      
      const updatedDays = [...workoutDays]
      console.log('Before adding exercise', updatedDays[dayIndex])
      updatedDays[dayIndex].exercises.push(exercise)
      console.log('After adding exercise', updatedDays[dayIndex])
      
      setWorkoutDays(updatedDays)
      setNewExercise({
        name: "",
        category: "",
        sets: 3,
        reps: "10",
        rest: "60s",
        notes: "",
        dayIndex: undefined,
        exerciseId: undefined
      })
      setShowExerciseForm(false)
    } else {
      console.log('addExerciseToDay validation failed', { name: newExercise.name, category: newExercise.category, exerciseId: newExercise.exerciseId })
    }
  }

  const removeExerciseFromDay = (dayIndex: number, exerciseId: string) => {
    const updatedDays = [...workoutDays]
    updatedDays[dayIndex].exercises = updatedDays[dayIndex].exercises.filter(ex => ex.id !== exerciseId)
    setWorkoutDays(updatedDays)
  }

  const updateExerciseInDay = (dayIndex: number, exerciseId: string, field: keyof Exercise, value: any) => {
    const updatedDays = [...workoutDays]
    updatedDays[dayIndex].exercises = updatedDays[dayIndex].exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    )
    setWorkoutDays(updatedDays)
  }

  const handleDayTypeChange = (dayIndex: number, isRestDay: boolean) => {
    const updatedDays = [...workoutDays]
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      isRestDay,
      exercises: isRestDay ? [] : updatedDays[dayIndex].exercises
    }
    setWorkoutDays(updatedDays)
  }

  const handleSave = () => {
    if (workoutName.trim()) {
      if (isMultiDay) {
        // Validate multi-day workout
        const hasValidDays = workoutDays.some(day => !day.isRestDay && day.exercises.length > 0)
        if (!hasValidDays) {
          alert("Please add exercises to at least one non-rest day")
          return
        }
        onSave({
          name: workoutName,
          description: workoutDescription,
          exercises: [],
          isPublic,
          isMultiDay: true,
          days: workoutDays
        })
      } else {
        // Single day workout
        if (exercises.length === 0) {
          alert("Please add at least one exercise")
          return
        }
        onSave({
          name: workoutName,
          description: workoutDescription,
          exercises,
          isPublic,
          isMultiDay: false
        })
      }
    }
  }

  const canSave = workoutName.trim() && (
    isMultiDay ? workoutDays.some(day => !day.isRestDay && day.exercises.length > 0) : exercises.length > 0
  )

  return (
    <div className="space-y-6">
      {/* Workout Details */}
      <Card>
        <CardHeader>
          <CardTitle>Workout Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workout Name *
            </label>
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter workout name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={workoutDescription}
              onChange={(e) => setWorkoutDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter workout description"
              rows={3}
            />
          </div>

          {/* Multi-Day Toggle */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isMultiDay"
                checked={isMultiDay}
                onChange={(e) => handleMultiDayToggle(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isMultiDay" className="text-sm font-medium text-gray-700">
                Multi-Day Workout Program
              </label>
            </div>
            
                         {isMultiDay && (
               <div className="ml-6 space-y-2">
                 <label className="block text-sm text-gray-600 mb-1">
                   Number of Days ({numberOfDays} selected)
                 </label>
                                                  <select
                   value={numberOfDays}
                   onChange={(e) => handleNumberOfDaysChange(parseInt(e.target.value))}
                   className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 >
                   {[2, 3, 4, 5, 6, 7].map(num => (
                     <option key={num} value={num}>{num} Days</option>
                   ))}
                 </select>
              </div>
            )}
          </div>
          

        </CardContent>
      </Card>

             {/* Multi-Day Workout Days */}
       {isMultiDay && (
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center justify-between">
               <span>{numberOfDays}-Day Workout Program</span>
               <span className="text-sm font-normal text-gray-500">
                 {workoutDays.filter(day => !day.isRestDay).length} workout days, {workoutDays.filter(day => day.isRestDay).length} rest days
               </span>
             </CardTitle>
           </CardHeader>
          <CardContent className="space-y-6">
            {workoutDays.map((day, dayIndex) => (
              <div key={day.dayNumber} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <h4 className="font-medium text-gray-900">Day {day.dayNumber}</h4>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`rest-${day.dayNumber}`}
                        checked={day.isRestDay}
                        onChange={(e) => handleDayTypeChange(dayIndex, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`rest-${day.dayNumber}`} className="text-sm text-gray-600">
                        Rest Day
                      </label>
                    </div>
                  </div>
                  {!day.isRestDay && (
                    <div className="text-sm text-gray-500">
                      {day.exercises.length} exercises
                    </div>
                  )}
                </div>

                {!day.isRestDay ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Day Name</label>
                        <input
                          type="text"
                          value={day.name}
                          onChange={(e) => {
                            const updatedDays = [...workoutDays]
                            updatedDays[dayIndex].name = e.target.value
                            setWorkoutDays(updatedDays)
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="e.g., Upper Body, Cardio"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Duration (min)</label>
                        <input
                          type="number"
                          value={day.estimatedDuration || ""}
                          onChange={(e) => {
                            const updatedDays = [...workoutDays]
                            updatedDays[dayIndex].estimatedDuration = parseInt(e.target.value) || 0
                            setWorkoutDays(updatedDays)
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min="15"
                          max="180"
                        />
                      </div>
                    </div>

                    {/* Day Exercises */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900">Exercises</h5>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('Add Exercise button clicked for day', dayIndex)
                            setShowExerciseForm(true)
                            // Store which day we're adding to
                            setNewExercise(prev => ({ ...prev, dayIndex }))
                            console.log('Updated newExercise with dayIndex', dayIndex)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Exercise
                        </Button>
                      </div>

                      {day.exercises.length === 0 ? (
                        <p className="text-gray-500 text-center py-4 text-sm">
                          No exercises added yet. Click "Add Exercise" to get started.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {day.exercises.map((exercise, exerciseIndex) => (
                            <div key={exercise.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <h6 className="font-medium text-gray-900">
                                  {exerciseIndex + 1}. {exercise.name}
                                </h6>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeExerciseFromDay(dayIndex, exercise.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <label className="block text-sm text-gray-600 mb-1">Sets</label>
                                  <input
                                    type="number"
                                    value={exercise.sets}
                                    onChange={(e) => updateExerciseInDay(dayIndex, exercise.id, 'sets', parseInt(e.target.value) || 0)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    min="1"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-600 mb-1">Reps</label>
                                  <input
                                    type="text"
                                    value={exercise.reps}
                                    onChange={(e) => updateExerciseInDay(dayIndex, exercise.id, 'reps', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="10"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-600 mb-1">Rest</label>
                                  <input
                                    type="text"
                                    value={exercise.rest}
                                    onChange={(e) => updateExerciseInDay(dayIndex, exercise.id, 'rest', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="60s"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-600 mb-1">Notes</label>
                                  <input
                                    type="text"
                                    value={exercise.notes}
                                    onChange={(e) => updateExerciseInDay(dayIndex, exercise.id, 'notes', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Optional"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">Rest Day - No exercises scheduled</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Exercises */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Exercises</CardTitle>
          <Button
            onClick={() => setShowExerciseForm(true)}
            disabled={showExerciseForm}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>
        </CardHeader>
        <CardContent>
          {exercises.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No exercises added yet. Click "Add Exercise" to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <div key={exercise.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      {index + 1}. {exercise.name}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExercise(exercise.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Category</label>
                      <input
                        type="text"
                        value={exercise.category}
                        onChange={(e) => updateExercise(exercise.id, 'category', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Sets</label>
                      <input
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Reps</label>
                      <input
                        type="text"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(exercise.id, 'reps', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="10 or 8-12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Rest</label>
                      <input
                        type="text"
                        value={exercise.rest}
                        onChange={(e) => updateExercise(exercise.id, 'rest', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="60s or 2min"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm text-gray-600 mb-1">Notes</label>
                    <input
                      type="text"
                      value={exercise.notes}
                      onChange={(e) => updateExercise(exercise.id, 'notes', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

                             {/* Add Exercise Form - Popup Panel */}
        {showExerciseForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center justify-between text-xl">
                  <span className="text-gray-900">Select Exercise from Library</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExerciseForm(false)}
                    className="hover:bg-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </CardTitle>
              </CardHeader>
             <CardContent className="space-y-4">
                               {/* Exercise Selection */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Available Exercises</h4>
                  
                  {/* Search and Filter Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Search exercises by name or category..."
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      {exerciseCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {availableExercises.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Loading exercises...</p>
                  ) : filteredExercises.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No exercises found matching your search.</p>
                  ) : (
                                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                       {filteredExercises.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                                                     onClick={() => {
                             setNewExercise({
                               name: exercise.name,
                               category: exercise.category || "General",
                               sets: 3,
                               reps: "10",
                               rest: "60s",
                               notes: "",
                               dayIndex: newExercise.dayIndex,
                               exerciseId: exercise.id
                             })
                           }}
                        >
                          <h5 className="font-semibold text-gray-900 text-lg mb-2">{exercise.name}</h5>
                          <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full w-fit mb-2">
                            {exercise.category}
                          </div>
                          {exercise.description && (
                            <p className="text-sm text-gray-600 leading-relaxed">{exercise.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                 )}
               </div>

                               {/* Exercise Configuration */}
                {newExercise.name && (
                  <div className="border-t pt-6 bg-gray-50 -mx-6 px-6 pb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 text-lg">Configure Exercise</h4>
                      {newExercise.exerciseId && (
                        <div className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                          ✓ Exercise Selected
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Exercise Name
                       </label>
                       <input
                         type="text"
                         value={newExercise.name}
                         onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         readOnly
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Category
                       </label>
                       <input
                         type="text"
                         value={newExercise.category}
                         onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value })}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         readOnly
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Sets
                       </label>
                       <input
                         type="number"
                         value={newExercise.sets}
                         onChange={(e) => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) || 0 })}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         min="1"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Reps
                       </label>
                       <input
                         type="text"
                         value={newExercise.reps}
                         onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         placeholder="e.g., 10 or 8-12"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Rest Period
                       </label>
                       <input
                         type="text"
                         value={newExercise.rest}
                         onChange={(e) => setNewExercise({ ...newExercise, rest: e.target.value })}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         placeholder="e.g., 60s or 2min"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Notes
                       </label>
                       <input
                         type="text"
                         value={newExercise.notes}
                         onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                         placeholder="Optional notes"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Video URL (YouTube)
                       </label>
                       <input
                         type="url"
                         value={newExercise.videoUrl || ''}
                         onChange={(e) => setNewExercise({ ...newExercise, videoUrl: e.target.value })}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         placeholder="https://youtube.com/watch?v=..."
                       />
                       <p className="text-xs text-gray-500 mt-1">Optional: Link to demonstration video</p>
                     </div>
                   </div>
                 </div>
               )}

                               {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t bg-white -mx-6 px-6 pb-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowExerciseForm(false)}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addExercise}
                    disabled={!newExercise.name.trim() || !newExercise.exerciseId}
                    className="px-6"
                  >
                    Add Exercise
                  </Button>
                </div>
             </CardContent>
           </Card>
         </div>
       )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!canSave || isLoading}
          variant="outline"
          size="lg"
          className="px-8"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Saving..." : "Save Workout"}
        </Button>
      </div>
    </div>
  )
}

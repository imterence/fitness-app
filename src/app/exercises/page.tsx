"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Dumbbell, Search, Edit, Trash2, Save, X, Filter, Upload } from "lucide-react"
import Link from "next/link"
import ExerciseCSVImport from "@/components/ExerciseCSVImport"

interface Exercise {
  id: string
  name: string
  description: string
  category: string
  difficulty: string
  muscleGroups: string[]
  equipment: string[]
  instructions: string
  videoUrl?: string
}

export default function ExercisesPage() {
  const { data: session } = useSession()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [showImportForm, setShowImportForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [newExercise, setNewExercise] = useState({
    name: "",
    description: "",
    category: "",
    difficulty: "BEGINNER",
    muscleGroups: [""],
    equipment: [""],
    instructions: "",
    videoUrl: ""
  })

  const [categories, setCategories] = useState<string[]>([])
  const difficulties = ["BEGINNER", "INTERMEDIATE", "ADVANCED"]

  useEffect(() => {
    if (session?.user) {
      fetchExercises()
      fetchCategories()
    }
  }, [session])

  const fetchExercises = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/exercises')
      if (response.ok) {
        const data = await response.json()
        setExercises(data.exercises || [])
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/exercises/categories', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      } else {
        console.error('Failed to fetch categories')
        // Fallback to default categories if API fails
        setCategories(["Strength", "Cardio", "Flexibility", "Balance", "Plyometrics", "Sports", "Other"])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Fallback to default categories if API fails
      setCategories(["Strength", "Cardio", "Flexibility", "Balance", "Plyometrics", "Sports", "Other"])
    }
  }

  const handleAddExercise = async () => {
    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newExercise,
          muscleGroups: newExercise.muscleGroups.filter(g => g.trim() !== ""),
          equipment: newExercise.equipment.filter(e => e.trim() !== "")
        }),
      })

      if (response.ok) {
        setShowAddForm(false)
        setNewExercise({
          name: "",
          description: "",
          category: "",
          difficulty: "BEGINNER",
          muscleGroups: [""],
          equipment: [""],
          instructions: "",
          videoUrl: ""
        })
        fetchExercises()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error adding exercise:', error)
      alert('Error adding exercise')
    }
  }

  const handleUpdateExercise = async () => {
    if (!editingExercise) return

    try {
      const response = await fetch(`/api/exercises/${editingExercise.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingExercise,
          muscleGroups: editingExercise.muscleGroups.filter(g => g.trim() !== ""),
          equipment: editingExercise.equipment.filter(e => e.trim() !== "")
        }),
      })

      if (response.ok) {
        setEditingExercise(null)
        fetchExercises()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating exercise:', error)
      alert('Error updating exercise')
    }
  }

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm('Are you sure you want to delete this exercise? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchExercises()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting exercise:', error)
      alert('Error deleting exercise')
    }
  }

  const handleImportExercises = async (exercises: any[]) => {
    try {
      let successCount = 0
      let errorCount = 0

      for (const exercise of exercises) {
        try {
          const response = await fetch('/api/exercises', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(exercise),
          })

          if (response.ok) {
            successCount++
          } else {
            const error = await response.json()
            console.error(`Error importing ${exercise.name}:`, error.error)
            errorCount++
          }
        } catch (error) {
          console.error(`Error importing ${exercise.name}:`, error)
          errorCount++
        }
      }

      if (errorCount === 0) {
        alert(`Successfully imported ${successCount} exercises!`)
      } else {
        alert(`Import completed with ${successCount} successes and ${errorCount} errors. Check console for details.`)
      }

      setShowImportForm(false)
      fetchExercises()
    } catch (error) {
      console.error('Error during import:', error)
      alert('Error during import process')
    }
  }

  const addMuscleGroup = () => {
    setNewExercise(prev => ({
      ...prev,
      muscleGroups: [...prev.muscleGroups, ""]
    }))
  }

  const removeMuscleGroup = (index: number) => {
    setNewExercise(prev => ({
      ...prev,
      muscleGroups: prev.muscleGroups.filter((_, i) => i !== index)
    }))
  }

  const updateMuscleGroup = (index: number, value: string) => {
    setNewExercise(prev => ({
      ...prev,
      muscleGroups: prev.muscleGroups.map((g, i) => i === index ? value : g)
    }))
  }

  const addEquipment = () => {
    setNewExercise(prev => ({
      ...prev,
      equipment: [...prev.equipment, ""]
    }))
  }

  const removeEquipment = (index: number) => {
    setNewExercise(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index)
    }))
  }

  const updateEquipment = (index: number, value: string) => {
    setNewExercise(prev => ({
      ...prev,
      equipment: prev.equipment.map((e, i) => i === index ? value : e)
    }))
  }

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || exercise.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view exercises.</p>
        </div>
      </div>
    )
  }

  if (session.user.role !== "TRAINER" && session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900">Access denied. Only trainers can view the exercise library.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  <Dumbbell className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Exercise Library</h1>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowImportForm(true)} variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Exercises Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-900">Loading exercises...</p>
          </div>
        ) : filteredExercises.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Dumbbell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No exercises found
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory ? 'Try adjusting your search or filters.' : 'No exercises are available yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map((exercise) => (
              <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{exercise.name}</CardTitle>
                    <div className="flex space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        exercise.difficulty === 'BEGINNER' ? 'bg-green-100 text-green-800' :
                        exercise.difficulty === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {exercise.difficulty}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {exercise.category}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {exercise.description}
                  </p>
                  
                  {exercise.muscleGroups.length > 0 && exercise.muscleGroups[0] && (
                    <div className="mb-3">
                      <span className="text-xs font-medium text-gray-500">Muscle Groups:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exercise.muscleGroups.map((group, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {group}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {exercise.equipment.length > 0 && exercise.equipment[0] && (
                    <div className="mb-3">
                      <span className="text-xs font-medium text-gray-500">Equipment:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exercise.equipment.map((item, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingExercise(exercise)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteExercise(exercise.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add Exercise Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Add New Exercise</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Exercise Name *</Label>
                  <Input
                    id="name"
                    value={newExercise.name}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Push-ups, Squats, Deadlifts"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={newExercise.description}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe how to perform the exercise"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      value={newExercise.category}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="difficulty">Difficulty *</Label>
                    <select
                      id="difficulty"
                      value={newExercise.difficulty}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {difficulties.map(difficulty => (
                        <option key={difficulty} value={difficulty}>{difficulty}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Muscle Groups</Label>
                  <div className="space-y-2">
                    {newExercise.muscleGroups.map((group, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={group}
                          onChange={(e) => updateMuscleGroup(index, e.target.value)}
                          placeholder="e.g., Chest, Triceps"
                        />
                        {newExercise.muscleGroups.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeMuscleGroup(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMuscleGroup}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Muscle Group
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Equipment</Label>
                  <div className="space-y-2">
                    {newExercise.equipment.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updateEquipment(index, e.target.value)}
                          placeholder="e.g., Dumbbells, Barbell, None"
                        />
                        {newExercise.equipment.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeEquipment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addEquipment}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Equipment
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={newExercise.instructions}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Step-by-step instructions (optional)"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="videoUrl">Video URL (YouTube)</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    value={newExercise.videoUrl}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional: Link to demonstration video</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddExercise}
                  disabled={!newExercise.name || !newExercise.description || !newExercise.category}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Add Exercise
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Exercise Modal */}
      {editingExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Edit Exercise</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingExercise(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Exercise Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingExercise.name}
                    onChange={(e) => setEditingExercise(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="e.g., Push-ups, Squats, Deadlifts"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description">Description *</Label>
                  <Textarea
                    id="edit-description"
                    value={editingExercise.description}
                    onChange={(e) => setEditingExercise(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Describe how to perform the exercise"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-category">Category *</Label>
                    <select
                      id="edit-category"
                      value={editingExercise.category}
                      onChange={(e) => setEditingExercise(prev => prev ? { ...prev, category: e.target.value } : null)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="edit-difficulty">Difficulty *</Label>
                    <select
                      id="edit-difficulty"
                      value={editingExercise.difficulty}
                      onChange={(e) => setEditingExercise(prev => prev ? { ...prev, difficulty: e.target.value } : null)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {difficulties.map(difficulty => (
                        <option key={difficulty} value={difficulty}>{difficulty}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Muscle Groups</Label>
                  <div className="space-y-2">
                    {editingExercise.muscleGroups.map((group, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={group}
                          onChange={(e) => setEditingExercise(prev => prev ? {
                            ...prev,
                            muscleGroups: prev.muscleGroups.map((g, i) => i === index ? e.target.value : g)
                          } : null)}
                          placeholder="e.g., Chest, Triceps"
                        />
                        {editingExercise.muscleGroups.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingExercise(prev => prev ? {
                              ...prev,
                              muscleGroups: prev.muscleGroups.filter((_, i) => i !== index)
                            } : null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingExercise(prev => prev ? {
                        ...prev,
                        muscleGroups: [...prev.muscleGroups, ""]
                      } : null)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Muscle Group
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Equipment</Label>
                  <div className="space-y-2">
                    {editingExercise.equipment.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => setEditingExercise(prev => prev ? {
                            ...prev,
                            equipment: prev.equipment.map((eq, i) => i === index ? e.target.value : eq)
                          } : null)}
                          placeholder="e.g., Dumbbells, Barbell, None"
                        />
                        {editingExercise.equipment.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingExercise(prev => prev ? {
                              ...prev,
                              equipment: prev.equipment.filter((_, i) => i !== index)
                            } : null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingExercise(prev => prev ? {
                        ...prev,
                        equipment: [...prev.equipment, ""]
                      } : null)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Equipment
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-instructions">Instructions</Label>
                  <Textarea
                    id="edit-instructions"
                    value={editingExercise.instructions}
                    onChange={(e) => setEditingExercise(prev => prev ? { ...prev, instructions: e.target.value } : null)}
                    placeholder="Step-by-step instructions (optional)"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-videoUrl">Video URL (YouTube)</Label>
                  <Input
                    id="edit-videoUrl"
                    type="url"
                    value={editingExercise.videoUrl || ''}
                    onChange={(e) => setEditingExercise(prev => prev ? { ...prev, videoUrl: e.target.value } : null)}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional: Link to demonstration video</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setEditingExercise(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateExercise}
                  disabled={!editingExercise.name || !editingExercise.description || !editingExercise.category}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <ExerciseCSVImport
            onImport={handleImportExercises}
            onCancel={() => setShowImportForm(false)}
          />
        </div>
      )}
    </div>
  )
}

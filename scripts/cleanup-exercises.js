const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupExercises() {
  try {
    console.log('🔍 Analyzing exercise database for duplicates...\n')

    // Get all exercises
    const exercises = await prisma.exercise.findMany({
      orderBy: [
        { name: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    console.log(`📊 Total exercises found: ${exercises.length}\n`)

    // Group exercises by name (case-insensitive)
    const exerciseGroups = {}
    exercises.forEach(exercise => {
      const normalizedName = exercise.name.toLowerCase().trim()
      if (!exerciseGroups[normalizedName]) {
        exerciseGroups[normalizedName] = []
      }
      exerciseGroups[normalizedName].push(exercise)
    })

    // Find duplicates
    const duplicates = Object.entries(exerciseGroups)
      .filter(([name, exercises]) => exercises.length > 1)
      .sort(([a], [b]) => a.localeCompare(b))

    if (duplicates.length === 0) {
      console.log('✅ No duplicate exercises found!')
      return
    }

    console.log(`⚠️  Found ${duplicates.length} duplicate exercise names:\n`)

    let totalDuplicates = 0
    let toDelete = []

    duplicates.forEach(([name, exercises]) => {
      console.log(`📝 "${name}" (${exercises.length} instances):`)
      
      exercises.forEach((exercise, index) => {
        const isOriginal = index === 0
        const status = isOriginal ? '🟢 KEEP (original)' : '🔴 DELETE (duplicate)'
        
        console.log(`  ${index + 1}. ${exercise.name} - ${exercise.category} - ${exercise.difficulty} - ${status}`)
        
        if (!isOriginal) {
          toDelete.push(exercise.id)
          totalDuplicates++
        }
      })
      console.log('')
    })

    console.log(`📋 Summary:`)
    console.log(`  - Total exercises: ${exercises.length}`)
    console.log(`  - Unique names: ${exercises.length - totalDuplicates}`)
    console.log(`  - Duplicates to remove: ${totalDuplicates}`)
    console.log(`  - Final count after cleanup: ${exercises.length - totalDuplicates}`)

    if (toDelete.length > 0) {
      console.log('\n🗑️  Proceeding to delete duplicate exercises...')
      
      // Check if any of these exercises are used in workouts
      const usedExercises = await prisma.workoutExercise.findMany({
        where: {
          exerciseId: { in: toDelete }
        },
        include: {
          exercise: true,
          workout: true
        }
      })

      if (usedExercises.length > 0) {
        console.log('\n⚠️  Warning: Some exercises to be deleted are used in workouts:')
        usedExercises.forEach(we => {
          console.log(`  - "${we.exercise.name}" used in workout "${we.workout.name}"`)
        })
        console.log('\n🔄 These exercises will be kept to avoid breaking existing workouts.')
        
        // Remove used exercises from deletion list
        const usedIds = usedExercises.map(we => we.exerciseId)
        const safeToDelete = toDelete.filter(id => !usedIds.includes(id))
        
        if (safeToDelete.length === 0) {
          console.log('✅ No safe duplicates to delete. All duplicates are in use.')
          return
        }
        
        console.log(`\n🗑️  Deleting ${safeToDelete.length} safe duplicate exercises...`)
        toDelete = safeToDelete
      } else {
        console.log('\n✅ All duplicate exercises are safe to delete.')
      }
      
      const deleteResult = await prisma.exercise.deleteMany({
        where: {
          id: { in: toDelete }
        }
      })
      
      console.log(`✅ Successfully deleted ${deleteResult.count} duplicate exercises`)
      
      // Show final count
      const finalCount = await prisma.exercise.count()
      console.log(`📊 Final exercise count: ${finalCount}`)
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanupExercises()
  .catch(console.error)

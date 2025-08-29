const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function mergeExercises() {
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

    let totalMerged = 0
    const mergeOperations = []

    duplicates.forEach(([name, exercises]) => {
      console.log(`📝 "${name}" (${exercises.length} instances):`)
      
      const keepExercise = exercises[0]
      const deleteExercises = exercises.slice(1)
      
      console.log(`  🟢 KEEP: ${keepExercise.name} (ID: ${keepExercise.id})`)
      deleteExercises.forEach((exercise, index) => {
        console.log(`  🔴 MERGE: ${exercise.name} (ID: ${exercise.id})`)
      })
      
      mergeOperations.push({
        keepId: keepExercise.id,
        deleteIds: deleteExercises.map(e => e.id),
        name: name
      })
      
      totalMerged += deleteExercises.length
      console.log('')
    })

    console.log(`📋 Summary:`)
    console.log(`  - Total exercises: ${exercises.length}`)
    console.log(`  - Exercises to merge: ${totalMerged}`)
    console.log(`  - Final count after merge: ${exercises.length - totalMerged}`)

    if (mergeOperations.length > 0) {
      console.log('\n🔄 Proceeding to merge duplicate exercises...')
      
      for (const operation of mergeOperations) {
        console.log(`\n🔄 Merging "${operation.name}"...`)
        
        try {
          // Update all workout exercises to use the kept exercise ID
          const updateResult = await prisma.workoutExercise.updateMany({
            where: {
              exerciseId: { in: operation.deleteIds }
            },
            data: {
              exerciseId: operation.keepId
            }
          })
          
          console.log(`  ✅ Updated ${updateResult.count} workout references`)
          
          // Delete the duplicate exercises
          const deleteResult = await prisma.exercise.deleteMany({
            where: {
              id: { in: operation.deleteIds }
            }
          })
          
          console.log(`  ✅ Deleted ${deleteResult.count} duplicate exercises`)
          
        } catch (error) {
          console.error(`  ❌ Error merging "${operation.name}":`, error.message)
        }
      }
      
      // Show final count
      const finalCount = await prisma.exercise.count()
      console.log(`\n📊 Final exercise count: ${finalCount}`)
      
      // Verify no broken references
      const brokenRefs = await prisma.workoutExercise.findMany({
        where: {
          exerciseId: { in: mergeOperations.flatMap(op => op.deleteIds) }
        }
      })
      
      if (brokenRefs.length === 0) {
        console.log('✅ All workout references updated successfully!')
      } else {
        console.log(`⚠️  Warning: ${brokenRefs.length} workout references still point to deleted exercises`)
      }
    }

  } catch (error) {
    console.error('❌ Error during merge:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the merge
mergeExercises()
  .catch(console.error)

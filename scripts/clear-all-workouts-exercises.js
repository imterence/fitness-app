const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearAllWorkoutsAndExercises() {
  try {
    console.log('🗑️  Starting to clear ALL workouts and exercises from database...')
    console.log('⚠️  This will permanently delete all workout data!')
    
    // Clear in order to respect foreign key constraints
    
    // 1. Clear workout progress data first
    console.log('\n1️⃣ Clearing workout progress data...')
    const progressDeleted = await prisma.workoutProgress.deleteMany({})
    console.log(`   ✅ Deleted ${progressDeleted.count} workout progress records`)
    
    // 2. Clear workout day progress data
    console.log('\n2️⃣ Clearing workout day progress data...')
    const dayProgressDeleted = await prisma.workoutDayProgress.deleteMany({})
    console.log(`   ✅ Deleted ${dayProgressDeleted.count} workout day progress records`)
    
    // 3. Clear program day assignments
    console.log('\n3️⃣ Clearing program day assignments...')
    const dayAssignmentsDeleted = await prisma.programDayAssignment.deleteMany({})
    console.log(`   ✅ Deleted ${dayAssignmentsDeleted.count} program day assignment records`)
    
    // 4. Clear client workout programs
    console.log('\n4️⃣ Clearing client workout programs...')
    const programsDeleted = await prisma.clientWorkoutProgram.deleteMany({})
    console.log(`   ✅ Deleted ${programsDeleted.count} client workout program records`)
    
    // 5. Clear individual client workouts
    console.log('\n5️⃣ Clearing individual client workouts...')
    const workoutsDeleted = await prisma.clientWorkout.deleteMany({})
    console.log(`   ✅ Deleted ${workoutsDeleted.count} individual client workout records`)
    
    // 6. Clear workout day exercises
    console.log('\n6️⃣ Clearing workout day exercises...')
    const workoutDayExercisesDeleted = await prisma.workoutDayExercise.deleteMany({})
    console.log(`   ✅ Deleted ${workoutDayExercisesDeleted.count} workout day exercise records`)
    
    // 7. Clear workout exercises
    console.log('\n7️⃣ Clearing workout exercises...')
    const workoutExercisesDeleted = await prisma.workoutExercise.deleteMany({})
    console.log(`   ✅ Deleted ${workoutExercisesDeleted.count} workout exercise records`)
    
    // 8. Clear workout days
    console.log('\n8️⃣ Clearing workout days...')
    const workoutDaysDeleted = await prisma.workoutDay.deleteMany({})
    console.log(`   ✅ Deleted ${workoutDaysDeleted.count} workout day records`)
    
    // 9. Clear workouts
    console.log('\n9️⃣ Clearing workouts...')
    const workoutsCleared = await prisma.workout.deleteMany({})
    console.log(`   ✅ Deleted ${workoutsCleared.count} workout records`)
    
    // 10. Clear workout programs
    console.log('\n🔟 Clearing workout programs...')
    const workoutProgramsDeleted = await prisma.workoutProgram.deleteMany({})
    console.log(`   ✅ Deleted ${workoutProgramsDeleted.count} workout program records`)
    
    // 11. Finally, clear all exercises
    console.log('\n1️⃣1️⃣ Clearing all exercises...')
    const exercisesDeleted = await prisma.exercise.deleteMany({})
    console.log(`   ✅ Deleted ${exercisesDeleted.count} exercise records`)
    
    console.log('\n🎉 SUCCESS! All workouts and exercises have been cleared!')
    console.log('\n📊 Summary of deleted records:')
    console.log(`   - Workout Progress: ${progressDeleted.count}`)
    console.log(`   - Workout Day Progress: ${dayProgressDeleted.count}`)
    console.log(`   - Program Day Assignments: ${dayAssignmentsDeleted.count}`)
    console.log(`   - Client Workout Programs: ${programsDeleted.count}`)
    console.log(`   - Individual Client Workouts: ${workoutsDeleted.count}`)
    console.log(`   - Workout Day Exercises: ${workoutDayExercisesDeleted.count}`)
    console.log(`   - Workout Exercises: ${workoutExercisesDeleted.count}`)
    console.log(`   - Workout Days: ${workoutDaysDeleted.count}`)
    console.log(`   - Workouts: ${workoutsCleared.count}`)
    console.log(`   - Workout Programs: ${workoutProgramsDeleted.count}`)
    console.log(`   - Exercises: ${exercisesDeleted.count}`)
    
    console.log('\n💡 You can now import new exercises using the import-exercises.js script')
    console.log('   Example: node import-exercises.js exercises.xlsx')
    
  } catch (error) {
    console.error('❌ Error clearing workouts and exercises:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the function
clearAllWorkoutsAndExercises()
  .catch(console.error)




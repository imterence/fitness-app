const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addSampleData() {
  try {
    console.log('🔄 Adding sample exercises and workouts...')

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      console.log('❌ No admin user found!')
      return
    }

    // 1. Add sample exercises
    console.log('💪 Adding sample exercises...')
    const sampleExercises = [
      {
        name: 'Push-ups',
        category: 'Strength',
        description: 'Classic bodyweight push-up exercise',
        muscleGroups: 'Chest, Triceps, Shoulders',
        equipment: 'Bodyweight',
        difficulty: 'BEGINNER',
        instructions: 'Start in plank position, lower chest to ground, push back up',
        videoUrl: ''
      },
      {
        name: 'Squats',
        category: 'Strength',
        description: 'Basic bodyweight squat exercise',
        muscleGroups: 'Quadriceps, Glutes, Hamstrings',
        equipment: 'Bodyweight',
        difficulty: 'BEGINNER',
        instructions: 'Stand with feet shoulder-width apart, lower down as if sitting in a chair, return to standing',
        videoUrl: ''
      },
      {
        name: 'Plank',
        category: 'Core',
        description: 'Isometric core strengthening exercise',
        muscleGroups: 'Core, Shoulders',
        equipment: 'Bodyweight',
        difficulty: 'BEGINNER',
        instructions: 'Hold a straight line from head to heels, engage core',
        videoUrl: ''
      },
      {
        name: 'Lunges',
        category: 'Strength',
        description: 'Single leg strengthening exercise',
        muscleGroups: 'Quadriceps, Glutes, Hamstrings',
        equipment: 'Bodyweight',
        difficulty: 'INTERMEDIATE',
        instructions: 'Step forward into lunge position, lower back knee toward ground, return to standing',
        videoUrl: ''
      },
      {
        name: 'Burpees',
        category: 'Cardio',
        description: 'Full body cardio exercise',
        muscleGroups: 'Full Body',
        equipment: 'Bodyweight',
        difficulty: 'INTERMEDIATE',
        instructions: 'Squat down, jump back to plank, do push-up, jump feet forward, jump up with arms overhead',
        videoUrl: ''
      }
    ]

    for (const exercise of sampleExercises) {
      try {
        await prisma.exercise.create({
          data: exercise
        })
        console.log(`✅ Exercise added: ${exercise.name}`)
      } catch (error) {
        console.log(`⚠️ Exercise already exists: ${exercise.name}`)
      }
    }

    // 2. Add sample workouts
    console.log('🏋️ Adding sample workouts...')
    const sampleWorkouts = [
      {
        name: 'Beginner Full Body',
        description: 'A complete beginner workout targeting all major muscle groups',
        category: 'Custom',
        difficulty: 'BEGINNER',
        exercises: JSON.stringify([
          { exercise: { name: 'Push-ups' }, sets: 3, reps: '8-10', order: 1 },
          { exercise: { name: 'Squats' }, sets: 3, reps: '10-12', order: 2 },
          { exercise: { name: 'Plank' }, sets: 3, reps: '30 seconds', order: 3 }
        ]),
        estimatedDuration: 30,
        status: 'ACTIVE',
        creatorId: adminUser.id
      },
      {
        name: 'Intermediate HIIT',
        description: 'High intensity interval training workout',
        category: 'Custom',
        difficulty: 'INTERMEDIATE',
        exercises: JSON.stringify([
          { exercise: { name: 'Burpees' }, sets: 4, reps: '10', order: 1 },
          { exercise: { name: 'Lunges' }, sets: 3, reps: '12 each leg', order: 2 },
          { exercise: { name: 'Push-ups' }, sets: 3, reps: '12-15', order: 3 },
          { exercise: { name: 'Squats' }, sets: 3, reps: '15-20', order: 4 }
        ]),
        estimatedDuration: 45,
        status: 'ACTIVE',
        creatorId: adminUser.id
      },
      {
        name: 'Core Focus',
        description: 'Workout focused on core strengthening',
        category: 'Custom',
        difficulty: 'BEGINNER',
        exercises: JSON.stringify([
          { exercise: { name: 'Plank' }, sets: 3, reps: '45 seconds', order: 1 },
          { exercise: { name: 'Squats' }, sets: 3, reps: '12', order: 2 },
          { exercise: { name: 'Push-ups' }, sets: 2, reps: '8', order: 3 }
        ]),
        estimatedDuration: 25,
        status: 'ACTIVE',
        creatorId: adminUser.id
      }
    ]

    for (const workout of sampleWorkouts) {
      try {
        await prisma.workout.create({
          data: workout
        })
        console.log(`✅ Workout added: ${workout.name}`)
      } catch (error) {
        console.log(`⚠️ Workout already exists: ${workout.name}`)
      }
    }

    console.log('🎉 Sample data added successfully!')
    
    // Final summary
    const finalUserCount = await prisma.user.count()
    const finalClientCount = await prisma.client.count()
    const finalExerciseCount = await prisma.exercise.count()
    const finalWorkoutCount = await prisma.workout.count()
    
    console.log('\n📊 Final Summary:')
    console.log(`👥 Users: ${finalUserCount}`)
    console.log(`👤 Clients: ${finalClientCount}`)
    console.log(`💪 Exercises: ${finalExerciseCount}`)
    console.log(`🏋️ Workouts: ${finalWorkoutCount}`)

  } catch (error) {
    console.error('❌ Error adding sample data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSampleData()

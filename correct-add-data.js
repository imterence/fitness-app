const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function correctAddData() {
  try {
    console.log('🔄 Correctly adding exercises and workouts...')

    // Get admin user ID
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    })

    if (!adminUser) {
      console.log('❌ No admin user found!')
      return
    }

    // 1. Add exercises with correct schema
    console.log('💪 Adding exercises...')
    
    const exercises = [
      {
        name: 'Push-ups',
        category: 'Strength',
        description: 'Classic bodyweight push-up exercise',
        muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
        equipment: ['Bodyweight'],
        difficulty: 'BEGINNER',
        instructions: 'Start in plank position, lower chest to ground, push back up',
        videoUrl: ''
      },
      {
        name: 'Squats',
        category: 'Strength',
        description: 'Basic bodyweight squat exercise',
        muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
        equipment: ['Bodyweight'],
        difficulty: 'BEGINNER',
        instructions: 'Stand with feet shoulder-width apart, lower down as if sitting in a chair, return to standing',
        videoUrl: ''
      },
      {
        name: 'Plank',
        category: 'Core',
        description: 'Isometric core strengthening exercise',
        muscleGroups: ['Core', 'Shoulders'],
        equipment: ['Bodyweight'],
        difficulty: 'BEGINNER',
        instructions: 'Hold a straight line from head to heels, engage core',
        videoUrl: ''
      },
      {
        name: 'Lunges',
        category: 'Strength',
        description: 'Single leg strengthening exercise',
        muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
        equipment: ['Bodyweight'],
        difficulty: 'INTERMEDIATE',
        instructions: 'Step forward into lunge position, lower back knee toward ground, return to standing',
        videoUrl: ''
      },
      {
        name: 'Burpees',
        category: 'Cardio',
        description: 'Full body cardio exercise',
        muscleGroups: ['Full Body'],
        equipment: ['Bodyweight'],
        difficulty: 'INTERMEDIATE',
        instructions: 'Squat down, jump back to plank, do push-up, jump feet forward, jump up with arms overhead',
        videoUrl: ''
      }
    ]

    const createdExercises = []
    for (const exercise of exercises) {
      try {
        const created = await prisma.exercise.create({
          data: exercise
        })
        createdExercises.push(created)
        console.log(`✅ Exercise added: ${exercise.name}`)
      } catch (error) {
        console.log(`⚠️ Error adding exercise ${exercise.name}:`, error.message)
      }
    }

    // 2. Add workouts (simple workouts without exercises for now)
    console.log('🏋️ Adding workouts...')
    
    const workouts = [
      {
        name: 'Beginner Full Body',
        description: 'A complete beginner workout targeting all major muscle groups',
        category: 'Custom',
        difficulty: 'BEGINNER',
        estimatedDuration: 30,
        status: 'ACTIVE',
        creatorId: adminUser.id
      },
      {
        name: 'Intermediate HIIT',
        description: 'High intensity interval training workout',
        category: 'Custom',
        difficulty: 'INTERMEDIATE',
        estimatedDuration: 45,
        status: 'ACTIVE',
        creatorId: adminUser.id
      },
      {
        name: 'Core Focus',
        description: 'Workout focused on core strengthening',
        category: 'Custom',
        difficulty: 'BEGINNER',
        estimatedDuration: 25,
        status: 'ACTIVE',
        creatorId: adminUser.id
      }
    ]

    const createdWorkouts = []
    for (const workout of workouts) {
      try {
        const created = await prisma.workout.create({
          data: workout
        })
        createdWorkouts.push(created)
        console.log(`✅ Workout added: ${workout.name}`)
      } catch (error) {
        console.log(`⚠️ Error adding workout ${workout.name}:`, error.message)
      }
    }

    console.log('🎉 Data added successfully!')
    
    // Check final counts
    const exerciseCount = await prisma.exercise.count()
    const workoutCount = await prisma.workout.count()
    
    console.log(`\n📊 Final counts:`)
    console.log(`💪 Exercises: ${exerciseCount}`)
    console.log(`🏋️ Workouts: ${workoutCount}`)

    if (exerciseCount > 0) {
      const exercises = await prisma.exercise.findMany({
        select: { name: true, category: true, difficulty: true }
      })
      console.log('\n💪 Exercises in database:')
      exercises.forEach(ex => console.log(`  - ${ex.name} (${ex.category}, ${ex.difficulty})`))
    }

    if (workoutCount > 0) {
      const workouts = await prisma.workout.findMany({
        select: { name: true, category: true, difficulty: true }
      })
      console.log('\n🏋️ Workouts in database:')
      workouts.forEach(w => console.log(`  - ${w.name} (${w.category}, ${w.difficulty})`))
    }

  } catch (error) {
    console.error('❌ Error adding data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

correctAddData()

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.workoutProgress.deleteMany()
  await prisma.workoutDayProgress.deleteMany()
  await prisma.workoutDayExercise.deleteMany()
  await prisma.workoutExercise.deleteMany()
  await prisma.workoutDay.deleteMany()
  await prisma.clientWorkoutProgram.deleteMany()
  await prisma.clientWorkout.deleteMany()
  await prisma.workout.deleteMany()
  await prisma.workoutProgram.deleteMany()
  await prisma.client.deleteMany()
  await prisma.exercise.deleteMany()
  await prisma.user.deleteMany()

  console.log('🧹 Cleared existing data')

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@whateverfit.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })

  const trainer = await prisma.user.create({
    data: {
      email: 'trainer@whateverfit.com',
      name: 'John Trainer',
      password: hashedPassword,
      role: 'TRAINER'
    }
  })

  const client = await prisma.user.create({
    data: {
      email: 'client@whateverfit.com',
      name: 'Sarah Client',
      password: hashedPassword,
      role: 'CLIENT'
    }
  })

  console.log('👥 Created users')

  // Create client relationship
  await prisma.client.create({
    data: {
      userId: client.id,
      trainerId: trainer.id
    }
  })

  console.log('🤝 Created client-trainer relationship')

  // Create exercises
  const exercises = [
    // Strength - Upper Body
    {
      name: 'Push-ups',
      category: 'Strength',
      description: 'Classic bodyweight exercise for chest, shoulders, and triceps',
      muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
      equipment: ['Bodyweight'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Start in plank position, lower body until chest nearly touches ground, push back up'
    },
    {
      name: 'Pull-ups',
      category: 'Strength',
      description: 'Upper body pulling exercise targeting back and biceps',
      muscleGroups: ['Back', 'Biceps', 'Shoulders'],
      equipment: ['Pull-up Bar'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Hang from bar, pull body up until chin clears the bar, lower with control'
    },
    {
      name: 'Bench Press',
      category: 'Strength',
      description: 'Compound movement for chest development',
      muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
      equipment: ['Barbell', 'Bench'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Lie on bench, lower bar to chest, press up to full extension'
    },
    {
      name: 'Overhead Press',
      category: 'Strength',
      description: 'Vertical pressing movement for shoulder strength',
      muscleGroups: ['Shoulders', 'Triceps'],
      equipment: ['Barbell', 'Dumbbells'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Press weight overhead while maintaining neutral spine'
    },

    // Strength - Lower Body
    {
      name: 'Squats',
      category: 'Strength',
      description: 'Fundamental lower body movement',
      muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
      equipment: ['Bodyweight', 'Barbell'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Stand with feet shoulder-width, lower hips back and down, return to standing'
    },
    {
      name: 'Deadlift',
      category: 'Strength',
      description: 'Posterior chain powerhouse exercise',
      muscleGroups: ['Hamstrings', 'Glutes', 'Back'],
      equipment: ['Barbell'],
      difficulty: 'ADVANCED' as const,
      instructions: 'Hinge at hips, grip bar, stand up while keeping bar close to legs'
    },
    {
      name: 'Lunges',
      category: 'Strength',
      description: 'Unilateral leg exercise for balance and strength',
      muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
      equipment: ['Bodyweight', 'Dumbbells'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Step forward, lower back knee toward ground, return to start'
    },
    {
      name: 'Romanian Deadlift',
      category: 'Strength',
      description: 'Hip hinge movement focusing on hamstrings',
      muscleGroups: ['Hamstrings', 'Glutes', 'Lower Back'],
      equipment: ['Barbell', 'Dumbbells'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Hinge at hips, slide weight down legs, feel stretch in hamstrings'
    },

    // Cardio
    {
      name: 'Running',
      category: 'Cardio',
      description: 'Classic cardiovascular exercise',
      muscleGroups: ['Legs', 'Cardiovascular System'],
      equipment: ['Running Shoes'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Start slow, maintain good posture, gradually increase pace'
    },
    {
      name: 'Cycling',
      category: 'Cardio',
      description: 'Low-impact cardiovascular workout',
      muscleGroups: ['Legs', 'Cardiovascular System'],
      equipment: ['Bicycle', 'Stationary Bike'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Maintain steady cadence, adjust resistance as needed'
    },
    {
      name: 'Rowing',
      category: 'Cardio',
      description: 'Full-body cardio exercise',
      muscleGroups: ['Legs', 'Back', 'Arms', 'Cardiovascular System'],
      equipment: ['Rowing Machine'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Drive with legs, lean back, pull arms to chest, return smoothly'
    },
    {
      name: 'Burpees',
      category: 'Cardio',
      description: 'High-intensity full-body movement',
      muscleGroups: ['Full Body', 'Cardiovascular System'],
      equipment: ['Bodyweight'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Squat, place hands on ground, jump feet back, perform push-up, jump up'
    },

    // Flexibility
    {
      name: 'Downward Dog',
      category: 'Flexibility',
      description: 'Yoga pose for hamstring and shoulder flexibility',
      muscleGroups: ['Hamstrings', 'Shoulders', 'Back'],
      equipment: ['Yoga Mat'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Form inverted V shape, press heels toward ground, lengthen spine'
    },
    {
      name: 'Pigeon Pose',
      category: 'Flexibility',
      description: 'Deep hip opener and stretch',
      muscleGroups: ['Hips', 'Glutes', 'Lower Back'],
      equipment: ['Yoga Mat'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Bring one knee forward, extend other leg back, fold forward'
    },
    {
      name: 'Cobra Stretch',
      category: 'Flexibility',
      description: 'Back extension and chest opener',
      muscleGroups: ['Back', 'Chest', 'Shoulders'],
      equipment: ['Yoga Mat'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Lie face down, press hands into ground, lift chest while keeping hips down'
    },

    // Balance
    {
      name: 'Single Leg Stand',
      category: 'Balance',
      description: 'Basic balance exercise',
      muscleGroups: ['Core', 'Legs'],
      equipment: ['Bodyweight'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Stand on one leg, maintain balance, gradually increase duration'
    },
    {
      name: 'Tree Pose',
      category: 'Balance',
      description: 'Yoga balance pose',
      muscleGroups: ['Core', 'Legs', 'Ankles'],
      equipment: ['Yoga Mat'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Place foot on opposite thigh, bring hands to prayer position, balance'
    },

    // Plyometrics
    {
      name: 'Box Jumps',
      category: 'Plyometrics',
      description: 'Explosive jumping exercise',
      muscleGroups: ['Legs', 'Glutes', 'Calves'],
      equipment: ['Plyo Box'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Squat down, explode upward, land softly on box, step down'
    },
    {
      name: 'Tuck Jumps',
      category: 'Plyometrics',
      description: 'High-intensity jumping movement',
      muscleGroups: ['Legs', 'Core', 'Cardiovascular System'],
      equipment: ['Bodyweight'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Jump up, bring knees to chest, land softly, repeat'
    },

    // Sports
    {
      name: 'Medicine Ball Slams',
      category: 'Sports',
      description: 'Power and conditioning exercise',
      muscleGroups: ['Full Body', 'Core'],
      equipment: ['Medicine Ball'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Hold ball overhead, slam down with force, catch and repeat'
    },
    {
      name: 'Battle Ropes',
      category: 'Sports',
      description: 'High-intensity conditioning workout',
      muscleGroups: ['Arms', 'Shoulders', 'Core', 'Cardiovascular System'],
      equipment: ['Battle Ropes'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Create waves with ropes, vary patterns and intensity'
    },

    // Other
    {
      name: 'Plank',
      category: 'Other',
      description: 'Core stability exercise',
      muscleGroups: ['Core', 'Shoulders', 'Back'],
      equipment: ['Bodyweight'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Hold body in straight line from head to heels, engage core'
    },
    {
      name: 'Mountain Climbers',
      category: 'Other',
      description: 'Dynamic core and cardio exercise',
      muscleGroups: ['Core', 'Shoulders', 'Cardiovascular System'],
      equipment: ['Bodyweight'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Start in plank, drive knees alternately toward chest'
    },
    {
      name: 'Jump Rope',
      category: 'Other',
      description: 'Classic cardio and coordination exercise',
      muscleGroups: ['Legs', 'Cardiovascular System', 'Coordination'],
      equipment: ['Jump Rope'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Bounce on balls of feet, keep rope moving, vary speed'
    }
  ]

  for (const exercise of exercises) {
    await prisma.exercise.create({
      data: exercise
    })
  }

  console.log(`💪 Created ${exercises.length} exercises`)

  // Create some sample workouts
  const workout1 = await prisma.workout.create({
    data: {
      name: 'Full Body Strength',
      description: 'Complete full body workout targeting all major muscle groups',
      category: 'Strength',
      difficulty: 'INTERMEDIATE' as const,
      estimatedDuration: 60,
      status: 'ACTIVE',
      creatorId: trainer.id
    }
  })

  // Add exercises to workout1
  const squatsExercise = await prisma.exercise.findFirst({ where: { name: 'Squats' } })
  const pushupsExercise = await prisma.exercise.findFirst({ where: { name: 'Push-ups' } })
  const pullupsExercise = await prisma.exercise.findFirst({ where: { name: 'Pull-ups' } })

  if (squatsExercise) {
    await prisma.workoutExercise.create({
      data: {
        workoutId: workout1.id,
        exerciseId: squatsExercise.id,
        order: 1,
        sets: 3,
        reps: '12',
        rest: '90s',
        notes: 'Focus on form and depth'
      }
    })
  }

  if (pushupsExercise) {
    await prisma.workoutExercise.create({
      data: {
        workoutId: workout1.id,
        exerciseId: pushupsExercise.id,
        order: 2,
        sets: 3,
        reps: '15',
        rest: '60s',
        notes: 'Modify on knees if needed'
      }
    })
  }

  if (pullupsExercise) {
    await prisma.workoutExercise.create({
      data: {
        workoutId: workout1.id,
        exerciseId: pullupsExercise.id,
        order: 3,
        sets: 3,
        reps: '8',
        rest: '90s',
        notes: 'Use assistance if needed'
      }
    })
  }

  const workout2 = await prisma.workout.create({
    data: {
      name: 'Cardio Blast',
      description: 'High-intensity cardio session',
      category: 'Cardio',
      difficulty: 'INTERMEDIATE' as const,
      estimatedDuration: 45,
      status: 'ACTIVE',
      creatorId: trainer.id
    }
  })

  // Add exercises to workout2
  const burpeesExercise = await prisma.exercise.findFirst({ where: { name: 'Burpees' } })
  const mountainClimbersExercise = await prisma.exercise.findFirst({ where: { name: 'Mountain Climbers' } })
  const jumpRopeExercise = await prisma.exercise.findFirst({ where: { name: 'Jump Rope' } })

  if (burpeesExercise) {
    await prisma.workoutExercise.create({
      data: {
        workoutId: workout2.id,
        exerciseId: burpeesExercise.id,
        order: 1,
        sets: 4,
        reps: '10',
        rest: '60s',
        notes: 'Maintain pace throughout'
      }
    })
  }

  if (mountainClimbersExercise) {
    await prisma.workoutExercise.create({
      data: {
        workoutId: workout2.id,
        exerciseId: mountainClimbersExercise.id,
        order: 2,
        sets: 4,
        reps: '30s',
        rest: '45s',
        notes: 'Keep core engaged'
      }
    })
  }

  if (jumpRopeExercise) {
    await prisma.workoutExercise.create({
      data: {
        workoutId: workout2.id,
        exerciseId: jumpRopeExercise.id,
        order: 3,
        sets: 3,
        reps: '2min',
        rest: '60s',
        notes: 'Focus on rhythm and breathing'
      }
    })
  }

  console.log('🏋️ Created sample workouts')

  // Create a workout program
  const workoutProgram = await prisma.workoutProgram.create({
    data: {
      name: '4-Week Strength Builder',
      description: 'Progressive strength training program',
      category: 'Strength',
      difficulty: 'INTERMEDIATE' as const,
      totalDays: 4,
      status: 'ACTIVE',
      creatorId: trainer.id
    }
  })

  // Create workout days
  const benchPressExercise = await prisma.exercise.findFirst({ where: { name: 'Bench Press' } })
  const overheadPressExercise = await prisma.exercise.findFirst({ where: { name: 'Overhead Press' } })
  const romanianDeadliftExercise = await prisma.exercise.findFirst({ where: { name: 'Romanian Deadlift' } })
  const lungesExercise = await prisma.exercise.findFirst({ where: { name: 'Lunges' } })

  // Day 1: Push Day
  const pushDay = await prisma.workoutDay.create({
    data: {
      programId: workoutProgram.id,
      dayNumber: 1,
      name: 'Push Day',
      estimatedDuration: 60
    }
  })

  if (benchPressExercise) {
    await prisma.workoutDayExercise.create({
      data: {
        dayId: pushDay.id,
        exerciseId: benchPressExercise.id,
        order: 1,
        sets: 4,
        reps: '8',
        rest: '120s'
      }
    })
  }

  if (overheadPressExercise) {
    await prisma.workoutDayExercise.create({
      data: {
        dayId: pushDay.id,
        exerciseId: overheadPressExercise.id,
        order: 2,
        sets: 3,
        reps: '10',
        rest: '90s'
      }
    })
  }

  // Day 2: Pull Day
  const pullDay = await prisma.workoutDay.create({
    data: {
      programId: workoutProgram.id,
      dayNumber: 2,
      name: 'Pull Day',
      estimatedDuration: 60
    }
  })

  if (pullupsExercise) {
    await prisma.workoutDayExercise.create({
      data: {
        dayId: pullDay.id,
        exerciseId: pullupsExercise.id,
        order: 1,
        sets: 4,
        reps: '8',
        rest: '120s'
      }
    })
  }

  if (romanianDeadliftExercise) {
    await prisma.workoutDayExercise.create({
      data: {
        dayId: pullDay.id,
        exerciseId: romanianDeadliftExercise.id,
        order: 2,
        sets: 3,
        reps: '10',
        rest: '90s'
      }
    })
  }

  // Day 3: Legs Day
  const legsDay = await prisma.workoutDay.create({
    data: {
      programId: workoutProgram.id,
      dayNumber: 3,
      name: 'Legs Day',
      estimatedDuration: 60
    }
  })

  if (squatsExercise) {
    await prisma.workoutDayExercise.create({
      data: {
        dayId: legsDay.id,
        exerciseId: squatsExercise.id,
        order: 1,
        sets: 4,
        reps: '10',
        rest: '120s'
      }
    })
  }

  if (lungesExercise) {
    await prisma.workoutDayExercise.create({
      data: {
        dayId: legsDay.id,
        exerciseId: lungesExercise.id,
        order: 2,
        sets: 3,
        reps: '12 each leg',
        rest: '90s'
      }
    })
  }

  // Day 4: Active Recovery
  await prisma.workoutDay.create({
    data: {
      programId: workoutProgram.id,
      dayNumber: 4,
      name: 'Active Recovery',
      estimatedDuration: 30,
      isRestDay: true,
      notes: 'Light stretching and mobility work'
    }
  })

  console.log('📅 Created workout program')

  console.log('✅ Database seeding completed!')
  console.log('\n🔑 Demo Accounts:')
  console.log('Admin: admin@whateverfit.com / password123')
  console.log('Trainer: trainer@whateverfit.com / password123')
  console.log('Client: client@whateverfit.com / password123')
  console.log('\n💪 Created exercises across all categories')
  console.log('🏋️ Created sample workouts and workout program')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



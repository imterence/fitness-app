import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'

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

  const trainer1 = await prisma.user.create({
    data: {
      email: 'trainer@whateverfit.com',
      name: 'John Trainer',
      password: hashedPassword,
      role: 'TRAINER'
    }
  })

  const trainer2 = await prisma.user.create({
    data: {
      email: 'mike.trainer@whateverfit.com',
      name: 'Mike Johnson',
      password: hashedPassword,
      role: 'TRAINER'
    }
  })

  const trainer3 = await prisma.user.create({
    data: {
      email: 'lisa.trainer@whateverfit.com',
      name: 'Lisa Chen',
      password: hashedPassword,
      role: 'TRAINER'
    }
  })

  const client1 = await prisma.user.create({
    data: {
      email: 'client@whateverfit.com',
      name: 'Sarah Client',
      password: hashedPassword,
      role: 'CLIENT'
    }
  })

  const client2 = await prisma.user.create({
    data: {
      email: 'james.client@whateverfit.com',
      name: 'James Wilson',
      password: hashedPassword,
      role: 'CLIENT'
    }
  })

  const client3 = await prisma.user.create({
    data: {
      email: 'emma.client@whateverfit.com',
      name: 'Emma Rodriguez',
      password: hashedPassword,
      role: 'CLIENT'
    }
  })

  const client4 = await prisma.user.create({
    data: {
      email: 'david.client@whateverfit.com',
      name: 'David Kim',
      password: hashedPassword,
      role: 'CLIENT'
    }
  })

  const client5 = await prisma.user.create({
    data: {
      email: 'sophia.client@whateverfit.com',
      name: 'Sophia Thompson',
      password: hashedPassword,
      role: 'CLIENT'
    }
  })

  console.log('👥 Created users')

  // Create client relationships
  await prisma.client.create({
    data: {
      userId: client1.id,
      trainerId: trainer1.id,
      goals: 'Improve overall fitness and prepare for Hyrox competition',
      notes: 'Prefers morning workouts, has experience with CrossFit',
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: 'PRO',
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    }
  })

  await prisma.client.create({
    data: {
      userId: client2.id,
      trainerId: trainer2.id,
      goals: 'Build strength and muscle mass',
      notes: 'New to fitness, prefers evening workouts',
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: 'BASIC',
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months from now
    }
  })

  await prisma.client.create({
    data: {
      userId: client3.id,
      trainerId: trainer1.id,
      goals: 'Improve endurance and lose weight',
      notes: 'Intermediate level, likes group workouts',
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: 'ELITE',
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    }
  })

  await prisma.client.create({
    data: {
      userId: client4.id,
      trainerId: null, // No trainer assigned yet
      goals: 'General fitness and flexibility',
      notes: 'Beginner level, interested in yoga and pilates',
      subscriptionStatus: 'INACTIVE',
      subscriptionPlan: null,
      subscriptionStart: null,
      subscriptionEnd: null
    }
  })

  await prisma.client.create({
    data: {
      userId: client5.id,
      trainerId: trainer3.id,
      goals: 'Sports performance and agility',
      notes: 'Athlete, needs sport-specific training',
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: 'PRO',
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 3 months from now
    }
  })

  console.log('👤 Created client relationships')

  // Enhanced Exercise Library
  const exercises = [
    // Hyrox-Specific Movements
    {
      name: 'Burpee Box Jump Over',
      category: 'MetCon',
      description: 'Explosive full-body movement combining burpee and box jump',
      muscleGroups: ['Full Body', 'Cardiovascular System'],
      equipment: ['Box', 'Bodyweight'],
      difficulty: 'ADVANCED' as const,
      instructions: 'Perform burpee, then explosively jump over box, repeat'
    },
    {
      name: 'Wall Ball',
      category: 'MetCon',
      description: 'Squat to wall ball throw combination exercise',
      muscleGroups: ['Quadriceps', 'Glutes', 'Shoulders', 'Core'],
      equipment: ['Medicine Ball', 'Wall'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Squat down, catch ball, stand and throw to wall target, repeat'
    },
    {
      name: 'Sled Push',
      category: 'Strength',
      description: 'Forward sled pushing for lower body and cardio',
      muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Cardiovascular System'],
      equipment: ['Sled', 'Weight Plates'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Load sled, push forward with explosive leg drive, maintain form'
    },
    {
      name: 'Sled Pull',
      category: 'Strength',
      description: 'Backward sled pulling for posterior chain',
      muscleGroups: ['Hamstrings', 'Glutes', 'Lower Back', 'Cardiovascular System'],
      equipment: ['Sled', 'Weight Plates', 'Rope'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Face sled, pull rope toward chest while walking backward'
    },
    {
      name: 'Rope Climb',
      category: 'Strength',
      description: 'Upper body climbing exercise using rope',
      muscleGroups: ['Lats', 'Biceps', 'Forearms', 'Core'],
      equipment: ['Climbing Rope'],
      difficulty: 'ADVANCED' as const,
      instructions: 'Grip rope, use arms and legs to climb, control descent'
    },
    {
      name: 'Sandbag Carry',
      category: 'Strength',
      description: 'Functional carrying exercise with sandbag',
      muscleGroups: ['Core', 'Shoulders', 'Grip', 'Full Body'],
      equipment: ['Sandbag'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Pick up sandbag, carry for distance, maintain upright posture'
    },
    {
      name: 'Farmers Walk',
      category: 'Strength',
      description: 'Bilateral carrying exercise with weights',
      muscleGroups: ['Core', 'Shoulders', 'Grip', 'Full Body'],
      equipment: ['Dumbbells', 'Kettlebells'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Hold weights at sides, walk forward maintaining posture'
    },
    {
      name: 'Thrusters',
      category: 'MetCon',
      description: 'Front squat to push press combination',
      muscleGroups: ['Quadriceps', 'Glutes', 'Shoulders', 'Core'],
      equipment: ['Barbell', 'Weight Plates'],
      difficulty: 'ADVANCED' as const,
      instructions: 'Front squat, then push press overhead, return to start'
    },
    {
      name: 'Box Jumps',
      category: 'Plyometric',
      description: 'Explosive jumping onto elevated surface',
      muscleGroups: ['Quadriceps', 'Glutes', 'Calves', 'Cardiovascular System'],
      equipment: ['Box', 'Bodyweight'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Squat down, explode upward, land softly on box'
    },
    {
      name: 'Kettlebell Swings',
      category: 'MetCon',
      description: 'Hip hinge movement with kettlebell',
      muscleGroups: ['Hamstrings', 'Glutes', 'Core', 'Shoulders'],
      equipment: ['Kettlebell'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Hinge at hips, swing kettlebell forward using hip drive'
    },
    {
      name: 'Row (Machine)',
      category: 'Cardio',
      description: 'Full-body cardio exercise on rowing machine',
      muscleGroups: ['Legs', 'Back', 'Arms', 'Cardiovascular System'],
      equipment: ['Rowing Machine'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Drive with legs, lean back, pull arms to chest, return smoothly'
    },
    {
      name: 'Assault Bike',
      category: 'Cardio',
      description: 'High-intensity cardio on assault bike',
      muscleGroups: ['Legs', 'Arms', 'Cardiovascular System'],
      equipment: ['Assault Bike'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Pedal and push/pull handles simultaneously for maximum effort'
    },
    {
      name: 'Ring Muscle Ups',
      category: 'Gymnastics',
      description: 'Advanced ring exercise combining pull-up and dip',
      muscleGroups: ['Lats', 'Chest', 'Triceps', 'Core'],
      equipment: ['Gymnastic Rings'],
      difficulty: 'ADVANCED' as const,
      instructions: 'Pull up to rings, transition over rings, perform dip'
    },
    {
      name: 'Handstand Push Ups',
      category: 'Gymnastics',
      description: 'Push-ups performed in handstand position',
      muscleGroups: ['Shoulders', 'Triceps', 'Core', 'Balance'],
      equipment: ['Wall', 'Bodyweight'],
      difficulty: 'ADVANCED' as const,
      instructions: 'Kick up to handstand against wall, perform push-ups'
    },
    {
      name: 'Double Unders',
      category: 'Cardio',
      description: 'Jump rope with rope passing twice per jump',
      muscleGroups: ['Calves', 'Cardiovascular System', 'Coordination'],
      equipment: ['Jump Rope'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Jump higher, spin rope faster to achieve double pass'
    },
    {
      name: 'Toes to Bar',
      category: 'Gymnastics',
      description: 'Hanging leg raise touching toes to bar',
      muscleGroups: ['Core', 'Lats', 'Grip'],
      equipment: ['Pull-up Bar'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Hang from bar, raise legs to touch toes to bar'
    },
    {
      name: 'Pistol Squats',
      category: 'Strength',
      description: 'Single-leg squat on one leg',
      muscleGroups: ['Quadriceps', 'Glutes', 'Core', 'Balance'],
      equipment: ['Bodyweight'],
      difficulty: 'ADVANCED' as const,
      instructions: 'Stand on one leg, squat down, other leg extended forward'
    },
    {
      name: 'Turkish Get Up',
      category: 'Strength',
      description: 'Complex full-body movement with kettlebell',
      muscleGroups: ['Full Body', 'Core', 'Shoulders', 'Hip Mobility'],
      equipment: ['Kettlebell'],
      difficulty: 'ADVANCED' as const,
      instructions: 'Lie on back, press kettlebell up, stand up while keeping arm extended'
    },
    {
      name: 'Snatch',
      category: 'Olympic Lifting',
      description: 'Olympic lift from ground to overhead in one motion',
      muscleGroups: ['Full Body', 'Explosive Power', 'Coordination'],
      equipment: ['Barbell', 'Weight Plates'],
      difficulty: 'ADVANCED' as const,
      instructions: 'Pull bar from ground, explosively extend hips and knees, catch overhead'
    },
    {
      name: 'Clean and Jerk',
      category: 'Olympic Lifting',
      description: 'Two-part Olympic lift: clean then jerk',
      muscleGroups: ['Full Body', 'Explosive Power', 'Coordination'],
      equipment: ['Barbell', 'Weight Plates'],
      difficulty: 'ADVANCED' as const,
      instructions: 'Clean bar to shoulders, then jerk overhead with split or push press'
    },
    {
      name: 'Deadlift',
      category: 'Strength',
      description: 'Posterior chain powerhouse exercise',
      muscleGroups: ['Hamstrings', 'Glutes', 'Back'],
      equipment: ['Barbell'],
      difficulty: 'INTERMEDIATE' as const,
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
      name: 'Burpees',
      category: 'Cardio',
      description: 'Full-body conditioning exercise',
      muscleGroups: ['Full Body', 'Cardiovascular System'],
      equipment: ['Bodyweight'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Squat down, kick feet back, perform push-up, jump up'
    },
    // Additional Strength Exercises
    {
      name: 'Bench Press',
      category: 'Strength',
      description: 'Classic chest pressing movement',
      muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
      equipment: ['Barbell', 'Bench'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Lie on bench, lower bar to chest, press up to full extension'
    },
    {
      name: 'Squats',
      category: 'Strength',
      description: 'Fundamental lower body movement',
      muscleGroups: ['Quadriceps', 'Glutes', 'Core'],
      equipment: ['Barbell', 'Weight Plates'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Bar on upper back, squat down, drive up through heels'
    },
    {
      name: 'Pull-ups',
      category: 'Strength',
      description: 'Upper body pulling exercise',
      muscleGroups: ['Lats', 'Biceps', 'Back'],
      equipment: ['Pull-up Bar'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Hang from bar, pull chin over bar, lower with control'
    },
    {
      name: 'Push-ups',
      category: 'Strength',
      description: 'Bodyweight chest exercise',
      muscleGroups: ['Chest', 'Triceps', 'Shoulders', 'Core'],
      equipment: ['Bodyweight'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Plank position, lower chest to ground, push back up'
    },
    {
      name: 'Overhead Press',
      category: 'Strength',
      description: 'Shoulder pressing movement',
      muscleGroups: ['Shoulders', 'Triceps', 'Core'],
      equipment: ['Barbell', 'Dumbbells'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Press weight overhead, keep core tight, control descent'
    },
    {
      name: 'Bent Over Rows',
      category: 'Strength',
      description: 'Back rowing exercise',
      muscleGroups: ['Lats', 'Biceps', 'Back'],
      equipment: ['Barbell', 'Dumbbells'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Hinge at hips, row weight to lower chest, control descent'
    },
    {
      name: 'Dumbbell Curls',
      category: 'Strength',
      description: 'Bicep isolation exercise',
      muscleGroups: ['Biceps', 'Forearms'],
      equipment: ['Dumbbells'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Stand tall, curl dumbbells to shoulders, lower with control'
    },
    {
      name: 'Tricep Dips',
      category: 'Strength',
      description: 'Tricep and chest exercise',
      muscleGroups: ['Triceps', 'Chest', 'Shoulders'],
      equipment: ['Dip Bars', 'Bodyweight'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Support on bars, lower body, press back up'
    },
    {
      name: 'Leg Press',
      category: 'Strength',
      description: 'Machine-based leg exercise',
      muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
      equipment: ['Leg Press Machine'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Sit in machine, press weight away, control return'
    },
    {
      name: 'Lat Pulldowns',
      category: 'Strength',
      description: 'Back width exercise',
      muscleGroups: ['Lats', 'Biceps', 'Back'],
      equipment: ['Cable Machine'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Pull bar to upper chest, squeeze shoulder blades'
    },
    // Additional MetCon Exercises
    {
      name: 'Man Makers',
      category: 'MetCon',
      description: 'Complex dumbbell movement',
      muscleGroups: ['Full Body', 'Cardiovascular System'],
      equipment: ['Dumbbells'],
      difficulty: 'ADVANCED' as const,
      instructions: 'Renegade row, clean, thruster, repeat on other side'
    },
    {
      name: 'Devil Press',
      category: 'MetCon',
      description: 'Burpee to dumbbell snatch combination',
      muscleGroups: ['Full Body', 'Cardiovascular System'],
      equipment: ['Dumbbells'],
      difficulty: 'ADVANCED' as const,
      instructions: 'Burpee, then dumbbell snatch, alternate arms'
    },
    {
      name: 'Air Squats',
      category: 'MetCon',
      description: 'Bodyweight squat for conditioning',
      muscleGroups: ['Quadriceps', 'Glutes', 'Core'],
      equipment: ['Bodyweight'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Squat down, thighs parallel to ground, stand up'
    },
    {
      name: 'Mountain Climbers',
      category: 'MetCon',
      description: 'Dynamic core exercise',
      muscleGroups: ['Core', 'Shoulders', 'Cardiovascular System'],
      equipment: ['Bodyweight'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Plank position, alternate knees to chest rapidly'
    },
    {
      name: 'Jumping Jacks',
      category: 'MetCon',
      description: 'Classic cardio exercise',
      muscleGroups: ['Full Body', 'Cardiovascular System'],
      equipment: ['Bodyweight'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Jump feet apart while raising arms overhead'
    },
    // Additional Cardio Exercises
    {
      name: 'Jump Rope',
      category: 'Cardio',
      description: 'Basic jump rope exercise',
      muscleGroups: ['Calves', 'Cardiovascular System', 'Coordination'],
      equipment: ['Jump Rope'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Basic bounce, maintain rhythm, keep feet together'
    },
    {
      name: 'High Knees',
      category: 'Cardio',
      description: 'Dynamic cardio exercise',
      muscleGroups: ['Legs', 'Core', 'Cardiovascular System'],
      equipment: ['Bodyweight'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Run in place, bring knees to waist height'
    },
    {
      name: 'Butt Kicks',
      category: 'Cardio',
      description: 'Dynamic leg exercise',
      muscleGroups: ['Hamstrings', 'Cardiovascular System'],
      equipment: ['Bodyweight'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Run in place, kick heels to glutes'
    },
    {
      name: 'Sprint Intervals',
      category: 'Cardio',
      description: 'High-intensity interval training',
      muscleGroups: ['Legs', 'Cardiovascular System'],
      equipment: ['Running Shoes', 'Track'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Sprint for 30s, walk for 60s, repeat'
    },
    {
      name: 'Stair Climbing',
      category: 'Cardio',
      description: 'Vertical cardio exercise',
      muscleGroups: ['Legs', 'Cardiovascular System'],
      equipment: ['Stairs', 'StairMaster'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Climb stairs at steady pace, maintain good posture'
    },
    // Additional Gymnastics Exercises
    {
      name: 'Ring Rows',
      category: 'Gymnastics',
      description: 'Scaled ring exercise',
      muscleGroups: ['Lats', 'Biceps', 'Back'],
      equipment: ['Gymnastic Rings'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Lean back, pull chest to rings, control descent'
    },
    {
      name: 'Ring Dips',
      category: 'Gymnastics',
      description: 'Ring-based dip exercise',
      muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
      equipment: ['Gymnastic Rings'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Support on rings, lower body, press back up'
    },
    {
      name: 'L-Sit',
      category: 'Gymnastics',
      description: 'Core strength hold',
      muscleGroups: ['Core', 'Hip Flexors', 'Shoulders'],
      equipment: ['Parallel Bars', 'Rings'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Support on bars/rings, lift legs to L position'
    },
    {
      name: 'Hollow Hold',
      category: 'Gymnastics',
      description: 'Core stability exercise',
      muscleGroups: ['Core', 'Hip Flexors'],
      equipment: ['Bodyweight'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Lie on back, lift shoulders and legs, hold position'
    },
    {
      name: 'Arch Hold',
      category: 'Gymnastics',
      description: 'Back extension hold',
      muscleGroups: ['Back', 'Glutes', 'Shoulders'],
      equipment: ['Bodyweight'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Lie on stomach, lift chest and legs, hold position'
    },
    // Additional Plyometric Exercises
    {
      name: 'Broad Jump',
      category: 'Plyometric',
      description: 'Horizontal jumping exercise',
      muscleGroups: ['Quadriceps', 'Glutes', 'Calves'],
      equipment: ['Bodyweight'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Squat down, explode forward, land softly'
    },
    {
      name: 'Tuck Jump',
      category: 'Plyometric',
      description: 'Vertical jump with knee tuck',
      muscleGroups: ['Quadriceps', 'Glutes', 'Calves'],
      equipment: ['Bodyweight'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Jump up, bring knees to chest, land softly'
    },
    {
      name: 'Split Jump',
      category: 'Plyometric',
      description: 'Jumping lunge variation',
      muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
      equipment: ['Bodyweight'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Lunge position, jump and switch legs mid-air'
    },
    {
      name: 'Depth Jump',
      category: 'Plyometric',
      description: 'Advanced plyometric exercise',
      muscleGroups: ['Quadriceps', 'Glutes', 'Calves'],
      equipment: ['Box', 'Bodyweight'],
      difficulty: 'ADVANCED' as const,
      instructions: 'Step off box, immediately jump up upon landing'
    },
    // Additional Olympic Lifting Exercises
    {
      name: 'Power Clean',
      category: 'Olympic Lifting',
      description: 'Explosive pulling exercise',
      muscleGroups: ['Full Body', 'Explosive Power'],
      equipment: ['Barbell', 'Weight Plates'],
      difficulty: 'ADVANCED' as const,
      instructions: 'Pull bar explosively, catch at shoulders in quarter squat'
    },
    {
      name: 'Power Snatch',
      category: 'Olympic Lifting',
      description: 'Explosive overhead movement',
      muscleGroups: ['Full Body', 'Explosive Power'],
      equipment: ['Barbell', 'Weight Plates'],
      difficulty: 'ADVANCED' as const,
      instructions: 'Pull bar explosively, catch overhead in quarter squat'
    },
    {
      name: 'Hang Clean',
      category: 'Olympic Lifting',
      description: 'Clean from hang position',
      muscleGroups: ['Full Body', 'Explosive Power'],
      equipment: ['Barbell', 'Weight Plates'],
      difficulty: 'ADVANCED' as const,
      instructions: 'Start with bar at mid-thigh, clean to shoulders'
    },
    {
      name: 'Hang Snatch',
      category: 'Olympic Lifting',
      description: 'Snatch from hang position',
      muscleGroups: ['Full Body', 'Explosive Power'],
      equipment: ['Barbell', 'Weight Plates'],
      difficulty: 'ADVANCED' as const,
      instructions: 'Start with bar at mid-thigh, snatch overhead'
    },
    // Additional Functional Exercises
    {
      name: 'Bear Crawl',
      category: 'Functional',
      description: 'Quadrupedal movement pattern',
      muscleGroups: ['Core', 'Shoulders', 'Full Body'],
      equipment: ['Bodyweight'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Move on hands and feet, maintain stable core'
    },
    {
      name: 'Crab Walk',
      category: 'Functional',
      description: 'Reverse quadrupedal movement',
      muscleGroups: ['Core', 'Shoulders', 'Glutes'],
      equipment: ['Bodyweight'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Sit on ground, lift hips, walk on hands and feet'
    },
    {
      name: 'Duck Walk',
      category: 'Functional',
      description: 'Squat walking movement',
      muscleGroups: ['Quadriceps', 'Glutes', 'Core'],
      equipment: ['Bodyweight'],
      difficulty: 'INTERMEDIATE' as const,
      instructions: 'Squat position, walk forward maintaining depth'
    },
    {
      name: 'Inchworm',
      category: 'Functional',
      description: 'Dynamic stretching and movement',
      muscleGroups: ['Core', 'Shoulders', 'Hamstrings'],
      equipment: ['Bodyweight'],
      difficulty: 'BEGINNER' as const,
      instructions: 'Stand, fold forward, walk hands out, walk feet to hands'
    }
  ]

  // Create exercises
  for (const exercise of exercises) {
    await prisma.exercise.create({
      data: exercise
    })
  }

  console.log(`💪 Created ${exercises.length} exercises`)

  // Create workout template
  const workoutTemplate = await prisma.workoutProgram.create({
    data: {
      name: 'Hyrox Competition Prep',
      description: 'Comprehensive training program for Hyrox competition preparation',
      difficulty: 'ADVANCED' as const,
      totalDays: 2,
      creator: {
        connect: { id: trainer1.id }
      },
      days: {
        create: [
          {
            dayNumber: 1,
            name: 'Strength & Power',
            estimatedDuration: 60,
            exercises: {
              create: [
                {
                  exerciseId: (await prisma.exercise.findFirst({ where: { name: 'Deadlift' } }))!.id,
                  order: 1,
                  sets: 5,
                  reps: '5',
                  rest: '180s',
                  notes: 'Focus on form and progressive overload'
                },
                {
                  exerciseId: (await prisma.exercise.findFirst({ where: { name: 'Thrusters' } }))!.id,
                  order: 2,
                  sets: 4,
                  reps: '8',
                  rest: '120s',
                  notes: 'Maintain good form throughout'
                }
              ]
            }
          },
          {
            dayNumber: 2,
            name: 'MetCon & Endurance',
            estimatedDuration: 60,
            exercises: {
              create: [
                {
                  exerciseId: (await prisma.exercise.findFirst({ where: { name: 'Burpee Box Jump Over' } }))!.id,
                  order: 1,
                  sets: 3,
                  reps: '10',
                  rest: '90s',
                  notes: 'Focus on explosive movement'
                },
                {
                  exerciseId: (await prisma.exercise.findFirst({ where: { name: 'Wall Ball' } }))!.id,
                  order: 2,
                  sets: 3,
                  reps: '15',
                  rest: '90s',
                  notes: 'Maintain consistent wall ball height'
                }
              ]
            }
          }
        ]
      }
    }
  })

  console.log('🏋️ Created workout template')

  // Create a single-day workout for testing
  const singleWorkout = await prisma.workout.create({
    data: {
      name: 'Quick Hyrox Circuit',
      description: 'Fast-paced circuit workout for Hyrox preparation',
      difficulty: 'INTERMEDIATE' as const,
      estimatedDuration: 30,
      isPublic: true,
      creator: {
        connect: { id: trainer1.id }
      },
      exercises: {
        create: [
          {
            exerciseId: (await prisma.exercise.findFirst({ where: { name: 'Burpee Box Jump Over' } }))!.id,
            order: 1,
            sets: 3,
            reps: '8',
            rest: '60s',
            notes: 'Focus on explosive movement'
          },
          {
            exerciseId: (await prisma.exercise.findFirst({ where: { name: 'Wall Ball' } }))!.id,
            order: 2,
            sets: 3,
            reps: '12',
            rest: '60s',
            notes: 'Maintain consistent wall ball height'
          },
          {
            exerciseId: (await prisma.exercise.findFirst({ where: { name: 'Sled Push' } }))!.id,
            order: 3,
            sets: 3,
            reps: '20m',
            rest: '90s',
            notes: 'Push sled for 20 meters each set'
          }
        ]
      }
    }
  })

  console.log('💪 Created single-day workout')

  console.log('✅ Database seeding completed!')
}

// Function to import exercises from CSV (for future use)
async function importExercisesFromCSV(csvFilePath: string) {
  try {
    const csvContent = readFileSync(csvFilePath, 'utf-8')
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    }) as Array<{
      name: string
      category: string
      description: string
      muscleGroups: string
      equipment: string
      difficulty: string
      instructions: string
    }>

    for (const record of records) {
      await prisma.exercise.create({
        data: {
          name: record.name,
          category: record.category,
          description: record.description,
          muscleGroups: record.muscleGroups.split(',').map((mg: string) => mg.trim()),
          equipment: record.equipment.split(',').map((eq: string) => eq.trim()),
          difficulty: record.difficulty.toUpperCase() as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
          instructions: record.instructions
        }
      })
    }

    console.log(`✅ Imported ${records.length} exercises from CSV`)
  } catch (error) {
    console.error('❌ Error importing exercises from CSV:', error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



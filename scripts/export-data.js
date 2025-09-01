const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('🔄 Starting data export...');

    // Export exercises
    const exercises = await prisma.exercise.findMany();
    const exerciseCsv = exercises.map(ex => ({
      name: ex.name,
      category: ex.category,
      description: ex.description || '',
      muscleGroups: ex.muscleGroups.join(';'), // Use semicolon instead of comma
      equipment: ex.equipment.join(';'), // Use semicolon instead of comma
      difficulty: ex.difficulty,
      instructions: ex.instructions || '',
      videoUrl: ex.videoUrl || ''
    }));
    
    fs.writeFileSync(
      path.join(__dirname, '../exports/exercises.csv'),
      'name,category,description,muscleGroups,equipment,difficulty,instructions,videoUrl\n' +
      exerciseCsv.map(row => 
        `"${row.name.replace(/"/g, '""')}","${row.category.replace(/"/g, '""')}","${row.description.replace(/"/g, '""')}","${row.muscleGroups.replace(/"/g, '""')}","${row.equipment.replace(/"/g, '""')}","${row.difficulty}","${row.instructions.replace(/"/g, '""')}","${row.videoUrl.replace(/"/g, '""')}"`
      ).join('\n')
    );

    // Export workouts
    const workouts = await prisma.workout.findMany({
      include: {
        exercises: {
          include: {
            exercise: true
          }
        }
      }
    });
    
    const workoutCsv = workouts.map(workout => ({
      name: workout.name,
      description: workout.description || '',
      category: workout.category || '',
      difficulty: workout.difficulty || 'INTERMEDIATE',
      exercises: workout.exercises.map(we => 
        `${we.exercise.name}:${we.sets}:${we.reps}:${we.weight || ''}:${we.duration || ''}`
      ).join('|')
    }));
    
    fs.writeFileSync(
      path.join(__dirname, '../exports/workouts.csv'),
      'name,description,category,difficulty,exercises\n' +
      workoutCsv.map(row => 
        `"${row.name.replace(/"/g, '""')}","${row.description.replace(/"/g, '""')}","${row.category.replace(/"/g, '""')}","${row.difficulty}","${row.exercises}"`
      ).join('\n')
    );

    // Export users (without passwords)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    
    fs.writeFileSync(
      path.join(__dirname, '../exports/users.csv'),
      'id,email,name,role,createdAt\n' +
      users.map(user => 
        `"${user.id}","${user.email}","${user.name.replace(/"/g, '""')}","${user.role}","${user.createdAt}"`
      ).join('\n')
    );

    console.log('✅ Data exported successfully!');
    console.log(`📊 Exercises: ${exercises.length}`);
    console.log(`💪 Workouts: ${workouts.length}`);
    console.log(`👥 Users: ${users.length}`);
    console.log('📁 Check the exports/ folder for CSV files');
    console.log('💡 Note: muscleGroups and equipment use semicolons (;) as separators');

  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();

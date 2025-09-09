const { PrismaClient } = require('@prisma/client')
const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// Function to import exercises from Excel file
async function importExercisesFromExcel(excelFilePath) {
  try {
    console.log(`📊 Reading Excel file: ${excelFilePath}`)
    
    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON
    const exercises = XLSX.utils.sheet_to_json(worksheet)
    
    console.log(`📋 Found ${exercises.length} exercises in Excel file`)
    
    // Process each exercise
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i]
      
      // Validate required fields
      if (!exercise.name) {
        console.warn(`⚠️ Skipping exercise ${i + 1}: Missing required name field`)
        continue
      }
      
      // Clean and format data
      const exerciseData = {
        name: exercise.name.trim(),
        category: exercise.category ? exercise.category.trim() : 'General',
        description: exercise.description ? exercise.description.trim() : null,
        muscleGroups: exercise.muscleGroups ? 
          exercise.muscleGroups.split(',').map(mg => mg.trim()).filter(mg => mg) : 
          [],
        equipment: exercise.equipment ? 
          exercise.equipment.split(',').map(eq => eq.trim()).filter(eq => eq) : 
          [],
        difficulty: exercise.difficulty ? exercise.difficulty.trim().toUpperCase() : 'INTERMEDIATE',
        instructions: exercise.instructions ? exercise.instructions.trim() : null,
        videoUrl: exercise.videoUrl ? exercise.videoUrl.trim() : null
      }
      
      // Validate difficulty if provided
      if (exercise.difficulty && !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(exerciseData.difficulty)) {
        console.warn(`⚠️ Invalid difficulty for ${exerciseData.name}: ${exerciseData.difficulty}, defaulting to INTERMEDIATE`)
        exerciseData.difficulty = 'INTERMEDIATE'
      }
      
      try {
        // Check if exercise already exists
        const existingExercise = await prisma.exercise.findFirst({
          where: { name: exerciseData.name }
        })
        
        if (existingExercise) {
          console.log(`🔄 Updating existing exercise: ${exerciseData.name}`)
          await prisma.exercise.update({
            where: { id: existingExercise.id },
            data: exerciseData
          })
        } else {
          console.log(`➕ Creating new exercise: ${exerciseData.name}`)
          await prisma.exercise.create({
            data: exerciseData
          })
        }
      } catch (error) {
        console.error(`❌ Error processing exercise ${exerciseData.name}:`, error.message)
      }
    }
    
    console.log('✅ Excel import completed successfully!')
    
  } catch (error) {
    console.error('❌ Error importing from Excel:', error)
  }
}

// Function to import exercises from CSV file
async function importExercisesFromCSV(csvFilePath) {
  try {
    console.log(`📊 Reading CSV file: ${csvFilePath}`)
    
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim())
    
    console.log(`📋 Found ${lines.length - 1} exercises in CSV file`)
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const values = line.split(',').map(v => v.trim())
      
      if (values.length < headers.length) {
        console.warn(`⚠️ Skipping line ${i + 1}: Insufficient columns`)
        continue
      }
      
      // Create exercise object from CSV row
      const exercise = {}
      headers.forEach((header, index) => {
        exercise[header] = values[index] || ''
      })
      
      // Validate required fields
      if (!exercise.name) {
        console.warn(`⚠️ Skipping exercise ${i}: Missing required name field`)
        continue
      }
      
      // Clean and format data
      const exerciseData = {
        name: exercise.name.trim(),
        category: exercise.category ? exercise.category.trim() : 'General',
        description: exercise.description ? exercise.description.trim() : null,
        muscleGroups: exercise.muscleGroups ? 
          exercise.muscleGroups.split(',').map(mg => mg.trim()).filter(mg => mg) : 
          [],
        equipment: exercise.equipment ? 
          exercise.equipment.split(',').map(eq => eq.trim()).filter(eq => eq) : 
          [],
        difficulty: exercise.difficulty ? exercise.difficulty.trim().toUpperCase() : 'INTERMEDIATE',
        instructions: exercise.instructions ? exercise.instructions.trim() : null,
        videoUrl: exercise.videoUrl ? exercise.videoUrl.trim() : null
      }
      
      // Validate difficulty if provided
      if (exercise.difficulty && !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(exerciseData.difficulty)) {
        console.warn(`⚠️ Invalid difficulty for ${exerciseData.name}: ${exerciseData.difficulty}, defaulting to INTERMEDIATE`)
        exerciseData.difficulty = 'INTERMEDIATE'
      }
      
      try {
        // Check if exercise already exists
        const existingExercise = await prisma.exercise.findFirst({
          where: { name: exerciseData.name }
        })
        
        if (existingExercise) {
          console.log(`🔄 Updating existing exercise: ${exerciseData.name}`)
          await prisma.exercise.update({
            where: { id: existingExercise.id },
            data: exerciseData
          })
        } else {
          console.log(`➕ Creating new exercise: ${exerciseData.name}`)
          await prisma.exercise.create({
            data: exerciseData
          })
        }
      } catch (error) {
        console.error(`❌ Error processing exercise ${exerciseData.name}:`, error.message)
      }
    }
    
    console.log('✅ CSV import completed successfully!')
    
  } catch (error) {
    console.error('❌ Error importing from CSV:', error)
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('📚 Exercise Import Tool')
    console.log('Usage:')
    console.log('  node import-exercises.js <file_path>')
    console.log('')
    console.log('Supported formats:')
    console.log('  - Excel files (.xlsx, .xls)')
    console.log('  - CSV files (.csv)')
    console.log('')
    console.log('Example:')
    console.log('  node import-exercises.js exercises.xlsx')
    console.log('  node import-exercises.js exercises.csv')
    return
  }
  
  const filePath = args[0]
  const fileExtension = path.extname(filePath).toLowerCase()
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`)
    return
  }
  
  try {
    if (fileExtension === '.csv') {
      await importExercisesFromCSV(filePath)
    } else if (['.xlsx', '.xls'].includes(fileExtension)) {
      await importExercisesFromExcel(filePath)
    } else {
      console.error(`❌ Unsupported file format: ${fileExtension}`)
      console.log('Supported formats: .xlsx, .xls, .csv')
      return
    }
  } catch (error) {
    console.error('❌ Import failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = {
  importExercisesFromExcel,
  importExercisesFromCSV
}

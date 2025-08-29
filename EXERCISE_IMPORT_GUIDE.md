# Exercise Import Guide

## 🗑️ Clearing All Workouts and Exercises

To completely clear your database of all workouts and exercises, use the new cleanup script:

```bash
node scripts/clear-all-workouts-exercises.js
```

This script will:
1. Clear all workout progress data
2. Clear all workout assignments
3. Clear all workout programs
4. Clear all workouts
5. Clear all exercises

**⚠️ Warning: This will permanently delete ALL workout data!**

## 📊 Exercise Import Templates

### CSV Template
Use `exercise-template.csv` as a starting point for importing exercises.

### Required Columns
- **name** (required): Exercise name
- **category** (required): Exercise category (e.g., Strength, Cardio, Core)
- **difficulty** (required): BEGINNER, INTERMEDIATE, or ADVANCED
- **description** (optional): Exercise description
- **muscleGroups** (optional): Comma-separated muscle groups
- **equipment** (optional): Comma-separated equipment needed
- **instructions** (optional): Step-by-step instructions
- **videoUrl** (optional): URL to demonstration video

### Importing Exercises

1. **Prepare your data**: Use the CSV template or create your own Excel/CSV file
2. **Run the import script**:
   ```bash
   node scripts/import-exercises.js your-file.csv
   # or
   node scripts/import-exercises.js your-file.xlsx
   ```

### Example Data Format

```csv
name,category,description,muscleGroups,equipment,difficulty,instructions,videoUrl
Barbell Squat,Strength,Basic barbell squat exercise,"Quadriceps,Glutes,Hamstrings","Barbell,Squat Rack",INTERMEDIATE,"Stand with feet shoulder-width apart...",
Push-ups,Strength,Bodyweight push-up exercise,"Chest,Triceps,Shoulders",None,BEGINNER,"Start in plank position...",
```

### Notes
- Multiple muscle groups and equipment should be comma-separated
- Difficulty must be exactly: BEGINNER, INTERMEDIATE, or ADVANCED
- The script will update existing exercises if they have the same name
- Empty fields can be left blank or filled with "None"

## 🔄 Workflow

1. **Clear everything**: `node scripts/clear-all-workouts-exercises.js`
2. **Prepare your exercise data** using the CSV template
3. **Import exercises**: `node scripts/import-exercises.js your-file.csv`
4. **Create workouts and programs** using the imported exercises

## 📝 Tips for Exercise Data

- Use consistent naming conventions
- Group similar exercises by category
- Include detailed instructions for complex movements
- Add video URLs for proper form demonstration
- Consider difficulty progression (BEGINNER → INTERMEDIATE → ADVANCED)




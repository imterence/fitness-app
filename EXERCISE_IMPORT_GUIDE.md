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
- **description** (optional): Exercise description
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
name,description,instructions,videoUrl
Barbell Squat,Basic barbell squat exercise,Stand with feet shoulder-width apart, place barbell on upper back, squat down until thighs are parallel to ground, then stand back up,
Deadlift,Classic deadlift exercise,Stand with feet hip-width apart, grip barbell with hands shoulder-width apart, lift bar by extending hips and knees, keep back straight,
Bench Press,Flat bench press exercise,Lie on bench with feet flat on ground, grip barbell slightly wider than shoulders, lower bar to chest, then press back up,
```

**Note:** The template file contains only the header row. Add your exercises below the header.

### Notes
- The script will update existing exercises if they have the same name
- Empty fields can be left blank
- Exercise names should be unique and descriptive

## 🔄 Workflow

1. **Clear everything**: `node scripts/clear-all-workouts-exercises.js`
2. **Prepare your exercise data** using the CSV template
3. **Import exercises**: `node scripts/import-exercises.js your-file.csv`
4. **Create workouts and programs** using the imported exercises

## 📝 Tips for Exercise Data

- Use consistent naming conventions
- Include detailed instructions for complex movements
- Add video URLs for proper form demonstration
- Keep exercise names clear and descriptive











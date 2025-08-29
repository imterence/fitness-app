# HyroxFit - Professional Fitness Training Platform

A modern, professional fitness app designed specifically for Hyrox training and functional fitness, built with Next.js and TypeScript.

## Features

### 🏋️‍♂️ **Template Library System**
- **Pre-built Workout Templates**: Ready-to-use Hyrox training programs
- **Easy Customization**: Modify existing templates for individual clients
- **Category Filtering**: Organize by Competition, Strength, Endurance, Skills, etc.
- **Difficulty Levels**: Beginner, Intermediate, Advanced programs

### 🛠️ **Workout Builder**
- **Visual Exercise Library**: Search and add exercises with categories
- **Drag & Drop Interface**: Easy workout creation and reordering
- **Hyrox-Specific Exercises**: Burpee Box Jumps, Wall Balls, Sled Push, etc.
- **Quick Setup**: Set sets, reps, rest times, and notes

### 📅 **Client Schedule Management**
- **Weekly/Monthly Views**: Clear workout scheduling interface
- **Status Tracking**: Completed, Scheduled, Missed workouts
- **Progress Monitoring**: Track client adherence and performance
- **Mobile-Friendly**: Responsive design for on-the-go access

### 📊 **Dashboard & Analytics**
- **Client Overview**: Active clients, workout plans, completion rates
- **Quick Actions**: Fast access to common tasks
- **Recent Activity**: Real-time updates on client progress
- **Performance Metrics**: Track training effectiveness

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom Components
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Responsive Design**: Mobile-first approach

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fitness-hyrox-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── page.tsx          # Main dashboard
│   ├── templates/        # Workout template library
│   ├── workout-builder/  # Custom workout creator
│   └── schedule/         # Client schedule view
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components
│   └── WorkoutTemplate.tsx
└── lib/                 # Utility functions
```

## Key Pages

### 🏠 **Dashboard** (`/`)
- Overview of clients and workouts
- Quick access to templates and builder
- Recent activity and statistics

### 📚 **Template Library** (`/templates`)
- Browse pre-built workout programs
- Filter by category and difficulty
- Preview and use templates

### 🛠️ **Workout Builder** (`/create-workout`)
- Create custom workouts from scratch
- Exercise library with Hyrox movements
- Set parameters and notes

### 📅 **Schedule** (`/schedule`)
- Weekly/monthly workout calendar
- Track workout completion status
- View upcoming sessions

## Why This Approach?

### **For Trainers:**
- **No CSV/Excel Uploads**: Visual interface prevents formatting errors
- **Template Library**: Start with proven programs, customize as needed
- **Quick Creation**: Build workouts in minutes, not hours
- **Professional Look**: Clients see polished, branded experience

### **For Clients:**
- **Clear Schedule**: Easy-to-understand weekly/monthly views
- **Progress Tracking**: Visual feedback on completion status
- **Mobile Access**: Check workouts anywhere, anytime
- **Hyrox Focus**: Specifically designed for functional fitness

## Future Enhancements

- [ ] **Drag & Drop Reordering**: Implement proper drag-and-drop for exercises
- [ ] **Client Management**: Add client profiles and assignment
- [ ] **Progress Tracking**: Detailed analytics and reporting
- [ ] **Mobile App**: Convert to React Native for mobile
- [ ] **Real-time Updates**: Live workout tracking and notifications
- [ ] **Exercise Videos**: Embed demonstration videos for movements

## Contributing

This is a professional fitness platform. Please ensure all contributions maintain the high-quality, user-friendly experience that trainers and clients expect.

## License

This project is designed for professional fitness businesses. Please contact for licensing and commercial use.

---

**Built for fitness professionals who want to focus on training, not software.**

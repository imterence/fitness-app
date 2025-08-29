# HyroxFit Setup Instructions

## Authentication Setup

### 1. Install Dependencies
```bash
npm install next-auth @auth/prisma-adapter bcryptjs @types/bcryptjs
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Demo Accounts
Use these accounts to test the system:

**Trainer Account:**
- Email: trainer@hyroxfit.com
- Password: password123

**Client Account:**
- Email: client@hyroxfit.com
- Password: password123

**Admin Account:**
- Email: admin@hyroxfit.com
- Password: password123

## Features

### ✅ **Authentication System**
- Login/Registration pages
- Role-based access control (Trainer/Client/Admin)
- Protected routes
- Session management

### ✅ **Role-Based Dashboards**
- **Trainers/Admins**: See client management, workout creation, templates
- **Clients**: See workout schedule, progress tracking, assigned workouts

### ✅ **Template System**
- Browse pre-built Hyrox workout templates
- "Use Template" buttons now work and redirect to workout builder
- Filter by category and difficulty

### ✅ **Workout Builder**
- Create custom workouts from scratch
- Exercise library with Hyrox movements
- Set sets, reps, rest times, and notes

### ✅ **Client Schedule**
- Weekly/monthly calendar view
- Workout status tracking
- Progress monitoring

## How to Test

1. **Start the app**: `npm run dev`
2. **Visit**: `http://localhost:3000`
3. **Click "Demo as Trainer"** to see trainer dashboard
4. **Click "Demo as Client"** to see client dashboard
5. **Try templates**: Go to `/templates` and click "Use Template"
6. **Build workouts**: Go to `/create-workout` to create custom workouts

## File Structure

```
src/
├── app/
│   ├── auth/           # Login/Registration
│   ├── dashboard/      # Role-based dashboard
│   ├── templates/      # Workout template library
│   ├── workout-builder/# Custom workout creator
│   └── schedule/       # Client schedule view
├── components/         # UI components
├── types/             # TypeScript definitions
└── lib/               # Utility functions
```

## Next Steps

- [ ] Add real database integration
- [ ] Implement client assignment system
- [ ] Add workout progress tracking
- [ ] Create mobile app version
- [ ] Add payment integration

# CalorieWeb

A modern calorie tracking web application with real-time USDA nutrition data integration, built with React and Node.js.

## Features

- 🔐 **Firebase Authentication** - Secure user authentication and authorization
- 🍎 **USDA Food Database** - Search and select foods from USDA FoodData Central with accurate nutrition data
- 📊 **Macro Tracking** - Track calories, protein, fat, and carbohydrates
- 📅 **Date Navigation** - View and edit entries for any date
- 📈 **Historical Trends** - Visualize your nutrition trends over time with interactive charts
- 🎨 **Dark/Light Mode** - Automatic theme switching based on system preferences
- 💾 **Local Food Database** - Autocomplete from your previously entered foods
- ⚡ **Real-time Updates** - Instant feedback and calculations

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Firebase SDK** - Authentication
- **CSS Modules** - Component-scoped styling

### Backend
- **Node.js + Express** - REST API server
- **SQLite** - Local database
- **Firebase Admin SDK** - Token verification
- **USDA FoodData Central API** - Nutrition data

## Project Structure

```
calorieWeb/
├── calorie-track/          # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Analysis.jsx
│   │   │   ├── AuthForm.jsx
│   │   │   ├── DateSelector.jsx
│   │   │   ├── EditEntryForm.jsx
│   │   │   ├── EntryForm.jsx
│   │   │   ├── EntryList.jsx
│   │   │   ├── HistoricalTrends.jsx
│   │   │   ├── UserHeader.jsx
│   │   │   └── UserSettings.jsx
│   │   ├── App.jsx         # Main app component
│   │   ├── api.js          # API client functions
│   │   ├── config.js       # Configuration
│   │   ├── firebase.js     # Firebase initialization
│   │   └── main.jsx        # Entry point
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── backend/                # Backend Node.js API
    ├── index.js            # Express server and routes
    ├── db.js               # SQLite database setup
    ├── firebase.js         # Firebase Admin SDK
    ├── middleware.js       # Auth middleware
    ├── usda.js             # USDA API integration
    ├── package.json
    └── API.md              # API documentation
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Firebase project (free tier is sufficient)
- USDA FoodData Central API key (free)

### Setup

#### 1. Clone the repository

```bash
git clone https://github.com/yourusername/calorieWeb.git
cd calorieWeb
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# USDA API
USDA_API_KEY=your-usda-api-key
```

**Getting Firebase Credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Enable Email/Password authentication under Authentication → Sign-in method
4. Go to Project Settings → Service Accounts
5. Click "Generate New Private Key"
6. Extract the values from the downloaded JSON file

**Getting USDA API Key:**
1. Visit [USDA FoodData Central API Key Signup](https://fdc.nal.usda.gov/api-key-signup.html)
2. Fill out the form and get your free API key

Start the backend server:

```bash
npm run dev
```

Backend will run on `http://localhost:4000`

#### 3. Frontend Setup

```bash
cd ../calorie-track
npm install
```

Create a `src/config.js` file:

```javascript
export const API_BASE_URL = 'http://localhost:4000';

export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

**Getting Firebase Web Config:**
1. In Firebase Console, go to Project Settings
2. Scroll to "Your apps" section
3. Click the web icon (</>)
4. Copy the config object

Start the development server:

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### First Use

1. Open `http://localhost:5173` in your browser
2. Click "Sign Up" to create a new account
3. After signing in, you can start tracking your calories!

## Usage

### Adding Food Entries

1. **Type food name** - Start typing in the "Food Name" field
2. **Select from suggestions**:
   - 💾 **Saved Data** - Your previously entered foods
   - 🔬 **USDA Data** - Foods from USDA database with accurate nutrition
   - 📝 **Manual Entry** - Enter nutrition data yourself
3. **Enter quantity** - For USDA foods, use weight (e.g., "150g", "0.5kg")
4. **Review nutrition** - Calories and macros are automatically filled
5. **Click "Add Entry"**

### Viewing Historical Data

- Click "View Trends" to see your nutrition history
- Choose time period: 7 days, 2 weeks, 1 month, etc.
- Toggle between calories, macros, or combined view
- See average daily intake and tracking consistency

### Date Navigation

- Click on the date to open a date picker
- Use ← Previous / Next → buttons to navigate days
- Click "Go to Today" to return to current date

## API Documentation

See [backend/API.md](backend/API.md) for complete API documentation including:
- Authentication endpoints
- Food entry CRUD operations
- USDA food search
- Historical data summaries

## Component Architecture

### Frontend Components

- **App.jsx** - Main app container, authentication state management
- **AuthForm** - Login and registration forms
- **UserHeader** - User info, settings, and trends toggle
- **DateSelector** - Date navigation controls
- **Analysis** - Daily calorie and macro summary
- **EntryForm** - Add new food entries with autocomplete and USDA search
- **EditEntryForm** - Edit existing entries
- **EntryList** - Display list of food entries for selected date
- **HistoricalTrends** - Charts and tables for historical data
- **UserSettings** - User profile management

### Backend Structure

- **index.js** - Express server, routes, and business logic
- **db.js** - SQLite database initialization and schema
- **firebase.js** - Firebase Admin SDK initialization
- **middleware.js** - Authentication middleware
- **usda.js** - USDA API integration utilities

## Database Schema

### users table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  displayName TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### entries table
```sql
CREATE TABLE entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity TEXT DEFAULT '1',
  calories INTEGER NOT NULL,
  protein REAL,
  fat REAL,
  carbs REAL,
  date TEXT NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### foods table (autocomplete cache)
```sql
CREATE TABLE foods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  calories INTEGER,
  protein REAL,
  fat REAL,
  carbs REAL,
  dataSource TEXT DEFAULT 'user',
  fdcId INTEGER,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```


## Development

### Running Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd calorie-track
npm test
```


## Features in Development

- [ ] Meal planning
- [ ] Import meal via picture
- [ ] Nutritional goal recommendations
- [ ] Export data (CSV, PDF)


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [USDA FoodData Central](https://fdc.nal.usda.gov/) for nutrition data
- [Firebase](https://firebase.google.com/) for authentication
- [Vite](https://vitejs.dev/) for blazing fast dev experience
- [React](https://react.dev/) for the UI framework
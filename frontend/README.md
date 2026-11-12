# CodeVerse Frontend

A comprehensive Next.js frontend for the CodeVerse multi-tenant coding education platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository and navigate to the frontend directory:**

```bash
cd codeverse-frontend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Create environment file:**

```bash
cp .env.example .env.local
```

4. **Update `.env.local` with your backend URL:**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. **Start the development server:**

```bash
npm run dev
```

6. **Open your browser and navigate to:**

```
http://localhost:3000
```

## 📁 Project Structure

```
codeverse-frontend/
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (institution)/            # Institution admin & student routes
│   │   ├── dashboard/
│   │   ├── courses/
│   │   ├── problems/
│   │   ├── assignments/
│   │   ├── analytics/
│   │   └── students/
│   ├── (super-admin)/            # Super admin routes
│   │   ├── dashboard/
│   │   ├── institutions/
│   │   └── users/
│   ├── (public)/                 # Public routes
│   │   ├── problems/
│   │   └── blog/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── Providers.tsx             # React Query & other providers
│   └── globals.css               # Global styles
├── components/                   # Reusable React components
│   ├── layout/                   # Layout components
│   ├── editor/                   # Code editor components
│   ├── problems/                 # Problem-related components
│   ├── analytics/                # Analytics components
│   ├── common/                   # Common components
│   └── ui/                       # UI components (shadcn/ui)
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication hooks
│   ├── useSubmission.ts          # Submission hooks with polling
│   ├── useCourse.ts              # Course management hooks
│   ├── useProblem.ts             # Problem management hooks
│   └── useAnalytics.ts           # Analytics hooks
├── lib/                          # Utility libraries
│   ├── api.ts                    # Axios API client
│   ├── queryClient.ts            # React Query setup
│   ├── utils.ts                  # Helper functions
│   └── constants.ts              # Application constants
├── store/                        # Zustand state management
│   ├── authStore.ts              # User authentication state
│   └── editorStore.ts            # Code editor state
├── types/                        # TypeScript type definitions
│   └── index.ts                  # All shared types
├── styles/                       # Additional stylesheets
│   └── variables.css             # CSS variables
├── public/                       # Static assets
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
├── next.config.js                # Next.js configuration
└── README.md                     # This file
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev                # Start dev server (http://localhost:3000)

# Production
npm run build              # Build for production
npm run start              # Start production server

# Quality
npm run lint              # Run ESLint
npm run type-check        # Run TypeScript type checking
npm run format            # Format code with Prettier
```

## 🔑 Key Features

### Authentication
- Login / Register flows
- JWT token management with auto-refresh
- Role-based access control (Super Admin, Admin, Student)
- Session persistence

### Code Editor
- Monaco Editor integration
- Multiple language support (Python, C++, Java, JavaScript, C)
- Theme switching (light/dark)
- Auto-save functionality
- Code history per problem per language

### Submissions & Judging
- Real-time code submission
- Judge0 integration for code execution
- Polling for submission results
- Test case results display
- Submission history

### Analytics
- Leaderboards
- Submission heatmaps
- Course completion tracking
- Student progress monitoring
- Problem statistics

### Content Management
- Courses, modules, and chapters
- Problems with test cases
- Assignments with deadlines
- Quizzes with MCQ
- Blog posts

## 🔌 API Integration

All API calls are centralized in `lib/api.ts`:

```typescript
// Example: Login
const { data } = await authApi.login(email, password);

// Example: Submit code
const { data } = await submissionApi.submit({
  problemId,
  languageId,
  sourceCode,
});

// Example: Fetch leaderboard
const { data } = await analyticsApi.leaderboard();
```

## 📊 State Management

### Zustand Stores

**Auth Store** (`store/authStore.ts`):
- Manages user authentication state
- Provides role-based access helpers
- Persists to sessionStorage

**Editor Store** (`store/editorStore.ts`):
- Manages code editor state
- Tracks code per problem/language
- Persists to localStorage

### React Query

All server state is managed via React Query with custom hooks:

```typescript
// Fetch courses
const { data: courses } = useCourses();

// Submit code
const { submit, isSubmitting } = useSubmit(problemId);

// Fetch leaderboard
const { data: leaderboard } = useLeaderboard();
```

## 🎨 Styling

- **Framework**: Tailwind CSS
- **Component System**: shadcn/ui
- **Icons**: Lucide React
- **CSS Variables**: Dark mode support

## 🔐 Security

- JWT tokens stored in memory (no localStorage)
- Refresh token in HTTP-only cookie
- CORS configuration
- CSP headers
- No credential exposure

## 📱 Responsive Design

- Mobile-first approach
- Tablet optimized
- Desktop enhanced
- Touch-friendly interface

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t codeverse-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://api:5000/api/v1 codeverse-frontend
```

## 🧪 Testing

```bash
# Unit tests (to be configured)
npm run test

# E2E tests (to be configured)
npm run test:e2e
```

## 📚 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

## 📝 License

This project is proprietary and confidential.

## 📧 Support

For issues or questions, contact the CodeVerse team at support@codeverse.io

## 🗺️ Roadmap

- [ ] Offline mode
- [ ] Mobile app (React Native)
- [ ] Video tutorials
- [ ] Live coding sessions
- [ ] AI-powered hints
- [ ] Advanced analytics
- [ ] Collaborative coding

## 🎯 Environment Variables

All environment variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Frontend URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `CodeVerse` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics | `true` |
| `NEXT_PUBLIC_ENABLE_BLOG` | Enable blog | `true` |

---

**Made with ❤️ by the CodeVerse Team**

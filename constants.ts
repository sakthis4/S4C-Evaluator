import { Question } from './types';

export const EXAM_CONTEXT = `
Context: Pathfinder is a production tracking and reporting application used by a publishing services company.
It tracks end-to-end production for books and journals, including:
- Projects / titles (e.g., books, issues)
- Jobs and chapters with planned vs actual dates
- Work allocation to teams (composition, copyediting, XML, design, QA, etc.)
- Status, turnaround time (TAT), and SLA compliance
- Dashboards and reports for project managers, clients, and leadership

The legacy Pathfinder is a server-rendered app (e.g., Java/GlassFish with jQuery-based UI) that is being modernized into a React-based SPA (Single Page Application) talking to APIs/microservices.
`;

export const QUESTIONS: Question[] = [
  // SECTION A
  {
    id: 'q1a',
    section: 'Section A – Core React & JavaScript',
    title: '1(a). State, Props, and Context',
    text: 'Explain the difference between state, props, and context in React.',
    idealAnswerKey: 'State is internal component data (mutable). Props are arguments passed to components (read-only). Context is for global data sharing to avoid prop drilling.',
    codeType: 'text'
  },
  {
    id: 'q1b',
    section: 'Section A – Core React & JavaScript',
    title: '1(b). Virtual DOM',
    text: 'What is the virtual DOM, and how does React use it for performance improvement?',
    idealAnswerKey: 'Virtual DOM is a lightweight copy of the actual DOM. React uses it to diff changes (Reconciliation) and only update modified elements in the real DOM, reducing expensive reflows.',
    codeType: 'text'
  },
  {
    id: 'q1c',
    section: 'Section A – Core React & JavaScript',
    title: '1(c). Controlled vs Uncontrolled',
    text: 'What are controlled and uncontrolled components in React?',
    idealAnswerKey: 'Controlled: Data is handled by React state (value + onChange). Uncontrolled: Data is handled by the DOM (useRef).',
    codeType: 'text'
  },
  {
    id: 'q2',
    section: 'Section A – Core React & JavaScript',
    title: '2. React.js Coding – UserSearch',
    text: 'Write a React functional component called UserSearch which:\n- Fetches user data from https://jsonplaceholder.typicode.com/users\n- Has a search input box\n- Filters and displays users based on name\n- Uses useState and useEffect',
    idealAnswerKey: 'Component should have state for users, search term. useEffect to fetch data on mount. Filter logic in render or separate variable. Input with onChange.',
    codeType: 'javascript'
  },
  {
    id: 'q3a',
    section: 'Section A – Core React & JavaScript',
    title: '3(a). Promises and Async/Await',
    text: 'Explain promises and async/await with an example.',
    idealAnswerKey: 'Promise represents a future value (pending, resolved, rejected). Async/await is syntax sugar for promises to write asynchronous code that looks synchronous.',
    codeType: 'text'
  },
  {
    id: 'q3b',
    section: 'Section A – Core React & JavaScript',
    title: '3(b). Callback to Promise',
    text: 'Convert the following callback function into a promise-based function:\ngetData(function(result) { console.log(result); });',
    idealAnswerKey: 'function getDataPromise() { return new Promise(resolve => getData(resolve)); }',
    codeType: 'javascript'
  },
  {
    id: 'q3c',
    section: 'Section A – Core React & JavaScript',
    title: '3(c). Event Bubbling',
    text: 'What is event bubbling, and how do you stop it in a React application?',
    idealAnswerKey: 'Event propagates from the target element up the DOM tree. Stop it using e.stopPropagation().',
    codeType: 'text'
  },

  // SECTION B
  {
    id: 'q4a',
    section: 'Section B – Advanced React & State Management',
    title: '4(a). Lifecycle with Hooks',
    text: 'Describe the lifecycle of a functional React component using hooks. How would you simulate componentDidMount, componentDidUpdate, and componentWillUnmount with useEffect? Use an example related to loading Pathfinder project data on page load and cleaning up subscriptions when leaving the screen.',
    idealAnswerKey: 'Mount: useEffect(..., []). Update: useEffect(..., [dependency]). Unmount: Return cleanup function from useEffect. Example: Fetch project data on mount, abort request on unmount.',
    codeType: 'text'
  },
  {
    id: 'q4b',
    section: 'Section B – Advanced React & State Management',
    title: '4(b). Memoization in Job Board',
    text: 'Pathfinder’s “Job Board” screen shows hundreds of jobs with filters and inline editing. When would you use useMemo and useCallback on this screen? Give a concrete example (e.g., expensive filtering, sorting, or callback props passed to many row components).',
    idealAnswerKey: 'useMemo: For expensive filtered/sorted lists of jobs. useCallback: For event handlers (e.g., handleStatusChange) passed to list items to prevent unnecessary child re-renders.',
    codeType: 'text'
  },
  {
    id: 'q4c',
    section: 'Section B – Advanced React & State Management',
    title: '4(c). Global State Strategy',
    text: 'Explain how you would structure global state in a medium-size React SPA like Pathfinder. When would you choose Context API vs a library like Redux or Zustand? Mention at least three global concerns (e.g., logged-in user, selected project, feature flags, permissions).',
    idealAnswerKey: 'Context: Low-frequency updates (Auth, Theme). Redux/Zustand: High-frequency complex state (Job Data, Filters). Concerns: User Auth, Selected Project, Feature Flags.',
    codeType: 'text'
  },
  {
    id: 'q5',
    section: 'Section B – Advanced React & State Management',
    title: '5. Production Tracking State Design',
    text: 'Pathfinder tracks: Projects, Jobs, Status/Dates, and Summary Metrics. Design a React state structure to store this. Explain how you would update state when: A single job’s status is changed; The summary metrics need to be recalculated.',
    idealAnswerKey: 'Normalized State: { projects: { byId: {} }, jobs: { byId: {} } }. Updates: Immutable update of specific job. Metrics: Derived state (calculated on the fly) or selector-based.',
    codeType: 'javascript'
  },

  // SECTION C
  {
    id: 'q6',
    section: 'Section C – Frontend Architecture',
    title: '6. Modernizing Legacy App',
    text: 'The existing Pathfinder application is a legacy server-rendered app. Describe how you would gradually modernize it into a React SPA using an incremental/"strangler" pattern. Cover: Embedding React, Sharing Auth, Migrating one screen at a time, Minimizing downtime.',
    idealAnswerKey: 'Strangler Fig Pattern. Serve React on specific routes (e.g. /new/dashboard). Share cookies for auth. Load balancer routes traffic. Migrate high-value screens first.',
    codeType: 'text'
  },
  {
    id: 'q7',
    section: 'Section C – Frontend Architecture',
    title: '7. Routes & Layout',
    text: 'Design the React routing and layout structure for Pathfinder with screens: Login, Project List, Job Board, Dashboard, Admin. Describe main routes, shared layout components, and protected routes.',
    idealAnswerKey: 'Routes: /login, /dashboard, /projects, /projects/:id/jobs, /admin. Layout: Sidebar + Header + Outlet. ProtectedRoute component for Auth/Role checks.',
    codeType: 'text'
  },
  {
    id: 'q8',
    section: 'Section C – Frontend Architecture',
    title: '8. Microservices Integration',
    text: 'Pathfinder is moving to microservices. Explain how your React app will: Handle auth/tokens securely (HttpOnly cookies), Centralise API calls (Axios/Interceptors), Deal with errors, and Handle expired sessions.',
    idealAnswerKey: 'HttpOnly Cookies for security (vs LocalStorage). Centralized Axios instance with Response Interceptor for 401 handling (refresh token or redirect). Global Error Boundary.',
    codeType: 'text'
  },

  // SECTION D
  {
    id: 'q9',
    section: 'Section D – UX, Performance & Testing',
    title: '9. UX & Accessibility',
    text: 'Pathfinder users spend hours in the app. List concrete steps to make screens: Keyboard-friendly, Accessible (ARIA), and Clear in conveying status/errors.',
    idealAnswerKey: 'Keyboard: Tabindex, logical focus order. Accessibility: ARIA labels for icons, live regions for status updates. UX: Loading skeletons, clear validation messages.',
    codeType: 'text'
  },
  {
    id: 'q10',
    section: 'Section D – UX, Performance & Testing',
    title: '10. Performance Optimization',
    text: 'Describe performance techniques for the Production Dashboard and Job Board (hundreds of jobs). Cover: Virtualization, Code-splitting, Memoization.',
    idealAnswerKey: 'Virtualization (react-window) for large tables. Code splitting (React.lazy) for route bundles. Memoization (React.memo) for table rows.',
    codeType: 'text'
  },
  {
    id: 'q11',
    section: 'Section D – UX, Performance & Testing',
    title: '11. Testing Strategy',
    text: 'Describe how you would test key Pathfinder flows using Jest and React Testing Library (Login, Job Update, Dashboard Metrics). Write one example test case.',
    idealAnswerKey: 'Integration tests favored over unit tests. Mock API using MSW. Test: render(<JobBoard />), fireEvent.click(statusBtn), await waitFor(() => expect(successMsg).toBeVisible()).',
    codeType: 'javascript'
  },

  // SECTION E
  {
    id: 'q12',
    section: 'Section E – Collaboration & Delivery',
    title: '12. Agile Collaboration',
    text: 'Pathfinder modernization is delivered in sprints. Explain how you would: Break down features, Coordinate API contracts, Use feature flags, Handle feedback.',
    idealAnswerKey: 'Breakdown: Component hierarchy. Contracts: Swagger/OpenAPI first. Rollout: Feature Flags (LaunchDarkly) for A/B testing or gradual release.',
    codeType: 'text'
  }
];
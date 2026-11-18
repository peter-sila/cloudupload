# Frontend - React + Vite + Tailwind CSS

## Overview

React-based frontend application using Vite as the build tool and Tailwind CSS for styling. The application provides a clean, modern interface for file uploads with real-time progress tracking.

## Setup Instructions

### 1. Prerequisites

- **Node.js**: 16.x or higher
- **npm**: 8.x or higher

Check versions:
```bash
node --version
npm --version
```

### 2. Install Dependencies

From the `frontend` directory:

```bash
npm install
```

This installs:
- React and React DOM
- Axios (HTTP client)
- Tailwind CSS and related tools
- Vite and plugins
- ESLint and dev tools

### 3. Environment Configuration

Create `.env` file from template:

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Edit `.env`:
```
VITE_API_BASE_URL=http://localhost:8000
```

For production, update to your API endpoint URL.

### 4. Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at: `http://localhost:5173`

Features:
- Hot Module Replacement (HMR) - changes reload instantly
- Fast refresh for React components
- Vite development console with helpful commands

### 5. Build for Production

Create optimized production build:

```bash
npm run build
```

Output: `dist/` folder ready for deployment

Preview production build locally:

```bash
npm run preview
```

### 6. Linting

Check code quality:

```bash
npm run lint
```

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx              # Main upload form component
│   ├── App.css              # App-specific styles
│   ├── main.jsx             # React entry point
│   ├── index.css            # Global Tailwind directives
│   └── assets/              # Static images
│
├── public/                  # Static assets (favicon, etc.)
├── index.html               # HTML template
├── package.json             # Dependencies and scripts 
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS plugins
├── eslint.config.js         # ESLint rules
├── .env.example             # Environment template
└── .gitignore               # Git ignore patterns
```

## Key Features

### Form Component (App.jsx)

- **Name Input**: Text field with validation
- **File Upload**: Drag-and-drop or click to select
- **File Validation**: Type and size checking before upload
- **Progress Indicator**: Real-time upload percentage
- **Success Message**: Displays submission ID
- **Error Messages**: Clear, user-friendly error display
- **Responsive Design**: Works on mobile and desktop

### Styling (Tailwind CSS)

- Modern gradient background
- Clean card-based layout
- Smooth transitions and hover effects
- Color-coded messages (green success, red error)
- Accessibility-focused design
- Mobile-responsive with proper spacing

### API Integration (Axios)

- POST requests to `/api/submit` endpoint
- Multipart form data handling
- Upload progress tracking
- Error handling with user feedback
- Automatic CORS support

## Component Behavior

### File Selection

1. User clicks file input or drags file over area
2. File type and size validated
3. If valid: filename displayed, ready to submit
4. If invalid: error message shown, file rejected

### Form Submission

1. User enters name and selects file
2. Submit button becomes enabled
3. On click, form data sent to backend
4. Upload progress tracked in real-time
5. Success/error message displayed
6. On success: form reset for new submission

### Error Handling

- Name field empty: "Please enter your name"
- File field empty: "Please select a file"
- Invalid file type: "Invalid file type..."
- File too large: "File size exceeds 10MB limit"
- Upload failed: Backend error message displayed

## Tailwind Configuration

### Configured Plugins

- `@tailwindcss/forms`: Styled form elements

### Configured Utilities

- Full range of Tailwind utilities
- Custom theme colors if needed
- Responsive classes (sm:, md:, lg:, xl:)
- Dark mode support (optional)

### File Structure

- `tailwind.config.js`: Main configuration
- `postcss.config.js`: PostCSS plugins
- `src/index.css`: Tailwind directives (@tailwind)

## NPM Scripts

| Script | Purpose |
|--------|----------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Check code quality |

## Axios Configuration

### Base URL

Uses environment variable `VITE_API_BASE_URL`:
- Development: `http://localhost:8000`
- Production: Your API endpoint

### Request Headers

Automatically set:
- `Content-Type: multipart/form-data` (for file uploads)

### Error Handling

- Network errors: "An error occurred during upload"
- API errors: Display backend error message
- Validation errors: Show appropriate message

## Performance Optimization

- Code splitting with Vite
- Dynamic imports for code splitting
- CSS minification in production
- Asset optimization
- Tree-shaking unused code

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Modern browsers with ES2020 support

## Development Tips

1. **Hot Reload**: Changes reflect instantly during dev
2. **Browser DevTools**: React DevTools extension recommended
3. **Console Errors**: Check browser console for detailed errors
4. **Network Tab**: Monitor API requests in Network tab
5. **Form Testing**: Use browser DevTools to inspect form data

## Troubleshooting

### Port 5173 Already in Use

```bash
# Kill process on port 5173 or use different port:
npm run dev -- --port 3000
```

### Tailwind Styles Not Working

```bash
# Rebuild CSS:
npm run dev
# Clear browser cache: Ctrl+Shift+Delete or Cmd+Shift+Delete
```

### API Connection Error

- Verify backend is running on `http://localhost:8000`
- Check `VITE_API_BASE_URL` in `.env`
- Check browser console for CORS errors

### Node Modules Issues

```bash
# Clean install:
rm -rf node_modules package-lock.json
npm install
```

## Dependencies Explanation

| Package | Purpose |
|---------|----------|
| react | UI library |
| react-dom | React rendering engine |
| axios | HTTP client for API calls |
| tailwindcss | CSS utility framework |
| vite | Fast build tool |
| @tailwindcss/forms | Form element styling |
| postcss | CSS transformation tool |
| autoprefixer | Browser vendor prefixes |
| eslint | Code quality checking |

## Production Deployment

### Build Artifacts

```bash
npm run build
```

Creates `dist/` folder with:
- `index.html` - Entry point
- `assets/` - JavaScript and CSS bundles
- Static assets

### Deployment Options

1. **Static Hosting** (Vercel, Netlify, GitHub Pages)
   - Upload `dist/` folder
   - Set environment variables in hosting platform

2. **Docker Container**
   - Build: `npm run build`
   - Serve with nginx

3. **Node.js Server**
   - Serve `dist/` folder with Express
   - Configure API proxy

### Environment Variables in Production

Create `.env.production.local`:
```
VITE_API_BASE_URL=https://api.yourdomain.com
```

Build will use production environment variables.

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Axios Documentation](https://axios-http.com/)
- [ESLint Configuration](https://eslint.org/docs/rules/)

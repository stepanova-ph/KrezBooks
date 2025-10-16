# KrezBooks - Electron Edition

Retail shop accounting and inventory management desktop application.

## Project Structure

```
krezbooks/
├── src/
│   ├── main/              # Electron main process (Node.js)
│   │   └── main.ts        # Creates windows, handles OS operations
│   └── renderer/          # React app (runs in browser window)
│       ├── main.tsx       # React entry point
│       ├── App.tsx        # Main React component
│       └── index.css      # Global styles
├── index.html             # HTML template
├── vite.config.ts         # Vite config for renderer
├── vite.main.config.ts    # Vite config for main process
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## How It Works

### Electron Architecture

Electron apps have two processes:

1. **Main Process** (`src/main/main.ts`)
   - Runs in Node.js
   - Creates and manages windows
   - Has access to OS APIs (filesystem, etc.)
   - One main process per app

2. **Renderer Process** (`src/renderer/`)
   - Your React app
   - Runs in Chromium (like a webpage)
   - One renderer per window
   - Sandboxed for security

### Development Flow

1. **Vite starts** → Serves React app on http://localhost:5173
2. **Electron starts** → Opens window and loads from Vite server
3. **Hot reload** → Changes to React code update instantly
4. **DevTools open** → Chrome DevTools for debugging

### Build Flow

1. **Vite builds renderer** → Bundles React app to `dist/renderer/`
2. **Vite builds main** → Compiles Electron main to `dist/main/`
3. **Electron Builder** → Packages everything into installer

## Available Scripts

### Development
```bash
npm run dev
```
Starts both Vite dev server and Electron in development mode.

### Building
```bash
# Build for your current platform
npm run package

# Build for specific platforms
npm run package:win      # Windows installer
npm run package:mac      # macOS .dmg
npm run package:linux    # Linux .AppImage and .deb
```

Output goes to `release/` folder.

### Other Commands
```bash
npm run build            # Build renderer + main (no packaging)
npm run dev:vite         # Only start Vite server
npm run dev:electron     # Only start Electron (needs Vite running)
```

## Tech Stack

- **Electron** - Desktop app framework
- **Vite** - Fast build tool and dev server
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Material-UI** - React component library (ready to use)

## Next Steps

Now that the foundation is ready, you can:

1. Add more React components in `src/renderer/`
2. Add database integration (SQLite via `better-sqlite3`)
3. Build features (contacts, items, documents)
4. Add IPC for main ↔ renderer communication
5. Integrate MUI components for better UI

## Development Tips

### Hot Reload
Changes to `src/renderer/` files reload instantly. Changes to `src/main/main.ts` require restarting Electron (Ctrl+C and `npm run dev` again).

### DevTools
Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac) to open Chrome DevTools.

### Debugging
- **Renderer**: Use Chrome DevTools (opens automatically in dev mode)
- **Main process**: Add `console.log()` statements (shows in terminal)

## Configuration Files Explained

### vite.config.ts
Configures how React code is built. Sets output directory, dev server port, and path aliases.

### vite.main.config.ts
Configures how Electron main process is built. Marks Electron and Node.js modules as external.

### tsconfig.json
TypeScript settings. Enables strict type checking and modern JavaScript features.

### package.json
- `main` field points to built Electron file
- `scripts` define commands you can run
- `build` section configures electron-builder

## Troubleshooting

### "Port 5173 already in use"
Another process is using the port. Kill it or change the port in `vite.config.ts`.

### "Electron window won't open"
Check terminal for errors. Make sure Vite server started successfully first.

### Changes not reflecting
- Renderer code: Should hot reload
- Main process code: Restart `npm run dev`

---

Happy building! 🚀

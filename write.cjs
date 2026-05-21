const fs = require("fs"); fs.writeFileSync("src/index.css", `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --base: #F7F7F8;
    --panel: #FFFFFF;
    --panel-soft: #FAFAFB;
    --text: #111827;
    --muted: #6B7280;
    --accent: #000000;
    --accent-soft: #E5E7EB;
    --border: #E5E7EB;
    --success: #10B981;
    --warning: #EF4444;
    color-scheme: light;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 14px;
    background: var(--base);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3 {
    font-weight: 600;
    letter-spacing: -0.02em;
  }
}

@layer components {
  .app-shell {
    min-height: 100vh;
    padding: 6rem 1.5rem 4rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .panel {
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--panel);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  .soft-panel {
    border-radius: 8px;
    background: var(--panel-soft);
    border: 1px solid var(--border);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border-radius: 6px;
    border: 1px solid var(--border);
    padding: 0.5rem 0.75rem;
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    background: var(--panel);
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .btn:hover {
    background: var(--panel-soft);
  }

  .btn-primary {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }

  .btn-primary:hover {
    opacity: 0.9;
    background: var(--accent);
  }

  .btn-soft {
    background: var(--accent-soft);
    border-color: transparent;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    border-radius: 6px;
    padding: 0.2rem 0.5rem;
    font-size: 12px;
    font-weight: 500;
    background: var(--accent-soft);
    color: var(--text);
  }

  .input {
    width: 100%;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--panel);
    padding: 0.5rem 0.75rem;
    font-size: 14px;
    color: var(--text);
    outline: none;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) inset;
  }

  .input:focus {
    border-color: var(--muted);
  }

  .stat-card {
    padding: 1.5rem;
  }

  .stat-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }
}
`);

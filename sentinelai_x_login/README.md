# SentinelAI-X — Login Page (Standalone Package)

Complete, self-contained recreation of the SentinelAI-X login page.
Open `index.html` in any browser — no build step, no dependencies.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page markup: left branding block + right glass login card |
| `styles.css` | All styling: layout grid, colors, glass card, circuit background, responsive rules |
| `script.js` | Password show/hide toggle, form validation, loading state, auth hook point |
| `assets/sentinel-logo.png` | Logo artwork (feathered edges, blends into light background) |
| `assets/lab-network.png` | 3D lab-network illustration (LAB 01–04 nodes + central server) |
| `reference.png` | Original design mockup this page recreates |

## Design specification

- **Layout:** two-column grid — branding `1fr` left, login panel right (~38%, full height, large rounded corners). Stacks vertically on mobile (< 900px).
- **Background:** very light cool white with a subtle circuit-trace pattern.
- **Card:** near-white frosted panel, soft layered shadow, thin gradient divider under the header.
- **Typography:** Inter (Google Fonts). Header label "SECURE ACCESS" in small caps, "Sign In" as the large heading.
- **Branding copy:** tagline "The Intelligence Behind Laboratory Security." and slogan DETECT. / ANALYZE. / PROTECT. in blue → violet → pink.
- **Fields:** email + password, 64px pill shape, inline icons, eye toggle on password, focus ring.
- **Button:** full-width gradient "Login" button.

## Wiring real authentication

In `script.js`, find the `submit` handler and replace the marked demo block
with a `fetch()` POST to your auth endpoint:

```js
const res = await fetch("/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
```

On success, redirect (e.g. `window.location.href = "/dashboard"`).
A "Forgot Password?" link is present in the markup — point it at your reset flow.

# SentinelAI-X Login Page Protection & Lock Guidelines

## Core Lockdown Policy
The SentinelAI-X login portal (`login.html`) has been strictly finalized and locked in terms of:
1. **Layout & Card Structure**:
   - Master card split-screen grid (`1.35fr 1fr`).
   - Left brand HD illustration with 1.2px ultra-thin multi-vibrant blue border.
   - Right sign-in card with multi-vibrant blue, violet, and pink flowing border.
   - Stationary presentation (no 3D card tilt/perspective wobble).
2. **Password Recovery Modal**:
   - 4-Step OTP & Credential Reset dialog.
   - Wrapped in thick (3.5px) multi-vibrant glowing gradient border (`.modal-glow-frame`).
   - Multi-color accent lines under section eyebrows.
3. **Background Theme Isolation**:
   - Future theme adjustments MUST strictly modify the background canvas rendering engine (`#multicolorBgCanvas` / `initSentinelThemeEngine`) or `themes-preview.html`.
   - Never alter the card CSS, input IDs, Firebase audit loggers, or RBAC account configurations.

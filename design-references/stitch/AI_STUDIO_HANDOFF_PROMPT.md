# Prompt to paste into existing Google AI Studio app

I have added the complete Google Stitch reference designs to my **existing** Zaid Trading Wholesale ERP repository at `design-references/stitch/`. There are 38 screens, listed in `design-references/stitch/SCREEN_INDEX.md`, with an HTML layout and PNG screenshot for each. The full design specification is at `design-references/stitch/DESIGN.md`.

**Do not create a new app. Do not overwrite my existing React source code, Dashboard, financial overview, Supabase env-variable setup, GitHub integration, authentication, or other working features.**

FIRST TASK ONLY — Design handoff review and Dashboard comparison:
1. Verify you can read `design-references/stitch/SCREEN_INDEX.md`, `DESIGN.md`, and the Dashboard's `code.html` and `screen.png`. If any files are missing, stop and tell me exactly what is missing.
2. Inspect the existing React application and identify its design-system components, routes and Supabase integration.
3. Compare the current Dashboard with the Stitch Dashboard. Preserve my existing Financial Overview (including profit, expenses, bank, cash, payables) and existing working features even if the static screenshot does not show them.
4. Prepare a short component and route mapping for the 38 Stitch screens. Do not implement all 38 yet.
5. Adjust only shared styles and the Dashboard for closer visual fidelity, if needed. Use Inter, clear light-mode layouts, consistent tables and buttons; don't blindly replace the existing theme from contradictory design token declarations.
6. Keep data connected to existing Supabase services when available. Do not populate the database with fake data, and do not display fabricated profit or balances.
7. Do not perform SQL migrations. Flag any RLS, self-service role-escalation, inventory quantity or accounting concerns for separate review.
8. Explain which files were changed and verify the app still builds.

After I review the first screen, we will implement Products Management, Add/Edit Product, Inventory, then other pages in small increments using the matching Stitch references.

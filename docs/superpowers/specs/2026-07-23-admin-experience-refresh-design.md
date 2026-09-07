# Admin Experience Refresh Design

## Goal

Refresh the management backend as a coherent workspace: cleaner logout flow, grouped navigation, better menu content display, a registration page that matches the login page, and more reliable auth routing.

## Scope

- Redesign the admin shell around grouped navigation, a compact workspace header, and clearer account actions.
- Replace the custom register page with the same Ant Design based system used by login.
- Improve auth behavior so guarded routes initialize an existing session before redirecting.
- Keep existing backend endpoints and business pages intact.

## Admin Shell

The side navigation becomes a grouped workspace menu. Each menu item has a label, description, icon, and optional group. The expanded sidebar shows labels and descriptions; the collapsed sidebar keeps stable icon buttons with titles. The header keeps breadcrumbs, blog access, and account actions, but the logout item gets a calmer danger treatment and a confirm modal with clear primary/cancel actions.

## Register Page

Register uses the same two-column auth layout language as login: brand panel on the left, focused form card on the right. Validation is handled by Ant Design form rules and a small pure validation helper for password confirmation. Password visibility uses component state, not DOM mutation. Registration errors are shown inline instead of only relying on global toast messages.

## Auth Logic

The router initializes the user session before making auth decisions for admin routes and auth pages. This prevents a refresh with a valid token from briefly redirecting to login. Register keeps backend errors visible, clears invalid partial sessions, and routes to the dashboard only after user info is loaded.

## Testing

Add focused tests for grouped admin menu structure, register validation helpers, and user store register error propagation. Existing auth token tests remain unchanged.

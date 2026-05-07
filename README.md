# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Beyond5 Local Setup

Install dependencies:

```bash
yarn install
```

Run the frontend and backend together:

```bash
yarn dev
```

Or run them separately:

```bash
yarn client
yarn server
```

The frontend uses:

```bash
VITE_API_URL=http://127.0.0.1:5000/api
```

Using `127.0.0.1` avoids macOS routing `localhost:5000` to the AirTunes service on IPv6.

## MongoDB Setup

For real persistent users, bookings, practitioner profiles, and admin verification, connect MongoDB in `server/.env`:

```bash
PORT=5000
HOST=127.0.0.1
MONGO_URI=mongodb://127.0.0.1:27017/beyond5
JWT_SECRET=replace_this_with_a_long_secret
CLIENT_URL=http://localhost:5174,http://127.0.0.1:5174
```

### Option 1: Local MongoDB

Install and start MongoDB Community Edition, then use:

```bash
MONGO_URI=mongodb://127.0.0.1:27017/beyond5
```

After MongoDB is running, restart the backend:

```bash
yarn server
```

### Option 2: MongoDB Atlas

Create an Atlas cluster, add your database user, allow your IP address, then use the Atlas connection string:

```bash
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/beyond5
```

Restart the backend after changing `server/.env`.

Create or update an admin login:

```bash
ADMIN_EMAIL=admin@beyond5.com.au ADMIN_PASSWORD=AdminPassword123! yarn --cwd server seed:admin
```

If MongoDB is not connected, the backend falls back to `server/data/dev-users.json` for local development. That file is ignored by git and is only for testing.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

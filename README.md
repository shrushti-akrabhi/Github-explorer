# GitHub Explorer

Sign in with your GitHub account, then explore repositories, trending projects, developers, topics and collections, and save the repositories you like. React front end, Node.js (Express) back end, MongoDB database.

## Set up

1. **Create a GitHub OAuth App** at https://github.com/settings/developers (New OAuth App):
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:5173/auth/github/callback`
   - Copy the Client ID and generate a Client Secret.
2. **Get a MongoDB database.** Either install MongoDB locally (`mongodb://127.0.0.1:27017/github-explorer`) or create a free cluster on MongoDB Atlas and copy its connection string.
3. `cp server/.env.example server/.env` and fill in `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `MONGODB_URI` and a long random `SESSION_SECRET` (generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Never commit this file.
4. Install and run (Node.js 18 or newer):

```bash
npm run install:all
npm run dev        # server on :4000, app on http://localhost:5173
```

## How it works

```
Browser (React) --/api, /auth--> Vite proxy --> Node/Express --> api.github.com
                                                    |
                                                    +--> MongoDB (users, sessions, saved repos)
```

- **Sign in:** `/auth/github` sends you to GitHub; `/auth/github/callback` checks the `state` value, swaps the code for an access token using the client secret, saves or updates the user in MongoDB (recording `lastLoginAt`), and starts a server-side session. The browser only gets an httpOnly cookie.
- **Database:** three collections. `users` (one per GitHub account: `githubId`, `login`, `name`, `avatarUrl`, `htmlUrl`, `createdAt`, `lastLoginAt`), `sessions` (managed by `connect-mongo`, expire after 7 days) and `savedrepos` (one per user and repository). The GitHub token in the session is encrypted with a key derived from `SESSION_SECRET`.
- **Data:** every `/api/*` route needs a signed-in session and calls GitHub with that user's token (5,000 requests per hour).
- **Why a backend:** the OAuth client secret can't live in browser code, and the token stays out of the browser.

## Features

- Explore tabs: **Repositories** (search + language + sort), **Trending**, **Developers** (search + sort), **Topics**, **Collections**
- Pagination on every list
- **Save repository** on every repository row, and a **Saved repositories** page in the account menu (search, language filter, sort, pagination). Saved repositories are stored per user in MongoDB.
- Account menu (top right): your profile and your own repositories, with search, language filter, sort and pagination
- Open any developer's profile from the Developers tab
- Loading skeletons and clear errors (rate limit, bad query, network, expired session)

## Honest notes

- GitHub has no public Trending API. **Trending** shows the most-starred repos created in the chosen period.
- **Developers** uses GitHub user search (most followed by default); there is no official trending-developers feed.
- **Collections** are curated by this app (each is a repository search); GitHub's own collections have no API.
- GitHub serves only the first 1,000 results of any search.
- Sessions are stored in MongoDB, so restarting the server does not sign anyone out. Changing `SESSION_SECRET` invalidates existing sessions.
- For production, serve over HTTPS and set the session cookie to `secure`.

## Structure

```
server/index.js          OAuth, sessions, GitHub proxy routes, saved-repository routes
server/db.js             MongoDB connection and the User and SavedRepo models
client/src/
  api.js, hooks/useApi.js    fetch helpers and the data hook
  auth/AuthContext.jsx       who is signed in
  saved/SavedContext.jsx     the user's saved repositories (Save / Saved state)
  Explorer.jsx               Explore page or a profile
  components/                Login, Header, Discover, ProfileView, SavedView, RepoList, RepoRow, Pager, ...
```

## API: saved repositories

| Route | What it does |
|---|---|
| `GET /api/saved` | The signed-in user's saved repositories, newest first. |
| `POST /api/saved` | Body `{ "fullName": "owner/repo" }`. Fetches the repository from GitHub and saves it. Saving twice is harmless. |
| `DELETE /api/saved/:repoId` | Removes a saved repository. |

# GitHub Explorer

A React front end for exploring GitHub users and their repositories, built on GitHub's public REST API.

## Run it

```bash
npm install
npm run dev      # open the URL Vite prints
npm run build    # production build in dist/
```

Share a profile with `?user=<name>`, for example `http://localhost:5173/?user=torvalds`.

## Features

- Search any GitHub username (profile card + repositories)
- Search within repositories, filter by language, sort by updated, stars, forks or name
- Pagination (10 per page)
- Loading skeletons, and clear errors for unknown users, rate limits and network failures
- Light and dark theme that follow the system setting
- Cancels outdated requests so a slow response never overwrites a newer search

## API

No key is needed for public data (60 requests per hour).

- `GET /users/{username}`
- `GET /users/{username}/repos?per_page=100&sort=updated`

Optional: create `.env` with `VITE_GITHUB_TOKEN=your_token` to raise the limit to 5,000 per hour.
Vite bakes env values into the browser bundle, so anyone who opens the site can read the token.
Use it for local development only and never commit `.env`.

## Structure

```
src/
  api.js                  fetch helpers and error types
  utils.js                number, date and language-color helpers
  hooks/useGithubUser.js  loads user + repos, handles cancel and status
  components/             Header, ProfileCard, RepoList, States, Icon
  App.jsx                 wires search state to the components
```

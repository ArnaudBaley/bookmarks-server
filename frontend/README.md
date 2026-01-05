# README

## Goal 

- This project is the frontend part of an application named "bookmarks-server".

- The goal of this application is to create a webpage that will store url bookmarks.

- this "bookmarks-server" is an alternative to native browsers bookmarks features or plugins.


## Core Features

- As a user, I must be able to open the home page of my application.

- The homepage displays cards that represent an url.

- Each card contains :
  
  - A generic icon that must be clickable (open the url in a new tab)
  - A name
  - A button to delete the card (just an icon)

- An icon "+" at the top of the page allow to create a new card (display a form)

- Drag and drop: Users can drag a URL from any browser's address bar or a link on a webpage and drop it anywhere on the bookmarks page to automatically create a new bookmark card.



## Theme

- By default the application theme depends of the browser settings

- An icon at the top of the page allows to switch theme


## Tests 

- Golden test using playwright snapshots

- Storybook to have a catalog of components and to manually test them


## Deployment

### Prerequisites

- Docker and Docker Compose installed

### Development Environment

**Quick Start:**
```bash
cd deploy
./deploy-dev.sh
```

The application will be available at `http://localhost:5173`


### Production Environment

The production environment builds the application and serves it with nginx.

```bash
cd deploy
./deploy-prod.sh
```

The application will be available at `http://localhost:8080`


## Environments variables

- `VITE_API_BASE_URL`: Backend API URL 
  - Development default: `http://localhost:3000`
  - Production default (Docker): `http://backend:3000` (uses Docker service name)
  - Production (external): `http://localhost:3001` (if accessing from host)
- `VITE_USE_MOCK_API`: Force mock API mode (default: `false`)
- `FRONTEND_PORT`: Production port mapping (default: `8080`)

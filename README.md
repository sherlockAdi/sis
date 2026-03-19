# Node Auth API (JWT + Auto Swagger)

## Setup (procedure)
1) Create a MySQL database (example: `auth_db`)
2) Run the schema SQL: `sql/auth_schema.sql` (tables + stored procedures)
3) Install deps: `npm i`
4) Create env file: `cp .env.example .env` and fill values
5) Generate Swagger + routes: `npm run generate`
6) Run dev server: `npm run dev`

## DB access rule
- The Node API never queries tables directly. All DB operations are done via stored procedures (`CALL sp_*`).

## First admin (bootstrap)
- Set `ALLOW_BOOTSTRAP=true` in `.env`
- Call `POST /auth/bootstrap` with `{ "username": "admin", "password": "admin123" }`
- Then set `ALLOW_BOOTSTRAP=false` again

## Swagger
- UI: `GET /docs`
- Spec JSON: `GET /swagger.json`

## Auth
- Login: `POST /auth/login` → returns `{ token }`
- Profile: `GET /auth/me` → returns current user + role fields + `menus[]`
- Use token: `Authorization: Bearer <token>`

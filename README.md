# Lovable × Supabase API

A Node.js/Express API that connects Lovable (frontend builder) with Supabase (backend database and auth).

## Features

- ✅ RESTful API for Supabase database operations
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ CORS enabled for Lovable integration
- ✅ Environment-based configuration
- ✅ Health check endpoint
- ✅ Error handling

## Setup

### 1. Clone & Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your values:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3000
```

Get these from your [Supabase Dashboard](https://app.supabase.com):
1. Go to **Settings** → **API**
2. Copy the **Project URL** (SUPABASE_URL)
3. Copy the **anon public** key (SUPABASE_ANON_KEY)

### 3. Start the Server

**Development** (with auto-reload):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

The server runs on `http://localhost:3000`

## API Endpoints

### Health Check
```
GET /health
```
Returns: `{ status: "API is running" }`

### Get All Records
```
GET /api/{table}
```
Example: `GET /api/users`

### Get Single Record
```
GET /api/{table}/{id}
```
Example: `GET /api/users/123`

### Create Record
```
POST /api/{table}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Update Record
```
PUT /api/{table}/{id}
Content-Type: application/json

{
  "name": "Jane Doe"
}
```

### Delete Record
```
DELETE /api/{table}/{id}
```

## Using with Lovable

1. **Deploy this API** (e.g., on Vercel, Railway, or Heroku)
2. **In Lovable**, use the API URL to fetch/update data:

```javascript
// Fetch users from your Supabase table
const response = await fetch('https://your-api.com/api/users');
const users = await response.json();

// Create a new user
await fetch('https://your-api.com/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Alice', email: 'alice@example.com' })
});
```

## Deployment

### Vercel
```bash
npm install -g vercel
vercel
```

### Railway
1. Connect your GitHub repo
2. Add environment variables in Railway dashboard
3. Deploy automatically on push

### Heroku
```bash
heroku create your-app-name
heroku config:set SUPABASE_URL=... SUPABASE_ANON_KEY=...
git push heroku main
```

## Security Tips

- ⚠️ Never commit `.env` to Git (it's in `.gitignore`)
- ⚠️ Use Row Level Security (RLS) in Supabase for data protection
- ⚠️ Validate & sanitize all inputs
- ⚠️ Use `SUPABASE_SERVICE_ROLE_KEY` only on server (never expose to frontend)

## Troubleshooting

**Cannot connect to Supabase?**
- Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
- Ensure your Supabase project is active
- Check Supabase dashboard for any connection errors

**CORS errors?**
- Update `CORS_ORIGIN` in `.env` to match your Lovable domain
- For development: `CORS_ORIGIN=*` (not recommended for production)

**Port already in use?**
- Change `PORT` in `.env` or kill existing process

## Next Steps

- Add authentication (JWT with Supabase Auth)
- Add request validation with Express validators
- Set up Supabase Row Level Security (RLS)
- Deploy to production

## License

MIT
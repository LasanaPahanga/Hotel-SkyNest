# Environment Setup Guide

## Important: Environment Variables

Your `.env` file contains sensitive information and **should NEVER be committed to GitHub**.

### ✅ What's Protected

The `.gitignore` file is configured to ignore:
- `.env` - Your actual environment file
- `.env.local`
- `.env.development`
- `.env.test`
- `.env.production`
- Any file ending with `.env`

### ✅ What's Kept

These files **will be committed** (and should be):
- `.env.example` - Template for other developers
- `.env.docker` - Docker-specific configuration

## Setup Instructions

### For New Developers

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Hotel-SkyNest
   ```

2. **Create your `.env` file**
   ```bash
   # In the backend folder
   cd backend
   cp .env.example .env
   ```

3. **Update the `.env` file with your credentials**
   ```bash
   # Edit .env and update:
   DB_PASSWORD=your_actual_password
   JWT_SECRET=your_secret_key
   ```

4. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

5. **Setup database**
   ```bash
   mysql -u root -p < database/COMPLETE_DATABASE_SETUP.sql
   ```

6. **Start the application**
   ```bash
   # Backend (in backend folder)
   npm start

   # Frontend (in frontend folder)
   npm run dev
   ```

## Environment Variables Reference

### Backend (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password        # ⚠️ CHANGE THIS
DB_NAME=skynest_hotels
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production  # ⚠️ CHANGE THIS
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

## Security Best Practices

### ✅ DO:
- Keep `.env` in `.gitignore`
- Use `.env.example` as a template
- Use strong, unique passwords
- Generate a secure JWT secret
- Update credentials for production

### ❌ DON'T:
- Commit `.env` to GitHub
- Share your `.env` file
- Use default passwords in production
- Hardcode secrets in code
- Use the same secret across environments

## Generating Secure Secrets

### JWT Secret

Generate a strong JWT secret:

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Using OpenSSL:**
```bash
openssl rand -hex 64
```

**Using Online Tool:**
- Visit: https://www.grc.com/passwords.htm
- Copy the "63 random alpha-numeric characters" string

## Verifying .gitignore

To verify your `.env` is not being tracked:

```bash
# Check git status
git status

# If .env appears, remove it from tracking
git rm --cached backend/.env

# Verify it's ignored
git status
```

## Production Deployment

### Environment Variables for Production

1. **Never use development credentials**
2. **Use environment-specific `.env` files**
3. **Set environment variables on your hosting platform:**
   - Heroku: Settings → Config Vars
   - Vercel: Settings → Environment Variables
   - AWS: Systems Manager → Parameter Store
   - DigitalOcean: App Settings → Environment Variables

### Example Production .env

```env
NODE_ENV=production
PORT=5000
DB_HOST=your-production-db-host.com
DB_USER=prod_user
DB_PASSWORD=super_secure_production_password
DB_NAME=skynest_hotels_prod
JWT_SECRET=very_long_random_string_for_production
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-production-domain.com
```

## Troubleshooting

### Issue: .env file was committed

**Solution:**
```bash
# Remove from git tracking
git rm --cached backend/.env

# Commit the removal
git commit -m "Remove .env from tracking"

# Push changes
git push
```

### Issue: Changes to .env not working

**Solution:**
1. Restart your backend server
2. Clear any caches
3. Verify the file is named exactly `.env` (not `.env.txt`)

### Issue: Can't find .env file

**Solution:**
```bash
# Make sure you're in the right directory
cd backend

# Create from example
cp .env.example .env

# Edit with your credentials
nano .env  # or use your preferred editor
```

## Quick Reference

| File | Purpose | Commit to Git? |
|------|---------|----------------|
| `.env` | Your actual credentials | ❌ NO |
| `.env.example` | Template for others | ✅ YES |
| `.env.docker` | Docker configuration | ✅ YES |
| `.gitignore` | Ignore rules | ✅ YES |

## Summary

✅ **`.env` is protected** - It's in `.gitignore`  
✅ **`.env.example` is safe** - It has no real credentials  
✅ **Always verify** - Check `git status` before committing  
✅ **Use strong secrets** - Generate random strings  
✅ **Different environments** - Use different credentials  

---

**Remember: Your `.env` file contains sensitive data. Keep it secret, keep it safe!** 🔒

# ✅ Deployment Setup Complete

I've prepared your project for Google Cloud Run deployment. Here's what has been created:

## Files Created

1. **`backend/Dockerfile`** - Container configuration for the backend
2. **`backend/.dockerignore`** - Excludes unnecessary files from Docker build
3. **`firebase.json`** - Firebase Hosting configuration for the frontend
4. **`deploy-backend.sh`** - Automated deployment script for the backend
5. **`DEPLOYMENT.md`** - Comprehensive deployment guide
6. **`QUICK_DEPLOY.md`** - Quick reference for deployment commands

## Code Changes

1. **`backend/src/index.ts`** - Updated to:
   - Listen on `0.0.0.0` (required for Cloud Run)
   - Use `process.env.PORT` (Cloud Run sets this automatically)

## Next Steps - Follow These in Order

### Step 1: Install Required Tools

```bash
# Install Google Cloud SDK (if not installed)
brew install google-cloud-sdk  # macOS
# OR download from: https://cloud.google.com/sdk/docs/install

# Install Firebase CLI
npm install -g firebase-tools
```

### Step 2: Authenticate

```bash
gcloud auth login
gcloud auth application-default login
firebase login
```

### Step 3: Set Your Project

```bash
export GCP_PROJECT_ID=your-actual-project-id
gcloud config set project $GCP_PROJECT_ID
```

### Step 4: Enable Required APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable firestore.googleapis.com
```

### Step 5: Create Service Account (One-time)

```bash
gcloud iam service-accounts create chatbranch-service \
  --display-name="ChatBranch Service Account"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:chatbranch-service@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:chatbranch-service@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

### Step 6: Deploy Backend

```bash
# Make sure GCP_PROJECT_ID is set
export GCP_PROJECT_ID=your-project-id
export SERVICE_ACCOUNT=chatbranch-service@$GCP_PROJECT_ID.iam.gserviceaccount.com

# Run the deployment script
./deploy-backend.sh
```

**OR manually:**
```bash
cd backend
gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/chatbranch-backend
gcloud run deploy chatbranch-backend \
  --image gcr.io/$GCP_PROJECT_ID/chatbranch-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --service-account chatbranch-service@$GCP_PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars GCP_PROJECT_ID=$GCP_PROJECT_ID,GCP_LOCATION=us-central1,GEMINI_MODEL_NAME=gemini-2.5-flash \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10
```

### Step 7: Get Backend URL

```bash
BACKEND_URL=$(gcloud run services describe chatbranch-backend --region us-central1 --format 'value(status.url)')
echo "Backend URL: $BACKEND_URL"
```

**Save this URL!** You'll need it for the frontend.

### Step 8: Configure Frontend

1. **Get Firebase Configuration:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Click the gear icon → Project Settings
   - Scroll to "Your apps" section
   - If no web app exists, click "Add app" → Web
   - Copy the configuration values

2. **Create `frontend/.env.production`:**
   ```bash
   cd frontend
   cat > .env.production << EOF
   VITE_API_BASE_URL=https://your-backend-url.run.app
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   EOF
   ```
   
   **Replace `https://your-backend-url.run.app` with the actual backend URL from Step 7.**

### Step 9: Initialize Firebase Hosting (One-time)

```bash
# From project root
firebase init hosting
```

When prompted:
- Select "Use an existing project" → choose your project
- Public directory: `frontend/dist`
- Configure as single-page app: **Yes**
- Set up automatic builds: **No**

### Step 10: Build and Deploy Frontend

```bash
cd frontend
npm install  # If not already done
npm run build
cd ..
firebase deploy --only hosting
```

### Step 11: Verify Deployment

1. **Test Backend:**
   ```bash
   curl $BACKEND_URL/health
   ```
   Should return: `{"status":"ok"}`

2. **Visit Frontend:**
   - The Firebase CLI will show the hosting URL after deployment
   - Or check Firebase Console → Hosting

## Troubleshooting

### Backend Issues

**View logs:**
```bash
gcloud run services logs read chatbranch-backend --region us-central1 --limit 50
```

**Common fixes:**
- **403 Forbidden**: Check service account has correct permissions
- **500 Error**: Check logs for specific error messages
- **Timeout**: Increase timeout: `--timeout 600`

### Frontend Issues

**API calls failing:**
- Verify `VITE_API_BASE_URL` in `.env.production` matches backend URL
- Check browser console for CORS errors

**Firebase auth not working:**
- Verify all `VITE_FIREBASE_*` variables are set correctly
- Check Firebase project settings

## Updating Deployments

### Update Backend
```bash
./deploy-backend.sh
```

### Update Frontend
```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

## Documentation

- **`DEPLOYMENT.md`** - Full detailed guide
- **`QUICK_DEPLOY.md`** - Quick reference commands

## Need Help?

Check the logs:
- Backend: `gcloud run services logs read chatbranch-backend --region us-central1`
- Frontend: Firebase Console → Hosting → View logs

Good luck with your deployment! 🚀


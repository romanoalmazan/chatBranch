# Google Cloud Run Deployment Guide

This guide will walk you through deploying ChatBranch to Google Cloud Run (backend) and Firebase Hosting (frontend).

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Cloud SDK (gcloud)** installed
3. **Firebase CLI** installed
4. **Node.js 18+** installed locally
5. **GCP Project** with the following APIs enabled:
   - Cloud Run API
   - Cloud Build API
   - Artifact Registry API
   - Vertex AI API
   - Firestore API

## Step 1: Install Required Tools

### Install Google Cloud SDK

**macOS:**
```bash
brew install google-cloud-sdk
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Windows:**
Download from: https://cloud.google.com/sdk/docs/install

### Install Firebase CLI

```bash
npm install -g firebase-tools
```

## Step 2: Authenticate and Configure

### Authenticate with Google Cloud

```bash
gcloud auth login
gcloud auth application-default login
```

### Set Your Project

```bash
gcloud config set project YOUR_PROJECT_ID
```

Replace `YOUR_PROJECT_ID` with your actual GCP project ID.

### Enable Required APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable firestore.googleapis.com
```

### Authenticate with Firebase

```bash
firebase login
```

### Initialize Firebase (if not already done)

```bash
firebase init hosting
```

When prompted:
- Select "Use an existing project" and choose your GCP project
- Set public directory to: `frontend/dist`
- Configure as single-page app: **Yes**
- Set up automatic builds: **No** (we'll build manually)

## Step 3: Prepare Environment Variables

### Backend Environment Variables

You'll need to set these when deploying to Cloud Run. Create a note of these values from your local `.env` file:

- `GCP_PROJECT_ID` - Your GCP project ID
- `GCP_LOCATION` - Region (e.g., `us-central1`)
- `GEMINI_MODEL_NAME` - Model name (e.g., `gemini-2.5-flash`)

### Service Account Setup

For Cloud Run to access Vertex AI and Firestore, you need a service account:

1. **Create a service account** (if you don't have one):
   ```bash
   gcloud iam service-accounts create chatbranch-service \
     --display-name="ChatBranch Service Account"
   ```

2. **Grant necessary permissions**:
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:chatbranch-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:chatbranch-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/datastore.user"
   ```

3. **Create and download key** (if needed for local testing):
   ```bash
   gcloud iam service-accounts keys create chatbranch-service-account.json \
     --iam-account=chatbranch-service@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

4. **Use the service account for Cloud Run**:
   When deploying, Cloud Run will automatically use the default compute service account or you can specify a custom one.

## Step 4: Deploy Backend to Cloud Run

### Build and Deploy

From the project root:

```bash
cd backend

# Build and push the container image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/chatbranch-backend

# Deploy to Cloud Run
gcloud run deploy chatbranch-backend \
  --image gcr.io/YOUR_PROJECT_ID/chatbranch-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --service-account chatbranch-service@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars GCP_PROJECT_ID=YOUR_PROJECT_ID,GCP_LOCATION=us-central1,GEMINI_MODEL_NAME=gemini-2.5-flash \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10
```

**Important:** Replace `YOUR_PROJECT_ID` with your actual project ID in all commands.

### Get Backend URL

After deployment, get your backend URL:

```bash
gcloud run services describe chatbranch-backend \
  --region us-central1 \
  --format 'value(status.url)'
```

Save this URL - you'll need it for the frontend configuration.

## Step 5: Configure Frontend

### Create Production Environment File

Create `frontend/.env.production`:

```env
VITE_API_BASE_URL=https://your-backend-url.run.app
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Replace:
- `https://your-backend-url.run.app` with the URL from Step 4
- All Firebase values from your Firebase project settings

### Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon)
4. Scroll to "Your apps" section
5. If you don't have a web app, click "Add app" and select Web
6. Copy the configuration values

## Step 6: Build Frontend

```bash
cd frontend
npm install
npm run build
```

This creates the production build in `frontend/dist/`.

## Step 7: Deploy Frontend to Firebase Hosting

```bash
# From project root
firebase deploy --only hosting
```

## Step 8: Verify Deployment

1. **Backend Health Check:**
   ```bash
   curl https://your-backend-url.run.app/health
   ```
   Should return: `{"status":"ok"}`

2. **Frontend:**
   Visit the Firebase Hosting URL (shown after deployment, or check Firebase Console)

## Step 9: Update CORS (if needed)

If you encounter CORS errors, you may need to update the backend CORS configuration. The current setup allows all origins, but you can restrict it to your frontend domain.

## Troubleshooting

### Backend Issues

**Check logs:**
```bash
gcloud run services logs read chatbranch-backend --region us-central1
```

**Common issues:**
- **403 Forbidden**: Check service account permissions
- **500 Internal Server Error**: Check logs for specific errors
- **Timeout**: Increase timeout with `--timeout 600`

### Frontend Issues

**Check Firebase Hosting logs:**
```bash
firebase hosting:channel:list
```

**Common issues:**
- **API calls failing**: Verify `VITE_API_BASE_URL` in `.env.production`
- **Firebase auth not working**: Verify all Firebase env variables are set correctly

## Updating Deployment

### Update Backend

```bash
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/chatbranch-backend
gcloud run deploy chatbranch-backend \
  --image gcr.io/YOUR_PROJECT_ID/chatbranch-backend \
  --region us-central1
```

### Update Frontend

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

## Cost Optimization

- **Cloud Run**: Pay only for requests (free tier: 2 million requests/month)
- **Firebase Hosting**: Free tier includes 10 GB storage and 360 MB/day transfer
- **Vertex AI**: Pay per token usage
- **Firestore**: Free tier includes 1 GB storage and 50K reads/day

## Security Notes

1. **Service Account**: The service account key should never be committed to git
2. **Environment Variables**: Sensitive values are set via Cloud Run environment variables
3. **CORS**: Consider restricting CORS to your frontend domain in production
4. **Firebase Rules**: Ensure Firestore security rules are properly configured

## Next Steps

- Set up custom domain for Firebase Hosting
- Configure Cloud Run for higher traffic (auto-scaling)
- Set up monitoring and alerts
- Configure CI/CD pipeline for automatic deployments





# Quick Deployment Guide

## Prerequisites Check

```bash
# Check if tools are installed
gcloud --version
firebase --version
node --version
```

## One-Time Setup

### 1. Authenticate
```bash
gcloud auth login
gcloud auth application-default login
firebase login
```

### 2. Set Project
```bash
export GCP_PROJECT_ID=your-project-id
gcloud config set project $GCP_PROJECT_ID
```

### 3. Enable APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable firestore.googleapis.com
```

### 4. Create Service Account (if needed)
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

## Deploy Backend

### Option 1: Using the Script
```bash
export GCP_PROJECT_ID=your-project-id
export GCP_REGION=us-central1
export SERVICE_ACCOUNT=chatbranch-service@$GCP_PROJECT_ID.iam.gserviceaccount.com
./deploy-backend.sh
```

### Option 2: Manual Steps
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

### Get Backend URL
```bash
BACKEND_URL=$(gcloud run services describe chatbranch-backend --region us-central1 --format 'value(status.url)')
echo $BACKEND_URL
```

## Deploy Frontend

### 1. Create .env.production
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

**Important:** Replace `https://your-backend-url.run.app` with the actual backend URL from above.

### 2. Get Firebase Config
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Project Settings → Your apps → Web app
4. Copy the config values

### 3. Build and Deploy
```bash
npm install
npm run build
cd ..
firebase deploy --only hosting
```

## Verify

1. **Backend Health:**
   ```bash
   curl $BACKEND_URL/health
   ```

2. **Frontend:** Visit the Firebase Hosting URL

## Update Deployments

### Backend
```bash
./deploy-backend.sh
```

### Frontend
```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```





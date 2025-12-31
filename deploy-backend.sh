#!/bin/bash

# ChatBranch Backend Deployment Script
# This script builds and deploys the backend to Google Cloud Run

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - UPDATE THESE VALUES
GCP_PROJECT_ID="${GCP_PROJECT_ID:-}"
GCP_REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="chatbranch-backend"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed.${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if project ID is set
if [ -z "$GCP_PROJECT_ID" ]; then
    echo -e "${YELLOW}GCP_PROJECT_ID not set. Checking current gcloud project...${NC}"
    GCP_PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    
    if [ -z "$GCP_PROJECT_ID" ]; then
        echo -e "${RED}Error: GCP_PROJECT_ID is not set.${NC}"
        echo "Set it with: export GCP_PROJECT_ID=your-project-id"
        echo "Or run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
fi

echo -e "${GREEN}Deploying to project: ${GCP_PROJECT_ID}${NC}"
echo -e "${GREEN}Region: ${GCP_REGION}${NC}"

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit 1

# Build the Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/$SERVICE_NAME

# Prepare deployment command
DEPLOY_CMD="gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$GCP_PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $GCP_REGION \
  --allow-unauthenticated \
  --set-env-vars GCP_PROJECT_ID=$GCP_PROJECT_ID,GCP_LOCATION=$GCP_REGION,GEMINI_MODEL_NAME=gemini-2.5-flash \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10"

# Add service account if provided
if [ -n "$SERVICE_ACCOUNT" ]; then
    DEPLOY_CMD="$DEPLOY_CMD --service-account $SERVICE_ACCOUNT"
fi

# Deploy to Cloud Run
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
eval $DEPLOY_CMD

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $GCP_REGION --format 'value(status.url)')

echo -e "${GREEN}✓ Deployment complete!${NC}"
echo -e "${GREEN}Backend URL: ${SERVICE_URL}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update frontend/.env.production with: VITE_API_BASE_URL=$SERVICE_URL"
echo "2. Build and deploy frontend: cd frontend && npm run build && firebase deploy --only hosting"





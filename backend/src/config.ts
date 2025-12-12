import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  gcp: {
    projectId: string;
    location: string;
    modelName: string;
  };
  server: {
    port: number;
  };
  credentials?: {
    serviceAccountPath?: string;
    apiKey?: string;
  };
}

function getConfig(): Config {
  const projectId = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_LOCATION || 'us-central1';
  const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';
  const port = parseInt(process.env.PORT || '3000', 10);
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!projectId) {
    throw new Error('GCP_PROJECT_ID environment variable is required');
  }

  return {
    gcp: {
      projectId,
      location,
      modelName,
    },
    server: {
      port,
    },
    credentials: {
      serviceAccountPath,
      apiKey,
    },
  };
}

export const config = getConfig();



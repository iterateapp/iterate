function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const env = {
  PORT: Number(process.env.PORT ?? 4444),
  LIVEKIT_URL: required('LIVEKIT_URL'),
  LIVEKIT_API_KEY: required('LIVEKIT_API_KEY'),
  LIVEKIT_API_SECRET: required('LIVEKIT_API_SECRET'),
  OPENAI_API_KEY: required('OPENAI_API_KEY'),
  GOOGLE_CLOUD_CREDENTIALS_JSON: required('GOOGLE_CLOUD_CREDENTIALS_JSON'),
  FISH_AUDIO_API_KEY: required('FISH_AUDIO_API_KEY'),
  FISH_AUDIO_REFERENCE_ID: process.env.FISH_AUDIO_REFERENCE_ID ?? '',
  FISH_AUDIO_MODEL: process.env.FISH_AUDIO_MODEL ?? 'speech-1.5',
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),
};

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

export const env = {
  LIVEKIT_URL: required('LIVEKIT_URL'),
  LIVEKIT_API_KEY: required('LIVEKIT_API_KEY'),
  LIVEKIT_API_SECRET: required('LIVEKIT_API_SECRET'),
  DATABASE_URL: required('DATABASE_URL'),
};

import { config } from 'dotenv';
config();

import '@/ai/flows/generate-beneficiary-description.ts';
import '@/ai/flows/verify-face.ts';
import '@/ai/flows/verify-beneficiary-face.ts';
import '@/ai/flows/find-beneficiary-by-face.ts';
import '@/ai/flows/create-voice-profile.ts';
import '@/ai/flows/identify-speaker.ts';

import { config } from 'dotenv';
config();

import '@/ai/flows/ensure-character-uniqueness.ts';
import '@/ai/flows/generate-unique-character.ts';
import '@/ai/flows/generate-image-flow.ts';
import '@/ai/flows/generate-text-flow.ts';

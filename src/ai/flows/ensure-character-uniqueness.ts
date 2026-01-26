'use server';

/**
 * @fileOverview Ensures the uniqueness of AI-generated characters using deterministic logic.
 *
 * - ensureCharacterUniqueness - A function that generates a unique character and encodes its features as metadata.
 * - EnsureCharacterUniquenessInput - The input type for the ensureCharacterUniqueness function.
 * - EnsureCharacterUniquenessOutput - The return type for the ensureCharacterUniqueness function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnsureCharacterUniquenessInputSchema = z.object({
  seed: z.string().describe('A seed value to ensure deterministic character generation.'),
  description: z.string().describe('A description of the character.'),
});
export type EnsureCharacterUniquenessInput = z.infer<typeof EnsureCharacterUniquenessInputSchema>;

const EnsureCharacterUniquenessOutputSchema = z.object({
  characterFeatures: z.record(z.string(), z.any()).describe('A record of character features encoded as metadata.'),
  isUnique: z.boolean().describe('Indicates whether the generated character is unique based on its features.'),
});
export type EnsureCharacterUniquenessOutput = z.infer<typeof EnsureCharacterUniquenessOutputSchema>;

export async function ensureCharacterUniqueness(input: EnsureCharacterUniquenessInput): Promise<EnsureCharacterUniquenessOutput> {
  return ensureCharacterUniquenessFlow(input);
}

const characterGeneratorTool = ai.defineTool({
    name: 'characterGenerator',
    description: 'Generates a character based on a seed and description, ensuring uniqueness through deterministic logic.',
    inputSchema: EnsureCharacterUniquenessInputSchema,
    outputSchema: EnsureCharacterUniquenessOutputSchema,
  },
  async (input: EnsureCharacterUniquenessInput) => {
    // Simulate deterministic character generation based on the seed.
    // In a real application, this would involve a more complex algorithm.
    const characterFeatures = {
      hairColor: `color${input.seed.charCodeAt(0) % 5 + 1}`,
      eyeColor: `color${input.seed.charCodeAt(1) % 3 + 1}`,
      accessory: `item${input.seed.charCodeAt(2) % 4 + 1}`,
    };

    // A simplified check for uniqueness (in a real scenario, this would involve querying a database).
    const isUnique = Object.values(characterFeatures).every(feature => feature.length > 0);

    return {
      characterFeatures,
      isUnique,
    };
  }
);

const ensureCharacterUniquenessPrompt = ai.definePrompt({
  name: 'ensureCharacterUniquenessPrompt',
  tools: [characterGeneratorTool],
  input: {schema: EnsureCharacterUniquenessInputSchema},
  output: {schema: EnsureCharacterUniquenessOutputSchema},
  prompt: `Use the characterGenerator tool to generate a unique character based on the provided seed and description. The seed ensures deterministic generation. Check that isUnique is set to true. Description: {{{description}}}`,
});

const ensureCharacterUniquenessFlow = ai.defineFlow(
  {
    name: 'ensureCharacterUniquenessFlow',
    inputSchema: EnsureCharacterUniquenessInputSchema,
    outputSchema: EnsureCharacterUniquenessOutputSchema,
  },
  async input => {
    const {output} = await ensureCharacterUniquenessPrompt(input);
    return output!;
  }
);

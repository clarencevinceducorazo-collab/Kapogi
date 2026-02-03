'use server';

/**
 * @fileOverview An AI agent to generate a unique digital character based on a prompt.
 *
 * - generateUniqueCharacter - A function that handles the character generation process.
 * - GenerateUniqueCharacterInput - The input type for the generateUniqueCharacter function.
 * - GenerateUniqueCharacterOutput - The return type for the generateUniqueCharacter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateImage } from './generate-image-flow';

const GenerateUniqueCharacterInputSchema = z.object({
  prompt: z.string().describe('A prompt describing the desired character.'),
});
export type GenerateUniqueCharacterInput = z.infer<typeof GenerateUniqueCharacterInputSchema>;

const GenerateUniqueCharacterOutputSchema = z.object({
  characterDescription: z.string().describe('A detailed description of the generated character.'),
  imageUrl: z.string().describe('URL of the generated character image, as a data URI.'),
});
export type GenerateUniqueCharacterOutput = z.infer<typeof GenerateUniqueCharacterOutputSchema>;

export async function generateUniqueCharacter(input: GenerateUniqueCharacterInput): Promise<GenerateUniqueCharacterOutput> {
  return generateUniqueCharacterFlow(input);
}

// A prompt specifically for generating the character's description.
const characterDescriptionPrompt = ai.definePrompt({
  name: 'characterDescriptionPrompt',
  input: {schema: z.object({ prompt: z.string() })},
  output: {schema: z.object({ characterDescription: z.string() })},
  prompt: `You are an AI artist who specializes in creating unique characters.

  Based on the prompt: "{{prompt}}", generate a detailed description of the character.
  The description should include details about the character's appearance, personality, and background.
  Make sure that this character is unique, and unlike existing characters.
  The output should only be the description.`,
});


const generateUniqueCharacterFlow = ai.defineFlow(
  {
    name: 'generateUniqueCharacterFlow',
    inputSchema: GenerateUniqueCharacterInputSchema,
    outputSchema: GenerateUniqueCharacterOutputSchema,
  },
  async (input) => {
    // Step 1: Generate the detailed character description using the text model.
    const { output: descriptionOutput } = await characterDescriptionPrompt(input);
    if (!descriptionOutput?.characterDescription) {
      throw new Error('Failed to generate character description.');
    }

    const { characterDescription } = descriptionOutput;

    // Step 2: Generate the image using the detailed description as the prompt.
    const imageOutput = await generateImage({ prompt: characterDescription });
    if (!imageOutput?.imageUrl) {
        throw new Error('Failed to generate character image.');
    }

    const { imageUrl } = imageOutput;

    // Step 3: Combine the results and return.
    return {
      characterDescription,
      imageUrl,
    };
  }
);
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

const characterPrompt = ai.definePrompt({
  name: 'characterPrompt',
  input: {schema: GenerateUniqueCharacterInputSchema},
  output: {schema: GenerateUniqueCharacterOutputSchema},
  prompt: `You are an AI artist who specializes in creating unique characters.

  Based on the prompt: "{{prompt}}", generate a detailed description of the character and create an image of the character. Return the image as a data URI.
  The description should include details about the character's appearance, personality, and background.
  Make sure that this character is unique, and unlike existing characters.
  The image should be a full-body shot of the character.

  Ensure the output matches the schema exactly.`
});

const generateUniqueCharacterFlow = ai.defineFlow(
  {
    name: 'generateUniqueCharacterFlow',
    inputSchema: GenerateUniqueCharacterInputSchema,
    outputSchema: GenerateUniqueCharacterOutputSchema,
  },
  async input => {
    const {output} = await characterPrompt(input);
    return output!;
  }
);

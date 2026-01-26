
'use server';

import { generateUniqueCharacter, GenerateUniqueCharacterOutput } from '@/ai/flows/generate-unique-character';

export type FormState = {
  message: string;
  character?: GenerateUniqueCharacterOutput;
};

export async function generateCharacterAction(): Promise<FormState> {
  const prompts = [
    "A cyberpunk samurai with a neon katana",
    "A cute space explorer Corgi in a tiny astronaut suit",
    "A magical girl who fights with a paintbrush",
    "A steampunk inventor with clockwork wings",
    "An ancient golem made of moss and river stones",
    "A retro-futuristic robot DJ with vinyl record eyes",
    "A mischievous forest spirit with glowing mushrooms on its back",
    "A candy-themed knight with a lollipop mace",
    "A post-apocalyptic scavenger with a robotic falcon companion"
  ];
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

  try {
    const result = await generateUniqueCharacter({ prompt: randomPrompt });
    return {
      message: 'success',
      character: result,
    };
  } catch (error) {
    console.error(error);
    return {
      message: 'An error occurred while generating the character. Please try again.',
    };
  }
}

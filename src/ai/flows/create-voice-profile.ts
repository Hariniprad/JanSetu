'use server';
/**
 * @fileOverview Mock flow for creating a voice profile for speaker recognition.
 *
 * - createVoiceProfile - A function that simulates enrolling a user's voice.
 * - CreateVoiceProfileInput - The input type for the function.
 * - CreateVoiceProfileOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateVoiceProfileInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A voice recording of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export type CreateVoiceProfileInput = z.infer<typeof CreateVoiceProfileInputSchema>;

const CreateVoiceProfileOutputSchema = z.object({
  voiceProfileId: z
    .string()
    .describe(
      'A unique identifier for the created voice profile.'
    ),
  reason: z
    .string()
    .describe(
      'A brief explanation of the result, e.g., "Voice profile created successfully."'
    ),
});

export type CreateVoiceProfileOutput = z.infer<typeof CreateVoiceProfileOutputSchema>;


export async function createVoiceProfile(
  input: CreateVoiceProfileInput
): Promise<CreateVoiceProfileOutput> {
  return createVoiceProfileFlow(input);
}


const createVoiceProfileFlow = ai.defineFlow(
  {
    name: 'createVoiceProfileFlow',
    inputSchema: CreateVoiceProfileInputSchema,
    outputSchema: CreateVoiceProfileOutputSchema,
  },
  async input => {
    // In a real application, this flow would make an API call to a service like Azure AI Speech
    // to enroll the speaker and get a real voiceProfileId.
    // Here, we are mocking the response for demonstration purposes.

    console.log('Simulating voice profile creation with audio data.');

    // Generate a fake but unique-looking ID.
    const fakeVoiceProfileId = `vp_${Math.random().toString(36).substr(2, 9)}`;

    return {
      voiceProfileId: fakeVoiceProfileId,
      reason: 'Mock voice profile created successfully.',
    };
  }
);

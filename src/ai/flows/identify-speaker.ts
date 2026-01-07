'use server';
/**
 * @fileOverview Mock flow for identifying a speaker from a list of candidates.
 *
 * - identifySpeaker - A function that simulates identifying a speaker by voice.
 * - IdentifySpeakerInput - The input type for the function.
 * - IdentifySpeakerOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifySpeakerInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A live voice recording of the person to identify, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  candidateProfileIds: z
    .array(z.string())
    .describe(
      'An array of voiceProfileIds for all candidate beneficiaries.'
    ),
});

export type IdentifySpeakerInput = z.infer<typeof IdentifySpeakerInputSchema>;

const IdentifySpeakerOutputSchema = z.object({
  isMatch: z
    .boolean()
    .describe(
      'Whether a matching speaker was found among the candidates.'
    ),
  voiceProfileId: z
    .string()
    .optional()
    .describe(
      'The voiceProfileId of the matching speaker if one was found.'
    ),
  reason: z
    .string()
    .describe(
      'A brief explanation for the decision, e.g., "Match found for profile vp_xyz" or "No confident match found."'
    ),
});

export type IdentifySpeakerOutput = z.infer<typeof IdentifySpeakerOutputSchema>;

export async function identifySpeaker(
  input: IdentifySpeakerInput
): Promise<IdentifySpeakerOutput> {
  return identifySpeakerFlow(input);
}


const identifySpeakerFlow = ai.defineFlow(
  {
    name: 'identifySpeakerFlow',
    inputSchema: IdentifySpeakerInputSchema,
    outputSchema: IdentifySpeakerOutputSchema,
  },
  async input => {
    // In a real application, this flow would make an API call to a service like Azure AI Speech
    // to perform a 1-to-N speaker identification.
    // Here, we are mocking the response for demonstration purposes.

    console.log('Simulating speaker identification against candidate profiles.');

    if (input.candidateProfileIds.length === 0) {
      return {
        isMatch: false,
        reason: 'No candidate profiles were provided to compare against.',
      };
    }

    // Mock logic: For this demo, we'll just "pretend" to find a match if there's at least one candidate.
    // A real implementation would involve a complex API call.
    // We'll just pick the first candidate as the "match".
    const mockMatchedProfileId = input.candidateProfileIds[0];

    return {
      isMatch: true,
      voiceProfileId: mockMatchedProfileId,
      reason: `Mock identification: Confident match found for profile ${mockMatchedProfileId}.`,
    };
  }
);

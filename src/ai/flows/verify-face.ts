'use server';
/**
 * @fileOverview Flow for verifying a face against a set of existing photos to prevent duplicates.
 *
 * - verifyFace - A function that performs the face verification.
 * - VerifyFaceInput - The input type for the verifyFace function.
 * - VerifyFaceOutput - The return type for the verifyFace function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyFaceInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the beneficiary to verify, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  existingPhotos: z
    .array(z.string())
    .describe(
      'An array of existing beneficiary photos (as data URIs) to compare against.'
    ),
});

export type VerifyFaceInput = z.infer<typeof VerifyFaceInputSchema>;

const VerifyFaceOutputSchema = z.object({
  isDuplicate: z
    .boolean()
    .describe(
      'Whether the provided photo is a likely duplicate of any of the existing photos.'
    ),
  reason: z
    .string()
    .describe(
      'A brief explanation for the decision, e.g., "The face matches an existing beneficiary" or "This appears to be a new individual."'
    ),
});

export type VerifyFaceOutput = z.infer<typeof VerifyFaceOutputSchema>;

export async function verifyFace(
  input: VerifyFaceInput
): Promise<VerifyFaceOutput> {
  return verifyFaceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyFacePrompt',
  input: {schema: VerifyFaceInputSchema},
  output: {schema: VerifyFaceOutputSchema},
  prompt: `You are an advanced facial recognition system with a critical and very specific task. Your ONLY task is to determine if the new "Verification Photo" is a likely duplicate of any of the photos in the "Existing Photos" list that I provide to you in this prompt.

You MUST follow these rules strictly:
1.  You are FORBIDDEN from using any knowledge or memory of photos from previous requests. Your analysis must be confined ONLY to the images provided in this single request.
2.  Analyze the face in the "Verification Photo".
3.  Compare it ONLY against each face provided in the "Existing Photos" list.
4.  If you find a strong match within the provided "Existing Photos" list, you MUST set "isDuplicate" to true and provide a reason.
5.  If the person in the "Verification Photo" does not appear in the "Existing Photos" list, you MUST set "isDuplicate" to false.
6.  If the "Existing Photos" list is empty, you MUST set "isDuplicate" to false.

Verification Photo:
{{media url=photoDataUri}}

Existing Photos:
{{#if existingPhotos}}
  {{#each existingPhotos}}
  - {{media url=this}}
  {{/each}}
{{else}}
  (No existing photos were provided)
{{/if}}
`,
});

const verifyFaceFlow = ai.defineFlow(
  {
    name: 'verifyFaceFlow',
    inputSchema: VerifyFaceInputSchema,
    outputSchema: VerifyFaceOutputSchema,
  },
  async input => {
    // If there are no existing photos to compare against, it cannot be a duplicate.
    // This is the most robust way to prevent phantom duplicates.
    if (!input.existingPhotos || input.existingPhotos.length === 0) {
      return {
        isDuplicate: false,
        reason: 'No existing photos to compare against. This is a new individual.',
      };
    }
    
    // Otherwise, proceed with the AI comparison.
    const {output} = await prompt(input);
    return output!;
  }
);

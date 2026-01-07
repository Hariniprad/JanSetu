'use server';
/**
 * @fileOverview Flow for finding a beneficiary by their face from a set of existing photos.
 *
 * - findBeneficiaryByFace - A function that performs the face search.
 * - FindBeneficiaryByFaceInput - The input type for the function.
 * - FindBeneficiaryByFaceOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define a schema for a single beneficiary's photo data
const BeneficiaryPhotoSchema = z.object({
    id: z.string().describe('The unique identifier of the beneficiary.'),
    photoUrl: z.string().describe('The URL of the beneficiary\'s photo.')
});

const FindBeneficiaryByFaceInputSchema = z.object({
  livePhotoDataUri: z
    .string()
    .describe(
      "A live photo of the person to verify, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  approvedBeneficiaries: z
    .array(BeneficiaryPhotoSchema)
    .describe(
      'An array of objects, each containing the ID and photo URL of an approved beneficiary.'
    ),
});

export type FindBeneficiaryByFaceInput = z.infer<typeof FindBeneficiaryByFaceInputSchema>;

const FindBeneficiaryByFaceOutputSchema = z.object({
  isMatch: z
    .boolean()
    .describe(
      'Whether a matching beneficiary was found in the provided list.'
    ),
  beneficiaryId: z
    .string()
    .optional()
    .describe(
      'The ID of the matching beneficiary if one was found.'
    ),
  reason: z
    .string()
    .describe(
      'A brief explanation for the decision, e.g., "Match found for beneficiary JS-12345" or "No matching beneficiary found."'
    ),
});

export type FindBeneficiaryByFaceOutput = z.infer<typeof FindBeneficiaryByFaceOutputSchema>;

export async function findBeneficiaryByFace(
  input: FindBeneficiaryByFaceInput
): Promise<FindBeneficiaryByFaceOutput> {
  return findBeneficiaryByFaceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findBeneficiaryByFacePrompt',
  input: {schema: FindBeneficiaryByFaceInputSchema},
  output: {schema: FindBeneficiaryByFaceOutputSchema},
  prompt: `You are an advanced facial recognition system for a benefits distribution program. Your critical task is to determine if the person in the "Live Photo" is one of the "Approved Beneficiaries".

You must compare the face in the "Live Photo" against each face in the "Approved Beneficiaries" list.

- If you find a clear match, you MUST set "isMatch" to true and set "beneficiaryId" to the ID of the single best matching person from the list.
- If you cannot find a confident match in the list, you MUST set "isMatch" to false and you MUST NOT provide a beneficiaryId.
- Be precise. It is better to fail verification than to approve the wrong person.

Live Photo:
{{media url=livePhotoDataUri}}

Approved Beneficiaries:
{{#each approvedBeneficiaries}}
- ID: {{this.id}}, Photo: {{media url=this.photoUrl}}
{{/each}}
`,
});

const findBeneficiaryByFaceFlow = ai.defineFlow(
  {
    name: 'findBeneficiaryByFaceFlow',
    inputSchema: FindBeneficiaryByFaceInputSchema,
    outputSchema: FindBeneficiaryByFaceOutputSchema,
  },
  async input => {
    if (input.approvedBeneficiaries.length === 0) {
      return {
        isMatch: false,
        reason: 'No approved beneficiaries were provided to compare against.',
      };
    }
    const {output} = await prompt(input);
    return output!;
  }
);

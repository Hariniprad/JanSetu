'use server';
/**
 * @fileOverview Flow for verifying a captured face against a specific registered beneficiary's photo.
 *
 * - verifyBeneficiaryFace - A function that performs the face verification against a single master photo.
 * - VerifyBeneficiaryFaceInput - The input type for the function.
 * - VerifyBeneficiaryFaceOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyBeneficiaryFaceInputSchema = z.object({
  livePhotoDataUri: z
    .string()
    .describe(
      "A live photo of the person to verify, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  registeredPhotoUrl: z
    .string()
    .describe(
      "The URL of the registered beneficiary's photo to compare against."
    ),
});

export type VerifyBeneficiaryFaceInput = z.infer<typeof VerifyBeneficiaryFaceInputSchema>;

const VerifyBeneficiaryFaceOutputSchema = z.object({
  isMatch: z
    .boolean()
    .describe(
      'Whether the live photo is a likely match to the registered photo.'
    ),
  reason: z
    .string()
    .describe(
      'A brief explanation for the decision, e.g., "The faces match" or "The faces do not appear to be the same person."'
    ),
});

export type VerifyBeneficiaryFaceOutput = z.infer<typeof VerifyBeneficiaryFaceOutputSchema>;

export async function verifyBeneficiaryFace(
  input: VerifyBeneficiaryFaceInput
): Promise<VerifyBeneficiaryFaceOutput> {
  return verifyBeneficiaryFaceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyBeneficiaryFacePrompt',
  input: {schema: VerifyBeneficiaryFaceInputSchema},
  output: {schema: VerifyBeneficiaryFaceOutputSchema},
  prompt: `You are an advanced facial recognition system for identity verification. Your task is to determine if the "Live Photo" is the same person as in the "Registered Photo".

Analyze and compare the face in the "Live Photo" with the face in the "Registered Photo".

- If you are confident it is the same person, set "isMatch" to true.
- If it is clearly not the same person, set "isMatch" to false.
- Account for minor variations like lighting, angle, and expression. The key is to confirm the identity.

Live Photo:
{{media url=livePhotoDataUri}}

Registered Photo:
{{media url=registeredPhotoUrl}}
`,
});

const verifyBeneficiaryFaceFlow = ai.defineFlow(
  {
    name: 'verifyBeneficiaryFaceFlow',
    inputSchema: VerifyBeneficiaryFaceInputSchema,
    outputSchema: VerifyBeneficiaryFaceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

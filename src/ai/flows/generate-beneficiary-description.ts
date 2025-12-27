'use server';
/**
 * @fileOverview Flow for generating a short description of a beneficiary based on provided data.
 *
 * - generateBeneficiaryDescription - A function that generates the beneficiary description.
 * - GenerateBeneficiaryDescriptionInput - The input type for the generateBeneficiaryDescription function.
 * - GenerateBeneficiaryDescriptionOutput - The return type for the generateBeneficiaryDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBeneficiaryDescriptionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of the beneficiary, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'  
    ),
  location: z.string().describe('The GPS location of the beneficiary.'),
  ageRange: z.string().describe('The age range of the beneficiary.'),
  gender: z.string().describe('The gender of the beneficiary.'),
});

export type GenerateBeneficiaryDescriptionInput = z.infer<
  typeof GenerateBeneficiaryDescriptionInputSchema
>;

const GenerateBeneficiaryDescriptionOutputSchema = z.object({
  description: z.string().describe('A short description of the beneficiary.'),
});

export type GenerateBeneficiaryDescriptionOutput = z.infer<
  typeof GenerateBeneficiaryDescriptionOutputSchema
>;

export async function generateBeneficiaryDescription(
  input: GenerateBeneficiaryDescriptionInput
): Promise<GenerateBeneficiaryDescriptionOutput> {
  return generateBeneficiaryDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBeneficiaryDescriptionPrompt',
  input: {schema: GenerateBeneficiaryDescriptionInputSchema},
  output: {schema: GenerateBeneficiaryDescriptionOutputSchema},
  prompt: `You are an assistant that generates a short description of a beneficiary based on the following information:

Photo: {{media url=photoDataUri}}
Location: {{location}}
Age Range: {{ageRange}}
Gender: {{gender}}

Please generate a concise description of the beneficiary, suitable for quick identification.`,
});

const generateBeneficiaryDescriptionFlow = ai.defineFlow(
  {
    name: 'generateBeneficiaryDescriptionFlow',
    inputSchema: GenerateBeneficiaryDescriptionInputSchema,
    outputSchema: GenerateBeneficiaryDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

'use server';

import { generateBeneficiaryDescription } from '@/ai/flows/generate-beneficiary-description';
import { z } from 'zod';

const formSchema = z.object({
  ageRange: z.string(),
  gender: z.string(),
  photoDataUri: z.string().optional(),
});

export async function generateDescriptionAction(formData: FormData) {
  try {
    const data = formSchema.parse({
      ageRange: formData.get('ageRange'),
      gender: formData.get('gender'),
      photoDataUri: formData.get('photoDataUri'),
    });

    if (!data.photoDataUri) {
      throw new Error('Photo is required to generate a description.');
    }

    const result = await generateBeneficiaryDescription({
      photoDataUri: data.photoDataUri,
      location: '28.6139° N, 77.2090° E', // Mock location for now
      ageRange: data.ageRange,
      gender: data.gender,
    });

    return {
      success: true,
      description: result.description,
    };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      success: false,
      error: `Failed to generate description: ${errorMessage}`,
    };
  }
}

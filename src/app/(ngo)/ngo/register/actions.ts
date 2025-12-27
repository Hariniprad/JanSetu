'use server';

import { generateBeneficiaryDescription } from '@/ai/flows/generate-beneficiary-description';
import { z } from 'zod';

const formSchema = z.object({
  ageRange: z.string(),
  gender: z.string(),
});

// A small, 1x1 transparent PNG as a base64 data URI
const placeholderPhotoDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export async function generateDescriptionAction(formData: FormData) {
  try {
    const data = formSchema.parse({
      ageRange: formData.get('ageRange'),
      gender: formData.get('gender'),
    });

    const result = await generateBeneficiaryDescription({
      photoDataUri: placeholderPhotoDataUri,
      location: '28.6139° N, 77.2090° E', // Mock location
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

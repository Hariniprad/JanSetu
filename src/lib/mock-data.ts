import { PlaceHolderImages } from './placeholder-images';

export type Beneficiary = {
  id: string;
  name: string;
  description: string;
  photoUrl: string;
  photoHint: string;
  location: string;
  ageRange: string;
  gender: 'Male' | 'Female' | 'Other';
  registeredBy: string;
  registeredAt: Date;
  status: 'Pending' | 'Approved' | 'Rejected';
  qrCodeUrl: string;
};

const getPlaceholder = (id: string) => {
    return PlaceHolderImages.find(p => p.id === id) || PlaceHolderImages[0];
}

export const mockBeneficiaries: Beneficiary[] = [
  {
    id: 'JS-8435A',
    name: 'Asha Devi',
    description: 'An elderly woman from a rural village, seeking support for her family.',
    photoUrl: getPlaceholder('beneficiary1').imageUrl,
    photoHint: getPlaceholder('beneficiary1').imageHint,
    location: '28.6139° N, 77.2090° E',
    ageRange: '60-70',
    gender: 'Female',
    registeredBy: 'Ravi Kumar',
    registeredAt: new Date('2023-10-26T10:00:00Z'),
    status: 'Approved',
    qrCodeUrl: getPlaceholder('qrCode1').imageUrl,
  },
  {
    id: 'JS-91B24',
    name: 'Ramesh Singh',
    description: 'A young man with a disability, looking for skill development opportunities.',
    photoUrl: getPlaceholder('beneficiary2').imageUrl,
    photoHint: getPlaceholder('beneficiary2').imageHint,
    location: '19.0760° N, 72.8777° E',
    ageRange: '20-30',
    gender: 'Male',
    registeredBy: 'Priya Sharma',
    registeredAt: new Date('2023-11-15T14:30:00Z'),
    status: 'Pending',
    qrCodeUrl: getPlaceholder('qrCode2').imageUrl,
  },
  {
    id: 'JS-C72D9',
    name: 'Sunita Kumari',
    description: 'A single mother of two, in need of nutritional support for her children.',
    photoUrl: getPlaceholder('beneficiary3').imageUrl,
    photoHint: getPlaceholder('beneficiary3').imageHint,
    location: '12.9716° N, 77.5946° E',
    ageRange: '30-40',
    gender: 'Female',
    registeredBy: 'Ravi Kumar',
    registeredAt: new Date('2023-11-20T09:15:00Z'),
    status: 'Pending',
    qrCodeUrl: getPlaceholder('qrCode1').imageUrl,
  },
  {
    id: 'JS-3E8F1',
    name: 'Amit Patel',
    description: 'A farmer who lost his crops due to recent floods, seeking immediate aid.',
    photoUrl: getPlaceholder('beneficiary4').imageUrl,
    photoHint: getPlaceholder('beneficiary4').imageHint,
    location: '23.0225° N, 72.5714° E',
    ageRange: '40-50',
    gender: 'Male',
    registeredBy: 'Priya Sharma',
    registeredAt: new Date('2023-12-01T11:00:00Z'),
    status: 'Approved',
    qrCodeUrl: getPlaceholder('qrCode2').imageUrl,
  },
    {
    id: 'JS-F4A02',
    name: 'Geeta Yadav',
    description: 'A student from an underprivileged background, requiring educational materials.',
    photoUrl: getPlaceholder('beneficiary5').imageUrl,
    photoHint: getPlaceholder('beneficiary5').imageHint,
    location: '25.3176° N, 82.9739° E',
    ageRange: '10-20',
    gender: 'Female',
    registeredBy: 'Ravi Kumar',
    registeredAt: new Date('2024-01-05T16:45:00Z'),
    status: 'Rejected',
    qrCodeUrl: getPlaceholder('qrCode1').imageUrl,
  },
];

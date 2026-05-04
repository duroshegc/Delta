export const ageFromBirthDate = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const dob = new Date(iso);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
};

export const intentLabels: Record<string, string> = {
  serious: 'Long-term',
  casual: 'Short-term',
  friendship: 'Friends',
  networking: 'Networking',
};

export const genderLabels: Record<string, string> = {
  female: 'Woman',
  male: 'Man',
  nonbinary: 'Non-binary',
  other: 'Other',
};

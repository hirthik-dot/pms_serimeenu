import type { IAddress } from '@/types/models';

export function formatAddress(
  address?: string | IAddress | null,
): string {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return [address.street, address.city, address.state, address.pincode, address.country]
    .filter((part) => part && part !== '-')
    .join(', ');
}

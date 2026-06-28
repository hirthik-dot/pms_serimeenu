import { describe, expect, it } from 'vitest';

import { fdiToDisplayNumber, displayToFdiNumber } from '@/features/odontogram/utils/numbering';
import { ToothNumberingSystem } from '@/types/enums';

describe('odontogram numbering', () => {
  it('converts FDI to universal for adult', () => {
    expect(fdiToDisplayNumber(11, ToothNumberingSystem.Universal, 'adult')).toBe('8');
    expect(fdiToDisplayNumber(36, ToothNumberingSystem.FDI, 'adult')).toBe('36');
  });

  it('converts universal back to FDI', () => {
    expect(displayToFdiNumber(8, ToothNumberingSystem.Universal, 'adult')).toBe(11);
    expect(displayToFdiNumber(36, ToothNumberingSystem.FDI, 'adult')).toBe(36);
  });
});

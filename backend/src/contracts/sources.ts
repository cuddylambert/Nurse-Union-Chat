import type { ContractSource } from '../types.js';

export const contractSources: ContractSource[] = [
  {
    unionCode: 'NX',
    displayName: 'UC Registered Nurses (NX Unit)',
    seedUrls: [
      'https://ucnet.universityofcalifornia.edu/resources/employment-policies-contracts/bargaining-units/registered-nurses/contract/'
    ],
    parsers: [
      { name: 'Contract PDF', match: /registered-nurses-contract/i, type: 'contract' },
      { name: 'Appendix', match: /appendix/i, type: 'appendix' },
      { name: 'Side Letter', match: /side-letter/i, type: 'sideLetter' },
      { name: 'Memorandum of Understanding', match: /mou|memorandum/i, type: 'mou' }
    ],
    schemaVersion: '2024-06-01'
  }
];

export function getContractSource(unionCode: string): ContractSource | undefined {
  return contractSources.find((source) => source.unionCode.toLowerCase() === unionCode.toLowerCase());
}

// Sample PSGC data for demonstration. In a real app, this would be a comprehensive database.
export const PSGC_DATA = {
  provinces: [
    { name: 'Cebu', code: '072200000' },
    { name: 'Metro Manila', code: '130000000' }, // NCR is technically a region, but often treated as a province in forms
  ],
  cities: {
    '072200000': [ // Cebu
      { name: 'Cebu City', code: '072217000' },
      { name: 'Mandaue City', code: '072230000' },
    ],
    '130000000': [ // Metro Manila
      { name: 'Makati City', code: '137602000' },
      { name: 'Quezon City', code: '137404000' },
    ],
  },
  barangays: {
    '072217000': [ // Cebu City
      { name: 'Lahug', code: '072217020' },
      { name: 'Guadalupe', code: '072217017' },
    ],
    '072230000': [ // Mandaue City
      { name: 'Subangdaku', code: '072230024' },
      { name: 'Banilad', code: '072230005' },
    ],
    '137602000': [ // Makati City
      { name: 'Poblacion', code: '137602014' },
      { name: 'Bel-Air', code: '137602002' },
    ],
    '137404000': [ // Quezon City
      { name: 'Diliman', code: '137404021' },
      { name: 'Batasan Hills', code: '137404009' },
    ],
  },
};

export type Province = (typeof PSGC_DATA.provinces)[0];
export type City = (typeof PSGC_DATA.cities)['072200000'][0];
export type Barangay = (typeof PSGC_DATA.barangays)['072217000'][0];

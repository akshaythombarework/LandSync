export interface LocationNode {
  name: string;
  code: string;
  children?: LocationNode[];
}

export const HIERARCHICAL_LOCATIONS: {
  country: string;
  states: {
    name: string;
    districts: {
      name: string;
      talukas: {
        name: string;
        villages: string[];
      }[];
    }[];
  }[];
} = {
  country: 'India',
  states: [
    {
      name: 'Maharashtra',
      districts: [
        {
          name: 'Pune',
          talukas: [
            {
              name: 'Haveli',
              villages: ['Wagholi', 'Hadapsar', 'Khadakwasla', 'Uruli Kanchan', 'Loni Kalbhor']
            },
            {
              name: 'Mulshi',
              villages: ['Paud', 'Pirangut', 'Lavasa', 'Bhadas', 'Kolvan']
            },
            {
              name: 'Baramati',
              villages: ['Malegaon', 'Songaon', 'Karkhel', 'Supe', 'Morgaon']
            },
            {
              name: 'Khed',
              villages: ['Chakan', 'Rajgurunagar', 'Alandi', 'Shikrapur', 'Koregaon Bhima']
            }
          ]
        },
        {
          name: 'Satara',
          talukas: [
            {
              name: 'Karad',
              villages: ['Ogalewadi', 'Koregaon', 'Masur', 'Wadgaon']
            },
            {
              name: 'Wai',
              villages: ['Panchgani', 'Menavali', 'Dhom', 'Bhilawadi']
            }
          ]
        },
        {
          name: 'Ahmednagar',
          talukas: [
            {
              name: 'Sangamner',
              villages: ['Sakur', 'Ashwi', 'Talegaon', 'Pimpalgaon']
            },
            {
              name: 'Rahata',
              villages: ['Shirdi', 'Sakuri', 'Pimplas', 'Rampur']
            }
          ]
        }
      ]
    },
    {
      name: 'Karnataka',
      districts: [
        {
          name: 'Belagavi',
          talukas: [
            {
              name: 'Chikodi',
              villages: ['Nipani', 'Sadalga', 'Bedkihal']
            }
          ]
        }
      ]
    },
    {
      name: 'Gujarat',
      districts: [
        {
          name: 'Surat',
          talukas: [
            {
              name: 'Choryasi',
              villages: ['Hazira', 'Dumas', 'Ichhapore']
            }
          ]
        }
      ]
    }
  ]
};

// Helper methods to query levels
export const getStates = () => HIERARCHICAL_LOCATIONS.states.map(s => s.name);

export const getDistricts = (stateName: string) => {
  const state = HIERARCHICAL_LOCATIONS.states.find(s => s.name === stateName);
  return state ? state.districts.map(d => d.name) : [];
};

export const getTalukas = (stateName: string, districtName: string) => {
  const state = HIERARCHICAL_LOCATIONS.states.find(s => s.name === stateName);
  const district = state?.districts.find(d => d.name === districtName);
  return district ? district.talukas.map(t => t.name) : [];
};

export const getVillages = (stateName: string, districtName: string, talukaName: string) => {
  const state = HIERARCHICAL_LOCATIONS.states.find(s => s.name === stateName);
  const district = state?.districts.find(d => d.name === districtName);
  const taluka = district?.talukas.find(t => t.name === talukaName);
  return taluka ? taluka.villages : [];
};

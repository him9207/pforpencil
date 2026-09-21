export interface CountryMaster {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
  displayOrder: number;
}

export interface RegionMaster {
  id: string;
  code: string;
  countryId: string;
  name: string;
  description: string;
  active: boolean;
  displayOrder: number;
}

export interface CurriculumMaster {
  id: string;
  code: string;
  countryId: string;
  regionId: string;
  name: string;
  description: string;
  sourceUrl?: string;
  active: boolean;
  displayOrder: number;
}

export interface CurriculumMasterData {
  countries: CountryMaster[];
  regions: RegionMaster[];
  curricula: CurriculumMaster[];
}

export const CURRICULUM_MASTER_STORAGE_KEY = 'funlearn_curriculum_master_v1';

export const DEFAULT_CURRICULUM_MASTER: CurriculumMasterData = {
  countries: [
    { id: 'CNT-AU', code: 'CNT-AU', name: 'Australia', description: 'Australian education jurisdictions.', active: true, displayOrder: 1 },
    { id: 'CNT-IN', code: 'CNT-IN', name: 'India', description: 'Indian education jurisdictions.', active: true, displayOrder: 2 },
    { id: 'CNT-US', code: 'CNT-US', name: 'United States', description: 'United States education jurisdictions.', active: true, displayOrder: 3 },
    { id: 'CNT-UK', code: 'CNT-UK', name: 'United Kingdom', description: 'United Kingdom education jurisdictions.', active: true, displayOrder: 4 },
    { id: 'CNT-CA', code: 'CNT-CA', name: 'Canada', description: 'Canadian education jurisdictions.', active: true, displayOrder: 5 },
    { id: 'CNT-GL', code: 'CNT-GL', name: 'Global', description: 'International curricula without a single national jurisdiction.', active: true, displayOrder: 6 }
  ],
  regions: [
    { id: 'REG-AU-VIC', code: 'REG-VIC', countryId: 'CNT-AU', name: 'Victoria', description: 'State of Victoria.', active: true, displayOrder: 1 },
    { id: 'REG-AU-NSW', code: 'REG-NSW', countryId: 'CNT-AU', name: 'New South Wales', description: 'State of New South Wales.', active: true, displayOrder: 2 },
    { id: 'REG-IN-CEN', code: 'REG-IN-CEN', countryId: 'CNT-IN', name: 'All India / Central', description: 'National or central Indian curriculum jurisdiction.', active: true, displayOrder: 1 },
    { id: 'REG-US-CA', code: 'REG-US-CA', countryId: 'CNT-US', name: 'California', description: 'State of California.', active: true, displayOrder: 1 },
    { id: 'REG-UK-ENG', code: 'REG-ENG', countryId: 'CNT-UK', name: 'England', description: 'England.', active: true, displayOrder: 1 },
    { id: 'REG-CA-ON', code: 'REG-ON', countryId: 'CNT-CA', name: 'Ontario', description: 'Province of Ontario.', active: true, displayOrder: 1 },
    { id: 'REG-GL-INT', code: 'REG-INT', countryId: 'CNT-GL', name: 'International', description: 'International jurisdiction.', active: true, displayOrder: 1 }
  ],
  curricula: [
    { id: 'CUR-VCAA20', code: 'CUR-VCAA20', countryId: 'CNT-AU', regionId: 'REG-AU-VIC', name: 'Victorian Curriculum 2.0', description: 'Victorian Curriculum Version 2.0.', sourceUrl: 'https://victoriancurriculum.vcaa.vic.edu.au/', active: true, displayOrder: 1 },
    { id: 'CUR-ACARA', code: 'CUR-ACARA', countryId: 'CNT-AU', regionId: 'REG-AU-NSW', name: 'Australian Curriculum', description: 'Australian Curriculum framework.', sourceUrl: 'https://v9.australiancurriculum.edu.au/', active: true, displayOrder: 2 },
    { id: 'CUR-CBSE', code: 'CUR-CBSE', countryId: 'CNT-IN', regionId: 'REG-IN-CEN', name: 'CBSE', description: 'Central Board of Secondary Education curriculum.', sourceUrl: 'https://www.cbse.gov.in/', active: true, displayOrder: 1 },
    { id: 'CUR-CCSS', code: 'CUR-CCSS', countryId: 'CNT-US', regionId: 'REG-US-CA', name: 'US Common Core (CCSS)', description: 'Common Core State Standards reference.', sourceUrl: 'https://www.thecorestandards.org/', active: true, displayOrder: 1 },
    { id: 'CUR-UKNC', code: 'CUR-UKNC', countryId: 'CNT-UK', regionId: 'REG-UK-ENG', name: 'UK National Curriculum', description: 'National Curriculum for England.', sourceUrl: 'https://www.gov.uk/government/collections/national-curriculum', active: true, displayOrder: 1 },
    { id: 'CUR-ON', code: 'CUR-ON', countryId: 'CNT-CA', regionId: 'REG-CA-ON', name: 'Ontario Curriculum', description: 'Ontario curriculum framework.', sourceUrl: 'https://www.dcp.edu.gov.on.ca/en/curriculum', active: true, displayOrder: 1 },
    { id: 'CUR-GLOBAL', code: 'CUR-GLOBAL', countryId: 'CNT-GL', regionId: 'REG-GL-INT', name: 'Universal Foundational (All Curricula)', description: 'Universal interactive early-learning discovery curriculum applicable across all global boards.', sourceUrl: '', active: true, displayOrder: 0 },
    { id: 'CUR-IBPYP', code: 'CUR-IBPYP', countryId: 'CNT-GL', regionId: 'REG-GL-INT', name: 'IB Primary Years Programme', description: 'International Baccalaureate Primary Years Programme.', sourceUrl: 'https://www.ibo.org/programmes/primary-years-programme/', active: true, displayOrder: 1 }
  ]
};

export function loadCurriculumMaster(): CurriculumMasterData {
  try {
    const raw = localStorage.getItem(CURRICULUM_MASTER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.countries && parsed?.regions && parsed?.curricula) {
        if (!parsed.curricula.some((c: any) => c.id === 'CUR-GLOBAL')) {
          parsed.curricula.unshift({
            id: 'CUR-GLOBAL',
            code: 'CUR-GLOBAL',
            countryId: 'CNT-GL',
            regionId: 'REG-GL-INT',
            name: 'Universal Foundational (All Curricula)',
            description: 'Universal interactive early-learning discovery curriculum applicable across all global boards.',
            sourceUrl: '',
            active: true,
            displayOrder: 0
          });
        }
        return parsed;
      }
    }
  } catch {
    // Fall back to defaults.
  }
  return DEFAULT_CURRICULUM_MASTER;
}

export function saveCurriculumMaster(data: CurriculumMasterData) {
  localStorage.setItem(CURRICULUM_MASTER_STORAGE_KEY, JSON.stringify(data));
}

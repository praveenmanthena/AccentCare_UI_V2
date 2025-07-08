import { ICDCode } from '../types';

export const samplePatientData = {
  name: "PHYLLIS S VAUGHAN",
  medicare: "9KU8VW3PF47",
  dob: "1/28/1949",
  gender: "FEMALE",
  address: "9307 TELSTAR DRIVE, RICHMOND, VA 23237",
  phone: "(804) 748-0535",
  physician: "RHONDA MOORE, NP",
  orderDate: "4/15/2025 12:34 PM",
  orderNumber: "12038437"
};

export const icdDatabase: ICDCode[] = [
  { code: 'I12.0', description: 'Hypertensive chronic kidney disease with stage 5 chronic kidney disease or end stage renal disease' },
  { code: 'I12.9', description: 'Hypertensive chronic kidney disease with stage 1 through stage 4 chronic kidney disease, or unspecified chronic kidney disease' },
  { code: 'I44.0', description: 'Atrioventricular block, first degree' },
  { code: 'I44.1', description: 'Atrioventricular block, second degree' },
  { code: 'I44.2', description: 'Atrioventricular block, complete' },
  { code: 'E66.9', description: 'Obesity, unspecified' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'E11.40', description: 'Type 2 diabetes mellitus with diabetic neuropathy, unspecified' },
  { code: 'I10', description: 'Essential hypertension' },
  { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery without angina pectoris' },
  { code: 'N18.6', description: 'End stage renal disease' },
  { code: 'J44.1', description: 'Chronic obstructive pulmonary disease with acute exacerbation' },
  { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified' },
  { code: 'M79.3', description: 'Panniculitis, unspecified' },
  { code: 'L89.003', description: 'Pressure ulcer of unspecified elbow, stage 3' },
  { code: 'L89.154', description: 'Pressure ulcer of sacral region, stage 4' },
  { code: 'Z51.11', description: 'Encounter for antineoplastic chemotherapy' }
];
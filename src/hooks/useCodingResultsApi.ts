import { useState, useEffect } from 'react';
import { 
  CodingResultsApiResponse, 
  ApiCodeSuggestion, 
  ApiSupportingInfo,
  CodeSuggestion, 
  SupportingSentence,
  ApiReviewStats
} from '../types';
import { apiClient } from '../services/apiClient';

export const useCodingResultsApi = (docId: string | null) => {
  const [primarySuggestions, setPrimarySuggestions] = useState<CodeSuggestion[]>([]);
  const [secondarySuggestions, setSecondarySuggestions] = useState<CodeSuggestion[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [reviewStats, setReviewStats] = useState<ApiReviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to convert 8-element bbox array to BoundingBox
  const convertBboxToBoundingBox = (bbox: number[]): { x_min: number; y_min: number; x_max: number; y_max: number } => {
    if (!bbox || bbox.length !== 8) {
      console.warn('Invalid bbox array, expected 8 elements:', bbox);
      return { x_min: 0, y_min: 0, x_max: 1, y_max: 1 };
    }

    // bbox = [min_x, min_y, max_x, min_y, max_x, max_y, min_x, max_y]
    // Extract all x and y coordinates
    const xCoords = [bbox[0], bbox[2], bbox[4], bbox[6]]; // x coordinates at indices 0, 2, 4, 6
    const yCoords = [bbox[1], bbox[3], bbox[5], bbox[7]]; // y coordinates at indices 1, 3, 5, 7

    return {
      x_min: Math.min(...xCoords),
      y_min: Math.min(...yCoords),
      x_max: Math.max(...xCoords),
      y_max: Math.max(...yCoords)
    };
  };

  // Helper function to transform API supporting info to SupportingSentence
  const transformSupportingInfo = (supportingInfo: ApiSupportingInfo[], codeId: string): SupportingSentence[] => {
    return supportingInfo.map((info, index) => ({
      text: info.supporting_sentence_in_document,
      document: info.document_name,
      page: parseInt(info.page_number),
      id: `${codeId}-${index}`,
      boundingBox: info.bbox && info.bbox.length > 0 ? convertBboxToBoundingBox(info.bbox.flat()) : undefined
    }));
  };

  // Helper function to determine status from accept_code
  const determineStatus = (acceptCode?: boolean): 'pending' | 'accepted' | 'rejected' => {
    if (acceptCode === true) {
      return 'accepted';
    } else if (acceptCode === false) {
      return 'rejected';
    } else {
      return 'pending';
    }
  };

  // Enhanced HIPPS data function with comprehensive ICD code mapping
  const getHippsData = (diagnosisCode: string): { hippsPoints: number; isHippsContributor: boolean } => {
    // Comprehensive HIPPS points mapping for ICD codes
    const hippsMapping: Record<string, number> = {
      // High-value HIPPS contributors (20+ points) - Critical conditions
      'N18.6': 28,    // End stage renal disease - Very high value
      'L89.154': 26,  // Pressure ulcer of sacral region, stage 4 - High complexity
      'L89.003': 24,  // Pressure ulcer of unspecified elbow, stage 3 - High complexity
      'I44.2': 22,    // Atrioventricular block, complete - Critical cardiac condition
      'J44.1': 20,    // COPD with acute exacerbation - High acuity respiratory

      // Medium-high value HIPPS contributors (15-19 points) - Significant conditions
      'I25.10': 18,   // Atherosclerotic heart disease - Significant cardiac
      'E11.40': 16,   // Type 2 diabetes mellitus with diabetic neuropathy - Complicated diabetes
      'I12.0': 15,    // Hypertensive chronic kidney disease with stage 5 CKD - Advanced kidney disease

      // Medium value HIPPS contributors (10-14 points) - Moderate complexity
      'I44.1': 12,    // Atrioventricular block, second degree - Moderate cardiac
      'I12.9': 11,    // Hypertensive chronic kidney disease with stage 1-4 CKD - Moderate kidney disease
      'Z51.11': 10,   // Encounter for antineoplastic chemotherapy - Cancer treatment

      // Lower value HIPPS contributors (5-9 points) - Standard conditions
      'E66.9': 8,     // Obesity, unspecified - Metabolic condition
      'F32.9': 7,     // Major depressive disorder - Mental health
      'E11.9': 6,     // Type 2 diabetes mellitus without complications - Standard diabetes
      'I44.0': 5,     // Atrioventricular block, first degree - Mild cardiac

      // Minimal value HIPPS contributors (1-4 points) - Basic conditions
      'I10': 4,       // Essential hypertension - Common condition
      'M79.3': 3,     // Panniculitis, unspecified - Minor inflammatory
      
      // Additional common ICD codes with HIPPS values
      'I50.9': 16,    // Heart failure, unspecified - Significant cardiac
      'N39.0': 8,     // Urinary tract infection - Common condition
      'K59.00': 5,    // Constipation, unspecified - GI condition
      'R50.9': 3,     // Fever, unspecified - Symptom code
      'Z87.891': 7,   // Personal history of nicotine dependence - Risk factor
      'M25.50': 6,    // Pain in unspecified joint - Musculoskeletal
      'R06.02': 9,    // Shortness of breath - Respiratory symptom
      'E78.5': 5,     // Hyperlipidemia, unspecified - Metabolic
      'G93.1': 12,    // Anoxic brain damage, not elsewhere classified - Neurological
      'I48.91': 14,   // Unspecified atrial fibrillation - Cardiac arrhythmia
      'N18.3': 13,    // Chronic kidney disease, stage 3 - Moderate kidney disease
      'E11.65': 15,   // Type 2 diabetes with hyperglycemia - Complicated diabetes
      'F03.90': 11,   // Unspecified dementia without behavioral disturbance - Cognitive
      'M06.9': 9,     // Rheumatoid arthritis, unspecified - Autoimmune
      'K21.9': 4,     // Gastro-esophageal reflux disease - GI condition
      'H25.9': 2,     // Unspecified age-related cataract - Eye condition
      'L97.909': 19,  // Non-pressure chronic ulcer - Complex wound care
      'J44.0': 17,    // COPD with acute lower respiratory infection - Respiratory
      'I25.9': 13,    // Chronic ischemic heart disease, unspecified - Cardiac
      'E11.22': 14,   // Type 2 diabetes with diabetic chronic kidney disease - Multi-system
      'F41.9': 6,     // Anxiety disorder, unspecified - Mental health
      'M79.1': 7,     // Myalgia - Musculoskeletal pain
      'R53.83': 8,    // Other fatigue - General symptom
      'Z79.4': 5,     // Long term use of insulin - Medication management
      'I25.2': 16,    // Old myocardial infarction - Previous cardiac event
      'N40.1': 6,     // Enlarged prostate with lower urinary tract symptoms - Urological
      'G47.33': 9,    // Obstructive sleep apnea - Sleep disorder
      'E11.8': 12,    // Type 2 diabetes with unspecified complications - Diabetes complications
      'I73.9': 10,    // Peripheral vascular disease, unspecified - Vascular
      'K92.2': 8,     // Gastrointestinal hemorrhage, unspecified - GI bleeding
      'R41.3': 7,     // Other amnesia - Cognitive symptom
      'M54.5': 4,     // Low back pain - Common musculoskeletal
      'R60.9': 6,     // Edema, unspecified - Fluid retention
      'I95.9': 8,     // Hypotension, unspecified - Cardiovascular
      'R50.84': 5,    // Febrile nonhemolytic transfusion reaction - Transfusion complication
      'Z51.12': 11,   // Encounter for antineoplastic immunotherapy - Cancer treatment
      'C78.00': 21,   // Secondary malignant neoplasm of unspecified lung - Metastatic cancer
      'J18.9': 12,    // Pneumonia, unspecified organism - Respiratory infection
      'A41.9': 18,    // Sepsis, unspecified organism - Severe infection
      'R57.0': 20,    // Cardiogenic shock - Critical cardiovascular
      'J96.00': 17,   // Acute respiratory failure, unspecified whether with hypoxia or hypercapnia - Critical respiratory
      'N17.9': 15,    // Acute kidney failure, unspecified - Acute renal
      'K72.90': 19,   // Hepatic failure, unspecified without coma - Liver failure
      'E87.1': 9,     // Hypo-osmolality and hyponatremia - Electrolyte imbalance
      'D62': 13,      // Acute posthemorrhagic anemia - Blood disorder
      'R65.20': 16,   // Severe sepsis without septic shock - Severe infection
      'T81.4XXA': 14, // Infection following a procedure - Post-procedural complication
      'Z93.1': 8,     // Gastrostomy status - Surgical status
      'Z99.11': 12,   // Dependence on respirator - Ventilator dependence
      'G93.40': 15,   // Encephalopathy, unspecified - Brain dysfunction
      'I46.9': 23,    // Cardiac arrest, cause unspecified - Critical cardiac event
      'R06.00': 7,    // Dyspnea, unspecified - Breathing difficulty
      'E86.0': 10,    // Dehydration - Fluid/electrolyte
      'K92.1': 11,    // Melena - GI bleeding symptom
      'R13.10': 9,    // Dysphagia, unspecified - Swallowing difficulty
      'Z87.440': 6,   // Personal history of urinary tract infections - Medical history
      'M62.81': 8,    // Muscle weakness (generalized) - Functional impairment
      'R26.2': 7,     // Difficulty in walking, not elsewhere classified - Mobility issue
      'F05': 13,      // Delirium due to known physiological condition - Acute confusion
      'G30.9': 14,    // Alzheimer's disease, unspecified - Dementia
      'I63.9': 18,    // Cerebral infarction, unspecified - Stroke
      'S72.001A': 17, // Fracture of unspecified part of neck of right femur - Hip fracture
      'M25.511': 5,   // Pain in right shoulder - Joint pain
      'R19.7': 4,     // Diarrhea, unspecified - GI symptom
      'R11.10': 3,    // Vomiting, unspecified - GI symptom
      'R51': 2,       // Headache - Common symptom
      'Z51.81': 7,    // Encounter for therapeutic drug level monitoring - Medication management
      'Z79.01': 4,    // Long term use of anticoagulants - Medication management
      'I48.0': 15,    // Paroxysmal atrial fibrillation - Cardiac arrhythmia
      'E11.69': 13,   // Type 2 diabetes with other specified complication - Diabetes complications
      'N18.4': 12,    // Chronic kidney disease, stage 4 - Advanced kidney disease
      'C80.1': 22,    // Malignant neoplasm, unspecified - Cancer diagnosis
      'J44.9': 14,    // Chronic obstructive pulmonary disease, unspecified - COPD
      'I35.0': 16,    // Nonrheumatic aortic (valve) stenosis - Valvular heart disease
      'N18.5': 14,    // Chronic kidney disease, stage 5 - End-stage kidney disease
      'E11.36': 15,   // Type 2 diabetes with diabetic cataract - Diabetes eye complication
      'I42.9': 17,    // Cardiomyopathy, unspecified - Heart muscle disease
      'G20': 16,      // Parkinson's disease - Neurodegenerative
      'F32.2': 9,     // Major depressive disorder, single episode, severe without psychotic features - Severe depression
      'I70.90': 11,   // Unspecified atherosclerosis - Vascular disease
      'E03.9': 5,     // Hypothyroidism, unspecified - Endocrine
      'K25.9': 8,     // Gastric ulcer, unspecified - GI ulcer
      'M15.9': 7,     // Polyosteoarthritis, unspecified - Joint disease
      'I21.9': 20,    // Acute myocardial infarction, unspecified - Heart attack
      'R06.03': 8,    // Acute respiratory distress - Respiratory symptom
      'E11.21': 13,   // Type 2 diabetes with diabetic nephropathy - Diabetes kidney complication
      'I13.10': 14,   // Hypertensive heart and chronic kidney disease - Multi-system hypertension
      'J43.9': 13,    // Emphysema, unspecified - Chronic lung disease
      'I27.20': 15,   // Pulmonary hypertension, unspecified - Pulmonary vascular
      'N39.3': 6,     // Stress incontinence (female) (male) - Urological
      'R33.9': 7,     // Retention of urine, unspecified - Urological symptom
      'K59.01': 4,    // Slow transit constipation - GI motility
      'R15.9': 5,     // Full incontinence of feces - GI symptom
      'F20.9': 12,    // Schizophrenia, unspecified - Severe mental illness
      'G40.909': 11,  // Epilepsy, unspecified, not intractable, without status epilepticus - Seizure disorder
      'I36.9': 14,    // Nonrheumatic tricuspid valve disorder, unspecified - Valvular disease
      'M79.89': 6,    // Other specified soft tissue disorders - Musculoskeletal
      'R94.31': 8,    // Abnormal electrocardiogram [ECG] [EKG] - Cardiac test abnormality
      'Z98.890': 7,   // Other specified postprocedural states - Post-surgical status
      'T50.901A': 10, // Poisoning by unspecified drugs, medicaments and biological substances - Drug toxicity
      'R40.20': 16,   // Unspecified coma - Altered consciousness
      'G93.89': 12,   // Other specified disorders of brain - Brain dysfunction
      'I95.1': 9,     // Orthostatic hypotension - Cardiovascular
      'R79.89': 6,    // Other specified abnormal findings of blood chemistry - Lab abnormality
      'Z87.891': 5,   // Personal history of nicotine dependence - Risk factor
      'M25.561': 4,   // Pain in right knee - Joint pain
      'R68.89': 5,    // Other general symptoms and signs - General symptom
      'Z79.82': 6,    // Long term use of aspirin - Medication management
      'I34.0': 13,    // Nonrheumatic mitral (valve) insufficiency - Valvular disease
      'E11.319': 12,  // Type 2 diabetes with unspecified diabetic retinopathy - Diabetes eye complication
      'N18.2': 10,    // Chronic kidney disease, stage 2 - Mild kidney disease
      'I25.119': 15,  // Atherosclerotic heart disease of native coronary artery - Coronary disease
      'F41.1': 7,     // Generalized anxiety disorder - Anxiety
      'M54.2': 5,     // Cervicalgia - Neck pain
      'R06.9': 6,     // Unspecified abnormalities of breathing - Respiratory symptom
      'E78.00': 4,    // Pure hypercholesterolemia, unspecified - Cholesterol
      'K30': 3,       // Functional dyspepsia - GI symptom
      'R42': 6,       // Dizziness and giddiness - Neurological symptom
      'M25.50': 5,    // Pain in unspecified joint - Joint pain
      'R50.9': 3,     // Fever, unspecified - Symptom
      'Z79.899': 5,   // Other long term drug therapy - Medication management
      'I48.2': 13,    // Chronic atrial fibrillation - Cardiac arrhythmia
      'E11.9': 6,     // Type 2 diabetes mellitus without complications - Standard diabetes
      'I70.209': 10,  // Unspecified atherosclerosis of native arteries of extremities - Peripheral vascular
      'G47.30': 8,    // Sleep apnea, unspecified - Sleep disorder
      'M06.00': 9,    // Rheumatoid arthritis without rheumatoid factor - Autoimmune
      'K21.0': 5,     // Gastro-esophageal reflux disease with esophagitis - GI inflammation
      'R73.09': 4,    // Other abnormal glucose - Glucose metabolism
      'Z87.19': 6,    // Personal history of other diseases of the circulatory system - Cardiac history
      'I25.5': 14,    // Ischemic cardiomyopathy - Ischemic heart disease
      'E11.59': 11,   // Type 2 diabetes with other circulatory complications - Diabetes vascular
      'N40.0': 5,     // Enlarged prostate without lower urinary tract symptoms - Urological
      'I73.00': 9,    // Raynaud's syndrome without gangrene - Vascular
      'K92.9': 7,     // Disease of digestive system, unspecified - GI disorder
      'R13.19': 8,    // Other dysphagia - Swallowing difficulty
      'M79.2': 6,     // Neuralgia and neuritis, unspecified - Nerve pain
      'R60.0': 7,     // Localized edema - Fluid retention
      'I95.2': 8,     // Hypotension due to drugs - Drug-induced hypotension
      'R41.0': 9,     // Disorientation, unspecified - Cognitive symptom
      'F32.1': 8,     // Major depressive disorder, single episode, moderate - Depression
      'G93.2': 11,    // Benign intracranial hypertension - Neurological
      'I70.92': 10,   // Chronic total occlusion of artery of extremity - Vascular occlusion
      'E11.44': 14,   // Type 2 diabetes with diabetic amyotrophy - Diabetes muscle complication
      'I48.1': 14,    // Persistent atrial fibrillation - Cardiac arrhythmia
      'N18.1': 8,     // Chronic kidney disease, stage 1 - Early kidney disease
      'I25.3': 16,    // Aneurysm of heart - Cardiac structural abnormality
      'E11.29': 13,   // Type 2 diabetes with other diabetic kidney complication - Diabetes kidney
      'F41.0': 6,     // Panic disorder [episodic paroxysmal anxiety] - Anxiety disorder
      'M54.6': 4,     // Pain in thoracic spine - Back pain
      'R06.02': 7,    // Shortness of breath - Respiratory symptom
      'E78.2': 5,     // Mixed hyperlipidemia - Lipid disorder
      'K59.09': 4,    // Other constipation - GI motility
      'R15.0': 6,     // Incomplete defecation - GI symptom
      'F20.0': 13,    // Paranoid schizophrenia - Severe mental illness
      'G40.911': 12,  // Epilepsy, unspecified, intractable, with status epilepticus - Severe seizure disorder
      'I36.0': 13,    // Nonrheumatic tricuspid (valve) stenosis - Valvular disease
      'M79.0': 5,     // Rheumatism, unspecified - Musculoskeletal
      'R94.39': 7,    // Other abnormal results of cardiovascular function studies - Cardiac test abnormality
      'Z98.891': 6,   // Other specified postprocedural states - Post-surgical status
      'T50.902A': 9,  // Poisoning by unspecified drugs, medicaments and biological substances - Drug toxicity
      'R40.21': 17,   // Coma scale, eyes open, never - Severe altered consciousness
      'G93.82': 11,   // Brain death - Neurological
      'I95.3': 8,     // Hypotension of hemodialysis - Treatment-related hypotension
      'R79.82': 5,    // Elevated C-reactive protein (CRP) - Inflammatory marker
      'Z87.892': 4,   // Personal history of anaphylaxis - Allergy history
      'M25.562': 4,   // Pain in left knee - Joint pain
      'R68.83': 6,    // Chills (without fever) - General symptom
      'Z79.83': 5,    // Long term use of bisphosphonates - Medication management
      'I34.1': 12,    // Nonrheumatic mitral (valve) prolapse - Valvular disease
      'E11.311': 11,  // Type 2 diabetes with unspecified diabetic retinopathy with macular edema - Diabetes eye
      'N18.30': 11,   // Chronic kidney disease, stage 3 unspecified - Moderate kidney disease
      'I25.110': 14,  // Atherosclerotic heart disease of native coronary artery with unstable angina pectoris - Unstable coronary
      'F41.8': 6,     // Other specified anxiety disorders - Anxiety
      'M54.3': 4,     // Sciatica - Nerve pain
      'R06.8': 5,     // Other abnormalities of breathing - Respiratory symptom
      'E78.01': 4,    // Familial hypercholesterolemia - Genetic cholesterol
      'K31.9': 3,     // Disease of stomach and duodenum, unspecified - GI disorder
      'R43.9': 4,     // Unspecified disturbances of smell and taste - Sensory symptom
      'M25.51': 5,    // Pain in shoulder - Joint pain
      'R50.82': 4,    // Postprocedural fever - Post-surgical fever
      'Z79.891': 4,   // Long term use of opiate analgesic - Pain medication management
      'I48.3': 12,    // Typical atrial flutter - Cardiac arrhythmia
      'E11.10': 7,    // Type 2 diabetes mellitus with ketoacidosis without coma - Diabetes complication
      'I70.201': 9,   // Unspecified atherosclerosis of native arteries of extremities, right leg - Peripheral vascular
      'G47.31': 8,    // Primary central sleep apnea - Sleep disorder
      'M06.09': 8,    // Rheumatoid arthritis without rheumatoid factor, multiple sites - Autoimmune
      'K21.00': 4,    // Gastro-esophageal reflux disease without esophagitis - GI reflux
      'R73.01': 5,    // Impaired fasting glucose - Glucose metabolism
      'Z87.11': 7,    // Personal history of pulmonary embolism - Thrombotic history
      'I25.6': 13,    // Silent myocardial ischemia - Cardiac ischemia
      'E11.51': 10,   // Type 2 diabetes mellitus with diabetic peripheral angiopathy without gangrene - Diabetes vascular
      'N40.2': 6,     // Nodular prostate without lower urinary tract symptoms - Urological
      'I73.01': 8,    // Raynaud's syndrome with gangrene - Severe vascular
      'K92.0': 9,     // Hematemesis - GI bleeding
      'R13.11': 7,    // Dysphagia, oral phase - Swallowing difficulty
      'M79.4': 5,     // Hypertrophy of (infrapatellar) fat pad - Musculoskeletal
      'R60.1': 6,     // Generalized edema - Fluid retention
      'I95.81': 7,    // Postprocedural hypotension - Post-surgical hypotension
      'R41.1': 8,     // Anterograde amnesia - Memory disorder
      'F32.0': 7,     // Major depressive disorder, single episode, mild - Mild depression
      'G93.3': 10,    // Postviral fatigue syndrome - Post-infectious syndrome
      'I70.93': 9,    // Other arteriosclerosis - Vascular disease
      'E11.43': 13,   // Type 2 diabetes mellitus with diabetic autonomic (poly)neuropathy - Diabetes nerve complication
      'I48.4': 13,    // Atypical atrial flutter - Cardiac arrhythmia
      'N18.9': 7,     // Chronic kidney disease, unspecified - Kidney disease
      'I25.4': 15,    // Coronary artery aneurysm - Coronary abnormality
      'E11.39': 12,   // Type 2 diabetes mellitus with other diabetic ophthalmic complication - Diabetes eye
      'F41.3': 5,     // Other mixed anxiety disorders - Anxiety
      'M54.4': 4,     // Lumbago with sciatica - Back and leg pain
      'R06.01': 6,    // Orthopnea - Breathing difficulty
      'E78.3': 4,     // Hyperchylomicronemia - Lipid disorder
      'K59.02': 3,    // Drug induced constipation - Medication side effect
      'R15.1': 5,     // Fecal smearing - GI symptom
      'F20.1': 12,    // Disorganized schizophrenia - Severe mental illness
      'G40.919': 11,  // Epilepsy, unspecified, intractable, without status epilepticus - Seizure disorder
      'I36.1': 12,    // Nonrheumatic tricuspid (valve) insufficiency - Valvular disease
      'M79.81': 4,    // Nontraumatic hematoma of soft tissue - Musculoskeletal
      'R94.30': 6,    // Abnormal result of cardiovascular function study, unspecified - Cardiac test
      'Z98.892': 5,   // Other specified postprocedural states - Post-surgical status
      'T50.903A': 8,  // Poisoning by unspecified drugs, medicaments and biological substances - Drug toxicity
      'R40.22': 16,   // Coma scale, eyes open, to pain - Altered consciousness
      'G93.81': 10,   // Temporal sclerosis - Neurological
      'I95.89': 7,    // Other hypotension - Cardiovascular
      'R79.83': 4,    // Abnormal findings of blood chemistry - Lab abnormality
      'Z87.893': 3,   // Personal history of other specified conditions - Medical history
      'M25.563': 4,   // Pain in bilateral knees - Joint pain
      'R68.84': 5,    // Jaw pain - Facial symptom
      'Z79.84': 4,    // Long term use of oral hypoglycemic drugs - Diabetes medication
      'I34.2': 11,    // Nonrheumatic mitral (valve) stenosis - Valvular disease
      'E11.312': 10,  // Type 2 diabetes with mild nonproliferative diabetic retinopathy with macular edema - Diabetes eye
      'N18.31': 10,   // Chronic kidney disease, stage 3a - Moderate kidney disease
      'I25.111': 13,  // Atherosclerotic heart disease of native coronary artery with angina pectoris with documented spasm - Coronary spasm
      'F41.9': 5,     // Anxiety disorder, unspecified - Anxiety
      'M54.30': 4,    // Sciatica, unspecified side - Nerve pain
      'R06.81': 4,    // Apnea, not elsewhere classified - Breathing cessation
      'E78.02': 3,    // Mixed hyperlipidemia - Lipid disorder
      'K31.89': 2,    // Other diseases of stomach and duodenum - GI disorder
      'R43.8': 3,     // Other disturbances of smell and taste - Sensory symptom
      'M25.512': 4,   // Pain in left shoulder - Joint pain
      'R50.83': 3,    // Postvaccination fever - Vaccine reaction
      'Z79.892': 3,   // Long term use of other agents affecting estrogen receptors and estrogen levels - Hormone therapy
    };

    const hippsPoints = hippsMapping[diagnosisCode] || 0;
    const isHippsContributor = hippsPoints > 0;

    return { hippsPoints, isHippsContributor };
  };

  // Helper function to transform API code suggestion to CodeSuggestion
  const transformApiCodeSuggestion = (apiCode: ApiCodeSuggestion, isPrimary: boolean): CodeSuggestion => {
    // Use API code_id if available, otherwise generate one
    const codeId = apiCode.code_id || `${apiCode.diagnosis_code}-${apiCode.rank}-${isPrimary ? 'primary' : 'secondary'}`;
    
    // Get HIPPS data for this specific ICD code
    const { hippsPoints, isHippsContributor } = getHippsData(apiCode.diagnosis_code);
    
    return {
      id: codeId,
      apiCodeId: apiCode.code_id,
      code: apiCode.diagnosis_code,
      description: apiCode.disease_description,
      confidence: 1.0, // *Placeholder - not provided by API
      hippsPoints: hippsPoints, // Now using comprehensive simulated data
      status: determineStatus(apiCode.accept_code),
      isHippsContributor: isHippsContributor, // Now using comprehensive simulated data
      isManuallyAdded: apiCode.code_type === 'HUMAN',
      aiReasoning: apiCode.reason_for_coding,
      supportingSentences: transformSupportingInfo(apiCode.supporting_info, codeId),
      addedTimestamp: apiCode.created_at ? new Date(apiCode.created_at).toLocaleString() : undefined,
      order: apiCode.rank - 1, // Convert 1-based rank to 0-based order
      // Additional fields from API response
      activeDiseaseAsOfJune2025: apiCode.active_disease_asof_1june2025,
      supportingSentenceForActiveDisease: apiCode.supporting_sentence_for_active_disease,
      activeManagementAsOfJune2025: apiCode.active_management_asof_1june2025,
      supportingSentenceForActiveManagement: apiCode.supporting_sentence_for_active_management,
      updatedAt: apiCode.updated_at,
      lastReorderedBy: apiCode.last_reordered_by,
      consideredButExcluded: apiCode.considered_but_excluded,
      reasonForExclusion: apiCode.reason_for_exclusion
    };
  };

  // Helper function to transform API comments to frontend Comment format
  const transformApiComments = (apiComments: ApiComment[] = []): Comment[] => {
    return apiComments
      .map((apiComment, index) => ({
      id: apiComment.comment_id || `comment-${index}`,
      text: apiComment.comment,
      user: apiComment.user,
      timestamp: apiComment.timestamp
    }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort latest first
  };

  // Fetch coding results from API
  const fetchCodingResults = async (docId: string) => {
    try {
      setLoading(true);
      setError(null);

      const data: CodingResultsApiResponse = await apiClient.get(`/coding-results/${docId}`);
      
      // Transform primary codes
      const transformedPrimary = data.results.primary_codes
        .filter(code => !code.deleted)
        .map(code => transformApiCodeSuggestion(code, true))
        .sort((a, b) => a.order - b.order);

      // Transform secondary codes
      const transformedSecondary = data.results.secondary_codes
        .filter(code => !code.deleted)
        .map(code => transformApiCodeSuggestion(code, false))
        .sort((a, b) => a.order - b.order);

      setPrimarySuggestions(transformedPrimary);
      setSecondarySuggestions(transformedSecondary);

      // Extract and transform comments from API response
      const allComments: Record<string, Comment[]> = {};
      
      // Process primary codes comments
      data.results.primary_codes.forEach(code => {
        if (code.comments && code.comments.length > 0) {
          const codeId = code.code_id || `${code.diagnosis_code}-${code.rank}-primary`;
          allComments[codeId] = transformApiComments(code.comments);
        }
      });
      
      // Process secondary codes comments
      data.results.secondary_codes.forEach(code => {
        if (code.comments && code.comments.length > 0) {
          const codeId = code.code_id || `${code.diagnosis_code}-${code.rank}-secondary`;
          allComments[codeId] = transformApiComments(code.comments);
        }
      });

      setComments(allComments);
      setReviewStats(data.review_stats);
    } catch (err) {
      console.error('Error fetching coding results:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch coding results');
      
      // Fallback to empty state on error
      setPrimarySuggestions([]);
      setSecondarySuggestions([]);
      setComments({});
      setReviewStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (docId) {
      fetchCodingResults(docId);
    } else {
      setPrimarySuggestions([]);
      setSecondarySuggestions([]);
      setComments({});
      setReviewStats(null);
      setLoading(false);
      setError(null);
    }
  }, [docId]);

  return {
    primarySuggestions,
    secondarySuggestions,
    comments,
    reviewStats,
    loading,
    error,
    refetch: () => docId && fetchCodingResults(docId)
  };
};
export interface SampleInput {
  id: string;
  label: string;
  text: string;
}

export const SAMPLE_INPUTS: SampleInput[] = [
  {
    id: "simple-case",
    label: "Simple Case",
    text: "Patient is a 34-year-old male presenting with a 3-day history of sore throat, mild fever (38.1°C), and fatigue. No cough or shortness of breath. Throat is erythematous with no exudate. Tonsils mildly enlarged. No lymphadenopathy. Rapid strep test negative. Assessment: viral pharyngitis. Plan: supportive care, rest, fluids, acetaminophen PRN for fever and pain. Follow up if symptoms worsen or persist beyond 7 days.",
  },
  {
    id: "moderate-case",
    label: "Moderate Case",
    text: "58-year-old female with a history of type 2 diabetes and hypertension presenting for follow-up. Reports increased thirst and urinary frequency over the past 2 weeks. BP today 148/92. Weight up 4 lbs since last visit. HbA1c from last month was 8.4%. Current meds: metformin 1000mg BID, lisinopril 10mg daily. Fasting glucose this morning was 187. Exam unremarkable except for mild bilateral pitting edema. Plan: increase lisinopril to 20mg daily, add SGLT2 inhibitor, dietary counseling referral, recheck labs in 6 weeks.",
  },
  {
    id: "mild-ambiguity",
    label: "Mild Ambiguity",
    text: "Patient came in complaining of chest discomfort and some shortness of breath. Says it started a couple days ago, maybe after moving furniture. Pain is described as dull, rated 4/10, seems worse when taking deep breaths. No radiation to the arm or jaw. History of anxiety. EKG done in office — looked okay I think. Not sure if cardiac or musculoskeletal. Will order troponin and chest X-ray. Told patient to come back or go to ER if it gets worse.",
  },
  {
    id: "incomplete-info",
    label: "Incomplete Info",
    text: "Pt here for knee pain. Right knee, worse going down stairs. Started a few weeks back. Takes ibuprofen sometimes. Exam shows tenderness along medial joint line. McMurray's — not documented. X-ray ordered. Refer to ortho if no improvement.",
  },
  {
    id: "highly-ambiguous",
    label: "Highly Ambiguous",
    text: "Came in not feeling well. Tired all the time, some GI stuff, maybe headaches. Unsure when it started. No real PMH that they can remember. Not on any meds they think, maybe something for sleep. Exam was largely unremarkable. Will run some basic labs and go from there. Follow up in a few weeks.",
  },
];

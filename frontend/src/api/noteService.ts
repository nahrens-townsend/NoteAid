export interface NoteResponse {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  confidence: number;
  flags: string[];
}

export async function generateNote(rawInput: string): Promise<NoteResponse> {
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const response = await fetch(`${apiBaseUrl}/api/v1/generate-note`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw_input: rawInput }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.error || `Request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<NoteResponse>;
}

export function formatSOAPText(fields: Pick<NoteResponse, "subjective" | "objective" | "assessment" | "plan">): string {
  return `Subjective:\n${fields.subjective}\n\nObjective:\n${fields.objective}\n\nAssessment:\n${fields.assessment}\n\nPlan:\n${fields.plan}`;
}

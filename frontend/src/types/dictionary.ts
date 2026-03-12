export interface WordResponse {
  id: number;
  word: string;
  transcription: string;
  part_of_speech: string;
  definitions: string[];
  examples: string[];
  synonyms: string[];
  tags: string[];
  created_at: string;
}

export interface Recording {
  id: string;
  name: string;
  uri: string;
  duration: number;
  date: Date;
  transcription?: Transcription;
  labels: string[];
}

export interface TranscriptionSegment {
  timestamp: string;
  speaker: string;
  text: string;
}

export interface Transcription {
  text: string;
  segments: TranscriptionSegment[];
  speakerCount: number;
  duration: number;
}

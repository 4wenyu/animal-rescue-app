// Shared roster types for the home page islands (mirrors data/dogs.json).
export type EuthanasiaRisk = "SAFE" | "AT_RISK" | "IMMEDIATE_BEHAVIORAL";

export type Dog = {
  id: number;
  name: string;
  breed: string;
  age: number;
  medicalStatus: string;
  euthanasia_risk_status: EuthanasiaRisk;
  statutoryHoldCleared: boolean;
  intakeTimestamp: string;
  strayHoldExpiresAt?: string;
  imageUrl?: string;
  sex?: "Male" | "Female";
  personality?: string;
};

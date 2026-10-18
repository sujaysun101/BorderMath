export type Transport = "air" | "land" | "sea";

export type Leg = {
  id: string;
  countryCode: string;
  entryDate: string;
  exitDate: string;
  transport: Transport;
  sortOrder: number;
};

export type Trip = {
  id: string;
  userId: string;
  name: string;
  citizenship: string;
  notes: string;
  legs: Leg[];
  createdAt: string;
};

export type Profile = {
  userId: string;
  displayName: string;
  citizenships: string[];
  passportExpiry: string | null;
  passportAlertMonths: number;
};

export type VisaDoc = {
  id: string;
  userId: string;
  countryCode: string;
  visaType: string;
  expiryDate: string;
  notes: string;
};

export type StoreMode = "postgres" | "memory";

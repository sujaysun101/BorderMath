import type { Profile, StoreMode, Trip, VisaDoc } from "@/lib/types";

export interface Store {
  mode: StoreMode;
  listTrips(userId: string): Promise<Trip[]>;
  getTrip(userId: string, id: string): Promise<Trip | null>;
  saveTrip(userId: string, trip: Trip): Promise<Trip>;
  deleteTrip(userId: string, id: string): Promise<void>;
  getProfile(userId: string): Promise<Profile>;
  saveProfile(userId: string, profile: Profile): Promise<Profile>;
  listVisas(userId: string): Promise<VisaDoc[]>;
  saveVisa(userId: string, visa: VisaDoc): Promise<VisaDoc>;
  deleteVisa(userId: string, id: string): Promise<void>;
  loadSample(userId: string): Promise<void>;
}

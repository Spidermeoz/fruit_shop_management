import type { NutritionReferenceSource } from "./types";

export interface NutritionReferenceSourceRepository {
  findById(id: number): Promise<NutritionReferenceSource | null>;
  findByCode(code: string): Promise<NutritionReferenceSource | null>;
  listActive(): Promise<NutritionReferenceSource[]>;
}

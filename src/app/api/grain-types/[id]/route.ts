import GrainType from "@/models/GrainType";
import { makeCatalogItemHandlers } from "@/lib/catalog-handlers";

export const { PATCH } = makeCatalogItemHandlers(GrainType);

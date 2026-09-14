import GrainType from "@/models/GrainType";
import { makeCatalogListCreateHandlers } from "@/lib/catalog-handlers";

export const { GET, POST } = makeCatalogListCreateHandlers(GrainType);

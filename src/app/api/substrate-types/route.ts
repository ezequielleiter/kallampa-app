import SubstrateType from "@/models/SubstrateType";
import { makeCatalogListCreateHandlers } from "@/lib/catalog-handlers";

export const { GET, POST } = makeCatalogListCreateHandlers(SubstrateType);

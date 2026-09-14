import SubstrateType from "@/models/SubstrateType";
import { makeCatalogItemHandlers } from "@/lib/catalog-handlers";

export const { PATCH } = makeCatalogItemHandlers(SubstrateType);

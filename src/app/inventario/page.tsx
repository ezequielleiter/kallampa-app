"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageContainer, PageHeader } from "@/components/kallampa/PageHeader";
import { FungusTypeTable } from "@/components/catalogs/FungusTypeTable";
import { CatalogTable } from "@/components/catalogs/CatalogTable";

export default function CatalogosPage() {
  const t = useTranslations("pages.catalogos");
  return (
    <PageContainer>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Tabs defaultValue="hongos" className="gap-3.5">
        <TabsList>
          <TabsTrigger value="hongos">{t("tabHongos")}</TabsTrigger>
          <TabsTrigger value="granos">{t("tabGranos")}</TabsTrigger>
          <TabsTrigger value="sustratos">{t("tabSustratos")}</TabsTrigger>
        </TabsList>
        <TabsContent value="hongos">
          <FungusTypeTable />
        </TabsContent>
        <TabsContent value="granos">
          <CatalogTable endpoint="/api/grain-types" itemLabel="grano" />
        </TabsContent>
        <TabsContent value="sustratos">
          <CatalogTable endpoint="/api/substrate-types" itemLabel="sustrato" />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

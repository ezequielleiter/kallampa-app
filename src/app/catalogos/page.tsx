"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { FungusTypeTable } from "@/components/catalogs/FungusTypeTable";
import { CatalogTable } from "@/components/catalogs/CatalogTable";

export default function CatalogosPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">Catálogos</h1>
      <Tabs defaultValue="hongos">
        <TabsList variant="line">
          <TabsTrigger value="hongos">Hongos</TabsTrigger>
          <TabsTrigger value="granos">Granos</TabsTrigger>
          <TabsTrigger value="sustratos">Sustratos</TabsTrigger>
        </TabsList>
        <TabsContent value="hongos">
          <Card>
            <CardContent>
              <FungusTypeTable />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="granos">
          <Card>
            <CardContent>
              <CatalogTable endpoint="/api/grain-types" itemLabel="grano" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sustratos">
          <Card>
            <CardContent>
              <CatalogTable endpoint="/api/substrate-types" itemLabel="sustrato" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

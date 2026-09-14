"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BatchHeader } from "@/components/batch/BatchHeader";
import { JarsGrid } from "@/components/batch/JarsGrid";
import { RecipientesTable } from "@/components/batch/RecipientesTable";
import { FructificacionSection } from "@/components/batch/FructificacionSection";
import { CosechaSection } from "@/components/batch/CosechaSection";
import { apiFetch } from "@/lib/api-client";
import {
  alertasBatch,
  costoProduccionBatch,
  eficienciaBiologicaBatch,
  estadoDerivadoBatch,
  pesoTotalCosechado,
} from "@/lib/recipiente-utils";
import type { BatchDetail } from "@/lib/types";

export default function BatchDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const data = await apiFetch<BatchDetail>(`/api/batches/${params.id}`);
      setBatch(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cargar el lote");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  if (loading) {
    return <p className="p-4 text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!batch) {
    return <p className="p-4 text-sm text-muted-foreground">Lote no encontrado.</p>;
  }

  const { jars, recipientes } = batch;
  const estadoDerivado = estadoDerivadoBatch(jars, recipientes);
  const alertas = alertasBatch(recipientes);
  const pesoTotal = pesoTotalCosechado(recipientes);
  const eficienciaBiologica = eficienciaBiologicaBatch(recipientes);
  const costoProduccion = costoProduccionBatch(batch, recipientes);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push("/")}>
        ← Volver a lotes
      </Button>

      <BatchHeader
        batch={batch}
        estadoDerivado={estadoDerivado}
        alertas={alertas}
        pesoTotalCosechado={pesoTotal}
        eficienciaBiologica={eficienciaBiologica}
        costoProduccion={costoProduccion}
      />

      <Card>
        <CardHeader>
          <CardTitle>1. Inoculación en grano</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Grano</span>
              <span className="font-medium">
                {typeof batch.inoculacionGrano.tipoGranoId === "object"
                  ? batch.inoculacionGrano.tipoGranoId.nombre
                  : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Peso</span>
              <span className="font-medium">{batch.inoculacionGrano.pesoGranoKg} kg</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Precio por kg</span>
              <span className="font-medium">${batch.inoculacionGrano.precioPorKg}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Frascos</span>
              <span className="font-medium">{batch.inoculacionGrano.cantidadFrascos}</span>
            </div>
          </div>
          <JarsGrid jars={jars} onChanged={cargar} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Incubación</CardTitle>
        </CardHeader>
        <CardContent>
          <RecipientesTable
            batchId={batch._id}
            fungusType={batch.fungusTypeId}
            recipientes={recipientes}
            onChanged={cargar}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Fructificación</CardTitle>
        </CardHeader>
        <CardContent>
          <FructificacionSection
            fungusType={batch.fungusTypeId}
            recipientes={recipientes}
            onChanged={cargar}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Cosecha</CardTitle>
        </CardHeader>
        <CardContent>
          <CosechaSection recipientes={recipientes} onChanged={cargar} />
        </CardContent>
      </Card>
    </div>
  );
}

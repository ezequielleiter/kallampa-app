"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import type { FungusType } from "@/lib/types";
import { FungusTypeFormDialog } from "./FungusTypeFormDialog";

export function FungusTypeTable() {
  const [items, setItems] = useState<FungusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogTarget, setDialogTarget] = useState<FungusType | "new" | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<FungusType[]>("/api/fungus-types");
      setItems(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cargar el catálogo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  async function toggleActivo(item: FungusType) {
    try {
      await apiFetch(`/api/fungus-types/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo: !item.activo }),
      });
      toast.success(item.activo ? "Desactivado" : "Activado");
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogTarget("new")}>
          <Plus /> Nuevo hongo
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay registros todavía.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Días esperados (Grano / Sustrato / Fruct. / Cosecha)</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell className="font-medium">
                  {item.nombre}
                  {item.nombreCientifico && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({item.nombreCientifico})
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.diasEsperadosDefault.inoculacionGrano} / {" "}
                  {item.diasEsperadosDefault.crecimientoSustrato} / {" "}
                  {item.diasEsperadosDefault.fructificacion} / {" "}
                  {item.diasEsperadosDefault.cosecha}
                </TableCell>
                <TableCell>
                  <Badge variant={item.activo ? "default" : "secondary"}>
                    {item.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => setDialogTarget(item)}>
                    <Pencil />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleActivo(item)}>
                    {item.activo ? "Desactivar" : "Activar"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {dialogTarget && (
        <FungusTypeFormDialog
          key={dialogTarget === "new" ? "new" : dialogTarget._id}
          open={!!dialogTarget}
          onOpenChange={(open) => {
            if (!open) setDialogTarget(null);
          }}
          fungusType={dialogTarget === "new" ? undefined : dialogTarget}
          onSuccess={cargar}
        />
      )}
    </div>
  );
}

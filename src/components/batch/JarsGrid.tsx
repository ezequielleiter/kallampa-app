"use client";

import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JAR_ESTADOS, JAR_ESTADO_LABELS, type JarEstado } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import type { Jar } from "@/lib/types";

interface JarsGridProps {
  jars: Jar[];
  onChanged: () => void;
}

export function JarsGrid({ jars, onChanged }: JarsGridProps) {
  async function handleEstadoChange(jarId: string, estado: JarEstado) {
    try {
      await apiFetch(`/api/jars/${jarId}`, {
        method: "PATCH",
        body: JSON.stringify({ estado }),
      });
      toast.success("Frasco actualizado");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el frasco");
    }
  }

  if (jars.length === 0) {
    return <p className="text-sm text-muted-foreground">Este lote no tiene frascos.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>N° de guía</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jars.map((jar) => (
          <TableRow key={jar._id}>
            <TableCell className="font-medium">{jar.numeroGuia}</TableCell>
            <TableCell>
              <Select
                items={JAR_ESTADOS.map((estado) => ({
                  label: JAR_ESTADO_LABELS[estado],
                  value: estado,
                }))}
                value={jar.estado}
                onValueChange={(v) => handleEstadoChange(jar._id, v as JarEstado)}
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JAR_ESTADOS.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {JAR_ESTADO_LABELS[estado]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

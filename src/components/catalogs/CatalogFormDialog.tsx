"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/kallampa/Field";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import { translateErrorMessage } from "@/lib/error-messages";
import {
  catalogCreateSchema,
  type CatalogCreateInput,
} from "@/lib/validations/catalog.schema";

export interface CatalogItem {
  _id: string;
  nombre: string;
  notas?: string;
  activo: boolean;
}

interface CatalogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint: string;
  item?: CatalogItem;
  onSuccess: () => void;
}

// Crea o edita un registro de catalogo "simple" (GrainType / SubstrateType):
// {nombre, notas?, activo}. No hay DELETE fisico; activo se togglea desde la
// tabla, no desde este dialogo.
export function CatalogFormDialog({
  open,
  onOpenChange,
  endpoint,
  item,
  onSuccess,
}: CatalogFormDialogProps) {
  const t = useTranslations("components.catalogFormDialog");
  const tCommon = useTranslations("common");
  const isEdit = !!item;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CatalogCreateInput>({
    resolver: zodResolver(catalogCreateSchema),
    defaultValues: {
      nombre: item?.nombre ?? "",
      notas: item?.notas ?? "",
    },
  });

  async function onSubmit(data: CatalogCreateInput) {
    try {
      if (isEdit && item) {
        await apiFetch(`${endpoint}/${item._id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        toast.success(t("updatedMessage"));
      } else {
        await apiFetch(endpoint, {
          method: "POST",
          body: JSON.stringify(data),
        });
        toast.success(t("createdMessage"));
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-3.5" onSubmit={handleSubmit(onSubmit)}>
          <Field
            label={t("nombre")}
            error={errors.nombre ? translateErrorMessage(errors.nombre.message) : undefined}
          >
            <Input {...register("nombre")} />
          </Field>
          <Field label={t("notas")}>
            <Textarea {...register("notas")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t("guardar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

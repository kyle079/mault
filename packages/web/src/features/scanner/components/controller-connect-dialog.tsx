import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const connectionSchema = z.object({
  url: z.url().refine((value) => {
    const url = new URL(value);
    return ["ws:", "wss:"].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
  }, "Use a ws:// or wss:// address without credentials or query parameters"),
  token: z.string().min(32),
});

export function ControllerConnectDialog({ open, onOpenChange, onUsb, onPi }: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onUsb: () => Promise<void>;
  onPi: (url: string, token: string) => Promise<void>;
}) {
  const { t } = useTranslation("scanner");
  const { register, handleSubmit, setError, resetField, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(connectionSchema),
    defaultValues: { url: "wss://mault-pi.local/", token: "" },
  });
  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (isSubmitting) return;
      if (!value) resetField("token");
      onOpenChange(value);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("piController.title")}</DialogTitle>
          <DialogDescription>{t("piController.description")}</DialogDescription>
        </DialogHeader>
        <Button disabled={isSubmitting || !navigator.serial} variant="outline" onClick={async () => {
          await onUsb();
          resetField("token");
          onOpenChange(false);
        }}>{t("piController.usb")}</Button>
        <form className="space-y-3" onSubmit={handleSubmit(async ({ url, token }) => {
          try {
            await onPi(url, token);
            resetField("token");
            onOpenChange(false);
          } catch (error) {
            setError("root", { message: error instanceof Error ? error.message : t("piController.failed") });
          }
        })}>
          <label className="block space-y-1">
            <span>{t("piController.address")}</span>
            <Input {...register("url")} placeholder="wss://mault-pi.example/" autoComplete="off" />
          </label>
          {errors.url && <p role="alert" className="text-sm text-destructive">{t("piController.invalidAddress")}</p>}
          <label className="block space-y-1">
            <span>{t("piController.token")}</span>
            <Input {...register("token")} type="password" autoComplete="off" />
          </label>
          {errors.token && <p role="alert" className="text-sm text-destructive">{t("piController.invalidToken")}</p>}
          {errors.root && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}
          <Button type="submit" disabled={isSubmitting}>{t(isSubmitting ? "piController.connecting" : "piController.connect")}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

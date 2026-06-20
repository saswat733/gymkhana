import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { createZone, getQrSetup, updateZone } from "../features/attendanceZones/zones.api";

export function AttendanceSetupPage() {
  const qc = useQueryClient();
  const [zoneName, setZoneName] = useState("");

  const setupQ = useQuery({ queryKey: ["attendance-zones", "qr-setup"], queryFn: getQrSetup });

  const createMut = useMutation({
    mutationFn: () => createZone({ name: zoneName.trim() }),
    onSuccess: async () => {
      toast.success("Zone created");
      setZoneName("");
      await qc.invalidateQueries({ queryKey: ["attendance-zones"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateZone(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance-zones"] }),
  });

  const qrCodes = setupQ.data?.qrCodes ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Attendance QR setup</h1>
        <p className="text-sm text-muted-foreground">
          Print gym QR codes at entrance, reception, or zones. Members scan to check in — no staff needed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add zone</CardTitle>
          <CardDescription>Main entrance is created automatically. Add cardio, weights, pool, etc.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="Zone name (e.g. Cardio Zone)" value={zoneName} onChange={(e) => setZoneName(e.target.value)} />
          <Button onClick={() => createMut.mutate()} disabled={!zoneName.trim() || createMut.isPending}>
            Add zone
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {setupQ.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading QR codes…</div>
        ) : (
          qrCodes.map((qr) => (
            <Card key={qr.zoneId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{qr.zoneName}</CardTitle>
                <CardDescription>{qr.isDefault ? "Default entrance" : "Zone QR"}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3">
                <QRCodeSVG value={qr.payload} size={180} />
                <code className="max-w-full break-all text-center text-[10px] text-muted-foreground">{qr.payload}</code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(qr.payload);
                    toast.success("QR payload copied");
                  }}
                >
                  Copy payload
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(setupQ.data?.zones ?? []).map((z) => (
            <div key={z.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
              <span>{z.name}</span>
              <Button size="sm" variant="outline" onClick={() => toggleMut.mutate({ id: z.id, isActive: !z.isActive })}>
                {z.isActive ? "Disable" : "Enable"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

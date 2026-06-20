import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      toastOptions={{
        style: { borderRadius: 12 },
      }}
    />
  );
}


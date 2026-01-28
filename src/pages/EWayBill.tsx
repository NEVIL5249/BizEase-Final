import { FileCheck, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EWayBill() {
  return (
    <div className="flex h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Truck className="h-8 w-8 text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-foreground">
          E-Way Bill Integration
        </h1>

        {/* Description */}
        <p className="mt-2 text-sm text-muted-foreground">
          Government-compliant E-Way Bill generation and management is coming
          soon to BizEase.
        </p>

        {/* Highlights */}
        <div className="mt-6 space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Direct integration with GST portal
          </div>
          <div className="flex items-center justify-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            Generate E-Way Bills for transport
          </div>
          <div className="flex items-center justify-center gap-2">
            <FileCheck className="h-4 w-4 text-primary" />
            Auto-sync from invoices
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6">
          <Button variant="outline" disabled>
            Coming Soon 🚧
          </Button>
        </div>
      </div>
    </div>
  );
}

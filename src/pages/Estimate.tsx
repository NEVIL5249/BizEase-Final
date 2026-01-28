import { FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Estimate() {
  return (
    <div className="flex h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <FileText className="h-8 w-8 text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-foreground">
          Estimates Coming Soon
        </h1>

        {/* Description */}
        <p className="mt-2 text-sm text-muted-foreground">
          We’re working on a powerful estimate & quotation feature to help you
          create, send, and manage estimates effortlessly.
        </p>

        {/* Features preview */}
        <div className="mt-6 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Professional estimate templates
          </div>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Convert estimate → invoice
          </div>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            GST-ready & client-friendly
          </div>
        </div>

        {/* Action */}
        <div className="mt-6">
          <Button variant="outline" disabled>
            Launching Soon 🚀
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Grid3X3 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ToothChartPlaceholder() {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Grid3X3 className="h-4 w-4" />
          Tooth Chart
        </CardTitle>
        <CardDescription className="text-xs">
          Interactive odontogram will plug in here
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed bg-muted/30 p-4 text-center"
          aria-label="Tooth chart reserved area"
        >
          <p className="text-xs text-muted-foreground">
            Reserved panel for the interactive tooth chart module
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

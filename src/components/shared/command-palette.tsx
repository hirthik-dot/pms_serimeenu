'use client';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

interface CommandPaletteSkeletonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPaletteSkeleton({ open, onOpenChange }: CommandPaletteSkeletonProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search patients, appointments, invoices..." disabled />
      <CommandList>
        <CommandEmpty>Global search will be available in a future release.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem disabled>Dashboard</CommandItem>
          <CommandItem disabled>Patients</CommandItem>
          <CommandItem disabled>Appointments</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem disabled>New Patient</CommandItem>
          <CommandItem disabled>New Appointment</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

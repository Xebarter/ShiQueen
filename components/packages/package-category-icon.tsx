import {
  Baby,
  Bath,
  Briefcase,
  Cake,
  Crown,
  Droplets,
  Gem,
  Gift,
  GraduationCap,
  HeartPulse,
  Scissors,
  Shirt,
  Sparkles,
  Star,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import type { PackageCategoryId } from '@/lib/package-catalog';
import { getPackageCategory } from '@/lib/package-catalog';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  scissors: Scissors,
  droplets: Droplets,
  'heart-pulse': HeartPulse,
  cake: Cake,
  gift: Gift,
  gem: Gem,
  bath: Bath,
  shirt: Shirt,
  crown: Crown,
  baby: Baby,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  sun: Sun,
  star: Star,
};

interface PackageCategoryIconProps {
  categoryId?: PackageCategoryId | string;
  className?: string;
}

export function PackageCategoryIcon({ categoryId, className }: PackageCategoryIconProps) {
  const iconName = getPackageCategory(categoryId)?.icon ?? 'sparkles';
  const Icon = ICON_MAP[iconName] ?? Sparkles;
  return <Icon className={cn('h-4 w-4', className)} />;
}

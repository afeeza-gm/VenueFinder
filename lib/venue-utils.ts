export interface ZoneConfig {
  id: string;
  code: string;
  title: string;
  shortLabel: string;
  badgeClass: string;
  pillClass: string;
  accentBg: string;
}

export function getVenueZone(venue: {
  id: string;
  location?: string;
  name?: string;
  address?: string;
}): ZoneConfig {
  const loc = `${venue.id} ${venue.name || ''} ${venue.location || ''} ${venue.address || ''}`.toLowerCase();

  if (
    loc.includes('ansariya') ||
    loc.includes('kvg') ||
    loc.includes('sullia') ||
    loc.includes('navoor') ||
    loc.includes('aletty')
  ) {
    return {
      id: 'ZONE_A',
      code: 'Sullia',
      title: 'Sullia',
      shortLabel: 'Sullia',
      badgeClass: 'bg-neutral-100 text-neutral-800 border-neutral-200',
      pillClass: 'bg-neutral-900 text-white',
      accentBg: 'bg-neutral-50',
    };
  }

  if (
    loc.includes('okkaliga') ||
    loc.includes('havyaka') ||
    loc.includes('puttur') ||
    loc.includes('tenkila') ||
    loc.includes('bannur')
  ) {
    return {
      id: 'ZONE_B',
      code: 'Puttur',
      title: 'Puttur',
      shortLabel: 'Puttur',
      badgeClass: 'bg-neutral-100 text-neutral-800 border-neutral-200',
      pillClass: 'bg-neutral-900 text-white',
      accentBg: 'bg-neutral-50',
    };
  }

  if (
    loc.includes('janapriya') ||
    loc.includes('indian') ||
    loc.includes('sagar') ||
    loc.includes('netlamudnur') ||
    loc.includes('neralkatte') ||
    loc.includes('panemangalore') ||
    loc.includes('narikombu') ||
    loc.includes('mani') ||
    loc.includes('bantwal') ||
    loc.includes('highway')
  ) {
    return {
      id: 'ZONE_C',
      code: 'Bantwal',
      title: 'Bantwal & Highway',
      shortLabel: 'Bantwal',
      badgeClass: 'bg-neutral-100 text-neutral-800 border-neutral-200',
      pillClass: 'bg-neutral-900 text-white',
      accentBg: 'bg-neutral-50',
    };
  }

  return {
    id: 'ZONE_D',
    code: 'Mangalore',
    title: 'Mangalore',
    shortLabel: 'Mangalore',
    badgeClass: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    pillClass: 'bg-neutral-900 text-white',
    accentBg: 'bg-neutral-50',
  };
}

export function formatImageUrl(url?: string): string {
  if (!url) {
    return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop';
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    return url;
  }
  return `/${url}`;
}

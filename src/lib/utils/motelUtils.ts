import type { MotelDetailDto } from '$lib/types/motel';

export function normalizeMotel(m: any): MotelDetailDto {
  // map backend fields to the FE names expected by the template
  m.motelStaySlots = m.motelStaySlots ?? m.generalStaySlots ?? [];
  m.overnightInfo  = m.overnightInfo  ?? m.generalOvernightInfos ?? [];

  // normalize a telephone we can use in JSON-LD + clickable UI
  const rawTel = m.contactMethods?.find((val: string) =>
          typeof val === 'string' && (val.startsWith('tel:') || /^\+?\d[\d\s\-().]+$/.test(val))
  );
  const tel = rawTel
          ? (rawTel.startsWith('tel:') ? rawTel : `tel:${rawTel.replace(/[^\d+]/g,'')}`)
          : undefined;

  m.__telephone = tel; // stash for JSON-LD and UI
  return m as MotelDetailDto;
}

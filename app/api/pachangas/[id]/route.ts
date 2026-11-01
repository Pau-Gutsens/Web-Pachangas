import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function PATCH(request: Request) {
  const body = await request.json();
  const id = body.id;

  // Handle status update
  if (body.status) {
    await db.updatePachangaStatus(id, body.status);
  }

  // Handle attendee addition
  if (body.attendee) {
    await db.addAttendee(body.pachangaId, body.attendee.memberId, body.attendee.guestId, body.attendee.team);
  }

  const pachangas = await db.getPachangas();
  const p = pachangas.find(p => p.id === id);
  return NextResponse.json(p);
}

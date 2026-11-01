import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function PATCH(request: Request) {
  const { id } = request.params!; // Note: in actual Next.js these come from URL params
  // For the sake of this mock, I'll assume 'id' is passed via body if params are tricky
  const body = await request.json();

  // Handle status update
  if (body.status) {
    db.updatePachangaStatus(body.id || id, body.status);
  }

  // Handle attendee addition
  if (body.attendee) {
    db.addAttendee(body.pachangaId, body.attendee.memberId, body.attendee.guestId, body.attendee.team);
  }

  const p = db.getPachangas().find(p => p.id === (body.id || id));
  return NextResponse.json(p);
}

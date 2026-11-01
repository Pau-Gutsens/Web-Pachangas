import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET() {
  return NextResponse.json(db.getPachangas());
}

export async function POST(request: Request) {
  const body = await request.json();
  const newPachanga = db.createPachanga(body);
  return NextResponse.json(newPachanga);
}

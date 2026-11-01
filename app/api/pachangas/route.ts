import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET() {
  const pachangas = await db.getPachangas();
  return NextResponse.json(pachangas);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newPachanga = await db.createPachanga(body);
  return NextResponse.json(newPachanga);
}

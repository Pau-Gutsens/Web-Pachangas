import { NextResponse } from 'next/server';
import { egolDb } from '../../../../lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const matches = await egolDb.getMatches();
  const match = matches.find(m => m.id === params?.id);
  return NextResponse.json(match || null);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const id = body.id || params?.id;
    const matches = await egolDb.getMatches();
    const p = matches.find(m => m.id === id);
    return NextResponse.json(p || null);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}


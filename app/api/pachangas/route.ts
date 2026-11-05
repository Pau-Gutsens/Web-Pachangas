import { NextResponse } from 'next/server';
import { egolDb } from '../../../lib/db';

export async function GET() {
  const matches = egolDb.getMatches();
  return NextResponse.json(matches);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newMatch = egolDb.createMatch({
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      format: body.format || 5
    });
    return NextResponse.json(newMatch);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}


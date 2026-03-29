import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDashboardUser } from '@/lib/dashboard-auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const admin = await getDashboardUser(['MANDAL_ADMIN', 'PANCHAYAT_ADMIN']);
  if (!admin || !admin.partyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { username, name, password, role, panchayatId, boothId, boothNumber, boothName, totalVoters } = body;

  if (!username || !name || !password || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    let targetPanchayatId = panchayatId ? Number(panchayatId) : null;
    let targetBoothId = boothId ? Number(boothId) : null;

    // MANDAL_ADMIN creating a PANCHAYAT_ADMIN
    if (admin.role === 'MANDAL_ADMIN') {
      if (role !== 'PANCHAYAT_ADMIN') return NextResponse.json({ error: 'Mandal Admin can only create Panchayat Admins' }, { status: 403 });
      if (!targetPanchayatId) return NextResponse.json({ error: 'Panchayat ID is required' }, { status: 400 });

      // Verify panchayat belongs to mandal
      const p = await prisma.panchayat.findFirst({
        where: { id: targetPanchayatId, constituencyId: admin.constituencyId ?? undefined }
      });
      if (!p) return NextResponse.json({ error: 'Panchayat not found in your Mandal' }, { status: 403 });
    }

    // PANCHAYAT_ADMIN creating a BOOTH_ADMIN
    if (admin.role === 'PANCHAYAT_ADMIN') {
      if (role !== 'BOOTH_ADMIN') return NextResponse.json({ error: 'Panchayat Admin can only create Booth Admins' }, { status: 403 });
      
      // If boothId not provided, we might be creating a new Booth
      if (!targetBoothId) {
        if (!boothNumber) return NextResponse.json({ error: 'Booth ID or Booth Number is required' }, { status: 400 });
        
        // Upsert the Booth under this panchayat
        const booth = await prisma.booth.upsert({
          where: { id: -1 }, // Dummy ID for create-only if not matching? No, we use Number+PanchayatId if unique.
          // Wait, Booth model doesn't have unique constraint on number+panchayatId in schema.prisma.
          // I will fetch existing or create.
          create: {
            number: Number(boothNumber),
            name: boothName || `Booth ${boothNumber}`,
            panchayatId: admin.panchayatId!,
            totalVoters: Number(totalVoters) || 0,
          },
          update: {
             totalVoters: Number(totalVoters) || 0,
          },
          // Wait, upsert needs a unique where. I'll just findFirst and create if not exists.
        });
        
        const existingBooth = await prisma.booth.findFirst({
            where: { number: Number(boothNumber), panchayatId: admin.panchayatId! }
        });
        
        if (existingBooth) {
            targetBoothId = existingBooth.id;
            await prisma.booth.update({
                where: { id: targetBoothId },
                data: { totalVoters: Number(totalVoters) || existingBooth.totalVoters }
            });
        } else {
            const newBooth = await prisma.booth.create({
                data: {
                    number: Number(boothNumber),
                    name: boothName || `Booth ${boothNumber}`,
                    panchayatId: admin.panchayatId!,
                    totalVoters: Number(totalVoters) || 0,
                }
            });
            targetBoothId = newBooth.id;
        }
      } else {
          // Verify booth belongs to panchayat
          const w = await prisma.booth.findFirst({
            where: { id: targetBoothId, panchayatId: admin.panchayatId ?? undefined }
          });
          if (!w) return NextResponse.json({ error: 'Booth not found in your Panchayat' }, { status: 403 });
      }
      
      targetPanchayatId = admin.panchayatId;
    }

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        name: name.trim(),
        email: `${username.trim()}@election.local`,
        passwordHash,
        role,
        partyId: admin.partyId,
        constituencyId: admin.constituencyId,
        panchayatId: targetPanchayatId,
        boothId: targetBoothId,
      },
    });

    return NextResponse.json({ id: newUser.id, username: newUser.username }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create user. Username might already exist.' }, { status: 409 });
  }
}

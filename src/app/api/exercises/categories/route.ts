import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get unique categories from exercises table
    const exercises = await prisma.exercise.findMany({
      select: {
        category: true
      },
      distinct: ['category']
    })

    // Extract unique categories and sort them alphabetically
    const categories = exercises
      .map(exercise => exercise.category)
      .filter(category => category && category.trim() !== '')
      .sort()

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching exercise categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercise categories' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}








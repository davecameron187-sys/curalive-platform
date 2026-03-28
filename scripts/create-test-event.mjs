import { db } from '../server/db.ts';
import { users, events, operatorSessions } from '../drizzle/schema.ts';

async function createTestEvent() {
  try {
    // Create test operator user
    const operator = await db.insert(users).values({
      openId: `operator-${Date.now()}`,
      name: 'Test Operator',
      email: 'operator@chorus.ai',
      role: 'operator',
      timezone: 'Africa/Johannesburg',
    });

    // Create test event
    const event = await db.insert(events).values({
      eventId: `test-event-${Date.now()}`,
      title: 'Q4 2025 Earnings Call - Live Test',
      company: 'Chorus Call Inc.',
      platform: 'zoom',
      status: 'upcoming',
    });

    // Create test session
    const session = await db.insert(operatorSessions).values({
      sessionId: `test-session-${Date.now()}`,
      eventId: `test-event-${Date.now()}`,
      operatorId: 1,
      status: 'idle',
    });

    console.log('✅ Test event created successfully');
    console.log(`Event ID: test-event-${Date.now()}`);
    console.log(`Session ID: test-session-${Date.now()}`);
    console.log(`Operator ID: 1`);
  } catch (error) {
    console.error('❌ Error creating test event:', error);
    process.exit(1);
  }
}

createTestEvent();

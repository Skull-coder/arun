import { eq } from "drizzle-orm";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { WebhookEvent } from "@clerk/nextjs/webhooks";
import type { UserJSON, UserDeletedJSON } from "@clerk/backend";
import type { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { usersTable } from "@/features/database/schema";

export async function POST(request: NextRequest) {
  let evt: WebhookEvent;
  
  // 1. Verify the webhook signature 
  try {
    evt = await verifyWebhook(request);
    console.log("webhook from clerk EVT:", evt )
  } catch {
    console.log("still issue")
    return new Response("Invalid webhook signature", { status: 401 });
  }

  const eventType = evt.type;

  // 2. Route to the appropriate handler
  try {
    switch (eventType) {
      case "user.created":
        await handleUserCreated(evt.data as UserJSON);
        break;
      case "user.updated":
        await handleUserUpdated(evt.data as UserJSON);
        break;
      case "user.deleted":
        await handleUserDeleted(evt.data as UserDeletedJSON);
        break;
      default:
        // Ignore other event types (session, organization, etc.)
        break;
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(`Webhook handler error [${eventType}]:`, error);
    return new Response("Internal server error", { status: 500 });
  }
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleUserCreated(data: UserJSON) {
  const { id, email_addresses, first_name, last_name } = data;

  const primaryEmail = email_addresses[0]?.email_address;
  if (!primaryEmail) {
    console.warn(`user.created: no email for user ${id}, skipping`);
    return;
  }

  await db.insert(usersTable).values({
    id,
    email: primaryEmail,
    firstName: first_name,
    lastName: last_name,
  });
}

async function handleUserUpdated(data: UserJSON) {
  const { id, email_addresses, first_name, last_name } = data;

  const primaryEmail = email_addresses[0]?.email_address;
  if (!primaryEmail) {
    console.warn(`user.updated: no email for user ${id}, skipping`);
    return;
  }

  await db
    .update(usersTable)
    .set({
      email: primaryEmail,
      firstName: first_name,
      lastName: last_name,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, id));
}

async function handleUserDeleted(data: UserDeletedJSON) {
  const { id } = data;

  if (!id) {
    console.warn("user.deleted: no id in payload, skipping");
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, id));
}

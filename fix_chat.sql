-- Fix Missing Chat Tables & Relations
-- 1. Create implicit join table for User <-> Chat (Prisma _UserChats)
CREATE TABLE IF NOT EXISTS "_UserChats" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);
-- 2. Create indices for performance and uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS "_UserChats_AB_unique" ON "_UserChats"("A", "B");
CREATE INDEX IF NOT EXISTS "_UserChats_B_index" ON "_UserChats"("B");
-- 3. Add Foreign Key Constraints (Links Chat ID and User ID)
-- Note: We use DO blocks to avoid errors if constraints already exist
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = '_UserChats_A_fkey'
) THEN
ALTER TABLE "_UserChats"
ADD CONSTRAINT "_UserChats_A_fkey" FOREIGN KEY ("A") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = '_UserChats_B_fkey'
) THEN
ALTER TABLE "_UserChats"
ADD CONSTRAINT "_UserChats_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF;
END $$;
-- 4. Verify Message Table Foreign Keys also (Just in case)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Message_senderId_fkey'
) THEN
ALTER TABLE "Message"
ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Message_chatId_fkey'
) THEN
ALTER TABLE "Message"
ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
END IF;
END $$;
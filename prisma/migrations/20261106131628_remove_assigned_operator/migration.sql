-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Request" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "userCreatorId" TEXT NOT NULL,
    "assignedOperatorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Request_userCreatorId_fkey" FOREIGN KEY ("userCreatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Request_assignedOperatorId_fkey" FOREIGN KEY ("assignedOperatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Request" ("assignedOperatorId", "category", "createdAt", "description", "id", "status", "title", "urgency", "userCreatorId") SELECT "assignedOperatorId", "category", "createdAt", "description", "id", "status", "title", "urgency", "userCreatorId" FROM "Request";
DROP TABLE "Request";
ALTER TABLE "new_Request" RENAME TO "Request";
CREATE INDEX "Request_category_idx" ON "Request"("category");
CREATE INDEX "Request_userCreatorId_idx" ON "Request"("userCreatorId");
CREATE INDEX "Request_assignedOperatorId_idx" ON "Request"("assignedOperatorId");
CREATE INDEX "Request_status_idx" ON "Request"("status");
CREATE INDEX "Request_urgency_idx" ON "Request"("urgency");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_StatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "assigningUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatusHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StatusHistory_assigningUserId_fkey" FOREIGN KEY ("assigningUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_StatusHistory" ("id", "status", "requestId", "assigningUserId", "createdAt")
SELECT "id", "status", "requestId", "assigningUserId", "createdAt" FROM "StatusHistory";

DROP TABLE "StatusHistory";
ALTER TABLE "new_StatusHistory" RENAME TO "StatusHistory";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

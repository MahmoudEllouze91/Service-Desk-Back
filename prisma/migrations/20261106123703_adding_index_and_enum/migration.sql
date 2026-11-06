-- CreateIndex
CREATE INDEX "Comment_requestId_idx" ON "Comment"("requestId");

-- CreateIndex
CREATE INDEX "Comment_userCreatorId_idx" ON "Comment"("userCreatorId");

-- CreateIndex
CREATE INDEX "Request_category_idx" ON "Request"("category");

-- CreateIndex
CREATE INDEX "Request_userCreatorId_idx" ON "Request"("userCreatorId");

-- CreateIndex
CREATE INDEX "Request_assignedOperatorId_idx" ON "Request"("assignedOperatorId");

-- CreateIndex
CREATE INDEX "Request_status_idx" ON "Request"("status");

-- CreateIndex
CREATE INDEX "Request_urgency_idx" ON "Request"("urgency");

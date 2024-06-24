/*
  Warnings:

  - You are about to drop the column `userId` on the `Todo` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uuid]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerId` to the `Todo` table without a default value. This is not possible if the table is not empty.
  - The required column `uuid` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Todo" DROP CONSTRAINT "Todo_userId_fkey";

-- AlterTable
ALTER TABLE "Todo" DROP COLUMN "userId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ownerId" TEXT NOT NULL,
ADD COLUMN     "shared" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "uuid" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "TodoCollaborator" (
    "userId" TEXT NOT NULL,
    "todoId" TEXT NOT NULL,

    CONSTRAINT "TodoCollaborator_pkey" PRIMARY KEY ("userId","todoId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_uuid_key" ON "User"("uuid");

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TodoCollaborator" ADD CONSTRAINT "TodoCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TodoCollaborator" ADD CONSTRAINT "TodoCollaborator_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "forum_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "post_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usersId" TEXT NOT NULL,
    CONSTRAINT "forum_posts_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar" TEXT,
    "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "post_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "forum_postsId" TEXT NOT NULL,
    "usersId" TEXT NOT NULL,
    CONSTRAINT "post_roles_forum_postsId_fkey" FOREIGN KEY ("forum_postsId") REFERENCES "forum_posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "post_roles_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "forum_posts_id_key" ON "forum_posts"("id");

-- CreateIndex
CREATE UNIQUE INDEX "forum_posts_post_id_key" ON "forum_posts"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_id_key" ON "users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "post_roles_id_key" ON "post_roles"("id");

-- CreateIndex
CREATE UNIQUE INDEX "post_roles_forum_postsId_role_key" ON "post_roles"("forum_postsId", "role");

import type { ForumChannel, Role, User } from "discord.js";
import { prisma } from "../utils/prisma";

class ForumPosts {
    static async addPost(user: User, post: ForumChannel, role: Role): Promise<{
        created: boolean;
        dbid: string;
        roles: { role: string }[];
    }> {
        const dBUser = await prisma.users.upsert({
            where: { user_id: user.id },
            create: {
                user_id: user.id,
                display_name: user.displayName,
                username: user.username,
                avatar: user.avatarURL({ size: 128, extension: 'webp' }),
            },
            update: {
                display_name: user.displayName,
                avatar: user.avatarURL({ size: 128, extension: 'webp' }),
            },
            select: {
                id: true,
            },
        });

        let created = false;
        let dBPost: { id: string } | null = await prisma.forum_posts.findUnique({ where: { post_id: post.id }, select: { id: true }});

        if (!dBPost) {
            dBPost = await prisma.forum_posts.create({
                data: {
                    post_id: post.id,
                    guild_id: post.guildId,
                    usersId: dBUser.id,
                },
                select: {
                    id: true,
                },
            });
            created = true;
        }

        await prisma.post_roles.create({
            data: {
                forum_postsId: dBPost.id,
                role: role.id,
                usersId: dBUser.id,
            }
        });

        const roles: { role: string }[] = await prisma.post_roles.findMany({
            select: {
                role: true,
            },
            where: {
                forum_postsId: dBPost.id,
            },
        })

        return { created, dbid: dBPost.id, roles };
    }
}

export default ForumPosts;
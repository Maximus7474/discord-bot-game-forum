import type { APIRole, PublicThreadChannel, Role, User } from "discord.js";
import { prisma } from "../utils/prisma";
import AntiPostArchiver from "./anti-postarchiver";

const DEBOUNCE_DELAY = 300;

class ForumPosts {
    static async addPost(user: User, post: PublicThreadChannel, role: Role | APIRole): Promise<{
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
        });

        AntiPostArchiver.addNewPost(post.id, true);

        return { created, dbid: dBPost.id, roles };
    }

    private static debounceTimeouts: Map<string, NodeJS.Timeout> = new Map();
    static async search(user: User, guildId: string, value: string): Promise<{ value: string; name: string; }[]> {
        const userId = user.id;

        const existingTimeout = this.debounceTimeouts.get(userId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        return new Promise((resolve) => {
            const newTimeout = setTimeout(async () => {
                this.debounceTimeouts.delete(userId);

                try {
                    const results = await prisma.forum_posts.findMany({
                        select: {
                            post_id: true,
                            id: true,
                        },
                        where: {
                            guild_id: guildId,
                            post_id: {
                                contains: value,
                            },
                        },
                        take: 20,
                    });

                    const formattedResults = results.map(post => ({
                        name: post.post_id,
                        value: post.id,
                    }));

                    resolve(formattedResults);
                } catch (error) {
                    console.error('Prisma search error:', error);
                    resolve([]);
                }
            }, DEBOUNCE_DELAY);

            this.debounceTimeouts.set(userId, newTimeout);

            if (!value) {
                clearTimeout(newTimeout);
                this.debounceTimeouts.delete(userId);
                resolve([]); 
            }
        });
    }

    static async deletePost(guildId: string, post: PublicThreadChannel): Promise<{ success: boolean; message?: string }> {
        const result = await prisma.forum_posts.deleteMany({
            where: {
                post_id: post.id,
                guild_id: guildId,
            },
        });

        if (result.count > 0) {
            AntiPostArchiver.removePost(post.id);
            return { success: true };
        } else return { success: false, message: 'No post was found' };
    }
}

export default ForumPosts;
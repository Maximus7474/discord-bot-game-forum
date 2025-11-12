import { createTask } from 'node-cron';
import log from '../utils/logger';
import { prisma } from '../utils/prisma';
import { type DiscordClient } from '@types';
import { type PublicThreadChannel } from 'discord.js';

const logger = new log('AntiPostArchiver');

class AntiPostArchiver {
    private static postIds: string[] = [];

    static async initialize(client: DiscordClient) {
        const posts: { post_id: string }[] = await prisma.forum_posts.findMany({ select: { post_id: true } });

        posts.forEach(({ post_id }) => this.postIds.push(post_id));

        logger.success(`Initialized tracking for ${posts.length} channels`);

        createTask('0 0 13 */6 * * *', async () => {
            let deleted = 0;
            logger.info('Running de-archiver for', this.postIds.length, 'channels');

            for (let i = 0; i < this.postIds.length; i++) {
                const postId = this.postIds[i];
                try {
                    const post = await client.channels.fetch(postId) as PublicThreadChannel | null;

                    if (!post) throw Error(`${postId} was not found (returned null)`);

                    const msg = await post.send('Reopening');

                    logger.info('Sent message to', post?.name, post.id);

                    setTimeout(() => {
                        msg.delete();
                    }, 1000);
                } catch (err) {
                    await prisma.post_roles.deleteMany({ where: { forum_postsId: postId } });
                    await prisma.forum_posts.deleteMany({ where: { post_id: postId } });

                    logger.error('Unable to de-archive', postId, 'reason:', (err as Error).message);
                    logger.error('Deleting from database...');
                    deleted++;
                }
            }

            logger.success(`De-archived ${this.postIds.length - deleted} channels and deleted ${deleted} unknown channels.`)
        })
    }

    static addNewPost(postId: string) {
        if (this.postIds.includes(postId)) {
            logger.warn(`Post (id: ${postId}) is already listed, ignoring...`);
            return;
        }

        this.postIds.push(postId);
    }
}

export default AntiPostArchiver;
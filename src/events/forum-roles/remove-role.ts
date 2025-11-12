import { Events, type User, type MessageReaction, ChannelType } from "discord.js";
import EventHandler from "../../classes/event_handler";
import { prisma } from "../../utils/prisma";

const trackedEmoji = '✅';

export default new EventHandler({
    name: 'REM-ROLE',
    eventName: Events.MessageReactionRemove,
    type: "on",
    callback: async (logger, client, reaction: MessageReaction, user: User) => {
        const { message, emoji } = reaction;

        if (!message.guildId) return;
        if (emoji.name !== trackedEmoji) return;
        if (message.channel.type !== ChannelType.PublicThread) return;

        const post = await prisma.forum_posts.findUnique({
            where: {
                post_id: message.channelId
            },
            include: {
                post_roles: true,
            },
        });
        if (!post) return;

        const guild = await client.guilds.fetch(message.guildId);
        const member = await guild.members.fetch({ user, cache: false });

        for (const postRole of post.post_roles) {
            member.roles.remove(postRole.role, `Removed via forum role selector.`);
        }
    }
});
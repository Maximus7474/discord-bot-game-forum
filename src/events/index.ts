import EventHandler from "../classes/event_handler";
import command_handler from "./command_handler";
import forumRoles from "./forum-roles";
import ready from "./ready";

export default [
    ready,
    command_handler,
    ...forumRoles,
] as EventHandler[];

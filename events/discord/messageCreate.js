const permes = require("../../util/permissions.json");
require("../../util/extenders.js");
const bwl = require("../../util/bwl.js");
const { Permissions } = require("discord.js");

module.exports = {
    async execute(e) {
        const { client: t } = e;
        // store to database        
        try {
            const displayname = (e.member != null || e.member != undefined?e.member.displayName:e.author.username);

            if(e.id != null && e.content != "") {  
                e.addDB().catch(console.error);
            }
            if (e.author != null) {
                e.author.addDB(displayname).catch(console.error);
            }
            await bwl(e, t).catch(console.error);
        } catch(err) {
            console.log(err);
        }

        if (e.author.bot || !e.guild) return;
        let guildDB = await e.guild.fetchDB();
        if (e.content.startsWith(guildDB.prefix) || e.content.startsWith("komu ") || e.content.startsWith(`<@!${e.client.user.id}>`)) {
            if (e.content.endsWith("*") && !e.content.includes("prefix")) return;
            if (e.content.match(new RegExp(`^<@!?${e.client.user.id}>( |)$`))) {
                let a = await e.translate("HELLO_NEED_HELP", guildDB.lang);
                e.channel.send({
                    embeds: [{
                        description: a.replace("{prefix}", guildDB.prefix).replace("{prefix}", guildDB.prefix).replace("{prefix}", guildDB.prefix).replace("{id}", e.guild.id),
                        footer: {
                            text: e.client.footer,
                            icon_url: e.client.user.displayAvatarURL()
                        },
                        title: `Settings for ${e.guild.name}`,
                        color: guildDB.color
                    }]
                }).catch(() => {
                    e.member.send("❌ Please give me the `Send messages` and `Embed links` permission.")
                });
                console.log("[32m%s[0m", "PING OF THE BOT ", "[0m", `${e.author.tag} pinged the bot succesfully on ${e.guild.name}`);
                return
            }
            e.content.startsWith(guildDB.prefix) && (a = e.content.slice(guildDB.prefix.length).trim().split(/ +/)), e.content.startsWith("komu ") && (a = e.content.slice(5).trim().split(/ +/)), e.content.startsWith(`<@!${e.client.user.id}>`) && (a = e.content.slice(22).trim().split(/ +/));
            const r = a.shift().toLowerCase(),
                i = t.commands.get(r) || t.commands.find(e => e.aliases && e.aliases.includes(r));
            if (!i) return;
            console.log("[32m%s[0m", "COMMAND ", "[0m", `Command ${i.name} by ${e.author.tag} on ${e.guild.name}\nMessage content:\n${e.content}`);
            const me = e.guild.members.cache.get(e.client.user.id);
            const channelBotPerms = new Permissions(e.channel.permissionsFor(me));
            if (!channelBotPerms.has("SEND_MESSAGES")) return e.member.send("❌ I don't have permission to send messages in this channel.");
            if (!channelBotPerms.has("EMBED_LINKS")) return e.channel.send("❌ The bot must have the `Embed links` permissions to work properly !");
            if (i.permissions) {
                "string" == typeof i.permissions && (i.permissions = [i.permissions]);
                for (const t of i.permissions)
                    if (!e.channel.permissionsFor(e.member).has(t)) {
                        let d = await e.translate("MISSING_PERMISSIONS", guildDB.lang);
                        if ("MANAGE_GUILD" !== t) return e.errorMessage(d.replace("{perm}", permes[t] ? permes[t][guildDB.lang] : t)); {
                            let a = await e.translate("MISSING_ROLE");
                            if (!guildDB.admin_role) return e.errorMessage(d.replace("{perm}", permes[t] ? permes[t][guildDB.lang] : t));
                            if (AdminRole = e.guild.roles.cache.get(guildDB.admin_role), !AdminRole) return e.errorMessage(d.replace("{perm}", permes[t] ? permes[t][guildDB.lang] : t));
                            if (!e.member.roles.cache) return e.errorMessage(a.replace("{perm}", permes[t] ? permes[t][guildDB.lang] : t).replace("{role}", AdminRole));
                            if (!e.member.roles.cache.has(AdminRole.id)) return e.errorMessage(a.replace("{perm}", permes[t] ? permes[t][guildDB.lang] : t).replace("{role}", AdminRole))
                        }
                    }
            }
            if (i.args && !a.length) {
                let u = await e.translate("ARGS_REQUIRED", guildDB.lang);
                const read = await e.translate("READ", guildDB.lang)
                let langUsage;
                if (i.usages) {
                    langUsage = await e.translate("USES", guildDB.lang)
                } else {
                    langUsage = await e.translate("USES_SING", guildDB.lang)
                }
                e.channel.send({
                            embeds: [{
                                        color: "#C73829",
                                        description: `${u.replace("{command}",r)}\n${read}\n\n**${langUsage}**\n${i.usages ? `${i.usages.map(x=>`\`${guildDB.prefix}${x}\``).join("\n")}` : ` \`${guildDB.prefix}${r} ${i.usage}\``}`,
                    footer: { text: e.client.footer, iconURL: e.client.user.displayAvatarURL() },
                    author: { name: e.author.username, icon_url: e.author.displayAvatarURL({ dynamic: !0, size: 512 }), url: "https://discord.com/oauth2/authorize?client_id=783708073390112830&scope=bot&permissions=19456" },
                }]})
                return;
            }
            try {
                i.execute(e, a, t, guildDB,i );
                return
            } catch (s) {
                return e.errorOccurred(s)
            }
        } else if(guildDB.requestChannel !== null || guildDB.autopost !== null){
            if(guildDB.requestChannel === e.channel.id){
                e.delete();
                const voice = e.member.voice.channel;
                if (!voice) {
                    let err = await e.translate("NOT_VOC", guildDB.lang)
                    const noVoiceMsg = await e.errorMessage(err);
                    return setTimeout(() => {
                        noVoiceMsg.delete();
                    }, 5000);
                }

                if (e.guild.me.voice.channel && e.guild.me.voice.channel.id !== voice.id) {
                    let err = await e.translate("NOT_SAME_CHANNEL", guildDB.lang)
                    const noVoiceMsg = await e.errorMessage(err);
                    return setTimeout(() => {
                        noVoiceMsg.delete();
                    }, 5000);
                }

                const { player } = e.client;
                let name = e.content;
                let queue;
                const messageController = await e.guild.channels.cache.get(e.channel.id).messages.fetch(guildDB.requestMessage);
                if (!e.client.player.getQueue(e.guild.id)) {
                    queue = player.createQueue(e.guild, {
                        metadata: { controller: true, message: messageController, dj: e.author, guildDB: guildDB,m:e },
                        initialVolume: guildDB.defaultVolume,
                        leaveOnEmptyCooldown: guildDB.h24 ? null : 3000,
                        leaveOnEmpty: guildDB.h24 ? false : true,
                        leaveOnEnd: guildDB.h24 ? false : true,
                        ytdlOptions: { quality: 'highest', filter: 'audioonly', highWaterMark: 1 << 25, dlChunkSize: 0 },
                        fetchBeforeQueued: true,
                        async onBeforeCreateStream(track, source, _queue) {
                            const playdl = require('play-dl');
                            if (track.url.includes('youtube') || track.url.includes("youtu.be")) {
                                try {
                                    return (await playdl.stream(track.url)).stream;
                                } catch (err) {
                                    console.log(err)
                                    return _queue.metadata.m.errorMessage("This video is restricted. Try with another link.")
                                }
                            } else if (track.url.includes('spotify')) {
                                try {
                                    let songs = await client.player.search(`${track.author} ${track.title} `, {
                                        requestedBy: e.member,
                                    }).catch().then(x => x.tracks[0]);
                                    return (await playdl.stream(songs.url)).stream;
                                } catch (err) {
                                    console.log(err)
                                }
                            } else if (track.url.includes('soundcloud')) {
                                try {
                                    return (await playdl.stream(track.url)).stream;
                                } catch (err) {
                                    console.log(err)
                                }
                            }
                        }
                    });
                } else {
                    queue = e.client.player.getQueue(e.guild.id);
                    if (queue.metadata.channel) return e.errorMessage("Another queue is running and not started with the controller.");
                }
                if (name === 'music') name = '2021 New Songs ( Latest English Songs 2021 ) 🥬 Pop Music 2021 New Song 🥬 English Song 2021';
                if (name === 'lofi') name = '1 A.M Study Session 📚 - [lofi hip hop/chill beats]';
                const { QueryType } = require('discord-player');
                const searchResult = await player.search(name, {
                    requestedBy: e.author,
                    searchEngine: QueryType.AUTO
                }).catch(async() => {
                    let err = await e.translate("NO_RESULTS", guildDB.lang)
                    const noVoiceMsg = await e.errorMessage(err.replace("{query}", name));
                    return setTimeout(() => {
                        noVoiceMsg.delete();
                    }, 5000);
                });
                if (!searchResult || !searchResult.tracks.length) {
                    let err = await e.translate("NO_RESULTS", guildDB.lang)
                    const noVoiceMsg = await e.errorMessage(err.replace("{query}", name));
                    return setTimeout(() => {
                        noVoiceMsg.delete();
                    }, 5000);                        
                }
                try {
                    if (!queue.connection) await queue.connect(e.member.voice.channel);
                } catch {
                    player.deleteQueue(e.guild.id);
                    return e.errorMessage("I can't join your voice channel. Please check my permissions.");
                }
                if (!e.guild.me.voice.channel) await queue.connect(e.member.voice.channel);
                searchResult.playlist ? queue.addTracks(searchResult.tracks) : queue.addTrack(searchResult.tracks[0]);
                if (!queue.playing) await queue.play();
            }
            if(guildDB.autopost === e.channel.id && e.crosspostable) {
                e.crosspost().then(() => console.log('Crossposted message')).catch(() => null);
            
            }
        }
    }
};

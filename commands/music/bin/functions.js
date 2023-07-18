const ytdl  = require("ytdl-core")
const { joinVoiceChannel,
    getVoiceConnection,
    createAudioResource,
    createAudioPlayer,
    NoSubscriberBehavior
} = require("@discordjs/voice")
const ytsr = require("ytsr")
const { EmbedBuilder } = require("discord.js")


var queue = {}
var queue_music = async function queue_music(ctx, song, creat_msg){
    const guild_id = ctx.guild.id
    try {
        queue[guild_id].push(song)
    }
    catch(err){
        queue[guild_id] = []
        queue[guild_id].push(song)
    }
    if (creat_msg){
        const embed = new EmbedBuilder()
        .setDescription(`Queued [${song.title}](${song.url})`)
        .setColor(0x00c6ff)
        if (ctx.replied || ctx.deferred) {
            await ctx.followUp({embeds:[embed]});
        } 
        else {
            await ctx.reply({embeds:[embed]});
        }
    }
}
module.exports.queue_music = queue_music
module.exports.queue = queue


var connect = async function connect(interaction){
    let channel = interaction.options.getChannel("channel")
    if(channel == null){
        channel = interaction.member.voice.channel
        if(channel == null){
            interaction.reply("you must in a voice channel to use this command")
            return false
        }
    }

    await interaction.reply("connecting...")
    if (channel.isVoiceBased() == true){
    const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false // this may also be needed
            }
        )
    return connection
    }
    else {
        await interaction.followUp({content:`${channel.toString()} is not a voice channel`, ephemeral: true })
    }
}
module.exports.connect = connect



// getplayer(interaction, bool)
//                        ^^^^ ---> if true creat new player when can't find player in list 
var players = {}
var getplayer = function getplayer(ctx, creat_player){
    const guild_id = ctx.guild.id
    if (players[guild_id] == undefined){
            const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        })
        if (!creat_player){
            return false
        }
        players[guild_id] = player
        return players[guild_id]
    }
    return players[guild_id]
}
module.exports.getplayer = getplayer


var nowplaying = {}
module.exports.nowplaying = nowplaying

var creat_nowplaying_embed = function creat_nowplaying_embed(ctx,nowplaying_song){
    return new EmbedBuilder()
    .setTitle("**Now playing**")
    .setDescription(`\`\`\`css\n${nowplaying_song.title}\`\`\``)
    .setThumbnail(nowplaying_song.bestThumbnail.url)
    .setColor(0x76dfff)
    .addFields(
        {name: "duration", value: `${nowplaying_song.duration}`, inline: true},
        {name: "Requested by", value: `${ctx.user.toString()}`, inline: true},
        {name: "Uploader", value: `[${nowplaying_song.author.name}](${nowplaying_song.author.url})`, inline: true},
        {name: "URL", value: `[click](${nowplaying_song.url})`}
    )

}

var creat_resource = async function creat_resource(ctx){
    const guild_id = ctx.guild.id
    const song = queue[guild_id].shift()
    nowplaying[guild_id] = song
    const embed = creat_nowplaying_embed(ctx,song)
    await ctx.channel.send({embeds:[embed]})
   
        const stream = ytdl(song.url,{ 
        quality: 'highestaudio',
        format: 'webm',
        highWaterMark: 1 << 62,
        liveBuffer: 1 << 62,
        bitrate: 128,
        }
    )
    return createAudioResource(stream)
}


//       serch(ctx, string)
//                  ^^^^^^   ---> string or url   >> return {title:"value",...}
var search = async function search(ctx, string){
    const filter_ = await ytsr.getFilters(string)
    const filter =  filter_.get("Type").get("Video")
    await ytsr(filter.url,{ limit: 1, pages: 1 }).then(async(result) => {
            let song = result.items[0]
            await queue_music(ctx, song, true)
        }
    ) 
}

var destroy = function destroy(ctx){
    const guild_id = ctx.guild.id
    const connection = getVoiceConnection(guild_id)
    if (connection == undefined){return false}
    const player = getplayer(ctx,true)
    delete players[guild_id]
    delete queue[guild_id]
    delete nowplaying[guild_id]
    connection.destroy()
    player.removeAllListeners("stateChange")
}
module.exports.destroy = destroy



module.exports.play = async function play(ctx, url){
    const guild_id = ctx.guild.id
    let connection = getVoiceConnection(guild_id)
    const player = getplayer(ctx,true)
   
    if (connection == undefined){
        connection = await connect(ctx)
        if (!connection){
            return
        }
    }

    await search(ctx,url)
    console.log(queue)
    if (player.listenerCount("stateChange") < 1){
        let resource = await creat_resource(ctx)
        connection.subscribe(player)
        player.play(resource)
        player.addListener("stateChange", async(oldOne, newOne) => {
                if (newOne.status == "idle") {

                    if (queue[guild_id][0] != undefined){
                        let resource = await creat_resource(ctx)
                        player.play(resource)
                    }
                    else{
                        destroy(ctx)
                    }
                }
            }
        )
    }
}



//  in this file:  ctx = interaction  //
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
    song.requester = ctx.user.toString()
    try {
        queue[guild_id].push(song)
    }
    catch(err){
        queue[guild_id] = []
        queue[guild_id].push(song)
    }
    if (creat_msg){
        const embed = new EmbedBuilder()
        .setDescription(`Queued [${song.videoDetails.title}](${song.videoDetails.video_url})`)
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
var duration_changer = function duration_changer(string){
    const s_ = Number(string)
    let m = Math.trunc(s_/60)
    let h = Math.trunc(m/60)
    m = m - h*60
    let s = s_%60
    s = s.toFixed(0).padStart(2,"0")
    if (h < 1){
        return `${m}:${s}`
    }
    else{
        return `${h}:${m}:${s}`
    }
    
}
module.exports.duration_changer = duration_changer

var creat_nowplaying_embed = function creat_nowplaying_embed(nowplaying_song){
    return new EmbedBuilder()
    .setTitle("**<:foxtail:995271447905833030>Now playing**")
    .setDescription(`\`\`\`css\n${nowplaying_song.videoDetails.title}\`\`\``)
    .setThumbnail(nowplaying_song.videoDetails.thumbnails[nowplaying_song.videoDetails.thumbnails.length-1].url)
    .setColor(0x76dfff)
    .addFields(
        {name: "duration", value: `> ${duration_changer(nowplaying_song.videoDetails.lengthSeconds)}`, inline: true},
        {name: "Requested by", value: `${nowplaying_song.requester}`, inline: true},
        {name: "Uploader", value: `[${nowplaying_song.videoDetails.author.name}](${nowplaying_song.videoDetails.author.user_url})`, inline: true},
        {name: "URL", value: `[click](${nowplaying_song.videoDetails.video_url})`}
    )
}

var creat_resource = async function creat_resource(ctx){
    const guild_id = ctx.guild.id
    const song = queue[guild_id].shift()
    nowplaying[guild_id] = song
    const embed = creat_nowplaying_embed(song)
    await ctx.channel.send({embeds:[embed]})
   
        const stream = ytdl(song.videoDetails.video_url,
            { 
        quality: 'highestaudio',
        format: 'mp3',
        highWaterMark: 1 << 62,
        liveBuffer: 1 << 62,
        bitrate: 128,
        }
    )
    return createAudioResource(stream)
}


//       serch(ctx, string)
//                  ^^^^^^   ---> string or url   >> return {title:"value",...}
var search = async function search(string){
    if (string.includes("youtu") && string.includes("https://") && (!(string.includes("@")))){
        const song = await ytdl.getBasicInfo(string)
        
        return song
    }
    else{
        let filter = await ytsr.getFilters(string)
        filter =  filter.get("Type").get("Video")
        const result = await ytsr(filter.url,{ pages: 1 })
        let song = result.items[0]
        
        return await ytdl.getBasicInfo(song.url)
    }
}

var destroy = function destroy(ctx){
    const guild_id = ctx.guild.id
    clearTimeout(channel_timeout[guild_id])
    delete channel_timeout[guild_id]
    delete players[guild_id]
    delete queue[guild_id]
    delete nowplaying[guild_id]
    const connection = getVoiceConnection(guild_id)
    if (connection == undefined){return false}
    connection.destroy()
}
module.exports.destroy = destroy



var channel_timeout = {}
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
    let f = 0
    async function play_(){
        f++
        if (f > 10){
            return await ctx.channel.send("no result searched...")
        }
        else{
                await search(url).then(async(song)=>{
                if (song == undefined){
                    await play_()
                }
                else{
                    await queue_music(ctx, song, true)
                }
            }).catch(async(err)=>{
                await play_()
            })
        }
    }
    await ctx.channel.sendTyping()
    await play_()
    console.log(queue)
    if (player.listenerCount("stateChange") < 1){
        if (!(f > 10)){
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
                            channel_timeout[guild_id] = setTimeout(destroy, 300000, ctx)
                        }
                    }
                }
            )
        }
        return
    }

    if (channel_timeout[guild_id] != null){
        clearTimeout(channel_timeout[guild_id])
        delete channel_timeout[guild_id]
        let resource = await creat_resource(ctx)
        player.play(resource)
    }
}



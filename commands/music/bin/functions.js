const ytdl  = require("ytdl-core")
const { joinVoiceChannel,
    getVoiceConnection,
    createAudioResource,
    createAudioPlayer,
    NoSubscriberBehavior
} = require("@discordjs/voice")
const ytsr = require("ytsr")


var queue = {}
var queue_music = function queue_music(ctx, song){
    const guild_id = ctx.guild.id
    try {
        queue[guild_id].push(song)
    }
    catch(err){
        queue[guild_id] = []
        queue[guild_id].push(song)
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

var creat_resource = function creat_resource(guild_id){
    const song = queue[guild_id].shift()
    nowplaying[guild_id] = song
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
    await ytsr(filter.url,{ limit: 1, pages: 1 }).then(result => {
            let song = result.items[0]
            queue_music(ctx, song)
        }
    ) 
}

var destroy = function destroy(ctx){
    const guild_id = ctx.guild.id
    const connection = getVoiceConnection(guild_id)
    if (connection == undefined){return false}
    const player = getplayer(ctx,true)
    player.stop() 
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
        let resource = creat_resource(guild_id)
        connection.subscribe(player)
        player.play(resource)
        player.addListener("stateChange", (oldOne, newOne) => {
                if (newOne.status == "idle") {

                    if (queue[guild_id][0] != undefined){
                        let resource = creat_resource(guild_id)
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



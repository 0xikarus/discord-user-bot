/*
object {
  t: 'MESSAGE_CREATE',
  s: 4,
  op: 0,
  d: {
    type: 0,
    tts: false,
    timestamp: '----',
    referenced_message: null,
    pinned: false,
    nonce: '----',
    mentions: [],
    mention_roles: [],
    mention_everyone: false,
    member: {
      roles: [Array],
      premium_since: null,
      pending: false,
      nick: null,
      mute: false,
      joined_at: '----',
      is_pending: false,
      hoisted_role: '---',
      deaf: false
    },
    id: '---',
    flags: 0,
    embeds: [],
    edited_timestamp: null,
    content: 'f',
    channel_id: '---',
    author: {
      username: '---',
      public_flags: 0,
      id: '---',
      discriminator: '---',
      avatar: '---'
    },
    attachments: [],
    guild_id: '----'
  }
}*/
class Message {
    constructor(object) {
        this._state = false;
        this._messageContext = object;
        if (object.t == 'MESSAGE_CREATE') {
            let data = object.d;
            this._state = true;
        }
    }
    get type() {
        return this._messageContext.d.type; // 0 = text message in server
    }
    get valid() {
        return this._state;
    }
    get id() {
        return this._messageContext.d.id;
    }
    get text() {
        return this._messageContext.d.content;
    }
    get guild_id() {
        return this._messageContext.d.guild_id;
    }
    get author() {
        return this._messageContext.d.author;
    }
    get channel_id() {
        return this._messageContext.d.channel_id;
    }
    get member() {
        return this._messageContext.d.member;
    }
    get member_roles() {
        return this._messageContext.d.member.roles;
    }
}
module.exports = Message;

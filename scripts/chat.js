'use strict';

const Goodcount = require('../models/goodcount');
Goodcount.sync();

const fs = require('fs');
const joinMessagesFileName = './join_messages.json';
let joinMessages = new Map(); // key: チャンネルID, value: 入室メッセージ

function saveJoinMessages() {
  fs.writeFileSync(
    joinMessagesFileName,
    JSON.stringify(Array.from(joinMessages)),
    'utf8'
  );
}

function loadJoinMessages() {
  try {
    const data = fs.readFileSync(joinMessagesFileName, 'utf8');
    joinMessages = new Map(JSON.parse(data));
  } catch (e) {
    console.log('loadJoinMessages Error:');
    console.log(e);
    console.log('空のjoinMessagesを利用します');
  }
}

module.exports = robot => {
  loadJoinMessages();

  // :+1: が付くと名前付きで褒めてくれ、いいねの数をカウント
  const sentSet = new Set(); // 送信済みいいね (TS:sendUserId)

  robot.react(res => {
    const ts = res.message.item.ts; // いいねされたメッセージのID (TS)
    const sendUserId = res.message.user.id;
    const keyOfSend = ts + ':' + sendUserId; // 対象メッセージID(TS):いいね送った人のID で重複カウント排除
    if (
      res.message.type == 'added' &&
      res.message.reaction == '+1' &&
      !sentSet.has(keyOfSend) // その人が過去送ったことがなければインクリメント
    ) {
      const userId = res.message.item_user.id;
      const user = robot.brain.data.users[userId];

      // ボット自身の発言へと自身へのいいねを除外
      if (userId !== 'U7EADCN6N' && userId !== sendUserId) {
        Goodcount.findOrCreate({
          where: { userId: userId },
          defaults: {
            userId: userId,
            name: user.name,
            realName: user.real_name,
            displayName: user.slack.profile.display_name,
            goodcount: 0
          }
        }).spread((goodcount, isCreated) => {
          goodcount
            .increment('goodcount', { where: { userId: userId } })
            .then(() => {
              const newGoodcount = goodcount.goodcount;

              let displayName = user.slack.profile.display_name;
              if (!displayName) {
                displayName = user.name;
              }

              if (
                newGoodcount === 1 ||
                newGoodcount === 5 ||
                newGoodcount % 10 === 0
              ) {
                res.send(
                  `${displayName}ちゃん、すごーい！記念すべき ${newGoodcount} 回目のいいねだよ！おめでとー！`
                );
              }

              if (sentSet.size > 100000) {
                sentSet.clear(); // 10万以上、すごーいしたら一旦クリア
              }
              sentSet.add(keyOfSend);
            });
        });
      }
    }
  });

  // いいねいくつ？ と聞くといいねの数を答えてくれる
  robot.hear(/いいねいくつ[\?？]/i, msg => {
    const user = msg.message.user;

    let username = msg.message.user.profile.display_name;
    if (!username) {
      username = user.name;
    }

    Goodcount.findOrCreate({
      where: { userId: user.id },
      defaults: {
        userId: user.id,
        name: user.name,
        realName: user.real_name,
        displayName: user.profile.display_name,
        goodcount: 0
      }
    }).spread((goodcount, isCreated) => {
      const message = `${username}ちゃんのいいねは ${
        goodcount.goodcount
      } こだよ！`;
      msg.send(message);
    });
  });

  // サーバルと呼びかけると答えてくれる
  robot.hear(/サーバル/i, msg => {
    const username = msg.message.user.profile.display_name;
    const messages = [
      `${username}ちゃん、なんだい？`,
      'わーーい！',
      'たーのしー！',
      `${username}ちゃん、すごーい！`,
      `${username}ちゃん、まけないんだからー！`,
      'みゃー！うみゃー！みゃーー！',
      'た、たべないよー！',
      `${username}ちゃん、あ、ちょっとげんきになったー？`,
      'ここはジャパリパークだよ！わたしはサーバル！このへんはわたしのなわばりなの！',
      'あなたこそ、しっぽとみみのないフレンズ？めずらしいねー！',
      'どこからきたの？なわばりは？',
      'あ！きのうのサンドスターでうまれたこかなー？',
      'へーきへーき！フレンズによってとくいなことちがうからー！',
      'あ！だめ！それはセルリアンだよ！にげてー！',
      'だいじょうぶだよ！わたしだって、みんなからよく「どじー！」とか、「ぜんぜんよわいー！」とかいわれるもん！',
      'わたし、あなたのつよいところ、だんだんわかってきたよ！きっとすてきなどうぶつだよ！たのしみだねー！',
      'なっ！なんでわかったのー！？',
      'うわー、うわさどおりかわいいねー！',
      'こえもとってもかわいい！',
      'まいにちたのしそうだねー！',
      'きれいだね～！',
      'だいじょうぶだいじょうぶ！',
      'わかった！いこういこう！',
      'かんがえすぎだよー！',
      'みんなすごいねー！わたしだったら、そのへんでてきとうにねちゃうけどー…',
      'すっごーい！',
      'よろしくね！',
      'たのしそー！',
      'だいじょうぶだいじょうぶ！ちょっとたのしくなってきたよ！',
      `がんばって、${username}ちゃん！`,
      `もじ…ええー、これもじっていうんだ！${username}ちゃん、やっぱりすごいねー！`,
      'やったー！',
      'たのしそー！やるよー！',
      'キラキラしてるねー！',
      'わーい！はじめまして、わたしはサーバル！',
      `どうしたのー、${username}ちゃんらしくないよー？`,
      'おつかれさまー！',
      'なにそれなにそれ、みてみたい！',
      `${username}ちゃん、ほんとにいろんなことにきづくよね！`,
      'いままでみえないところでがんばってくれてたんだね！ありがとう！',
      'ボスー！',
      `${username}ちゃん、ねーなんかいってよー！`,
      'いーなー！わたしもおひるねしたいなー！',
      'わたしのことしってるのー？',
      'ここはほんとにたくさんのこがいるねー！',
      'え、なになにー！',
      `${username}ちゃん！`,
      'わかった！よーし、やるぞー！'
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    msg.send(message);
  });

  //ネガティブなレスをすると慰めてくれる
  robot.hear(/悲しい|すみません|すいません|ごめんなさい|申し訳ない/i, msg => {
    const username = msg.message.user.profile.display_name;
    const messages = [
      'へーきへーき!　フレンズによって得意なこと違うから!',
      `${username}ちゃんはすっごい頑張り屋だから、きっとすぐ何が得意か分かるよ！`
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    msg.send(message);
  });

  // 発言したチャンネルに入室メッセージを設定する
  robot.hear(/^入室メッセージを登録して (.*)/i, msg => {
    const parsed = msg.message.rawText.match(/^入室メッセージを登録して (.*)/);
    // console.log(msg);
    if (parsed) {
      const joinMessage = parsed[1];
      const channelId = msg.envelope.room;
      joinMessages.set(channelId, joinMessage);
      saveJoinMessages();
      msg.send(`入室メッセージ:「${joinMessage}」を登録したよ。`);
    }
  });

  // 発言したチャンネルの入室メッセージの設定を解除する
  robot.hear(/^入室メッセージを消して/i, msg => {
    const channelId = msg.envelope.room;
    joinMessages.delete(channelId);
    saveJoinMessages();
    msg.send(`入室メッセージを削除したよ。`);
  });

  //部屋に入ったユーザーへの入室メッセージを案内 %USERNAME% はユーザー名に、%ROOMNAME% は部屋名に置換
  robot.enter(msg => {
    let username;
    if (msg.message.user.profile)
      usename = msg.message.user.profile.display_name;
    if (!username) username = msg.message.user.name;

    //チャンネルのIDからチャンネル名を取得
    const channelId = msg.envelope.room;
    const roomname = robot.adapter.client.rtm.dataStore.getChannelGroupOrDMById(
      channelId
    ).name;

    for (let [key, value] of joinMessages) {
      if (channelId === key) {
        let message = value
          .replace('%USERNAME%', username)
          .replace('%ROOMNAME%', '#' + roomname);
        msg.send(message);
      }
    }
  });
};

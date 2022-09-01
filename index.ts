import { TelegramClient } from "telegram"; // npm i telegram
import { Api } from "telegram/tl/index.js";
import { StringSession } from "telegram/sessions/index.js";
import schedule, { Job } from "node-schedule";
import input from "input"; // npm i input
import { promises as fs } from "fs";
import http from "http";

const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Server running...');
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});



let config: { api_id: number; api_hash: string };

try {
  config = JSON.parse(
    (await fs.readFile("./config/config.json")).toString()
  );
} catch (err) {
  console.log("Unable to load config!");
  console.error(err);
  process.exit(1);
}

let tasks: {
  name: string;
  action: string;
  chatId: Api.TypeInputNotifyPeer;
  occurances: {
    at: {
      dayOfWeek: number;
      hour: number;
      minute: number;
      second: number;
      tz: string; // Timezone e.g. UTC or UTC+2
    };
    durationSeconds: number;
  }[];
}[];
try {
  tasks = JSON.parse(
    (await fs.readFile("./config/tasks.json")).toString()
  ).tasks;
} catch (err) {
  console.log("Unable to load schedule!");
  console.error(err);
  process.exit(1);
}

/* RESUME SESSION */
let stringSession = new StringSession("");
try {
  const sessionJson = JSON.parse(
    (await fs.readFile("./config/session.json")).toString()
  );
  stringSession = new StringSession(sessionJson.stringSession);
} catch (err) {
  console.log("Unable to load existing session. Time to log in!");
}

/* ESTABLISH TELEGRAM CONNECTION */
(async () => {
  const client = new TelegramClient(
    stringSession,
    config.api_id,
    config.api_hash,
    {
      connectionRetries: 5,
    }
  );
  await client.start({
    phoneNumber: async () => await input.text("number ?"),
    password: async () => await input.password("password?"),
    phoneCode: async () => await input.text("Code ?"),
    onError: (err: any) => console.log(err),
  });
  console.log("You should now be connected.");
  await saveSession(client.session.save()!);
  console.log("Session saved");

  // await checkMuted(client, chatId);
  // await muteChat(client, chatId, 300);

  // SETUP SCHEDULE FOR THE FIRST TIME
  let scheduledJobs: (Job | null)[] = []; // Reference to scheduled Jobs, in order to cancel them all if there are changes
  scheduledJobs = restartSchedule(client, scheduledJobs, tasks);

  /* todo: learn declaration files... */

  /* web request handler */

  // jobs.forEach((job) => {
  //   const next = job.nextInvocation();
  //   console.log(`Task scheduled on: "${next}"`);
  //   // job.invoke();
  // });
})();

function restartSchedule(
  client: TelegramClient,
  jobs: (Job | null)[],
  tasks: {
    name: string;
    action: string;
    chatId: Api.TypeInputNotifyPeer;
    occurances: {
      at: {
        dayOfWeek: number;
        hour: number;
        minute: number;
        second: number;
        tz: string; // Timezone e.g. UTC or UTC+2
      };
      durationSeconds: number;
    }[];
  }[]
): (Job | null)[] {
  clearScheduledJobs(jobs);
  const scheduledJobs = startSchedule(client, tasks);
  return scheduledJobs;
}

function startSchedule(
  client: TelegramClient,
  tasks: {
    name: string;
    action: string;
    chatId: Api.TypeInputNotifyPeer;
    occurances: {
      at: {
        dayOfWeek: number;
        hour: number;
        minute: number;
        second: number;
        tz: string; // Timezone e.g. UTC or UTC+2
      };
      durationSeconds: number;
    }[];
  }[]
) {
  let scheduledJobs: (Job | null)[] = [];
  for (const task of tasks) {
    // console.log(task.name);
    // console.log(task.action);
    // console.log(task.chatId);
    for (const occurance of task.occurances) {
      // console.log(occurance.at);
      // console.log(occurance.durationSeconds);
      const res = schedule.scheduleJob(occurance.at, function () {
        muteChat(client, task.chatId, occurance.durationSeconds);
      });
      scheduledJobs.push(res);
    }
  }
  return scheduledJobs;
}

function clearScheduledJobs(scheduledJobs: (Job | null)[]) {
  for (const scheduledJob of scheduledJobs) {
    if (scheduledJob) {
      scheduledJob.cancel();
    }
  }
}

async function checkMuted(
  client: TelegramClient,
  chatId: Api.TypeInputNotifyPeer
) {
  const result = await client.invoke(
    new Api.account.GetNotifySettings({
      peer: chatId,
    })
  );
  if (result.muteUntil) {
    const until = new Date(result.muteUntil * 1000);
    const minutes = Math.floor((until.valueOf() - Date.now()) / 1000 / 60);
    console.log(`Chat muted for another ${minutes} minutes!`);
  } else {
    console.log("Chat not currently muted");
  }
}

async function muteChat(
  client: TelegramClient,
  chatId: Api.TypeInputNotifyPeer,
  durationSeconds: number
) {
  const muteUntil = parseFloat(
    ((Date.now() + durationSeconds * 1000) / 1000).toFixed(0)
  );
  const result = await client.invoke(
    new Api.account.UpdateNotifySettings({
      peer: chatId,
      settings: new Api.InputPeerNotifySettings({
        showPreviews: false,
        muteUntil: muteUntil,
      }),
    })
  );
  await checkMuted(client, chatId);
}

async function saveSession(stringSession: string) {
  const jsonString = JSON.stringify({ stringSession: stringSession });
  await fs.writeFile("./config/session.json", jsonString);
}

// const getFirstMessage = async function (client: TelegramClient) {
//   const result = await client.invoke(
//     new Api.messages.Search({
//       q: "",
//       filter: new Api.InputMessagesFilterEmpty(),
//       peer: config.chats.airdrops,
//       limit: 1,
//       fromId: config.users.max,
//       topMsgId: 0,
//     })
//   );
//   return result;
// };

// Api.Message.sear

// // binary search function to return oldest message of a user
// const getFirstMessage = async function (client, { chatId, fromUser, maxId, lastResult, lastMiss = 0, lastId, offset = 0 }) {
//     // get 3000th last message, as per telegram limit...

//     //todo: try use addOffset = lastResult.id
//     for await (const message of client.iterMessages(chatId, { fromUser: fromUser, limit: 1, addOffset: offset /*, waitTime:1*/ })) {
//         // if found, check recursively.
//         if (message.id) {
//             console.log(message.id, message.text);
//             lastId = message.id;
//             offset += 3000;
//             // make maxId half remaining messages in chat
//             // maxId = Math.floor((message.id + lastMiss) * 0.05);
//             // console.log("decrease maxId:", maxId, "gap:", message.id - lastMiss);
//             // //maxId = message.id;
//             lastResult = { id: message.id, text: message.text };
//             return await getFirstMessage(client, { chatId, fromUser, maxId, lastResult, lastMiss, lastId, offset });
//         }
//     }
//     // if our maxId offset was too low:
//     if (typeof message === "undefined") {
//         return lastResult;
//         // if (maxId == 0) {
//         //     console.log("final maxId:", maxId);
//         //     return lastResult
//         // };
//         // // increase maxId by 50% in order to find messages
//         // lastMiss = maxId;
//         // maxId = Math.floor((lastResult.id + lastMiss) * 0.5);
//         // console.log("increase maxId: ", maxId, "gap:", maxId - lastMiss);
//         // return await getFirstMessage(client, { chatId, fromUser, maxId, lastResult, lastMiss });
//     }

// }

// Api.Channel.

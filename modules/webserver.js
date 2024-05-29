const chalk = require("chalk");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
  console.log(
    chalk.greenBright("WEBSERVER INIT INFO"),
    `Current environment: ${process.env.NODE_ENV}`
  );
}

const { ApolloServer } = require("apollo-server-express");
const {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageDisabled,
} = require("apollo-server-core");

const index = require("../index.js");

const config = index.config;
const client = index.client;

const schema = require("./schema");

const express = require("express");
const app = express();
const http = require("http");
const httpServer = http.createServer(app);
const server = new ApolloServer({
  typeDefs: schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    ApolloServerPluginLandingPageDisabled(),
  ],
});
const request = require("request");
const bodyParser = require("body-parser");

const cors = require("cors");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const { RiotAPI, PlatformId } = require("@fightmegg/riot-api");
const rAPI = new RiotAPI(process.env.API_RIOT);
const { MongoClient, ServerApiVersion } = require("mongodb");
const mongoClient = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
mongoClient.connect((err) => {
  if (err) return console.log(chalk.redBright("WEBSERVER DB ERROR"), err);
  console.log(
    chalk.greenBright("WEBSERVER INIT INFO"),
    "MongoDB connection estabilished."
  );
});

const {
  PrismaClient,
  SampleCategory,
  SampleType,
  SampleGenres,
} = require("@prisma/client");
const prisma = new PrismaClient();

async function startServer() {
  await server.start();

  server.applyMiddleware({ app });

  const port = process.env.PORT || 3000;

  await new Promise((resolve) => httpServer.listen({ port: port }, resolve));

  console.log(
    chalk.green("WEBSERVER INIT INFO"),
    `Server listening at http://localhost:${port}`
  );
  console.log(
    chalk.green("GRAPHQL INIT INFO"),
    `GraphQL listening at http://localhost:${port}${server.graphqlPath}`
  );
}

startServer();

app.get("/", (req, res) => {
  return res.status(200).sendFile("./api.html", { root: __dirname });
});

app.post("/", (req, res) => {
  return res.send("POST HTTP method registered");
});

app.put("/", (req, res) => {
  return res.send("PUT HTTP method registered");
});

app.delete("/", (req, res) => {
  return res.send("DELETE HTTP method registered");
});

app.get("/update-email", async (req, res) => {
  const users = await prisma.user.findMany();

  const usersWithUppercaseEmails = users.filter(
    (user) => user.email !== user.email.toLowerCase()
  );

  console.log(
    chalk.greenBright("WEBSERVER INFO"),
    "Updating " + usersWithUppercaseEmails.length + " emails"
  );

  for (let user of usersWithUppercaseEmails) {
    console.log(
      chalk.greenBright("WEBSERVER INFO"),
      "Updating email for " + user.email
    );
    await prisma.user.update({
      where: { id: user.id },
      data: { email: user.email.toLowerCase() },
    });
  }

  res.status(200).send("Emails updated");
});

app.get("/add-subscriptions", async (req, res) => {
  console.log(
    chalk.greenBright("WEBSERVER INFO"),
    "Adding yearly subscriptions"
  );
  const members = "./yearly.json";

  const reqMembers = require(members);

  const data = reqMembers.filter(
    (member, index, self) =>
      index === self.findIndex((m) => m.email === member.email)
  );

  console.log(
    chalk.greenBright("WEBSERVER INFO"),
    "Members count: " + data.length
  );

  for (let i = 0; i < data.length; i++) {
    const timestamp = new Date(data[i].starts);
    timestamp.setFullYear(timestamp.getFullYear() + 1);
    console.log(
      chalk.greenBright("WEBSERVER INFO"),
      i + ". Updating subscription: " + data[i].email.toLowerCase()
    );

    const user = await prisma.user.findUnique({
      where: {
        email: data[i].email.toLowerCase(),
      },
    });

    if (user) {
      console.log(
        chalk.redBright("WEBSERVER INFO"),
        "User already exists, updating subscription"
      );

      await prisma.user.update({
        where: {
          email: data[i].email.toLowerCase(),
        },
        data: {
          subscription_active: true,
        },
      });
    }

    if (!user) {
      await prisma.user.create({
        data: {
          email: data[i].email.toLowerCase(),
          subscription_active: true,
        },
      });

      const subscription = await prisma.subscription.findFirst({
        where: {
          email: data[i].email.toLowerCase(),
        },
      });

      if (!subscription) {
        await prisma.subscription.create({
          data: {
            tier: "Supporter",
            name: data[i].name == "Someone" ? null : data[i].name.toString(),
            email: data[i].email.toLowerCase(),
            timestamp: timestamp,
            active: true,
            User: {
              connect: {
                email: data[i].email.toLowerCase(),
              },
            },
          },
        });
      } else {
        await prisma.subscription.update({
          where: {
            email: data[i].email.toLowerCase(),
          },
          data: {
            tier: "Supporter",
            name: data[i].name == "Someone" ? null : data[i].name.toString(),
            timestamp: timestamp,
            active: true,
          },
        });
      }
    } else {
      await prisma.user.update({
        where: {
          email: data[i].email.toLowerCase(),
        },
        data: {
          subscription_active: true,
        },
      });

      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
        },
      });

      if (!subscription) {
        await prisma.subscription.create({
          data: {
            tier: "Supporter",
            name: data[i].name == "Someone" ? null : data[i].name.toString(),
            email: data[i].email.toLowerCase(),
            timestamp: timestamp,
            active: true,
            User: {
              connect: {
                id: user.id,
              },
            },
          },
        });
      } else {
        await prisma.subscription.update({
          where: {
            userId: user.id,
          },
          data: {
            tier: "Supporter",
            name: data[i].name == "Someone" ? null : data[i].name.toString(),
            timestamp: timestamp,
            active: true,
          },
        });
      }
    }
  }
  res.status(200).send("Subscriptions added");
});

app.post("/member", async (req, res) => {
  console.log(chalk.greenBright("MEMBER INFO"), "Fetching member data");
  const id = await req.body.id;
  console.log(chalk.greenBright("MEMBER INFO"), "Member ID: " + id);

  const database = mongoClient.db("discord");
  const users = database.collection("users");

  const user = await users.findOne({
    _id: id,
  });

  if (!user) {
    console.log(chalk.redBright("MEMBER INFO"), "Member not found");
    return res
      .status(404)
      .send({ status: 404, error: "Member not found", id: id });
  }

  console.log(chalk.greenBright("MEMBER INFO"), "Member found");
  return res.status(200).send(user);
});

app.post("/messages/week", async (req, res) => {
  console.log(chalk.greenBright("MESSAGES INFO"), "Fetching messages data");
  const database = mongoClient.db("discord");
  const messages = database.collection("messages");

  const id = await req.body.id;
  console.log(chalk.greenBright("MESSAGES INFO"), "Member ID: " + id);

  const weekAgo = new Date(Date.UTC());
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);

  console.log(chalk.greenBright("MESSAGES INFO"), "Week ago: " + weekAgo);

  // Get the amount of messages from the last week from the Time-Series collection
  const messagesData = await messages
    .aggregate([
      {
        $match: {
          _id: id,
          date: { $gte: weekAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
          },
          messages: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
      {
        $group: {
          _id: id,
          totalMessages: { $sum: "$messages" },
          dailyMessages: { $push: "$$ROOT" },
        },
      },
    ])
    .toArray();

  if (!messagesData) {
    console.log(chalk.redBright("MESSAGES INFO"), "Messages not found");
    return res
      .status(404)
      .send({ status: 404, error: "Messages not found", id: id });
  }

  console.log(chalk.greenBright("MESSAGES INFO"), "Messages found");
  return res.status(200).send(messagesData);
});

app.post("/kofi", async (req, res) => {
  console.log(chalk.greenBright("KO-FI INFO"), "New webhook received");

  const data = await req.body.data;
  const parsedData = JSON.parse(data);

  const verification_token = parsedData.verification_token;
  const message_id = parsedData.message_id;
  const timestamp = parsedData.timestamp;
  const type = parsedData.type;
  const name = parsedData.from_name;
  const email = parsedData.email;
  const tier = parsedData.tier_name;

  if (verification_token != process.env.KOFI_TOKEN) {
    console.log(chalk.redBright("KO-FI ERROR"), "Unauthorized");
    return res.status(401).send("Unauthorized");
  }

  if (type !== "Subscription") {
    if (type == "Donation") {
      console.log(chalk.redBright("KO-FI INFO"), "Donation received");
      return res.status(200).send("Donation received");
    } else {
      console.log(chalk.redBright("KO-FI ERROR"), "Not a subscription");
      return res.status(400).send("Not a subscription");
    }
  } else {
    console.log(chalk.greenBright("KO-FI INFO"), "Subscription received");

    let user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email,
        },
      });
    }

    let subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!subscription) {
      console.log(chalk.greenBright("KO-FI INFO"), "New subscription");
      subscription = await prisma.subscription.create({
        data: {
          message_id: message_id,
          timestamp: timestamp,
          active: true,
          tier: tier,
          name: name,
          email: email,
          User: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          subscription_active: true,
        },
      });

      console.log(chalk.greenBright("KO-FI INFO"), "Subscription registered");
      return res.status(200).send("Subscription registered");
    } else {
      console.log(chalk.greenBright("KO-FI INFO"), "Subscription exists");
      subscription = await prisma.subscription.update({
        where: {
          userId: user.id,
        },
        data: {
          message_id: message_id,
          timestamp: timestamp,
          active: true,
          tier: tier,
          name: name,
          email: email,
        },
      });

      await prisma.user.update({
        where: {
          email: email,
        },
        data: {
          subscription_active: true,
        },
      });

      console.log(chalk.greenBright("KO-FI INFO"), "Subscription updated");
      return res.status(200).send("Subscription updated");
    }
  }
});

app.get("/upload-samples", async (req, res) => {
  const samples = "./nexus.json";
  const data = require(samples);
  console.log(
    chalk.greenBright("WEBSERVER INFO"),
    "Uploading " + data.length + " samples"
  );

  const categoryMapping = {
    "Drum Kits": SampleCategory.Drum,
    Vocals: SampleCategory.Vocals,
    "VSTs & Presets": SampleCategory.Presets,
    "Loops & Samples": SampleCategory.Loop,
    "MIDI Kits": SampleCategory.MIDI,
    "One Shots": SampleCategory.OneShot,
  };

  const genreMapping = {
    "Hip-Hop": SampleGenres.HipHop,
    Trap: SampleGenres.Trap,
    EDM: SampleGenres.EDM,
    Pop: SampleGenres.Pop,
    "R&B": SampleGenres.RnB,
    Rock: SampleGenres.Rock,
    Jazz: SampleGenres.Jazz,
    Blues: SampleGenres.Blues,
    Reggae: SampleGenres.Reggae,
    Country: SampleGenres.Country,
    Classical: SampleGenres.Classical,
    Guitar: SampleGenres.Guitar,
    Other: SampleGenres.Other,
  };

  for (let i = 0; i < data.length; i++) {
    console.log(
      chalk.greenBright("WEBSERVER INFO"),
      "Uploading sample: " + data[i].key
    );

    const mappedCategories = data[i].categories?.map(
      (category) => categoryMapping[category]
    );

    const mappedGenres =
      data[i].genres?.map((genre) => genreMapping[genre]) || [];

    // const cutOriginSize = data[i].origin?.split(" | ");
    // const origin = cutOriginSize[0];
    // const size = cutOriginSize[1];

    await prisma.sample.create({
      data: {
        key: data[i].key,
        title: data[i].title,
        image_id: data[i].image_id ? data[i].image_id : "placeholder",
        author: data[i].author,
        origin: null,
        size: data[i].size,
        categories: mappedCategories || [],
        type: SampleType.Nexus,
        download_url: data[i].url,
        genres: mappedGenres || [],
        group: data[i].type == "Nexus 3 Expansion" ? "Nexus 3" : "Nexus 4",
        note: data[i].note || null,
        description: data[i].type,
        user: {
          connect: {
            email: "alkos.yt@gmail.com",
          },
        },
      },
    });
  }
  res.status(200).send("Samples uploaded");
});

app.post("/webhook", async (req, res) => {
  const Payload = req.body;
  let embed_name;
  let webhook_response;
  res.sendStatus(200);

  if (req.get("heroku-webhook-hmac-sha256")) {
    if (Payload.action == "create") {
      embed_name = `Build creation - ${Payload.data.app.name}`;
      webhook_response = `A new buld was created for **${Payload.data.app.name}** on behalf of **${Payload.data.user.email}** with the ID **${Payload.data.id}**`;
    } else if (
      Payload.action == "update" &&
      Payload.data.status == "succeeded"
    ) {
      embed_name = `Build success - ${Payload.data.app.name}`;
      if (Payload.data.release?.version) {
        webhook_response = `Last build of **${Payload.data.app.name}** finished with status **${Payload.data.status}**, creating release version **${Payload.data.release.version}**`;
      } else {
        webhook_response = `Last build of **${Payload.data.app.name}** finished with status **${Payload.data.status}**`;
      }
    } else {
      embed_name = "Build failure";
      webhook_response = "The build **failed**, just like you.";
    }
  } else if (req.get("X-Snipcart-RequestToken")) {
    if (Payload.eventName == "order.completed") {
      embed_name = "Order received";
      webhook_response = `Order received from **${Payload.content.user.billingAddressName}** with email **${Payload.content.user.email}** \nPayment: **${Payload.content.paymentStatus}**`;
    } else {
      return;
    }
  } else if (req.get("x-amz-sns-topic-arn")) {
    embed_name = "SNS Alert";
    webhook_response =
      "SNS Alert received - One of the alarms has been triggered";
  } else if (!req.get("heroku-webhook-hmac-sha256")) {
    if (Payload.monitor) {
      embed_name = "Monitor notification";
      webhook_response = `A monitor with the ID **${Payload.id}** and name **${Payload.monitor}** sent **${Payload.type}**. Description: ${Payload.description}`;
    } else {
      return;
    }
  }

  const options = {
    method: "POST",
    url: `https://discord.com/api/webhooks/${process.env.WEBHOOK_URL}`,
    headers: {
      "Content-type": "application/json",
    },
    // Format JSON DATA
    body: JSON.stringify({
      embeds: [
        {
          color: "11801317",
          title: embed_name,
          description: webhook_response,
          footer: {
            text: "Gang Słoni",
            icon_url: "https://i.imgur.com/JRl8WjV.png",
          },
        },
      ],
    }),
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    if (response.body.statusCode == 200)
      console.log(chalk.greenBright("WEBSERVER INFO"), "Webhook: successfull");
    if (response.body.statusCode == 204)
      console.log(chalk.greenBright("WEBSERVER INFO"), "Wenhook: No content");
  });
});

app.post("/bmac", async (req, res) => {
  res.sendStatus(200);
  const Payload = req.body;
  const data = Payload.data;

  const database = mongoClient.db("main");
  const users = database.collection("users");

  if (Payload.type == "membership.started") {
    console.log(
      chalk.greenBright("NEW MEMBER UPDATE INFO"),
      "Updating flags for " + data.supporter_email
    );
    try {
      const user = await users.findOne({
        email: data.supporter_email.toLowerCase(),
      });
      if (user) {
        users.updateOne(
          { email: data.supporter_email.toLowerCase() },
          {
            $set: {
              flags: "premium",
              subscription: {
                id: data.id,
                psp_id: data.psp_id,
                name: data.supporter_name,
                status: data.status,
                start_date: data.started_at,
                current_period_end: data.current_period_end,
                current_period_start: data.current_period_start,
              },
            },
          }
        );
      } else {
        users.insertOne({
          email: data.supporter_email.toLowerCase(),
          flags: "premium",
          subscription: {
            id: data.id,
            psp_id: data.psp_id,
            name: data.supporter_name,
            status: data.status,
            start_date: data.started_at,
            current_period_end: data.current_period_end,
            current_period_start: data.current_period_start,
          },
        });
      }
    } catch (err) {
      console.log(
        chalk.redBright("NEW MEMBER UPDATE FAIL"),
        "Updating flags for " + element.payer_email + " failed"
      );
      console.error(err);
    }
  } else if (Payload.type == "membership.updated") {
    console.log(
      chalk.greenBright("MEMBER UPDATE INFO"),
      "Updating flags for " + data.supporter_email
    );
    try {
      users.updateOne(
        { email: data.supporter_email },
        {
          $set: {
            subscription: {
              id: data.id,
              psp_id: data.psp_id,
              name: data.supporter_name,
              status: data.status,
              start_date: data.started_at,
              current_period_end: data.current_period_end,
              current_period_start: data.current_period_start,
              canceled_at: data.canceled_at,
              cancel_at_period_end: data.cancel_at_period_end,
            },
          },
        }
      );
    } catch (err) {
      console.log(
        chalk.redBright("MEMBER UPDATE FAIL"),
        "Updating flags for " + element.payer_email + " failed"
      );
      console.error(err);
    }
  } else if (Payload.type == "membership.cancelled") {
    console.log(
      chalk.greenBright("MEMBER UPDATE INFO"),
      "Updating flags for " + data.supporter_email
    );
    try {
      users.updateOne(
        { email: data.supporter_email },
        {
          $set: {
            flags: "none",
            subscription: {
              id: data.id,
              psp_id: data.psp_id,
              name: data.supporter_name,
              status: data.status,
              canceled: data.canceled,
              start_date: data.started_at,
              current_period_end: data.current_period_end,
              current_period_start: data.current_period_start,
              canceled_at: data.canceled_at,
              cancel_at_period_end: data.cancel_at_period_end,
            },
          },
        }
      );
    } catch (err) {
      console.log(
        chalk.redBright("MEMBER UPDATE FAIL"),
        "Updating flags for " + element.payer_email + " failed"
      );
      console.error(err);
    }
  }
});

// API or sum idk
app.get("/fetchMembers", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  const options = {
    method: "GET",
    url: "https://developers.buymeacoffee.com/api/v1/subscriptions?status=active",
    headers: {
      "Content-type": "application/json",
      Authorization:
        "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5MTI5ZDIwMC1kYTdkLTRjY2MtOWQzZC01ODA0MTU0ZTgyMjYiLCJqdGkiOiIwNGE3ZGNlNTkyNWZkZWI4NDg4OGE3Mjg5ZjFkMDMwMTliM2FlNTVjMTA4NmQ1NjY0YjI0YzY0M2U3MjU3NTMwNjI4ZGJiNTRjMmQyZGI2NSIsImlhdCI6MTY3MjQwMjMyMSwibmJmIjoxNjcyNDAyMzIxLCJleHAiOjE2ODgxMjcxMjEsInN1YiI6IjIxODc4MzgiLCJzY29wZXMiOlsicmVhZC1vbmx5Il19.ST91EpUSgKdFvQnDPSWlE9qxRSisk8IKTYqlAmiZValV-UjJ0MI2glpBWxYnZro2nCqfQVW2ndmM_REGwxWFVVoM0RJ5aaBuFMJ1tS9JN2QgR3RKQXBrO9-N4pWXNMwFm6C5cH0t9jJqHu5X73aNO2UwnCUUnSgYHbEeVtGsqP-KiKgsYpBDmtWRhirAv3ulQt4_ZjuN7r1WGEUU5qDKSVfu4AqSMX4vBBPMkEqO4KVAlKzyyNWSNKkmeFCYdnzuwfYxyy8C_qGYZQ06KywUjD5UP9VSswPFegJNku8A-cxVdq5KA8T5-wLtKC2I_Eq_-_0gFfbJw69t5plTNYRNPi5mCgpls-gYV4JDVWfFh-EM8WiauPDOL49FBSrJ_KRzl1elYD5RPfCtJaYbyHVGt_OSSRIPkFKc1cr3ypbkzvtJ0t2QBj-La9xvEzjbSmrdsDD4jOcWPT-J7pipNeUnn7wxzNyUclrHBf7gpvyDxYxARbdQWmaFMcIVpQfcq5gVz87xlxGXtvidSuO8buNvpDpTQm4bbNBgXpw0IFrF34sytCeOfsDjWKJ3MeNPs7Hv9qiSJ0MsX-CBBWM4MP8Fx4xMv86G1EoqRKTiotisEPiZeKSZa62QjaHVw2n6sXJ4VDMyv0YOqTmJIyKzgXG8wINJjm_0Mqxl5t-JYBkKTjs",
    },
  };
  request(options, function (error, r_response) {
    if (error) throw new Error(error);
    console.log(r_response);
    const json = JSON.parse(r_response.body);
    const page_count = json.last_page;
    // eslint-disable-next-line prefer-const
    let data = json.data;
    for (let i = 0; i < page_count; i++) {
      const soptions = {
        method: "GET",
        url: `https://developers.buymeacoffee.com/api/v1/subscriptions?status=active?page=${i}`,
        headers: {
          "Content-type": "application/json",
          Authorization:
            "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5MTI5ZDIwMC1kYTdkLTRjY2MtOWQzZC01ODA0MTU0ZTgyMjYiLCJqdGkiOiIwNGE3ZGNlNTkyNWZkZWI4NDg4OGE3Mjg5ZjFkMDMwMTliM2FlNTVjMTA4NmQ1NjY0YjI0YzY0M2U3MjU3NTMwNjI4ZGJiNTRjMmQyZGI2NSIsImlhdCI6MTY3MjQwMjMyMSwibmJmIjoxNjcyNDAyMzIxLCJleHAiOjE2ODgxMjcxMjEsInN1YiI6IjIxODc4MzgiLCJzY29wZXMiOlsicmVhZC1vbmx5Il19.ST91EpUSgKdFvQnDPSWlE9qxRSisk8IKTYqlAmiZValV-UjJ0MI2glpBWxYnZro2nCqfQVW2ndmM_REGwxWFVVoM0RJ5aaBuFMJ1tS9JN2QgR3RKQXBrO9-N4pWXNMwFm6C5cH0t9jJqHu5X73aNO2UwnCUUnSgYHbEeVtGsqP-KiKgsYpBDmtWRhirAv3ulQt4_ZjuN7r1WGEUU5qDKSVfu4AqSMX4vBBPMkEqO4KVAlKzyyNWSNKkmeFCYdnzuwfYxyy8C_qGYZQ06KywUjD5UP9VSswPFegJNku8A-cxVdq5KA8T5-wLtKC2I_Eq_-_0gFfbJw69t5plTNYRNPi5mCgpls-gYV4JDVWfFh-EM8WiauPDOL49FBSrJ_KRzl1elYD5RPfCtJaYbyHVGt_OSSRIPkFKc1cr3ypbkzvtJ0t2QBj-La9xvEzjbSmrdsDD4jOcWPT-J7pipNeUnn7wxzNyUclrHBf7gpvyDxYxARbdQWmaFMcIVpQfcq5gVz87xlxGXtvidSuO8buNvpDpTQm4bbNBgXpw0IFrF34sytCeOfsDjWKJ3MeNPs7Hv9qiSJ0MsX-CBBWM4MP8Fx4xMv86G1EoqRKTiotisEPiZeKSZa62QjaHVw2n6sXJ4VDMyv0YOqTmJIyKzgXG8wINJjm_0Mqxl5t-JYBkKTjs",
        },
      };
      console.log("Fetching page " + i);
      request(soptions, function (serror, resp) {
        if (serror) throw new Error(serror);
        data.push(resp.body.data);
      });
    }
    return res.json(data);
  });
});

app.get("/memCount", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  console.log(
    chalk.greenBright("WEBSERVER INFO"),
    "Connection detected - memCount"
  );
  const guild = client.guilds.cache.get("510941195267080214");
  const memCount = guild.memberCount;
  res.json(memCount);
});

app.post("/checkBooster", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  console.log(
    chalk.greenBright("WEBSERVER INFO"),
    "Connection detected - checkBooster"
  );

  const guild = client.guilds.cache.get("943590896820162591");
  const member = guild.members.cache.get(req.body.id);

  if (!member) {
    res.status(404).send("Member not found");
  }

  if (member.roles.cache.has("988714918041767956")) {
    res.json(true);
  } else {
    res.json(false);
  }
});

app.get("/stream", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  const stream = index.stream;
  res.json(stream);
});

app.post("/sendMessage", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  const data = req.body;

  client.channels.cache.get(data.id).send(data.message);

  res.send(
    `Message registered. Content: ${data.message} | Channel ID: ${data.id}`
  );
});

app.post("/sendDM", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  const data = req.body;

  const user = client.users.cache.get(data.id);
  user.send(data.message);

  res.send(
    `Direct Message registered. Content: ${data.message} | User ID: ${data.id} | Username: ${user.username}`
  );
  client.channels.cache
    .get(config.testChannelId)
    .send(`**DM Sent** - Ariana Grande -> ${user.username}: ${data.message}`);
});

// ---------------
//	 LEAGUE RATE
// ---------------

app.post("/search", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  let region;
  const data = req.body;

  if (data.name == undefined) {
    return res.status(400).send("No name provided");
  }

  if (data.region == undefined) {
    return res.status(400).send("No region provided");
  } else if (data.region == "eune") {
    region = PlatformId.EUNE1;
  } else if (data.region == "euw") {
    region = PlatformId.EUW1;
  } else if (data.region == "na") {
    region = PlatformId.NA1;
  }

  if (data.fresh === true) {
    updateSummoner();
  }

  const db = mongoClient.db("summoners").collection(data.region);

  async function updateSummoner() {
    const summoner = await rAPI.summoner.getBySummonerName({
      region: region,
      summonerName: data.name,
    });

    console.log(chalk.greenBright("UPDATING SUMMONER"), summoner.name);

    const summonerObj = {
      name: summoner.name,
      id: summoner.id,
      accountId: summoner.accountId,
      puuid: summoner.puuid,
      profileIconId: summoner.profileIconId,
      summonerLevel: summoner.summonerLevel,
      revisionDate: summoner.revisionDate,
      refreshDate: Date.now(),
    };

    db.updateOne(
      { id: summoner.id },
      { $set: summonerObj },
      { upsert: true },
      (err, result) => {
        if (err) {
          console.log(chalk.redBright("DB ERROR"), err);
          throw err;
        }
        console.log(
          chalk.greenBright("WEBSERVER DB SUCCESS"),
          "Summoner data updated"
        );
        console.log(chalk.greenBright("WEBSERVER DB SUCCESS"), result);
      }
    );
  }

  db.findOne({ name: data.name }, async function (err, result) {
    if (err) return console.log(chalk.redBright("MONGO ERROR"), err);
    if (result == null) {
      client.channels.cache
        .get(config.testChannelId)
        .send("MongoDB 404: Summoner not found, fetching from API");
      const summoner = await rAPI.summoner.getBySummonerName({
        region: region,
        summonerName: data.name,
      });

      const summonerObj = {
        name: summoner.name,
        id: summoner.id,
        accountId: summoner.accountId,
        puuid: summoner.puuid,
        profileIconId: summoner.profileIconId,
        summonerLevel: summoner.summonerLevel,
        revisionDate: summoner.revisionDate,
        refreshDate: Date.now(),
      };

      db.insertOne(summonerObj, function (err) {
        if (err) return console.log(chalk.redBright("WEBSERVER DB ERROR"), err);
        console.log(
          chalk.greenBright("WEBSERVER DB SUCCESS"),
          "Inserted summoner into database"
        );
      });
      return res.json(summonerObj);
    } else {
      if (result.refreshDate + 259200 < Date.now()) {
        console.log(
          chalk.yellowBright("WEBSERVER DB WARNING"),
          "Summoner found in database, but is outdated, fetching from API"
        );
        console.log(chalk.bgGray("OLD REFRESH DATE"), result.refreshDate);
        console.log(chalk.bgGray("CURRENT REFRESH DATE"), Date.now());
        console.log(
          chalk.bgGray("CALCULATED REFRESH DATE"),
          result.refreshDate + 3600000 < Date.now()
        );

        updateSummoner();
      }
      return res.json(result);
    }
  });
});

app.post("/addRating", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  const data = req.body;

  if (data.puuid == undefined) {
    return res.status(400).send("No name provided");
  }
  if (data.region == undefined) {
    return res.status(400).send("No region provided");
  }

  const db = mongoClient.db("rating").collection(data.region);

  db.findOne(
    { puuid: data.puuid, author_puuid: data.author_puuid },
    async function (err, result) {
      if (err) return console.log(chalk.redBright("MONGO ERROR"), err);
      if (result != null) {
        return res.status(400).send("Rating already exists");
      }
    }
  );

  const ratingObj = {
    puuid: data.puuid,
    author_puuid: data.author_puuid,
    rating: data.rating,
    comment: data.comment ? data.comment : "",
    attachments: data.attachments ? data.attachments : [],
    submitDate: Date.now(),
  };

  db.insertOne(ratingObj, function (err) {
    if (err) return console.log(chalk.redBright("WEBSERVER DB ERROR"), err);
    console.log(
      chalk.greenBright("WEBSERVER DB SUCCESS"),
      "Inserted rating into database"
    );
    return res.status(200).send("Rating added");
  });
});

app.post("/verifyIcon", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  let region;
  const data = req.body;

  if (data.summonerName == undefined) {
    return res.status(400).send("No name provided");
  }

  if (data.summonerRegion == undefined) {
    return res.status(400).send("No region provided");
  } else if (data.summonerRegion == "eune") {
    region = PlatformId.EUNE1;
  } else if (data.summonerRegion == "euw") {
    region = PlatformId.EUW1;
  } else if (data.summonerRegion == "na") {
    region = PlatformId.NA1;
  }

  if (data.desiredIconId == undefined) {
    return res.status(400).send("No desired icon ID provided");
  }

  const summoner = await rAPI.summoner.getBySummonerName({
    region: region,
    summonerName: data.summonerName,
  });
  if (summoner.profileIconId == data.desiredIconId) {
    return res.status(200).send("Icon verified");
  } else {
    return res
      .status(400)
      .send(
        "Icon not verified. Got " +
          summoner.profileIconId +
          ", expected " +
          data.desiredIconId
      );
  }
});

// Youtube
const Notifier = require("@daangamesdg/youtube-notifications");
const { stat } = require("fs");

const notifier = new Notifier({
  hubCallback: "https://api.gangsloni.com/youtube/callback",
  middleware: true,
  secret: "gangsloni",
  path: "/youtube",
});

notifier.on("notified", (data) => {
  console.log(chalk.green("YOUTUBE INFO"), "New video: " + data.video.title);
  console.log(chalk.green("YOUTUBE INFO"), "Channel: " + data.channel.name);
  const guild = client.guilds.cache.get("943590896820162591");
  const channel = guild.channels.cache.get("943604581265461279");
  channel.send(data.video.link);
});

notifier.subscribe("mewobeats_");

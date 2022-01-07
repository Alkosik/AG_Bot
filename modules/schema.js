const { gql } = require('apollo-server');

const typeDefs = gql`
schema {
  query: Query
}

type Query {
	  userByID(id: String!): User
	  serverByID(id: String!): Server
}

type User {
	discord_id: String!
	username: String!
	discriminator: String!
	avatar_url: String!
	moderation: Int!
	xp: Int!
	level: Int!
	ganja: Boolean!
	muted: Boolean!
	warns: Int!
	nickname: String!
}

type Server {
	server_id: String!
	name: String!
	owner: String!
	owner_id: String!
	icon_url: String!
	description: String!
	member_count: Int!
	member_count_human: String!
	message_count: Int!
}	

query userByID($id: String!) {
	User(discord_id: $id) {
		username
		discriminator
		avatar_url
	}
}
`;

module.exports = typeDefs;
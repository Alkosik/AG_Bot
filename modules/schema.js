const { gql } = require('apollo-server');

const typeDefs = gql`
schema {
  query: Query
}

type Query {
	  userByID(id: String!): User
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

query userByID($id: String!) {
	User(discord_id: $id) {
		username
		discriminator
		avatar_url
	}
}
`;

module.exports = typeDefs;
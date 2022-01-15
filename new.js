// ./graphql/types/index.js
import { mergeTypes } from 'merge-graphql-schemas';
import { writeFileSync } from 'fs'

const clientType = `
type User {
  
  email: String! @unique
  username: String
  comments: [Comment!] @relation
  emojis: [Emoji!] @relation

}

type Mutation {
  register(
    email: String!, 
    password: String!
  ): User @resolver(name: "RegisterUser")
  login(
    email: String!, 
    password: String!
  ): Token @resolver(name: "LoginUser")
}

type Token @embedded {
  ttl: Time!
  secret: String!
  data: User
}
`;

const productType = `
type Speaker {
  email: String!
  firstname: String!
  lastname: String!
  picture: String
  bio: String
  talks: [Talk!] @relation
}

type Talk {
  title: String!
  description: String!
  video_url: String!
  speaker: Speaker!
  comments: [Comment!] @relation
}

type Comment @protected(membership: "User", rule: ["read", "write"]) {
  content: String!
  talk: Talk!
  user: User!
}

type Emoji @protected(membership: "User", rule: ["read", "write"]) {
  content: String!
  talk: Talk!
  user: User!
}

type User @auth(primary: "email") {
  email: String! @unique
  username: String
  comments: [Comment!] @relation
  emojis: [Emoji!] @relation
}

type Query {
  talks: [Talk] # List of talks
  speakers: [Speaker] # List of speakers
}

type Mutation {
  search(
    email: String!, 
    password: String!
  ): User @resolver(name: "Custom")
}
`;

const types = [
  clientType,
  productType,
];

// NOTE: 2nd param is optional, and defaults to false
// Only use if you have defined the same type multiple times in
// different files and wish to attempt merging them together.
const typeDefs = mergeTypes(types, { all: true });
writeFileSync('joined.graphql', typeDefs);
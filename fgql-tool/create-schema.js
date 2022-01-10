import fs from 'fs';
import { exec } from 'child_process';


const createAuthFunctions = async () => { 
  const dir = 'fauna/functions'
  if (!fs.existsSync(dir)){
    await fs.mkdirSync(dir, { recursive: true });
  }

  const content = `
  import { query as q } from "faunadb";

  export default {
    name: "LoginUser",
    body:
    q.Query(
      q.Lambda(
        ["email", "password"],
        q.Let(
          {
            credentials: q.Login(q.Match(q.Index("UserByEmail"), q.Var("email")), {
              password: q.Var("password"),
              ttl: q.TimeAdd(q.Now(), 1800, "seconds")
            })
          },
          {
            secret: q.Select("secret", q.Var("credentials")),
            ttl: q.Select("ttl", q.Var("credentials")),
            email: q.Var("email"),
          }
        )
      )
    )
  };
  `

  const register = `
    import { query as q } from "faunadb";

    export default {
      name: "RegisterUser",
      body:
      q.Query(
        q.Lambda(
          ["email", "password"],
          q.Create(q.Collection("User"), {
            credentials: { password: q.Var("password") },
            data: { email: q.Var("email")}
          })
        )
      )
    };
  `
  await fs.writeFileSync('fauna/indexes/login.js', content)
  await fs.writeFileSync('fauna/indexes/register.js', register)
}


const createAuthIndex = async () => {
  const dir = 'fauna/indexes'
  if (!fs.existsSync(dir)){
    await fs.mkdirSync(dir, { recursive: true });
  }
  const content = `
  import { query as q } from "faunadb";

  export default {
    name: "UserByEmail",
    source: q.Collection("User"),
    values: [
      { field: ["data", "email"] }
    ]
  }

`;

  await fs.writeFileSync('fauna/indexes/authindex.js', content)

}

const content = `
type Mutation {
  register(
    email: String!, 
    password: String!
  ): String @resolver(name: "RegisterUser")
  login(
    email: String!, 
    password: String!
  ): Token @resolver(name: "LoginUser")
}

type Token @embedded {
  ttl: Time!
  secret: String!
  ref: String!
}
`
const main = async () => {
  try {
    await fs.writeFileSync('fauna/schema.graphql', content)
    await createAuthIndex();
    await createAuthFunctions();
    //file written successfully
    exec('npm run fgu');

    // Create a user index

  } catch (err) {
    console.error(err)
  }
}

main();
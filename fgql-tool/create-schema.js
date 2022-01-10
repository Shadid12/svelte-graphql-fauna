import fs from 'fs';
import { exec } from 'child_process';
import gql from  'graphql-tag';



const retrieveInfo = async (fragment) => {
  let authable = [];
  if(fragment.definitions) {
    fragment.definitions.forEach(def => {
      if(def.directives && def.directives.length > 0) { 
        let authFilter = def.directives.filter(d => d.name.value === 'auth')
        authFilter.forEach(auth => { 
          authable.push({
            name: def.name.value,
            args: auth.arguments.map(a => ({ name: a.name.value, value: a.value.value })),
          })
        })
      }
    })
  }
  console.log('authable', JSON.stringify(authable))
  return authable;
}

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


const createAuthIndex = async (authables) => {
  if(authables.length > 1) { 
    console.log('Multiple Auth Models not Supported');
    return;
  }

  const authModel = authables[0];
  const primaryKey = authModel.args.find(a => a.name === 'primary');

  const dir = 'fauna/indexes'
  if (!fs.existsSync(dir)){
    await fs.mkdirSync(dir, { recursive: true });
  }
  const content = `
  import { query as q } from "faunadb";

  export default {
    name: "${authModel.name.toLowerCase()}_by_${primaryKey.value}",
    source: q.Collection("${authModel.name}"),
    values: [
      { field: ["data", "${primaryKey.value}"] }
    ]
  }

`;

  await fs.writeFileSync('fauna/indexes/authindex.js', content)

}

const createSchema = async (authables) => {
  if(authables.length > 1) { 
    console.log('Multiple Auth Models not Supported');
    return;
  }

  const authModel = authables[0];
  const primaryKey = authModel.args.find(a => a.name === 'primary');
  const content = `
type Mutation {
  register(
    ${primaryKey.value}: String!, 
    password: String!
  ): String @resolver(name: "Register${authModel.name}")
  login(
    ${primaryKey.value}: String!, 
    password: String!
  ): Token @resolver(name: "Login${authModel.name}")
}

type Token @embedded {
  ttl: Time!
  secret: String!
  ref: String!
}
  `;
  await fs.writeFileSync('fauna/schema.graphql', content)
} 


const main = async () => {
  try {
    const typeDefs = await fs.readFileSync('./schema.graphql').toString('utf-8');
    const fragment = gql`${typeDefs}`;
    const authables = await retrieveInfo(fragment);

    await createSchema(authables);

    await createAuthIndex(authables);
    // await createAuthFunctions();
    //file written successfully
    // exec('npm run fgu');

    // Create a user index

  } catch (err) {
    console.error(err)
  }
}

main();
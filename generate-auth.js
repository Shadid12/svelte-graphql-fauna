import fs from 'fs';
import { spawn } from 'child_process';
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

const createAuthFunctions = async (authables) => { 
  const dir = 'fauna/functions'
  if (!fs.existsSync(dir)){
    await fs.mkdirSync(dir, { recursive: true });
  }

  const authModel = authables[0];
  const primaryKey = authModel.args.find(a => a.name === 'primary');

  const content = `
import { query as q } from "faunadb";

export default {
  name: "Login${authModel.name}",
  body:
  q.Query(
    q.Lambda(
      ["${primaryKey.value}", "password"],
      q.Let(
        {
          credentials: q.Login(q.Match(q.Index("${authModel.name.toLowerCase()}_by_${primaryKey.value}"), q.Var("${primaryKey.value}")), {
            password: q.Var("password"),
            ttl: q.TimeAdd(q.Now(), 1800, "seconds")
          })
        },
        {
          secret: q.Select("secret", q.Var("credentials")),
          ttl: q.Select("ttl", q.Var("credentials")),
          data: q.Match(q.Index("${authModel.name.toLowerCase()}_by_${primaryKey.value}"), q.Var("${primaryKey.value}")),
        }
      )
    )
  )
};
  `

  const register = `
import { query as q } from "faunadb";

export default {
  name: "Register${authModel.name}",
  body:
  q.Query(
    q.Lambda(
      ["${primaryKey.value}", "password"],
      q.Create(q.Collection("${authModel.name}"), {
        credentials: { password: q.Var("password") },
        data: { ${primaryKey.value}: q.Var("${primaryKey.value}")}
      })
    )
  )
};
  `
  await fs.writeFileSync('fauna/functions/login.js', content)
  await fs.writeFileSync('fauna/functions/register.js', register)
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
    unique: true,
    terms: [
      {
        field: ["data", "${primaryKey.value}"]
      }
    ]
  }

`;

  await fs.writeFileSync('fauna/indexes/authindex.js', content)

}

const createSchema = async (authables, stitchType) => {
  if(authables.length > 1) { 
    console.log('Multiple Auth Models not Supported');
    return;
  }

  const dir = 'fauna'
  if (!fs.existsSync(dir)){
    await fs.mkdirSync(dir, { recursive: true });
  }

  const authModel = authables[0];
  const primaryKey = authModel.args.find(a => a.name === 'primary');
  const content = `

type ${authModel.name} {
  ${stitchType}
}

type Mutation {
  register(
    ${primaryKey.value}: String!, 
    password: String!
  ): ${authModel.name} @resolver(name: "Register${authModel.name}")
  login(
    ${primaryKey.value}: String!, 
    password: String!
  ): Token @resolver(name: "Login${authModel.name}")
}

type Token @embedded {
  ttl: Time!
  secret: String!
  data: ${authModel.name}
}
  `;
  await fs.writeFileSync('fauna/schema.graphql', content)
} 

const createAuthRoles = async (authables) => { 
  if(authables.length > 1) { 
    console.log('Multiple Auth Models not Supported');
    return;
  }

  const authModel = authables[0]
  const dir = 'fauna/roles'
  if (!fs.existsSync(dir)){
    await fs.mkdirSync(dir, { recursive: true });
  }

  const predicate = `
    const onlyDeleteByOwner = q.Query(
      q.Lambda(
        "ref",
        q.Equals(q.CurrentIdentity(), q.Select(["data", "user"], q.Get(q.Var("ref"))))
      )
    );
  `

  const privileges = `[
    {
      resource: q.Collection("${authModel.name}"),
      actions: {
        read: true,
        create: true,
        delete: onlyDeleteByOwner
      }
    }
  ],`;

  const content = `
  import { query as q } from "faunadb";
  ${predicate};
  export default {
    name: "${authModel.name}Role",
    privileges: ${privileges}
    membership: [
      {
        resource: q.Collection("${authModel.name}"),
      }
    ]
  }
  `
  await fs.writeFileSync('fauna/roles/authRole.js', content)
}


const main = async () => {
  try {
    const typeDefs = await fs.readFileSync('./schema.graphql').toString('utf-8');
    const fragment = gql`${typeDefs}`;
    const authables = await retrieveInfo(fragment);

    // Need to stytch back the auth model type
    const authModelType = typeDefs.split('@auth(')[1]
    const stitchType = authModelType.split('{')[1].split('}')[0]

    await createSchema(authables, stitchType);
    await createAuthIndex(authables);
    await createAuthFunctions(authables);

    await createAuthRoles(authables);
    //file written successfully
    const child = spawn('./node_modules/.bin/fgu');

    child.stdout.on('data', (chunk) => {
      console.log(chunk.toString());
    });
    
    child.on('close', () => {
      console.log(`Fauna GraphQL Schema Generated Successfully`);
    });

  } catch (err) {
    console.error(err)
  }
}

main();